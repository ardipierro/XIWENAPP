/**
 * @fileoverview PWA Install Prompt - Muestra banner de instalación en Android
 * @module components/InstallPrompt
 */

import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import { BaseButton } from './common';

/**
 * Install Prompt Component
 * Captura el evento beforeinstallprompt y muestra un banner elegante
 * para que los usuarios instalen la PWA en Android
 */
function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Detectar iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    setIsIOS(iOS);

    // No mostrar si ya está instalado
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return;
    }

    // Capturar el evento beforeinstallprompt (solo Android/Desktop)
    const handleBeforeInstallPrompt = (e) => {
      // Prevenir el mini-infobar automático
      e.preventDefault();

      // Guardar el evento para usarlo después
      setDeferredPrompt(e);

      // Esperar 3 segundos antes de mostrar el prompt
      setTimeout(() => {
        setShowPrompt(true);
      }, 3000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listener para cuando se instala la app
    window.addEventListener('appinstalled', () => {
      setShowPrompt(false);
      setDeferredPrompt(null);
      console.log('PWA instalada exitosamente');
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Mostrar el prompt de instalación
    deferredPrompt.prompt();

    // Esperar a que el usuario responda
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('Usuario aceptó instalar la PWA');
    } else {
      console.log('Usuario rechazó instalar la PWA');
    }

    // Limpiar el prompt
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Guardar en localStorage para no mostrar por 7 días
    localStorage.setItem('installPromptDismissed', Date.now().toString());
  };

  // No mostrar si fue dismisseado recientemente (últimos 7 días)
  useEffect(() => {
    const dismissed = localStorage.getItem('installPromptDismissed');
    if (dismissed) {
      const daysSinceDismissed = (Date.now() - parseInt(dismissed)) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissed < 7) {
        setShowPrompt(false);
      }
    }
  }, []);

  // No renderizar si no hay prompt o no debe mostrarse
  if (!showPrompt || (!deferredPrompt && !isIOS)) {
    return null;
  }

  // Versión para iOS (instrucciones manuales)
  if (isIOS) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-gradient-to-t from-black/90 to-black/70 backdrop-blur-sm animate-slide-up">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-4 border border-gray-200 dark:border-gray-800">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-12 h-12 bg-accent-500 rounded-lg flex items-center justify-center">
                <Download className="w-6 h-6 text-white" />
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                  Instalar XIWEN
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                  Para instalar en iOS, toca el botón de compartir{' '}
                  <span className="inline-flex items-center justify-center w-5 h-5 bg-gray-500 text-white rounded text-xs">⬆️</span>
                  {' '}y luego "Añadir a la pantalla de inicio"
                </p>
              </div>

              <button
                onClick={handleDismiss}
                className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                aria-label="Cerrar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Versión para Android/Desktop (con beforeinstallprompt)
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-gradient-to-t from-black/90 to-black/70 backdrop-blur-sm animate-slide-up">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-4 border border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0 w-12 h-12 bg-accent-500 rounded-lg flex items-center justify-center">
              <Download className="w-6 h-6 text-white" />
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                Instalar XIWEN
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Instala la app para acceso rápido y funcionalidad offline
              </p>
            </div>

            <div className="flex items-center gap-2">
              <BaseButton
                variant="primary"
                size="sm"
                onClick={handleInstallClick}
                icon={Download}
              >
                Instalar
              </BaseButton>

              <button
                onClick={handleDismiss}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                aria-label="Cerrar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default InstallPrompt;
