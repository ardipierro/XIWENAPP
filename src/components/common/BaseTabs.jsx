/**
 * BaseTabs - Componente de pestañas reutilizable (100% Tailwind + CSS Variables)
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

  // Render tab button
  const renderTab = (tab) => {
    const isActive = activeTab === tab.id;
    const isDisabled = tab.disabled || false;
    const Icon = tab.icon;

    // Base classes for all variants
    const baseClasses = `
      flex items-center ${config.gap} ${config.padding} ${config.fontSize}
      font-medium transition-all duration-200 cursor-pointer
      whitespace-nowrap select-none
      ${fullWidth ? 'flex-1 justify-center' : ''}
      ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
    `;

    // Variant-specific inline styles
    let buttonStyle = {};
    let buttonClasses = baseClasses;

    switch (variant) {
      case 'underline':
        buttonClasses += ' border-b-2';
        if (isActive) {
          buttonStyle = {
            borderBottomColor: 'var(--color-text-primary)',
            color: 'var(--color-text-primary)',
          };
        } else {
          buttonStyle = {
            borderBottomColor: 'transparent',
            color: 'var(--color-text-secondary)',
          };
        }
        break;

      case 'pills':
        buttonClasses += ' rounded-full';
        if (isActive) {
          buttonStyle = {
            background: 'var(--color-text-primary)',
            color: 'var(--color-bg-primary)',
          };
        } else {
          buttonStyle = {
            background: 'transparent',
            color: 'var(--color-text-secondary)',
          };
        }
        break;

      case 'boxed':
        buttonClasses += ' rounded-lg';
        if (isActive) {
          buttonStyle = {
            background: 'var(--color-bg-secondary)',
            color: 'var(--color-text-primary)',
            border: '1px solid var(--color-border)',
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
          };
        } else {
          buttonStyle = {
            background: 'transparent',
            color: 'var(--color-text-secondary)',
            border: '1px solid transparent',
          };
        }
        break;
    }

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
        className={buttonClasses}
        style={buttonStyle}
        onMouseEnter={(e) => {
          if (!isActive && !isDisabled) {
            if (variant === 'underline') {
              e.currentTarget.style.color = 'var(--color-text-primary)';
              e.currentTarget.style.borderBottomColor = 'var(--color-border-focus)';
            } else if (variant === 'pills') {
              e.currentTarget.style.background = 'var(--color-bg-tertiary)';
              e.currentTarget.style.color = 'var(--color-text-primary)';
            } else if (variant === 'boxed') {
              e.currentTarget.style.background = 'var(--color-bg-tertiary)';
              e.currentTarget.style.color = 'var(--color-text-primary)';
            }
          }
        }}
        onMouseLeave={(e) => {
          if (!isActive && !isDisabled) {
            if (variant === 'underline') {
              e.currentTarget.style.color = 'var(--color-text-secondary)';
              e.currentTarget.style.borderBottomColor = 'transparent';
            } else if (variant === 'pills') {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--color-text-secondary)';
            } else if (variant === 'boxed') {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--color-text-secondary)';
            }
          }
        }}
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
            className="ml-1.5 px-1.5 py-0.5 rounded-full text-xs font-semibold"
            style={{
              background: isActive ? 'rgba(255,255,255,0.2)' : 'var(--color-bg-tertiary)',
              color: isActive ? 'currentColor' : 'var(--color-text-secondary)',
            }}
          >
            {tab.badge}
          </span>
        )}
      </button>
    );
  };

  // Container styles según variante
  let containerStyle = {};
  let containerClasses = 'flex overflow-x-auto';

  switch (variant) {
    case 'underline':
      containerClasses += ' gap-0';
      containerStyle = { borderBottom: '1px solid var(--color-border)' };
      break;
    case 'pills':
      containerClasses += ' gap-2 p-1 rounded-full';
      containerStyle = { background: 'var(--color-bg-tertiary)' };
      break;
    case 'boxed':
      containerClasses += ' gap-2 p-2 rounded-lg';
      containerStyle = { background: 'var(--color-bg-tertiary)' };
      break;
  }

  return (
    <div
      role="tablist"
      className={`${containerClasses} ${className}`}
      style={containerStyle}
      aria-label="Pestañas de navegación"
    >
      {tabs.map((tab) => renderTab(tab))}
    </div>
  );
}

export default BaseTabs;
