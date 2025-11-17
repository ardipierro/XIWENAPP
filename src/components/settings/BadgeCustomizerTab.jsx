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
import useBadgeConfig from '../../hooks/useBadgeConfig';
import {
  getIconLibraryConfig,
  saveIconLibraryConfig,
} from '../../config/badgeSystem';
import IconPickerModal from './IconPickerModal';
import logger from '../../utils/logger';

/**
 * Tab de personalización de badges (Solo Admin)
 */
function BadgeCustomizerTab({ user }) {
  const {
    config,
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

  // Configuración de librería de iconos
  const [iconLibraryConfig, setIconLibraryConfig] = useState(
    getIconLibraryConfig()
  );

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
    const newConfig = { ...iconLibraryConfig, library };
    setIconLibraryConfig(newConfig);
    saveIconLibraryConfig(newConfig);
    setSaveMessage({
      type: 'success',
      text: `✅ Estilo de iconos cambiado a: ${
        library === 'emoji' ? 'Emoji' : library === 'heroicon' ? 'Heroicons' : 'Sin iconos'
      }`,
    });
    setTimeout(() => setSaveMessage(null), 3000);
    // Forzar re-render de badges
    window.dispatchEvent(new Event('storage'));
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

      {/* Selector de Estilo de Iconos */}
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
          Estilo de Iconos
        </h3>
        <p className="text-sm mb-4" style={{ color: 'var(--color-text-secondary)' }}>
          Selecciona cómo quieres que se muestren los iconos en todos los badges
        </p>

        <div className="flex gap-3">
          <button
            onClick={() => handleIconLibraryChange('emoji')}
            className="flex-1 p-4 rounded-lg border-2 transition-all hover:scale-105"
            style={{
              borderColor:
                iconLibraryConfig.library === 'emoji'
                  ? 'var(--color-primary)'
                  : 'var(--color-border)',
              background:
                iconLibraryConfig.library === 'emoji'
                  ? 'var(--color-bg-tertiary)'
                  : 'var(--color-bg-primary)',
            }}
          >
            <div className="flex flex-col items-center gap-2">
              <Smile
                size={24}
                style={{
                  color:
                    iconLibraryConfig.library === 'emoji'
                      ? 'var(--color-primary)'
                      : 'var(--color-text-secondary)',
                }}
              />
              <span
                className="font-medium"
                style={{
                  color:
                    iconLibraryConfig.library === 'emoji'
                      ? 'var(--color-primary)'
                      : 'var(--color-text-primary)',
                }}
              >
                Emoji
              </span>
              <span
                className="text-xs text-center"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                Iconos multicolor (actual)
              </span>
            </div>
          </button>

          <button
            onClick={() => handleIconLibraryChange('heroicon')}
            className="flex-1 p-4 rounded-lg border-2 transition-all hover:scale-105"
            style={{
              borderColor:
                iconLibraryConfig.library === 'heroicon'
                  ? 'var(--color-primary)'
                  : 'var(--color-border)',
              background:
                iconLibraryConfig.library === 'heroicon'
                  ? 'var(--color-bg-tertiary)'
                  : 'var(--color-bg-primary)',
            }}
          >
            <div className="flex flex-col items-center gap-2">
              <Box
                size={24}
                style={{
                  color:
                    iconLibraryConfig.library === 'heroicon'
                      ? 'var(--color-primary)'
                      : 'var(--color-text-secondary)',
                }}
              />
              <span
                className="font-medium"
                style={{
                  color:
                    iconLibraryConfig.library === 'heroicon'
                      ? 'var(--color-primary)'
                      : 'var(--color-text-primary)',
                }}
              >
                Heroicons
              </span>
              <span
                className="text-xs text-center"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                Iconos monocromáticos
              </span>
            </div>
          </button>

          <button
            onClick={() => handleIconLibraryChange('none')}
            className="flex-1 p-4 rounded-lg border-2 transition-all hover:scale-105"
            style={{
              borderColor:
                iconLibraryConfig.library === 'none'
                  ? 'var(--color-primary)'
                  : 'var(--color-border)',
              background:
                iconLibraryConfig.library === 'none'
                  ? 'var(--color-bg-tertiary)'
                  : 'var(--color-bg-primary)',
            }}
          >
            <div className="flex flex-col items-center gap-2">
              <EyeOff
                size={24}
                style={{
                  color:
                    iconLibraryConfig.library === 'none'
                      ? 'var(--color-primary)'
                      : 'var(--color-text-secondary)',
                }}
              />
              <span
                className="font-medium"
                style={{
                  color:
                    iconLibraryConfig.library === 'none'
                      ? 'var(--color-primary)'
                      : 'var(--color-text-primary)',
                }}
              >
                Sin Iconos
              </span>
              <span
                className="text-xs text-center"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                Solo texto
              </span>
            </div>
          </button>
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
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center justify-between hover:opacity-80 transition-opacity"
        style={{ background: 'var(--color-bg-tertiary)' }}
      >
        <div className="flex items-center gap-3">
          <span className="text-xl" role="img" aria-label={categoryInfo.label}>
            {categoryInfo.icon}
          </span>
          <div className="text-left">
            <h3 className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              {categoryInfo.label}
            </h3>
            <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              {categoryInfo.description} • {badgeCount} badge{badgeCount !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {categoryInfo.allowCustom && (
            <BaseButton
              variant="ghost"
              size="sm"
              icon={Plus}
              onClick={(e) => {
                e.stopPropagation();
                onAddBadge();
              }}
            >
              Agregar
            </BaseButton>
          )}
          {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
        </div>
      </button>

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
          <BaseBadge
            variant={badge.variant}
            size="md"
            style={{
              backgroundColor: badge.color,
              color: getContrastText(badge.color),
            }}
          >
            {badge.icon && <span className="mr-1">{badge.icon}</span>}
            {badge.label}
          </BaseBadge>

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
          const badge = badges[badgeKey];
          return (
            <BaseBadge
              key={badgeKey}
              variant={badge.variant}
              size="md"
              style={{
                backgroundColor: badge.color,
                color: getContrastText(badge.color),
              }}
            >
              {badge.icon && <span className="mr-1">{badge.icon}</span>}
              {badge.label}
            </BaseBadge>
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
    color: '#3b82f6',
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
              {formData.icon && <span className="mr-1">{formData.icon}</span>}
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
