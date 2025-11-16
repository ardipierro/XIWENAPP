/**
 * @fileoverview Service Worker Update Notification
 * Muestra notificación cuando hay una nueva versión de la app disponible
 * @module components/ServiceWorkerUpdateNotification
 */

import { useState, useEffect } from 'react';
import { RefreshCw, X } from 'lucide-react';
import { BaseButton } from './common';

/**
 * Service Worker Update Notification Component
 * Detecta actualizaciones del SW y permite al usuario refrescar
 */
function ServiceWorkerUpdateNotification() {
  const [showUpdate, setShowUpdate] = useState(false);
  const [registration, setRegistration] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    // Solo en navegadores con Service Worker
    if (!('serviceWorker' in navigator)) {
      return;
    }

    // Listener para cuando hay una actualización esperando
    navigator.serviceWorker.ready.then(reg => {
      // Si ya hay un SW esperando, mostrarlo inmediatamente
      if (reg.waiting) {
        setRegistration(reg);
        setShowUpdate(true);
        return;
      }

      // Listener para cuando se instala un nuevo SW
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;

        if (!newWorker) return;

        newWorker.addEventListener('statechange', () => {
          // Cuando el nuevo SW está instalado y esperando
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            setRegistration(reg);
            setShowUpdate(true);
          }
        });
      });
    });

    // Listener para cuando el SW toma control (después de skipWaiting)
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      // Evitar múltiples reloads
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });

    // Verificar actualizaciones cada 60 segundos
    const interval = setInterval(() => {
      navigator.serviceWorker.ready.then(reg => {
        reg.update();
      });
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const handleUpdate = () => {
    if (!registration || !registration.waiting) return;

    setIsUpdating(true);

    // Enviar mensaje al SW para que haga skipWaiting
    registration.waiting.postMessage({ type: 'SKIP_WAITING' });

    // El reload se hará automáticamente por el listener 'controllerchange'
  };

  const handleDismiss = () => {
    setShowUpdate(false);
    // Guardar en sessionStorage para no mostrar hasta el próximo reload
    sessionStorage.setItem('swUpdateDismissed', 'true');
  };

  // No mostrar si fue dismisseado en esta sesión
  useEffect(() => {
    const dismissed = sessionStorage.getItem('swUpdateDismissed');
    if (dismissed) {
      setShowUpdate(false);
    }
  }, []);

  if (!showUpdate) {
    return null;
  }

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] max-w-md w-full px-4 animate-slide-down">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg border-2 border-accent-500 p-4">
        <div className="flex items-start gap-3">
          {/* Icono */}
          <div className="flex-shrink-0 w-10 h-10 bg-accent-500 rounded-lg flex items-center justify-center">
            <RefreshCw className={`w-5 h-5 text-white ${isUpdating ? 'animate-spin' : ''}`} />
          </div>

          {/* Contenido */}
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
              Nueva versión disponible
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
              Hay una actualización de XIWEN disponible. Actualiza para obtener las últimas mejoras y correcciones.
            </p>

            <div className="flex items-center gap-2">
              <BaseButton
                variant="primary"
                size="sm"
                onClick={handleUpdate}
                disabled={isUpdating}
                icon={RefreshCw}
              >
                {isUpdating ? 'Actualizando...' : 'Actualizar ahora'}
              </BaseButton>

              <BaseButton
                variant="ghost"
                size="sm"
                onClick={handleDismiss}
                disabled={isUpdating}
              >
                Más tarde
              </BaseButton>
            </div>
          </div>

          {/* Botón cerrar */}
          <button
            onClick={handleDismiss}
            disabled={isUpdating}
            className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors disabled:opacity-50"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default ServiceWorkerUpdateNotification;
