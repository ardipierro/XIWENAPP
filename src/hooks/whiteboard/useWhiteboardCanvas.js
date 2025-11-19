/**
 * @fileoverview Hook para gestión del canvas y slides de pizarra
 * Maneja slides, navegación, y operaciones del canvas
 * @module hooks/whiteboard/useWhiteboardCanvas
 */

import { useState } from 'react';

/**
 * Hook para gestión del canvas y slides
 * @param {Array} initialSlides - Slides iniciales
 * @returns {Object} Estado y funciones del canvas
 */
export function useWhiteboardCanvas(initialSlides = [{ id: 1, data: null, thumbnail: null }]) {
  const [slides, setSlides] = useState(initialSlides);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPoints, setCurrentPoints] = useState([]);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [tempCanvas, setTempCanvas] = useState(null);

  /**
   * Navegar al slide siguiente
   */
  const nextSlide = (canvas) => {
    if (currentSlide < slides.length - 1) {
      // Guardar slide actual antes de cambiar
      saveCurrentSlide(canvas);
      setCurrentSlide(currentSlide + 1);
    }
  };

  /**
   * Navegar al slide anterior
   */
  const prevSlide = (canvas) => {
    if (currentSlide > 0) {
      // Guardar slide actual antes de cambiar
      saveCurrentSlide(canvas);
      setCurrentSlide(currentSlide - 1);
    }
  };

  /**
   * Agregar nuevo slide
   */
  const addSlide = (canvas) => {
    // Guardar slide actual
    saveCurrentSlide(canvas);

    // Crear nuevo slide
    const newSlide = {
      id: slides.length + 1,
      data: null,
      thumbnail: null
    };

    setSlides([...slides, newSlide]);
    setCurrentSlide(slides.length); // Ir al nuevo slide
  };

  /**
   * Eliminar slide actual
   */
  const deleteSlide = () => {
    if (slides.length <= 1) {
      alert('No puedes eliminar el único slide');
      return;
    }

    const updatedSlides = slides.filter((_, index) => index !== currentSlide);
    setSlides(updatedSlides);

    // Ajustar currentSlide si es necesario
    if (currentSlide >= updatedSlides.length) {
      setCurrentSlide(updatedSlides.length - 1);
    }
  };

  /**
   * Guardar slide actual
   */
  const saveCurrentSlide = (canvas) => {
    if (!canvas) return;

    const data = canvas.toDataURL();
    const thumbnail = canvas.toDataURL('image/png', 0.1);

    const updatedSlides = [...slides];
    updatedSlides[currentSlide] = {
      ...updatedSlides[currentSlide],
      data,
      thumbnail
    };

    setSlides(updatedSlides);
  };

  /**
   * Limpiar canvas
   */
  const clearCanvas = (canvas) => {
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  /**
   * Cargar slide en canvas
   */
  const loadSlideToCanvas = (canvas, slideIndex) => {
    if (!canvas || !slides[slideIndex]) return;

    const ctx = canvas.getContext('2d');

    // Limpiar canvas primero
    clearCanvas(canvas);

    // Cargar imagen del slide si existe
    if (slides[slideIndex].data) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
      };
      img.src = slides[slideIndex].data;
    }
  };

  /**
   * Ir a slide específico
   */
  const goToSlide = (slideIndex, canvas) => {
    if (slideIndex >= 0 && slideIndex < slides.length) {
      // Guardar slide actual
      saveCurrentSlide(canvas);
      setCurrentSlide(slideIndex);
    }
  };

  /**
   * Reset completo (para nueva sesión)
   */
  const resetSlides = () => {
    setSlides([{ id: 1, data: null, thumbnail: null }]);
    setCurrentSlide(0);
  };

  return {
    // Estado
    slides,
    currentSlide,
    isDrawing,
    currentPoints,
    startPos,
    tempCanvas,

    // Setters
    setSlides,
    setCurrentSlide,
    setIsDrawing,
    setCurrentPoints,
    setStartPos,
    setTempCanvas,

    // Funciones
    nextSlide,
    prevSlide,
    addSlide,
    deleteSlide,
    saveCurrentSlide,
    clearCanvas,
    loadSlideToCanvas,
    goToSlide,
    resetSlides
  };
}
