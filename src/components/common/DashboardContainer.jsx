import { spacing } from '../../config/designTokens';

/**
 * DashboardContainer Component
 *
 * Contenedor estandarizado para todos los dashboards y páginas principales.
 * Garantiza padding y background consistentes.
 *
 * @param {React.ReactNode} children - Contenido del dashboard
 * @param {string} className - Clases adicionales
 * @param {boolean} fullHeight - Ocupar altura completa (default: true)
 *
 * @example
 * <DashboardContainer>
 *   <SectionHeader title="Mi Dashboard" />
 *   {/* Contenido */}
 * </DashboardContainer>
 */
export function DashboardContainer({
  children,
  className = '',
  fullHeight = true,
}) {
  return (
    <div
      className={`
        ${spacing.dashboardPadding}
        ${fullHeight ? 'min-h-screen' : ''}
        ${className}
      `}
      style={{ background: 'var(--color-bg-primary)' }}
    >
      {children}
    </div>
  );
}

/**
 * DashboardSection Component
 *
 * Sección dentro de un dashboard con margen estandarizado.
 *
 * @example
 * <DashboardContainer>
 *   <DashboardSection>
 *     <SectionHeader title="Cursos" />
 *     {/* Grid de cursos */}
 *   </DashboardSection>
 *
 *   <DashboardSection>
 *     <SectionHeader title="Estadísticas" />
 *     {/* Gráficas */}
 *   </DashboardSection>
 * </DashboardContainer>
 */
export function DashboardSection({ children, className = '' }) {
  return (
    <section className={`${spacing.sectionMarginBottom} ${className}`}>
      {children}
    </section>
  );
}

/**
 * DashboardGrid Component
 *
 * Grid responsive estandarizado para cards en dashboards.
 *
 * @param {string} cols - Número de columnas (1-4)
 * @param {string} gap - Tamaño del gap (small | medium | large)
 *
 * @example
 * <DashboardGrid cols="3">
 *   <BaseCard>Card 1</BaseCard>
 *   <BaseCard>Card 2</BaseCard>
 *   <BaseCard>Card 3</BaseCard>
 * </DashboardGrid>
 */
export function DashboardGrid({
  children,
  cols = '3',
  gap = 'medium',
  className = '',
}) {
  // Mapeo de columnas responsive (mobile-first)
  const colsMap = {
    '1': 'grid-cols-1',
    '2': 'grid-cols-1 md:grid-cols-2',
    '3': 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    '4': 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  };

  // Mapeo de gaps
  const gapMap = {
    small: spacing.gridGapSmall,
    medium: spacing.gridGapMedium,
    large: spacing.gridGapLarge,
  };

  return (
    <div className={`grid ${colsMap[cols]} ${gapMap[gap]} ${className}`}>
      {children}
    </div>
  );
}

export default DashboardContainer;
