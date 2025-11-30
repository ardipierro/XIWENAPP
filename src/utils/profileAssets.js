/**
 * @fileoverview Utilidades para assets de perfil de usuario
 * @module utils/profileAssets
 *
 * Sistema de banners generativos y configuración de Boring Avatars
 * que combinan con el estilo minimalista y neutral de la app.
 */

/**
 * Paletas de colores para Boring Avatars
 * Diseñadas para combinar con los temas de la app (Light, Dark, Dusk, Night)
 */
export const AVATAR_PALETTES = {
  // Neutral - Combina con todos los temas
  neutral: ['#71717a', '#a1a1aa', '#d4d4d8', '#52525b', '#3f3f46'],

  // Azul grisáceo - Tema principal de la app
  blueGray: ['#5b6b8f', '#7c8db5', '#9dadc9', '#4a5a7e', '#3d4a6b'],

  // Tonos tierra (Dusk theme)
  earth: ['#d4a574', '#b8956a', '#9c8660', '#c49664', '#a88254'],

  // Verde pastel (Success colors)
  sage: ['#4a9f7c', '#5db88e', '#70c9a0', '#3d8a6a', '#2f7558'],

  // Tonos fríos (Night theme)
  cool: ['#5b8fa3', '#6ba0b5', '#7cb1c7', '#4a7e92', '#3a6d80'],

  // Sunset cálido
  sunset: ['#c85a54', '#d4756f', '#e0908a', '#b84a44', '#a83a34'],

  // Monocromático oscuro
  monoDark: ['#27272a', '#3f3f46', '#52525b', '#71717a', '#a1a1aa'],

  // Monocromático claro
  monoLight: ['#f4f4f5', '#e4e4e7', '#d4d4d8', '#a1a1aa', '#71717a'],
};

/**
 * Variantes disponibles de Boring Avatars
 */
export const BORING_AVATAR_VARIANTS = [
  { id: 'marble', label: 'Mármol', description: 'Manchas abstractas elegantes' },
  { id: 'beam', label: 'Carita', description: 'Caras minimalistas' },
  { id: 'pixel', label: 'Pixel', description: 'Estilo pixel art retro' },
  { id: 'sunset', label: 'Atardecer', description: 'Círculos concéntricos' },
  { id: 'ring', label: 'Anillos', description: 'Formas geométricas' },
  { id: 'bauhaus', label: 'Bauhaus', description: 'Arte geométrico abstracto' },
];

/**
 * Banners generativos predefinidos
 * Cada banner tiene un gradiente único que combina con el estilo de la app
 */
export const PRESET_BANNERS = [
  // Neutros
  { id: 'neutral-1', gradient: 'linear-gradient(135deg, #3f3f46 0%, #52525b 50%, #71717a 100%)', label: 'Grafito' },
  { id: 'neutral-2', gradient: 'linear-gradient(135deg, #27272a 0%, #3f3f46 100%)', label: 'Carbón' },
  { id: 'neutral-3', gradient: 'linear-gradient(45deg, #52525b 0%, #71717a 50%, #a1a1aa 100%)', label: 'Plata' },

  // Azules grisáceos (tema principal)
  { id: 'blue-1', gradient: 'linear-gradient(135deg, #3d4a6b 0%, #5b6b8f 50%, #7c8db5 100%)', label: 'Océano' },
  { id: 'blue-2', gradient: 'linear-gradient(180deg, #4a5a7e 0%, #5b8fa3 100%)', label: 'Cielo' },
  { id: 'blue-3', gradient: 'linear-gradient(45deg, #5b6b8f 0%, #6ba0b5 100%)', label: 'Horizonte' },

  // Tonos tierra (Dusk)
  { id: 'earth-1', gradient: 'linear-gradient(135deg, #a88254 0%, #d4a574 100%)', label: 'Arena' },
  { id: 'earth-2', gradient: 'linear-gradient(180deg, #9c8660 0%, #c49664 50%, #d4a574 100%)', label: 'Desierto' },

  // Verdes pastel
  { id: 'sage-1', gradient: 'linear-gradient(135deg, #2f7558 0%, #4a9f7c 50%, #70c9a0 100%)', label: 'Bosque' },
  { id: 'sage-2', gradient: 'linear-gradient(45deg, #3d8a6a 0%, #5db88e 100%)', label: 'Jade' },

  // Cálidos
  { id: 'warm-1', gradient: 'linear-gradient(135deg, #a83a34 0%, #c85a54 50%, #d4756f 100%)', label: 'Atardecer' },
  { id: 'warm-2', gradient: 'linear-gradient(180deg, #b84a44 0%, #d4a574 100%)', label: 'Otoño' },

  // Combinaciones especiales
  { id: 'special-1', gradient: 'linear-gradient(135deg, #3d4a6b 0%, #4a9f7c 100%)', label: 'Aurora' },
  { id: 'special-2', gradient: 'linear-gradient(45deg, #5b6b8f 0%, #d4a574 100%)', label: 'Crepúsculo' },
  { id: 'special-3', gradient: 'linear-gradient(135deg, #27272a 0%, #5b6b8f 50%, #7c8db5 100%)', label: 'Noche' },
  { id: 'special-4', gradient: 'linear-gradient(180deg, #52525b 0%, #4a9f7c 100%)', label: 'Montaña' },
];

/**
 * Genera un hash numérico a partir de un string
 * @param {string} str - String a hashear
 * @returns {number} Hash numérico
 */
const hashString = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
};

/**
 * Genera un gradiente único basado en el ID del usuario
 * @param {string} userId - ID del usuario
 * @param {string} theme - Tema actual ('light', 'dark', 'dusk', 'night')
 * @returns {string} CSS gradient string
 */
export const generateUserBanner = (userId, theme = 'dark') => {
  if (!userId) return PRESET_BANNERS[0].gradient;

  const hash = hashString(userId);

  // Seleccionar paleta base según el tema
  const themePalettes = {
    light: ['neutral', 'blueGray', 'sage'],
    dark: ['blueGray', 'cool', 'monoDark'],
    dusk: ['earth', 'neutral', 'sunset'],
    night: ['cool', 'blueGray', 'monoDark'],
  };

  const palettes = themePalettes[theme] || themePalettes.dark;
  const paletteKey = palettes[hash % palettes.length];
  const palette = AVATAR_PALETTES[paletteKey];

  // Generar ángulo y colores basados en el hash
  const angle = (hash % 180);
  const color1 = palette[hash % palette.length];
  const color2 = palette[(hash * 2) % palette.length];
  const color3 = palette[(hash * 3) % palette.length];

  // Decidir tipo de gradiente
  const gradientTypes = [
    `linear-gradient(${angle}deg, ${color1} 0%, ${color2} 100%)`,
    `linear-gradient(${angle}deg, ${color1} 0%, ${color2} 50%, ${color3} 100%)`,
    `radial-gradient(circle at ${(hash % 100)}% ${((hash * 2) % 100)}%, ${color1} 0%, ${color2} 100%)`,
  ];

  return gradientTypes[hash % gradientTypes.length];
};

/**
 * Obtiene la paleta de colores recomendada según el tema
 * @param {string} theme - Tema actual
 * @returns {string[]} Array de colores
 */
export const getPaletteForTheme = (theme = 'dark') => {
  const themeMap = {
    light: AVATAR_PALETTES.neutral,
    dark: AVATAR_PALETTES.blueGray,
    dusk: AVATAR_PALETTES.earth,
    night: AVATAR_PALETTES.cool,
  };

  return themeMap[theme] || themeMap.dark;
};

/**
 * Genera configuración completa para Boring Avatar
 * @param {string} seed - Semilla (nombre, email o ID)
 * @param {string} variant - Variante del avatar
 * @param {string} theme - Tema actual
 * @returns {object} Configuración para el componente Avatar
 */
export const getBoringAvatarConfig = (seed, variant = 'marble', theme = 'dark') => {
  return {
    name: seed,
    variant,
    colors: getPaletteForTheme(theme),
    square: false,
  };
};

/**
 * Parsea un avatar ID para determinar si es un Boring Avatar
 * Formato: boring:{variant}:{paletteId}
 * @param {string} avatarId - ID del avatar
 * @returns {object|null} Configuración parseada o null si no es boring avatar
 */
export const parseBoringAvatar = (avatarId) => {
  if (!avatarId || !avatarId.startsWith('boring:')) return null;

  const parts = avatarId.split(':');
  if (parts.length < 2) return null;

  return {
    type: 'boring',
    variant: parts[1] || 'marble',
    paletteId: parts[2] || 'blueGray',
  };
};

/**
 * Genera un ID de Boring Avatar
 * @param {string} variant - Variante del avatar
 * @param {string} paletteId - ID de la paleta
 * @returns {string} ID formateado
 */
export const createBoringAvatarId = (variant, paletteId = 'blueGray') => {
  return `boring:${variant}:${paletteId}`;
};

/**
 * Parsea un banner ID para determinar si es un preset o generativo
 * Formato preset: banner:{presetId}
 * Formato generativo: banner:gen:{seed}
 * @param {string} bannerId - ID del banner
 * @returns {object|null} Configuración parseada
 */
export const parseBanner = (bannerId) => {
  if (!bannerId) return null;

  // Si es una URL, es un banner personalizado
  if (bannerId.startsWith('http')) {
    return { type: 'custom', url: bannerId };
  }

  // Si empieza con banner:
  if (bannerId.startsWith('banner:')) {
    const parts = bannerId.split(':');

    if (parts[1] === 'gen') {
      return { type: 'generative', seed: parts[2] || '' };
    }

    return { type: 'preset', presetId: parts[1] };
  }

  return null;
};

/**
 * Obtiene el gradiente CSS de un banner por su ID
 * @param {string} bannerId - ID del banner
 * @param {string} userId - ID del usuario (para banners generativos)
 * @param {string} theme - Tema actual
 * @returns {string|null} CSS gradient o null
 */
export const getBannerGradient = (bannerId, userId = '', theme = 'dark') => {
  const parsed = parseBanner(bannerId);

  if (!parsed) return null;

  if (parsed.type === 'preset') {
    const preset = PRESET_BANNERS.find(b => b.id === parsed.presetId);
    return preset ? preset.gradient : null;
  }

  if (parsed.type === 'generative') {
    return generateUserBanner(parsed.seed || userId, theme);
  }

  return null;
};

export default {
  AVATAR_PALETTES,
  BORING_AVATAR_VARIANTS,
  PRESET_BANNERS,
  generateUserBanner,
  getPaletteForTheme,
  getBoringAvatarConfig,
  parseBoringAvatar,
  createBoringAvatarId,
  parseBanner,
  getBannerGradient,
};
