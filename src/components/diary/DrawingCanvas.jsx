import React, { useRef, useState, useEffect, useCallback } from 'react';
import getStroke from 'perfect-freehand';
import { Eraser, Trash2 } from 'lucide-react';

/**
 * DrawingCanvas - Canvas de dibujo con perfect-freehand para trazos naturales
 *
 * @param {boolean} enabled - Si el modo dibujo está activo
 * @param {string} color - Color del lápiz
 * @param {number} opacity - Opacidad del lápiz (0-1)
 * @param {number} size - Tamaño del trazo
 * @param {Function} onStrokesChange - Callback cuando cambian los trazos
 * @param {Array} initialStrokes - Trazos iniciales (para cargar guardados)
 */
export function DrawingCanvas({
  enabled = false,
  color = '#000000',
  opacity = 1,
  size = 4,
  onStrokesChange,
  initialStrokes = []
}) {
  const svgRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState([]);
  const [strokes, setStrokes] = useState(initialStrokes);
  const [eraserMode, setEraserMode] = useState(false);

  // Configuración de perfect-freehand para trazos naturales
  const strokeOptions = {
    size: size,
    thinning: 0.5,
    smoothing: 0.5,
    streamline: 0.5,
    easing: (t) => t,
    start: {
      taper: 0,
      easing: (t) => t,
      cap: true
    },
    end: {
      taper: 0,
      easing: (t) => t,
      cap: true
    }
  };

  // Notificar cambios en los trazos
  useEffect(() => {
    if (onStrokesChange) {
      onStrokesChange(strokes);
    }
  }, [strokes, onStrokesChange]);

  // Convertir puntos de stroke a path SVG
  const getSvgPathFromStroke = useCallback((stroke) => {
    if (!stroke || stroke.length === 0) return '';

    const d = stroke.reduce(
      (acc, [x0, y0], i, arr) => {
        const [x1, y1] = arr[(i + 1) % arr.length];
        acc.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
        return acc;
      },
      ['M', ...stroke[0], 'Q']
    );

    d.push('Z');
    return d.join(' ');
  }, []);

  // Obtener coordenadas relativas al SVG
  const getRelativeCoordinates = useCallback((e) => {
    if (!svgRef.current) return { x: 0, y: 0 };

    const rect = svgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const pressure = e.pressure || 0.5;

    return { x, y, pressure };
  }, []);

  // Iniciar trazo
  const handlePointerDown = useCallback((e) => {
    if (!enabled) return;

    e.preventDefault();
    setIsDrawing(true);

    const { x, y, pressure } = getRelativeCoordinates(e);

    // Si está en modo borrador, buscar trazo para borrar
    if (eraserMode) {
      const strokeToRemove = strokes.findIndex(s =>
        isPointNearStroke(x, y, s)
      );

      if (strokeToRemove !== -1) {
        setStrokes(prev => prev.filter((_, i) => i !== strokeToRemove));
      }
    } else {
      setCurrentStroke([[x, y, pressure]]);
    }
  }, [enabled, eraserMode, strokes, getRelativeCoordinates]);

  // Continuar trazo
  const handlePointerMove = useCallback((e) => {
    if (!isDrawing || !enabled || eraserMode) return;

    e.preventDefault();
    const { x, y, pressure } = getRelativeCoordinates(e);
    setCurrentStroke(prev => [...prev, [x, y, pressure]]);
  }, [isDrawing, enabled, eraserMode, getRelativeCoordinates]);

  // Finalizar trazo
  const handlePointerUp = useCallback(() => {
    if (!isDrawing) return;

    setIsDrawing(false);

    if (!eraserMode && currentStroke.length > 1) {
      // Generar trazo suave con perfect-freehand
      const stroke = getStroke(currentStroke, strokeOptions);
      const pathData = getSvgPathFromStroke(stroke);

      // Guardar trazo con metadatos
      const newStroke = {
        id: Date.now(),
        pathData,
        color,
        opacity,
        size
      };

      setStrokes(prev => [...prev, newStroke]);
    }

    setCurrentStroke([]);
  }, [isDrawing, eraserMode, currentStroke, color, opacity, size, strokeOptions, getSvgPathFromStroke]);

  // Verificar si un punto está cerca de un trazo (para borrador)
  const isPointNearStroke = (x, y, stroke) => {
    // Simplificado: verificar si el punto está cerca del bounding box del trazo
    // En una implementación más sofisticada, se verificaría la distancia real al path
    const threshold = 20;

    // Este es un algoritmo simplificado
    // Para producción, se podría usar una librería de geometría SVG
    return false; // Por ahora, necesitamos implementar la lógica geométrica
  };

  // Limpiar todos los trazos
  const clearAll = useCallback(() => {
    if (confirm('¿Borrar todos los dibujos? Esta acción no se puede deshacer.')) {
      setStrokes([]);
    }
  }, []);

  // Renderizar preview del trazo actual
  const renderCurrentStroke = () => {
    if (currentStroke.length === 0) return null;

    const stroke = getStroke(currentStroke, strokeOptions);
    const pathData = getSvgPathFromStroke(stroke);

    return (
      <path
        d={pathData}
        fill={color}
        fillOpacity={opacity}
        className="pointer-events-none"
      />
    );
  };

  return (
    <div className={`drawing-canvas-wrapper ${enabled ? 'active' : ''}`}>
      {/* SVG Canvas */}
      <svg
        ref={svgRef}
        className={`drawing-canvas ${enabled ? 'enabled' : 'disabled'}`}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: enabled ? 'auto' : 'none',
          cursor: enabled ? (eraserMode ? 'grab' : 'crosshair') : 'default',
          zIndex: enabled ? 10 : -1,
          touchAction: 'none'
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        {/* Trazos guardados */}
        {strokes.map((stroke) => (
          <path
            key={stroke.id}
            d={stroke.pathData}
            fill={stroke.color}
            fillOpacity={stroke.opacity}
            className="saved-stroke"
          />
        ))}

        {/* Trazo actual (preview) */}
        {renderCurrentStroke()}
      </svg>

      {/* Toolbar flotante (solo cuando está habilitado) */}
      {enabled && (
        <div className="absolute bottom-4 right-4 flex gap-2 bg-white dark:bg-gray-800
                       p-2 rounded-lg shadow-xl border-2 border-gray-200 dark:border-gray-700 z-20">
          <button
            type="button"
            onClick={() => setEraserMode(!eraserMode)}
            className={`
              px-3 py-2 rounded-lg font-semibold transition-all
              ${eraserMode
                ? 'bg-red-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
              }
            `}
            title="Borrador (hacer clic en un trazo para borrarlo)"
          >
            <Eraser size={16} />
          </button>

          <button
            type="button"
            onClick={clearAll}
            className="px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700
                     text-gray-700 dark:text-gray-300 hover:bg-red-100 hover:text-red-600
                     transition-all font-semibold"
            title="Borrar todos los dibujos"
          >
            <Trash2 size={16} />
          </button>

          <div className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400 flex items-center">
            {strokes.length} trazo{strokes.length !== 1 ? 's' : ''}
          </div>
        </div>
      )}
    </div>
  );
}

export default DrawingCanvas;
