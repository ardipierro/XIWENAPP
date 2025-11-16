import { useEffect, useRef, useState } from 'react';

/**
 * useTouchGestures - Hook para manejar gestos táctiles (pinch, pan, etc.)
 *
 * @param {Object} options - Configuración de gestos
 * @returns {Object} - Estado y handlers de gestos
 */
export function useTouchGestures(options = {}) {
  const {
    onPinch,
    onPan,
    onDoubleTap,
    minZoom = 0.5,
    maxZoom = 3,
    enabled = true
  } = options;

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const touchStartRef = useRef(null);
  const lastTapRef = useRef(0);
  const initialDistanceRef = useRef(0);
  const initialZoomRef = useRef(1);

  // Calcular distancia entre dos puntos touch
  const getDistance = (touch1, touch2) => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // Handler de touch start
  const handleTouchStart = (e) => {
    if (!enabled) return;

    const touches = e.touches;

    if (touches.length === 2) {
      // Pinch gesture
      initialDistanceRef.current = getDistance(touches[0], touches[1]);
      initialZoomRef.current = zoom;
    } else if (touches.length === 1) {
      // Pan gesture o double tap
      touchStartRef.current = {
        x: touches[0].clientX,
        y: touches[0].clientY,
        time: Date.now()
      };

      // Detectar double tap
      const now = Date.now();
      const timeSinceLastTap = now - lastTapRef.current;
      if (timeSinceLastTap < 300 && timeSinceLastTap > 0) {
        // Double tap detectado
        if (onDoubleTap) {
          onDoubleTap({ zoom, pan });
        }
      }
      lastTapRef.current = now;
    }
  };

  // Handler de touch move
  const handleTouchMove = (e) => {
    if (!enabled) return;

    const touches = e.touches;

    if (touches.length === 2) {
      // Pinch zoom
      e.preventDefault();
      const currentDistance = getDistance(touches[0], touches[1]);
      const scale = currentDistance / initialDistanceRef.current;
      const newZoom = Math.max(minZoom, Math.min(maxZoom, initialZoomRef.current * scale));

      setZoom(newZoom);
      if (onPinch) {
        onPinch(newZoom);
      }
    } else if (touches.length === 1 && touchStartRef.current) {
      // Pan gesture
      const deltaX = touches[0].clientX - touchStartRef.current.x;
      const deltaY = touches[0].clientY - touchStartRef.current.y;

      // Solo pan si el movimiento es significativo
      if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
        const newPan = {
          x: pan.x + deltaX,
          y: pan.y + deltaY
        };
        setPan(newPan);
        if (onPan) {
          onPan(newPan);
        }
        touchStartRef.current = {
          x: touches[0].clientX,
          y: touches[0].clientY,
          time: touchStartRef.current.time
        };
      }
    }
  };

  // Handler de touch end
  const handleTouchEnd = () => {
    touchStartRef.current = null;
  };

  // Reset
  const reset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  return {
    zoom,
    pan,
    setZoom,
    setPan,
    reset,
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd
    }
  };
}

export default useTouchGestures;
