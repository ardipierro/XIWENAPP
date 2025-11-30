/**
 * @fileoverview Helpers para imágenes de Picsum
 * @module utils/picsumHelpers
 *
 * Sistema de avatares y banners predefinidos usando Picsum.photos
 * Incluye auto-selección basada en identificadores de usuario.
 */

// ============================================
// IDs DE PICSUM CURADOS
// ============================================

/**
 * IDs de imágenes de Picsum seleccionados para avatares
 * Imágenes cuadradas, coloridas y visualmente atractivas
 * URL: https://picsum.photos/id/{ID}/200/200
 */
export const PICSUM_AVATAR_IDS = [
  // Naturaleza y paisajes (colores vibrantes)
  10,   // Bosque verde
  15,   // Café/marrón cálido
  22,   // Montaña nevada
  28,   // Cielo nocturno
  29,   // Océano azul
  36,   // Desierto dorado
  39,   // Montañas al atardecer
  42,   // Flores coloridas
  49,   // Cielo rosa/morado
  54,   // Bosque otoñal
  64,   // Campo verde
  65,   // Río azul
  76,   // Sunset naranja
  84,   // Bosque niebla
  96,   // Playa tropical
  106,  // Montaña azul
  119,  // Flores amarillas
  129,  // Cielo estrellado
  137,  // Lago cristalino
  142,  // Pradera verde
];

/**
 * IDs de imágenes de Picsum seleccionados para banners
 * Imágenes panorámicas, ideales para fondos
 * URL: https://picsum.photos/id/{ID}/800/200
 */
export const PICSUM_BANNER_IDS = [
  // Paisajes panorámicos
  1011, // Montaña majestuosa
  1015, // Río sereno
  1018, // Bosque denso
  1019, // Atardecer dorado
  1029, // Playa paradisíaca
  1035, // Montañas nevadas
  1036, // Lago reflejo
  1039, // Campo florido
  1043, // Cielo dramático
  1044, // Costa rocosa
  1047, // Aurora boreal (tono)
  1050, // Valle verde
  1051, // Desierto rojo
  1055, // Bosque tropical
  1059, // Montañas al alba
  1067, // Pradera infinita
  1069, // Cascada
  1073, // Cielo tormentoso
  1076, // Playa al atardecer
  1084, // Montañas azules
];

// ============================================
// FUNCIONES DE URL
// ============================================

/**
 * Genera URL de avatar de Picsum
 * @param {number} id - ID de la imagen en Picsum
 * @param {number} size - Tamaño del cuadrado (default 200)
 * @returns {string} URL de la imagen
 */
export const getPicsumAvatarUrl = (id, size = 200) => {
  return `https://picsum.photos/id/${id}/${size}/${size}`;
};

/**
 * Genera URL de banner de Picsum
 * @param {number} id - ID de la imagen en Picsum
 * @param {number} width - Ancho del banner (default 800)
 * @param {number} height - Alto del banner (default 200)
 * @returns {string} URL de la imagen
 */
export const getPicsumBannerUrl = (id, width = 800, height = 200) => {
  return `https://picsum.photos/id/${id}/${width}/${height}`;
};

// ============================================
// FUNCIÓN DE HASH PARA AUTO-SELECCIÓN
// ============================================

/**
 * Genera un hash numérico a partir de un string
 * @param {string} str - String a hashear (email, wechat, nombre)
 * @returns {number} Hash numérico positivo
 */
export const hashString = (str) => {
  if (!str) return 0;

  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convertir a entero de 32 bits
  }
  return Math.abs(hash);
};

/**
 * Auto-selecciona un ID de Picsum basado en un identificador de usuario
 * El mismo identificador siempre produce el mismo ID (determinístico)
 *
 * @param {string} identifier - Email, WeChat ID, o nombre de usuario
 * @param {number[]} options - Array de IDs disponibles (PICSUM_AVATAR_IDS o PICSUM_BANNER_IDS)
 * @returns {number} ID de Picsum seleccionado
 */
export const autoSelectPicsumId = (identifier, options) => {
  if (!identifier || !options || options.length === 0) {
    return options?.[0] || 10; // Fallback al primer ID o default
  }

  const hash = hashString(identifier.toLowerCase().trim());
  return options[hash % options.length];
};

/**
 * Obtiene avatar y banner auto-seleccionados para un usuario
 * Prioriza: email > wechatId > name > 'default'
 *
 * @param {object} user - Objeto usuario con email, wechatId, name
 * @returns {object} { avatarId, bannerId, avatarUrl, bannerUrl }
 */
export const getAutoSelectedPicsumImages = (user) => {
  // Determinar identificador principal
  const identifier = user?.email || user?.wechatId || user?.name || 'default';

  // Usar identificadores diferentes para avatar y banner para variedad
  const avatarId = autoSelectPicsumId(identifier, PICSUM_AVATAR_IDS);
  const bannerId = autoSelectPicsumId(identifier + '_banner', PICSUM_BANNER_IDS);

  return {
    avatarId,
    bannerId,
    avatarUrl: getPicsumAvatarUrl(avatarId),
    bannerUrl: getPicsumBannerUrl(bannerId),
    identifier // Para debugging
  };
};

// ============================================
// UTILIDADES DE VALIDACIÓN
// ============================================

/**
 * Verifica si una URL es de Picsum
 * @param {string} url - URL a verificar
 * @returns {boolean}
 */
export const isPicsumUrl = (url) => {
  if (!url) return false;
  return url.includes('picsum.photos');
};

/**
 * Extrae el ID de una URL de Picsum
 * @param {string} url - URL de Picsum
 * @returns {number|null} ID o null si no es válida
 */
export const extractPicsumId = (url) => {
  if (!isPicsumUrl(url)) return null;

  const match = url.match(/\/id\/(\d+)\//);
  return match ? parseInt(match[1], 10) : null;
};
