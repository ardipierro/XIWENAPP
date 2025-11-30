/**
 * SelectionDetector Component
 * Detects text selection and shows translation + speaker + dictionary buttons
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Languages, BookOpen, X, ExternalLink, Copy, Check } from 'lucide-react';
import PropTypes from 'prop-types';
import TranslationPopup from './TranslationPopup';
import SpeakerButton from '../selection/SpeakerButton';
import useTranslator from '../../hooks/useTranslator';
import useSpeaker from '../../hooks/useSpeaker';
import { autoTranslate, isGoogleTranslateConfigured } from '../../services/googleTranslateService';
import logger from '../../utils/logger';

const SelectionDetector = ({ children, enabled = true, containerRef = null }) => {
  const [selectedText, setSelectedText] = useState('');
  const [selectionPosition, setSelectionPosition] = useState(null);
  const [showButtons, setShowButtons] = useState(false);
  const [showPopup, setShowPopup] = useState(false);

  // Estados para el diccionario de Google Translate
  const [showDictPopup, setShowDictPopup] = useState(false);
  const [dictTranslation, setDictTranslation] = useState(null);
  const [isDictLoading, setIsDictLoading] = useState(false);
  const [dictError, setDictError] = useState(null);
  const [copied, setCopied] = useState(false);

  const buttonsRef = useRef(null);
  const selectionTimeoutRef = useRef(null); // ✅ Para debouncing en iOS
  const { translate, isTranslating, error, lastTranslation, clearError } = useTranslator();
  const { speak, isGenerating, error: speakError, clearError: clearSpeakError } = useSpeaker();

  /**
   * Handle text selection
   * ✅ Mejorado para iOS/iPad con debouncing
   */
  const handleSelection = useCallback(() => {
    if (!enabled) return;

    // ✅ Clear previous timeout (debouncing)
    if (selectionTimeoutRef.current) {
      clearTimeout(selectionTimeoutRef.current);
    }

    // ✅ Delay para permitir que iOS complete la selección nativa
    selectionTimeoutRef.current = setTimeout(() => {
      const selection = window.getSelection();
      const text = selection.toString().trim();

      if (text && text.length > 0 && text.length <= 200) {
        // Only translate reasonable length text
        try {
          const range = selection.getRangeAt(0);
          const rect = range.getBoundingClientRect();

          // Check if selection is within our container (if provided)
          if (containerRef?.current) {
            const containerRect = containerRef.current.getBoundingClientRect();
            const isInContainer =
              rect.top >= containerRect.top &&
              rect.bottom <= containerRect.bottom &&
              rect.left >= containerRect.left &&
              rect.right <= containerRect.right;

            if (!isInContainer) {
              setShowButtons(false);
              return;
            }
          }

          setSelectedText(text);
          setSelectionPosition({
            top: rect.top + window.scrollY,
            left: rect.left + window.scrollX,
            width: rect.width,
            bottom: rect.bottom + window.scrollY
          });
          setShowButtons(true);
          setShowPopup(false); // Hide popup if showing
        } catch (err) {
          // ✅ Manejo de errores si no hay rango (puede pasar en iOS)
          logger.warn('Selection error (expected on iOS):', err);
          setShowButtons(false);
          setShowPopup(false);
        }
      } else {
        setShowButtons(false);
        setShowPopup(false);
      }
    }, 100); // ✅ 100ms delay para iOS
  }, [enabled, containerRef]);

  /**
   * Handle translate button click
   */
  const handleTranslate = useCallback(async () => {
    if (!selectedText) return;

    try {
      await translate(selectedText);
      setShowButtons(false);
      setShowPopup(true);
    } catch (err) {
      logger.error('Translation error:', err, 'SelectionDetector');
      setShowPopup(true); // Show popup with error
    }
  }, [selectedText, translate]);

  /**
   * Handle speak button click
   * Uses configuration from Firebase (ai_config/global/functions/selection_speaker)
   */
  const handleSpeak = useCallback(async () => {
    if (!selectedText) return;

    try {
      logger.info(`🔊 Speaking selected text: "${selectedText.substring(0, 30)}..."`, 'SelectionDetector');

      // Speak with default configuration from Firebase
      // The useSpeaker hook loads config automatically
      await speak(selectedText);

      // Keep buttons visible while speaking
      // They will hide on new selection or click outside
    } catch (err) {
      logger.error('Speaking error:', err, 'SelectionDetector');
      // Error is handled by useSpeaker hook
    }
  }, [selectedText, speak]);

  /**
   * Handle dictionary button click - Uses Google Translate API
   */
  const handleDictionary = useCallback(async () => {
    if (!selectedText) return;

    setIsDictLoading(true);
    setDictError(null);
    setDictTranslation(null);

    try {
      logger.info(`📖 Dictionary lookup: "${selectedText.substring(0, 30)}..."`, 'SelectionDetector');

      // Verificar si Google Translate está configurado
      const isConfigured = await isGoogleTranslateConfigured();
      if (!isConfigured) {
        throw new Error('Google Translate no configurado. Ve a Ajustes > Credenciales para agregar tu API key.');
      }

      const result = await autoTranslate(selectedText);

      // BACK-TRANSLATION: Si tradujo ES→ZH, buscar en diccionario local qué significa ese chino
      if (result.targetLang === 'zh-CN' && result.translatedText) {
        try {
          const { searchDictionary } = await import('../../services/dictionaryService');
          const backResults = await searchDictionary(result.translatedText, {
            limit: 1,
            searchType: 'chinese'
          });

          if (backResults.length > 0 && backResults[0].meanings) {
            result.backTranslation = backResults[0].meanings;
            console.log('[SelectionDetector] ✅ Back-translation added from dictionary:', backResults[0].meanings);
          }
        } catch (err) {
          console.warn('[SelectionDetector] Back-translation failed:', err);
        }
      }

      setDictTranslation(result);
      setShowButtons(false);
      setShowDictPopup(true);

    } catch (err) {
      logger.error('Dictionary error:', err, 'SelectionDetector');
      setDictError(err.message || 'Error al consultar diccionario');
      setShowButtons(false);
      setShowDictPopup(true);
    } finally {
      setIsDictLoading(false);
    }
  }, [selectedText]);

  /**
   * Copy translation to clipboard
   */
  const handleCopyTranslation = useCallback(async () => {
    if (!dictTranslation?.translatedText) return;

    try {
      await navigator.clipboard.writeText(dictTranslation.translatedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      logger.error('Copy error:', err, 'SelectionDetector');
    }
  }, [dictTranslation]);

  /**
   * Open external dictionary (MDBG) in new tab
   */
  const handleOpenExternal = useCallback(() => {
    if (!selectedText) return;

    // Detectar si es chino o español
    const hasChineseChars = /[\u4e00-\u9fa5]/.test(selectedText);

    if (hasChineseChars) {
      // Para texto chino, buscar en MDBG
      window.open(`https://www.mdbg.net/chinese/dictionary?page=worddict&wdrst=0&wdqb=${encodeURIComponent(selectedText)}`, '_blank');
    } else {
      // Para texto español, buscar en Google Translate web
      window.open(`https://translate.google.com/?sl=es&tl=zh-CN&text=${encodeURIComponent(selectedText)}&op=translate`, '_blank');
    }
  }, [selectedText]);

  /**
   * Close popup and reset state
   */
  const handleClosePopup = useCallback(() => {
    setShowPopup(false);
    setShowDictPopup(false);
    setShowButtons(false);
    setSelectedText('');
    setSelectionPosition(null);
    setDictTranslation(null);
    setDictError(null);
    clearError();
    clearSpeakError();

    // Clear text selection
    if (window.getSelection) {
      window.getSelection().removeAllRanges();
    }
  }, [clearError, clearSpeakError]);

  /**
   * Handle click outside buttons
   */
  const handleClickOutside = useCallback((e) => {
    if (buttonsRef.current && !buttonsRef.current.contains(e.target)) {
      setShowButtons(false);
    }
  }, []);

  // Set up selection listener
  // ✅ Mejorado para iOS/iPad
  useEffect(() => {
    if (!enabled) return;

    document.addEventListener('mouseup', handleSelection);
    document.addEventListener('touchend', handleSelection);
    document.addEventListener('selectionchange', handleSelection); // ✅ Mejor para iOS
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mouseup', handleSelection);
      document.removeEventListener('touchend', handleSelection);
      document.removeEventListener('selectionchange', handleSelection);
      document.removeEventListener('mousedown', handleClickOutside);

      // ✅ Limpiar timeout al desmontar
      if (selectionTimeoutRef.current) {
        clearTimeout(selectionTimeoutRef.current);
      }
    };
  }, [enabled, handleSelection, handleClickOutside]);

  /**
   * Calculate buttons container position
   * Displays 3 buttons side by side on desktop, stacked on mobile
   * ✅ Mejorado para iPad con área táctil más grande
   */
  const getButtonsStyle = () => {
    if (!selectionPosition) return {};

    const buttonsWidth = 420; // ✅ Aumentado para 3 botones
    const buttonsHeight = 48; // ✅ Aumentado a 48px (mínimo recomendado para touch)
    const offset = 12; // ✅ Mayor offset para no cubrir el texto seleccionado

    // Position buttons below selection by default
    let top = selectionPosition.bottom + offset;
    let left = selectionPosition.left + selectionPosition.width / 2 - buttonsWidth / 2;

    // If buttons would be below viewport, position them above selection
    if (top + buttonsHeight > window.innerHeight + window.scrollY - 20) {
      top = selectionPosition.top - buttonsHeight - offset;
    }

    // Keep buttons within horizontal bounds (mobile-first)
    const horizontalPadding = 10;
    if (left < horizontalPadding) {
      left = horizontalPadding;
    }
    if (left + buttonsWidth > window.innerWidth - horizontalPadding) {
      left = window.innerWidth - buttonsWidth - horizontalPadding;
    }

    return {
      position: 'fixed',
      top: `${top - window.scrollY}px`,
      left: `${left - window.scrollX}px`,
      zIndex: 'var(--z-popover)' // Using CSS variable (1060)
    };
  };

  return (
    <>
      {children}

      {/* Action Buttons - Translate + Speak */}
      {showButtons && !showPopup && (
        <div
          ref={buttonsRef}
          style={getButtonsStyle()}
          className="animate-in fade-in slide-in-from-top-1 duration-150"
        >
          <div className="flex gap-2 flex-wrap">
            {/* Translate Button - ✅ Mejorado para iPad */}
            <button
              onClick={handleTranslate}
              disabled={isTranslating}
              className="
                flex items-center justify-center gap-2 px-4 py-3
                bg-blue-600 hover:bg-blue-700 dark:bg-gray-500 dark:hover:bg-blue-600
                disabled:bg-blue-400 dark:disabled:bg-blue-300
                text-white text-sm font-medium
                rounded-lg shadow-lg
                transition-all duration-200
                hover:scale-105 active:scale-95
                disabled:cursor-not-allowed
                min-h-[44px] min-w-[110px]
                touch-manipulation
              "
              style={{ WebkitTapHighlightColor: 'transparent' }}
              aria-label="Traducir texto seleccionado"
            >
              <Languages size={18} strokeWidth={2} />
              <span className="whitespace-nowrap">Traducir</span>
              <span className="text-xs opacity-90">翻译</span>
            </button>

            {/* Speak Button - ✅ Mejorado para iPad */}
            <button
              onClick={handleSpeak}
              disabled={isGenerating}
              className="
                flex items-center justify-center gap-2 px-4 py-3
                bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600
                disabled:bg-indigo-400 dark:disabled:bg-indigo-300
                text-white text-sm font-medium
                rounded-lg shadow-lg
                transition-all duration-200
                hover:scale-105 active:scale-95
                disabled:cursor-not-allowed
                min-h-[44px] min-w-[110px]
                touch-manipulation
              "
              style={{ WebkitTapHighlightColor: 'transparent' }}
              aria-label="Pronunciar texto seleccionado"
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span className="whitespace-nowrap">...</span>
                </>
              ) : (
                <>
                  <span className="text-base">🔊</span>
                  <span className="whitespace-nowrap">Pronunciar</span>
                </>
              )}
            </button>

            {/* Dictionary Button - Google Translate rápido */}
            <button
              onClick={handleDictionary}
              disabled={isDictLoading}
              className="
                flex items-center justify-center gap-2 px-4 py-3
                bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600
                disabled:bg-emerald-400 dark:disabled:bg-emerald-300
                text-white text-sm font-medium
                rounded-lg shadow-lg
                transition-all duration-200
                hover:scale-105 active:scale-95
                disabled:cursor-not-allowed
                min-h-[44px] min-w-[110px]
                touch-manipulation
              "
              style={{ WebkitTapHighlightColor: 'transparent' }}
              aria-label="Buscar en diccionario Google"
            >
              {isDictLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span className="whitespace-nowrap">...</span>
                </>
              ) : (
                <>
                  <BookOpen size={16} strokeWidth={2} />
                  <span className="whitespace-nowrap">Diccionario</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Translation Popup */}
      {showPopup && (
        <TranslationPopup
          translation={lastTranslation}
          position={selectionPosition}
          onClose={handleClosePopup}
          isLoading={isTranslating}
          error={error}
        />
      )}

      {/* Dictionary Popup - Google Translate Results */}
      {showDictPopup && (
        <div
          className="fixed inset-0 z-[1070] flex items-center justify-center p-4"
          onClick={handleClosePopup}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

          {/* Popup Card */}
          <div
            className="
              relative w-full max-w-sm
              bg-white dark:bg-gray-800
              rounded-2xl shadow-2xl
              border border-gray-200 dark:border-gray-700
              overflow-hidden
              animate-in zoom-in-95 fade-in duration-200
            "
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-emerald-500 to-teal-500">
              <div className="flex items-center gap-2 text-white">
                <BookOpen size={20} />
                <span className="font-semibold">Diccionario Rápido</span>
              </div>
              <button
                onClick={handleClosePopup}
                className="p-1 rounded-full hover:bg-white/20 text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-4">
              {/* Loading State */}
              {isDictLoading && (
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">Consultando Google Translate...</p>
                </div>
              )}

              {/* Error State */}
              {dictError && !isDictLoading && (
                <div className="py-4">
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                    <p className="text-sm text-red-700 dark:text-red-300">{dictError}</p>
                  </div>
                  <button
                    onClick={handleOpenExternal}
                    className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
                  >
                    <ExternalLink size={16} />
                    <span>Abrir en Google Translate</span>
                  </button>
                </div>
              )}

              {/* Success State */}
              {dictTranslation && !isDictLoading && !dictError && (
                <div className="space-y-4">
                  {/* Original Text */}
                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">
                      Original ({dictTranslation.sourceLang === 'es' ? 'Español' : 'Chino'})
                    </p>
                    <p className="text-base text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                      {dictTranslation.originalText}
                    </p>
                  </div>

                  {/* Translation */}
                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">
                      Traducción ({dictTranslation.targetLang === 'zh-CN' ? '中文' : 'Español'})
                    </p>
                    <div className="flex items-start gap-2">
                      <div className="flex-1 space-y-2">
                        <p
                          className={`
                            p-3 rounded-lg border-2 border-emerald-200 dark:border-emerald-800
                            bg-emerald-50 dark:bg-emerald-900/20
                            ${dictTranslation.targetLang === 'zh-CN' ? 'text-3xl font-medium' : 'text-base'}
                            text-gray-900 dark:text-white
                          `}
                        >
                          {dictTranslation.translatedText}
                        </p>
                        {/* Back-translation verification */}
                        {dictTranslation.backTranslation && dictTranslation.backTranslation.length > 0 && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/30 p-2 rounded border border-gray-200 dark:border-gray-700">
                            <span className="font-semibold">↩️ Verifica:</span>{' '}
                            <span className="italic">{dictTranslation.backTranslation.slice(0, 3).join('; ')}</span>
                          </div>
                        )}
                      </div>
                      <button
                        onClick={handleCopyTranslation}
                        className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        title="Copiar traducción"
                      >
                        {copied ? (
                          <Check size={18} className="text-emerald-500" />
                        ) : (
                          <Copy size={18} className="text-gray-600 dark:text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Source Badge */}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Fuente: Google Translate
                    </span>
                    <button
                      onClick={handleOpenExternal}
                      className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 hover:underline"
                    >
                      <ExternalLink size={12} />
                      Ver más detalles
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

SelectionDetector.propTypes = {
  children: PropTypes.node.isRequired,
  enabled: PropTypes.bool,
  containerRef: PropTypes.object
};

export default SelectionDetector;
