import PropTypes from 'prop-types';
import { Loader2 } from 'lucide-react';

/**
 * LoadingSpinner - Indicador de carga reutilizable
 */
function LoadingSpinner({ message = 'Cargando...', size = 24 }) {
  return (
    <div className="flex flex-col items-center justify-center py-8">
      <Loader2
        size={size}
        strokeWidth={2}
        className="text-indigo-500 animate-spin mb-3"
      />
      {message && (
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          {message}
        </p>
      )}
    </div>
  );
}

LoadingSpinner.propTypes = {
  message: PropTypes.string,
  size: PropTypes.number
};

export default LoadingSpinner;
