/**
 * @fileoverview CardTable - Layout en tabla para cards
 * Tabla responsive con estilos consistentes
 *
 * @module components/cards/CardTable
 */

/**
 * CardTable - Tabla para mostrar datos de cards
 *
 * @example
 * <CardTable
 *   headers={['Nombre', 'Email', 'Rol', 'Créditos', 'Acciones']}
 * >
 *   {items.map(item => (
 *     <tr key={item.id}>
 *       <td>{item.name}</td>
 *       <td>{item.email}</td>
 *       <td>{item.role}</td>
 *       <td>{item.credits}</td>
 *       <td>
 *         <BaseButton size="sm">Ver</BaseButton>
 *       </td>
 *     </tr>
 *   ))}
 * </CardTable>
 */
export function CardTable({
  children,
  headers = [],
  className = '',
  onSort,           // Callback para ordenamiento: (field) => void
  sortField,        // Campo actual de ordenamiento
  sortDirection = 'asc', // 'asc' | 'desc'
}) {
  /**
   * Handle column header click (para ordenamiento)
   */
  const handleHeaderClick = (field, index) => {
    if (onSort && field) {
      onSort(field);
    }
  };

  return (
    <div
      className={`overflow-x-auto rounded-xl ${className}`.trim()}
      style={{
        border: '1px solid var(--color-border)',
      }}
    >
      <table className="w-full">
        {/* Table Head */}
        {headers.length > 0 && (
          <thead
            style={{
              backgroundColor: 'var(--color-bg-tertiary)',
              borderBottom: '1px solid var(--color-border)',
            }}
          >
            <tr>
              {headers.map((header, index) => {
                const field = typeof header === 'object' ? header.field : null;
                const label = typeof header === 'object' ? header.label : header;
                const sortable = typeof header === 'object' ? header.sortable : false;
                const isSorted = sortField === field;

                return (
                  <th
                    key={index}
                    className={`px-4 py-3 text-left text-sm font-semibold ${
                      sortable ? 'cursor-pointer hover:bg-opacity-80' : ''
                    }`}
                    style={{ color: 'var(--color-text-primary)' }}
                    onClick={() => sortable && handleHeaderClick(field, index)}
                  >
                    <div className="flex items-center gap-2">
                      <span>{label}</span>
                      {sortable && (
                        <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                          {isSorted ? (sortDirection === 'asc' ? '↑' : '↓') : '↕'}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
        )}

        {/* Table Body */}
        <tbody
          style={{
            backgroundColor: 'var(--color-bg-secondary)',
          }}
        >
          {children}
        </tbody>
      </table>
    </div>
  );
}

/**
 * CardTableRow - Componente auxiliar para filas de tabla
 * Aplica estilos consistentes
 */
export function CardTableRow({ children, onClick, className = '' }) {
  return (
    <tr
      className={`transition-colors ${onClick ? 'cursor-pointer hover:bg-opacity-80' : ''} ${className}`}
      onClick={onClick}
      style={{
        borderBottom: '1px solid var(--color-border)',
      }}
    >
      {children}
    </tr>
  );
}

/**
 * CardTableCell - Componente auxiliar para celdas de tabla
 * Aplica estilos consistentes
 */
export function CardTableCell({ children, className = '', style = {} }) {
  return (
    <td
      className={`px-4 py-3 text-sm ${className}`}
      style={{
        color: 'var(--color-text-secondary)',
        ...style,
      }}
    >
      {children}
    </td>
  );
}

export default CardTable;
