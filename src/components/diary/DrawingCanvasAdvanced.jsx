import React, { useRef, useState, useEffect, useCallback } from 'react';
import getStroke from 'perfect-freehand';
import { Eraser, Trash2, Undo2, Redo2, Layers } from 'lucide-react';

/**
 * DrawingCanvasAdvanced - Canvas de dibujo mejorado con undo/redo, capas y zoom
 *
 * @param {boolean} enabled - Si el modo dibujo está activo
 * @param {string} color - Color del lápiz
 * @param {number} opacity - Opacidad del lápiz (0-1)
 * @param {number} size - Tamaño del trazo
 * @param {number} zoom - Nivel de zoom (0.5-3)
 * @param {string} layer - Capa actual ('under' o 'over')
 * @param {Function} onStrokesChange - Callback cuando cambian los trazos
 * @param {Array} initialStrokes - Trazos iniciales
 */
export function DrawingCanvasAdvanced({
  enabled = false,
  color = '#000000',
  opacity = 1,
  size = 4,
  zoom = 1,
  layer = 'over',
  onStrokesChange,
  initialStrokes = []
}) {
  const svgRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState([]);

  // Historial para undo/redo
  const [strokes, setStrokes] = useState(initialStrokes);
  const [history, setHistory] = useState([initialStrokes]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const [eraserMode, setEraserMode] = useState(false);

  // Usar refs para propiedades que cambian frecuentemente (performance)
  const colorRef = useRef(color);
  const opacityRef = useRef(opacity);
  const sizeRef = useRef(size);
  const layerRef = useRef(layer);

  // Actualizar refs cuando cambian las props
  useEffect(() => { colorRef.current = color; }, [color]);
  useEffect(() => { opacityRef.current = opacity; }, [opacity]);
  useEffect(() => { sizeRef.current = size; }, [size]);
  useEffect(() => { layerRef.current = layer; }, [layer]);

  // FIX: Sincronizar initialStrokes cuando cambian (para editar bloques existentes)
  useEffect(() => {
    if (initialStrokes && initialStrokes.length > 0 && strokes.length === 0) {
      setStrokes(initialStrokes);
      setHistory([initialStrokes]);
      setHistoryIndex(0);
    }
  }, [initialStrokes]);

  // Configuración de perfect-freehand
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

  // Actualizar historial cuando cambian los trazos
  const addToHistory = useCallback((newStrokes) => {
    // Eliminar estados futuros si estamos en medio del historial
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newStrokes);

    // Limitar historial a 50 estados
    if (newHistory.length > 50) {
      newHistory.shift();
    } else {
      setHistoryIndex(historyIndex + 1);
    }

    setHistory(newHistory);
    setStrokes(newStrokes);
  }, [history, historyIndex]);

  // Undo
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setStrokes(history[newIndex]);
    }
  }, [history, historyIndex]);

  // Redo
  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setStrokes(history[newIndex]);
    }
  }, [history, historyIndex]);

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

  // Obtener coordenadas relativas al SVG (con zoom)
  const getRelativeCoordinates = useCallback((e) => {
    if (!svgRef.current) return { x: 0, y: 0 };

    const rect = svgRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;
    const pressure = e.pressure || 0.5;

    return { x, y, pressure };
  }, [zoom]);

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
        const newStrokes = strokes.filter((_, i) => i !== strokeToRemove);
        addToHistory(newStrokes);
      }
    } else {
      setCurrentStroke([[x, y, pressure]]);
    }
  }, [enabled, eraserMode, strokes, getRelativeCoordinates, addToHistory]);

  // Continuar trazo (SIN límite de sampling - permite trazos largos continuos)
  const handlePointerMove = useCallback((e) => {
    if (!isDrawing || !enabled || eraserMode) return;

    e.preventDefault();
    const { x, y, pressure } = getRelativeCoordinates(e);

    // ✅ FIX: Agregar TODOS los puntos sin límite para permitir trazos largos
    setCurrentStroke(prev => [...prev, [x, y, pressure]]);
  }, [isDrawing, enabled, eraserMode, getRelativeCoordinates]);

  // Finalizar trazo (optimizado con refs)
  const handlePointerUp = useCallback(() => {
    if (!isDrawing) return;

    setIsDrawing(false);

    if (!eraserMode && currentStroke.length > 1) {
      // Generar trazo suave con perfect-freehand
      const stroke = getStroke(currentStroke, strokeOptions);
      const pathData = getSvgPathFromStroke(stroke);

      // Guardar trazo con metadatos (usando refs para evitar re-renders)
      const newStroke = {
        id: Date.now(),
        pathData,
        color: colorRef.current,
        opacity: opacityRef.current,
        size: sizeRef.current,
        layer: layerRef.current
      };

      addToHistory([...strokes, newStroke]);
    }

    setCurrentStroke([]);
  }, [isDrawing, eraserMode, currentStroke, strokes, strokeOptions, getSvgPathFromStroke, addToHistory]);

  // Verificar si un punto está cerca de un trazo (simplificado)
  const isPointNearStroke = (x, y, stroke) => {
    // Implementación simplificada
    // En producción, usar algoritmo más preciso
    return false;
  };

  // Limpiar todos los trazos
  const clearAll = useCallback(() => {
    if (confirm('¿Borrar todos los dibujos? Esta acción no se puede deshacer.')) {
      addToHistory([]);
    }
  }, [addToHistory]);

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

  // Separar trazos por capa
  const strokesUnder = strokes.filter(s => s.layer === 'under');
  const strokesOver = strokes.filter(s => s.layer === 'over' || !s.layer);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  return (
    <div className={`drawing-canvas-advanced-wrapper ${enabled ? 'active' : ''}`}>
      {/* SVG Canvas con zoom */}
      <svg
        ref={svgRef}
        className={`drawing-canvas-advanced ${enabled ? 'enabled' : 'disabled'}`}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: enabled ? 'auto' : 'none',
          cursor: enabled ? (eraserMode ? 'grab' : 'crosshair') : 'default',
          zIndex: layer === 'over' ? 10 : -1,
          touchAction: 'none',
          transform: `scale(${zoom})`,
          transformOrigin: 'top left'
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {/* Trazos de capa inferior (solo si estamos en capa 'over') */}
        {layer === 'over' && strokesUnder.map((stroke) => (
          <path
            key={stroke.id}
            d={stroke.pathData}
            fill={stroke.color}
            fillOpacity={stroke.opacity * 0.3}
            className="saved-stroke-under"
          />
        ))}

        {/* Trazos de capa superior o actual */}
        {(layer === 'over' ? strokesOver : strokesUnder).map((stroke) => (
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
        <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-20">
          {/* Controles principales */}
          <div className="flex gap-2 bg-white dark:bg-gray-800 p-2 rounded-lg shadow-xl
                         border-2 border-gray-200 dark:border-gray-700">
            {/* Undo */}
            <button
              type="button"
              onClick={handleUndo}
              disabled={!canUndo}
              className="px-3 py-2 rounded-lg font-semibold transition-all
                       bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300
                       hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
              title="Deshacer (Ctrl+Z)"
            >
              <Undo2 size={16} />
            </button>

            {/* Redo */}
            <button
              type="button"
              onClick={handleRedo}
              disabled={!canRedo}
              className="px-3 py-2 rounded-lg font-semibold transition-all
                       bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300
                       hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
              title="Rehacer (Ctrl+Y)"
            >
              <Redo2 size={16} />
            </button>

            <div className="border-l border-gray-300 dark:border-gray-600 mx-1" />

            {/* Borrador */}
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
              title="Borrador"
            >
              <Eraser size={16} />
            </button>

            {/* Limpiar todo */}
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
          </div>

          {/* Info */}
          <div className="px-3 py-2 bg-white dark:bg-gray-800 rounded-lg shadow-md
                         border-2 border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
              <Layers size={14} />
              <span>{strokes.length} trazo{strokes.length !== 1 ? 's' : ''}</span>
              <span>•</span>
              <span>Capa: {layer === 'over' ? 'Superior' : 'Inferior'}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DrawingCanvasAdvanced;
