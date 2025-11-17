import React from 'react';

/**
 * DrawingViewer - Visualizador de trazos guardados (SOLO LECTURA)
 *
 * Este componente muestra los dibujos cuando NO estás en modo edición.
 * Resuelve el problema de que los trazos desaparecen después de guardar.
 *
 * @param {Array} strokes - Array de trazos guardados
 * @param {number} zoom - Nivel de zoom (opcional, default 1)
 */
export function DrawingViewer({ strokes = [], zoom = 1 }) {
  if (!strokes || strokes.length === 0) {
    return null;
  }

  // Separar trazos por capa
  const strokesUnder = strokes.filter(s => s.layer === 'under');
  const strokesOver = strokes.filter(s => s.layer === 'over' || !s.layer);

  return (
    <>
      {/* Capa inferior (debajo del texto) */}
      {strokesUnder.length > 0 && (
        <svg
          className="drawing-viewer-under"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: -1,
            transform: `scale(${zoom})`,
            transformOrigin: 'top left'
          }}
        >
          {strokesUnder.map((stroke) => (
            <path
              key={stroke.id}
              d={stroke.pathData}
              fill={stroke.color}
              fillOpacity={stroke.opacity}
              className="saved-stroke-under"
            />
          ))}
        </svg>
      )}

      {/* Capa superior (sobre el texto) */}
      {strokesOver.length > 0 && (
        <svg
          className="drawing-viewer-over"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: 10,
            transform: `scale(${zoom})`,
            transformOrigin: 'top left'
          }}
        >
          {strokesOver.map((stroke) => (
            <path
              key={stroke.id}
              d={stroke.pathData}
              fill={stroke.color}
              fillOpacity={stroke.opacity}
              className="saved-stroke-over"
            />
          ))}
        </svg>
      )}
    </>
  );
}

export default DrawingViewer;
