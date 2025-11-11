/**
 * @fileoverview Modal unificado de configuración con múltiples tabs
 * Agrupa TTS, Personalización Visual, Tipografía, Pantalla, Progreso
 * @module components/SettingsModal
 */

import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Settings,
  Palette,
  Type,
  Volume2,
  Monitor,
  TrendingUp,
  Mic,
  Gauge,
  Bookmark,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut
} from 'lucide-react';
import BaseModal from './common/BaseModal';
import { BaseButton, BaseBadge } from './common';
import ViewCustomizer from './interactive-book/ViewCustomizer';
import TTSSettings from './interactive-book/TTSSettings';

/**
 * Modal de configuración completo con tabs
 */
function SettingsModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('visual');
  const [displaySettings, setDisplaySettings] = useState({
    zoom: 100, // 50-200%
    width: 'normal', // 'narrow' | 'normal' | 'wide' | 'full'
    fullscreen: false,
    fontScale: 100 // 80-150% (adicional al tamaño de fuente del ViewCustomizer)
  });

  // Cargar configuración de pantalla
  useEffect(() => {
    const saved = localStorage.getItem('xiwen_display_settings');
    if (saved) {
      try {
        setDisplaySettings(JSON.parse(saved));
      } catch (err) {
        console.error('Error loading display settings:', err);
      }
    }
  }, []);

  // Guardar configuración de pantalla
  const updateDisplaySetting = (key, value) => {
    const newSettings = { ...displaySettings, [key]: value };
    setDisplaySettings(newSettings);
    localStorage.setItem('xiwen_display_settings', JSON.stringify(newSettings));
    applyDisplaySettings(newSettings);
  };

  // Aplicar configuración de pantalla
  const applyDisplaySettings = (settings) => {
    const root = document.documentElement;

    // Zoom general
    root.style.setProperty('--app-zoom', settings.zoom / 100);

    // Ancho del contenedor
    const widths = {
      narrow: '800px',
      normal: '1200px',
      wide: '1400px',
      full: '100%'
    };
    root.style.setProperty('--container-max-width', widths[settings.width]);

    // Font scale adicional
    root.style.setProperty('--font-scale', settings.fontScale / 100);

    // Fullscreen
    if (settings.fullscreen && !document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
    } else if (!settings.fullscreen && document.fullscreenElement) {
      document.exitFullscreen?.();
    }
  };

  const tabs = [
    {
      id: 'visual',
      label: 'Visual',
      icon: Palette,
      description: 'Colores, bordes, sombras'
    },
    {
      id: 'typography',
      label: 'Tipografía',
      icon: Type,
      description: 'Fuentes y tamaños'
    },
    {
      id: 'tts',
      label: 'Voz IA',
      icon: Volume2,
      description: 'Text-to-Speech'
    },
    {
      id: 'display',
      label: 'Pantalla',
      icon: Monitor,
      description: 'Zoom, ancho, fullscreen'
    },
    {
      id: 'practice',
      label: 'Práctica',
      icon: Mic,
      description: 'Pronunciación y velocidad'
    },
    {
      id: 'progress',
      label: 'Progreso',
      icon: TrendingUp,
      description: 'Estadísticas y logros'
    }
  ];

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Configuración"
      size="2xl"
      icon={Settings}
    >
      <div className="flex flex-col h-full">
        {/* Tabs horizontales arriba */}
        <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
          <div className="flex gap-1 overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-all
                  border-b-2 -mb-px
                  ${activeTab === tab.id
                    ? 'border-purple-500 text-purple-600 dark:text-purple-400 bg-purple-50/50 dark:bg-purple-900/20'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
                  }
                `}
              >
                <tab.icon size={18} className="flex-shrink-0" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content con altura mínima fija */}
        <div className="flex-1 overflow-y-auto min-h-[500px]">
          {/* TAB: VISUAL (ViewCustomizer completo) */}
          {activeTab === 'visual' && (
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                Personalización Visual
              </h3>
              <ViewCustomizer />
            </div>
          )}

          {/* TAB: TYPOGRAPHY */}
          {activeTab === 'typography' && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Tipografía Avanzada
              </h3>

              <div className="space-y-4">
                {/* Font Scale Global */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Escala de fuente global: {displaySettings.fontScale}%
                  </label>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => updateDisplaySetting('fontScale', Math.max(80, displaySettings.fontScale - 10))}
                      className="p-2 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                    >
                      <ZoomOut size={18} />
                    </button>
                    <input
                      type="range"
                      min="80"
                      max="150"
                      step="10"
                      value={displaySettings.fontScale}
                      onChange={(e) => updateDisplaySetting('fontScale', parseInt(e.target.value))}
                      className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                    />
                    <button
                      onClick={() => updateDisplaySetting('fontScale', Math.min(150, displaySettings.fontScale + 10))}
                      className="p-2 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                    >
                      <ZoomIn size={18} />
                    </button>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>80% (Pequeño)</span>
                    <span>100% (Normal)</span>
                    <span>150% (Grande)</span>
                  </div>
                </div>

                {/* Presets rápidos */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Presets de lectura
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => {
                        updateDisplaySetting('fontScale', 90);
                      }}
                      className="p-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg text-sm hover:border-purple-500 transition-colors"
                    >
                      <div className="font-medium">Compacto</div>
                      <div className="text-xs text-gray-500">Más contenido</div>
                    </button>
                    <button
                      onClick={() => {
                        updateDisplaySetting('fontScale', 100);
                      }}
                      className="p-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg text-sm hover:border-purple-500 transition-colors"
                    >
                      <div className="font-medium">Estándar</div>
                      <div className="text-xs text-gray-500">Balanceado</div>
                    </button>
                    <button
                      onClick={() => {
                        updateDisplaySetting('fontScale', 130);
                      }}
                      className="p-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg text-sm hover:border-purple-500 transition-colors"
                    >
                      <div className="font-medium">Lectura</div>
                      <div className="text-xs text-gray-500">Más legible</div>
                    </button>
                  </div>
                </div>

                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <p className="text-sm text-blue-900 dark:text-blue-100">
                    💡 <strong>Tip:</strong> La escala de fuente global afecta todo el texto de la aplicación. Para ajustar solo las burbujas de diálogo, usa la pestaña "Visual".
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB: TTS */}
          {activeTab === 'tts' && (
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                Configuración de Voz IA
              </h3>
              <TTSSettings />
            </div>
          )}

          {/* TAB: DISPLAY */}
          {activeTab === 'display' && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Configuración de Pantalla
              </h3>

              {/* Zoom */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Zoom de aplicación: {displaySettings.zoom}%
                </label>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => updateDisplaySetting('zoom', Math.max(50, displaySettings.zoom - 10))}
                    className="p-2 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                  >
                    <ZoomOut size={18} />
                  </button>
                  <input
                    type="range"
                    min="50"
                    max="200"
                    step="10"
                    value={displaySettings.zoom}
                    onChange={(e) => updateDisplaySetting('zoom', parseInt(e.target.value))}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                  />
                  <button
                    onClick={() => updateDisplaySetting('zoom', Math.min(200, displaySettings.zoom + 10))}
                    className="p-2 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                  >
                    <ZoomIn size={18} />
                  </button>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>50%</span>
                  <span>100%</span>
                  <span>200%</span>
                </div>
              </div>

              {/* Ancho del contenedor */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Ancho del contenedor
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { value: 'narrow', label: 'Estrecho', width: '800px' },
                    { value: 'normal', label: 'Normal', width: '1200px' },
                    { value: 'wide', label: 'Ancho', width: '1400px' },
                    { value: 'full', label: 'Completo', width: '100%' }
                  ].map(option => (
                    <button
                      key={option.value}
                      onClick={() => updateDisplaySetting('width', option.value)}
                      className={`p-3 border-2 rounded-lg text-sm transition-all ${
                        displaySettings.width === option.value
                          ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30'
                          : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                      }`}
                    >
                      <div className="font-medium">{option.label}</div>
                      <div className="text-xs text-gray-500">{option.width}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Fullscreen */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Pantalla completa
                </label>
                <button
                  onClick={() => updateDisplaySetting('fullscreen', !displaySettings.fullscreen)}
                  className={`w-full p-4 border-2 rounded-lg flex items-center justify-between transition-all ${
                    displaySettings.fullscreen
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30'
                      : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {displaySettings.fullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                    <div className="text-left">
                      <div className="font-medium">
                        {displaySettings.fullscreen ? 'Salir de pantalla completa' : 'Activar pantalla completa'}
                      </div>
                      <div className="text-xs text-gray-500">
                        Presiona F11 o ESC para alternar
                      </div>
                    </div>
                  </div>
                  <BaseBadge variant={displaySettings.fullscreen ? 'success' : 'default'}>
                    {displaySettings.fullscreen ? 'Activado' : 'Desactivado'}
                  </BaseBadge>
                </button>
              </div>

              {/* Presets para diferentes dispositivos */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Presets para dispositivos
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => {
                      updateDisplaySetting('zoom', 90);
                      updateDisplaySetting('width', 'normal');
                    }}
                    className="p-4 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:border-purple-500 transition-colors"
                  >
                    <div className="font-medium">💻 Desktop</div>
                    <div className="text-xs text-gray-500">Normal, 90%</div>
                  </button>
                  <button
                    onClick={() => {
                      updateDisplaySetting('zoom', 100);
                      updateDisplaySetting('width', 'full');
                    }}
                    className="p-4 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:border-purple-500 transition-colors"
                  >
                    <div className="font-medium">📱 Móvil</div>
                    <div className="text-xs text-gray-500">Completo, 100%</div>
                  </button>
                  <button
                    onClick={() => {
                      updateDisplaySetting('zoom', 120);
                      updateDisplaySetting('width', 'wide');
                    }}
                    className="p-4 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:border-purple-500 transition-colors"
                  >
                    <div className="font-medium">📺 TV / Proyector</div>
                    <div className="text-xs text-gray-500">Ancho, 120%</div>
                  </button>
                  <button
                    onClick={() => {
                      updateDisplaySetting('zoom', 150);
                      updateDisplaySetting('width', 'full');
                      updateDisplaySetting('fullscreen', true);
                    }}
                    className="p-4 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:border-purple-500 transition-colors"
                  >
                    <div className="font-medium">🎓 Aula / Presentación</div>
                    <div className="text-xs text-gray-500">Fullscreen, 150%</div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB: PRACTICE */}
          {activeTab === 'practice' && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Configuración de Práctica
              </h3>

              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Mic size={20} className="text-amber-600 dark:text-amber-400" />
                  <span className="font-semibold text-amber-900 dark:text-amber-100">
                    Próximamente: Práctica de Pronunciación
                  </span>
                </div>
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  • Reconocimiento de voz con Speech Recognition API<br />
                  • Evaluación de pronunciación<br />
                  • Comparación con audio nativo<br />
                  • Feedback en tiempo real
                </p>
              </div>

              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Gauge size={20} className="text-blue-600 dark:text-blue-400" />
                  <span className="font-semibold text-blue-900 dark:text-blue-100">
                    Próximamente: Control de Velocidad de Audio
                  </span>
                </div>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  • Velocidades: 0.5x, 0.75x, 1x, 1.25x, 1.5x, 2x<br />
                  • Sin cambio de pitch<br />
                  • Ideal para principiantes
                </p>
              </div>

              <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Bookmark size={20} className="text-green-600 dark:text-green-400" />
                  <span className="font-semibold text-green-900 dark:text-green-100">
                    Próximamente: Notas y Marcadores
                  </span>
                </div>
                <p className="text-sm text-green-800 dark:text-green-200">
                  • Marcar frases favoritas<br />
                  • Agregar notas personales<br />
                  • Crear vocabulario personalizado<br />
                  • Exportar a PDF/TXT
                </p>
              </div>
            </div>
          )}

          {/* TAB: PROGRESS */}
          {activeTab === 'progress' && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Progreso y Estadísticas
              </h3>

              <div className="p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp size={20} className="text-purple-600 dark:text-purple-400" />
                  <span className="font-semibold text-purple-900 dark:text-purple-100">
                    Próximamente: Sistema de Progreso
                  </span>
                </div>
                <p className="text-sm text-purple-800 dark:text-purple-200">
                  • Dashboard con estadísticas<br />
                  • Gráficos de evolución<br />
                  • Racha de días estudiados<br />
                  • Puntos y niveles (gamificación)<br />
                  • Guardado en Firebase por usuario
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
                  <div className="text-3xl font-bold text-gray-900 dark:text-white">0</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Ejercicios completados</div>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
                  <div className="text-3xl font-bold text-gray-900 dark:text-white">0</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Puntos totales</div>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
                  <div className="text-3xl font-bold text-gray-900 dark:text-white">0</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Días de racha</div>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
                  <div className="text-3xl font-bold text-gray-900 dark:text-white">0%</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Progreso del libro</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </BaseModal>
  );
}

SettingsModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired
};

export default SettingsModal;
