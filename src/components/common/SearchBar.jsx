import { Search, X, Grid, List, Table } from 'lucide-react';

/**
 * SearchBar - Barra de búsqueda reutilizable con selector de vista opcional
 *
 * @param {Object} props
 * @param {string} props.value - Valor actual del search term
 * @param {Function} props.onChange - Handler para cambios en el input
 * @param {string} [props.placeholder='Buscar...'] - Placeholder del input
 * @param {string} [props.className=''] - Clases adicionales
 * @param {string} [props.viewMode] - Modo de vista actual ('table', 'grid' o 'list')
 * @param {Function} [props.onViewModeChange] - Handler para cambiar modo de vista
 * @param {Array<string>} [props.viewModes=['grid', 'list']] - Modos de vista disponibles
 */
function SearchBar({
  value,
  onChange,
  placeholder = 'Buscar...',
  className = '',
  viewMode,
  onViewModeChange,
  viewModes = ['grid', 'list']
}) {
  const handleClear = () => {
    onChange('');
  };

  const showViewToggle = viewMode && onViewModeChange;

  if (!showViewToggle) {
    // Modo sin view toggle (solo búsqueda)
    return (
      <div className={`relative ${className}`}>
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
          <Search size={20} strokeWidth={2} />
        </div>
        <input
          type="text"
          name="search-bar-unique"
          autoComplete="off"
          value={value}
          onChange={(e) => {
            e.stopPropagation();
            onChange(e.target.value);
          }}
          onInput={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          placeholder={placeholder}
          className="input w-full pl-10 pr-10"
        />
        {value && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
            aria-label="Limpiar búsqueda"
          >
            <X size={18} strokeWidth={2} />
          </button>
        )}
      </div>
    );
  }

  // Modo con view toggle integrado (todo en un solo contenedor)
  return (
    <div className={`input ${className}`} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', flexWrap: 'nowrap', overflow: 'hidden' }}>
      {/* Search Icon */}
      <Search size={20} strokeWidth={2} className="text-gray-400 dark:text-gray-500" style={{ flexShrink: 0 }} />

      {/* Input sin bordes ni fondo */}
      <input
        type="text"
        name="search-bar-unique-inline"
        autoComplete="off"
        value={value}
        onChange={(e) => {
          e.stopPropagation();
          onChange(e.target.value);
        }}
        onInput={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        placeholder={placeholder}
        style={{
          flex: 1,
          border: 'none',
          background: 'transparent',
          outline: 'none',
          padding: 0,
          color: 'inherit',
          fontSize: 'inherit',
          minWidth: 0
        }}
      />

      {/* Clear button */}
      {value && (
        <button
          onClick={handleClear}
          className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
          aria-label="Limpiar búsqueda"
          style={{ flexShrink: 0, padding: '4px' }}
        >
          <X size={18} strokeWidth={2} />
        </button>
      )}

      {/* Divider - oculto en móvil */}
      <div className="searchbar-divider" style={{ width: '1px', height: '24px', background: 'var(--color-border)', flexShrink: 0 }} />

      {/* View Toggle buttons */}
      <div style={{ display: 'flex', gap: '2px', flexShrink: 0 }}>
        {viewModes.includes('table') && (
          <button
            className={`view-toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
            onClick={() => onViewModeChange('table')}
            title="Vista de tabla"
          >
            <Table size={18} />
          </button>
        )}
        {viewModes.includes('grid') && (
          <button
            className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => onViewModeChange('grid')}
            title="Vista de cuadrícula"
          >
            <Grid size={18} />
          </button>
        )}
        {viewModes.includes('list') && (
          <button
            className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => onViewModeChange('list')}
            title="Vista de lista"
          >
            <List size={18} />
          </button>
        )}
      </div>
    </div>
  );
}

export default SearchBar;
