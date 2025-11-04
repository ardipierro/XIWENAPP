import { Search, X } from 'lucide-react';

/**
 * SearchBar - Barra de búsqueda reutilizable
 *
 * @param {Object} props
 * @param {string} props.value - Valor actual del search term
 * @param {Function} props.onChange - Handler para cambios en el input
 * @param {string} [props.placeholder='Buscar...'] - Placeholder del input
 * @param {string} [props.className=''] - Clases adicionales
 */
function SearchBar({
  value,
  onChange,
  placeholder = 'Buscar...',
  className = ''
}) {
  const handleClear = () => {
    onChange('');
  };

  return (
    <div className={`relative ${className}`}>
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
        <Search size={20} strokeWidth={2} />
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
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

export default SearchBar;
