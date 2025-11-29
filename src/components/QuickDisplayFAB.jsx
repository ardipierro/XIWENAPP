/**
 * @fileoverview FAB (Floating Action Button) para ajustes rápidos de visualización
 * @module components/QuickDisplayFAB
 *
 * Botón flotante que despliega un panel compacto para ajustar:
 * - Tamaño de fuente (A- / A+)
 * - Ancho del contenido
 * - Pantalla completa
 *
 * Los cambios son TEMPORALES (solo para la sesión actual)
 * 100% Tailwind CSS | Dark Mode | Mobile First
 */

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Settings2,
  X,
  Maximize2,
  Minimize2,
  Type,
  Minus,
  Plus,
  AlignLeft,
  AlignCenter,
  AlignJustify,
  RotateCcw
} from 'lucide-react';
import {
  FONT_SIZE_OPTIONS,
  FONT_SIZE_LABELS,
  WIDTH_OPTIONS,
  WIDTH_LABELS,
  ALIGN_OPTIONS,
  LAYOUT_OPTIONS,
  DEFAULT_DISPLAY_SETTINGS,
  getDisplayClasses,
  getDisplayStyles
} from '../constants/displaySettings';
import logger from '../utils/logger';

/**
 * Orden de tamaños de fuente para incrementar/decrementar
 */
const FONT_SIZE_ORDER = [
  FONT_SIZE_OPTIONS.SM,
  FONT_SIZE_OPTIONS.BASE,
  FONT_SIZE_OPTIONS.LG,
  FONT_SIZE_OPTIONS.XL,
  FONT_SIZE_OPTIONS.XXL
];

/**
 * QuickDisplayFAB - Botón flotante con panel de ajustes rápidos
 *
 * @param {Object} props
 * @param {Object} [props.initialSettings] - Settings iniciales (del contenedor)
 * @param {Function} props.onSettingsChange - Callback cuando cambian los settings
 * @param {boolean} [props.isFullscreen] - Si está en modo fullscreen
 * @param {Function} [props.onToggleFullscreen] - Toggle fullscreen
 * @param {string} [props.position] - Posición del FAB ('bottom-right' | 'bottom-left')
 */
function QuickDisplayFAB({
  initialSettings,
  onSettingsChange,
  isFullscreen = false,
  onToggleFullscreen,
  position = 'bottom-right'
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState(() => ({
    ...DEFAULT_DISPLAY_SETTINGS,
    ...initialSettings
  }));
  const panelRef = useRef(null);
  const fabRef = useRef(null);

  // Sincronizar con settings iniciales cuando cambien
  useEffect(() => {
    if (initialSettings) {
      setSettings(prev => ({ ...prev, ...initialSettings }));
    }
  }, [initialSettings]);

  // Cerrar panel al hacer click afuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        isOpen &&
        panelRef.current &&
        !panelRef.current.contains(event.target) &&
        fabRef.current &&
        !fabRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Cerrar con Escape
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  /**
   * Actualiza un setting y notifica al padre
   */
  const updateSetting = (key, value) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    onSettingsChange?.(newSettings);
    logger.debug(`Quick setting actualizado: ${key} = ${value}`, 'QuickDisplayFAB');
  };

  /**
   * Incrementa el tamaño de fuente
   */
  const increaseFontSize = () => {
    const currentIndex = FONT_SIZE_ORDER.indexOf(settings.fontSize);
    if (currentIndex < FONT_SIZE_ORDER.length - 1) {
      updateSetting('fontSize', FONT_SIZE_ORDER[currentIndex + 1]);
    }
  };

  /**
   * Decrementa el tamaño de fuente
   */
  const decreaseFontSize = () => {
    const currentIndex = FONT_SIZE_ORDER.indexOf(settings.fontSize);
    if (currentIndex > 0) {
      updateSetting('fontSize', FONT_SIZE_ORDER[currentIndex - 1]);
    }
  };

  /**
   * Cicla entre las opciones de ancho
   */
  const cycleWidth = () => {
    const widths = [WIDTH_OPTIONS.NARROW, WIDTH_OPTIONS.MEDIUM, WIDTH_OPTIONS.WIDE, WIDTH_OPTIONS.FULL];
    const currentIndex = widths.indexOf(settings.contentWidth);
    const nextIndex = (currentIndex + 1) % widths.length;
    updateSetting('contentWidth', widths[nextIndex]);
  };

  /**
   * Cicla entre las opciones de alineación
   */
  const cycleAlign = () => {
    const aligns = [ALIGN_OPTIONS.LEFT, ALIGN_OPTIONS.CENTER, ALIGN_OPTIONS.JUSTIFY];
    const currentIndex = aligns.indexOf(settings.textAlign);
    const nextIndex = (currentIndex + 1) % aligns.length;
    updateSetting('textAlign', aligns[nextIndex]);
  };

  /**
   * Resetea a valores por defecto
   */
  const handleReset = () => {
    const resetSettings = { ...DEFAULT_DISPLAY_SETTINGS, ...initialSettings };
    setSettings(resetSettings);
    onSettingsChange?.(resetSettings);
    logger.info('Quick settings reseteados', 'QuickDisplayFAB');
  };

  // Posición del FAB
  const positionClasses = position === 'bottom-left'
    ? 'left-4 bottom-4'
    : 'right-4 bottom-4';

  // Icono de alineación actual
  const AlignIcon = {
    [ALIGN_OPTIONS.LEFT]: AlignLeft,
    [ALIGN_OPTIONS.CENTER]: AlignCenter,
    [ALIGN_OPTIONS.JUSTIFY]: AlignJustify
  }[settings.textAlign] || AlignLeft;

  // Índice actual del font size para mostrar indicador
  const fontSizeIndex = FONT_SIZE_ORDER.indexOf(settings.fontSize);
  const canDecrease = fontSizeIndex > 0;
  const canIncrease = fontSizeIndex < FONT_SIZE_ORDER.length - 1;

  const fabContent = (
    <div className={`fixed ${positionClasses}`} style={{ zIndex: 10002 }}>
      {/* Panel de ajustes */}
      {isOpen && (
        <div
          ref={panelRef}
          className={`
            absolute ${position === 'bottom-left' ? 'left-0' : 'right-0'} bottom-16
            w-64 p-4 rounded-xl
            bg-white dark:bg-zinc-800
            border border-zinc-200 dark:border-zinc-700
            shadow-2xl
            animate-in fade-in slide-in-from-bottom-2 duration-200
          `}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-semibold text-zinc-900 dark:text-white">
              Ajustes Rápidos
            </h4>
            <button
              onClick={handleReset}
              className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
              title="Resetear"
            >
              <RotateCcw size={14} />
            </button>
          </div>

          {/* Tamaño de fuente */}
          <div className="mb-4">
            <label className="text-xs text-zinc-500 dark:text-zinc-400 mb-2 block">
              Tamaño de Fuente
            </label>
            <div className="flex items-center justify-between bg-zinc-100 dark:bg-zinc-700/50 rounded-lg p-1">
              <button
                onClick={decreaseFontSize}
                disabled={!canDecrease}
                className={`
                  p-2 rounded-lg transition-colors
                  ${canDecrease
                    ? 'hover:bg-white dark:hover:bg-zinc-600 text-zinc-700 dark:text-zinc-300'
                    : 'text-zinc-400 dark:text-zinc-500 cursor-not-allowed'
                  }
                `}
              >
                <Minus size={16} />
              </button>
              <div className="flex items-center gap-1">
                <Type size={16} className="text-zinc-600 dark:text-zinc-400" />
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 min-w-[60px] text-center">
                  {FONT_SIZE_LABELS[settings.fontSize]}
                </span>
              </div>
              <button
                onClick={increaseFontSize}
                disabled={!canIncrease}
                className={`
                  p-2 rounded-lg transition-colors
                  ${canIncrease
                    ? 'hover:bg-white dark:hover:bg-zinc-600 text-zinc-700 dark:text-zinc-300'
                    : 'text-zinc-400 dark:text-zinc-500 cursor-not-allowed'
                  }
                `}
              >
                <Plus size={16} />
              </button>
            </div>
            {/* Indicador visual */}
            <div className="flex justify-center gap-1 mt-2">
              {FONT_SIZE_ORDER.map((size, idx) => (
                <div
                  key={size}
                  className={`
                    w-2 h-2 rounded-full transition-colors
                    ${idx === fontSizeIndex
                      ? 'bg-indigo-500'
                      : 'bg-zinc-300 dark:bg-zinc-600'
                    }
                  `}
                />
              ))}
            </div>
          </div>

          {/* Ancho y Alineación */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            {/* Ancho */}
            <button
              onClick={cycleWidth}
              className="flex flex-col items-center gap-1 p-3 rounded-lg bg-zinc-100 dark:bg-zinc-700/50 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
            >
              <div className="w-6 h-4 border-2 border-zinc-600 dark:border-zinc-400 rounded-sm flex justify-center overflow-hidden">
                <div
                  className="h-full bg-zinc-600 dark:bg-zinc-400 transition-all"
                  style={{
                    width: {
                      [WIDTH_OPTIONS.NARROW]: '30%',
                      [WIDTH_OPTIONS.MEDIUM]: '50%',
                      [WIDTH_OPTIONS.WIDE]: '75%',
                      [WIDTH_OPTIONS.FULL]: '100%'
                    }[settings.contentWidth]
                  }}
                />
              </div>
              <span className="text-xs text-zinc-600 dark:text-zinc-400">
                {WIDTH_LABELS[settings.contentWidth]}
              </span>
            </button>

            {/* Alineación */}
            <button
              onClick={cycleAlign}
              className="flex flex-col items-center gap-1 p-3 rounded-lg bg-zinc-100 dark:bg-zinc-700/50 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
            >
              <AlignIcon size={20} className="text-zinc-600 dark:text-zinc-400" />
              <span className="text-xs text-zinc-600 dark:text-zinc-400">
                {settings.textAlign === ALIGN_OPTIONS.LEFT ? 'Izquierda' :
                 settings.textAlign === ALIGN_OPTIONS.CENTER ? 'Centro' : 'Justificar'}
              </span>
            </button>
          </div>

          {/* Fullscreen toggle */}
          {onToggleFullscreen && (
            <button
              onClick={() => {
                onToggleFullscreen();
                setIsOpen(false);
              }}
              className={`
                w-full flex items-center justify-center gap-2 p-3 rounded-lg
                transition-colors
                ${isFullscreen
                  ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border-2 border-indigo-300 dark:border-indigo-700'
                  : 'bg-zinc-100 dark:bg-zinc-700/50 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                }
              `}
            >
              {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
              <span className="text-sm font-medium">
                {isFullscreen ? 'Salir de Pantalla Completa' : 'Pantalla Completa'}
              </span>
            </button>
          )}

          {/* Nota */}
          <p className="mt-3 text-xs text-zinc-400 dark:text-zinc-500 text-center">
            Cambios temporales (solo esta sesión)
          </p>
        </div>
      )}

      {/* FAB Button */}
      <button
        ref={fabRef}
        onClick={() => setIsOpen(!isOpen)}
        className={`
          w-12 h-12 rounded-full
          flex items-center justify-center
          shadow-lg hover:shadow-xl
          transition-all duration-200
          ${isOpen
            ? 'bg-zinc-800 dark:bg-zinc-200 text-white dark:text-zinc-800 rotate-90'
            : 'bg-indigo-600 dark:bg-indigo-500 text-white hover:bg-indigo-700 dark:hover:bg-indigo-600'
          }
        `}
        title="Ajustes de visualización"
      >
        {isOpen ? <X size={20} /> : <Settings2 size={20} />}
      </button>
    </div>
  );

  // Render con portal para estar encima de todo
  return createPortal(fabContent, document.body);
}

export default QuickDisplayFAB;
