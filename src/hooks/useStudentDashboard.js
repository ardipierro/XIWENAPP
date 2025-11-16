/**
 * @fileoverview Custom hook for Student Dashboard logic
 * @module hooks/useStudentDashboard
 */

import { useState, useEffect } from 'react';
import logger from '../utils/logger';
import {
  getStudentGameHistory,
  ensureStudentProfile,
  getStudentEnrollments
} from '../firebase/firestore';
import { getStudentSessions } from '../firebase/classSessions';
import { subscribeToLiveWhiteboards } from '../firebase/whiteboard';

/**
 * Custom hook for Student Dashboard data and logic
 * @param {Object} user - Firebase user object
 * @param {Object} studentProp - Optional student profile prop
 * @returns {Object} Dashboard state and handlers
 */
export function useStudentDashboard(user, studentProp) {
  const [student, setStudent] = useState(studentProp);
  const [gameHistory, setGameHistory] = useState([]);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [upcomingClasses, setUpcomingClasses] = useState([]);
  const [liveWhiteboards, setLiveWhiteboards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalGames: 0,
    averageScore: 0,
    bestScore: 0,
    totalCorrect: 0,
    totalQuestions: 0
  });

  // Calculate statistics from game history
  const calculateStats = (history) => {
    if (!history || history.length === 0) {
      setStats({
        totalGames: 0,
        averageScore: 0,
        bestScore: 0,
        totalCorrect: 0,
        totalQuestions: 0
      });
      return;
    }

    const totalGames = history.length;
    const totalCorrect = history.reduce((sum, game) => sum + (game.correctAnswers || 0), 0);
    const totalQuestions = history.reduce((sum, game) => sum + (game.totalQuestions || 0), 0);
    const averageScore = Math.round(history.reduce((sum, game) => sum + (game.percentage || 0), 0) / totalGames) || 0;
    const bestScore = Math.max(...history.map(game => game.percentage || 0)) || 0;

    setStats({
      totalGames,
      averageScore: isNaN(averageScore) ? 0 : averageScore,
      bestScore: isNaN(bestScore) ? 0 : bestScore,
      totalCorrect,
      totalQuestions
    });
  };

  // Load student profile and data
  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      const startTime = performance.now();

      try {
        let profileData = studentProp;

        // If no student prop, fetch/create profile
        if (!studentProp && user) {
          logger.debug('Cargando perfil de estudiante para:', user.uid);
          profileData = await ensureStudentProfile(user.uid);

          if (profileData) {
            logger.debug('Perfil de estudiante cargado/creado:', profileData);
            setStudent(profileData);
          } else {
            logger.warn('No se pudo cargar ni crear perfil de estudiante para:', user.uid);
            setLoading(false);
            return;
          }
        } else if (studentProp) {
          setStudent(studentProp);
        }

        if (profileData) {
          // Load data in parallel
          const dataStart = performance.now();
          const [history, enrollments, sessions] = await Promise.all([
            getStudentGameHistory(profileData.id),
            getStudentEnrollments(profileData.id),
            getStudentSessions(profileData.id)
          ]);

          logger.debug(`⏱️ [useStudentDashboard] Datos paralelos: ${(performance.now() - dataStart).toFixed(0)}ms`);

          setGameHistory(history);
          calculateStats(history);
          setEnrolledCourses(enrollments);

          // Filter future sessions (single sessions with scheduledStart)
          const now = new Date();
          const futureSessions = sessions.filter(session => {
            if (session.status === 'live') return true; // Always show live sessions
            if (session.type === 'single' && session.scheduledStart) {
              const sessionDate = session.scheduledStart.toDate ?
                session.scheduledStart.toDate() : new Date(session.scheduledStart);
              return sessionDate >= now;
            }
            if (session.type === 'recurring') return true; // Show recurring
            return false;
          });
          setUpcomingClasses(futureSessions.slice(0, 3)); // Show first 3 upcoming classes
        }

        logger.debug(`⏱️ [useStudentDashboard] TOTAL: ${(performance.now() - startTime).toFixed(0)}ms`);
      } catch (err) {
        logger.error('Error loading student dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user, studentProp]);

  // Subscribe to live whiteboards
  useEffect(() => {
    if (!student?.id) return;

    logger.debug('🟢 [useStudentDashboard] Subscribing to live whiteboards for student:', student.id);
    const unsubscribe = subscribeToLiveWhiteboards(student.id, (whiteboards) => {
      logger.debug('🟢 [useStudentDashboard] Live whiteboards updated:', whiteboards);
      setLiveWhiteboards(whiteboards);
    });

    return () => {
      logger.debug('🟡 [useStudentDashboard] Unsubscribing from live whiteboards');
      unsubscribe();
    };
  }, [student?.id]);

  // Calculate progress values
  const points = student?.profile?.totalPoints || 0;
  const level = student?.profile?.level || 1;
  const pointsInLevel = points % 100;
  const pointsToNextLevel = 100 - pointsInLevel;
  const progressPercentage = pointsInLevel;

  return {
    student,
    gameHistory,
    enrolledCourses,
    upcomingClasses,
    liveWhiteboards,
    loading,
    stats,
    points,
    level,
    pointsToNextLevel,
    progressPercentage
  };
}
