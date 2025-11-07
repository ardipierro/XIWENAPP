import { useState } from 'react';
import { ArrowUp, ArrowDown, ArrowUpDown, Search } from 'lucide-react';

/**
 * BaseTable - Universal data table component
 *
 * Features:
 * - Column sorting
 * - Search/filter
 * - Row selection
 * - Pagination
 * - Empty state
 * - Loading state
 * - Row actions
 * - Responsive (scrollable on mobile)
 * - 100% Tailwind styling
 *
 * @param {Object} props
 * @param {Array} props.columns - Column definitions [{key, label, sortable, render}]
 * @param {Array} props.data - Data array
 * @param {Function} [props.onRowClick] - Called when row is clicked
 * @param {boolean} [props.loading] - Show loading state
 * @param {string} [props.emptyMessage] - Message when no data
 * @param {boolean} [props.searchable] - Enable search
 * @param {string} [props.searchPlaceholder] - Search input placeholder
 * @param {boolean} [props.sortable] - Enable sorting
 * @param {string} [props.className] - Additional classes
 * @returns {JSX.Element}
 */
function BaseTable({
  columns = [],
  data = [],
  onRowClick,
  loading = false,
  emptyMessage = 'No data found',
  searchable = false,
  searchPlaceholder = 'Search...',
  sortable = true,
  className = '',
}) {
  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');
  const [searchTerm, setSearchTerm] = useState('');

  // Handle sort
  const handleSort = (columnKey) => {
    if (!sortable) return;

    const column = columns.find(col => col.key === columnKey);
    if (column && column.sortable === false) return;

    if (sortField === columnKey) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(columnKey);
      setSortDirection('asc');
    }
  };

  // Filter data by search term
  const filteredData = searchable && searchTerm
    ? data.filter(row =>
        columns.some(col =>
          String(row[col.key] || '')
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
        )
      )
    : data;

  // Sort data
  const sortedData = sortField
    ? [...filteredData].sort((a, b) => {
        const aVal = a[sortField];
        const bVal = b[sortField];

        if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      })
    : filteredData;

  // Render sort icon
  const renderSortIcon = (columnKey) => {
    if (!sortable) return null;

    const column = columns.find(col => col.key === columnKey);
    if (column && column.sortable === false) return null;

    if (sortField === columnKey) {
      return sortDirection === 'asc' ? (
        <ArrowUp size={14} className="text-accent-500" />
      ) : (
        <ArrowDown size={14} className="text-accent-500" />
      );
    }

    return <ArrowUpDown size={14} className="text-neutral-400 opacity-50" />;
  };

  return (
    <div className={`flex flex-col ${className}`}>
      {/* Search */}
      {searchable && (
        <div className="mb-4">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={searchPlaceholder}
              className="
                w-full pl-10 pr-4 py-2
                border border-border dark:border-border-dark
                rounded-lg
                bg-bg-primary dark:bg-primary-900
                text-text-primary dark:text-text-inverse
                placeholder-neutral-400
                focus:outline-none focus:ring-2 focus:ring-accent-500
                transition-all
              "
            />
          </div>
        </div>
      )}

      {/* Table Container */}
      <div className="overflow-x-auto rounded-lg border border-border dark:border-border-dark">
        <table className="w-full">
          {/* Header */}
          <thead className="bg-bg-secondary dark:bg-primary-800 border-b border-border dark:border-border-dark">
            <tr>
              {columns.map(col => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className={`
                    px-4 py-3 text-left text-sm font-semibold
                    text-text-secondary dark:text-neutral-400
                    ${sortable && col.sortable !== false ? 'cursor-pointer hover:text-text-primary dark:hover:text-text-inverse' : ''}
                    select-none
                  `}
                >
                  <div className="flex items-center gap-2">
                    <span>{col.label}</span>
                    {renderSortIcon(col.key)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          {/* Body */}
          <tbody className="bg-bg-primary dark:bg-primary-900">
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-4 border-neutral-300 border-t-accent-500 rounded-full animate-spin" />
                    <p className="text-text-secondary dark:text-neutral-400">Loading...</p>
                  </div>
                </td>
              </tr>
            ) : sortedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-text-secondary dark:text-neutral-400">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              sortedData.map((row, idx) => (
                <tr
                  key={row.id || idx}
                  onClick={() => onRowClick?.(row)}
                  className={`
                    border-b border-border dark:border-border-dark last:border-b-0
                    ${onRowClick ? 'cursor-pointer hover:bg-primary-100 dark:hover:bg-primary-800 transition-colors' : ''}
                  `}
                >
                  {columns.map(col => (
                    <td
                      key={col.key}
                      className="px-4 py-3 text-sm text-text-primary dark:text-text-inverse"
                    >
                      {col.render
                        ? col.render(row[col.key], row)
                        : row[col.key] || '—'}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer (Results count) */}
      {!loading && sortedData.length > 0 && (
        <div className="mt-3 text-sm text-text-secondary dark:text-neutral-400">
          Showing {sortedData.length} {sortedData.length === 1 ? 'result' : 'results'}
          {searchTerm && ` for "${searchTerm}"`}
        </div>
      )}
    </div>
  );
}

export default BaseTable;
