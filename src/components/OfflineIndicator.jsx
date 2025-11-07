/**
 * @fileoverview Visual indicator for offline/slow connection status
 * @module components/OfflineIndicator
 */

import { useOnlineStatus, useConnectionInfo } from '../hooks/useOnlineStatus';
import { WifiOff, Wifi, AlertTriangle } from 'lucide-react';
import { useState, useEffect } from 'react';

/**
 * OfflineIndicator component
 * Shows a banner at the top when offline or connection is slow
 */
function OfflineIndicator() {
  const isOnline = useOnlineStatus();
  const connectionInfo = useConnectionInfo();
  const [visible, setVisible] = useState(true);

  // Determine connection quality
  const isSlowConnection =
    connectionInfo.effectiveType === '2g' ||
    connectionInfo.effectiveType === 'slow-2g' ||
    (connectionInfo.downlink !== null && connectionInfo.downlink < 1) ||
    (connectionInfo.rtt !== null && connectionInfo.rtt > 500);

  // Reset visibility when coming back online
  useEffect(() => {
    if (isOnline && !isSlowConnection) {
      setVisible(true);
    }
  }, [isOnline, isSlowConnection]);

  // Don't show anything if online with good connection
  if (isOnline && !isSlowConnection) {
    return null;
  }

  // Don't show if user dismissed it
  if (!visible) {
    return null;
  }

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-[9999] ${
        isOnline
          ? 'bg-yellow-500 dark:bg-yellow-600'
          : 'bg-red-500 dark:bg-red-600'
      } text-white shadow-lg transition-all duration-300 ease-in-out`}
      role="alert"
      aria-live="polite"
    >
      <div className="container mx-auto px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Icon */}
          {isOnline ? (
            <Wifi size={20} className="flex-shrink-0 animate-pulse" />
          ) : (
            <WifiOff size={20} className="flex-shrink-0" />
          )}

          {/* Message */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
            <span className="font-semibold text-sm">
              {isOnline ? '⚠️ Conexión lenta' : '📴 Sin conexión'}
            </span>
            <span className="text-xs opacity-90">
              {isOnline
                ? 'Algunas funciones pueden tardar más de lo normal'
                : 'Trabajando en modo offline - Cambios se sincronizarán cuando vuelvas'}
            </span>
          </div>

          {/* Connection details (for slow connections) */}
          {isOnline && isSlowConnection && connectionInfo.effectiveType && (
            <span className="hidden md:inline-flex items-center gap-1 text-xs opacity-75 bg-white/20 px-2 py-1 rounded">
              <AlertTriangle size={12} />
              {connectionInfo.effectiveType.toUpperCase()}
              {connectionInfo.downlink && ` (${connectionInfo.downlink.toFixed(1)} Mbps)`}
            </span>
          )}
        </div>

        {/* Dismiss button */}
        <button
          onClick={() => setVisible(false)}
          className="ml-2 p-1 hover:bg-white/20 rounded transition-colors flex-shrink-0"
          aria-label="Cerrar notificación"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default OfflineIndicator;
