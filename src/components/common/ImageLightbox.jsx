/**
 * @fileoverview Image Lightbox - Modal para ver imágenes con zoom y pan
 * @module components/common/ImageLightbox
 */

import { useState, useRef, useEffect } from 'react';
import { X, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { BaseButton } from './index';

/**
 * ImageLightbox Component
 * Modal para visualizar imágenes con zoom (rueda/pinch) y pan (drag)
 *
 * @param {boolean} isOpen - Si el lightbox está abierto
 * @param {function} onClose - Callback al cerrar
 * @param {string} imageUrl - URL de la imagen
 * @param {string} alt - Texto alternativo
 */
export default function ImageLightbox({ isOpen, onClose, imageUrl, alt = 'Imagen' }) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const imageRef = useRef(null);

  // Reset when opening
  useEffect(() => {
    if (isOpen) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Zoom con rueda del mouse
  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    const newScale = Math.min(Math.max(0.5, scale + delta), 5);
    setScale(newScale);

    // Reset position if zooming out to 1
    if (newScale === 1) {
      setPosition({ x: 0, y: 0 });
    }
  };

  // Start drag
  const handleMouseDown = (e) => {
    if (scale > 1) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
    }
  };

  const handleTouchStart = (e) => {
    if (scale > 1 && e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y
      });
    }
  };

  // Drag
  const handleMouseMove = (e) => {
    if (isDragging && scale > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleTouchMove = (e) => {
    if (isDragging && scale > 1 && e.touches.length === 1) {
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

  return (
    <div
      className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center"
      style={{ zIndex: 9999 }}
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
        className="relative w-full h-full flex items-center justify-center overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleMouseUp}
        style={{
          cursor: isDragging ? 'grabbing' : scale > 1 ? 'grab' : 'default'
        }}
      >
        <img
          ref={imageRef}
          src={imageUrl}
          alt={alt}
          className="max-w-full max-h-full object-contain select-none"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transition: isDragging ? 'none' : 'transform 0.2s ease-out',
            touchAction: 'none'
          }}
          draggable={false}
        />
      </div>

      {/* Instructions */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white text-sm px-4 py-2 rounded-full">
        {scale > 1
          ? 'Arrastra para mover • Rueda para zoom'
          : 'Rueda del mouse o pinch para zoom'}
      </div>
    </div>
  );
}
