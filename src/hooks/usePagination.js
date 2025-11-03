/**
 * @fileoverview Custom hook para manejar paginación de datos
 * @module hooks/usePagination
 */

import { useState, useMemo, useCallback } from 'react';

/**
 * Hook para manejar paginación de arrays de datos
 * @param {Array} data - Array de datos a paginar
 * @param {number} itemsPerPage - Cantidad de items por página (default: 10)
 * @returns {Object} Estado y funciones de paginación
 */
export function usePagination(data = [], itemsPerPage = 10) {
  const [currentPage, setCurrentPage] = useState(1);

  // Calcular datos paginados
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return data.slice(startIndex, endIndex);
  }, [data, currentPage, itemsPerPage]);

  // Calcular información de paginación
  const paginationInfo = useMemo(() => {
    const totalItems = data.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage + 1;
    const endIndex = Math.min(currentPage * itemsPerPage, totalItems);
    const hasNextPage = currentPage < totalPages;
    const hasPreviousPage = currentPage > 1;

    return {
      currentPage,
      totalPages,
      totalItems,
      itemsPerPage,
      startIndex,
      endIndex,
      hasNextPage,
      hasPreviousPage
    };
  }, [data.length, currentPage, itemsPerPage]);

  /**
   * Ir a una página específica
   * @param {number} page - Número de página
   */
  const goToPage = useCallback((page) => {
    const totalPages = Math.ceil(data.length / itemsPerPage);
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  }, [data.length, itemsPerPage]);

  /**
   * Ir a la página siguiente
   */
  const nextPage = useCallback(() => {
    const totalPages = Math.ceil(data.length / itemsPerPage);
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  }, [currentPage, data.length, itemsPerPage]);

  /**
   * Ir a la página anterior
   */
  const previousPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  }, [currentPage]);

  /**
   * Ir a la primera página
   */
  const firstPage = useCallback(() => {
    setCurrentPage(1);
  }, []);

  /**
   * Ir a la última página
   */
  const lastPage = useCallback(() => {
    const totalPages = Math.ceil(data.length / itemsPerPage);
    setCurrentPage(totalPages);
  }, [data.length, itemsPerPage]);

  /**
   * Resetear a la primera página (útil cuando cambian los datos)
   */
  const reset = useCallback(() => {
    setCurrentPage(1);
  }, []);

  // Generar array de números de página para UI
  const pageNumbers = useMemo(() => {
    const totalPages = Math.ceil(data.length / itemsPerPage);
    const pages = [];

    // Mostrar máximo 7 páginas
    const maxPages = 7;

    if (totalPages <= maxPages) {
      // Mostrar todas las páginas
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Mostrar páginas con elipsis
      if (currentPage <= 4) {
        for (let i = 1; i <= 5; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }

    return pages;
  }, [data.length, currentPage, itemsPerPage]);

  return {
    // Datos paginados
    data: paginatedData,

    // Información de paginación
    ...paginationInfo,
    pageNumbers,

    // Funciones de navegación
    goToPage,
    nextPage,
    previousPage,
    firstPage,
    lastPage,
    reset
  };
}

export default usePagination;
