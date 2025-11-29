/**
 * @fileoverview Servicio para cargar datos del dashboard
 * @module services/dashboardService
 */

import {
  loadStudents,
  loadGameHistory,
  loadCategories,
  loadCourses,
  getAllUsers
} from '../firebase/firestore';
import { getContentByTeacher, getExercises } from '../firebase/content';
import { getTeacherSessions } from '../firebase/classSessions';
import logger from '../utils/logger';

/**
 * Carga todos los datos necesarios para el dashboard del profesor
 * @param {string} teacherId - ID del profesor
 * @param {boolean} isAdmin - Si el usuario es administrador
 * @returns {Promise<Object>} Datos del dashboard
 */
export async function loadDashboardData(teacherId, isAdmin) {
  try {
    logger.debug('Cargando datos del dashboard', { teacherId, isAdmin }, 'DashboardService');

    const promises = [
      loadStudents(),
      loadGameHistory(),
      loadCategories(),
      loadCourses()
    ];

    // Si es profesor (no admin), cargar su contenido y ejercicios
    if (!isAdmin) {
      promises.push(getContentByTeacher(teacherId));
      promises.push(getExercises(teacherId));
      promises.push(getTeacherSessions(teacherId));
    }

    const results = await Promise.all(promises);

    const [students, games, categories, courses] = results;
    const teacherContent = !isAdmin ? results[4] : [];
    const teacherExercises = !isAdmin ? results[5] : [];
    const teacherClasses = !isAdmin ? results[6] : []; // Now using sessions instead of classes

    // Calcular estadísticas
    const stats = {
      totalStudents: students.length,
      totalGames: games.length,
      totalCategories: categories.length,
      totalCourses: courses.length
    };

    // Top 5 estudiantes por puntuación
    const topStudents = students
      .sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0))
      .slice(0, 5)
      .map(s => ({
        id: s.id,
        name: s.name,
        score: s.totalScore || 0,
        gamesPlayed: s.gamesPlayed || 0
      }));

    // Últimos 5 juegos
    const recentGames = games
      .sort((a, b) => {
        const dateA = a.timestamp?.toMillis?.() || 0;
        const dateB = b.timestamp?.toMillis?.() || 0;
        return dateB - dateA;
      })
      .slice(0, 5)
      .map(g => ({
        id: g.id,
        studentName: g.studentName || 'Desconocido',
        categoryName: g.categoryName || 'Sin categoría',
        score: g.score || 0,
        timestamp: g.timestamp
      }));

    logger.info('Datos del dashboard cargados correctamente', 'DashboardService');

    return {
      stats,
      topStudents,
      recentGames,
      courses,
      teacherContent,
      teacherExercises,
      teacherClasses
    };
  } catch (error) {
    logger.error('Error cargando datos del dashboard', error, 'DashboardService');
    throw error;
  }
}

/**
 * Carga la lista de todos los usuarios (solo para admin)
 * @returns {Promise<Array>} Lista de usuarios
 */
export async function loadAllUsers() {
  try {
    logger.debug('Cargando todos los usuarios', null, 'DashboardService');
    const users = await getAllUsers();
    logger.info(`${users.length} usuarios cargados`, 'DashboardService');
    return users;
  } catch (error) {
    logger.error('Error cargando usuarios', error, 'DashboardService');
    throw error;
  }
}

/**
 * Recarga los datos del dashboard de forma optimizada
 * Solo recarga lo necesario basándose en la pantalla actual
 * @param {string} currentScreen - Pantalla actual del dashboard
 * @param {string} teacherId - ID del profesor
 * @param {boolean} isAdmin - Si el usuario es administrador
 * @returns {Promise<Object>} Datos actualizados
 */
export async function refreshDashboardData(currentScreen, teacherId, isAdmin) {
  try {
    logger.debug('Refrescando datos del dashboard', { currentScreen }, 'DashboardService');

    // Dependiendo de la pantalla, solo cargar los datos necesarios
    switch (currentScreen) {
      case 'dashboard':
        return await loadDashboardData(teacherId, isAdmin);

      case 'users':
        if (!isAdmin) {
          throw new Error('Solo los administradores pueden ver usuarios');
        }
        const users = await loadAllUsers();
        return { users };

      case 'courses':
        const courses = await loadCourses();
        return { courses };

      case 'content':
        const content = await getContentByTeacher(teacherId);
        return { content };

      case 'exercises':
        const exercises = await getExercises(teacherId);
        return { exercises };

      case 'classes':
        const classes = await getTeacherSessions(teacherId);
        return { classes };

      default:
        logger.warn(`Pantalla desconocida: ${currentScreen}`, 'DashboardService');
        return {};
    }
  } catch (error) {
    logger.error('Error refrescando datos del dashboard', error, 'DashboardService');
    throw error;
  }
}

export default {
  loadDashboardData,
  loadAllUsers,
  refreshDashboardData
};
