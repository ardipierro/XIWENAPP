/**
 * @fileoverview CardSystemTab - Panel de configuración avanzado del sistema de cards
 * @module components/settings/CardSystemTab
 *
 * Sistema de 3 columnas:
 * 1. Selector de Variants
 * 2. Editor de Configuración
 * 3. Usage Map (Dónde se usa)
 */

import { useState } from 'react';
import {
  Users,
  BookOpen,
  Calendar,
  TrendingUp,
  Sparkles,
  Eye,
  Edit2,
  Save,
  RotateCcw,
  AlertTriangle,
  CheckCircle,
  Info,
  ExternalLink,
  Search,
  FileCode
} from 'lucide-react';
import { UniversalCard } from '../cards';
import { BaseButton, BaseBadge } from '../common';
import { cardVariants } from '../cards/cardConfig';
import { scanCardUsage, analyzeImpact, getGlobalStats, findMigrationCandidates } from '../../utils/cardUsageScanner';
import { useCardConfig } from '../../contexts/CardConfigContext';

/**
 * CardSystemTab - Configurador avanzado de cards
 */
function CardSystemTab() {
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [selectedVariant, setSelectedVariant] = useState('default');
  const [showImpactAnalysis, setShowImpactAnalysis] = useState(false);
  const [impactData, setImpactData] = useState(null);

  // Hook para recargar config global después de guardar
  const { reloadConfig } = useCardConfig();

  // Estado de configuración editable (carga desde localStorage)
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

  // Usage data del scanner
  const usageData = scanCardUsage();
  const globalStats = getGlobalStats();
  const migrationCandidates = findMigrationCandidates();

  // Actualizar una propiedad de configuración
  const updateConfig = (variant, property, value) => {
    setConfig(prev => ({
      ...prev,
      [variant]: {
        ...prev[variant],
        [property]: value
      }
    }));

    // Analizar impacto del cambio
    const impact = analyzeImpact(variant, property, value);
    setImpactData(impact);
    setShowImpactAnalysis(true);
  };

  // Reset a valores originales
  const resetConfig = (variant) => {
    setConfig(prev => ({
      ...prev,
      [variant]: {...cardVariants[variant]}
    }));
    setShowImpactAnalysis(false);
    setImpactData(null);
  };

  // Guardar configuración y recargar config global
  const saveConfig = () => {
    localStorage.setItem('xiwen_card_config', JSON.stringify(config));
    reloadConfig(); // Recargar config global para que se aplique a todas las cards
    alert(`✅ Configuración guardada y aplicada

${impactData?.affectedComponents || 0} componente(s) afectado(s).
Los cambios se aplican instantáneamente en toda la app.`);
  };

  // Datos de ejemplo para las cards
  const exampleData = {
    user: {
      variant: 'user',
      avatar: 'JP',
      avatarColor: '#3b82f6',
      title: 'Juan Pérez',
      subtitle: 'juan@example.com',
      badges: [{ variant: 'success', children: 'Student' }],
      stats: [
        { label: 'Cursos', value: 12, icon: BookOpen },
        { label: 'Créditos', value: 450 }
      ],
      actions: [
        <BaseButton key="view" variant="ghost" size="sm" icon={Eye}>Ver</BaseButton>,
        <BaseButton key="edit" variant="ghost" size="sm" icon={Edit2}>Editar</BaseButton>
      ]
    },
    default: {
      variant: 'default',
      icon: Users,
      title: 'Estudiantes',
      description: 'Gestiona tus estudiantes',
      stats: [{ label: 'Total', value: 150 }],
      badges: [{ variant: 'primary', children: 'Activo' }]
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
        <BaseButton key="view" variant="primary" size="sm" fullWidth>Ver Curso</BaseButton>
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
      badges: [{ variant: 'success', children: '8 activas' }],
      stats: [{ label: 'Total', value: 12 }]
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
        <BaseButton key="join" variant="primary" size="sm">Unirse</BaseButton>
      ]
    }
  };

  const variantLabels = {
    default: { name: 'Default', description: 'Acceso rápido y widgets generales' },
    user: { name: 'User', description: 'Tarjetas de estudiantes y usuarios' },
    class: { name: 'Class', description: 'Clases en vivo y sesiones' },
    content: { name: 'Content', description: 'Cursos, lecciones y materiales' },
    stats: { name: 'Stats', description: 'Métricas y estadísticas' },
    compact: { name: 'Compact', description: 'Listas densas y compactas' }
  };

  // FIX: Calcular totalUsages dinámicamente desde usedIn.length para evitar inconsistencias
  const rawUsage = usageData[selectedVariant] || { usedIn: [] };
  const currentUsage = {
    ...rawUsage,
    totalUsages: rawUsage.usedIn.length // ← Siempre consistente con la lista
  };
  const severityColors = {
    low: 'text-green-600 dark:text-green-400',
    medium: 'text-yellow-600 dark:text-yellow-400',
    high: 'text-red-600 dark:text-red-400'
  };

  /**
   * Renderiza un campo de configuración dinámicamente según el tipo de propiedad
   */
  const renderConfigField = (property, value, variant) => {
    const labels = {
      headerHeight: 'Altura del Header',
      headerBg: 'Fondo del Header',
      headerGradient: 'Gradiente del Header',
      contentPadding: 'Padding del Contenido',
      hoverEnabled: 'Hover Habilitado',
      hoverTransform: 'Transform en Hover (translateY)',
      hoverShadow: 'Sombra en Hover',
      hoverBorderColor: 'Color de Borde en Hover',
      normalShadow: 'Sombra Normal',
      normalBorderColor: 'Color de Borde Normal',
      transitionDuration: 'Duración de Transición',
      transitionTiming: 'Timing de Transición',
      showIcon: 'Mostrar Icono',
      iconSize: 'Tamaño del Icono',
      showAvatar: 'Mostrar Avatar',
      avatarSize: 'Tamaño del Avatar',
      showBadges: 'Mostrar Badges',
      showStats: 'Mostrar Estadísticas',
      statsLayout: 'Layout de Stats',
      footerSticky: 'Footer Sticky',
      footerSpacing: 'Espaciado del Footer',
      footerAlignment: 'Alineación del Footer',
      showLiveIndicator: 'Mostrar Indicador Live',
      showMeta: 'Mostrar Meta Info',
      showBigNumber: 'Mostrar Número Grande'
    };

    const label = labels[property] || property;

    // Boolean fields
    if (typeof value === 'boolean') {
      return (
        <div key={property} className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={value}
            onChange={(e) => updateConfig(variant, property, e.target.checked)}
            className="w-5 h-5"
            id={`${variant}-${property}`}
          />
          <label htmlFor={`${variant}-${property}`} className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
            {label}
          </label>
        </div>
      );
    }

    // Number fields
    if (typeof value === 'number') {
      return (
        <div key={property}>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
            {label}: {value}px
          </label>
          <input
            type="range"
            min="16"
            max="64"
            step="4"
            value={value}
            onChange={(e) => updateConfig(variant, property, parseInt(e.target.value))}
            className="w-full"
          />
        </div>
      );
    }

    // Select fields
    if (property === 'footerSpacing') {
      return (
        <div key={property}>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
            {label}:
          </label>
          <select
            value={value}
            onChange={(e) => updateConfig(variant, property, e.target.value)}
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
          </select>
        </div>
      );
    }

    if (property === 'footerAlignment') {
      return (
        <div key={property}>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
            {label}:
          </label>
          <select
            value={value}
            onChange={(e) => updateConfig(variant, property, e.target.value)}
            className="w-full px-3 py-2 rounded-lg border"
            style={{
              background: 'var(--color-bg-tertiary)',
              borderColor: 'var(--color-border)',
              color: 'var(--color-text-primary)'
            }}
          >
            <option value="start">Inicio</option>
            <option value="center">Centro</option>
            <option value="end">Final</option>
          </select>
        </div>
      );
    }

    // Text fields (default)
    return (
      <div key={property}>
        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
          {label}:
        </label>
        <input
          type="text"
          value={value}
          onChange={(e) => updateConfig(variant, property, e.target.value)}
          className="w-full px-3 py-2 rounded-lg border text-sm font-mono"
          style={{
            background: 'var(--color-bg-tertiary)',
            borderColor: 'var(--color-border)',
            color: 'var(--color-text-primary)'
          }}
          placeholder={typeof value === 'string' ? value : ''}
        />
      </div>
    );
  };

  /**
   * Renderiza todas las propiedades de configuración organizadas por categorías
   */
  const renderAllConfigFields = (variant) => {
    const variantConfig = config[variant];
    if (!variantConfig) return null;

    const categories = {
      '🎨 Header': ['headerHeight', 'headerBg', 'headerGradient'],
      '📦 Contenido': ['contentPadding'],
      '✨ Hover': ['hoverEnabled', 'hoverTransform', 'hoverShadow', 'hoverBorderColor'],
      '🔲 Normal': ['normalShadow', 'normalBorderColor'],
      '⏱️ Transiciones': ['transitionDuration', 'transitionTiming'],
      '🎯 Iconos': ['showIcon', 'iconSize', 'showAvatar', 'avatarSize'],
      '🏷️ Badges': ['showBadges'],
      '📊 Stats': ['showStats', 'statsLayout', 'showBigNumber'],
      '📍 Footer': ['footerSticky', 'footerSpacing', 'footerAlignment'],
      '🔧 Extras': ['showLiveIndicator', 'showMeta']
    };

    return (
      <div className="space-y-4">
        {Object.entries(categories).map(([categoryName, properties]) => {
          const existingProps = properties.filter(prop => variantConfig.hasOwnProperty(prop));
          if (existingProps.length === 0) return null;

          return (
            <div key={categoryName}>
              <h4 className="text-sm font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>
                {categoryName}
              </h4>
              <div className="space-y-3">
                {existingProps.map(prop => renderConfigField(prop, variantConfig[prop], variant))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header con Stats Globales */}
      <div>
        <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>
          Sistema de Cards - Configurador Avanzado
        </h2>
        <p className="text-sm mb-4" style={{ color: 'var(--color-text-secondary)' }}>
          Configura cada variant, visualiza el impacto en tiempo real, y descubre dónde se usan en la app.
        </p>

        {/* Global Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-lg" style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}>
            <div className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
              {globalStats.universalCard.count}
            </div>
            <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              UniversalCard usados
            </div>
          </div>
          <div className="p-4 rounded-lg" style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}>
            <div className="text-2xl font-bold text-yellow-600">
              {globalStats.legacyCard.count}
            </div>
            <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              Clase .card (legacy)
            </div>
          </div>
          <div className="p-4 rounded-lg" style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}>
            <div className="text-2xl font-bold text-blue-600">
              {globalStats.baseCard.count}
            </div>
            <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              BaseCard (OK)
            </div>
          </div>
          <div className="p-4 rounded-lg" style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}>
            <div className="text-2xl font-bold text-green-600">
              {globalStats.migrationProgress}%
            </div>
            <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              Progreso migración
            </div>
          </div>
        </div>
      </div>

      {/* Main 3-Column Layout REDISEÑADO */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* COLUMNA 1: Selector de Variants (3 cols) */}
        <div className="lg:col-span-3 space-y-3">
          <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>
            Variants
          </h3>

          {Object.keys(variantLabels).map(key => {
            const usage = usageData[key] || { usedIn: [] };
            const usageCount = usage.usedIn.length; // ← Consistente con la lista real
            const isSelected = selectedVariant === key;

            return (
              <button
                key={key}
                onClick={() => {
                  setSelectedVariant(key);
                  setShowImpactAnalysis(false);
                  setImpactData(null);
                }}
                className="w-full text-left p-4 rounded-lg transition-all"
                style={{
                  background: isSelected ? 'var(--color-bg-tertiary)' : 'var(--color-bg-secondary)',
                  border: `2px solid ${isSelected ? 'var(--color-border-focus)' : 'var(--color-border)'}`,
                  cursor: 'pointer'
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="font-semibold text-sm mb-1" style={{ color: 'var(--color-text-primary)' }}>
                      {variantLabels[key].name}
                    </div>
                    <div className="text-xs mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                      {variantLabels[key].description}
                    </div>
                    <div className="text-xs font-medium" style={{ color: usageCount > 0 ? 'var(--color-primary)' : 'var(--color-text-tertiary)' }}>
                      {usageCount} {usageCount === 1 ? 'componente' : 'componentes'}
                    </div>
                  </div>
                  {isSelected && (
                    <CheckCircle size={16} className="text-primary-600" />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* COLUMNA 2: Configuración + Dónde se Usa (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Configuración - Card estilo profesional */}
          <div className="rounded-xl p-6" style={{ background: 'var(--color-bg-secondary)', border: '2px solid var(--color-border)' }}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold mb-1" style={{ color: 'var(--color-text-primary)' }}>
                  Configuración del Variant
                </h3>
                <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  Ajusta los parámetros visuales de <span className="font-mono font-semibold">{variantLabels[selectedVariant].name}</span>
                </p>
              </div>
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

            {/* Impact Analysis Alert */}
            {showImpactAnalysis && impactData && (
              <div
                className="p-4 rounded-lg border-2 mb-4"
                style={{
                  background: 'var(--color-bg-tertiary)',
                  borderColor: impactData.severity === 'high' ? 'var(--color-error)' :
                                impactData.severity === 'medium' ? 'var(--color-warning)' :
                                'var(--color-success)'
                }}
              >
                <div className="flex items-start gap-3">
                  <AlertTriangle size={20} className={severityColors[impactData.severity]} />
                  <div className="flex-1">
                    <div className="font-semibold text-sm mb-2" style={{ color: 'var(--color-text-primary)' }}>
                      Impacto del Cambio: {impactData.severity.toUpperCase()}
                    </div>
                    <div className="text-xs mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                      {impactData.affectedComponents} componente(s) afectado(s)
                    </div>
                    {impactData.warnings.length > 0 && (
                      <ul className="text-xs space-y-1" style={{ color: 'var(--color-text-secondary)' }}>
                        {impactData.warnings.map((warning, idx) => (
                          <li key={idx}>• {warning}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Configuration Controls - Campos dinámicos con scroll mejorado */}
            <div className="rounded-lg p-4" style={{ background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border)' }}>
              <div className="max-h-[350px] overflow-y-auto pr-3 custom-scrollbar">
                {renderAllConfigFields(selectedVariant)}
              </div>
            </div>
          </div>

          {/* Dónde se Usa - Card estilo profesional separado */}
          <div className="rounded-xl p-6" style={{ background: 'var(--color-bg-secondary)', border: '2px solid var(--color-border)' }}>
            <div className="mb-4">
              <h3 className="text-xl font-bold mb-1" style={{ color: 'var(--color-text-primary)' }}>
                Uso en la Aplicación
              </h3>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                Componentes que utilizan este variant
              </p>
            </div>

            {/* Stats del variant actual - Mejorado */}
            <div className="p-5 rounded-lg mb-4" style={{ background: 'var(--color-bg-tertiary)', border: '2px solid var(--color-border)' }}>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: 'var(--color-bg-secondary)' }}>
                  <span className="text-2xl font-black" style={{ color: 'var(--color-text-primary)' }}>
                    {currentUsage.totalUsages}
                  </span>
                </div>
                <div>
                  <div className="text-base font-bold mb-1" style={{ color: 'var(--color-text-primary)' }}>
                    {currentUsage.totalUsages === 1 ? 'Componente' : 'Componentes'}
                  </div>
                  <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    usando <span className="font-mono font-semibold">{selectedVariant}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Lista de archivos - Mejorada */}
            {currentUsage.usedIn.length > 0 ? (
              <div className="space-y-2 max-h-[280px] overflow-y-auto pr-3 custom-scrollbar">
                {currentUsage.usedIn.map((usage, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg hover:scale-[1.01] transition-all cursor-pointer"
                    style={{
                      background: 'var(--color-bg-tertiary)',
                      border: '1px solid var(--color-border)'
                    }}
                  >
                    <div className="flex items-start gap-2">
                      <FileCode size={16} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--color-primary)' }} />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-mono font-semibold truncate mb-1" style={{ color: 'var(--color-text-primary)' }}>
                          {usage.file.replace('src/components/', '')}
                        </div>
                        <div className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                          Línea {usage.line}
                        </div>
                        {usage.context && (
                          <div className="text-xs mt-1 italic opacity-75" style={{ color: 'var(--color-text-secondary)' }}>
                            {usage.context}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-10 text-center rounded-lg" style={{ background: 'var(--color-bg-tertiary)', border: '1px dashed var(--color-border)' }}>
                <Info size={40} className="mx-auto mb-4 opacity-30" style={{ color: 'var(--color-text-secondary)' }} />
                <div className="text-base font-semibold mb-1" style={{ color: 'var(--color-text-primary)' }}>
                  Sin Usos Registrados
                </div>
                <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  Este variant aún no se está usando en la app
                </div>
              </div>
            )}

            {/* Potenciales migraciones - Mejorado */}
            {currentUsage.potentialMigrations && currentUsage.potentialMigrations.length > 0 && (
              <div className="mt-4 p-4 rounded-lg" style={{ background: 'var(--color-warning-bg)', border: '1px solid var(--color-warning-border)' }}>
                <h4 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
                  <Search size={16} />
                  Candidatos a Migración
                </h4>
                <div className="space-y-2 max-h-[180px] overflow-y-auto pr-2 custom-scrollbar">
                  {currentUsage.potentialMigrations.map((candidate, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg"
                      style={{
                        background: 'var(--color-bg-secondary)',
                        border: '1px solid var(--color-warning-border)'
                      }}
                    >
                      <div className="text-xs font-mono font-semibold mb-1" style={{ color: 'var(--color-text-primary)' }}>
                        {candidate.file.replace('src/components/', '')}
                      </div>
                      <div className="text-xs mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                        {candidate.currentImplementation}
                      </div>
                      <BaseBadge variant="warning" size="sm">
                        Prioridad: {candidate.migrationPriority}
                      </BaseBadge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* COLUMNA 3: Preview en Vivo - SIEMPRE VISIBLE A LA DERECHA (4 cols) */}
        <div className="lg:col-span-4">
          <div className="sticky top-6">
            <div className="rounded-xl p-5" style={{ background: 'var(--color-bg-secondary)', border: '2px solid var(--color-border)' }}>
              <div className="mb-4">
                <h3 className="text-xl font-bold mb-1" style={{ color: 'var(--color-text-primary)' }}>
                  Preview en Vivo
                </h3>
                <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  Visualización en tiempo real de los cambios
                </p>
              </div>

              <div className="space-y-4">
                {/* Card 1: NORMAL - Contenido mínimo */}
                <div>
                  <div className="text-xs font-semibold mb-2 px-1" style={{ color: 'var(--color-text-secondary)' }}>
                    📄 Contenido Normal
                  </div>
                  <UniversalCard
                    {...exampleData[selectedVariant]}
                    size="md"
                    customConfig={config[selectedVariant]}
                  />
                </div>

                {/* Card 2: EXTENDIDA - Mucho contenido para probar sticky footer */}
                <div>
                  <div className="text-xs font-semibold mb-2 px-1" style={{ color: 'var(--color-text-secondary)' }}>
                    📋 Contenido Extendido (Prueba Sticky Footer)
                  </div>
                  <UniversalCard
                    {...exampleData[selectedVariant]}
                    size="md"
                    description="Esta card tiene mucho más contenido para demostrar claramente el funcionamiento del sticky footer. El footer (badges y acciones) debe permanecer siempre en la parte inferior de la card, sin importar cuánto contenido haya en el medio. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."
                    badges={[
                      ...(exampleData[selectedVariant].badges || []),
                      { variant: 'warning', children: 'Tag Extra 1' },
                      { variant: 'info', children: 'Tag Extra 2' },
                      { variant: 'success', children: 'Tag Extra 3' },
                    ]}
                    customConfig={config[selectedVariant]}
                  >
                    {/* Contenido adicional dentro de children */}
                    <div className="space-y-2 mt-2">
                      <div className="p-3 rounded-lg" style={{ background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border)' }}>
                        <div className="text-xs font-semibold mb-1" style={{ color: 'var(--color-text-primary)' }}>
                          📌 Información Adicional
                        </div>
                        <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                          Este bloque de contenido extra demuestra que el footer sticky se mantiene abajo incluso con children personalizados.
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        <span className="text-xs px-2 py-1 rounded-full" style={{ background: 'var(--color-bg-tertiary)', color: 'var(--color-text-secondary)' }}>
                          #tag1
                        </span>
                        <span className="text-xs px-2 py-1 rounded-full" style={{ background: 'var(--color-bg-tertiary)', color: 'var(--color-text-secondary)' }}>
                          #tag2
                        </span>
                        <span className="text-xs px-2 py-1 rounded-full" style={{ background: 'var(--color-bg-tertiary)', color: 'var(--color-text-secondary)' }}>
                          #tag3
                        </span>
                        <span className="text-xs px-2 py-1 rounded-full" style={{ background: 'var(--color-bg-tertiary)', color: 'var(--color-text-secondary)' }}>
                          #tag4
                        </span>
                        <span className="text-xs px-2 py-1 rounded-full" style={{ background: 'var(--color-bg-tertiary)', color: 'var(--color-text-secondary)' }}>
                          #tag5
                        </span>
                      </div>
                    </div>
                  </UniversalCard>
                </div>
              </div>

              {/* Nota explicativa */}
              <div className="mt-4 p-3 rounded-lg" style={{ background: 'var(--color-bg-tertiary)', border: '1px dashed var(--color-border)' }}>
                <div className="text-xs font-semibold mb-1" style={{ color: 'var(--color-text-primary)' }}>
                  💡 Comparación
                </div>
                <div className="text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                  La card extendida tiene más descripción, badges extras y contenido custom.
                  Observa cómo el footer (acciones) permanece pegado al fondo en ambas cards gracias al <span className="font-mono font-semibold">footerSticky</span>.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Fin del grid rediseñado */}
    </div>
  );
}

export default CardSystemTab;
