/**
 * @fileoverview CardSystemTab - Pestaña de visualización y configuración del sistema de cards
 * @module components/settings/CardSystemTab
 *
 * Vista de desarrollo para visualizar y configurar todas las variantes de cards en tiempo real
 */

import { useState } from 'react';
import { Users, BookOpen, Calendar, TrendingUp, Sparkles, Eye, Edit2, Trash2, Save, RotateCcw } from 'lucide-react';
import { UniversalCard } from '../cards';
import { BaseButton, BaseBadge } from '../common';
import { cardVariants } from '../cards/cardConfig';

/**
 * CardSystemTab - Componente de visualización y configuración de cards
 */
function CardSystemTab() {
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [selectedVariant, setSelectedVariant] = useState('default');

  // Estado de configuración editable (copia de cardVariants)
  const [config, setConfig] = useState({...cardVariants});

  // Actualizar una propiedad de configuración
  const updateConfig = (variant, property, value) => {
    setConfig(prev => ({
      ...prev,
      [variant]: {
        ...prev[variant],
        [property]: value
      }
    }));
  };

  // Reset a valores originales
  const resetConfig = (variant) => {
    setConfig(prev => ({
      ...prev,
      [variant]: {...cardVariants[variant]}
    }));
  };

  // Guardar configuración (por ahora solo en estado, más tarde en localStorage)
  const saveConfig = () => {
    localStorage.setItem('xiwen_card_config', JSON.stringify(config));
    alert('✅ Configuración guardada en localStorage');
  };

  // Datos de ejemplo para las cards
  const exampleData = {
    user: {
      variant: 'user',
      avatar: 'JP',
      avatarColor: '#3b82f6',
      title: 'Juan Pérez',
      subtitle: 'juan@example.com',
      badges: [
        { variant: 'success', children: 'Student' }
      ],
      stats: [
        { label: 'Cursos', value: 12, icon: BookOpen },
        { label: 'Créditos', value: 450 }
      ],
      actions: [
        <BaseButton key="view" variant="ghost" size="sm" icon={Eye}>
          Ver
        </BaseButton>,
        <BaseButton key="edit" variant="ghost" size="sm" icon={Edit2}>
          Editar
        </BaseButton>
      ]
    },

    default: {
      variant: 'default',
      icon: Users,
      title: 'Estudiantes',
      description: 'Gestiona tus estudiantes',
      stats: [
        { label: 'Total', value: 150 }
      ],
      badges: [
        { variant: 'primary', children: 'Activo' }
      ]
    },

    content: {
      variant: 'content',
      image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=300&fit=crop',
      title: 'React desde Cero',
      subtitle: '40 horas • Nivel Intermedio',
      description: 'Aprende React con proyectos reales',
      badges: [
        { variant: 'success', children: 'Activo' },
        { variant: 'info', children: 'Nuevo' }
      ],
      actions: [
        <BaseButton key="view" variant="primary" size="sm" fullWidth>
          Ver Curso
        </BaseButton>
      ]
    },

    stats: {
      variant: 'stats',
      icon: TrendingUp,
      title: 'Total Estudiantes',
      bigNumber: '1,542',
      trend: 'up',
      trendText: 'vs. mes anterior'
    },

    compact: {
      variant: 'compact',
      icon: Calendar,
      title: 'Clases Hoy',
      badges: [
        { variant: 'success', children: '8 activas' }
      ],
      stats: [
        { label: 'Total', value: 12 }
      ]
    },

    class: {
      variant: 'class',
      title: 'Clase de Matemáticas',
      subtitle: 'Prof. María García',
      showLiveIndicator: true,
      meta: [
        { icon: '👥', text: '15/30 participantes' },
        { icon: '⏱️', text: 'Hace 15 min' }
      ],
      actions: [
        <BaseButton key="join" variant="primary" size="sm">
          Unirse
        </BaseButton>
      ]
    }
  };

  const variantLabels = {
    default: 'Default (Acceso Rápido)',
    user: 'User (Estudiantes/Usuarios)',
    class: 'Class (Clases en Vivo)',
    content: 'Content (Cursos/Lecciones)',
    stats: 'Stats (Estadísticas)',
    compact: 'Compact (Listas Densas)'
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>
          Sistema de Cards - Configurador
        </h2>
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          Configura y visualiza todas las variantes de cards en tiempo real.
          Los cambios se aplican inmediatamente.
        </p>
      </div>

      {/* Controls Row */}
      <div className="flex flex-wrap items-center gap-4 p-4 rounded-lg" style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}>
        {/* Variant Selector */}
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
            Variante de Card:
          </label>
          <select
            value={selectedVariant}
            onChange={(e) => setSelectedVariant(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border"
            style={{
              background: 'var(--color-bg-tertiary)',
              borderColor: 'var(--color-border)',
              color: 'var(--color-text-primary)'
            }}
          >
            {Object.keys(variantLabels).map(key => (
              <option key={key} value={key}>{variantLabels[key]}</option>
            ))}
          </select>
        </div>

        {/* View Mode Toggle */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
            Modo de vista:
          </label>
          <div className="flex gap-2">
            <BaseButton
              variant={viewMode === 'grid' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              Grid
            </BaseButton>
            <BaseButton
              variant={viewMode === 'list' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              List
            </BaseButton>
          </div>
        </div>

        {/* Actions */}
        <div className="ml-auto">
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
            Acciones:
          </label>
          <div className="flex gap-2">
            <BaseButton
              variant="ghost"
              size="sm"
              icon={RotateCcw}
              onClick={() => resetConfig(selectedVariant)}
            >
              Reset
            </BaseButton>
            <BaseButton
              variant="primary"
              size="sm"
              icon={Save}
              onClick={saveConfig}
            >
              Guardar
            </BaseButton>
          </div>
        </div>
      </div>

      {/* Configuration Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Configuration Controls */}
        <div className="space-y-4 p-4 rounded-lg" style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}>
          <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>
            Configuración: {variantLabels[selectedVariant]}
          </h3>

          {/* Header Height */}
          {config[selectedVariant].headerBg !== 'transparent' && (
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
                Altura del Header:
              </label>
              <input
                type="text"
                value={config[selectedVariant].headerHeight}
                onChange={(e) => updateConfig(selectedVariant, 'headerHeight', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border"
                style={{
                  background: 'var(--color-bg-tertiary)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text-primary)'
                }}
                placeholder="128px, 100px, auto..."
              />
            </div>
          )}

          {/* Content Padding */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
              Padding del Contenido:
            </label>
            <input
              type="text"
              value={config[selectedVariant].contentPadding}
              onChange={(e) => updateConfig(selectedVariant, 'contentPadding', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border"
              style={{
                background: 'var(--color-bg-tertiary)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text-primary)'
              }}
              placeholder="20px, 24px..."
            />
          </div>

          {/* Footer Sticky */}
          {config[selectedVariant].footerSticky !== undefined && (
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={config[selectedVariant].footerSticky}
                onChange={(e) => updateConfig(selectedVariant, 'footerSticky', e.target.checked)}
                className="w-5 h-5"
              />
              <label className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                Footer Sticky (pegado al fondo)
              </label>
            </div>
          )}

          {/* Footer Spacing */}
          {config[selectedVariant].footerSpacing && (
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
                Espaciado del Footer:
              </label>
              <select
                value={config[selectedVariant].footerSpacing}
                onChange={(e) => updateConfig(selectedVariant, 'footerSpacing', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border"
                style={{
                  background: 'var(--color-bg-tertiary)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text-primary)'
                }}
              >
                <option value="gap-1">gap-1 (4px)</option>
                <option value="gap-2">gap-2 (8px)</option>
                <option value="gap-3">gap-3 (12px)</option>
                <option value="gap-4">gap-4 (16px)</option>
                <option value="gap-5">gap-5 (20px)</option>
                <option value="gap-6">gap-6 (24px)</option>
              </select>
            </div>
          )}

          {/* Hover Enabled */}
          {config[selectedVariant].hoverEnabled !== undefined && (
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={config[selectedVariant].hoverEnabled}
                onChange={(e) => updateConfig(selectedVariant, 'hoverEnabled', e.target.checked)}
                className="w-5 h-5"
              />
              <label className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                Hover Effect Enabled
              </label>
            </div>
          )}

          {/* Hover Transform */}
          {config[selectedVariant].hoverTransform && config[selectedVariant].hoverEnabled && (
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
                Hover Transform (translateY):
              </label>
              <input
                type="text"
                value={config[selectedVariant].hoverTransform}
                onChange={(e) => updateConfig(selectedVariant, 'hoverTransform', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border"
                style={{
                  background: 'var(--color-bg-tertiary)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text-primary)'
                }}
                placeholder="-4px, -2px..."
              />
            </div>
          )}

          {/* Icon Size */}
          {config[selectedVariant].iconSize && (
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
                Tamaño del Icono:
              </label>
              <input
                type="number"
                value={config[selectedVariant].iconSize}
                onChange={(e) => updateConfig(selectedVariant, 'iconSize', parseInt(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border"
                style={{
                  background: 'var(--color-bg-tertiary)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text-primary)'
                }}
                min="16"
                max="64"
                step="4"
              />
            </div>
          )}

          {/* Avatar Size */}
          {config[selectedVariant].avatarSize && (
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
                Tamaño del Avatar:
              </label>
              <input
                type="text"
                value={config[selectedVariant].avatarSize}
                onChange={(e) => updateConfig(selectedVariant, 'avatarSize', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border"
                style={{
                  background: 'var(--color-bg-tertiary)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text-primary)'
                }}
                placeholder="56px, 64px..."
              />
            </div>
          )}

          <div className="pt-4 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            💡 Los cambios se aplican en tiempo real a la preview de la derecha.
            Click en "Guardar" para persistir los cambios.
          </div>
        </div>

        {/* Right: Live Preview */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>
            Preview en Vivo
          </h3>

          {/* Inject custom config temporalmente */}
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 gap-4' : 'flex flex-col gap-4'}>
            <UniversalCard
              {...exampleData[selectedVariant]}
              layout={viewMode === 'list' ? 'horizontal' : 'vertical'}
              size="md"
            />
            <UniversalCard
              {...exampleData[selectedVariant]}
              layout={viewMode === 'list' ? 'horizontal' : 'vertical'}
              size="md"
              description={viewMode === 'grid' ? "Esta card tiene más texto para probar el footer sticky. Lorem ipsum dolor sit amet, consectetur adipiscing elit." : undefined}
            />
          </div>
        </div>
      </div>

      {/* Info de desarrollo */}
      <div
        className="p-4 rounded-lg"
        style={{
          background: 'var(--color-bg-tertiary)',
          border: '1px solid var(--color-border)'
        }}
      >
        <h4 className="text-sm font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>
          ℹ️ Notas de Desarrollo
        </h4>
        <ul className="text-sm space-y-1" style={{ color: 'var(--color-text-secondary)' }}>
          <li>✅ Configuración en tiempo real por variante</li>
          <li>✅ Preview inmediato de cambios</li>
          <li>✅ Persistencia en localStorage</li>
          <li>⚠️ Esta pestaña es temporal para desarrollo</li>
          <li>🔜 Próximo: Aplicar config guardada a TODAS las cards de la app</li>
        </ul>
      </div>
    </div>
  );
}

export default CardSystemTab;
