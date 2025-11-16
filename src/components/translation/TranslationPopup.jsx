/**
 * TranslationPopup Component
 * Displays translation results in a beautiful popup near the selected text
 * Now supports customizable sections based on user configuration
 */

import React, { useEffect, useRef, useState } from 'react';
import { X, Copy, Check, Loader2, Languages } from 'lucide-react';
import PropTypes from 'prop-types';

const TranslationPopup = ({
  translation,
  position,
  onClose,
  isLoading = false,
  error = null
}) => {
  const popupRef = useRef(null);
  const [copied, setCopied] = useState(false);
  const [config, setConfig] = useState(null);

  // Load configuration
  useEffect(() => {
    try {
      const saved = localStorage.getItem('xiwen_translator_config');
      if (saved) {
        setConfig(JSON.parse(saved));
      }
    } catch (err) {
      console.error('Error loading translator config:', err);
    }
  }, []);

  // Close on ESC key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popupRef.current && !popupRef.current.contains(e.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Handle copy to clipboard
  const handleCopy = async () => {
    if (!translation) return;

    const textToCopy = `${translation.word} → ${translation.chinese} (${translation.pinyin})\n${translation.meanings?.join('\n') || ''}`;

    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
    }
  };

  // Calculate popup position to keep it in viewport
  const getPopupStyle = () => {
    const baseStyle = {
      position: 'fixed',
      zIndex: 10000,
    };

    if (!position) {
      return {
        ...baseStyle,
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      };
    }

    const { top, left, width } = position;
    const popupWidth = config?.display?.popupWidth || 320;
    const popupMaxHeight = 400;

    // Calculate positions
    let finalTop = top - popupMaxHeight - 10; // Above selection by default
    let finalLeft = left + width / 2 - popupWidth / 2; // Centered

    // Adjust if popup goes above viewport
    if (finalTop < 10) {
      finalTop = top + 30; // Below selection
    }

    // Adjust if popup goes outside left edge
    if (finalLeft < 10) {
      finalLeft = 10;
    }

    // Adjust if popup goes outside right edge
    if (finalLeft + popupWidth > window.innerWidth - 10) {
      finalLeft = window.innerWidth - popupWidth - 10;
    }

    return {
      ...baseStyle,
      top: `${finalTop}px`,
      left: `${finalLeft}px`,
      width: `${popupWidth}px`
    };
  };

  // Helper: Check if section is enabled
  const isSectionEnabled = (sectionName) => {
    if (!config?.sections) return true; // Show all if no config
    return config.sections[sectionName] !== false;
  };

  return (
    <div
      ref={popupRef}
      style={getPopupStyle()}
      className="w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
          <Languages size={18} strokeWidth={2} />
          <span className="font-semibold text-sm">Traducción</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          aria-label="Cerrar"
        >
          <X size={18} className="text-gray-500 dark:text-gray-400" />
        </button>
      </div>

      {/* Content */}
      <div className="px-4 py-3 max-h-96 overflow-y-auto">
        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-8 gap-3">
            <Loader2 size={32} className="text-blue-600 dark:text-blue-400 animate-spin" />
            <p className="text-sm text-gray-600 dark:text-gray-400">Traduciendo...</p>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="flex flex-col items-center justify-center py-8 gap-3">
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <X size={24} className="text-red-600 dark:text-red-400" />
            </div>
            <p className="text-sm text-red-600 dark:text-red-400 text-center">{error}</p>
          </div>
        )}

        {/* Translation Result */}
        {translation && !isLoading && !error && (
          <div className="space-y-4">
            {/* Original Word */}
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Español</div>
              <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {translation.word}
              </div>
            </div>

            {/* Chinese Translation */}
            {isSectionEnabled('chinese') && translation.chinese && (
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                <div className="flex items-baseline gap-2">
                  <span
                    className="font-bold text-blue-900 dark:text-blue-100"
                    style={{
                      fontFamily: 'serif',
                      fontSize: `${config?.display?.chineseFontSize || 24}px`
                    }}
                  >
                    {translation.chinese}
                  </span>
                  {isSectionEnabled('pinyin') && translation.pinyin && (
                    <span className="text-sm text-blue-700 dark:text-blue-300 italic">
                      {translation.pinyin}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Meanings */}
            {isSectionEnabled('meanings') && translation.meanings && translation.meanings.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
                  {config?.display?.showIcons !== false && <span className="text-base">💡</span>}
                  Significados:
                </div>
                <ul className="space-y-1.5">
                  {translation.meanings.slice(0, config?.sections?.meaningsLimit || 3).map((meaning, index) => (
                    <li
                      key={index}
                      className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2"
                    >
                      <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                      <span>{meaning}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Example */}
            {isSectionEnabled('example') && translation.example && (
              <div>
                <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
                  {config?.display?.showIcons !== false && <span className="text-base">📝</span>}
                  Ejemplo:
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 space-y-2">
                  <div className="text-sm">
                    <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">ES</span>
                    <span className="ml-2 text-gray-800 dark:text-gray-200">
                      {translation.example.spanish}
                    </span>
                  </div>
                  <div className="text-sm">
                    <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">中文</span>
                    <span className="ml-2 text-gray-800 dark:text-gray-200" style={{ fontFamily: 'serif' }}>
                      {translation.example.chinese}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Synonyms (NEW) */}
            {isSectionEnabled('synonyms') && translation.synonyms && translation.synonyms.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
                  {config?.display?.showIcons !== false && <span className="text-base">🔄</span>}
                  Sinónimos:
                </div>
                <div className="flex flex-wrap gap-2">
                  {translation.synonyms.map((syn, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs rounded"
                    >
                      {syn}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* HSK Level (NEW) */}
            {isSectionEnabled('hskLevel') && translation.hskLevel && (
              <div>
                <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
                  {config?.display?.showIcons !== false && <span className="text-base">📊</span>}
                  Nivel HSK:
                </div>
                <span className="inline-block px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-sm font-semibold rounded">
                  HSK {translation.hskLevel}
                </span>
              </div>
            )}

            {/* Classifier (NEW) */}
            {isSectionEnabled('classifier') && translation.classifier && (
              <div>
                <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
                  {config?.display?.showIcons !== false && <span className="text-base">🔢</span>}
                  Clasificador (量词):
                </div>
                <span className="text-sm text-gray-700 dark:text-gray-300 font-serif">
                  {translation.classifier}
                </span>
              </div>
            )}

            {/* Source indicator */}
            {translation.source && (
              <div className="text-xs text-gray-500 dark:text-gray-400 text-right">
                Fuente: {translation.source === 'local' ? 'Diccionario local' : translation.source === 'mdbg' ? 'MDBG CC-CEDICT' : 'AI'}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Actions */}
      {translation && !isLoading && !error && (
        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            Cerrar
          </button>
          <button
            onClick={handleCopy}
            className="px-3 py-1.5 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-1.5"
          >
            {copied ? (
              <>
                <Check size={14} strokeWidth={2} />
                Copiado
              </>
            ) : (
              <>
                <Copy size={14} strokeWidth={2} />
                Copiar
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

TranslationPopup.propTypes = {
  translation: PropTypes.shape({
    word: PropTypes.string.isRequired,
    chinese: PropTypes.string.isRequired,
    pinyin: PropTypes.string,
    meanings: PropTypes.arrayOf(PropTypes.string),
    example: PropTypes.shape({
      spanish: PropTypes.string,
      chinese: PropTypes.string
    })
  }),
  position: PropTypes.shape({
    top: PropTypes.number.isRequired,
    left: PropTypes.number.isRequired,
    width: PropTypes.number.isRequired
  }),
  onClose: PropTypes.func.isRequired,
  isLoading: PropTypes.bool,
  error: PropTypes.string
};

export default TranslationPopup;
