/**
 * @fileoverview Student Assigner - Assign or reassign student to homework review
 * @module components/homework/StudentAssigner
 */

import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { User, CheckCircle } from 'lucide-react';
import { BaseButton, BaseAlert, BaseLoading } from '../common';
import { getStudentsByTeacher } from '../../firebase/users';
import logger from '../../utils/logger';

/**
 * Student Assigner Component
 * Allows assigning or reassigning a student to a homework review
 *
 * @param {Object} props
 * @param {string} props.teacherId - Teacher ID
 * @param {string} props.currentStudentId - Currently assigned student ID (can be null)
 * @param {string} props.currentStudentName - Currently assigned student name
 * @param {function} props.onAssign - Callback when student is assigned (studentId, studentName)
 * @param {boolean} props.allowUnassigned - Allow "no student" option (default: true)
 * @param {boolean} props.inline - Inline mode (just dropdown, no card) (default: false)
 */
export default function StudentAssigner({
  teacherId,
  currentStudentId = null,
  currentStudentName = 'Sin asignar',
  onAssign,
  allowUnassigned = true,
  inline = false
}) {
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState(currentStudentId || '');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadStudents();
  }, [teacherId]);

  useEffect(() => {
    setHasChanges(selectedStudentId !== (currentStudentId || ''));
  }, [selectedStudentId, currentStudentId]);

  const loadStudents = async () => {
    try {
      setLoading(true);
      setError(null);
      const studentsList = await getStudentsByTeacher(teacherId);
      setStudents(studentsList);
      logger.info(`Loaded ${studentsList.length} students for teacher ${teacherId}`, 'StudentAssigner');
    } catch (err) {
      logger.error('Error loading students', 'StudentAssigner', err);
      setError('Error al cargar la lista de estudiantes');
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = () => {
    const student = students.find(s => s.id === selectedStudentId);
    const studentName = student?.name || student?.email || 'Sin asignar';

    onAssign(selectedStudentId || null, studentName);
    logger.info(`Assigned student ${selectedStudentId || 'none'} to homework`, 'StudentAssigner');
  };

  const handleReset = () => {
    setSelectedStudentId(currentStudentId || '');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <BaseLoading variant="spinner" size="sm" text="Cargando estudiantes..." />
      </div>
    );
  }

  // Inline mode - just the dropdown
  if (inline) {
    return (
      <select
        value={selectedStudentId}
        onChange={(e) => setSelectedStudentId(e.target.value)}
        className="input"
      >
        {allowUnassigned && (
          <option value="">Sin asignar</option>
        )}
        {students.map(student => (
          <option key={student.id} value={student.id}>
            {student.name || student.email}
          </option>
        ))}
      </select>
    );
  }

  // Full mode - compact card with controls
  return (
    <div className="space-y-2">
      {error && (
        <BaseAlert variant="danger" onClose={() => setError(null)}>
          {error}
        </BaseAlert>
      )}

      <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
        <div className="flex items-center gap-3">
          {/* Label */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <User size={16} strokeWidth={2} className="text-gray-500 dark:text-gray-400" />
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
              Estudiante:
            </span>
          </div>

          {/* Student Selector - Inline */}
          <div className="flex-1">
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              {allowUnassigned && (
                <option value="">Sin asignar</option>
              )}
              {students.length > 0 ? (
                students.map(student => (
                  <option key={student.id} value={student.id}>
                    {student.name || student.email}
                  </option>
                ))
              ) : (
                <option value="" disabled>No hay estudiantes disponibles</option>
              )}
            </select>
          </div>

          {/* Assign Button - Only when changed */}
          {hasChanges && (
            <BaseButton
              variant="primary"
              size="sm"
              onClick={handleAssign}
              className="flex items-center gap-1.5 flex-shrink-0"
            >
              <CheckCircle size={12} strokeWidth={2} />
              Asignar
            </BaseButton>
          )}
        </div>
      </div>
    </div>
  );
}

StudentAssigner.propTypes = {
  teacherId: PropTypes.string.isRequired,
  currentStudentId: PropTypes.string,
  currentStudentName: PropTypes.string,
  onAssign: PropTypes.func.isRequired,
  allowUnassigned: PropTypes.bool,
  inline: PropTypes.bool
};
