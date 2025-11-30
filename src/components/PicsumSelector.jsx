/**
 * @fileoverview Selector de imágenes de Picsum para avatares y banners
 * @module components/PicsumSelector
 *
 * Componente que muestra una grilla de imágenes de Picsum para selección.
 * Soporta auto-selección basada en identificadores de usuario.
 */

import { useState, useEffect } from 'react';
import { Sparkles, Check, RefreshCw, Image as ImageIcon } from 'lucide-react';
import {
  PICSUM_AVATAR_IDS,
  PICSUM_BANNER_IDS,
  getPicsumAvatarUrl,
  getPicsumBannerUrl,
  getAutoSelectedPicsumImages,
  extractPicsumId
} from '../utils/picsumHelpers';

/**
 * PicsumSelector - Selector de imágenes de Picsum
 *
 * @param {string} type - Tipo de imagen: 'avatar' o 'banner'
 * @param {string} currentUrl - URL actual seleccionada (para mostrar checkmark)
 * @param {object} user - Usuario para auto-selección (email, wechatId, name)
 * @param {function} onSelect - Callback cuando se selecciona una imagen (url, id)
 * @param {boolean} showAutoSelect - Mostrar botón de auto-selección (default: true)
 * @param {boolean} compact - Modo compacto para espacios reducidos
 * @param {string} className - Clases CSS adicionales
 */
function PicsumSelector({
  type = 'avatar',
  currentUrl = null,
  user = null,
  onSelect,
  showAutoSelect = true,
  compact = false,
  className = ''
}) {
  const [loadingImages, setLoadingImages] = useState({});
  const [autoSelectedId, setAutoSelectedId] = useState(null);

  // Determinar IDs y función de URL según tipo
  const isAvatar = type === 'avatar';
  const ids = isAvatar ? PICSUM_AVATAR_IDS : PICSUM_BANNER_IDS;
  const getUrl = isAvatar ? getPicsumAvatarUrl : getPicsumBannerUrl;

  // ID actualmente seleccionado
  const currentId = currentUrl ? extractPicsumId(currentUrl) : null;

  // Calcular auto-selección cuando cambia el usuario
  useEffect(() => {
    if (user && showAutoSelect) {
      const autoImages = getAutoSelectedPicsumImages(user);
      setAutoSelectedId(isAvatar ? autoImages.avatarId : autoImages.bannerId);
    }
  }, [user, isAvatar, showAutoSelect]);

  // Handler de selección
  const handleSelect = (id) => {
    const url = getUrl(id);
    onSelect?.(url, id);
  };

  // Handler de auto-selección
  const handleAutoSelect = () => {
    if (autoSelectedId) {
      handleSelect(autoSelectedId);
    }
  };

  // Tracking de carga de imágenes
  const handleImageLoad = (id) => {
    setLoadingImages(prev => ({ ...prev, [id]: false }));
  };

  const handleImageError = (id) => {
    setLoadingImages(prev => ({ ...prev, [id]: 'error' }));
  };

  // Clases de grilla según tipo y modo
  const gridClasses = isAvatar
    ? compact
      ? 'grid-cols-5 gap-2'
      : 'grid-cols-4 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-10 gap-2'
    : compact
      ? 'grid-cols-2 gap-2'
      : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3';

  return (
    <div className={`picsum-selector ${className}`}>
      {/* Header con auto-select */}
      {showAutoSelect && autoSelectedId && (
        <div className="mb-3">
          <button
            onClick={handleAutoSelect}
            className={`
              w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg
              transition-all text-sm font-semibold
              ${currentId === autoSelectedId
                ? 'bg-purple-100 dark:bg-purple-900/30 border-2 border-purple-500 text-purple-700 dark:text-purple-300'
                : 'bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-2 border-purple-200 dark:border-purple-800 hover:border-purple-400 dark:hover:border-purple-600 text-purple-600 dark:text-purple-400'
              }
            `}
          >
            <Sparkles size={18} strokeWidth={2} />
            {currentId === autoSelectedId ? (
              <>
                <Check size={16} strokeWidth={2} />
                Auto-asignado por tu {user?.email ? 'email' : user?.wechatId ? 'WeChat' : 'nombre'}
              </>
            ) : (
              <>
                Auto-asignar {isAvatar ? 'avatar' : 'banner'} por tu {user?.email ? 'email' : user?.wechatId ? 'WeChat' : 'nombre'}
              </>
            )}
          </button>
        </div>
      )}

      {/* Título de la grilla */}
      <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-2 flex items-center gap-1">
        <ImageIcon size={14} strokeWidth={2} />
        O elige de la galería:
      </p>

      {/* Grilla de imágenes */}
      <div className={`grid ${gridClasses}`}>
        {ids.map((id) => {
          const url = getUrl(id, isAvatar ? 80 : 160); // Thumbnails más pequeños para preview
          const isSelected = currentId === id;
          const isAutoSuggested = id === autoSelectedId && !isSelected;

          return (
            <button
              key={id}
              onClick={() => handleSelect(id)}
              className={`
                relative overflow-hidden transition-all duration-200
                ${isAvatar ? 'aspect-square rounded-lg' : 'aspect-[4/1] rounded-lg'}
                ${isSelected
                  ? 'ring-2 ring-purple-500 ring-offset-2 ring-offset-white dark:ring-offset-zinc-900 scale-105'
                  : isAutoSuggested
                    ? 'ring-2 ring-purple-300 dark:ring-purple-700 ring-dashed'
                    : 'ring-1 ring-zinc-200 dark:ring-zinc-700 hover:ring-purple-400 dark:hover:ring-purple-500'
                }
                hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-500
              `}
              title={isAutoSuggested ? 'Sugerido para ti' : `Imagen ${id}`}
            >
              {/* Imagen */}
              <img
                src={url}
                alt={`Picsum ${id}`}
                className="w-full h-full object-cover"
                loading="lazy"
                onLoad={() => handleImageLoad(id)}
                onError={() => handleImageError(id)}
              />

              {/* Overlay de seleccionado */}
              {isSelected && (
                <div className="absolute inset-0 bg-purple-500/20 flex items-center justify-center">
                  <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center">
                    <Check size={14} strokeWidth={3} className="text-white" />
                  </div>
                </div>
              )}

              {/* Indicador de auto-sugerido */}
              {isAutoSuggested && !isSelected && (
                <div className="absolute top-1 right-1">
                  <div className="w-4 h-4 rounded-full bg-purple-500/80 flex items-center justify-center">
                    <Sparkles size={10} strokeWidth={2} className="text-white" />
                  </div>
                </div>
              )}

              {/* Placeholder durante carga */}
              {loadingImages[id] === undefined && (
                <div className="absolute inset-0 bg-zinc-200 dark:bg-zinc-700 animate-pulse" />
              )}

              {/* Error de carga */}
              {loadingImages[id] === 'error' && (
                <div className="absolute inset-0 bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center">
                  <RefreshCw size={16} className="text-zinc-400" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Nota al pie */}
      <p className="mt-2 text-xs text-zinc-400 dark:text-zinc-500 text-center">
        Imágenes de Picsum.photos
      </p>
    </div>
  );
}

export default PicsumSelector;
