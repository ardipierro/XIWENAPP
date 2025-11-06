/**
 * @fileoverview Custom hook for guardian/parent management
 * @module hooks/useGuardian
 */

import { useState, useEffect } from 'react';
import {
  getGuardianByUserId,
  getGuardianStudents,
  getStudentPerformanceSummary,
  linkGuardianToStudent,
  unlinkGuardianFromStudent,
  updateGuardianPermissions
} from '../firebase/guardians';
import logger from '../utils/logger';

/**
 * Hook para gestionar datos de tutores y sus estudiantes
 * @param {string} userId - ID del usuario tutor
 */
export function useGuardian(userId) {
  const [guardian, setGuardian] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cargar datos del tutor
  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    loadGuardianData();
  }, [userId]);

  const loadGuardianData = async () => {
    try {
      setLoading(true);
      setError(null);

      logger.info('Loading guardian data', { userId });

      // Cargar datos del tutor
      const guardianData = await getGuardianByUserId(userId);

      if (!guardianData) {
        logger.warn('Guardian not found for user', { userId });
        setGuardian(null);
        setStudents([]);
        setLoading(false);
        return;
      }

      setGuardian(guardianData);

      // Cargar estudiantes vinculados
      const studentsData = await getGuardianStudents(guardianData.id);
      setStudents(studentsData);

      logger.info('Guardian data loaded', {
        guardianId: guardianData.id,
        studentsCount: studentsData.length
      });
    } catch (err) {
      logger.error('Error loading guardian data', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const linkStudent = async (studentData) => {
    try {
      if (!guardian) {
        throw new Error('Guardian not initialized');
      }

      const result = await linkGuardianToStudent({
        guardianId: guardian.id,
        ...studentData
      });

      if (result.success) {
        await loadGuardianData(); // Recargar lista
      }

      return result;
    } catch (err) {
      logger.error('Error linking student', err);
      return { success: false, error: err.message };
    }
  };

  const unlinkStudent = async (relationId) => {
    try {
      const result = await unlinkGuardianFromStudent(relationId);

      if (result.success) {
        await loadGuardianData(); // Recargar lista
      }

      return result;
    } catch (err) {
      logger.error('Error unlinking student', err);
      return { success: false, error: err.message };
    }
  };

  const updatePermissions = async (relationId, permissions) => {
    try {
      const result = await updateGuardianPermissions(relationId, permissions);

      if (result.success) {
        await loadGuardianData(); // Recargar lista
      }

      return result;
    } catch (err) {
      logger.error('Error updating permissions', err);
      return { success: false, error: err.message };
    }
  };

  return {
    guardian,
    students,
    loading,
    error,
    refresh: loadGuardianData,
    linkStudent,
    unlinkStudent,
    updatePermissions
  };
}

/**
 * Hook para obtener desempeño de un estudiante específico
 * @param {string} studentId - ID del estudiante
 */
export function useStudentPerformance(studentId) {
  const [performance, setPerformance] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!studentId) {
      setLoading(false);
      return;
    }

    loadPerformance();
  }, [studentId]);

  const loadPerformance = async () => {
    try {
      setLoading(true);
      logger.info('Loading student performance', { studentId });

      const data = await getStudentPerformanceSummary(studentId);
      setPerformance(data);
    } catch (err) {
      logger.error('Error loading student performance', err);
    } finally {
      setLoading(false);
    }
  };

  return {
    performance,
    loading,
    refresh: loadPerformance
  };
}
