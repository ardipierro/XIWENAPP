/**
 * @fileoverview CardList - Layout en lista para cards
 * Cards apiladas verticalmente
 *
 * @module components/cards/CardList
 */

/**
 * CardList - Lista vertical de cards
 *
 * @example
 * <CardList>
 *   {items.map(item => <UniversalCard key={item.id} layout="horizontal" {...item} />)}
 * </CardList>
 */
export function CardList({
  children,
  gap = 'gap-4',  // Tailwind gap class
  className = '',
}) {
  return (
    <div className={`flex flex-col ${gap} ${className}`.trim()}>
      {children}
    </div>
  );
}

export default CardList;
