/**
 * @fileoverview ComponentMappingPanel - Panel para mapear componentes a card variants
 * @module components/settings/ComponentMappingPanel
 */

import { useState } from 'react';
import { Layers, Save, RotateCcw, Settings2, CheckCircle } from 'lucide-react';
import { BaseButton, BaseSelect, BaseBadge } from '../common';
import { useCardConfig } from '../../contexts/CardConfigContext';

const VARIANT_OPTIONS = [
  { value: 'default', label: 'Default (Acceso Rápido)' },
  { value: 'user', label: 'User (Estudiantes/Usuarios)' },
  { value: 'class', label: 'Class (Clases en Vivo)' },
  { value: 'content', label: 'Content (Cursos/Lecciones)' },
  { value: 'stats', label: 'Stats (Estadísticas)' },
  { value: 'compact', label: 'Compact (Listas Densas)' },
];

const COMPONENT_INFO = {
  'UnifiedContentManager': {
    label: 'Gestión de Contenidos',
    description: 'Tarjetas en la sección de gestión de contenidos (cursos, lecciones, ejercicios)',
    icon: '📚',
    recommendedVariant: 'content'
  },
  'UniversalUserManager': {
    label: 'Gestión de Usuarios',
    description: 'Tarjetas de estudiantes, profesores y guardians',
    icon: '👥',
    recommendedVariant: 'user'
  },
  'StudentList': {
    label: 'Lista de Estudiantes',
    description: 'Tarjetas en listas de estudiantes',
    icon: '🎓',
    recommendedVariant: 'user'
  },
  'UniversalDashboard': {
    label: 'Dashboard Principal',
    description: 'Tarjetas de acceso rápido en el dashboard',
    icon: '🏠',
    recommendedVariant: 'default'
  },
  'TeacherDashboard': {
    label: 'Dashboard del Profesor',
    description: 'Tarjetas de acceso rápido para profesores',
    icon: '👨‍🏫',
    recommendedVariant: 'default'
  },
  'StudentDashboard': {
    label: 'Dashboard del Estudiante',
    description: 'Tarjetas de acceso rápido para estudiantes',
    icon: '👨‍🎓',
    recommendedVariant: 'default'
  },
  'LiveClassRoom': {
    label: 'Aula Virtual en Vivo',
    description: 'Tarjetas de clases activas',
    icon: '🎥',
    recommendedVariant: 'class'
  },
  'ClassScheduleManager': {
    label: 'Programación de Clases',
    description: 'Tarjetas en el calendario de clases',
    icon: '📅',
    recommendedVariant: 'class'
  },
  'UnifiedCalendar': {
    label: 'Calendario Unificado',
    description: 'Eventos y clases en el calendario',
    icon: '🗓️',
    recommendedVariant: 'class'
  },
};

/**
 * ComponentMappingPanel - Panel para configurar qué variant usa cada componente
 */
function ComponentMappingPanel() {
  const { componentMapping, updateComponentMapping } = useCardConfig();
  const [localMapping, setLocalMapping] = useState(componentMapping);
  const [hasChanges, setHasChanges] = useState(false);

  const handleMappingChange = (componentName, newVariant) => {
    setLocalMapping(prev => ({
      ...prev,
      [componentName]: newVariant
    }));
    setHasChanges(true);
  };

  const handleSave = () => {
    // Guardar todos los cambios
    Object.entries(localMapping).forEach(([componentName, variant]) => {
      updateComponentMapping(componentName, variant);
    });
    setHasChanges(false);
    alert('✅ Mapeo de componentes guardado correctamente');
  };

  const handleReset = () => {
    setLocalMapping(componentMapping);
    setHasChanges(false);
  };

  const getVariantBadgeColor = (variant) => {
    const colors = {
      default: 'zinc',
      user: 'blue',
      class: 'purple',
      content: 'green',
      stats: 'amber',
      compact: 'slate'
    };
    return colors[variant] || 'gray';
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
              <Settings2 size={24} />
              Mapeo de Componentes
            </h2>
            <p className="text-sm mt-2" style={{ color: 'var(--color-text-secondary)' }}>
              Configura qué variant de tarjeta usa cada sección de la aplicación
            </p>
          </div>
          <div className="flex gap-2">
            {hasChanges && (
              <BaseButton
                variant="ghost"
                icon={RotateCcw}
                onClick={handleReset}
              >
                Descartar Cambios
              </BaseButton>
            )}
            <BaseButton
              variant="primary"
              icon={Save}
              onClick={handleSave}
              disabled={!hasChanges}
            >
              {hasChanges ? 'Guardar Cambios' : 'Sin Cambios'}
            </BaseButton>
          </div>
        </div>

        {/* Info Alert */}
        <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-3">
            <Layers size={20} className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
                ¿Qué hace esto?
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-200">
                Aquí puedes definir qué <strong>variant de tarjeta</strong> usa cada componente/sección de la app.
                Por ejemplo, puedes hacer que las tarjetas de "Gestión de Contenidos" usen el variant "content"
                o cambiarlas a "default" si prefieres otro estilo.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Component Mapping Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(COMPONENT_INFO).map(([componentName, info]) => {
          const currentVariant = localMapping[componentName] || 'default';
          const isRecommended = currentVariant === info.recommendedVariant;

          return (
            <div
              key={componentName}
              className="p-5 rounded-lg border-2 transition-all"
              style={{
                background: 'var(--color-bg-secondary)',
                borderColor: hasChanges && localMapping[componentName] !== componentMapping[componentName]
                  ? 'var(--color-warning)'
                  : 'var(--color-border)'
              }}
            >
              {/* Header */}
              <div className="flex items-start gap-3 mb-4">
                <div className="text-3xl">{info.icon}</div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-bold mb-1" style={{ color: 'var(--color-text-primary)' }}>
                    {info.label}
                  </h3>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                    {info.description}
                  </p>
                </div>
              </div>

              {/* Current Variant Badge */}
              <div className="mb-3">
                <div className="text-xs font-semibold mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                  Variant Actual:
                </div>
                <div className="flex items-center gap-2">
                  <BaseBadge variant={getVariantBadgeColor(currentVariant)}>
                    {VARIANT_OPTIONS.find(v => v.value === currentVariant)?.label || currentVariant}
                  </BaseBadge>
                  {isRecommended && (
                    <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                      <CheckCircle size={14} />
                      Recomendado
                    </div>
                  )}
                </div>
              </div>

              {/* Variant Selector */}
              <BaseSelect
                value={currentVariant}
                onChange={(e) => handleMappingChange(componentName, e.target.value)}
                options={VARIANT_OPTIONS}
                className="w-full"
              />

              {/* Recommended hint */}
              {!isRecommended && (
                <div className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                  💡 Recomendado: <strong>{VARIANT_OPTIONS.find(v => v.value === info.recommendedVariant)?.label}</strong>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ComponentMappingPanel;
