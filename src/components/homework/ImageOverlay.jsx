/**
 * @fileoverview Enhanced Image Overlay with Error Highlights
 * @module components/homework/ImageOverlay
 *
 * Displays homework image with colored bounding boxes highlighting errors
 * detected by AI. Uses word coordinates from Google Vision OCR.
 *
 * Features:
 * - Wavy underlines (Word-style)
 * - Zoom and pan controls
 * - Toggle errors by type
 * - Adjustable highlight opacity
 * - Improved matching with fuzzy logic
 */

import { useState, useEffect, useRef, useMemo, memo } from 'react';
import PropTypes from 'prop-types';
import { ChevronDown, ChevronUp } from 'lucide-react';

/**
 * Error type to color mapping
 */
const ERROR_COLORS = {
  spelling: '#ef4444',      // red-500
  grammar: '#f97316',       // orange-500
  punctuation: '#eab308',   // yellow-500
  vocabulary: '#5b8fa3',    // blue-500
  default: '#7a8fa8'        // purple-500
};

/**
 * Generate wavy line path (Word-style underline)
 */
function generateWavyPath(x1, y, x2, amplitude = 2, frequency = 4) {
  const length = x2 - x1;
  const numWaves = Math.max(1, Math.floor(length / frequency));
  const waveWidth = length / numWaves;

  let path = `M ${x1} ${y}`;

  for (let i = 0; i < numWaves; i++) {
    const x = x1 + (i * waveWidth);
    const nextX = x + waveWidth;
    const controlX1 = x + waveWidth / 4;
    const controlX2 = x + (3 * waveWidth) / 4;

    path += ` Q ${controlX1} ${y - amplitude}, ${x + waveWidth / 2} ${y}`;
    path += ` Q ${controlX2} ${y + amplitude}, ${nextX} ${y}`;
  }

  return path;
}

/**
 * Calculate optimal font size for correction text based on available width
 * @param {string} text - The correction text to display
 * @param {number} availableWidth - The width of the error highlight box
 * @param {number} minSize - Minimum font size (default 12)
 * @param {number} maxSize - Maximum font size (default 20)
 * @returns {number} Optimal font size in pixels
 */
function calculateOptimalFontSize(text, availableWidth, minSize = 12, maxSize = 20) {
  if (!text || availableWidth <= 0) return minSize;

  // Limit text to 30 characters as per requirement
  const displayText = text.length > 30 ? text.substring(0, 30) : text;

  // Estimate character width (handwriting fonts are ~0.55 of font size)
  // Caveat font has approximately 0.55 aspect ratio
  const estimatedCharWidth = 0.55;

  // Calculate required width for text
  const requiredWidth = displayText.length * estimatedCharWidth;

  // Calculate optimal size based on available width
  const optimalSize = availableWidth / requiredWidth;

  // Clamp between min and max
  return Math.max(minSize, Math.min(maxSize, Math.round(optimalSize)));
}

/**
 * Normalize text for matching (remove punctuation, accents, lowercase)
 */
function normalizeText(text) {
  if (!text) return '';
  return text
    .toLowerCase()
    .trim()
    // Remove accents
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    // Remove punctuation except spaces
    .replace(/[^\w\s]/g, '')
    // Normalize spaces
    .replace(/\s+/g, ' ');
}

/**
 * Calculate Levenshtein distance (edit distance) between two strings
 * Used for fuzzy matching when exact match fails
 * @param {string} a - First string
 * @param {string} b - Second string
 * @returns {number} Edit distance (lower = more similar)
 */
function levenshteinDistance(a, b) {
  if (!a || !b) return Math.max(a?.length || 0, b?.length || 0);
  if (a === b) return 0;

  const matrix = [];

  // Initialize first column
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  // Initialize first row
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  // Fill matrix
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Calculate similarity score (0-1) between two strings
 * 1.0 = identical, 0.0 = completely different
 * @param {string} a - First string
 * @param {string} b - Second string
 * @returns {number} Similarity score (0-1)
 */
function calculateSimilarity(a, b) {
  if (!a || !b) return 0;
  if (a === b) return 1;

  const maxLength = Math.max(a.length, b.length);
  if (maxLength === 0) return 1;

  const distance = levenshteinDistance(a, b);
  return 1 - (distance / maxLength);
}

/**
 * Check if two strings match (exact or fuzzy)
 * @param {string} text1 - First text (normalized)
 * @param {string} text2 - Second text (normalized)
 * @param {number} threshold - Similarity threshold (0-1, default 0.8 = 80% similar)
 * @returns {boolean} True if match
 */
function fuzzyMatch(text1, text2, threshold = 0.8) {
  if (!text1 || !text2) return false;

  // Exact match (fastest)
  if (text1 === text2) return true;

  // Check if one contains the other (partial match)
  if (text1.includes(text2) || text2.includes(text1)) return true;

  // Calculate similarity
  const similarity = calculateSimilarity(text1, text2);
  return similarity >= threshold;
}

/**
 * Extract error info from various formats
 */
function extractErrorInfo(error) {
  // Try different field names for error text
  const errorText = error.errorText || error.text || error.error || error.word || error.original || '';

  // Try different field names for error type
  const errorType = error.errorType || error.type || error.category || 'default';

  // Try different field names for suggestion
  const suggestion = error.suggestion || error.correctedText || error.correction || error.fix || '';

  return { errorText, errorType, suggestion };
}

/**
 * Enhanced Image Overlay Component
 * Memoized to prevent unnecessary re-renders
 */
function ImageOverlay({
  imageUrl,
  words = [],
  errors = [],
  showOverlay = true,
  visibleErrorTypes = {
    spelling: true,
    grammar: true,
    punctuation: true,
    vocabulary: true
  },
  highlightOpacity = 0.25,
  zoom = 1,
  pan = { x: 0, y: 0 },
  useWavyUnderline = true,
  showCorrectionText = true,
  correctionTextFont = 'Caveat',
  className = ''
}) {
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const [imageNaturalDimensions, setImageNaturalDimensions] = useState({ width: 0, height: 0 });
  const [debugInfo, setDebugInfo] = useState(null);
  const [debugExpanded, setDebugExpanded] = useState(true);
  const imageRef = useRef(null);
  const containerRef = useRef(null);

  // Handle image load to get dimensions
  useEffect(() => {
    const img = imageRef.current;
    if (!img) return;

    const updateDimensions = () => {
      setImageDimensions({
        width: img.clientWidth,
        height: img.clientHeight
      });
      setImageNaturalDimensions({
        width: img.naturalWidth,
        height: img.naturalHeight
      });
    };

    // Initial load
    if (img.complete) {
      updateDimensions();
    } else {
      img.addEventListener('load', updateDimensions);
    }

    // Handle window resize
    const resizeObserver = new ResizeObserver(updateDimensions);
    resizeObserver.observe(img);

    return () => {
      img.removeEventListener('load', updateDimensions);
      resizeObserver.disconnect();
    };
  }, [imageUrl]);

  /**
   * Map errors to word coordinates with improved matching
   */
  const getErrorHighlights = () => {
    if (!words || words.length === 0 || !errors || errors.length === 0) {
      console.log('[ImageOverlay] No highlights:', {
        hasWords: !!words?.length,
        hasErrors: !!errors?.length,
        wordsCount: words?.length || 0,
        errorsCount: errors?.length || 0
      });
      return { highlights: [], stats: null };
    }

    // Wait for image dimensions to be available
    if (imageDimensions.width === 0 || imageNaturalDimensions.width === 0) {
      console.log('[ImageOverlay] Waiting for image dimensions...');
      return { highlights: [], stats: null };
    }

    const highlights = [];
    const matchingStats = {
      attempted: 0,
      matched: 0,
      unmatched: [],
      filteredByType: 0
    };

    // Calculate scale factors
    const scaleX = imageDimensions.width / imageNaturalDimensions.width;
    const scaleY = imageDimensions.height / imageNaturalDimensions.height;

    console.log('[ImageOverlay] Starting matching:', {
      errors: errors.length,
      words: words.length,
      scaleX,
      scaleY,
      imageDimensions,
      imageNaturalDimensions
    });

    // Sample first 3 words and errors for debugging
    console.log('[ImageOverlay] Sample words:', words.slice(0, 3).map(w => ({
      text: w.text,
      hasBounds: !!w.bounds,
      bounds: w.bounds
    })));
    console.log('[ImageOverlay] Sample errors:', errors.slice(0, 3).map(e => {
      const extracted = extractErrorInfo(e);
      return {
        original: e,
        extracted,
        hasText: !!extracted.errorText
      };
    }));

    errors.forEach((error, errorIndex) => {
      matchingStats.attempted++;
      const { errorText, errorType, suggestion } = extractErrorInfo(error);

      if (!errorText) {
        console.log(`[ImageOverlay] Error ${errorIndex}: No text found`);
        return;
      }

      // Filter by visible error types
      if (!visibleErrorTypes[errorType]) {
        matchingStats.filteredByType++;
        return;
      }

      // Normalize error text for matching
      const normalizedError = normalizeText(errorText);
      if (!normalizedError) {
        console.log(`[ImageOverlay] Error ${errorIndex}: Empty after normalization`);
        return;
      }

      const errorWords = normalizedError.split(/\s+/);
      let matched = false;

      // Try to find matching word(s) in coordinates
      // ✨ NEW: Support exact AND fuzzy matching
      for (let i = 0; i < words.length && !matched; i++) {
        const word = words[i];

        // Validate word structure
        if (!word.text || !word.bounds) {
          continue;
        }

        const normalizedWord = normalizeText(word.text);

        // ✨ IMPROVED: Single word match with fuzzy matching
        // Try exact match first (fastest), then fuzzy match
        const isSingleWordMatch = normalizedWord === normalizedError || fuzzyMatch(normalizedWord, normalizedError, 0.75);

        if (isSingleWordMatch) {
          highlights.push({
            x: word.bounds.x * scaleX,
            y: word.bounds.y * scaleY,
            width: word.bounds.width * scaleX,
            height: word.bounds.height * scaleY,
            color: ERROR_COLORS[errorType] || ERROR_COLORS.default,
            errorType: errorType,
            errorText: errorText,
            suggestion: suggestion,
            id: `error-${errorIndex}-word-${i}`
          });
          matched = true;
          matchingStats.matched++;
          console.log(`[ImageOverlay] ✓ Matched single word:`, {
            error: errorText,
            word: word.text,
            type: errorType,
            fuzzy: normalizedWord !== normalizedError
          });
          break;
        }

        // ✨ IMPROVED: Multi-word match (phrase) with fuzzy matching
        if (errorWords.length > 1) {
          let phraseMatch = true;
          let minX = word.bounds.x;
          let minY = word.bounds.y;
          let maxX = word.bounds.x + word.bounds.width;
          let maxY = word.bounds.y + word.bounds.height;

          for (let j = 0; j < errorWords.length; j++) {
            const wordToMatch = words[i + j];
            if (!wordToMatch || !wordToMatch.text || !wordToMatch.bounds) {
              phraseMatch = false;
              break;
            }

            const normalizedWordToMatch = normalizeText(wordToMatch.text);
            // ✨ Use fuzzy matching for each word in phrase
            const wordMatches = normalizedWordToMatch === errorWords[j] ||
                                fuzzyMatch(normalizedWordToMatch, errorWords[j], 0.75);

            if (!wordMatches) {
              phraseMatch = false;
              break;
            }

            // Expand bounding box
            minX = Math.min(minX, wordToMatch.bounds.x);
            minY = Math.min(minY, wordToMatch.bounds.y);
            maxX = Math.max(maxX, wordToMatch.bounds.x + wordToMatch.bounds.width);
            maxY = Math.max(maxY, wordToMatch.bounds.y + wordToMatch.bounds.height);
          }

          if (phraseMatch) {
            highlights.push({
              x: minX * scaleX,
              y: minY * scaleY,
              width: (maxX - minX) * scaleX,
              height: (maxY - minY) * scaleY,
              color: ERROR_COLORS[errorType] || ERROR_COLORS.default,
              errorType: errorType,
              errorText: errorText,
              suggestion: suggestion,
              id: `error-${errorIndex}-phrase-${i}`
            });
            matched = true;
            matchingStats.matched++;
            console.log(`[ImageOverlay] ✓ Matched phrase:`, {
              error: errorText,
              words: errorWords.length,
              type: errorType
            });
            break;
          }
        }
      }

      if (!matched) {
        matchingStats.unmatched.push({ errorText, errorType, normalizedError });
      }
    });

    console.log('[ImageOverlay] Matching complete:', matchingStats);

    if (matchingStats.unmatched.length > 0) {
      console.log('[ImageOverlay] Unmatched errors (first 5):',
        matchingStats.unmatched.slice(0, 5)
      );
    }

    // Return both highlights and stats (stats will be handled separately)
    return { highlights, stats: matchingStats };
  };

  // Memoize highlights calculation to prevent infinite re-renders
  const { highlights, stats } = useMemo(() => {
    return getErrorHighlights();
  }, [
    words,
    errors,
    imageDimensions.width,
    imageDimensions.height,
    imageNaturalDimensions.width,
    imageNaturalDimensions.height,
    visibleErrorTypes,
    showOverlay
  ]);

  // Update debug info when stats change (separate from render)
  useEffect(() => {
    if (stats) {
      setDebugInfo(stats);
    }
  }, [stats]);

  // Calculate container transform for zoom and pan
  const containerTransform = `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`;

  // User-friendly messages for missing data
  const showNoWordsWarning = showOverlay && (!words || words.length === 0) && errors.length > 0;
  const showNoCorrectionsMessage = showOverlay && words && words.length > 0 && errors.length === 0;
  const showLowMatchWarning = showOverlay && highlights.length > 0 && debugInfo &&
    debugInfo.matched < debugInfo.attempted * 0.5; // Less than 50% matched

  return (
    <div
      ref={containerRef}
      className={`relative inline-block ${className}`}
      style={{ maxWidth: '100%', overflow: 'hidden', pointerEvents: 'none' }}
    >
      {/* User-friendly warning messages (visible in production) */}
      {!import.meta.env.DEV && showNoWordsWarning && (
        <div className="absolute top-2 left-2 right-2 bg-yellow-500/95 text-white px-4 py-2 rounded-lg shadow-lg z-20 pointer-events-auto">
          <div className="flex items-start gap-2">
            <span className="text-lg">⚠️</span>
            <div className="flex-1 text-sm">
              <p className="font-bold">No se pueden mostrar anotaciones visuales</p>
              <p className="text-xs mt-1 opacity-90">
                Falta el análisis OCR con coordenadas. Contacta al profesor para re-analizar la tarea.
              </p>
            </div>
          </div>
        </div>
      )}

      {!import.meta.env.DEV && showLowMatchWarning && (
        <div className="absolute top-2 left-2 right-2 bg-orange-500/95 text-white px-4 py-2 rounded-lg shadow-lg z-20 pointer-events-auto">
          <div className="flex items-start gap-2">
            <span className="text-lg">ℹ️</span>
            <div className="flex-1 text-sm">
              <p className="font-bold">Algunas correcciones no se pudieron ubicar</p>
              <p className="text-xs mt-1 opacity-90">
                {debugInfo.matched} de {debugInfo.attempted} correcciones ubicadas en la imagen. Revisa la lista completa abajo.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Image with zoom/pan transform */}
      <div
        style={{
          transform: containerTransform,
          transformOrigin: 'top left',
          transition: 'transform 0.2s ease-out',
          pointerEvents: 'none'
        }}
      >
        <img
          ref={imageRef}
          src={imageUrl}
          alt="Homework"
          className="w-full h-auto"
          style={{ display: 'block', pointerEvents: 'none' }}
        />

        {/* Overlay SVG */}
        {showOverlay && imageDimensions.width > 0 && (
          <svg
            className="absolute top-0 left-0 pointer-events-none"
            width={imageDimensions.width}
            height={imageDimensions.height}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              pointerEvents: 'none'
            }}
          >
            {highlights.map((highlight) => {
              // Calculate optimal font size for correction text
              const correctionText = highlight.suggestion || '';
              const fontSize = calculateOptimalFontSize(correctionText, highlight.width, 12, 20);
              // Limit text to 30 characters
              const displayText = correctionText.length > 30 ? correctionText.substring(0, 27) + '...' : correctionText;

              return (
                <g key={highlight.id}>
                  {/* Highlight rectangle with semi-transparent fill */}
                  <rect
                    x={highlight.x}
                    y={highlight.y}
                    width={highlight.width}
                    height={highlight.height}
                    fill={highlight.color}
                    fillOpacity={highlightOpacity}
                    stroke={highlight.color}
                    strokeWidth="2"
                    strokeOpacity="0.8"
                    rx="2"
                  />

                  {/* Underline for error - wavy or straight */}
                  {useWavyUnderline ? (
                    <path
                      d={generateWavyPath(
                        highlight.x,
                        highlight.y + highlight.height + 1,
                        highlight.x + highlight.width,
                        2,
                        8
                      )}
                      stroke={highlight.color}
                      strokeWidth="2"
                      fill="none"
                      strokeOpacity="1"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  ) : (
                    <line
                      x1={highlight.x}
                      y1={highlight.y + highlight.height}
                      x2={highlight.x + highlight.width}
                      y2={highlight.y + highlight.height}
                      stroke={highlight.color}
                      strokeWidth="3"
                      strokeOpacity="1"
                      strokeLinecap="round"
                    />
                  )}

                  {/* Correction text in handwriting font - Positioned below the error */}
                  {showCorrectionText && displayText && (
                    <text
                      x={highlight.x + highlight.width / 2}
                      y={highlight.y + highlight.height + fontSize + 8}
                      fontSize={fontSize}
                      fontFamily={correctionTextFont}
                      fontWeight="700"
                      fill={highlight.color}
                      textAnchor="middle"
                      dominantBaseline="hanging"
                      style={{
                        pointerEvents: 'none',
                        userSelect: 'none'
                      }}
                    >
                      {displayText}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        )}
      </div>

      {/* Enhanced Debug info (only in development) - Collapsible */}
      {import.meta.env.DEV && (
        <div
          data-debug-panel
          className="absolute bottom-2 right-2 bg-black/95 text-white text-[10px] rounded z-10 font-mono max-w-[280px] pointer-events-auto"
        >
          {/* Header - clickable */}
          <div
            className="flex items-center justify-between gap-2 p-2 cursor-pointer hover:bg-white/10 rounded-t"
            onClick={() => setDebugExpanded(!debugExpanded)}
          >
            <div className="font-bold text-[11px] flex items-center gap-1">
              🐛 Debug Info
              {!debugExpanded && debugInfo && (
                <span className={`ml-1 ${highlights.length > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  ({debugInfo.matched}/{debugInfo.attempted})
                </span>
              )}
            </div>
            {debugExpanded ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
          </div>

          {/* Expandable content */}
          {debugExpanded && (
            <div className="px-2 pb-2 space-y-0.5 border-t border-white/20">
              <div className="mt-1.5">Words: {words.length}</div>
              <div>Errors: {errors.length}</div>
              <div className={`font-bold ${highlights.length > 0 ? 'text-green-400' : 'text-red-400'}`}>
                Highlights: {highlights.length}
              </div>
              {debugInfo && (
                <>
                  <div>Matched: {debugInfo.matched}/{debugInfo.attempted}</div>
                  <div>Filtered: {debugInfo.filteredByType}</div>
                  <div className="text-yellow-300">
                    Unmatched: {debugInfo.unmatched?.length || 0}
                  </div>
                </>
              )}
              <div className="pt-1 border-t border-white/10">
                <div>Zoom: {(zoom * 100).toFixed(0)}%</div>
                <div>Display: {imageDimensions.width}x{imageDimensions.height}</div>
                <div className="text-xs text-gray-400">
                  Natural: {imageNaturalDimensions.width}x{imageNaturalDimensions.height}
                </div>
              </div>
              {debugInfo && debugInfo.unmatched?.length > 0 && (
                <div className="pt-1 border-t border-white/10">
                  <div className="text-yellow-300 mb-1">Unmatched (sample):</div>
                  {debugInfo.unmatched.slice(0, 2).map((err, idx) => (
                    <div key={idx} className="text-[9px] truncate">
                      • {err.errorText}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

ImageOverlay.propTypes = {
  imageUrl: PropTypes.string.isRequired,
  words: PropTypes.arrayOf(PropTypes.shape({
    text: PropTypes.string.isRequired,
    bounds: PropTypes.shape({
      x: PropTypes.number.isRequired,
      y: PropTypes.number.isRequired,
      width: PropTypes.number.isRequired,
      height: PropTypes.number.isRequired
    }).isRequired,
    confidence: PropTypes.number
  })),
  errors: PropTypes.arrayOf(PropTypes.shape({
    errorText: PropTypes.string,
    text: PropTypes.string,
    errorType: PropTypes.string,
    type: PropTypes.string,
    suggestion: PropTypes.string,
    correctedText: PropTypes.string
  })),
  showOverlay: PropTypes.bool,
  visibleErrorTypes: PropTypes.object,
  highlightOpacity: PropTypes.number,
  zoom: PropTypes.number,
  pan: PropTypes.shape({
    x: PropTypes.number,
    y: PropTypes.number
  }),
  useWavyUnderline: PropTypes.bool,
  showCorrectionText: PropTypes.bool,
  correctionTextFont: PropTypes.string,
  className: PropTypes.string
};

/**
 * Memoized export with custom comparison function
 * Only re-renders if critical props change
 */
export default memo(ImageOverlay, (prevProps, nextProps) => {
  // Return true if props are equal (skip re-render)
  // Return false if props changed (re-render)

  // Critical props that should trigger re-render
  if (prevProps.imageUrl !== nextProps.imageUrl) return false;
  if (prevProps.showOverlay !== nextProps.showOverlay) return false;
  if (prevProps.highlightOpacity !== nextProps.highlightOpacity) return false;
  if (prevProps.zoom !== nextProps.zoom) return false;
  if (prevProps.useWavyUnderline !== nextProps.useWavyUnderline) return false;
  if (prevProps.showCorrectionText !== nextProps.showCorrectionText) return false;
  if (prevProps.correctionTextFont !== nextProps.correctionTextFont) return false;

  // Check pan object (shallow comparison)
  if (prevProps.pan.x !== nextProps.pan.x || prevProps.pan.y !== nextProps.pan.y) return false;

  // Check visible error types (shallow comparison)
  const prevTypes = prevProps.visibleErrorTypes;
  const nextTypes = nextProps.visibleErrorTypes;
  if (prevTypes.spelling !== nextTypes.spelling ||
      prevTypes.grammar !== nextTypes.grammar ||
      prevTypes.punctuation !== nextTypes.punctuation ||
      prevTypes.vocabulary !== nextTypes.vocabulary) {
    return false;
  }

  // Deep comparison for arrays (expensive but necessary)
  // Compare words array
  if (prevProps.words.length !== nextProps.words.length) return false;
  if (prevProps.words.length > 0 && nextProps.words.length > 0) {
    // Sample-based comparison (first, middle, last) for performance
    const checkIndices = [
      0,
      Math.floor(prevProps.words.length / 2),
      prevProps.words.length - 1
    ];
    for (const idx of checkIndices) {
      const prevWord = prevProps.words[idx];
      const nextWord = nextProps.words[idx];
      if (!prevWord || !nextWord || prevWord.text !== nextWord.text) return false;
    }
  }

  // Compare errors array
  if (prevProps.errors.length !== nextProps.errors.length) return false;
  if (prevProps.errors.length > 0 && nextProps.errors.length > 0) {
    // Sample-based comparison for performance
    const checkIndices = [
      0,
      Math.floor(prevProps.errors.length / 2),
      prevProps.errors.length - 1
    ];
    for (const idx of checkIndices) {
      const prevError = prevProps.errors[idx];
      const nextError = nextProps.errors[idx];
      if (!prevError || !nextError) return false;

      // Extract error info using same logic as component
      const prevText = prevError.errorText || prevError.original || prevError.text || '';
      const nextText = nextError.errorText || nextError.original || nextError.text || '';
      if (prevText !== nextText) return false;
    }
  }

  // Props are equal, skip re-render
  return true;
});
