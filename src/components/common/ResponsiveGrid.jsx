/**
 * @fileoverview ResponsiveGrid - Sistema de grids responsive con auto-fit
 * Parte del Sistema de Diseño XIWENAPP
 *
 * @see .claude/RESPONSIVE_GRID_SYSTEM.md para documentación completa
 *
 * @module components/common/ResponsiveGrid
 */

import PropTypes from 'prop-types';

/**
 * ResponsiveGrid - Grid responsive que se adapta automáticamente al espacio disponible
 *
 * Utiliza CSS Grid con auto-fit y minmax() para crear layouts que:
 * - Se ajustan fluidamente a cualquier tamaño de pantalla
 * - Mantienen anchos mínimos garantizados (las tarjetas nunca se aplastan)
 * - No requieren breakpoints manuales
 *
 * @example
 * // Uso básico - tarjetas estándar
 * <ResponsiveGrid size="md" gap="4">
 *   {items.map(item => <Card key={item.id} {...item} />)}
 * </ResponsiveGrid>
 *
 * @example
 * // Badges pequeños
 * <ResponsiveGrid size="xs" gap="3">
 *   {badges.map(badge => <Badge key={badge.id} {...badge} />)}
 * </ResponsiveGrid>
 *
 * @example
 * // Stats grandes con clase adicional
 * <ResponsiveGrid size="xl" gap="6" className="mb-8">
 *   <StatCard icon={Users} title="Estudiantes" value="150" />
 *   <StatCard icon={Book} title="Cursos" value="25" />
 * </ResponsiveGrid>
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Contenido del grid (obligatorio)
 * @param {'xs' | 'sm' | 'md' | 'lg' | 'xl'} [props.size='md'] - Tamaño de las tarjetas
 * @param {string} [props.gap='4'] - Gap de Tailwind (1-12)
 * @param {string} [props.className=''] - Clases CSS adicionales
 * @returns {JSX.Element}
 */
export function ResponsiveGrid({
  children,
  size = 'md',
  gap = '4',
  className = ''
}) {
  // Mapeo de tamaños a clases CSS
  // Estas clases están definidas en src/globals.css:6548
  const sizeClasses = {
    xs: 'grid-responsive-cards-xs',  // 150px min - Badges, iconos
    sm: 'grid-responsive-cards-sm',  // 200px min - Tarjetas compactas
    md: 'grid-responsive-cards',     // 280px min - Tarjetas estándar (default)
    lg: 'grid-responsive-cards-lg',  // 320px min - Tarjetas con más contenido
    xl: 'grid-responsive-cards-xl'   // 400px min - Stats, dashboard cards
  };

  const gridClass = sizeClasses[size] || sizeClasses.md;

  return (
    <div className={`${gridClass} gap-${gap} ${className}`.trim()}>
      {children}
    </div>
  );
}

ResponsiveGrid.propTypes = {
  children: PropTypes.node.isRequired,
  size: PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'xl']),
  gap: PropTypes.string,
  className: PropTypes.string
};

/**
 * Guía rápida de uso:
 *
 * TAMAÑOS DISPONIBLES:
 * - xs (150px): Badges, avatares, mini iconos
 * - sm (200px): Tarjetas compactas, thumbnails
 * - md (280px): Tarjetas estándar (DEFAULT)
 * - lg (320px): Tarjetas con más contenido
 * - xl (400px): Stats cards, dashboard widgets
 *
 * GAPS RECOMENDADOS:
 * - gap="3": 0.75rem - Para elementos muy juntos
 * - gap="4": 1rem - Estándar (DEFAULT)
 * - gap="6": 1.5rem - Más espaciado
 * - gap="8": 2rem - Muy espaciado
 *
 * EJEMPLOS DE COMPORTAMIENTO:
 *
 * Pantalla 1920px con size="md" (280px):
 * → 6 columnas de tarjetas
 *
 * Pantalla 1200px (DevTools abierto) con size="md":
 * → 4 columnas de tarjetas
 *
 * Pantalla 768px (tablet) con size="md":
 * → 2 columnas de tarjetas
 *
 * Pantalla 375px (móvil) con size="md":
 * → 1 columna de tarjetas
 *
 * Las tarjetas NUNCA se aplastan por debajo del ancho mínimo.
 * El navegador calcula automáticamente cuántas columnas caben.
 */

export default ResponsiveGrid;
