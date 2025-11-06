import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

/**
 * BaseDropdown - Componente dropdown/menú desplegable base (100% Tailwind)
 *
 * Para menús contextuales, menús de acciones, etc.
 *
 * @param {node} trigger - Elemento que abre el dropdown (botón, link, etc.)
 * @param {array} items - Array de items del menú:
 *   [
 *     { label, icon, onClick, variant, divider },
 *     { divider: true }, // Separador
 *   ]
 * @param {string} align - Alineación: 'left', 'right', 'center'
 * @param {string} className - Clases CSS adicionales
 */
function BaseDropdown({
  trigger,
  items = [],
  align = 'left',
  className = '',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Close on ESC key
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen]);

  const handleItemClick = (item) => {
    if (item.onClick) {
      item.onClick();
    }
    setIsOpen(false);
  };

  // Alignment classes
  const alignClasses = {
    left: 'left-0',
    right: 'right-0',
    center: 'left-1/2 -translate-x-1/2',
  };

  // Item variant classes
  const itemVariants = {
    default: 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700',
    danger: 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20',
    success: 'text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20',
  };

  return (
    <div ref={dropdownRef} className={`relative inline-block ${className}`}>
      {/* Trigger */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="cursor-pointer"
      >
        {trigger}
      </div>

      {/* Dropdown menu */}
      {isOpen && (
        <div
          className={`
            absolute z-[9999] mt-2 min-w-[200px]
            bg-white dark:bg-gray-800
            border border-gray-200 dark:border-gray-700
            rounded-lg shadow-xl
            animate-in fade-in slide-in-from-top-2 duration-200
            ${alignClasses[align]}
          `}
        >
          <div className="py-1">
            {items.map((item, index) => {
              // Divider
              if (item.divider) {
                return (
                  <div
                    key={index}
                    className="h-px bg-gray-200 dark:bg-gray-700 my-1"
                  />
                );
              }

              const Icon = item.icon;
              const variant = item.variant || 'default';

              return (
                <button
                  key={index}
                  onClick={() => handleItemClick(item)}
                  disabled={item.disabled}
                  className={`
                    w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left
                    transition-colors
                    disabled:opacity-50 disabled:cursor-not-allowed
                    ${itemVariants[variant]}
                  `}
                >
                  {Icon && <Icon size={16} strokeWidth={2} />}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default BaseDropdown;
