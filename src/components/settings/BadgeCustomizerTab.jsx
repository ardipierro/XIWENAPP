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

import { useState, useEffect, useMemo } from 'react';
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
  getBadgeByKey,
  getBadgeSizeClasses,
  getBadgeIconSize,
  getBadgeTextColor,
  getContrastText,
  getBadgeStyles,
} from '../../config/badgeSystem';
import IconPickerModal from './IconPickerModal';
import * as HeroIcons from '@heroicons/react/24/outline';
import * as HeroIconsSolid from '@heroicons/react/24/solid';
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
    role: false,
    homework_status: false,
    gamification: false,
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

      {/* Vista Previa (ARRIBA DE TODO) */}
      <PreviewSection badges={config} iconConfig={iconConfig} globalConfig={globalConfig} />

      {/* Configuración Global Rediseñada */}
      <GlobalConfigPanel
        iconConfig={iconConfig}
        globalConfig={globalConfig}
        config={config}
        onIconLibraryChange={(lib) => updateIconLibrary(lib)}
        onMonochromePaletteChange={(p) => updateMonochromePalette(p)}
        onMonochromeColorChange={(c) => updateMonochromeColor(c)}
        onBadgeStyleChange={(s) => updateAllBadgeStyles(s)}
        onGlobalConfigChange={(k, v) => updateGlobalConfig(k, v)}
      />

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

  // Valores por defecto para las nuevas propiedades
  const isEnabled = badge.enabled !== false;
  const showsIcon = badge.showIcon !== false;
  const showsBackground = badge.showBackground !== false;

  return (
    <div
      className="rounded-lg p-3 space-y-2"
      style={{
        background: 'var(--color-bg-primary)',
        border: '1px solid var(--color-border)',
        opacity: isEnabled ? 1 : 0.5,
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
              {!isEnabled && (
                <BaseBadge variant="default" size="sm">
                  Oculto
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
            disabled={!isEnabled}
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
        <div className="pt-2 border-t space-y-3" style={{ borderColor: 'var(--color-border)' }}>
          {/* Toggles de visualización */}
          <div className="grid grid-cols-3 gap-2">
            {/* Toggle Habilitar/Deshabilitar (movido aquí) */}
            <button
              type="button"
              onClick={() => onUpdateProperty(badgeKey, 'enabled', !isEnabled)}
              className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                background: isEnabled ? 'var(--color-success, #10b981)' : 'var(--color-bg-tertiary)',
                color: isEnabled ? '#ffffff' : 'var(--color-text-secondary)',
                border: '1px solid var(--color-border)',
              }}
              title={isEnabled ? 'Click para ocultar este badge en toda la app' : 'Click para mostrar este badge'}
            >
              {isEnabled ? <Check size={14} /> : <EyeOff size={14} />}
              {isEnabled ? 'Visible' : 'Oculto'}
            </button>

            {/* Toggle Mostrar Icono */}
            <button
              type="button"
              onClick={() => onUpdateProperty(badgeKey, 'showIcon', !showsIcon)}
              className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                background: showsIcon ? 'var(--color-primary)' : 'var(--color-bg-tertiary)',
                color: showsIcon ? '#ffffff' : 'var(--color-text-secondary)',
                border: '1px solid var(--color-border)',
              }}
            >
              <Smile size={14} />
              {showsIcon ? 'Con Icono' : 'Sin Icono'}
            </button>

            {/* Toggle Mostrar Fondo */}
            <button
              type="button"
              onClick={() => onUpdateProperty(badgeKey, 'showBackground', !showsBackground)}
              className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                background: showsBackground ? 'var(--color-primary)' : 'var(--color-bg-tertiary)',
                color: showsBackground ? '#ffffff' : 'var(--color-text-secondary)',
                border: '1px solid var(--color-border)',
              }}
            >
              <Box size={14} />
              {showsBackground ? 'Con Fondo' : 'Sin Fondo'}
            </button>
          </div>
          <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            Oculto = no se muestra en la app • Sin Fondo = solo texto coloreado
          </p>

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
// COMPONENTE: PreviewSection (ARRIBA DE TODO)
// ============================================

function PreviewSection({ badges, iconConfig, globalConfig }) {
  const [key, setKey] = useState(0);

  // Forzar actualización cuando cambie iconConfig o globalConfig
  useEffect(() => {
    setKey(k => k + 1);
  }, [iconConfig, globalConfig]);

  // CRÍTICO: Forzar actualización cuando cambien los badges (colores, paleta, etc.)
  useEffect(() => {
    setKey(k => k + 1);
  }, [badges]);

  // Escuchar evento de cambio de configuración para forzar re-render
  useEffect(() => {
    const handleConfigChange = () => {
      setKey(k => k + 1);
    };
    window.addEventListener('xiwen_badge_config_changed', handleConfigChange);
    return () => window.removeEventListener('xiwen_badge_config_changed', handleConfigChange);
  }, []);

  // Seleccionar badges variados para preview
  const previewBadges = useMemo(() => {
    const keys = Object.keys(badges);
    return keys.slice(0, 16); // Primeros 16 badges
  }, [badges]);

  /**
   * Renderiza el icono del badge según configuración global
   */
  const renderBadgeIcon = (badgeKey, fallbackEmoji, textColor) => {
    const library = iconConfig.library || 'emoji';
    const iconSize = getBadgeIconSize();

    if (library === 'none') return null;

    if (library === 'heroicon' || library === 'heroicon-filled') {
      const badgeConfig = getBadgeByKey(badgeKey);
      const iconName = badgeConfig?.heroicon;

      if (iconName) {
        const IconComponent = library === 'heroicon-filled'
          ? HeroIconsSolid[iconName]
          : HeroIcons[iconName];

        if (IconComponent) {
          return <IconComponent style={{ width: iconSize, height: iconSize, marginRight: '4px', color: textColor }} />;
        }
      }
    }

    return <span style={{ marginRight: '4px' }}>{fallbackEmoji}</span>;
  };

  return (
    <div
      className="rounded-lg p-3"
      style={{
        border: '2px solid var(--color-primary)',
        background: 'var(--color-bg-secondary)',
      }}
    >
      <h3 className="text-sm font-semibold mb-2 flex items-center gap-2"
        style={{ color: 'var(--color-text-primary)' }}
      >
        <Palette size={16} />
        Vista Previa en Tiempo Real
        <span className="text-xs font-normal ml-auto" style={{ color: 'var(--color-text-secondary)' }}>
          {iconConfig.library === 'heroicon' || iconConfig.library === 'heroicon-filled'
            ? `Paleta: ${MONOCHROME_PALETTES[iconConfig.monochromePalette]?.label || 'Vibrante'}`
            : `Iconos: ${iconConfig.library === 'emoji' ? 'Emojis' : iconConfig.library === 'none' ? 'Sin iconos' : iconConfig.library}`}
          {' • '}
          Tamaño: {globalConfig.size?.toUpperCase() || 'MD'}
        </span>
      </h3>

      <div className="flex flex-wrap gap-2">
        {previewBadges.map((badgeKey, index) => {
          const badgeConfig = badges[badgeKey];
          const bgColor = badgeConfig?.color || '#6b7280';
          const badgeStyles = getBadgeStyles(bgColor);

          return (
            <span
              key={`preview-${badgeKey}-${key}-${index}`}
              className={`inline-flex items-center gap-1 ${getBadgeSizeClasses()} rounded-full font-semibold shadow-lg backdrop-blur-sm`}
              style={badgeStyles}
            >
              {renderBadgeIcon(badgeKey, badgeConfig?.icon || '•', badgeStyles.color)}
              {badgeConfig?.label || badgeKey}
            </span>
          );
        })}
      </div>
    </div>
  );
}

// ============================================
// COMPONENTE: GlobalConfigPanel (REDISEÑADO COMPLETAMENTE)
// ============================================

function GlobalConfigPanel({
  iconConfig,
  globalConfig,
  config,
  onIconLibraryChange,
  onMonochromePaletteChange,
  onMonochromeColorChange,
  onBadgeStyleChange,
  onGlobalConfigChange,
}) {
  const [showColorPicker, setShowColorPicker] = useState(false);

  const showMonochromePalette = iconConfig.library === 'heroicon' || iconConfig.library === 'heroicon-filled';

  // Detectar estilo más común en badges
  const getCurrentBadgeStyle = () => {
    const styles = Object.values(config).map(b => b.badgeStyle || 'solid');
    const counts = styles.reduce((acc, s) => ({ ...acc, [s]: (acc[s] || 0) + 1 }), {});
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'solid';
  };

  const currentStyle = getCurrentBadgeStyle();

  return (
    <div
      className="rounded-lg p-4 space-y-4"
      style={{
        border: '1px solid var(--color-border)',
        background: 'var(--color-bg-secondary)',
      }}
    >
      <h3 className="text-base font-semibold flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
        <Palette size={18} />
        Configuración Global
      </h3>

      {/* FILA 1: TIPO DE ICONOS (con previews) */}
      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
          Tipo de Iconos
        </label>
        <p className="text-xs mb-2" style={{ color: 'var(--color-text-secondary)' }}>
          Selecciona qué tipo de iconos usar en todos los badges
        </p>
        <div className="grid grid-cols-4 gap-2">
          <button
            onClick={() => onIconLibraryChange('emoji')}
            className="p-3 rounded-lg border-2 transition-all"
            style={{
              borderColor: iconConfig.library === 'emoji' ? 'var(--color-primary)' : 'var(--color-border)',
              background: iconConfig.library === 'emoji' ? 'rgba(var(--color-primary-rgb), 0.1)' : 'var(--color-bg-primary)',
            }}
          >
            <div className="text-center">
              <div className="text-2xl mb-1">😀</div>
              <div className="text-xs font-medium" style={{ color: 'var(--color-text-primary)' }}>Emoji</div>
              <div className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>Multicolor</div>
            </div>
          </button>

          <button
            onClick={() => onIconLibraryChange('heroicon')}
            className="p-3 rounded-lg border-2 transition-all"
            style={{
              borderColor: iconConfig.library === 'heroicon' ? 'var(--color-primary)' : 'var(--color-border)',
              background: iconConfig.library === 'heroicon' ? 'rgba(var(--color-primary-rgb), 0.1)' : 'var(--color-bg-primary)',
            }}
          >
            <div className="text-center">
              <div className="text-2xl mb-1">○</div>
              <div className="text-xs font-medium" style={{ color: 'var(--color-text-primary)' }}>Heroicons</div>
              <div className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>Outline</div>
            </div>
          </button>

          <button
            onClick={() => onIconLibraryChange('heroicon-filled')}
            className="p-3 rounded-lg border-2 transition-all"
            style={{
              borderColor: iconConfig.library === 'heroicon-filled' ? 'var(--color-primary)' : 'var(--color-border)',
              background: iconConfig.library === 'heroicon-filled' ? 'rgba(var(--color-primary-rgb), 0.1)' : 'var(--color-bg-primary)',
            }}
          >
            <div className="text-center">
              <div className="text-2xl mb-1">●</div>
              <div className="text-xs font-medium" style={{ color: 'var(--color-text-primary)' }}>Filled</div>
              <div className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>Sólido</div>
            </div>
          </button>

          <button
            onClick={() => onIconLibraryChange('none')}
            className="p-3 rounded-lg border-2 transition-all"
            style={{
              borderColor: iconConfig.library === 'none' ? 'var(--color-primary)' : 'var(--color-border)',
              background: iconConfig.library === 'none' ? 'rgba(var(--color-primary-rgb), 0.1)' : 'var(--color-bg-primary)',
            }}
          >
            <div className="text-center">
              <div className="text-2xl mb-1">—</div>
              <div className="text-xs font-medium" style={{ color: 'var(--color-text-primary)' }}>Sin iconos</div>
              <div className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>Solo texto</div>
            </div>
          </button>
        </div>
      </div>

      {/* FILA 2: PALETA MONOCROMÁTICA (solo si heroicons, con previews) */}
      {showMonochromePalette && (
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
            Color de Iconos Monocromáticos
          </label>
          <p className="text-xs mb-2" style={{ color: 'var(--color-text-secondary)' }}>
            Cambia el color de TODOS los iconos Heroicons
          </p>
          <div className="grid grid-cols-5 gap-2">
            {Object.entries(MONOCHROME_PALETTES).map(([key, palette]) => (
              <button
                key={key}
                onClick={() => {
                  onMonochromePaletteChange(key);
                  if (key === 'custom') setShowColorPicker(true);
                }}
                className="p-3 rounded-lg border-2 transition-all"
                style={{
                  borderColor: iconConfig.monochromePalette === key ? 'var(--color-primary)' : 'var(--color-border)',
                  background: iconConfig.monochromePalette === key ? 'rgba(var(--color-primary-rgb), 0.1)' : 'var(--color-bg-primary)',
                }}
              >
                <div className="text-center">
                  <div className="text-2xl mb-1">{palette.icon}</div>
                  <div className="text-xs font-medium" style={{ color: 'var(--color-text-primary)' }}>{palette.label}</div>
                  <div className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>{palette.description}</div>
                </div>
              </button>
            ))}
          </div>
          {iconConfig.monochromePalette === 'custom' && showColorPicker && (
            <div className="mt-2 flex items-center gap-2 p-2 rounded" style={{ background: 'var(--color-bg-tertiary)' }}>
              <input
                type="color"
                value={iconConfig.monochromeColor || '#000000'}
                onChange={(e) => onMonochromeColorChange(e.target.value)}
                className="w-10 h-8 rounded cursor-pointer"
                style={{ border: '1px solid var(--color-border)' }}
              />
              <span className="text-sm" style={{ color: 'var(--color-text-primary)' }}>
                Color personalizado: <code className="px-2 py-0.5 rounded text-xs" style={{ background: 'var(--color-bg-primary)' }}>{iconConfig.monochromeColor || '#000000'}</code>
              </span>
            </div>
          )}
        </div>
      )}

      {/* FILA 3: ESTILO DE BADGES (con previews) */}
      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
          Estilo de Badges
        </label>
        <p className="text-xs mb-2" style={{ color: 'var(--color-text-secondary)' }}>
          Cambia cómo se ven TODOS los badges (puedes cambiar individuales después)
        </p>
        <div className="grid grid-cols-5 gap-2">
          {[
            { value: 'solid', label: 'Sólido', icon: '●', desc: 'Fondo color' },
            { value: 'outline', label: 'Contorno', icon: '○', desc: 'Solo borde' },
            { value: 'soft', label: 'Soft', icon: '◐', desc: 'Suave' },
            { value: 'glass', label: 'Glass', icon: '◇', desc: 'Cristal' },
            { value: 'gradient', label: 'Gradient', icon: '◆', desc: 'Degradado' },
          ].map((style) => (
            <button
              key={style.value}
              onClick={() => onBadgeStyleChange(style.value)}
              className="p-3 rounded-lg border-2 transition-all"
              style={{
                borderColor: currentStyle === style.value ? 'var(--color-primary)' : 'var(--color-border)',
                background: currentStyle === style.value ? 'rgba(var(--color-primary-rgb), 0.1)' : 'var(--color-bg-primary)',
              }}
            >
              <div className="text-center">
                <div className="text-2xl mb-1">{style.icon}</div>
                <div className="text-xs font-medium" style={{ color: 'var(--color-text-primary)' }}>{style.label}</div>
                <div className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>{style.desc}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* FILA 4: PALETA DE COLORES GLOBAL (con previews de colores) */}
      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
          Paleta de Colores Global
        </label>
        <p className="text-xs mb-2" style={{ color: 'var(--color-text-secondary)' }}>
          Cambia los COLORES de todos los badges usando una paleta predefinida
        </p>
        <div className="grid grid-cols-5 gap-2">
          {Object.entries(COLOR_PALETTES).map(([key, palette]) => (
            <button
              key={key}
              onClick={() => onGlobalConfigChange('colorPalette', key)}
              className="p-3 rounded-lg border-2 transition-all"
              style={{
                borderColor: globalConfig.colorPalette === key ? 'var(--color-primary)' : 'var(--color-border)',
                background: globalConfig.colorPalette === key ? 'rgba(var(--color-primary-rgb), 0.1)' : 'var(--color-bg-primary)',
              }}
            >
              <div className="text-center">
                <div className="text-2xl mb-1">{palette.icon}</div>
                <div className="text-xs font-medium mb-1" style={{ color: 'var(--color-text-primary)' }}>{palette.label}</div>
                {palette.colors && (
                  <div className="flex gap-1 justify-center mb-1">
                    {Object.values(palette.colors).slice(0, 4).map((color, i) => (
                      <div key={i} className="w-3 h-3 rounded-full" style={{ background: color }} />
                    ))}
                  </div>
                )}
                <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{palette.description}</div>
              </div>
            </button>
          ))}
        </div>

        {/* Selector de color monocromático (solo si paleta monocromática está seleccionada) */}
        {globalConfig.colorPalette === 'monochrome' && (
          <div className="mt-3 p-3 rounded-lg" style={{ background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border)' }}>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
              Color Monocromático
            </label>
            <p className="text-xs mb-2" style={{ color: 'var(--color-text-secondary)' }}>
              Este color se aplicará a TODOS los badges
            </p>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={globalConfig.monochromeColor || '#5b8fa3'}
                onChange={(e) => onGlobalConfigChange('monochromeColor', e.target.value)}
                className="w-16 h-10 rounded cursor-pointer"
                style={{ border: '2px solid var(--color-border)' }}
              />
              <div className="flex-1">
                <code className="px-3 py-1.5 rounded text-sm font-mono" style={{ background: 'var(--color-bg-primary)', color: 'var(--color-text-primary)' }}>
                  {globalConfig.monochromeColor || '#5b8fa3'}
                </code>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* FILA 5: OPCIONES AVANZADAS (horizontal) */}
      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
          Opciones Avanzadas
        </label>
        <div className="grid grid-cols-4 gap-2">
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Tamaño Global</label>
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
              <option value="xs">Extra Small</option>
              <option value="sm">Small</option>
              <option value="md">Medium</option>
              <option value="lg">Large</option>
              <option value="xl">Extra Large</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Bordes</label>
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
              <option value="sharp">Sharp (cuadrado)</option>
              <option value="rounded">Rounded (redondeado)</option>
              <option value="pill">Pill (cápsula)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Peso de Fuente</label>
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

          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Espaciado</label>
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
              <option value="compact">Compact (compacto)</option>
              <option value="normal">Normal</option>
              <option value="relaxed">Relaxed (relajado)</option>
            </select>
          </div>
        </div>
      </div>

      {/* COLOR DE FUENTE */}
      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
          Color de Fuente
        </label>
        <div className="flex items-center gap-3 flex-wrap">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="textColor"
              value="auto"
              checked={globalConfig.textColor === 'auto' || !globalConfig.textColor}
              onChange={() => onGlobalConfigChange('textColor', 'auto')}
            />
            <span className="text-sm" style={{ color: 'var(--color-text-primary)' }}>
              Automático (contraste)
            </span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="textColor"
              value="custom"
              checked={globalConfig.textColor !== 'auto' && globalConfig.textColor}
              onChange={() => onGlobalConfigChange('textColor', '#ffffff')}
            />
            <span className="text-sm" style={{ color: 'var(--color-text-primary)' }}>
              Personalizado
            </span>
          </label>
          {globalConfig.textColor !== 'auto' && globalConfig.textColor && (
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={globalConfig.textColor || '#ffffff'}
                onChange={(e) => onGlobalConfigChange('textColor', e.target.value)}
                className="w-12 h-8 rounded cursor-pointer"
                style={{ border: '2px solid var(--color-border)' }}
              />
              <code className="px-2 py-1 rounded text-xs font-mono" style={{ background: 'var(--color-bg-primary)', color: 'var(--color-text-primary)' }}>
                {globalConfig.textColor}
              </code>
            </div>
          )}
        </div>
        <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
          Controla el color del texto en todos los badges. "Automático" calcula blanco o negro según el fondo.
        </p>
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

export default BadgeCustomizerTab;
