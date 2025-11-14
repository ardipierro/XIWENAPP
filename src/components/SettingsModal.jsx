/**
 * @fileoverview Modal unificado de configuración con múltiples tabs
 * Agrupa TTS, Personalización Visual, Tipografía, Pantalla, Progreso
 * @module components/SettingsModal
 */

import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import {
  Settings,
  Palette,
  Monitor,
  Volume2,
  Gauge,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  Eye,
  EyeOff,
  Image,
  Mic,
  Bookmark,
  TrendingUp,
  Type
} from 'lucide-react';
import BaseModal from './common/BaseModal';
import { BaseButton, BaseBadge } from './common';
import ViewCustomizer from './interactive-book/ViewCustomizer';
import AIImageGenerator from './interactive-book/AIImageGenerator';
import CharacterVoiceManager from './interactive-book/CharacterVoiceManager';

/**
 * Modal de configuración completo con tabs
 */
function SettingsModal({ isOpen, onClose, characters = [] }) {
  const [activeTab, setActiveTab] = useState('appearance');
  const [displaySettings, setDisplaySettings] = useState({
    zoom: 100,
    width: 'normal',
    fullscreen: false,
    fontScale: 100,
    showMetadataBadges: true
  });
  const [saveMessage, setSaveMessage] = useState(null); // { type: 'success' | 'error', text: string }
  const viewCustomizerSaveRef = useRef(null); // Referencia a la función de guardado de ViewCustomizer

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

    // Disparar evento custom para notificar cambios en la misma pestaña
    window.dispatchEvent(new Event('xiwen_settings_changed'));
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

  // Aplicar preset de velocidad con validación
  const applyPresetRate = (rate, presetName) => {
    const saved = localStorage.getItem('xiwen_character_voices');

    if (!saved) {
      alert('⚠️ Aún no hay personajes configurados.\n\nPrimero carga un libro interactivo para que se detecten los personajes automáticamente.');
      return;
    }

    try {
      const configs = JSON.parse(saved);
      const characterIds = Object.keys(configs);

      if (characterIds.length === 0) {
        alert('⚠️ No hay personajes configurados aún.\n\nAbre un libro interactivo primero para que se carguen los personajes.');
        return;
      }

      // Aplicar velocidad a todos los personajes
      characterIds.forEach(charId => {
        if (configs[charId]?.voiceConfig) {
          configs[charId].voiceConfig.rate = rate;
        }
      });

      localStorage.setItem('xiwen_character_voices', JSON.stringify(configs));
      window.dispatchEvent(new Event('xiwen_settings_changed'));

      // Feedback de éxito
      console.info(`✅ Preset "${presetName}" aplicado: ${rate}x a ${characterIds.length} personaje(s)`);
    } catch (err) {
      console.error('Error aplicando preset:', err);
      alert('❌ Error al aplicar el preset. Por favor intenta nuevamente.');
    }
  };

  // ✅ 4 tabs principales
  const tabs = [
    {
      id: 'appearance',
      label: 'Apariencia',
      icon: Palette,
      description: 'Visual, tipografía y diseño'
    },
    {
      id: 'display',
      label: 'Pantalla',
      icon: Monitor,
      description: 'Zoom, ancho y fullscreen'
    },
    {
      id: 'fonts',
      label: 'Fuentes',
      icon: Type,
      description: 'Prueba de fuentes chinas'
    },
    {
      id: 'audio',
      label: 'Audio y Voces',
      icon: Volume2,
      description: 'TTS, personajes y velocidad'
    },
    {
      id: 'advanced',
      label: 'Avanzado',
      icon: Settings,
      description: 'Progreso, imágenes IA y más'
    }
  ];

  // Manejar guardado de configuración
  const handleSaveSettings = () => {
    // Guardar ViewCustomizer si existe la referencia
    if (viewCustomizerSaveRef.current) {
      viewCustomizerSaveRef.current();
    }

    setSaveMessage({ type: 'success', text: '✓ Configuración guardada correctamente' });
    setTimeout(() => setSaveMessage(null), 3000);
  };

  // Callback para recibir la función de guardado de ViewCustomizer
  const handleViewCustomizerChange = (data) => {
    if (data && typeof data.saveSettings === 'function') {
      viewCustomizerSaveRef.current = data.saveSettings;
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Configuración"
      size="lg"
      icon={Settings}
    >
      <div className="flex flex-col h-[600px]">
        {/* Tabs horizontales arriba */}
        <div className="border-b border-gray-200 dark:border-gray-700 mb-6 flex-shrink-0">
          <div className="flex gap-1 flex-wrap">
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto pb-4">
          {/* ========================================= */}
          {/* TAB 1: APARIENCIA (Visual + Tipografía) */}
          {/* ========================================= */}
          {activeTab === 'appearance' && (
            <div>
              <ViewCustomizer
                alwaysOpen={true}
                autoSave={false}
                onSettingsChange={handleViewCustomizerChange}
              />
            </div>
          )}

          {/* ========================================= */}
          {/* TAB 2: PANTALLA (Zoom, ancho, fullscreen) */}
          {/* ========================================= */}
          {activeTab === 'display' && (
            <div className="space-y-6">
                  {/* Zoom */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Zoom de aplicación: {displaySettings.zoom}%
                    </label>
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => updateDisplaySetting('zoom', Math.max(50, displaySettings.zoom - 10))}
                        className="w-11 h-11 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 flex items-center justify-center transition-colors"
                      >
                        <ZoomOut size={20} />
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
                        className="w-11 h-11 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 flex items-center justify-center transition-colors"
                      >
                        <ZoomIn size={20} />
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

                  {/* Mostrar/Ocultar Badges de Metadata */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Mostrar información de metadata
                    </label>
                    <button
                      onClick={() => updateDisplaySetting('showMetadataBadges', !displaySettings.showMetadataBadges)}
                      className={`w-full p-4 border-2 rounded-lg flex items-center justify-between transition-all ${
                        displaySettings.showMetadataBadges
                          ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30'
                          : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {displaySettings.showMetadataBadges ? <Eye size={20} /> : <EyeOff size={20} />}
                        <div className="text-left">
                          <div className="font-medium">
                            {displaySettings.showMetadataBadges ? 'Ocultar badges' : 'Mostrar badges'}
                          </div>
                          <div className="text-xs text-gray-500">
                            Badges de dificultad, tipo, nivel en títulos
                          </div>
                        </div>
                      </div>
                      <BaseBadge variant={displaySettings.showMetadataBadges ? 'success' : 'default'}>
                        {displaySettings.showMetadataBadges ? 'Visible' : 'Oculto'}
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

          {/* ========================================= */}
          {/* TAB 3: AUDIO Y VOCES (CharacterVoiceManager + Presets) */}
          {/* ========================================= */}
          {activeTab === 'audio' && (
            <div className="space-y-8">
              {/* CharacterVoiceManager directo */}
              <CharacterVoiceManager characters={characters} alwaysOpen={true} />

              {/* Sección: Presets de Velocidad */}
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 pb-2 border-b-2 border-purple-200 dark:border-purple-800">
                  ⚡ Presets de Velocidad
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Aplica configuraciones de velocidad predefinidas para diferentes estilos de aprendizaje.
                  Estos presets se aplican globalmente a todos los personajes.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Preset: Estándar */}
                  <button
                    onClick={() => {
                      const saved = localStorage.getItem('xiwen_character_voices');
                      if (saved) {
                        const configs = JSON.parse(saved);
                        Object.keys(configs).forEach(charId => {
                          configs[charId].voiceConfig.rate = 1.0;
                        });
                        localStorage.setItem('xiwen_character_voices', JSON.stringify(configs));
                        window.dispatchEvent(new Event('xiwen_settings_changed'));
                      }
                    }}
                    className="p-6 border-2 border-gray-300 dark:border-gray-600 rounded-xl hover:border-purple-500 dark:hover:border-purple-500 transition-all text-left group"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center group-hover:bg-blue-200 dark:group-hover:bg-blue-800/50 transition-colors">
                        <Gauge size={24} className="text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 dark:text-white">Estándar</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">1.0x normal</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      Velocidad normal, ideal para la mayoría de los usuarios.
                    </p>
                  </button>

                  {/* Preset: Principiante */}
                  <button
                    onClick={() => {
                      const saved = localStorage.getItem('xiwen_character_voices');
                      if (saved) {
                        const configs = JSON.parse(saved);
                        Object.keys(configs).forEach(charId => {
                          configs[charId].voiceConfig.rate = 0.75;
                        });
                        localStorage.setItem('xiwen_character_voices', JSON.stringify(configs));
                        window.dispatchEvent(new Event('xiwen_settings_changed'));
                      }
                    }}
                    className="p-6 border-2 border-gray-300 dark:border-gray-600 rounded-xl hover:border-purple-500 dark:hover:border-purple-500 transition-all text-left group"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center group-hover:bg-green-200 dark:group-hover:bg-green-800/50 transition-colors">
                        <span className="text-2xl">🐌</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 dark:text-white">Principiante</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">0.75x lento</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      Más lento para entender mejor. Perfecto para comenzar.
                    </p>
                  </button>

                  {/* Preset: Rápido */}
                  <button
                    onClick={() => {
                      const saved = localStorage.getItem('xiwen_character_voices');
                      if (saved) {
                        const configs = JSON.parse(saved);
                        Object.keys(configs).forEach(charId => {
                          configs[charId].voiceConfig.rate = 1.25;
                        });
                        localStorage.setItem('xiwen_character_voices', JSON.stringify(configs));
                        window.dispatchEvent(new Event('xiwen_settings_changed'));
                      }
                    }}
                    className="p-6 border-2 border-gray-300 dark:border-gray-600 rounded-xl hover:border-purple-500 dark:hover:border-purple-500 transition-all text-left group"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center group-hover:bg-orange-200 dark:group-hover:bg-orange-800/50 transition-colors">
                        <span className="text-2xl">⚡</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 dark:text-white">Rápido</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">1.25x rápido</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      Para usuarios avanzados que quieren practicar a mayor velocidad.
                    </p>
                  </button>

                  {/* Preset: Narración */}
                  <button
                    onClick={() => {
                      const saved = localStorage.getItem('xiwen_character_voices');
                      if (saved) {
                        const configs = JSON.parse(saved);
                        Object.keys(configs).forEach(charId => {
                          configs[charId].voiceConfig.rate = 0.9;
                        });
                        localStorage.setItem('xiwen_character_voices', JSON.stringify(configs));
                        window.dispatchEvent(new Event('xiwen_settings_changed'));
                      }
                    }}
                    className="p-6 border-2 border-gray-300 dark:border-gray-600 rounded-xl hover:border-purple-500 dark:hover:border-purple-500 transition-all text-left group"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center group-hover:bg-purple-200 dark:group-hover:bg-purple-800/50 transition-colors">
                        <span className="text-2xl">📖</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 dark:text-white">Narración</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">0.9x suave</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      Estilo audiolibro, relajado y fácil de seguir.
                    </p>
                  </button>
                </div>

                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg mt-4">
                  <p className="text-sm text-blue-900 dark:text-blue-100">
                    💡 <strong>Tip:</strong> Los presets aplican la velocidad globalmente. Para configurar cada personaje individualmente, usa la sección "Voces por Personaje" arriba.
                  </p>
                </div>

                {/* Próximas funcionalidades */}
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700 mt-6">
                  <h4 className="text-md font-bold text-gray-900 dark:text-white mb-3">
                    Próximamente
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 text-sm text-gray-600 dark:text-gray-400">
                      <Mic size={18} className="flex-shrink-0 mt-0.5" />
                      <div>
                        <strong>Práctica de Pronunciación:</strong> Reconocimiento de voz y feedback en tiempo real
                      </div>
                    </div>
                    <div className="flex items-start gap-3 text-sm text-gray-600 dark:text-gray-400">
                      <Bookmark size={18} className="flex-shrink-0 mt-0.5" />
                      <div>
                        <strong>Notas y Marcadores:</strong> Guarda tus frases favoritas y crea vocabulario personalizado
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================= */}
          {/* TAB: FUENTES (Probador de fuentes chinas) */}
          {/* ========================================= */}
          {activeTab === 'fonts' && (
            <div className="space-y-6 px-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 pb-2 border-b-2 border-purple-200 dark:border-purple-800">
                  🎨 Probador de Fuentes Chinas
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                  Visualiza cómo se ve el nombre de la aplicación con diferentes fuentes chinas
                </p>

                {/* Selector de fuente */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    Selecciona una fuente:
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { name: 'Microsoft YaHei', family: "'Microsoft YaHei', sans-serif" },
                      { name: 'SimSun (宋体)', family: "SimSun, serif" },
                      { name: 'SimHei (黑体)', family: "SimHei, sans-serif" },
                      { name: 'STSong (华文宋体)', family: "STSong, serif" },
                      { name: 'STHeiti (华文黑体)', family: "STHeiti, sans-serif" },
                      { name: 'Noto Sans SC', family: "'Noto Sans SC', sans-serif" }
                    ].map((font) => (
                      <button
                        key={font.name}
                        onClick={() => {
                          const preview = document.getElementById('font-preview');
                          if (preview) preview.style.fontFamily = font.family;
                        }}
                        className="p-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-all text-left"
                      >
                        <div className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                          {font.name}
                        </div>
                        <div
                          className="text-xs text-gray-500 dark:text-gray-400 mt-1"
                          style={{ fontFamily: font.family }}
                        >
                          西文教室 ABC
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Toggle de negrita */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    Peso de la fuente:
                  </label>
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        const preview = document.getElementById('font-preview');
                        if (preview) preview.style.fontWeight = 'normal';
                      }}
                      className="flex-1 p-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-all"
                    >
                      Normal
                    </button>
                    <button
                      onClick={() => {
                        const preview = document.getElementById('font-preview');
                        if (preview) preview.style.fontWeight = 'bold';
                      }}
                      className="flex-1 p-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-all"
                    >
                      Negrita
                    </button>
                  </div>
                </div>

                {/* Vista previa grande */}
                <div className="mt-8 p-8 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl border-2 border-purple-200 dark:border-purple-700">
                  <div className="text-center">
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                      Vista Previa:
                    </div>
                    <div
                      id="font-preview"
                      className="text-6xl text-gray-900 dark:text-gray-100 transition-all duration-300"
                      style={{ fontFamily: "'Microsoft YaHei', sans-serif", fontWeight: 'bold' }}
                    >
                      西文教室
                    </div>
                    <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                      (Aula de Español)
                    </div>
                  </div>
                </div>

                {/* Nota informativa */}
                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>💡 Nota:</strong> Esta es una herramienta temporal para probar fuentes. La fuente seleccionada aquí no se aplicará automáticamente al resto de la aplicación.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ========================================= */}
          {/* TAB 4: AVANZADO (Progreso + Imágenes IA) */}
          {/* ========================================= */}
          {activeTab === 'advanced' && (
            <div className="space-y-8">
              {/* Sección: Imágenes IA */}
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 pb-2 border-b-2 border-purple-200 dark:border-purple-800">
                  🎨 Generación de Imágenes IA
                </h3>
                <AIImageGenerator alwaysOpen={true} />
              </div>

              {/* Sección: Progreso */}
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 pb-2 border-b-2 border-purple-200 dark:border-purple-800">
                  📊 Progreso y Estadísticas
                </h3>
                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg mb-4">
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
            </div>
          )}
        </div>

        {/* Footer Sticky con botón Guardar */}
        <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 flex-shrink-0">
          {saveMessage && (
            <div className={`mb-3 p-3 rounded-lg flex items-center gap-2 text-sm ${
              saveMessage.type === 'success'
                ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-800'
                : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800'
            }`}>
              {saveMessage.text}
            </div>
          )}
          <div className="flex gap-3">
            <BaseButton
              variant="ghost"
              size="md"
              onClick={onClose}
              className="flex-1"
            >
              Cerrar
            </BaseButton>
            <BaseButton
              variant="primary"
              size="md"
              onClick={handleSaveSettings}
              className="flex-1"
            >
              Guardar Configuración
            </BaseButton>
          </div>
        </div>
      </div>
    </BaseModal>
  );
}

SettingsModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  characters: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired
    })
  )
};

export default SettingsModal;
