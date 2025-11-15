/**
 * BaseTabs - Componente de pestañas reutilizable (100% Tailwind)
 *
 * Reemplaza las 16 implementaciones duplicadas de tabs en la app.
 * Incluye soporte para iconos, dark mode, y accesibilidad completa.
 *
 * @example
 * const [activeTab, setActiveTab] = useState('info');
 *
 * <BaseTabs
 *   tabs={[
 *     { id: 'info', label: 'Información', icon: User },
 *     { id: 'stats', label: 'Estadísticas', icon: BarChart3 }
 *   ]}
 *   activeTab={activeTab}
 *   onChange={setActiveTab}
 *   variant="underline"
 * />
 *
 * @param {Array} tabs - Array de objetos { id, label, icon?, badge?, disabled? }
 * @param {string} activeTab - ID del tab activo
 * @param {function} onChange - Callback cuando cambia el tab (recibe id)
 * @param {string} variant - Estilo: 'underline' (default), 'pills', 'boxed'
 * @param {string} size - Tamaño: 'sm', 'md' (default), 'lg'
 * @param {boolean} fullWidth - Tabs ocupan ancho completo
 * @param {string} className - Clases CSS adicionales
 */
function BaseTabs({
  tabs = [],
  activeTab,
  onChange,
  variant = 'underline',
  size = 'md',
  fullWidth = false,
  className = '',
}) {
  // Validación
  if (!tabs || tabs.length === 0) {
    return null;
  }

  // Size configurations
  const sizeConfig = {
    sm: {
      padding: 'px-3 py-2',
      fontSize: 'text-xs',
      iconSize: 14,
      gap: 'gap-1.5',
    },
    md: {
      padding: 'px-4 py-3',
      fontSize: 'text-sm',
      iconSize: 18,
      gap: 'gap-2',
    },
    lg: {
      padding: 'px-6 py-4',
      fontSize: 'text-base',
      iconSize: 20,
      gap: 'gap-2.5',
    },
  };

  const config = sizeConfig[size] || sizeConfig.md;

  // Variant styles
  const getVariantClasses = (isActive, isDisabled) => {
    const baseClasses = `
      flex items-center ${config.gap} ${config.padding} ${config.fontSize}
      font-medium transition-all duration-200 cursor-pointer
      whitespace-nowrap select-none
      ${fullWidth ? 'flex-1 justify-center' : ''}
      ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
    `;

    const variants = {
      // Underline - Borde inferior (más común en la app)
      underline: isActive
        ? `
          ${baseClasses}
          border-b-2 border-zinc-900 dark:border-white
          text-zinc-900 dark:text-white
        `
        : `
          ${baseClasses}
          border-b-2 border-transparent
          text-zinc-600 dark:text-zinc-400
          hover:text-zinc-900 dark:hover:text-white
          hover:border-zinc-300 dark:hover:border-zinc-700
        `,

      // Pills - Fondo redondeado
      pills: isActive
        ? `
          ${baseClasses}
          rounded-full
          bg-zinc-900 dark:bg-white
          text-white dark:text-zinc-900
        `
        : `
          ${baseClasses}
          rounded-full
          bg-transparent
          text-zinc-600 dark:text-zinc-400
          hover:bg-zinc-100 dark:hover:bg-zinc-800
          hover:text-zinc-900 dark:hover:text-white
        `,

      // Boxed - Con borde y fondo
      boxed: isActive
        ? `
          ${baseClasses}
          rounded-lg
          bg-white dark:bg-zinc-800
          text-zinc-900 dark:text-white
          border border-zinc-300 dark:border-zinc-600
          shadow-sm
        `
        : `
          ${baseClasses}
          rounded-lg
          bg-transparent
          text-zinc-600 dark:text-zinc-400
          border border-transparent
          hover:bg-zinc-50 dark:hover:bg-zinc-800/50
          hover:text-zinc-900 dark:hover:text-white
        `,
    };

    return variants[variant] || variants.underline;
  };

  // Container classes según variante
  const containerClasses = {
    underline: 'flex gap-0 border-b border-zinc-200 dark:border-zinc-700 overflow-x-auto',
    pills: 'flex gap-2 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-x-auto',
    boxed: 'flex gap-2 p-2 bg-zinc-50 dark:bg-zinc-900 rounded-lg overflow-x-auto',
  };

  return (
    <div
      role="tablist"
      className={`${containerClasses[variant] || containerClasses.underline} ${className}`}
      aria-label="Pestañas de navegación"
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const isDisabled = tab.disabled || false;
        const Icon = tab.icon;

        return (
          <button
            key={tab.id}
            role="tab"
            type="button"
            aria-selected={isActive}
            aria-controls={`tabpanel-${tab.id}`}
            aria-disabled={isDisabled}
            tabIndex={isActive ? 0 : -1}
            disabled={isDisabled}
            onClick={() => {
              if (!isDisabled && onChange) {
                onChange(tab.id);
              }
            }}
            className={getVariantClasses(isActive, isDisabled)}
          >
            {/* Icon */}
            {Icon && (
              <Icon
                size={config.iconSize}
                strokeWidth={2}
                className="flex-shrink-0"
              />
            )}

            {/* Label */}
            <span>{tab.label}</span>

            {/* Badge (opcional) */}
            {tab.badge !== undefined && tab.badge !== null && (
              <span
                className={`
                  ml-1.5 px-1.5 py-0.5 rounded-full text-xs font-semibold
                  ${isActive
                    ? 'bg-white/20 text-current'
                    : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300'
                  }
                `}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default BaseTabs;
