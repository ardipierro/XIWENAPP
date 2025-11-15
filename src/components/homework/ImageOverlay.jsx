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

import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

/**
 * Error type to color mapping
 */
const ERROR_COLORS = {
  spelling: '#ef4444',      // red-500
  grammar: '#f97316',       // orange-500
  punctuation: '#eab308',   // yellow-500
  vocabulary: '#3b82f6',    // blue-500
  default: '#8b5cf6'        // purple-500
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
 */
export default function ImageOverlay({
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
  className = ''
}) {
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const [imageNaturalDimensions, setImageNaturalDimensions] = useState({ width: 0, height: 0 });
  const [debugInfo, setDebugInfo] = useState(null);
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
      return [];
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
      scaleY
    });

    // Sample first 3 words and errors for debugging
    console.log('[ImageOverlay] Sample words:', words.slice(0, 3).map(w => ({
      text: w.text,
      hasBounds: !!w.bounds
    })));
    console.log('[ImageOverlay] Sample errors:', errors.slice(0, 3).map(e => extractErrorInfo(e)));

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
      for (let i = 0; i < words.length && !matched; i++) {
        const word = words[i];

        // Validate word structure
        if (!word.text || !word.bounds) {
          continue;
        }

        const normalizedWord = normalizeText(word.text);

        // Single word match
        if (normalizedWord === normalizedError) {
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
            type: errorType
          });
          break;
        }

        // Multi-word match (phrase)
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

            if (normalizeText(wordToMatch.text) !== errorWords[j]) {
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

    setDebugInfo(matchingStats);
    return highlights;
  };

  const highlights = getErrorHighlights();

  // Calculate container transform for zoom and pan
  const containerTransform = `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`;

  return (
    <div
      ref={containerRef}
      className={`relative inline-block ${className}`}
      style={{ maxWidth: '100%', overflow: 'hidden' }}
    >
      {/* Image with zoom/pan transform */}
      <div
        style={{
          transform: containerTransform,
          transformOrigin: 'top left',
          transition: 'transform 0.2s ease-out'
        }}
      >
        <img
          ref={imageRef}
          src={imageUrl}
          alt="Homework"
          className="w-full h-auto"
          style={{ display: 'block' }}
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
              left: 0
            }}
          >
            {highlights.map((highlight) => (
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
              </g>
            ))}
          </svg>
        )}
      </div>

      {/* Enhanced Debug info (only in development) */}
      {import.meta.env.DEV && (
        <div className="absolute top-2 left-2 bg-black/90 text-white text-xs p-3 rounded pointer-events-none z-10 font-mono max-w-xs">
          <div className="font-bold mb-1">🐛 Debug Info</div>
          <div className="space-y-0.5">
            <div>Words: {words.length}</div>
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
            <div>Zoom: {(zoom * 100).toFixed(0)}%</div>
            <div>Scale: {imageDimensions.width}x{imageDimensions.height}</div>
            <div className="text-xs text-gray-400">
              {imageNaturalDimensions.width}x{imageNaturalDimensions.height}
            </div>
          </div>
          {debugInfo && debugInfo.unmatched?.length > 0 && (
            <div className="mt-2 pt-2 border-t border-gray-600">
              <div className="text-yellow-300 mb-1">Unmatched (sample):</div>
              {debugInfo.unmatched.slice(0, 2).map((err, idx) => (
                <div key={idx} className="text-xs truncate">
                  • {err.errorText}
                </div>
              ))}
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
  className: PropTypes.string
};
