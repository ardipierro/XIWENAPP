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
} from 'lucide-react';
import { BaseButton, BaseBadge, BaseInput, BaseAlert } from '../common';
import useBadgeConfig from '../../hooks/useBadgeConfig';
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
    description: '',
    color: '#3b82f6',
    variant: 'primary',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.label.trim()) {
      alert('El label es obligatorio');
      return;
    }
    onAdd(formData);
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <BaseInput
            label="Label *"
            value={formData.label}
            onChange={(e) => setFormData({ ...formData, label: e.target.value })}
            required
            placeholder="Ej: Deportes"
          />

          <BaseInput
            label="Icono (emoji)"
            value={formData.icon}
            onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
            placeholder="⚽"
            helperText="Un solo emoji monocromático"
          />

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
