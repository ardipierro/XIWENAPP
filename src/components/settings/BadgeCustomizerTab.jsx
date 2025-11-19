/**
 * @fileoverview Tab de configuración del sistema de badges (SOLO ADMIN)
 *
 * Permite:
 * - Ver todas las categorías de badges
 * - Editar colores de badges existentes
 * - Agregar nuevos badges custom (en categorías permitidas)
 * - Eliminar badges custom
 * - Vista previa en tiempo real
 * - Guardar/Resetear cambios
 *
 * @module components/settings/BadgeCustomizerTab
 */

import { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  Tag,
  Palette,
  RotateCcw,
  Save,
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  Check,
  X,
  Info,
  Smile,
  Box,
  EyeOff,
} from 'lucide-react';
import { BaseButton, BaseBadge, BaseInput, BaseAlert } from '../common';
import CategoryBadge from '../common/CategoryBadge';
import useBadgeConfig from '../../hooks/useBadgeConfig';
import {
  getIconLibraryConfig,
  saveIconLibraryConfig,
  MONOCHROME_PALETTES,
  COLOR_PALETTES,
} from '../../config/badgeSystem';
import IconPickerModal from './IconPickerModal';
import * as HeroIcons from '@heroicons/react/24/outline';
import logger from '../../utils/logger';

/**
 * Tab de personalización de badges (Solo Admin)
 */
function BadgeCustomizerTab({ user }) {
  const {
    config,
    iconConfig,
    globalConfig,
    hasChanges,
    categories,
    defaults,
    save,
    reset,
    discard,
    updateColor,
    updateProperty,
    addBadge,
    removeBadge,
    getBadgesByCategory,
    updateIconLibrary,
    updateMonochromePalette,
    updateMonochromeColor,
    updateGlobalConfig,
    updateAllBadgeStyles,
  } = useBadgeConfig();

  const [expandedSections, setExpandedSections] = useState({
    contentType: true,
    exerciseType: false,
    difficulty: false,
    cefr: false,
    status: false,
    theme: false,
    feature: false,
  });

  const [showAddModal, setShowAddModal] = useState(false);
  const [addModalCategory, setAddModalCategory] = useState(null);
  const [saveMessage, setSaveMessage] = useState(null);

  // Validar permisos de admin
  const isAdmin = user?.role === 'admin';

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-96">
        <BaseAlert variant="warning" title="Acceso Restringido">
          Solo los administradores pueden acceder a esta configuración.
        </BaseAlert>
      </div>
    );
  }

  // Toggle sección expandida
  const toggleSection = (sectionKey) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionKey]: !prev[sectionKey],
    }));
  };

  // Guardar configuración
  const handleSave = () => {
    const success = save();
    if (success) {
      setSaveMessage({ type: 'success', text: '✅ Configuración guardada correctamente' });
      setTimeout(() => setSaveMessage(null), 3000);
    } else {
      setSaveMessage({ type: 'error', text: '❌ Error al guardar configuración' });
      setTimeout(() => setSaveMessage(null), 3000);
    }
  };

  // Resetear a defaults
  const handleReset = () => {
    if (confirm('¿Restaurar todos los colores y badges a los valores por defecto?\n\nEsto eliminará todos los badges personalizados.')) {
      reset();
      setSaveMessage({ type: 'success', text: '✅ Configuración restaurada a valores por defecto' });
      setTimeout(() => setSaveMessage(null), 3000);
    }
  };

  // Cancelar cambios
  const handleDiscard = () => {
    if (confirm('¿Descartar todos los cambios no guardados?')) {
      discard();
      setSaveMessage({ type: 'info', text: 'ℹ️ Cambios descartados' });
      setTimeout(() => setSaveMessage(null), 3000);
    }
  };

  // Abrir modal para agregar badge
  const handleOpenAddModal = (categoryKey) => {
    setAddModalCategory(categoryKey);
    setShowAddModal(true);
  };

  // Cambiar librería de iconos
  const handleIconLibraryChange = (library) => {
    updateIconLibrary(library);
  };

  // Cambiar paleta monocromática
  const handleMonochromePaletteChange = (palette) => {
    updateMonochromePalette(palette);
  };

  // Cambiar estilo de TODOS los badges
  const handleGlobalBadgeStyleChange = (badgeStyle) => {
    updateAllBadgeStyles(badgeStyle);
    setSaveMessage({
      type: 'info',
      text: `🎨 Todos los badges cambiados a estilo: ${badgeStyle}. No olvides guardar.`,
    });
    setTimeout(() => setSaveMessage(null), 4000);
  };

  // Paletas de colores predefinidas
  const COLOR_PALETTES = {
    neutral: {
      name: 'Neutra (Apagada)',
      description: 'Colores sobrios y profesionales',
      colors: {
        success: '#4a9f7c',
        error: '#c85a54',
        warning: '#d4a574',
        info: '#5b8fa3',
        primary: '#5b6b8f',
      }
    },
    vibrant: {
      name: 'Vibrante',
      description: 'Colores brillantes y llamativos',
      colors: {
        success: '#10b981',
        error: '#ef4444',
        warning: '#f59e0b',
        info: '#06b6d4',
        primary: '#5b6b8f',
      }
    },
    monochrome: {
      name: 'Monocromática',
      description: 'Solo tonos de gris',
      colors: {
        success: '#6b7280',
        error: '#374151',
        warning: '#9ca3af',
        info: '#4b5563',
        primary: '#52525b',
      }
    }
  };

  // Aplicar paleta de colores
  const handleApplyColorPalette = (paletteKey) => {
    const palette = COLOR_PALETTES[paletteKey];
    if (!palette) return;

    // Actualizar colores de badges que usan colores semánticos
    Object.entries(config).forEach(([badgeKey, badge]) => {
      // Detectar badges que usan colores semánticos y actualizarlos
      const currentColor = badge.color;

      // Mapeo de colores vibrantes a neutros
      const colorMapping = {
        '#10b981': palette.colors.success, // success
        '#ef4444': palette.colors.error,   // error
        '#f59e0b': palette.colors.warning, // warning
        '#06b6d4': palette.colors.info,    // info
        '#5b6b8f': palette.colors.primary, // primary
        // También mapear colores antiguos
        '#5b8fa3': palette.colors.primary,
        '#16a34a': palette.colors.success,
        '#dc2626': palette.colors.error,
        '#d97706': palette.colors.warning,
      };

      if (colorMapping[currentColor]) {
        updateColor(badgeKey, colorMapping[currentColor]);
      }
    });

    setSaveMessage({
      type: 'success',
      text: `🎨 Paleta "${palette.name}" aplicada. No olvides guardar los cambios.`,
    });
    setTimeout(() => setSaveMessage(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h2 className="text-xl font-bold flex items-center gap-2"
            style={{ color: 'var(--color-text-primary)' }}
          >
            <Tag size={24} />
            Sistema de Badges
          </h2>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
            Gestiona los colores y categorías de etiquetas que se usan en toda la aplicación
          </p>
        </div>

        {/* Acciones principales */}
        <div className="flex gap-2">
          <BaseButton
            variant="ghost"
            size="sm"
            icon={X}
            onClick={handleDiscard}
            disabled={!hasChanges}
          >
            Descartar
          </BaseButton>
          <BaseButton
            variant="ghost"
            size="sm"
            icon={RotateCcw}
            onClick={handleReset}
          >
            Restaurar
          </BaseButton>
          <BaseButton
            variant="primary"
            size="sm"
            icon={Save}
            onClick={handleSave}
            disabled={!hasChanges}
          >
            Guardar Cambios
          </BaseButton>
        </div>
      </div>

      {/* Mensaje de estado */}
      {saveMessage && (
        <BaseAlert
          variant={saveMessage.type}
          dismissible
          onDismiss={() => setSaveMessage(null)}
        >
          {saveMessage.text}
        </BaseAlert>
      )}

      {/* Indicador de cambios pendientes */}
      {hasChanges && (
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg"
          style={{
            background: 'var(--color-bg-tertiary)',
            border: '1px solid var(--color-border)',
          }}
        >
          <AlertCircle size={16} style={{ color: '#f59e0b' }} />
          <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
            Tienes cambios sin guardar
          </span>
        </div>
      )}

      {/* Configuración Global Compacta */}
      <GlobalConfigPanel
        iconConfig={iconConfig}
        globalConfig={globalConfig}
        onIconLibraryChange={handleIconLibraryChange}
        onMonochromePaletteChange={handleMonochromePaletteChange}
        onMonochromeColorChange={(color) => updateMonochromeColor(color)}
        onBadgeStyleChange={handleGlobalBadgeStyleChange}
        onGlobalConfigChange={updateGlobalConfig}
      />

      {/* Selector de Paleta de Colores */}
      <div
        className="rounded-lg p-4"
        style={{
          border: '1px solid var(--color-border)',
          background: 'var(--color-bg-secondary)',
        }}
      >
        <h3
          className="text-base font-semibold mb-3 flex items-center gap-2"
          style={{ color: 'var(--color-text-primary)' }}
        >
          <Palette size={18} />
          Paleta de Colores Global
        </h3>
        <p className="text-sm mb-4" style={{ color: 'var(--color-text-secondary)' }}>
          Aplica una paleta de colores a TODOS los badges. Esto cambia los colores semánticos (success, error, warning, info).
        </p>

        <div className="flex gap-3">
          {Object.entries(COLOR_PALETTES).map(([key, palette]) => (
            <button
              key={key}
              onClick={() => handleApplyColorPalette(key)}
              className="flex-1 p-4 rounded-lg border-2 transition-all hover:scale-105"
              style={{
                borderColor: 'var(--color-border)',
                background: 'var(--color-bg-primary)',
              }}
            >
              <div className="flex flex-col items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>
                    {palette.name}
                  </span>
                </div>

                {/* Vista previa de colores */}
                <div className="flex gap-1.5 flex-wrap justify-center">
                  <div
                    className="w-8 h-8 rounded-full"
                    style={{ backgroundColor: palette.colors.success }}
                    title="Success"
                  />
                  <div
                    className="w-8 h-8 rounded-full"
                    style={{ backgroundColor: palette.colors.error }}
                    title="Error"
                  />
                  <div
                    className="w-8 h-8 rounded-full"
                    style={{ backgroundColor: palette.colors.warning }}
                    title="Warning"
                  />
                  <div
                    className="w-8 h-8 rounded-full"
                    style={{ backgroundColor: palette.colors.info }}
                    title="Info"
                  />
                  <div
                    className="w-8 h-8 rounded-full"
                    style={{ backgroundColor: palette.colors.primary }}
                    title="Primary"
                  />
                </div>

                <p className="text-xs text-center" style={{ color: 'var(--color-text-secondary)' }}>
                  {palette.description}
                </p>
              </div>
            </button>
          ))}
        </div>

        <div
          className="mt-4 p-3 rounded-lg flex items-start gap-2"
          style={{
            background: 'var(--color-bg-tertiary)',
            border: '1px solid var(--color-border)',
          }}
        >
          <Info size={16} style={{ color: 'var(--color-primary)', marginTop: '2px', flexShrink: 0 }} />
          <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            <strong>Recomendación:</strong> La paleta "Neutra (Apagada)" es ideal para un diseño minimalista y profesional. Reduce el ruido visual un 40%.
          </p>
        </div>
      </div>

      {/* Categorías de Badges */}
      <div className="space-y-4">
        {Object.entries(categories).map(([categoryKey, categoryInfo]) => {
          const categoryBadges = getBadgesByCategory(categoryKey);
          const badgeCount = Object.keys(categoryBadges).length;
          const isExpanded = expandedSections[categoryKey];

          return (
            <CategorySection
              key={categoryKey}
              categoryKey={categoryKey}
              categoryInfo={categoryInfo}
              badges={categoryBadges}
              badgeCount={badgeCount}
              isExpanded={isExpanded}
              onToggle={() => toggleSection(categoryKey)}
              onUpdateColor={updateColor}
              onUpdateProperty={updateProperty}
              onRemoveBadge={removeBadge}
              onAddBadge={() => handleOpenAddModal(categoryKey)}
            />
          );
        })}
      </div>

      {/* Vista Previa General */}
      <PreviewSection badges={config} />

      {/* Modal para agregar badge */}
      {showAddModal && (
        <AddBadgeModal
          category={addModalCategory}
          categoryInfo={categories[addModalCategory]}
          onClose={() => setShowAddModal(false)}
          onAdd={(badgeData) => {
            const key = `CUSTOM_${addModalCategory.toUpperCase()}_${Date.now()}`;
            addBadge(addModalCategory, key, badgeData);
            setShowAddModal(false);
            setSaveMessage({ type: 'success', text: `✅ Badge "${badgeData.label}" agregado` });
            setTimeout(() => setSaveMessage(null), 3000);
          }}
        />
      )}
    </div>
  );
}

// ============================================
// COMPONENTE: CategorySection
// ============================================

function CategorySection({
  categoryKey,
  categoryInfo,
  badges,
  badgeCount,
  isExpanded,
  onToggle,
  onUpdateColor,
  onUpdateProperty,
  onRemoveBadge,
  onAddBadge,
}) {
  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{
        border: '1px solid var(--color-border)',
        background: 'var(--color-bg-secondary)',
      }}
    >
      {/* Header */}
      <div
        className="px-4 py-3 flex items-center justify-between"
        style={{ background: 'var(--color-bg-tertiary)' }}
      >
        <button
          onClick={onToggle}
          className="flex-1 flex items-center gap-3 hover:opacity-80 transition-opacity text-left"
        >
          <span className="text-xl" role="img" aria-label={categoryInfo.label}>
            {categoryInfo.icon}
          </span>
          <div>
            <h3 className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              {categoryInfo.label}
            </h3>
            <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              {categoryInfo.description} • {badgeCount} badge{badgeCount !== 1 ? 's' : ''}
            </p>
          </div>
        </button>

        <div className="flex items-center gap-2">
          {categoryInfo.allowCustom && (
            <BaseButton
              variant="ghost"
              size="sm"
              icon={Plus}
              onClick={onAddBadge}
            >
              Agregar
            </BaseButton>
          )}
          <button
            onClick={onToggle}
            className="p-1 hover:opacity-70 transition-opacity"
            aria-label={isExpanded ? 'Contraer' : 'Expandir'}
          >
            {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
          </button>
        </div>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="p-4 space-y-3">
          {Object.entries(badges).map(([badgeKey, badge]) => (
            <BadgeRow
              key={badgeKey}
              badgeKey={badgeKey}
              badge={badge}
              onUpdateColor={onUpdateColor}
              onUpdateProperty={onUpdateProperty}
              onRemove={badge.custom ? onRemoveBadge : null}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================
// COMPONENTE: BadgeRow
// ============================================

function BadgeRow({ badgeKey, badge, onUpdateColor, onUpdateProperty, onRemove }) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <div
      className="rounded-lg p-3 space-y-2"
      style={{
        background: 'var(--color-bg-primary)',
        border: '1px solid var(--color-border)',
      }}
    >
      {/* Fila principal */}
      <div className="flex items-center justify-between gap-3">
        {/* Badge preview */}
        <div className="flex items-center gap-3 flex-1">
          <CategoryBadge
            badgeKey={badgeKey}
            size="md"
          />

          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                {badge.label}
              </span>
              {badge.custom && (
                <BaseBadge variant="info" size="sm">
                  Custom
                </BaseBadge>
              )}
            </div>
            {badge.description && (
              <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                {badge.description}
              </p>
            )}
          </div>
        </div>

        {/* Color picker */}
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={badge.color}
            onChange={(e) => onUpdateColor(badgeKey, e.target.value)}
            className="w-10 h-10 rounded border cursor-pointer"
            style={{ borderColor: 'var(--color-border)' }}
            title="Cambiar color"
          />

          {/* Botones de acción */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="p-2 rounded hover:opacity-70 transition-opacity"
            style={{ background: 'var(--color-bg-tertiary)' }}
            title="Opciones avanzadas"
          >
            <Info size={16} />
          </button>

          {onRemove && (
            <BaseButton
              variant="danger"
              size="sm"
              icon={Trash2}
              onClick={() => {
                if (confirm(`¿Eliminar badge "${badge.label}"?`)) {
                  onRemove(badgeKey);
                }
              }}
            />
          )}
        </div>
      </div>

      {/* Opciones avanzadas */}
      {showAdvanced && (
        <div className="pt-2 border-t space-y-2" style={{ borderColor: 'var(--color-border)' }}>
          <BaseInput
            label="Label"
            value={badge.label}
            onChange={(e) => onUpdateProperty(badgeKey, 'label', e.target.value)}
            size="sm"
          />

          {/* Selector de estilo */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
              Estilo del Badge
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => onUpdateProperty(badgeKey, 'badgeStyle', 'solid')}
                className="flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all"
                style={{
                  background: badge.badgeStyle !== 'outline' ? 'var(--color-primary)' : 'var(--color-bg-tertiary)',
                  color: badge.badgeStyle !== 'outline' ? '#ffffff' : 'var(--color-text-secondary)',
                  border: badge.badgeStyle !== 'outline' ? 'none' : '1px solid var(--color-border)'
                }}
              >
                Sólido
              </button>
              <button
                type="button"
                onClick={() => onUpdateProperty(badgeKey, 'badgeStyle', 'outline')}
                className="flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all"
                style={{
                  background: badge.badgeStyle === 'outline' ? 'var(--color-primary)' : 'var(--color-bg-tertiary)',
                  color: badge.badgeStyle === 'outline' ? '#ffffff' : 'var(--color-text-secondary)',
                  border: badge.badgeStyle === 'outline' ? 'none' : '1px solid var(--color-border)'
                }}
              >
                Contorno (Lightweight)
              </button>
            </div>
            <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
              Lightweight: fondo transparente, solo borde y texto de color
            </p>
          </div>

          <BaseInput
            label="Icono (emoji)"
            value={badge.icon || ''}
            onChange={(e) => onUpdateProperty(badgeKey, 'icon', e.target.value)}
            size="sm"
            placeholder="🎯"
            helperText="Un solo emoji monocromático"
          />
          <BaseInput
            label="Descripción"
            value={badge.description || ''}
            onChange={(e) => onUpdateProperty(badgeKey, 'description', e.target.value)}
            size="sm"
          />
        </div>
      )}
    </div>
  );
}

// ============================================
// COMPONENTE: PreviewSection
// ============================================

function PreviewSection({ badges }) {
  // Seleccionar algunos badges para preview
  const previewBadges = useMemo(() => {
    const keys = Object.keys(badges);
    return keys.slice(0, 12); // Primeros 12 badges
  }, [badges]);

  return (
    <div
      className="rounded-lg p-4"
      style={{
        border: '1px solid var(--color-border)',
        background: 'var(--color-bg-secondary)',
      }}
    >
      <h3 className="text-base font-semibold mb-3 flex items-center gap-2"
        style={{ color: 'var(--color-text-primary)' }}
      >
        <Palette size={18} />
        Vista Previa
      </h3>

      <div className="flex flex-wrap gap-2">
        {previewBadges.map((badgeKey) => {
          return (
            <CategoryBadge
              key={badgeKey}
              badgeKey={badgeKey}
              size="md"
            />
          );
        })}
      </div>
    </div>
  );
}

// ============================================
// COMPONENTE: AddBadgeModal
// ============================================

function AddBadgeModal({ category, categoryInfo, onClose, onAdd }) {
  const [formData, setFormData] = useState({
    label: '',
    icon: '',
    heroicon: '',
    description: '',
    color: '#5b8fa3',
    variant: 'primary',
  });

  const [showIconPicker, setShowIconPicker] = useState(false);
  const [iconType, setIconType] = useState('emoji'); // 'emoji' | 'heroicon'

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.label.trim()) {
      alert('El label es obligatorio');
      return;
    }
    onAdd(formData);
  };

  const handleIconSelect = (iconName) => {
    setFormData({ ...formData, heroicon: iconName });
    setShowIconPicker(false);
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{
        zIndex: 'var(--z-modal-backdrop)',
        background: 'rgba(0, 0, 0, 0.5)',
      }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl p-6"
        style={{
          background: 'var(--color-bg-secondary)',
          border: '1px solid var(--color-border)',
          zIndex: 'var(--z-modal)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>
          Agregar Badge a {categoryInfo.label}
        </h3>

        {/* Advertencia para categorías del sistema */}
        {categoryInfo.systemCategory && (
          <div
            className="mb-4 p-3 rounded-lg flex items-start gap-2"
            style={{
              background: '#fef3c7',
              border: '1px solid #f59e0b',
            }}
          >
            <AlertCircle size={16} style={{ color: '#f59e0b', marginTop: '2px' }} />
            <p className="text-sm" style={{ color: '#92400e' }}>
              {categoryInfo.warning}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <BaseInput
            label="Label *"
            value={formData.label}
            onChange={(e) => setFormData({ ...formData, label: e.target.value })}
            required
            placeholder="Ej: Deportes"
          />

          {/* Selector de tipo de icono */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
              Icono
            </label>
            <div className="flex gap-2 mb-3">
              <button
                type="button"
                onClick={() => setIconType('emoji')}
                className="flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                style={{
                  background: iconType === 'emoji' ? 'var(--color-primary)' : 'var(--color-bg-tertiary)',
                  color: iconType === 'emoji' ? '#ffffff' : 'var(--color-text-secondary)',
                }}
              >
                Emoji
              </button>
              <button
                type="button"
                onClick={() => setIconType('heroicon')}
                className="flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                style={{
                  background: iconType === 'heroicon' ? 'var(--color-primary)' : 'var(--color-bg-tertiary)',
                  color: iconType === 'heroicon' ? '#ffffff' : 'var(--color-text-secondary)',
                }}
              >
                Heroicon
              </button>
            </div>

            {iconType === 'emoji' ? (
              <BaseInput
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                placeholder="⚽"
                helperText="Un solo emoji"
              />
            ) : (
              <div>
                <button
                  type="button"
                  onClick={() => setShowIconPicker(true)}
                  className="w-full px-4 py-2 rounded-lg border text-sm font-medium transition-colors"
                  style={{
                    background: 'var(--color-bg-tertiary)',
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-text-primary)',
                  }}
                >
                  {formData.heroicon ? `Icono: ${formData.heroicon}` : 'Seleccionar Heroicon'}
                </button>
                <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                  Click para abrir galería de iconos
                </p>
              </div>
            )}
          </div>

          <BaseInput
            label="Descripción"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Opcional"
          />

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
              Color
            </label>
            <input
              type="color"
              value={formData.color}
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              className="w-full h-12 rounded cursor-pointer"
              style={{ border: '1px solid var(--color-border)' }}
            />
          </div>

          {/* Preview */}
          <div
            className="p-3 rounded-lg"
            style={{ background: 'var(--color-bg-tertiary)' }}
          >
            <p className="text-xs mb-2" style={{ color: 'var(--color-text-secondary)' }}>
              Vista Previa:
            </p>
            <BaseBadge
              variant={formData.variant}
              size="md"
              style={{
                backgroundColor: formData.color,
                color: getContrastText(formData.color),
              }}
            >
              {iconType === 'heroicon' && formData.heroicon && (() => {
                const IconComponent = HeroIcons[formData.heroicon];
                return IconComponent ? <IconComponent className="mr-1" style={{ width: '16px', height: '16px' }} /> : null;
              })()}
              {iconType === 'emoji' && formData.icon && <span className="mr-1">{formData.icon}</span>}
              {formData.label || 'Nuevo Badge'}
            </BaseBadge>
          </div>

          {/* Acciones */}
          <div className="flex gap-2 pt-2">
            <BaseButton variant="ghost" onClick={onClose} fullWidth>
              Cancelar
            </BaseButton>
            <BaseButton type="submit" variant="primary" fullWidth>
              Agregar Badge
            </BaseButton>
          </div>
        </form>

        {/* IconPicker Modal */}
        {showIconPicker && (
          <IconPickerModal
            currentIcon={formData.heroicon}
            onSelect={handleIconSelect}
            onClose={() => setShowIconPicker(false)}
          />
        )}
      </div>
    </div>
  );
}

// ============================================
// COMPONENTE: GlobalConfigPanel (Compacto)
// ============================================

function GlobalConfigPanel({
  iconConfig,
  globalConfig,
  onIconLibraryChange,
  onMonochromePaletteChange,
  onMonochromeColorChange,
  onBadgeStyleChange,
  onGlobalConfigChange,
}) {
  const [showColorPicker, setShowColorPicker] = useState(false);

  const iconLibraries = [
    { value: 'emoji', label: 'Emoji', icon: '😀', desc: 'Multicolor' },
    { value: 'heroicon', label: 'Heroicons', icon: '○', desc: 'Outline' },
    { value: 'heroicon-filled', label: 'Filled', icon: '●', desc: 'Solid' },
    { value: 'none', label: 'Sin iconos', icon: '—', desc: 'Solo texto' },
  ];

  const badgeStyles = [
    { value: 'solid', label: 'Sólido', preview: '●' },
    { value: 'outline', label: 'Contorno', preview: '○' },
    { value: 'soft', label: 'Soft', preview: '◐' },
    { value: 'glass', label: 'Glass', preview: '◇' },
    { value: 'gradient', label: 'Gradient', preview: '◆' },
  ];

  const showMonochromePalette = iconConfig.library === 'heroicon' || iconConfig.library === 'heroicon-filled';

  return (
    <div
      className="rounded-lg p-5"
      style={{
        border: '1px solid var(--color-border)',
        background: 'var(--color-bg-secondary)',
      }}
    >
      <h3
        className="text-base font-semibold mb-4 flex items-center gap-2"
        style={{ color: 'var(--color-text-primary)' }}
      >
        <Palette size={18} />
        Configuración Global de Badges
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Estilo de Iconos */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
            Estilo de Iconos
          </label>
          <div className="grid grid-cols-2 gap-2">
            {iconLibraries.map((lib) => (
              <button
                key={lib.value}
                onClick={() => onIconLibraryChange(lib.value)}
                className="p-2.5 rounded-lg border transition-all text-left hover:scale-[1.02]"
                style={{
                  borderColor: iconConfig.library === lib.value ? 'var(--color-primary)' : 'var(--color-border)',
                  background: iconConfig.library === lib.value ? 'var(--color-bg-tertiary)' : 'var(--color-bg-primary)',
                }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{lib.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>
                      {lib.label}
                    </div>
                    <div className="text-xs truncate" style={{ color: 'var(--color-text-secondary)' }}>
                      {lib.desc}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Paleta Monocromática (solo para heroicons) */}
        {showMonochromePalette && (
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
              Paleta Monocromática
            </label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(MONOCHROME_PALETTES).map(([key, palette]) => (
                <button
                  key={key}
                  onClick={() => {
                    onMonochromePaletteChange(key);
                    if (key === 'custom') {
                      setShowColorPicker(true);
                    }
                  }}
                  className="p-2.5 rounded-lg border transition-all text-left hover:scale-[1.02]"
                  style={{
                    borderColor: iconConfig.monochromePalette === key ? 'var(--color-primary)' : 'var(--color-border)',
                    background: iconConfig.monochromePalette === key ? 'var(--color-bg-tertiary)' : 'var(--color-bg-primary)',
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{palette.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>
                        {palette.label}
                      </div>
                      <div className="text-xs truncate" style={{ color: 'var(--color-text-secondary)' }}>
                        {palette.description}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Color picker para paleta custom */}
            {iconConfig.monochromePalette === 'custom' && showColorPicker && (
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="color"
                  value={iconConfig.monochromeColor || '#000000'}
                  onChange={(e) => onMonochromeColorChange(e.target.value)}
                  className="w-12 h-8 rounded cursor-pointer"
                  style={{ border: '1px solid var(--color-border)' }}
                />
                <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  Color personalizado
                </span>
              </div>
            )}
          </div>
        )}

        {/* Estilo Global de Badges */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
            Estilo Global de Badges
          </label>
          <div className="grid grid-cols-3 gap-2">
            {badgeStyles.map((style) => (
              <button
                key={style.value}
                onClick={() => onBadgeStyleChange(style.value)}
                className="p-2.5 rounded-lg border transition-all hover:scale-[1.02]"
                style={{
                  borderColor: 'var(--color-border)',
                  background: 'var(--color-bg-primary)',
                }}
              >
                <div className="flex flex-col items-center gap-1">
                  <span className="text-2xl">{style.preview}</span>
                  <span className="text-xs font-medium text-center" style={{ color: 'var(--color-text-primary)' }}>
                    {style.label}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Paleta de Colores Global */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
            Paleta de Colores Global
          </label>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(COLOR_PALETTES).map(([key, palette]) => (
              <button
                key={key}
                onClick={() => onGlobalConfigChange('colorPalette', key)}
                className="p-2.5 rounded-lg border transition-all text-left hover:scale-[1.02]"
                style={{
                  borderColor: globalConfig.colorPalette === key ? 'var(--color-primary)' : 'var(--color-border)',
                  background: globalConfig.colorPalette === key ? 'var(--color-bg-tertiary)' : 'var(--color-bg-primary)',
                }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{palette.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>
                      {palette.label}
                    </div>
                    <div className="text-xs truncate" style={{ color: 'var(--color-text-secondary)' }}>
                      {palette.description}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Opciones Adicionales */}
      <div className="mt-5 pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
        <details>
          <summary className="text-sm font-medium cursor-pointer mb-3" style={{ color: 'var(--color-text-primary)' }}>
            Opciones Avanzadas
          </summary>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
            {/* Tamaño */}
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                Tamaño
              </label>
              <select
                value={globalConfig.size}
                onChange={(e) => onGlobalConfigChange('size', e.target.value)}
                className="w-full px-2 py-1.5 rounded text-sm"
                style={{
                  background: 'var(--color-bg-primary)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text-primary)',
                }}
              >
                <option value="xs">XS</option>
                <option value="sm">SM</option>
                <option value="md">MD</option>
                <option value="lg">LG</option>
                <option value="xl">XL</option>
              </select>
            </div>

            {/* Border Radius */}
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                Bordes
              </label>
              <select
                value={globalConfig.borderRadius}
                onChange={(e) => onGlobalConfigChange('borderRadius', e.target.value)}
                className="w-full px-2 py-1.5 rounded text-sm"
                style={{
                  background: 'var(--color-bg-primary)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text-primary)',
                }}
              >
                <option value="sharp">Sharp</option>
                <option value="rounded">Rounded</option>
                <option value="pill">Pill</option>
              </select>
            </div>

            {/* Font Weight */}
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                Peso Fuente
              </label>
              <select
                value={globalConfig.fontWeight}
                onChange={(e) => onGlobalConfigChange('fontWeight', e.target.value)}
                className="w-full px-2 py-1.5 rounded text-sm"
                style={{
                  background: 'var(--color-bg-primary)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text-primary)',
                }}
              >
                <option value="normal">Normal</option>
                <option value="medium">Medium</option>
                <option value="semibold">Semibold</option>
                <option value="bold">Bold</option>
              </select>
            </div>

            {/* Spacing */}
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                Espaciado
              </label>
              <select
                value={globalConfig.spacing}
                onChange={(e) => onGlobalConfigChange('spacing', e.target.value)}
                className="w-full px-2 py-1.5 rounded text-sm"
                style={{
                  background: 'var(--color-bg-primary)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text-primary)',
                }}
              >
                <option value="compact">Compact</option>
                <option value="normal">Normal</option>
                <option value="relaxed">Relaxed</option>
              </select>
            </div>
          </div>
        </details>
      </div>

      {/* Tip */}
      <div
        className="mt-4 p-3 rounded-lg flex items-start gap-2"
        style={{
          background: 'var(--color-bg-tertiary)',
          border: '1px solid var(--color-border)',
        }}
      >
        <Info size={14} style={{ color: 'var(--color-primary)', marginTop: '2px', flexShrink: 0 }} />
        <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
          <strong>Tip:</strong> Los cambios globales afectan a TODOS los badges. Puedes ajustar badges individuales en las secciones de abajo.
        </p>
      </div>
    </div>
  );
}

// ============================================
// HELPERS
// ============================================

function getContrastText(bgColor) {
  const rgb = hexToRgb(bgColor);
  if (!rgb) return '#ffffff';
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  return luminance > 0.5 ? '#000000' : '#ffffff';
}

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

export default BadgeCustomizerTab;
