/**
 * @fileoverview Sistema de logging centralizado
 * @module utils/logger
 */

/**
 * Niveles de log
 */
const LOG_LEVELS = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  DEBUG: 'debug'
};

/**
 * Configuración de logging
 * En producción, podríamos desactivar DEBUG e INFO
 */
const config = {
  level: import.meta.env.PROD ? LOG_LEVELS.WARN : LOG_LEVELS.DEBUG,
  enableTimestamps: true,
  enableColors: true
};

/**
 * Colores ANSI para consola (solo en desarrollo)
 */
const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  gray: '\x1b[90m'
};

/**
 * Prefijos con emojis para mejor legibilidad
 */
const PREFIXES = {
  error: '❌',
  warn: '⚠️',
  info: 'ℹ️',
  debug: '🔍'
};

/**
 * Verifica si un nivel de log debe mostrarse
 * @param {string} level - Nivel del mensaje
 * @returns {boolean}
 */
function shouldLog(level) {
  const levels = Object.values(LOG_LEVELS);
  const currentLevelIndex = levels.indexOf(config.level);
  const messageLevelIndex = levels.indexOf(level);
  return messageLevelIndex <= currentLevelIndex;
}

/**
 * Formatea un mensaje de log
 * @param {string} level - Nivel del log
 * @param {string} message - Mensaje
 * @param {string} [context] - Contexto opcional (ej: "AuthService")
 * @returns {string}
 */
function formatMessage(level, message, context) {
  const parts = [];

  if (config.enableTimestamps) {
    const time = new Date().toLocaleTimeString('es-ES', { hour12: false });
    parts.push(`[${time}]`);
  }

  parts.push(PREFIXES[level]);

  if (context) {
    parts.push(`[${context}]`);
  }

  parts.push(message);

  return parts.join(' ');
}

/**
 * Logger principal
 */
const logger = {
  /**
   * Log de error
   * @param {string} message - Mensaje de error
   * @param {Error | unknown} [error] - Objeto de error opcional
   * @param {string} [context] - Contexto opcional
   */
  error(message, error, context) {
    if (!shouldLog(LOG_LEVELS.ERROR)) return;

    const formattedMessage = formatMessage(LOG_LEVELS.ERROR, message, context);

    if (config.enableColors && !import.meta.env.PROD) {
      console.error(`${COLORS.red}${formattedMessage}${COLORS.reset}`);
    } else {
      console.error(formattedMessage);
    }

    if (error) {
      console.error('Error details:', error);
      if (error instanceof Error && error.stack) {
        console.error('Stack trace:', error.stack);
      }
    }

    // TODO: En producción, enviar a servicio de logging (Sentry, LogRocket, etc.)
  },

  /**
   * Log de advertencia
   * @param {string} message - Mensaje de advertencia
   * @param {string} [context] - Contexto opcional
   */
  warn(message, context) {
    if (!shouldLog(LOG_LEVELS.WARN)) return;

    const formattedMessage = formatMessage(LOG_LEVELS.WARN, message, context);

    if (config.enableColors && !import.meta.env.PROD) {
      console.warn(`${COLORS.yellow}${formattedMessage}${COLORS.reset}`);
    } else {
      console.warn(formattedMessage);
    }
  },

  /**
   * Log informativo
   * @param {string} message - Mensaje informativo
   * @param {string} [context] - Contexto opcional
   */
  info(message, context) {
    if (!shouldLog(LOG_LEVELS.INFO)) return;

    const formattedMessage = formatMessage(LOG_LEVELS.INFO, message, context);

    if (config.enableColors && !import.meta.env.PROD) {
      console.log(`${COLORS.blue}${formattedMessage}${COLORS.reset}`);
    } else {
      console.log(formattedMessage);
    }
  },

  /**
   * Log de debug (solo en desarrollo)
   * @param {string} message - Mensaje de debug
   * @param {unknown} [data] - Datos opcionales para inspeccionar
   * @param {string} [context] - Contexto opcional
   */
  debug(message, data, context) {
    if (!shouldLog(LOG_LEVELS.DEBUG)) return;

    const formattedMessage = formatMessage(LOG_LEVELS.DEBUG, message, context);

    if (config.enableColors && !import.meta.env.PROD) {
      console.log(`${COLORS.gray}${formattedMessage}${COLORS.reset}`);
    } else {
      console.log(formattedMessage);
    }

    if (data !== undefined) {
      console.log('Data:', data);
    }
  }
};

export default logger;
