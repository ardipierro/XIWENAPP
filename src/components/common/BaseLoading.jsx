import { Loader2 } from 'lucide-react';

/**
 * BaseLoading - Componente de carga base reutilizable (100% Tailwind)
 *
 * Soporta múltiples variantes de loading para diferentes contextos.
 *
 * @param {string} variant - Tipo de loading:
 *   - 'spinner': Spinner circular (default)
 *   - 'dots': Tres puntos animados
 *   - 'pulse': Círculo pulsante
 *   - 'bars': Barras verticales animadas
 *   - 'fullscreen': Overlay fullscreen con spinner
 * @param {string} size - Tamaño: 'sm', 'md', 'lg', 'xl'
 * @param {string} text - Texto de carga (opcional)
 * @param {string} className - Clases CSS adicionales
 */
function BaseLoading({
  variant = 'spinner',
  size = 'md',
  text,
  className = '',
}) {
  // Size styles
  const spinnerSizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  const dotSizes = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-3 h-3',
    xl: 'w-4 h-4',
  };

  const barSizes = {
    sm: 'w-1 h-4',
    md: 'w-1.5 h-8',
    lg: 'w-2 h-12',
    xl: 'w-3 h-16',
  };

  // Spinner (rotating circle)
  if (variant === 'spinner') {
    return (
      <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
        <Loader2
          className={`${spinnerSizes[size]} text-zinc-800 dark:text-zinc-300 animate-spin`}
        />
        {text && (
          <p className="text-sm text-gray-600 dark:text-gray-400">{text}</p>
        )}
      </div>
    );
  }

  // Dots (three animated dots)
  if (variant === 'dots') {
    return (
      <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`${dotSizes[size]} rounded-full bg-zinc-800 dark:bg-zinc-300 animate-bounce`}
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
        {text && (
          <p className="text-sm text-gray-600 dark:text-gray-400">{text}</p>
        )}
      </div>
    );
  }

  // Pulse (pulsing circle)
  if (variant === 'pulse') {
    return (
      <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
        <div className="relative">
          <div className={`${spinnerSizes[size]} rounded-full bg-zinc-800 dark:bg-zinc-300 animate-ping absolute opacity-75`} />
          <div className={`${spinnerSizes[size]} rounded-full bg-zinc-800 dark:bg-zinc-300 relative`} />
        </div>
        {text && (
          <p className="text-sm text-gray-600 dark:text-gray-400">{text}</p>
        )}
      </div>
    );
  }

  // Bars (vertical animated bars)
  if (variant === 'bars') {
    return (
      <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
        <div className="flex items-end gap-1">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`${barSizes[size]} bg-zinc-800 dark:bg-zinc-300 rounded-full animate-pulse`}
              style={{
                animationDelay: `${i * 0.15}s`,
                animationDuration: '1s',
              }}
            />
          ))}
        </div>
        {text && (
          <p className="text-sm text-gray-600 dark:text-gray-400">{text}</p>
        )}
      </div>
    );
  }

  // Fullscreen overlay
  if (variant === 'fullscreen') {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
        <div className="flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-12 h-12 text-zinc-800 dark:text-zinc-300 animate-spin" />
          {text && (
            <p className="text-base text-gray-900 dark:text-white font-medium">
              {text}
            </p>
          )}
        </div>
      </div>
    );
  }

  return null;
}

export default BaseLoading;
