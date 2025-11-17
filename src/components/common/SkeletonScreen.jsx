/**
 * @fileoverview Skeleton Screen Components - Loading placeholders
 * @module components/common/SkeletonScreen
 */

import React from 'react';

/**
 * Base Skeleton Component
 * Componente base de skeleton con animación pulse
 */
function Skeleton({ className = '', width, height, circle = false }) {
  const baseClasses = 'animate-pulse bg-gray-200 dark:bg-gray-800';
  const shapeClasses = circle ? 'rounded-full' : 'rounded';

  const style = {
    ...(width && { width }),
    ...(height && { height })
  };

  return (
    <div
      className={`${baseClasses} ${shapeClasses} ${className}`}
      style={style}
    />
  );
}

/**
 * Card Skeleton
 * Skeleton para tarjetas de contenido/cursos
 */
export function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4 space-y-4">
      {/* Header con imagen */}
      <Skeleton height="200px" className="w-full" />

      {/* Título */}
      <div className="space-y-2">
        <Skeleton height="24px" className="w-3/4" />
        <Skeleton height="16px" className="w-1/2" />
      </div>

      {/* Descripción */}
      <div className="space-y-2">
        <Skeleton height="12px" className="w-full" />
        <Skeleton height="12px" className="w-full" />
        <Skeleton height="12px" className="w-2/3" />
      </div>

      {/* Footer buttons */}
      <div className="flex gap-2">
        <Skeleton height="36px" className="flex-1" />
        <Skeleton height="36px" className="w-24" />
      </div>
    </div>
  );
}

/**
 * List Item Skeleton
 * Skeleton para items de lista
 */
export function SkeletonListItem() {
  return (
    <div className="flex items-center gap-4 p-4 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
      {/* Avatar/Icon */}
      <Skeleton circle width="48px" height="48px" />

      {/* Content */}
      <div className="flex-1 space-y-2">
        <Skeleton height="16px" className="w-2/3" />
        <Skeleton height="12px" className="w-1/2" />
      </div>

      {/* Action */}
      <Skeleton height="32px" width="80px" />
    </div>
  );
}

/**
 * Dashboard Skeleton
 * Skeleton para dashboard completo
 */
export function SkeletonDashboard() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton height="32px" className="w-1/3" />
        <Skeleton height="16px" className="w-1/4" />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4 space-y-2">
            <Skeleton height="16px" className="w-1/2" />
            <Skeleton height="32px" className="w-3/4" />
          </div>
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  );
}

/**
 * Table Skeleton
 * Skeleton para tablas de datos
 */
export function SkeletonTable({ rows = 5, columns = 4 }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-800 p-4">
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} height="16px" className="w-3/4" />
          ))}
        </div>
      </div>

      {/* Rows */}
      <div className="divide-y divide-gray-200 dark:divide-gray-800">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="p-4">
            <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
              {Array.from({ length: columns }).map((_, colIndex) => (
                <Skeleton key={colIndex} height="16px" className="w-full" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Text Block Skeleton
 * Skeleton para bloques de texto
 */
export function SkeletonText({ lines = 3 }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          height="16px"
          className={i === lines - 1 ? "w-2/3" : "w-full"}
        />
      ))}
    </div>
  );
}

/**
 * Profile Skeleton
 * Skeleton para perfil de usuario
 */
export function SkeletonProfile() {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6 space-y-6">
      {/* Avatar y nombre */}
      <div className="flex items-center gap-4">
        <Skeleton circle width="80px" height="80px" />
        <div className="flex-1 space-y-2">
          <Skeleton height="24px" className="w-1/2" />
          <Skeleton height="16px" className="w-1/3" />
        </div>
      </div>

      {/* Información */}
      <div className="space-y-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="flex items-center gap-4">
            <Skeleton circle width="40px" height="40px" />
            <div className="flex-1 space-y-1">
              <Skeleton height="14px" className="w-1/4" />
              <Skeleton height="16px" className="w-2/3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Export base component too
export default Skeleton;
