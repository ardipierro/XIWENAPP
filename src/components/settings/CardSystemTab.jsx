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
  FileCode,
  HelpCircle,
  RefreshCw,
  Target,
  Layers
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
  const [previewMode, setPreviewMode] = useState('basic'); // 'basic' | 'real-examples'

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
    default: 'Default (Acceso Rápido)',
    user: 'User (Estudiantes/Usuarios)',
    class: 'Class (Clases en Vivo)',
    content: 'Content (Cursos/Lecciones)',
    stats: 'Stats (Estadísticas)',
    compact: 'Compact (Listas Densas)'
  };

  // Ejemplos REALES basados en tarjetas que existen en la app
  const realExamples = {
    default: [
      {
        variant: 'default',
        icon: Users,
        title: 'Gestionar Estudiantes',
        description: 'Ver y administrar todos tus estudiantes',
        stats: [{ label: 'Estudiantes', value: 150 }],
        badges: [{ variant: 'primary', children: 'Dashboard' }],
        actions: [
          <BaseButton key="view" variant="primary" size="sm" fullWidth>Ir a Estudiantes</BaseButton>
        ]
      },
      {
        variant: 'default',
        icon: BookOpen,
        title: 'Contenidos Educativos',
        description: 'Biblioteca de cursos y lecciones',
        stats: [{ label: 'Contenidos', value: 48 }],
        badges: [{ variant: 'success', children: 'Activo' }],
        actions: [
          <BaseButton key="view" variant="primary" size="sm" fullWidth>Ver Contenidos</BaseButton>
        ]
      }
    ],
    user: [
      {
        variant: 'user',
        avatar: 'MP',
        avatarColor: '#8b5cf6',
        title: 'María Pérez',
        subtitle: 'maria.perez@example.com',
        badges: [
          { variant: 'success', children: 'Estudiante' },
          { variant: 'info', children: 'Activo' }
        ],
        stats: [
          { label: 'Cursos', value: 8, icon: BookOpen },
          { label: 'Créditos', value: 350 }
        ],
        actions: [
          <BaseButton key="edit" variant="ghost" size="sm" icon={Edit2}>Editar</BaseButton>
        ]
      },
      {
        variant: 'user',
        avatar: 'JG',
        avatarColor: '#3b82f6',
        title: 'Juan García',
        subtitle: 'Profesor de Matemáticas',
        badges: [
          { variant: 'primary', children: 'Profesor' },
          { variant: 'success', children: 'Verificado' }
        ],
        stats: [
          { label: 'Clases', value: 24 },
          { label: 'Estudiantes', value: 180 }
        ],
        actions: [
          <BaseButton key="view" variant="primary" size="sm">Ver Perfil</BaseButton>
        ]
      }
    ],
    class: [
      {
        variant: 'class',
        title: 'Clase de Español Intermedio',
        subtitle: 'Prof. Ana López',
        showLiveIndicator: true,
        meta: [
          { icon: '👥', text: '22/30 estudiantes conectados' },
          { icon: '⏱️', text: 'Comenzó hace 15 min' }
        ],
        actions: [
          <BaseButton key="join" variant="primary" size="sm" fullWidth>Unirse Ahora</BaseButton>
        ]
      },
      {
        variant: 'class',
        title: 'Taller de Conversación Avanzada',
        subtitle: 'Prof. Carlos Ruiz',
        meta: [
          { icon: '📅', text: 'Programada para 14:00' },
          { icon: '⏱️', text: '1 hora de duración' }
        ],
        badges: [{ variant: 'warning', children: 'Próximamente' }],
        actions: [
          <BaseButton key="reminder" variant="ghost" size="sm">Recordarme</BaseButton>
        ]
      }
    ],
    content: [
      {
        variant: 'content',
        image: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=400&h=300&fit=crop',
        title: 'Español para Principiantes',
        subtitle: '20 lecciones • Nivel Básico',
        description: 'Aprende los fundamentos del español con ejercicios interactivos y diálogos prácticos.',
        badges: [
          { variant: 'success', children: 'Activo' },
          { variant: 'info', children: 'Popular' }
        ],
        actions: [
          <BaseButton key="start" variant="primary" size="sm" fullWidth>Comenzar Curso</BaseButton>
        ]
      },
      {
        variant: 'content',
        image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&h=300&fit=crop',
        title: 'Gramática Avanzada',
        subtitle: '35 lecciones • Nivel Avanzado',
        description: 'Domina estructuras complejas del español: subjuntivo, condicional, tiempos perfectos y más.',
        badges: [
          { variant: 'primary', children: 'Premium' },
          { variant: 'warning', children: 'Nuevo' }
        ],
        actions: [
          <BaseButton key="view" variant="primary" size="sm" fullWidth>Ver Detalles</BaseButton>
        ]
      }
    ],
    stats: [
      {
        variant: 'stats',
        icon: Users,
        title: 'Total Estudiantes',
        bigNumber: '1,542',
        trend: 'up',
        trendText: '+12% vs. mes anterior'
      },
      {
        variant: 'stats',
        icon: BookOpen,
        title: 'Clases Completadas',
        bigNumber: '3,280',
        trend: 'up',
        trendText: '+8% vs. semana pasada'
      }
    ],
    compact: [
      {
        variant: 'compact',
        icon: Calendar,
        title: 'Clases Programadas',
        badges: [{ variant: 'success', children: '12 activas' }],
        stats: [{ label: 'Hoy', value: 8 }]
      },
      {
        variant: 'compact',
        icon: TrendingUp,
        title: 'Progreso Mensual',
        badges: [{ variant: 'primary', children: '+15%' }],
        stats: [{ label: 'Completado', value: 85 }]
      }
    ]
  };

  const currentUsage = usageData[selectedVariant] || { totalUsages: 0, usedIn: [] };
  const severityColors = {
    low: 'text-green-600 dark:text-green-400',
    medium: 'text-yellow-600 dark:text-yellow-400',
    high: 'text-red-600 dark:text-red-400'
  };

  /**
   * Renderiza un campo de configuración dinámicamente según el tipo de propiedad
   */
  const renderConfigField = (property, value, variant) => {
    const fieldInfo = {
      // Header
      headerHeight: {
        label: 'Altura del Header',
        tooltip: 'Altura del área superior de la tarjeta (header). Afecta el espacio disponible para íconos, avatares o imágenes.'
      },
      headerBg: {
        label: 'Fondo del Header',
        tooltip: 'Tipo de fondo del header: gradient (degradado), solid (color sólido), image (imagen), transparent (sin fondo).'
      },
      headerGradient: {
        label: 'Gradiente del Header',
        tooltip: 'Clases CSS de Tailwind para el degradado del header. Ejemplo: from-blue-500 to-purple-600'
      },
      headerColor: {
        label: 'Color del Header',
        tooltip: 'Color de fondo sólido cuando headerBg es "solid".'
      },
      headerImageFit: {
        label: 'Ajuste de Imagen',
        tooltip: 'Cómo se ajusta la imagen del header: cover (cubrir), contain (contener), fill (rellenar).'
      },

      // Content
      contentPadding: {
        label: 'Padding del Contenido',
        tooltip: 'Espacio interno (padding) alrededor del contenido de la tarjeta. Valores más altos = más espacio.'
      },
      cardHeight: {
        label: 'Altura Fija',
        tooltip: 'Altura fija de la tarjeta. Útil para grids uniformes. Si no se define, la altura será automática.'
      },
      contentOverflow: {
        label: 'Overflow del Contenido',
        tooltip: 'Qué hacer cuando el contenido es muy largo: auto (scroll), hidden (ocultar), visible (mostrar todo).'
      },

      // Hover
      hoverEnabled: {
        label: 'Hover Habilitado',
        tooltip: 'Activa/desactiva efectos visuales al pasar el mouse sobre la tarjeta.'
      },
      hoverTransform: {
        label: 'Transform en Hover',
        tooltip: 'Desplazamiento vertical al hacer hover. Valores negativos mueven hacia arriba, positivos hacia abajo.'
      },
      hoverShadow: {
        label: 'Sombra en Hover',
        tooltip: 'Sombra CSS que se aplica al hacer hover. Formato: "0 12px 24px rgba(0,0,0,0.15)"'
      },
      hoverBorderColor: {
        label: 'Color de Borde en Hover',
        tooltip: 'Color del borde de la tarjeta al hacer hover. Puede usar variables CSS como var(--color-primary).'
      },

      // Normal State
      normalShadow: {
        label: 'Sombra Normal',
        tooltip: 'Sombra CSS de la tarjeta en estado normal (sin hover).'
      },
      normalBorderColor: {
        label: 'Color de Borde Normal',
        tooltip: 'Color del borde de la tarjeta en estado normal.'
      },

      // Transitions
      transitionDuration: {
        label: 'Duración de Transición',
        tooltip: 'Duración de las animaciones de la tarjeta (ej: 300ms). Valores más altos = animaciones más lentas.'
      },
      transitionTiming: {
        label: 'Timing de Transición',
        tooltip: 'Curva de animación CSS. Ejemplos: ease-in-out, cubic-bezier(0.4, 0, 0.2, 1)'
      },

      // Icons & Avatars
      showIcon: {
        label: 'Mostrar Ícono',
        tooltip: 'Muestra u oculta el ícono en el header de la tarjeta (variant default/compact).'
      },
      iconSize: {
        label: 'Tamaño del Ícono',
        tooltip: 'Tamaño del ícono en píxeles.'
      },
      showAvatar: {
        label: 'Mostrar Avatar',
        tooltip: 'Muestra u oculta el avatar circular en el header (variant user).'
      },
      avatarSize: {
        label: 'Tamaño del Avatar',
        tooltip: 'Tamaño del avatar circular en píxeles.'
      },
      avatarFontSize: {
        label: 'Tamaño de Texto Avatar',
        tooltip: 'Tamaño de las iniciales dentro del avatar.'
      },

      // Badges & Stats
      showBadges: {
        label: 'Mostrar Badges',
        tooltip: 'Muestra u oculta los badges/etiquetas de la tarjeta.'
      },
      showRoleBadge: {
        label: 'Mostrar Badge de Rol',
        tooltip: 'Muestra el badge con el rol del usuario (variant user).'
      },
      showStatusBadge: {
        label: 'Mostrar Badge de Estado',
        tooltip: 'Muestra el badge con el estado del usuario (activo/inactivo).'
      },
      maxBadges: {
        label: 'Máximo de Badges',
        tooltip: 'Número máximo de badges a mostrar. El resto se oculta.'
      },
      showStats: {
        label: 'Mostrar Estadísticas',
        tooltip: 'Muestra u oculta las estadísticas numéricas en la tarjeta.'
      },
      statsLayout: {
        label: 'Layout de Stats',
        tooltip: 'Orientación de las estadísticas: horizontal (en fila) o vertical (en columna).'
      },

      // Footer
      footerSticky: {
        label: 'Footer Sticky',
        tooltip: 'Mantiene badges y botones siempre al fondo de la tarjeta, incluso si el contenido es corto.'
      },
      footerSpacing: {
        label: 'Espaciado del Footer',
        tooltip: 'Espacio entre elementos del footer (badges, stats, botones). gap-2 = 8px, gap-4 = 16px'
      },
      footerAlignment: {
        label: 'Alineación del Footer',
        tooltip: 'Alineación horizontal del contenido del footer: start (izquierda), center (centro), end (derecha).'
      },

      // Live Indicator
      showLiveIndicator: {
        label: 'Mostrar Indicador Live',
        tooltip: 'Muestra el badge "EN VIVO" con animación pulsante (variant class).'
      },
      liveIndicatorPosition: {
        label: 'Posición Indicador Live',
        tooltip: 'Dónde colocar el indicador EN VIVO: top-left o top-right.'
      },
      liveIndicatorPulse: {
        label: 'Animación Pulse',
        tooltip: 'Activa la animación pulsante del punto rojo del indicador EN VIVO.'
      },

      // Meta & Special
      showMeta: {
        label: 'Mostrar Meta Info',
        tooltip: 'Muestra información adicional con íconos (participantes, duración, etc) en variant class.'
      },
      metaIcons: {
        label: 'Íconos en Meta',
        tooltip: 'Muestra íconos junto a la meta información.'
      },
      showParticipants: {
        label: 'Mostrar Participantes',
        tooltip: 'Muestra contador de participantes en clases en vivo.'
      },
      showDuration: {
        label: 'Mostrar Duración',
        tooltip: 'Muestra la duración de la clase/sesión.'
      },

      // Big Number (Stats variant)
      showBigNumber: {
        label: 'Mostrar Número Grande',
        tooltip: 'Muestra un número destacado grande (variant stats).'
      },
      bigNumberSize: {
        label: 'Tamaño Número Grande',
        tooltip: 'Tamaño de fuente del número grande en estadísticas.'
      },
      bigNumberWeight: {
        label: 'Peso Número Grande',
        tooltip: 'Grosor de fuente: normal, bold, extrabold, black.'
      },
      showTrend: {
        label: 'Mostrar Tendencia',
        tooltip: 'Muestra flecha de tendencia (↑/↓) en tarjetas de estadísticas.'
      },
      showComparisonText: {
        label: 'Texto de Comparación',
        tooltip: 'Muestra texto comparativo como "vs. mes anterior".'
      },

      // Content variant specific
      showThumbnail: {
        label: 'Mostrar Miniatura',
        tooltip: 'Muestra imagen miniatura del contenido.'
      },
      imageScaleOnHover: {
        label: 'Zoom en Hover',
        tooltip: 'Aplica efecto zoom a la imagen al hacer hover.'
      },
      imageScale: {
        label: 'Escala de Zoom',
        tooltip: 'Factor de escala para el zoom de imagen. 1.05 = 5% más grande.'
      },
      showProgress: {
        label: 'Mostrar Progreso',
        tooltip: 'Muestra barra de progreso del curso/contenido.'
      },
      showAuthor: {
        label: 'Mostrar Autor',
        tooltip: 'Muestra el nombre del autor/instructor del contenido.'
      },
    };

    const info = fieldInfo[property] || { label: property, tooltip: 'Sin descripción disponible' };
    const label = info.label;
    const tooltip = info.tooltip;

    // Boolean fields
    if (typeof value === 'boolean') {
      return (
        <div key={property} className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={value}
            onChange={(e) => updateConfig(variant, property, e.target.checked)}
            className="w-5 h-5"
            id={`${variant}-${property}`}
          />
          <label htmlFor={`${variant}-${property}`} className="text-sm font-medium flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
            {label}
            <div className="group relative">
              <HelpCircle size={14} className="text-gray-400 cursor-help" />
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none w-64 z-50">
                {tooltip}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900 dark:border-t-gray-700"></div>
              </div>
            </div>
          </label>
        </div>
      );
    }

    // Number fields
    if (typeof value === 'number') {
      return (
        <div key={property}>
          <label className="flex items-center gap-2 text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
            {label}: {value}px
            <div className="group relative">
              <HelpCircle size={14} className="text-gray-400 cursor-help" />
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none w-64 z-50">
                {tooltip}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900 dark:border-t-gray-700"></div>
              </div>
            </div>
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
    if (property === 'footerSpacing' || property === 'footerAlignment' || property === 'statsLayout' || property === 'liveIndicatorPosition') {
      const options = {
        footerSpacing: [
          { value: 'gap-1', label: 'gap-1 (4px)' },
          { value: 'gap-2', label: 'gap-2 (8px)' },
          { value: 'gap-3', label: 'gap-3 (12px)' },
          { value: 'gap-4', label: 'gap-4 (16px)' }
        ],
        footerAlignment: [
          { value: 'start', label: 'Inicio' },
          { value: 'center', label: 'Centro' },
          { value: 'end', label: 'Final' }
        ],
        statsLayout: [
          { value: 'horizontal', label: 'Horizontal' },
          { value: 'vertical', label: 'Vertical' }
        ],
        liveIndicatorPosition: [
          { value: 'top-left', label: 'Arriba Izquierda' },
          { value: 'top-right', label: 'Arriba Derecha' }
        ]
      };

      const selectOptions = options[property] || [];

      return (
        <div key={property}>
          <label className="flex items-center gap-2 text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
            {label}:
            <div className="group relative">
              <HelpCircle size={14} className="text-gray-400 cursor-help" />
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none w-64 z-50">
                {tooltip}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900 dark:border-t-gray-700"></div>
              </div>
            </div>
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
            {selectOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      );
    }

    // Text fields (default)
    return (
      <div key={property}>
        <label className="flex items-center gap-2 text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
          {label}:
          <div className="group relative">
            <HelpCircle size={14} className="text-gray-400 cursor-help" />
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none w-64 z-50">
              {tooltip}
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900 dark:border-t-gray-700"></div>
            </div>
          </div>
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
      '🎨 Header': ['headerHeight', 'headerBg', 'headerGradient', 'headerColor', 'headerImageFit'],
      '📦 Contenido': ['contentPadding', 'cardHeight', 'contentOverflow'],
      '✨ Hover': ['hoverEnabled', 'hoverTransform', 'hoverShadow', 'hoverBorderColor', 'imageScaleOnHover', 'imageScale'],
      '🔲 Normal': ['normalShadow', 'normalBorderColor'],
      '⏱️ Transiciones': ['transitionDuration', 'transitionTiming'],
      '🎯 Iconos & Avatares': ['showIcon', 'iconSize', 'showAvatar', 'avatarSize', 'avatarFontSize', 'showThumbnail'],
      '🏷️ Badges': ['showBadges', 'showRoleBadge', 'showStatusBadge', 'maxBadges'],
      '📊 Stats': ['showStats', 'statsLayout', 'showBigNumber', 'bigNumberSize', 'bigNumberWeight', 'showTrend', 'showComparisonText'],
      '📍 Footer': ['footerSticky', 'footerSpacing', 'footerAlignment'],
      '🎥 Live (Class)': ['showLiveIndicator', 'liveIndicatorPosition', 'liveIndicatorPulse', 'showMeta', 'metaIcons', 'showParticipants', 'showDuration'],
      '📚 Content': ['showProgress', 'showAuthor']
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

        {/* Global Stats - Mejoradas */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="p-5 rounded-xl hover:scale-105 transition-transform cursor-pointer" style={{ background: 'var(--color-bg-secondary)', border: '2px solid var(--color-border)' }}>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-green-500/10">
                <CheckCircle size={20} className="text-green-500" />
              </div>
              <div className="text-3xl font-black" style={{ color: 'var(--color-text-primary)' }}>
                {globalStats.universalCard.count}
              </div>
            </div>
            <div className="text-sm font-bold mb-1" style={{ color: 'var(--color-text-primary)' }}>
              UniversalCard Activos
            </div>
            <div className="text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
              Tarjetas usando el nuevo sistema universal. Estas son configurables desde aquí.
            </div>
          </div>

          <div className="p-5 rounded-xl hover:scale-105 transition-transform cursor-pointer" style={{ background: 'var(--color-bg-secondary)', border: '2px solid var(--color-warning-border)' }}>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-yellow-500/10">
                <AlertTriangle size={20} className="text-yellow-600" />
              </div>
              <div className="text-3xl font-black text-yellow-600">
                {globalStats.legacyCard.count}
              </div>
            </div>
            <div className="text-sm font-bold mb-1" style={{ color: 'var(--color-text-primary)' }}>
              Cards Legacy (.card)
            </div>
            <div className="text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
              Tarjetas antiguas con className="card". Deben migrarse a UniversalCard.
            </div>
          </div>

          <div className="p-5 rounded-xl hover:scale-105 transition-transform cursor-pointer" style={{ background: 'var(--color-bg-secondary)', border: '2px solid var(--color-border)' }}>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-blue-500/10">
                <Layers size={20} className="text-blue-600" />
              </div>
              <div className="text-3xl font-black text-blue-600">
                {globalStats.baseCard.count}
              </div>
            </div>
            <div className="text-sm font-bold mb-1" style={{ color: 'var(--color-text-primary)' }}>
              BaseCard Components
            </div>
            <div className="text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
              Componentes BaseCard (OK). No necesitan migración, son parte del design system.
            </div>
          </div>

          <div className="p-5 rounded-xl hover:scale-105 transition-transform cursor-pointer" style={{ background: 'var(--color-bg-secondary)', border: '2px solid var(--color-success-border)' }}>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-green-500/10">
                <Target size={20} className="text-green-600" />
              </div>
              <div className="text-3xl font-black text-green-600">
                {globalStats.migrationProgress}%
              </div>
            </div>
            <div className="text-sm font-bold mb-1" style={{ color: 'var(--color-text-primary)' }}>
              Progreso de Migración
            </div>
            <div className="text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
              Porcentaje de tarjetas legacy ya migradas al sistema UniversalCard.
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
            const usage = usageData[key] || { totalUsages: 0 };
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
                    <div className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>
                      {variantLabels[key]}
                    </div>
                    <div className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                      {usage.totalUsages} uso{usage.totalUsages !== 1 ? 's' : ''}
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
                  Ajusta los parámetros visuales de <span className="font-mono font-semibold">{variantLabels[selectedVariant]}</span>
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
              <h3 className="text-xl font-bold mb-2 flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
                <Search size={20} />
                Uso en la Aplicación
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                <strong>Ubicación y contexto:</strong> Esta sección muestra dónde se está usando actualmente el variant <span className="font-mono font-semibold">{selectedVariant}</span> en toda la aplicación.
                Cada entrada indica el archivo, la línea de código y el contexto de uso (ej: "Dashboard principal", "Lista de estudiantes", etc).
                Los cambios que hagas aquí afectarán <strong>todas estas ubicaciones</strong> instantáneamente.
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
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl font-bold flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
                    <Eye size={20} />
                    Preview en Vivo
                  </h3>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setPreviewMode('basic')}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                        previewMode === 'basic' ? 'bg-primary-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      Básico
                    </button>
                    <button
                      onClick={() => setPreviewMode('real-examples')}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                        previewMode === 'real-examples' ? 'bg-primary-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      Ejemplos Reales
                    </button>
                  </div>
                </div>
                <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  {previewMode === 'basic'
                    ? 'Visualización de prueba con datos de ejemplo'
                    : 'Ejemplos basados en tarjetas reales que existen en la app'}
                </p>
              </div>

              {/* Preview Mode: BASIC */}
              {previewMode === 'basic' && (
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
                      📋 Contenido Extendido
                    </div>
                    <UniversalCard
                      {...exampleData[selectedVariant]}
                      size="md"
                      description="Esta card tiene mucho más contenido para demostrar el sticky footer. Lorem ipsum dolor sit amet, consectetur adipiscing elit."
                      badges={[
                        ...(exampleData[selectedVariant].badges || []),
                        { variant: 'warning', children: 'Extra' },
                      ]}
                      customConfig={config[selectedVariant]}
                    />
                  </div>

                  {/* Nota explicativa */}
                  <div className="mt-4 p-3 rounded-lg" style={{ background: 'var(--color-bg-tertiary)', border: '1px dashed var(--color-border)' }}>
                    <div className="text-xs font-semibold mb-1" style={{ color: 'var(--color-text-primary)' }}>
                      💡 Vista Básica
                    </div>
                    <div className="text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                      Ejemplos de prueba con datos genéricos. Cambia a "Ejemplos Reales" para ver tarjetas basadas en casos reales de la app.
                    </div>
                  </div>
                </div>
              )}

              {/* Preview Mode: REAL EXAMPLES */}
              {previewMode === 'real-examples' && (
                <div className="space-y-4">
                  {realExamples[selectedVariant]?.map((example, idx) => (
                    <div key={idx}>
                      <div className="text-xs font-semibold mb-2 px-1 flex items-center gap-2" style={{ color: 'var(--color-text-secondary)' }}>
                        <Sparkles size={12} />
                        Ejemplo Real #{idx + 1}
                      </div>
                      <UniversalCard
                        {...example}
                        size="md"
                        customConfig={config[selectedVariant]}
                      />
                    </div>
                  ))}

                  {/* Nota explicativa */}
                  <div className="mt-4 p-3 rounded-lg" style={{ background: 'var(--color-bg-tertiary)', border: '1px dashed var(--color-border)' }}>
                    <div className="text-xs font-semibold mb-1" style={{ color: 'var(--color-text-primary)' }}>
                      ✨ Ejemplos Reales
                    </div>
                    <div className="text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                      Estos ejemplos están basados en tarjetas que realmente existen en la aplicación.
                      Los cambios que hagas se aplicarán a tarjetas similares en toda la app.
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* Fin del grid rediseñado */}
    </div>
  );
}

export default CardSystemTab;
