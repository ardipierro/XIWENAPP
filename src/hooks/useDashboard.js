/**
 * @fileoverview Hook para gestión del dashboard del profesor
 * @module hooks/useDashboard
 */

import { useState, useCallback } from 'react';
import { loadDashboardData, loadAllUsers, refreshDashboardData } from '../services/dashboardService';
import logger from '../utils/logger';

/**
 * Hook para gestión del dashboard
 * Maneja carga de datos, navegación y estados
 */
export function useDashboard(teacherId, isAdmin) {
  const [currentScreen, setCurrentScreen] = useState('dashboard');
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalGames: 0,
    totalCategories: 0,
    totalCourses: 0
  });
  const [recentGames, setRecentGames] = useState([]);
  const [topStudents, setTopStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Estados para contenido del profesor
  const [allContent, setAllContent] = useState([]);
  const [allExercises, setAllExercises] = useState([]);
  const [allClasses, setAllClasses] = useState([]);

  /**
   * Carga inicial de datos del dashboard
   */
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await loadDashboardData(teacherId, isAdmin);

      setStats(data.stats);
      setTopStudents(data.topStudents);
      setRecentGames(data.recentGames);
      setCourses(data.courses);
      setAllContent(data.teacherContent || []);
      setAllExercises(data.teacherExercises || []);
      setAllClasses(data.teacherClasses || []);

      logger.info('Dashboard cargado correctamente', 'useDashboard');
    } catch (err) {
      logger.error('Error cargando dashboard', err, 'useDashboard');
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [teacherId, isAdmin]);

  /**
   * Carga usuarios (solo admin)
   */
  const loadUsers = useCallback(async () => {
    if (!isAdmin) {
      logger.warn('Intento de cargar usuarios sin permisos de admin', 'useDashboard');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const allUsers = await loadAllUsers();
      setUsers(allUsers);
      logger.info(`${allUsers.length} usuarios cargados`, 'useDashboard');
    } catch (err) {
      logger.error('Error cargando usuarios', err, 'useDashboard');
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  /**
   * Refresca los datos de la pantalla actual
   */
  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await refreshDashboardData(currentScreen, teacherId, isAdmin);

      // Actualizar el estado correspondiente según los datos recibidos
      if (data.stats) setStats(data.stats);
      if (data.topStudents) setTopStudents(data.topStudents);
      if (data.recentGames) setRecentGames(data.recentGames);
      if (data.courses) setCourses(data.courses);
      if (data.users) setUsers(data.users);
      if (data.content) setAllContent(data.content);
      if (data.exercises) setAllExercises(data.exercises);
      if (data.classes) setAllClasses(data.classes);

      logger.info(`Datos refrescados para pantalla: ${currentScreen}`, 'useDashboard');
    } catch (err) {
      logger.error('Error refrescando datos', err, 'useDashboard');
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [currentScreen, teacherId, isAdmin]);

  /**
   * Navega a una pantalla específica
   */
  const navigateToScreen = useCallback((screen) => {
    logger.debug(`Navegando a: ${screen}`, null, 'useDashboard');
    setCurrentScreen(screen);
  }, []);

  /**
   * Vuelve al dashboard principal
   */
  const backToDashboard = useCallback(() => {
    logger.debug('Volviendo al dashboard principal', null, 'useDashboard');
    setCurrentScreen('dashboard');
  }, []);

  return {
    // Estado
    currentScreen,
    stats,
    recentGames,
    topStudents,
    courses,
    users,
    allContent,
    allExercises,
    allClasses,
    loading,
    error,

    // Métodos
    loadData,
    loadUsers,
    refresh,
    navigateToScreen,
    backToDashboard,
    setUsers
  };
}

export default useDashboard;
