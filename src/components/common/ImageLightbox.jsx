/**
 * @fileoverview Image Lightbox - Modal para ver imágenes con zoom y pan
 * @module components/common/ImageLightbox
 */

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { BaseButton } from './index';
import ImageOverlay from '../homework/ImageOverlay';

/**
 * ImageLightbox Component
 * Modal para visualizar imágenes con zoom (rueda/pinch) y pan (drag)
 * Ahora soporta overlays de errores
 *
 * @param {boolean} isOpen - Si el lightbox está abierto
 * @param {function} onClose - Callback al cerrar
 * @param {string} imageUrl - URL de la imagen
 * @param {string} alt - Texto alternativo
 * @param {Array} words - Coordenadas de palabras (para overlay)
 * @param {Array} errors - Errores detectados (para overlay)
 * @param {boolean} showOverlay - Mostrar overlay de errores
 * @param {Object} visibleErrorTypes - Tipos de errores visibles
 * @param {number} highlightOpacity - Opacidad de highlights
 * @param {boolean} useWavyUnderline - Usar subrayado ondulado
 * @param {boolean} showCorrectionText - Mostrar texto de corrección de IA
 * @param {string} correctionTextFont - Fuente para el texto de corrección
 */
export default function ImageLightbox({
  isOpen,
  onClose,
  imageUrl,
  alt = 'Imagen',
  words = [],
  errors = [],
  showOverlay = false,
  visibleErrorTypes = {},
  highlightOpacity = 0.25,
  useWavyUnderline = true,
  showCorrectionText = true,
  correctionTextFont = 'Caveat'
}) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const imageRef = useRef(null);

  const containerRef = useRef(null);

  // Reset when opening
  useEffect(() => {
    if (isOpen) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
    }
  }, [isOpen]);

  // Zoom con rueda del mouse - usar event listener con passive:false
  useEffect(() => {
    if (!isOpen) return;

    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setScale(prevScale => {
        const newScale = Math.min(Math.max(0.5, prevScale + delta), 5);
        // Reset position if zooming out to 1
        if (newScale === 1) {
          setPosition({ x: 0, y: 0 });
        }
        return newScale;
      });
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Start drag (now works at any zoom level)
  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y
      });
    }
  };

  // Drag (now works at any zoom level)
  const handleMouseMove = (e) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleTouchMove = (e) => {
    if (isDragging && e.touches.length === 1) {
      setPosition({
        x: e.touches[0].clientX - dragStart.x,
        y: e.touches[0].clientY - dragStart.y
      });
    }
  };

  // End drag
  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Zoom buttons
  const zoomIn = () => {
    const newScale = Math.min(scale + 0.5, 5);
    setScale(newScale);
  };

  const zoomOut = () => {
    const newScale = Math.max(scale - 0.5, 0.5);
    setScale(newScale);
    if (newScale === 1) {
      setPosition({ x: 0, y: 0 });
    }
  };

  const resetZoom = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const lightboxContent = (
    <div
      className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center"
      style={{ zIndex: 'var(--z-modal-backdrop)' }}
      onClick={onClose}
    >
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
      >
        <X size={24} className="text-white" />
      </button>

      {/* Zoom Controls */}
      <div className="absolute top-4 left-4 z-10 flex gap-2">
        <BaseButton
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            zoomOut();
          }}
          className="bg-white/10 hover:bg-white/20 border-white/20 text-white"
        >
          <ZoomOut size={18} />
        </BaseButton>
        <BaseButton
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            resetZoom();
          }}
          className="bg-white/10 hover:bg-white/20 border-white/20 text-white"
        >
          <Maximize2 size={18} />
          <span className="text-xs">{Math.round(scale * 100)}%</span>
        </BaseButton>
        <BaseButton
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            zoomIn();
          }}
          className="bg-white/10 hover:bg-white/20 border-white/20 text-white"
        >
          <ZoomIn size={18} />
        </BaseButton>
      </div>

      {/* Image Container */}
      <div
        ref={containerRef}
        className="relative w-full h-full flex items-center justify-center overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleMouseUp}
        style={{
          cursor: isDragging ? 'grabbing' : 'grab'
        }}
      >
        <div
          ref={imageRef}
          className="select-none"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transition: isDragging ? 'none' : 'transform 0.2s ease-out',
            touchAction: 'none',
            maxWidth: '90vw',
            maxHeight: '90vh'
          }}
          draggable={false}
        >
          <ImageOverlay
            imageUrl={imageUrl}
            words={words}
            errors={errors}
            showOverlay={showOverlay}
            visibleErrorTypes={visibleErrorTypes}
            highlightOpacity={highlightOpacity}
            zoom={1}
            pan={{ x: 0, y: 0 }}
            useWavyUnderline={useWavyUnderline}
            showCorrectionText={showCorrectionText}
            correctionTextFont={correctionTextFont}
            className="w-full h-full"
          />
        </div>
      </div>

      {/* Instructions */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white text-xs px-4 py-2 rounded-full backdrop-blur-sm max-w-md text-center">
        {showOverlay && errors.length > 0 ? (
          <span>
            {scale > 1
              ? '✨ Arrastra para mover • Rueda para zoom • Errores resaltados'
              : '✨ Rueda para zoom • Errores resaltados en colores'}
          </span>
        ) : (
          <span>
            {scale > 1
              ? 'Arrastra para mover • Rueda para zoom'
              : 'Rueda del mouse o pinch para zoom'}
          </span>
        )}
      </div>
    </div>
  );

  // Renderizar usando portal para evitar problemas con overflow de contenedores padre
  return createPortal(lightboxContent, document.body);
}
