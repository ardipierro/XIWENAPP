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
 * @param {number} x1 - Start X
 * @param {number} y - Y position
 * @param {number} x2 - End X
 * @param {number} amplitude - Wave height
 * @param {number} frequency - Wave frequency
 * @returns {string} SVG path
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
 * Enhanced Image Overlay Component
 * Renders homework image with error highlights based on word coordinates
 *
 * @param {Object} props
 * @param {string} props.imageUrl - URL of homework image
 * @param {Array} props.words - Word coordinates from OCR [{text, bounds: {x, y, width, height}}]
 * @param {Array} props.errors - Error corrections from AI [{errorText, errorType, suggestion}]
 * @param {boolean} props.showOverlay - Toggle overlay visibility
 * @param {Object} props.visibleErrorTypes - Which error types to show {spelling: true, grammar: true, ...}
 * @param {number} props.highlightOpacity - Opacity of highlight fill (0-1)
 * @param {number} props.zoom - Zoom level (1 = 100%)
 * @param {Object} props.pan - Pan offset {x, y}
 * @param {boolean} props.useWavyUnderline - Use wavy underlines instead of straight
 * @param {string} props.className - Additional CSS classes
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
   * Map errors to word coordinates
   * Finds words that match error text and returns their scaled bounds
   */
  const getErrorHighlights = () => {
    if (!words || words.length === 0 || !errors || errors.length === 0) {
      return [];
    }

    const highlights = [];

    // Calculate scale factors
    const scaleX = imageDimensions.width / imageNaturalDimensions.width;
    const scaleY = imageDimensions.height / imageNaturalDimensions.height;

    errors.forEach((error, errorIndex) => {
      const errorText = error.errorText || error.text || '';
      const errorType = error.errorType || error.type || 'default';

      if (!errorText) return;

      // Filter by visible error types
      if (!visibleErrorTypes[errorType]) return;

      // Normalize error text for matching
      const normalizedError = errorText.toLowerCase().trim();
      const errorWords = normalizedError.split(/\s+/);

      // Try to find matching word(s) in coordinates
      for (let i = 0; i < words.length; i++) {
        const word = words[i];
        const normalizedWord = word.text.toLowerCase().trim();

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
            suggestion: error.suggestion || error.correctedText || '',
            id: `error-${errorIndex}-word-${i}`
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
            if (!wordToMatch || wordToMatch.text.toLowerCase().trim() !== errorWords[j]) {
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
              suggestion: error.suggestion || error.correctedText || '',
              id: `error-${errorIndex}-phrase-${i}`
            });
            break;
          }
        }
      }
    });

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

      {/* Debug info (only in development) */}
      {import.meta.env.DEV && (
        <div className="absolute top-2 left-2 bg-black/75 text-white text-xs p-2 rounded pointer-events-none z-10">
          <div>Words: {words.length}</div>
          <div>Errors: {errors.length}</div>
          <div>Visible: {highlights.length}</div>
          <div>Zoom: {(zoom * 100).toFixed(0)}%</div>
          <div>Scale: {imageDimensions.width}x{imageDimensions.height}</div>
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
