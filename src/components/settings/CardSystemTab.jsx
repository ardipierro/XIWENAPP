/**
 * @fileoverview CardSystemTab - Panel unificado de configuración del sistema de cards
 * @module components/settings/CardSystemTab
 *
 * Diseño integrado con secciones colapsables:
 * - Selector de Variants (siempre visible)
 * - Editor de Propiedades + Preview en vivo
 * - Dónde se Aplica (colapsable)
 * - Presets Rápidos
 */

import { useState } from 'react';
import {
  Users,
  BookOpen,
  Calendar,
  TrendingUp,
  Sparkles,
  Eye,
  Save,
  RotateCcw,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  HelpCircle,
  Download,
  Upload,
  Layout,
  Zap,
  Palette
} from 'lucide-react';
import { UniversalCard } from '../cards';
import { BaseButton, BaseBadge } from '../common';
import { cardVariants } from '../cards/cardConfig';
import { useCardConfig } from '../../contexts/CardConfigContext';

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTES Y DATOS
// ═══════════════════════════════════════════════════════════════════════════

const VARIANT_OPTIONS = [
  { value: 'default', label: 'Default', icon: Zap, description: 'Acceso rápido, dashboard' },
  { value: 'user', label: 'User', icon: Users, description: 'Estudiantes, usuarios' },
  { value: 'class', label: 'Class', icon: Calendar, description: 'Clases en vivo' },
  { value: 'content', label: 'Content', icon: BookOpen, description: 'Cursos, lecciones' },
  { value: 'stats', label: 'Stats', icon: TrendingUp, description: 'Estadísticas' },
  { value: 'compact', label: 'Compact', icon: Layout, description: 'Listas densas' },
];

const LAYOUT_OPTIONS = [
  { value: 'vertical', label: 'Vertical (Grid)', description: 'Header arriba, contenido abajo' },
  { value: 'horizontal', label: 'Horizontal', description: 'Avatar/ícono pequeño a la izquierda' },
  { value: 'row', label: 'Row (Lista)', description: 'Fila estirada para vistas de lista' },
];

const COMPONENT_MAPPING_INFO = {
  'UnifiedContentManager': { label: 'Gestión de Contenidos', icon: '📚', recommended: 'content' },
  'UniversalUserManager': { label: 'Gestión de Usuarios', icon: '👥', recommended: 'user' },
  'StudentList': { label: 'Lista de Estudiantes', icon: '🎓', recommended: 'user' },
  'UniversalDashboard': { label: 'Dashboard Principal', icon: '🏠', recommended: 'default' },
  'TeacherDashboard': { label: 'Dashboard Profesor', icon: '👨‍🏫', recommended: 'default' },
  'StudentDashboard': { label: 'Dashboard Estudiante', icon: '👨‍🎓', recommended: 'default' },
  'LiveClassRoom': { label: 'Aula Virtual', icon: '🎥', recommended: 'class' },
  'ClassScheduleManager': { label: 'Horarios de Clases', icon: '📅', recommended: 'class' },
};

const PRESETS = {
  minimalist: {
    name: 'Minimalista',
    icon: '✨',
    description: 'Bordes sutiles, sin sombras, hover suave',
    changes: {
      hoverTransform: '-2px',
      normalShadow: 'none',
      hoverShadow: '0 4px 12px rgba(0,0,0,0.08)',
    }
  },
  elevated: {
    name: 'Elevado',
    icon: '🎯',
    description: 'Sombras pronunciadas, efecto flotante',
    changes: {
      hoverTransform: '-6px',
      normalShadow: '0 4px 12px rgba(0,0,0,0.1)',
      hoverShadow: '0 20px 40px rgba(0,0,0,0.2)',
    }
  },
  compact: {
    name: 'Compacto',
    icon: '📦',
    description: 'Padding reducido, más contenido visible',
    changes: {
      contentPadding: '12px',
      headerHeight: '80px',
    }
  },
  colorful: {
    name: 'Colorido',
    icon: '🌈',
    description: 'Bordes de color en hover',
    changes: {
      hoverBorderColor: 'var(--color-primary)',
      hoverShadow: '0 12px 24px rgba(59,130,246,0.2)',
    }
  },
};

// Datos de ejemplo para preview
const EXAMPLE_DATA = {
  default: {
    icon: Users,
    title: 'Gestionar Estudiantes',
    description: 'Ver y administrar todos tus estudiantes',
    stats: [{ label: 'Total', value: 150 }],
    badges: [{ variant: 'primary', children: 'Dashboard' }]
  },
  user: {
    avatar: 'JP',
    avatarColor: '#5b8fa3',
    title: 'Juan Pérez',
    subtitle: 'juan@example.com',
    badges: [{ variant: 'success', children: 'Estudiante' }],
    stats: [
      { label: 'Cursos', value: 12, icon: BookOpen },
      { label: 'Créditos', value: 450 }
    ]
  },
  class: {
    title: 'Clase de Español',
    subtitle: 'Prof. María García',
    showLiveIndicator: true,
    meta: [
      { icon: '👥', text: '15/30 participantes' },
      { icon: '⏱️', text: 'Hace 15 min' }
    ]
  },
  content: {
    image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=300&fit=crop',
    title: 'React desde Cero',
    subtitle: '40 horas • Nivel Intermedio',
    description: 'Aprende React con proyectos reales',
    badges: [
      { variant: 'success', children: 'Activo' },
      { variant: 'info', children: 'Nuevo' }
    ]
  },
  stats: {
    icon: TrendingUp,
    title: 'Total Estudiantes',
    bigNumber: '1,542',
    trend: 'up',
    trendText: 'vs. mes anterior'
  },
  compact: {
    icon: Calendar,
    title: 'Clases Hoy',
    badges: [{ variant: 'success', children: '8 activas' }],
    stats: [{ label: 'Total', value: 12 }]
  }
};

/**
 * CardSystemTab - Panel unificado de configuración
 */
function CardSystemTab() {
  // Estados principales
  const [selectedVariant, setSelectedVariant] = useState('default');
  const [previewLayout, setPreviewLayout] = useState('vertical');

  // Secciones colapsables
  const [sectionsOpen, setSectionsOpen] = useState({
    editor: true,
    components: false,
    presets: false,
  });

  // Hook para recargar config global
  const { reloadConfig, componentMapping, updateComponentMapping } = useCardConfig();

  // Estado de configuración editable
  const [config, setConfig] = useState(() => {
    const savedConfig = localStorage.getItem('xiwen_card_config');
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig);
        const merged = {};
        Object.keys(cardVariants).forEach(variant => {
          merged[variant] = {
            ...cardVariants[variant],
            ...(parsed[variant] || {})
          };
        });
        return merged;
      } catch (e) {
        console.error('Error loading saved card config:', e);
        return {...cardVariants};
      }
    }
    return {...cardVariants};
  });

  // Estado de cambios pendientes
  const [hasChanges, setHasChanges] = useState(false);

  // ═══════════════════════════════════════════════════════════════════════════
  // HANDLERS
  // ═══════════════════════════════════════════════════════════════════════════

  const updateConfig = (variant, property, value) => {
    setConfig(prev => ({
      ...prev,
      [variant]: {
        ...prev[variant],
        [property]: value
      }
    }));
    setHasChanges(true);
  };

  const resetConfig = (variant) => {
    setConfig(prev => ({
      ...prev,
      [variant]: {...cardVariants[variant]}
    }));
    setHasChanges(true);
  };

  const applyPreset = (presetKey) => {
    const preset = PRESETS[presetKey];
    if (!preset) return;
    setConfig(prev => ({
      ...prev,
      [selectedVariant]: {
        ...prev[selectedVariant],
        ...preset.changes
      }
    }));
    setHasChanges(true);
  };

  const saveConfig = () => {
    localStorage.setItem('xiwen_card_config', JSON.stringify(config));
    reloadConfig();
    setHasChanges(false);
    alert('✅ Configuración guardada y aplicada');
  };

  const exportConfig = () => {
    const dataStr = JSON.stringify(config, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'xiwen-card-config.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const importConfig = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const imported = JSON.parse(event.target.result);
          const merged = {};
          Object.keys(cardVariants).forEach(variant => {
            merged[variant] = {
              ...cardVariants[variant],
              ...(imported[variant] || {})
            };
          });
          setConfig(merged);
          setHasChanges(true);
          alert('✅ Configuración importada. Recuerda guardar.');
        } catch {
          alert('❌ Error: archivo inválido');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const toggleSection = (section) => {
    setSectionsOpen(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER HELPERS
  // ═══════════════════════════════════════════════════════════════════════════

  const renderConfigField = (property, value, variant) => {
    const fieldLabels = {
      headerHeight: 'Altura del Header',
      contentPadding: 'Padding del Contenido',
      hoverEnabled: 'Hover Habilitado',
      hoverTransform: 'Desplazamiento en Hover',
      hoverShadow: 'Sombra en Hover',
      hoverBorderColor: 'Borde en Hover',
      normalShadow: 'Sombra Normal',
      normalBorderColor: 'Borde Normal',
      showIcon: 'Mostrar Ícono',
      iconSize: 'Tamaño del Ícono',
      showAvatar: 'Mostrar Avatar',
      avatarSize: 'Tamaño del Avatar',
      showBadges: 'Mostrar Badges',
      showStats: 'Mostrar Stats',
      footerSticky: 'Footer Fijo',
      footerSpacing: 'Espaciado Footer',
      showLiveIndicator: 'Indicador EN VIVO',
      showMeta: 'Mostrar Meta Info',
      showBigNumber: 'Número Grande',
      showTrend: 'Mostrar Tendencia',
      cardHeight: 'Altura de Card',
    };

    const label = fieldLabels[property] || property;

    // Campos booleanos
    if (typeof value === 'boolean') {
      return (
        <label key={property} className="flex items-center gap-3 py-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 px-2 rounded-lg transition-colors">
          <input
            type="checkbox"
            checked={value}
            onChange={(e) => updateConfig(variant, property, e.target.checked)}
            className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
            {label}
          </span>
        </label>
      );
    }

    // Campos numéricos
    if (typeof value === 'number') {
      return (
        <div key={property} className="py-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
              {label}
            </span>
            <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ background: 'var(--color-bg-tertiary)', color: 'var(--color-text-secondary)' }}>
              {value}px
            </span>
          </div>
          <input
            type="range"
            min="16"
            max="80"
            step="4"
            value={value}
            onChange={(e) => updateConfig(variant, property, parseInt(e.target.value))}
            className="w-full accent-primary-500"
          />
        </div>
      );
    }

    // Campos de texto
    return (
      <div key={property} className="py-2">
        <label className="text-sm font-medium block mb-1" style={{ color: 'var(--color-text-primary)' }}>
          {label}
        </label>
        <input
          type="text"
          value={value || ''}
          onChange={(e) => updateConfig(variant, property, e.target.value)}
          className="w-full px-3 py-2 rounded-lg border text-sm font-mono"
          style={{
            background: 'var(--color-bg-tertiary)',
            borderColor: 'var(--color-border)',
            color: 'var(--color-text-primary)'
          }}
        />
      </div>
    );
  };

  const renderConfigByCategory = (variant) => {
    const variantConfig = config[variant];
    if (!variantConfig) return null;

    const categories = {
      '📐 Dimensiones': ['cardHeight', 'headerHeight', 'contentPadding'],
      '✨ Efectos Hover': ['hoverEnabled', 'hoverTransform', 'hoverShadow', 'hoverBorderColor'],
      '🔲 Estado Normal': ['normalShadow', 'normalBorderColor'],
      '🎯 Elementos': ['showIcon', 'iconSize', 'showAvatar', 'avatarSize', 'showBadges', 'showStats'],
      '📍 Footer': ['footerSticky', 'footerSpacing'],
    };

    // Añadir categorías específicas según variant
    if (variant === 'class') {
      categories['🎥 Clase en Vivo'] = ['showLiveIndicator', 'showMeta'];
    }
    if (variant === 'stats') {
      categories['📊 Estadísticas'] = ['showBigNumber', 'showTrend'];
    }

    return (
      <div className="space-y-4">
        {Object.entries(categories).map(([categoryName, properties]) => {
          const existingProps = properties.filter(prop => variantConfig.hasOwnProperty(prop));
          if (existingProps.length === 0) return null;

          return (
            <div key={categoryName} className="p-3 rounded-lg" style={{ background: 'var(--color-bg-tertiary)' }}>
              <h4 className="text-sm font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>
                {categoryName}
              </h4>
              <div className="space-y-1">
                {existingProps.map(prop => renderConfigField(prop, variantConfig[prop], variant))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
            <Palette size={24} />
            Sistema de Tarjetas Universales
          </h2>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
            Configura el aspecto visual de todas las tarjetas de la aplicación
          </p>
        </div>
        <div className="flex gap-2">
          <BaseButton variant="ghost" size="sm" icon={Upload} onClick={importConfig}>
            Importar
          </BaseButton>
          <BaseButton variant="ghost" size="sm" icon={Download} onClick={exportConfig}>
            Exportar
          </BaseButton>
          {hasChanges && (
            <BaseButton variant="primary" size="sm" icon={Save} onClick={saveConfig}>
              Guardar Cambios
            </BaseButton>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* SELECTOR DE VARIANT */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <div className="p-4 rounded-xl" style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}>
        <h3 className="text-sm font-bold mb-3" style={{ color: 'var(--color-text-primary)' }}>
          Selecciona un Variant para editar
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
          {VARIANT_OPTIONS.map(opt => {
            const Icon = opt.icon;
            const isSelected = selectedVariant === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => setSelectedVariant(opt.value)}
                className={`p-3 rounded-lg text-left transition-all ${
                  isSelected
                    ? 'ring-2 ring-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
                style={{
                  background: isSelected ? undefined : 'var(--color-bg-tertiary)',
                  border: '1px solid var(--color-border)'
                }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Icon size={16} className={isSelected ? 'text-primary-600' : 'text-gray-500'} />
                  <span className={`text-sm font-bold ${isSelected ? 'text-primary-600' : ''}`} style={{ color: isSelected ? undefined : 'var(--color-text-primary)' }}>
                    {opt.label}
                  </span>
                </div>
                <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                  {opt.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* EDITOR + PREVIEW */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Editor de Propiedades */}
        <div className="rounded-xl overflow-hidden" style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}>
          {/* Header colapsable */}
          <button
            onClick={() => toggleSection('editor')}
            className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              {sectionsOpen.editor ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
              <span className="text-base font-bold" style={{ color: 'var(--color-text-primary)' }}>
                Propiedades de "{VARIANT_OPTIONS.find(v => v.value === selectedVariant)?.label}"
              </span>
            </div>
            <BaseButton
              variant="ghost"
              size="sm"
              icon={RotateCcw}
              onClick={(e) => { e.stopPropagation(); resetConfig(selectedVariant); }}
            >
              Reset
            </BaseButton>
          </button>

          {/* Contenido */}
          {sectionsOpen.editor && (
            <div className="p-4 border-t max-h-[500px] overflow-y-auto" style={{ borderColor: 'var(--color-border)' }}>
              {renderConfigByCategory(selectedVariant)}
            </div>
          )}
        </div>

        {/* Preview en Vivo */}
        <div className="rounded-xl p-4" style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
              <Eye size={18} />
              Preview en Vivo
            </h3>
            {/* Selector de Layout */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                Layout:
              </span>
              <select
                value={previewLayout}
                onChange={(e) => setPreviewLayout(e.target.value)}
                className="px-2 py-1 text-sm rounded-lg border"
                style={{
                  background: 'var(--color-bg-tertiary)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text-primary)'
                }}
              >
                {LAYOUT_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Cards de Preview */}
          <div className={`space-y-4 ${previewLayout === 'row' ? '' : 'max-w-sm mx-auto'}`}>
            <UniversalCard
              variant={selectedVariant}
              layout={previewLayout}
              size="md"
              customConfig={config[selectedVariant]}
              {...EXAMPLE_DATA[selectedVariant]}
            />

            {/* Segunda card con más contenido */}
            <UniversalCard
              variant={selectedVariant}
              layout={previewLayout}
              size="md"
              customConfig={config[selectedVariant]}
              {...EXAMPLE_DATA[selectedVariant]}
              description="Contenido adicional para probar cómo se comporta la tarjeta con más texto y elementos."
              badges={[
                ...(EXAMPLE_DATA[selectedVariant].badges || []),
                { variant: 'warning', children: 'Extra' }
              ]}
            />
          </div>

          {/* Info del Layout */}
          <div className="mt-4 p-3 rounded-lg" style={{ background: 'var(--color-bg-tertiary)', border: '1px dashed var(--color-border)' }}>
            <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              <strong>Layout "{previewLayout}":</strong>{' '}
              {LAYOUT_OPTIONS.find(l => l.value === previewLayout)?.description}
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* PRESETS RÁPIDOS */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <div className="rounded-xl overflow-hidden" style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}>
        <button
          onClick={() => toggleSection('presets')}
          className="w-full p-4 flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
        >
          {sectionsOpen.presets ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
          <Sparkles size={18} className="text-purple-500" />
          <span className="text-base font-bold" style={{ color: 'var(--color-text-primary)' }}>
            Presets Rápidos
          </span>
          <span className="text-xs ml-2" style={{ color: 'var(--color-text-secondary)' }}>
            Aplica estilos predefinidos al variant "{selectedVariant}"
          </span>
        </button>

        {sectionsOpen.presets && (
          <div className="p-4 border-t grid grid-cols-2 sm:grid-cols-4 gap-3" style={{ borderColor: 'var(--color-border)' }}>
            {Object.entries(PRESETS).map(([key, preset]) => (
              <button
                key={key}
                onClick={() => applyPreset(key)}
                className="p-4 rounded-lg text-left hover:scale-[1.02] transition-all"
                style={{ background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border)' }}
              >
                <div className="text-2xl mb-2">{preset.icon}</div>
                <div className="text-sm font-bold mb-1" style={{ color: 'var(--color-text-primary)' }}>
                  {preset.name}
                </div>
                <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                  {preset.description}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* DÓNDE SE APLICA */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <div className="rounded-xl overflow-hidden" style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}>
        <button
          onClick={() => toggleSection('components')}
          className="w-full p-4 flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
        >
          {sectionsOpen.components ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
          <Layout size={18} className="text-blue-500" />
          <span className="text-base font-bold" style={{ color: 'var(--color-text-primary)' }}>
            Dónde se Aplica cada Variant
          </span>
          <span className="text-xs ml-2" style={{ color: 'var(--color-text-secondary)' }}>
            Configura qué variant usa cada sección de la app
          </span>
        </button>

        {sectionsOpen.components && (
          <div className="p-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Object.entries(COMPONENT_MAPPING_INFO).map(([componentName, info]) => {
                const currentVariant = componentMapping?.[componentName] || info.recommended;
                const isRecommended = currentVariant === info.recommended;

                return (
                  <div
                    key={componentName}
                    className="p-4 rounded-lg"
                    style={{ background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border)' }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">{info.icon}</span>
                      <span className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>
                        {info.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        value={currentVariant}
                        onChange={(e) => updateComponentMapping?.(componentName, e.target.value)}
                        className="flex-1 px-2 py-1.5 text-sm rounded-lg border"
                        style={{
                          background: 'var(--color-bg-secondary)',
                          borderColor: 'var(--color-border)',
                          color: 'var(--color-text-primary)'
                        }}
                      >
                        {VARIANT_OPTIONS.map(v => (
                          <option key={v.value} value={v.value}>{v.label}</option>
                        ))}
                      </select>
                      {isRecommended && (
                        <div className="flex items-center gap-1 text-xs text-green-600">
                          <CheckCircle size={14} />
                        </div>
                      )}
                    </div>

                    {!isRecommended && (
                      <div className="mt-2 text-xs text-amber-600">
                        Recomendado: {info.recommended}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Info Footer */}
      <div className="p-4 rounded-lg flex items-start gap-3" style={{ background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border)' }}>
        <HelpCircle size={18} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--color-text-secondary)' }} />
        <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          Los cambios se aplican <strong>instantáneamente</strong> a todas las tarjetas de la aplicación al guardar.
          Usa <strong>Exportar</strong> para hacer backup de tu configuración.
        </div>
      </div>
    </div>
  );
}

export default CardSystemTab;
