/**
 * @fileoverview Custom hook for assignments management
 * @module hooks/useAssignments
 */

import { useState, useEffect, useCallback } from 'react';
import {
  getAssignmentsByTeacher,
  getAssignmentsByCourse,
  getAssignmentsForStudent,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  getAssignmentStats
} from '../firebase/assignments';
import {
  createSubmission,
  submitAssignment,
  getSubmissionByAssignmentAndStudent,
  getSubmissionsByAssignment,
  gradeSubmission
} from '../firebase/submissions';
import logger from '../utils/logger';

/**
 * Hook for managing assignments
 * @param {string} userId - User ID
 * @param {string} userRole - User role ('teacher', 'student')
 * @param {string} courseId - Optional course ID filter
 * @returns {Object} Assignments state and methods
 */
export function useAssignments(userId, userRole, courseId = null) {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAssignments = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let data;

      if (courseId) {
        // Fetch assignments for specific course
        data = await getAssignmentsByCourse(courseId);
      } else if (userRole === 'teacher') {
        // Fetch all assignments by teacher
        data = await getAssignmentsByTeacher(userId);
      } else if (userRole === 'student') {
        // Fetch assignments for student
        data = await getAssignmentsForStudent(userId);
      } else {
        data = [];
      }

      setAssignments(data);
    } catch (err) {
      logger.error('Error fetching assignments', 'useAssignments', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId, userRole, courseId]);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  const create = useCallback(async (assignmentData) => {
    const result = await createAssignment(assignmentData);
    if (result.success) {
      await fetchAssignments();
    }
    return result;
  }, [fetchAssignments]);

  const update = useCallback(async (assignmentId, updates) => {
    const result = await updateAssignment(assignmentId, updates);
    if (result.success) {
      await fetchAssignments();
    }
    return result;
  }, [fetchAssignments]);

  const remove = useCallback(async (assignmentId) => {
    const result = await deleteAssignment(assignmentId);
    if (result.success) {
      await fetchAssignments();
    }
    return result;
  }, [fetchAssignments]);

  const getStats = useCallback(async (assignmentId) => {
    return await getAssignmentStats(assignmentId);
  }, []);

  return {
    assignments,
    loading,
    error,
    refresh: fetchAssignments,
    create,
    update,
    remove,
    getStats
  };
}

/**
 * Hook for managing submissions
 * @param {string} assignmentId - Assignment ID
 * @param {string} studentId - Student ID (for student view)
 * @returns {Object} Submission state and methods
 */
export function useSubmission(assignmentId, studentId = null) {
  const [submission, setSubmission] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSubmission = useCallback(async () => {
    if (!assignmentId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (studentId) {
        // Fetch single submission for student
        const data = await getSubmissionByAssignmentAndStudent(assignmentId, studentId);
        setSubmission(data);
      } else {
        // Fetch all submissions for assignment (teacher view)
        const data = await getSubmissionsByAssignment(assignmentId);
        setSubmissions(data);
      }
    } catch (err) {
      logger.error('Error fetching submission', 'useSubmission', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [assignmentId, studentId]);

  useEffect(() => {
    fetchSubmission();
  }, [fetchSubmission]);

  const saveSubmission = useCallback(async (submissionData) => {
    const result = await createSubmission(submissionData);
    if (result.success) {
      await fetchSubmission();
    }
    return result;
  }, [fetchSubmission]);

  const submitForGrading = useCallback(async (submissionId, assignmentData) => {
    const result = await submitAssignment(submissionId, assignmentData);
    if (result.success) {
      await fetchSubmission();
    }
    return result;
  }, [fetchSubmission]);

  const grade = useCallback(async (submissionId, gradeValue, feedback, teacherId) => {
    const result = await gradeSubmission(submissionId, gradeValue, feedback, teacherId);
    if (result.success) {
      await fetchSubmission();
    }
    return result;
  }, [fetchSubmission]);

  return {
    submission,
    submissions,
    loading,
    error,
    refresh: fetchSubmission,
    save: saveSubmission,
    submit: submitForGrading,
    grade
  };
}

export default useAssignments;
