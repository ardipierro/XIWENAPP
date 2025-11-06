/**
 * @fileoverview Firebase Exercises Repository
 * Gestión de ejercicios del sistema
 * @module firebase/exercises
 */

import { BaseRepository } from './BaseRepository';

// ============================================
// REPOSITORY
// ============================================

class ExercisesRepository extends BaseRepository {
  constructor() {
    super('exercises');
  }

  /**
   * Obtener todos los ejercicios ordenados por fecha
   */
  async getAllExercises() {
    const exercises = await this.getAll();
    return this.sortByCreatedAtDesc(exercises);
  }

  /**
   * Obtener ejercicios por profesor
   */
  async getExercisesByTeacher(teacherId) {
    const exercises = await this.findWhere([['createdBy', '==', teacherId]]);
    return this.sortByCreatedAtDesc(exercises);
  }

  /**
   * Obtener ejercicios por categoría
   */
  async getExercisesByCategory(category) {
    const exercises = await this.findWhere([['category', '==', category]]);
    return this.sortByCreatedAtDesc(exercises);
  }

  /**
   * Utility: Ordenar por fecha descendente
   */
  sortByCreatedAtDesc(items) {
    return items.sort((a, b) => {
      const dateA = a.createdAt?.toMillis?.() || 0;
      const dateB = b.createdAt?.toMillis?.() || 0;
      return dateB - dateA;
    });
  }
}

// ============================================
// INSTANCIA SINGLETON
// ============================================

const exercisesRepo = new ExercisesRepository();

// ============================================
// EXPORTED FUNCTIONS (Mantener API compatible)
// ============================================

export const createExercise = (exerciseData) => exercisesRepo.create(exerciseData);
export const getAllExercises = () => exercisesRepo.getAllExercises();
export const getExercisesByTeacher = (teacherId) => exercisesRepo.getExercisesByTeacher(teacherId);
export const getExerciseById = (exerciseId) => exercisesRepo.getById(exerciseId);
export const updateExercise = (exerciseId, updates) => exercisesRepo.update(exerciseId, updates);
export const deleteExercise = (exerciseId) => exercisesRepo.hardDelete(exerciseId);
export const getExercisesByCategory = (category) => exercisesRepo.getExercisesByCategory(category);
