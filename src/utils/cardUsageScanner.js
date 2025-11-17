/**
 * @fileoverview Card Usage Scanner - Escanea la codebase para encontrar dónde se usan variants de UniversalCard
 * @module utils/cardUsageScanner
 */

/**
 * Escanea archivos buscando uso de UniversalCard variants
 *
 * Busca patrones como:
 * - <UniversalCard variant="user" ...
 * - variant: 'user'
 * - variant="user"
 *
 * @returns {Object} Mapa de uso por variant
 */
export function scanCardUsage() {
  // NOTA: En producción, esto se haría en el servidor
  // Por ahora, retornamos datos hardcoded basados en análisis manual

  return {
    default: {
      variant: 'default',
      totalUsages: 3,
      usedIn: [
        {
          file: 'src/components/UniversalDashboard.jsx',
          component: 'UniversalDashboard',
          line: 245,
          context: 'Quick access cards en dashboard'
        },
        {
          file: 'src/components/settings/CardSystemTab.jsx',
          component: 'CardSystemTab',
          line: 419,
          context: 'Preview de ejemplo'
        }
      ]
    },

    user: {
      variant: 'user',
      totalUsages: 0,
      usedIn: [],
      potentialMigrations: [
        {
          file: 'src/components/UniversalUserManager.jsx',
          currentImplementation: 'Custom cards con div',
          line: 346,
          migrationPriority: 'high'
        }
      ]
    },

    class: {
      variant: 'class',
      totalUsages: 2,
      usedIn: [
        {
          file: 'src/components/LiveClassRoom.jsx',
          component: 'LiveClassCard',
          line: 123,
          context: 'Cards de clases en vivo'
        },
        {
          file: 'src/components/ClassScheduleManager.jsx',
          component: 'ScheduleCard',
          line: 302,
          context: 'Schedule cards (usa clase .schedule-card)'
        }
      ]
    },

    content: {
      variant: 'content',
      totalUsages: 4,
      usedIn: [
        {
          file: 'src/components/UnifiedContentManager.jsx',
          component: 'ContentCard',
          line: 156,
          context: 'Galería de contenidos/cursos'
        },
        {
          file: 'src/components/student/MyCourses.jsx',
          component: 'CourseCard',
          line: 89,
          context: 'Mis cursos del estudiante'
        }
      ]
    },

    stats: {
      variant: 'stats',
      totalUsages: 8,
      usedIn: [
        {
          file: 'src/components/AnalyticsDashboard.jsx',
          component: 'AnalyticsCard',
          line: 68,
          context: '3 cards de estadísticas (usa clase .card)'
        },
        {
          file: 'src/components/TeacherDashboard.jsx',
          component: 'StatsOverview',
          line: 234,
          context: 'Stats del profesor'
        }
      ]
    },

    compact: {
      variant: 'compact',
      totalUsages: 1,
      usedIn: [
        {
          file: 'src/components/SideMenu.jsx',
          component: 'QuickStats',
          line: 445,
          context: 'Mini stats en sidebar'
        }
      ]
    }
  };
}

/**
 * Analiza el impacto de cambiar una configuración de variant
 *
 * @param {string} variant - Nombre del variant
 * @param {string} property - Propiedad que se está cambiando
 * @param {*} newValue - Nuevo valor
 * @returns {Object} Análisis de impacto
 */
export function analyzeImpact(variant, property, newValue) {
  const usage = scanCardUsage()[variant];

  if (!usage) {
    return {
      severity: 'low',
      affectedComponents: 0,
      warnings: [],
      suggestions: []
    };
  }

  const affectedComponents = usage.totalUsages;
  const warnings = [];
  const suggestions = [];

  // Análisis específico por propiedad
  if (property === 'hoverEnabled' && newValue === false) {
    warnings.push('⚠️ Deshabilitar hover puede afectar la UX en cards clickeables');
  }

  if (property === 'footerSticky' && newValue === false) {
    warnings.push('⚠️ Deshabilitar sticky footer puede descuadrar grids con cards de diferentes alturas');
  }

  if (property === 'contentPadding') {
    const currentPadding = parseInt(newValue);
    if (currentPadding < 16) {
      warnings.push('⚠️ Padding menor a 16px puede hacer que el contenido se vea apretado');
    }
    if (currentPadding > 32) {
      warnings.push('⚠️ Padding mayor a 32px puede desperdiciar espacio en mobile');
    }
  }

  // Determinar severidad
  let severity = 'low';
  if (affectedComponents > 10) {
    severity = 'high';
  } else if (affectedComponents > 5) {
    severity = 'medium';
  }

  if (warnings.length > 0) {
    severity = severity === 'low' ? 'medium' : 'high';
  }

  // Sugerencias
  if (affectedComponents > 0) {
    suggestions.push(`💡 Verifica los ${affectedComponents} componente(s) afectado(s) después de guardar`);
  }

  return {
    severity,
    affectedComponents,
    warnings,
    suggestions,
    files: usage.usedIn.map(u => u.file)
  };
}

/**
 * Busca potenciales componentes que deberían migrar a UniversalCard
 *
 * @returns {Array} Lista de archivos candidatos a migración
 */
export function findMigrationCandidates() {
  return [
    {
      file: 'src/components/UniversalUserManager.jsx',
      reason: 'Usa divs con className="card" en lugar de UniversalCard',
      suggestedVariant: 'user',
      priority: 'high',
      estimatedTime: '15 min'
    },
    {
      file: 'src/components/AnalyticsDashboard.jsx',
      reason: 'Usa divs con className="card" para stats',
      suggestedVariant: 'stats',
      priority: 'medium',
      estimatedTime: '10 min'
    },
    {
      file: 'src/components/StudentAssignmentsView.jsx',
      reason: 'Usa divs con className="card" para assignments',
      suggestedVariant: 'content',
      priority: 'medium',
      estimatedTime: '15 min'
    }
    // ... más candidatos del MIGRATION_ANALYSIS.md
  ];
}

/**
 * Obtiene estadísticas globales del uso de cards
 *
 * @returns {Object} Estadísticas globales
 */
export function getGlobalStats() {
  const usage = scanCardUsage();

  let totalUniversalCardUsages = 0;
  let totalComponents = 0;

  Object.values(usage).forEach(variant => {
    totalUniversalCardUsages += variant.totalUsages;
    totalComponents += variant.usedIn.length;
  });

  const legacyCardUsages = 48; // De grep anterior
  const baseCardUsages = 35; // De grep anterior

  return {
    universalCard: {
      count: totalUniversalCardUsages,
      components: totalComponents
    },
    legacyCard: {
      count: legacyCardUsages,
      needsMigration: true
    },
    baseCard: {
      count: baseCardUsages,
      needsMigration: false // BaseCard está OK
    },
    totalCards: totalUniversalCardUsages + legacyCardUsages + baseCardUsages,
    migrationProgress: Math.round((totalUniversalCardUsages / (totalUniversalCardUsages + legacyCardUsages)) * 100)
  };
}
