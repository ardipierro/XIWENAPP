/**
 * @fileoverview Barrel export para todas las utilidades
 * @module utils
 */

// Logger
export { default as logger } from './logger.js';

// Cache Manager
export { default as cacheManager } from './cacheManager.js';

// Formatters
export {
  formatDate,
  formatRelativeDate,
  formatNumber,
  formatPercentage,
  formatFileSize,
  formatDuration,
  truncateText,
  capitalize,
  capitalizeWords,
  formatRole,
  formatStatus,
  formatDifficulty,
  formatExerciseType,
  formatContentType
} from './formatters.js';

// Validation Schemas
export {
  userSchema,
  courseSchema,
  classSchema,
  exerciseSchema,
  contentSchema,
  groupSchema,
  loginSchema,
  registerSchema,
  changePasswordSchema,
  validateData,
  validateDataAsync
} from './validationSchemas.js';
