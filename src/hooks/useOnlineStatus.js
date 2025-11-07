/**
 * @fileoverview Hook to monitor online/offline connectivity
 * @module hooks/useOnlineStatus
 */

import { useState, useEffect } from 'react';
import logger from '../utils/logger';

/**
 * Custom hook to track online/offline status
 * @returns {boolean} isOnline - Current online status
 */
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    // Handler for online event
    const handleOnline = () => {
      logger.info('Connection restored - Back online', 'Connectivity');
      setIsOnline(true);

      // Dispatch custom event for other components to react
      window.dispatchEvent(new CustomEvent('app:online'));
    };

    // Handler for offline event
    const handleOffline = () => {
      logger.warn('Connection lost - Now offline', 'Connectivity');
      setIsOnline(false);

      // Dispatch custom event for other components to react
      window.dispatchEvent(new CustomEvent('app:offline'));
    };

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Optional: Periodic connectivity check (fallback for unreliable events)
    const checkConnectivity = async () => {
      if (!navigator.onLine) {
        if (isOnline) {
          handleOffline();
        }
        return;
      }

      // More reliable check: try to fetch a small resource
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        await fetch('https://www.google.com/favicon.ico', {
          method: 'HEAD',
          mode: 'no-cors',
          cache: 'no-cache',
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!isOnline) {
          handleOnline();
        }
      } catch (error) {
        if (isOnline) {
          handleOffline();
        }
      }
    };

    // Check every 30 seconds
    const intervalId = setInterval(checkConnectivity, 30000);

    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(intervalId);
    };
  }, [isOnline]);

  return isOnline;
}

/**
 * Hook with additional connectivity info
 * @returns {Object} Connectivity details
 */
export function useConnectionInfo() {
  const isOnline = useOnlineStatus();
  const [connectionInfo, setConnectionInfo] = useState({
    online: isOnline,
    effectiveType: null,
    downlink: null,
    rtt: null,
    saveData: false
  });

  useEffect(() => {
    // Get connection info from Network Information API
    const connection =
      navigator.connection ||
      navigator.mozConnection ||
      navigator.webkitConnection;

    if (connection) {
      const updateConnectionInfo = () => {
        setConnectionInfo({
          online: isOnline,
          effectiveType: connection.effectiveType, // '4g', '3g', '2g', 'slow-2g'
          downlink: connection.downlink, // Mbps
          rtt: connection.rtt, // Round-trip time in ms
          saveData: connection.saveData // User has data saver enabled
        });
      };

      updateConnectionInfo();

      // Listen for connection changes
      connection.addEventListener('change', updateConnectionInfo);

      return () => {
        connection.removeEventListener('change', updateConnectionInfo);
      };
    } else {
      setConnectionInfo(prev => ({ ...prev, online: isOnline }));
    }
  }, [isOnline]);

  return connectionInfo;
}

/**
 * Hook to detect slow connections
 * @returns {boolean} isSlowConnection
 */
export function useSlowConnection() {
  const connectionInfo = useConnectionInfo();

  // Consider connection slow if:
  // - Effective type is 2g or slow-2g
  // - Downlink is less than 1 Mbps
  // - RTT is greater than 500ms
  const isSlowConnection =
    connectionInfo.effectiveType === '2g' ||
    connectionInfo.effectiveType === 'slow-2g' ||
    (connectionInfo.downlink !== null && connectionInfo.downlink < 1) ||
    (connectionInfo.rtt !== null && connectionInfo.rtt > 500);

  return isSlowConnection;
}

export default useOnlineStatus;
