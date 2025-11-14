/**
 * @fileoverview CardGrid - Layout en grid para cards
 * Mobile-first responsive grid
 *
 * @module components/cards/CardGrid
 */

import { getGridColumnsClass } from './cardConfig';

/**
 * CardGrid - Grid responsive para cards
 *
 * @example
 * <CardGrid columns={{ sm: 1, md: 2, lg: 3, xl: 4 }}>
 *   {items.map(item => <UniversalCard key={item.id} {...item} />)}
 * </CardGrid>
 *
 * @example
 * // Usar configuración predefinida
 * <CardGrid columnsType="compact">
 *   {items.map(item => <UniversalCard key={item.id} {...item} />)}
 * </CardGrid>
 */
export function CardGrid({
  children,
  columns,              // Custom columns: { base, sm, md, lg, xl }
  columnsType = 'default', // 'default' | 'compact' | 'wide'
  gap = 'gap-4 md:gap-6',  // Tailwind gap classes (responsive)
  className = '',
}) {
  // Si se pasa un objeto columns custom, generar las clases manualmente
  const gridClasses = columns
    ? `grid ${columns.base || 'grid-cols-1'} ${columns.sm || ''} ${columns.md || ''} ${
        columns.lg || ''
      } ${columns.xl || ''}`
    : getGridColumnsClass(columnsType);

  return (
    <div className={`${gridClasses} ${gap} ${className}`.trim()}>
      {children}
    </div>
  );
}

export default CardGrid;
