/**
 * @fileoverview Esquemas de validación con Zod para formularios
 * @module utils/validationSchemas
 */

import { z } from 'zod';
import { ROLES } from '../firebase/roleConfig';

/**
 * Schema de validación para usuarios
 */
export const userSchema = z.object({
  name: z.string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres')
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'El nombre solo puede contener letras y espacios'),

  email: z.string()
    .email('Email inválido')
    .toLowerCase()
    .trim(),

  role: z.enum([ROLES.STUDENT, ROLES.TEACHER, ROLES.ADMIN, ROLES.SUPPORT, ROLES.CONTENT_CREATOR, ROLES.DEVELOPER], {
    errorMap: () => ({ message: 'Rol inválido' })
  }),

  phone: z.string()
    .regex(/^[0-9]{9,15}$/, 'Teléfono debe tener entre 9 y 15 dígitos')
    .optional()
    .or(z.literal('')),

  password: z.string()
    .min(6, 'La contraseña debe tener al menos 6 caracteres')
    .max(128, 'La contraseña no puede exceder 128 caracteres')
});

/**
 * Schema de validación para cursos
 */
export const courseSchema = z.object({
  name: z.string()
    .min(3, 'El nombre del curso debe tener al menos 3 caracteres')
    .max(200, 'El nombre no puede exceder 200 caracteres')
    .trim(),

  description: z.string()
    .min(10, 'La descripción debe tener al menos 10 caracteres')
    .max(1000, 'La descripción no puede exceder 1000 caracteres')
    .trim(),

  difficulty: z.enum(['beginner', 'intermediate', 'advanced'], {
    errorMap: () => ({ message: 'Dificultad inválida' })
  }),

  estimatedHours: z.number()
    .min(1, 'Las horas estimadas deben ser al menos 1')
    .max(1000, 'Las horas estimadas no pueden exceder 1000')
    .int('Las horas deben ser un número entero')
    .optional(),

  tags: z.array(z.string())
    .optional(),

  imageUrl: z.string()
    .url('URL de imagen inválida')
    .optional()
    .or(z.literal(''))
});

/**
 * Schema de validación para clases
 */
export const classSchema = z.object({
  name: z.string()
    .min(3, 'El nombre de la clase debe tener al menos 3 caracteres')
    .max(200, 'El nombre no puede exceder 200 caracteres')
    .trim(),

  description: z.string()
    .min(10, 'La descripción debe tener al menos 10 caracteres')
    .max(1000, 'La descripción no puede exceder 1000 caracteres')
    .trim()
    .optional()
    .or(z.literal('')),

  courseId: z.string()
    .min(1, 'Debe seleccionar un curso'),

  startDate: z.date({
    required_error: 'La fecha de inicio es requerida',
    invalid_type_error: 'Fecha inválida'
  }),

  endDate: z.date({
    required_error: 'La fecha de fin es requerida',
    invalid_type_error: 'Fecha inválida'
  }),

  maxStudents: z.number()
    .min(1, 'Debe haber al menos 1 estudiante')
    .max(1000, 'No puede exceder 1000 estudiantes')
    .int('Debe ser un número entero')
    .optional(),

  isActive: z.boolean()
    .optional()
}).refine(data => data.endDate > data.startDate, {
  message: 'La fecha de fin debe ser posterior a la fecha de inicio',
  path: ['endDate']
});

/**
 * Schema de validación para ejercicios
 */
export const exerciseSchema = z.object({
  title: z.string()
    .min(3, 'El título debe tener al menos 3 caracteres')
    .max(200, 'El título no puede exceder 200 caracteres')
    .trim(),

  type: z.enum([
    'multiple-choice',
    'true-false',
    'fill-blank',
    'matching',
    'ordering',
    'short-answer',
    'essay',
    'code'
  ], {
    errorMap: () => ({ message: 'Tipo de ejercicio inválido' })
  }),

  difficulty: z.enum(['easy', 'medium', 'hard'], {
    errorMap: () => ({ message: 'Dificultad inválida' })
  }),

  points: z.number()
    .min(1, 'Los puntos deben ser al menos 1')
    .max(1000, 'Los puntos no pueden exceder 1000')
    .int('Los puntos deben ser un número entero'),

  timeLimit: z.number()
    .min(0, 'El tiempo límite no puede ser negativo')
    .max(7200, 'El tiempo límite no puede exceder 2 horas (7200 segundos)')
    .int('El tiempo límite debe ser un número entero')
    .optional(),

  instructions: z.string()
    .min(10, 'Las instrucciones deben tener al menos 10 caracteres')
    .max(2000, 'Las instrucciones no pueden exceder 2000 caracteres')
    .trim(),

  courseId: z.string()
    .optional()
    .or(z.literal('')),

  tags: z.array(z.string())
    .optional()
});

/**
 * Schema de validación para contenido
 */
export const contentSchema = z.object({
  title: z.string()
    .min(3, 'El título debe tener al menos 3 caracteres')
    .max(200, 'El título no puede exceder 200 caracteres')
    .trim(),

  type: z.enum(['lesson', 'reading', 'video', 'link'], {
    errorMap: () => ({ message: 'Tipo de contenido inválido' })
  }),

  description: z.string()
    .min(10, 'La descripción debe tener al menos 10 caracteres')
    .max(1000, 'La descripción no puede exceder 1000 caracteres')
    .trim()
    .optional()
    .or(z.literal('')),

  content: z.string()
    .min(1, 'El contenido es requerido'),

  courseId: z.string()
    .optional()
    .or(z.literal('')),

  duration: z.number()
    .min(1, 'La duración debe ser al menos 1 minuto')
    .max(1440, 'La duración no puede exceder 24 horas (1440 minutos)')
    .int('La duración debe ser un número entero')
    .optional(),

  order: z.number()
    .min(0, 'El orden no puede ser negativo')
    .int('El orden debe ser un número entero')
    .optional(),

  isPublished: z.boolean()
    .optional()
});

/**
 * Schema de validación para grupos
 */
export const groupSchema = z.object({
  name: z.string()
    .min(3, 'El nombre del grupo debe tener al menos 3 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres')
    .trim(),

  description: z.string()
    .max(500, 'La descripción no puede exceder 500 caracteres')
    .trim()
    .optional()
    .or(z.literal('')),

  color: z.string()
    .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Color hexadecimal inválido')
    .optional()
    .or(z.literal('')),

  maxStudents: z.number()
    .min(1, 'Debe haber al menos 1 estudiante')
    .max(1000, 'No puede exceder 1000 estudiantes')
    .int('Debe ser un número entero')
    .optional()
});

/**
 * Schema de validación para login
 */
export const loginSchema = z.object({
  email: z.string()
    .email('Email inválido')
    .toLowerCase()
    .trim(),

  password: z.string()
    .min(6, 'La contraseña debe tener al menos 6 caracteres')
});

/**
 * Schema de validación para registro
 */
export const registerSchema = z.object({
  name: z.string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres')
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'El nombre solo puede contener letras y espacios'),

  email: z.string()
    .email('Email inválido')
    .toLowerCase()
    .trim(),

  password: z.string()
    .min(6, 'La contraseña debe tener al menos 6 caracteres')
    .max(128, 'La contraseña no puede exceder 128 caracteres'),

  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword']
});

/**
 * Schema de validación para cambio de contraseña
 */
export const changePasswordSchema = z.object({
  currentPassword: z.string()
    .min(6, 'La contraseña debe tener al menos 6 caracteres'),

  newPassword: z.string()
    .min(6, 'La contraseña debe tener al menos 6 caracteres')
    .max(128, 'La contraseña no puede exceder 128 caracteres'),

  confirmPassword: z.string()
}).refine(data => data.newPassword === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword']
}).refine(data => data.currentPassword !== data.newPassword, {
  message: 'La nueva contraseña debe ser diferente a la actual',
  path: ['newPassword']
});

/**
 * Función helper para validar datos con un schema
 * @param {z.ZodSchema} schema - Schema de Zod
 * @param {Object} data - Datos a validar
 * @returns {Object} { success: boolean, data?: any, errors?: Object }
 */
export function validateData(schema, data) {
  try {
    const validatedData = schema.parse(data);
    return {
      success: true,
      data: validatedData
    };
  } catch (error) {
    console.error('🔥 ❌ VALIDATION ERROR:', error);
    if (error instanceof z.ZodError) {
      const errors = {};
      // ZodError tiene la propiedad 'issues' en lugar de 'errors'
      const issues = error.issues || error.errors || [];
      if (Array.isArray(issues) && issues.length > 0) {
        issues.forEach(err => {
          const path = err.path.join('.');
          errors[path] = err.message;
        });
      } else {
        console.error('🔥 ❌ No issues found in ZodError:', error);
        errors.general = 'Error de validación: ' + (error.message || 'Unknown');
      }
      return {
        success: false,
        errors
      };
    }
    console.error('🔥 ❌ Not a ZodError:', error);
    return {
      success: false,
      errors: { general: 'Error de validación desconocido: ' + (error.message || 'Unknown') }
    };
  }
}

/**
 * Función helper para validar datos de forma asíncrona
 * @param {z.ZodSchema} schema - Schema de Zod
 * @param {Object} data - Datos a validar
 * @returns {Promise<Object>} { success: boolean, data?: any, errors?: Object }
 */
export async function validateDataAsync(schema, data) {
  try {
    const validatedData = await schema.parseAsync(data);
    return {
      success: true,
      data: validatedData
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = {};
      error.errors.forEach(err => {
        const path = err.path.join('.');
        errors[path] = err.message;
      });
      return {
        success: false,
        errors
      };
    }
    return {
      success: false,
      errors: { general: 'Error de validación desconocido' }
    };
  }
}

export default {
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
};
