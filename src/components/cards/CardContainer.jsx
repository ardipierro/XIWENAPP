/**
 * @fileoverview CardContainer - Wrapper inteligente para cards con view modes
 * Maneja: grid/list/table, loading, empty states
 *
 * @module components/cards/CardContainer
 */

import { BaseLoading, BaseEmptyState } from '../common';
import CardGrid from './CardGrid';
import CardList from './CardList';
import CardTable from './CardTable';

/**
 * CardContainer - Contenedor inteligente con múltiples modos de vista
 *
 * Maneja automáticamente:
 * - Grid/List/Table layouts
 * - Loading states
 * - Empty states
 * - Responsive behavior
 * - Auto-aplica layout horizontal/vertical según viewMode
 *
 * @example
 * // ⭐ FORMA RECOMENDADA - CardContainer aplica automáticamente el layout
 * <CardContainer
 *   items={users}
 *   viewMode="grid"  // o "list"
 *   renderCard={(user, viewMode) => (  // ← viewMode pasado automáticamente
 *     <UniversalCard
 *       key={user.id}
 *       variant="user"
 *       layout={viewMode === 'list' ? 'horizontal' : 'vertical'}  // Auto
 *       title={user.name}
 *       {...user}
 *     />
 *   )}
 *   emptyState={
 *     <BaseEmptyState
 *       icon={Users}
 *       title="No hay usuarios"
 *       action={<BaseButton onClick={handleCreate}>Crear Usuario</BaseButton>}
 *     />
 *   }
 * />
 *
 * @example
 * // Con table mode
 * <CardContainer
 *   items={users}
 *   viewMode="table"
 *   renderTableRow={(user) => (
 *     <tr key={user.id}>
 *       <td>{user.name}</td>
 *       <td>{user.email}</td>
 *     </tr>
 *   )}
 *   tableHeaders={['Nombre', 'Email', 'Rol']}
 * />
 */
export function CardContainer({
  // Data
  items = [],

  // View Mode
  viewMode = 'grid',        // 'grid' | 'list' | 'table'

  // Grid Configuration
  columns,                  // Custom columns: { base, sm, md, lg, xl }
  columnsType = 'default',  // 'default' | 'compact' | 'wide'
  gap,                      // Custom gap (Tailwind classes)

  // Render Functions
  renderCard,               // (item, index) => JSX - Para grid/list
  renderTableRow,           // (item, index) => JSX - Para table

  // Table Configuration
  tableHeaders = [],        // Array of headers: ['Name', 'Email'] o [{ label, field, sortable }]
  onSort,                   // Callback para ordenamiento
  sortField,
  sortDirection,

  // States
  loading = false,
  error = null,

  // Empty State
  emptyState,               // Custom empty state JSX
  emptyIcon,                // Icon for default empty state
  emptyTitle = 'No hay elementos',
  emptyDescription = '',
  emptyAction,              // Action button for default empty state

  // Style
  className = '',
  containerClassName = '',

  // Advanced
  loadingText = 'Cargando...',
  loadingVariant = 'fullscreen',
}) {
  /**
   * Render Loading State
   */
  if (loading) {
    return (
      <div className={containerClassName}>
        <BaseLoading variant={loadingVariant} text={loadingText} />
      </div>
    );
  }

  /**
   * Render Error State
   */
  if (error) {
    return (
      <div className={containerClassName}>
        <BaseEmptyState
          icon={emptyIcon}
          title="Error al cargar datos"
          description={error.message || error}
          size="lg"
        />
      </div>
    );
  }

  /**
   * Render Empty State
   */
  if (items.length === 0) {
    // Custom empty state
    if (emptyState) {
      return <div className={containerClassName}>{emptyState}</div>;
    }

    // Default empty state
    return (
      <div className={containerClassName}>
        <BaseEmptyState
          icon={emptyIcon}
          title={emptyTitle}
          description={emptyDescription}
          action={emptyAction}
          size="lg"
        />
      </div>
    );
  }

  /**
   * Render Grid View
   */
  if (viewMode === 'grid') {
    if (!renderCard) {
      console.error('CardContainer: renderCard function is required for grid view');
      return null;
    }

    return (
      <div className={containerClassName}>
        <CardGrid
          columns={columns}
          columnsType={columnsType}
          gap={gap}
          className={className}
        >
          {items.map((item, index) => renderCard(item, index, 'grid'))}
        </CardGrid>
      </div>
    );
  }

  /**
   * Render List View
   * ⭐ NUEVO: Pasa 'list' como tercer parámetro para que renderCard
   * pueda aplicar layout="horizontal" automáticamente
   */
  if (viewMode === 'list') {
    if (!renderCard) {
      console.error('CardContainer: renderCard function is required for list view');
      return null;
    }

    return (
      <div className={containerClassName}>
        <CardList gap={gap || 'gap-3'} className={className}>
          {items.map((item, index) => renderCard(item, index, 'list'))}
        </CardList>
      </div>
    );
  }

  /**
   * Render Table View
   */
  if (viewMode === 'table') {
    if (!renderTableRow) {
      console.error('CardContainer: renderTableRow function is required for table view');
      return null;
    }

    return (
      <div className={containerClassName}>
        <CardTable
          headers={tableHeaders}
          onSort={onSort}
          sortField={sortField}
          sortDirection={sortDirection}
          className={className}
        >
          {items.map((item, index) => renderTableRow(item, index))}
        </CardTable>
      </div>
    );
  }

  // Fallback
  console.error(`CardContainer: Invalid viewMode "${viewMode}"`);
  return null;
}

export default CardContainer;
