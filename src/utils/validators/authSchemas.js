/**
 * @fileoverview Schemas de validación con Zod para autenticación
 * @module utils/validators/authSchemas
 */

import { z } from 'zod';
import { MIN_PASSWORD_LENGTH, MAX_PASSWORD_LENGTH, USER_ROLES } from '../../constants/auth.js';

/**
 * Schema para validar email
 */
export const emailSchema = z
  .string()
  .min(1, { message: 'El email es requerido' })
  .email({ message: 'Formato de email inválido' })
  .toLowerCase()
  .trim();

/**
 * Schema para validar contraseña
 */
export const passwordSchema = z
  .string()
  .min(MIN_PASSWORD_LENGTH, {
    message: `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres`
  })
  .max(MAX_PASSWORD_LENGTH, {
    message: `La contraseña no puede tener más de ${MAX_PASSWORD_LENGTH} caracteres`
  });

/**
 * Schema para login
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema
});

/**
 * Schema para registro
 */
export const registerSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
    name: z.string().optional(),
    role: z
      .enum(Object.values(USER_ROLES), {
        errorMap: () => ({ message: 'Rol inválido' })
      })
      .default(USER_ROLES.TEACHER)
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword']
  });

/**
 * Schema para reseteo de contraseña
 */
export const resetPasswordSchema = z.object({
  email: emailSchema
});

/**
 * Schema para crear usuario (admin)
 */
export const createUserSchema = z.object({
  email: emailSchema,
  name: z
    .string()
    .min(1, { message: 'El nombre es requerido' })
    .max(100, { message: 'El nombre es muy largo' })
    .trim(),
  role: z.enum(Object.values(USER_ROLES), {
    errorMap: () => ({ message: 'Rol inválido' })
  }),
  phone: z.string().optional(),
  notes: z.string().optional(),
  avatar: z.string().optional()
});

/**
 * Schema para actualizar usuario
 */
export const updateUserSchema = z.object({
  name: z.string().min(1).max(100).trim().optional(),
  phone: z.string().optional(),
  notes: z.string().optional(),
  avatar: z.string().optional(),
  status: z.enum(['active', 'inactive', 'suspended']).optional()
});

/**
 * Función helper para validar y retornar errores formateados
 * @template T
 * @param {z.ZodSchema<T>} schema - Schema de Zod
 * @param {unknown} data - Datos a validar
 * @returns {{success: true, data: T} | {success: false, errors: Record<string, string>}}
 */
export function validateSchema(schema, data) {
  try {
    const validatedData = schema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Convertir errores de Zod a objeto simple
      const errors = {};
      error.errors.forEach((err) => {
        const path = err.path.join('.');
        errors[path] = err.message;
      });
      return { success: false, errors };
    }
    // Error inesperado
    return {
      success: false,
      errors: { _global: 'Error de validación inesperado' }
    };
  }
}
