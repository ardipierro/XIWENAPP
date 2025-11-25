import { useState, useRef, useEffect } from 'react';
import { Search, X, Grid, List, Table, SlidersHorizontal, ChevronDown, Check } from 'lucide-react';

/**
 * SearchBar - Barra de búsqueda unificada con filtros y selector de vista
 *
 * @param {Object} props
 * @param {string} props.value - Valor actual del search term
 * @param {Function} props.onChange - Handler para cambios en el input
 * @param {string} [props.placeholder='Buscar...'] - Placeholder del input
 * @param {string} [props.className=''] - Clases adicionales
 * @param {string} [props.viewMode] - Modo de vista actual ('table', 'grid' o 'list')
 * @param {Function} [props.onViewModeChange] - Handler para cambiar modo de vista
 * @param {Array<string>} [props.viewModes=['grid', 'list']] - Modos de vista disponibles
 * @param {Array<Object>} [props.filters] - Configuración de filtros
 * @param {string} props.filters[].key - Identificador único del filtro
 * @param {string} props.filters[].label - Etiqueta del filtro
 * @param {string} props.filters[].value - Valor actual del filtro
 * @param {Function} props.filters[].onChange - Handler para cambios en el filtro
 * @param {Array<Object>} props.filters[].options - Opciones del filtro [{value, label, icon?}]
 * @param {string} [props.filters[].defaultValue='all'] - Valor que significa "sin filtrar"
 */
function SearchBar({
  value,
  onChange,
  placeholder = 'Buscar...',
  className = '',
  viewMode,
  onViewModeChange,
  viewModes = ['grid', 'list'],
  filters = []
}) {
  const [showFilterPopover, setShowFilterPopover] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const popoverRef = useRef(null);
  const filterButtonRef = useRef(null);

  // Cerrar popover al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target) &&
          filterButtonRef.current && !filterButtonRef.current.contains(event.target)) {
        setShowFilterPopover(false);
      }
      // Cerrar dropdown si click fuera
      if (openDropdown && !event.target.closest('.filter-dropdown-container')) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openDropdown]);

  const handleClear = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    onChange('');
  };

  // Contar filtros activos (que no tienen el valor por defecto)
  const activeFiltersCount = filters.filter(f => {
    const defaultVal = f.defaultValue || 'all';
    return f.value !== defaultVal;
  }).length;

  // Obtener label de una opción por su valor
  const getOptionLabel = (filter, value) => {
    const option = filter.options.find(o => o.value === value);
    return option ? option.label : value;
  };

  // Limpiar todos los filtros
  const handleClearAllFilters = () => {
    filters.forEach(filter => {
      const defaultVal = filter.defaultValue || 'all';
      filter.onChange(defaultVal);
    });
    setShowFilterPopover(false);
  };

  const showViewToggle = viewMode && onViewModeChange;
  const hasFilters = filters.length > 0;

  // Modo simple sin view toggle ni filtros
  if (!showViewToggle && !hasFilters) {
    return (
      <div className={`relative ${className}`}>
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
          <Search size={20} strokeWidth={2} />
        </div>
        <input
          type="text"
          name="search-bar-unique"
          autoComplete="new-password"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
          data-form-type="other"
          data-lpignore="true"
          value={value}
          onChange={(e) => {
            e.stopPropagation();
            onChange(e.target.value);
          }}
          onInput={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          onFocus={(e) => e.stopPropagation()}
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

  // Modo completo con filtros y/o view toggle
  return (
    <div className={`searchbar-unified ${className}`}>
      {/* Contenedor principal */}
      <div className="searchbar-container input">
        {/* Search Icon */}
        <Search size={20} strokeWidth={2} className="searchbar-icon text-gray-400 dark:text-gray-500" />

        {/* Input */}
        <input
          type="text"
          name="search-bar-unified"
          autoComplete="new-password"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
          data-form-type="other"
          data-lpignore="true"
          value={value}
          onChange={(e) => {
            e.stopPropagation();
            onChange(e.target.value);
          }}
          onInput={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          onFocus={(e) => e.stopPropagation()}
          placeholder={placeholder}
          className="searchbar-input"
        />

        {/* Clear search button */}
        {value && (
          <button
            onClick={handleClear}
            className="searchbar-clear text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
            aria-label="Limpiar búsqueda"
          >
            <X size={18} strokeWidth={2} />
          </button>
        )}

        {/* Divider antes de filtros */}
        {(hasFilters || showViewToggle) && (
          <div className="searchbar-divider" />
        )}

        {/* Filtros Desktop - Inline dropdowns */}
        {hasFilters && (
          <div className="searchbar-filters-desktop">
            {filters.map((filter) => (
              <FilterDropdown
                key={filter.key}
                filter={filter}
                isOpen={openDropdown === filter.key}
                onToggle={() => setOpenDropdown(openDropdown === filter.key ? null : filter.key)}
                onClose={() => setOpenDropdown(null)}
                getOptionLabel={getOptionLabel}
              />
            ))}
          </div>
        )}

        {/* Filtros Mobile - Botón con popover */}
        {hasFilters && (
          <div className="searchbar-filters-mobile">
            <button
              ref={filterButtonRef}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowFilterPopover(!showFilterPopover);
              }}
              className={`searchbar-filter-btn ${activeFiltersCount > 0 ? 'active' : ''}`}
              title="Filtros"
            >
              <SlidersHorizontal size={18} strokeWidth={2} />
              {activeFiltersCount > 0 && (
                <span className="searchbar-filter-badge">{activeFiltersCount}</span>
              )}
            </button>
          </div>
        )}

        {/* Divider antes de vistas */}
        {showViewToggle && hasFilters && (
          <div className="searchbar-divider hidden-mobile" />
        )}

        {/* View Toggle buttons */}
        {showViewToggle && (
          <div className="searchbar-views">
            {viewModes.includes('table') && (
              <button
                className={`view-toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onViewModeChange('table');
                }}
                title="Vista de tabla"
              >
                <Table size={18} />
              </button>
            )}
            {viewModes.includes('grid') && (
              <button
                className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onViewModeChange('grid');
                }}
                title="Vista de cuadrícula"
              >
                <Grid size={18} />
              </button>
            )}
            {viewModes.includes('list') && (
              <button
                className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onViewModeChange('list');
                }}
                title="Vista de lista"
              >
                <List size={18} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Filter Popover (Mobile) */}
      {showFilterPopover && hasFilters && (
        <div ref={popoverRef} className="searchbar-popover">
          <div className="searchbar-popover-header">
            <span className="searchbar-popover-title">Filtros</span>
            {activeFiltersCount > 0 && (
              <button
                onClick={handleClearAllFilters}
                className="searchbar-popover-clear"
              >
                Limpiar todo
              </button>
            )}
          </div>
          <div className="searchbar-popover-content">
            {filters.map((filter) => (
              <div key={filter.key} className="searchbar-popover-filter">
                <label className="searchbar-popover-label">{filter.label}</label>
                <select
                  value={filter.value}
                  onChange={(e) => filter.onChange(e.target.value)}
                  className="searchbar-popover-select input"
                >
                  {filter.options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
          <div className="searchbar-popover-footer">
            <button
              onClick={() => setShowFilterPopover(false)}
              className="searchbar-popover-apply"
            >
              Aplicar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * FilterDropdown - Dropdown individual para un filtro (Desktop)
 */
function FilterDropdown({ filter, isOpen, onToggle, onClose, getOptionLabel }) {
  const dropdownRef = useRef(null);
  const defaultVal = filter.defaultValue || 'all';
  const isActive = filter.value !== defaultVal;
  const currentLabel = getOptionLabel(filter, filter.value);

  // Cerrar con Escape
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const handleSelect = (value) => {
    filter.onChange(value);
    onClose();
  };

  const handleClear = (e) => {
    e.stopPropagation();
    filter.onChange(defaultVal);
  };

  return (
    <div className="filter-dropdown-container" ref={dropdownRef}>
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onToggle();
        }}
        className={`filter-dropdown-trigger ${isActive ? 'active' : ''}`}
      >
        <span className="filter-dropdown-label">
          {isActive ? currentLabel : filter.label}
        </span>
        {isActive ? (
          <X
            size={14}
            strokeWidth={2}
            className="filter-dropdown-clear"
            onClick={handleClear}
          />
        ) : (
          <ChevronDown size={14} strokeWidth={2} className="filter-dropdown-arrow" />
        )}
      </button>

      {isOpen && (
        <div className="filter-dropdown-menu">
          {filter.options.map((option) => (
            <button
              key={option.value}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleSelect(option.value);
              }}
              className={`filter-dropdown-option ${filter.value === option.value ? 'selected' : ''}`}
            >
              <span className="filter-dropdown-option-label">{option.label}</span>
              {filter.value === option.value && (
                <Check size={14} strokeWidth={2} className="filter-dropdown-check" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default SearchBar;
