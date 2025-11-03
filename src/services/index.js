/**
 * @fileoverview Barrel export para todos los repositories y servicios
 * @module services
 */

// Repositories
export { default as UserRepository } from './UserRepository.js';
export { default as CourseRepository } from './CourseRepository.js';
export { default as StudentRepository } from './StudentRepository.js';
export { default as ClassRepository } from './ClassRepository.js';
export { default as ExerciseRepository } from './ExerciseRepository.js';
export { default as ContentRepository } from './ContentRepository.js';
export { default as GroupRepository } from './GroupRepository.js';
export { default as BaseRepository } from './BaseRepository.js';

// Services
export {
  loadDashboardData,
  loadAllUsers,
  refreshDashboardData
} from './dashboardService.js';
