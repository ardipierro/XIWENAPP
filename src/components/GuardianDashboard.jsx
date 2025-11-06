/**
 * @fileoverview Guardian/Parent Dashboard
 * @module components/GuardianDashboard
 *
 * Dashboard para tutores/padres/encargados para ver el desempeño de sus estudiantes
 */

import { useState } from 'react';
import { useGuardian, useStudentPerformance } from '../hooks/useGuardian';
import {
  Users,
  TrendingUp,
  Award,
  Calendar,
  BookOpen,
  Target,
  Clock,
  CheckCircle,
  AlertCircle,
  Trophy,
  Flame,
  BarChart3,
  Eye,
  X
} from 'lucide-react';
import {
  BaseButton,
  BaseCard,
  BaseModal,
  BaseBadge,
  BaseLoading,
  BaseEmptyState,
  BaseAlert
} from './common';
import logger from '../utils/logger';

export default function GuardianDashboard({ user }) {
  const { guardian, students, loading, error } = useGuardian(user.uid);
  const [selectedStudent, setSelectedStudent] = useState(null);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <BaseLoading message="Cargando información..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <BaseAlert variant="danger">
          Error al cargar los datos: {error}
        </BaseAlert>
      </div>
    );
  }

  if (!guardian) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <BaseEmptyState
          icon={<Users size={64} strokeWidth={2} />}
          title="Perfil de tutor no configurado"
          description="Contacta al administrador para configurar tu acceso como tutor"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Panel de {guardian.name || 'Tutor'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Seguimiento del desempeño académico de tus estudiantes
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <BaseCard>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary bg-opacity-10 rounded-lg">
                <Users size={32} strokeWidth={2} className="text-primary" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Estudiantes
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {students.length}
                </p>
              </div>
            </div>
          </BaseCard>

          <BaseCard>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-secondary bg-opacity-10 rounded-lg">
                <TrendingUp size={32} strokeWidth={2} className="text-secondary" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Promedio General
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {calculateOverallAverage(students)}
                </p>
              </div>
            </div>
          </BaseCard>

          <BaseCard>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-warning bg-opacity-10 rounded-lg">
                <Clock size={32} strokeWidth={2} className="text-warning" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Tareas Pendientes
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {calculateTotalPending(students)}
                </p>
              </div>
            </div>
          </BaseCard>
        </div>

        {/* Students Grid */}
        {students.length === 0 ? (
          <BaseEmptyState
            icon={<Users size={64} strokeWidth={2} />}
            title="No hay estudiantes vinculados"
            description="Aún no tienes estudiantes asignados. Contacta al administrador."
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {students.map(student => (
              <StudentCard
                key={student.relationId}
                student={student}
                onViewDetails={() => setSelectedStudent(student)}
              />
            ))}
          </div>
        )}

        {/* Student Details Modal */}
        {selectedStudent && (
          <StudentDetailsModal
            student={selectedStudent}
            onClose={() => setSelectedStudent(null)}
          />
        )}
      </div>
    </div>
  );
}

/**
 * Tarjeta de estudiante con métricas principales
 */
function StudentCard({ student, onViewDetails }) {
  const { performance, loading } = useStudentPerformance(student.studentId);

  return (
    <BaseCard hover>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-bold text-lg">
              {student.studentName?.charAt(0).toUpperCase() || 'E'}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {student.studentName}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {student.relationship}
              </p>
            </div>
          </div>

          <BaseButton
            variant="ghost"
            size="sm"
            onClick={onViewDetails}
          >
            <Eye size={18} strokeWidth={2} />
            Ver detalles
          </BaseButton>
        </div>

        {loading ? (
          <div className="flex justify-center py-4">
            <BaseLoading size="sm" />
          </div>
        ) : performance ? (
          <>
            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-4">
              {/* Academic */}
              {student.canViewGrades && (
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <BookOpen size={16} strokeWidth={2} className="text-gray-400" />
                    <p className="text-xs text-gray-600 dark:text-gray-400">Promedio</p>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {performance.averageGrade?.toFixed(1) || 'N/A'}
                  </p>
                </div>
              )}

              {/* Attendance */}
              {student.canViewAttendance && (
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar size={16} strokeWidth={2} className="text-gray-400" />
                    <p className="text-xs text-gray-600 dark:text-gray-400">Asistencia</p>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {performance.attendanceRate?.toFixed(0) || 0}%
                  </p>
                </div>
              )}

              {/* XP/Level */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Trophy size={16} strokeWidth={2} className="text-gray-400" />
                  <p className="text-xs text-gray-600 dark:text-gray-400">Nivel</p>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {performance.level || 1}
                </p>
              </div>

              {/* Streak */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Flame size={16} strokeWidth={2} className="text-warning" />
                  <p className="text-xs text-gray-600 dark:text-gray-400">Racha</p>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {performance.streakDays || 0}
                </p>
              </div>
            </div>

            {/* Assignments Progress */}
            {student.canViewGrades && performance.totalAssignments > 0 && (
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600 dark:text-gray-400">
                    Tareas completadas
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {performance.completedAssignments}/{performance.totalAssignments}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-secondary h-2 rounded-full"
                    style={{
                      width: `${
                        (performance.completedAssignments / performance.totalAssignments) * 100
                      }%`
                    }}
                  />
                </div>
              </div>
            )}

            {/* Alerts */}
            {performance.pendingAssignments > 3 && (
              <BaseAlert variant="warning" className="py-2">
                <div className="flex items-center gap-2">
                  <AlertCircle size={16} strokeWidth={2} />
                  <span className="text-sm">
                    {performance.pendingAssignments} tareas pendientes
                  </span>
                </div>
              </BaseAlert>
            )}
          </>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
            No hay datos de desempeño disponibles
          </p>
        )}
      </div>
    </BaseCard>
  );
}

/**
 * Modal con detalles completos del estudiante
 */
function StudentDetailsModal({ student, onClose }) {
  const { performance, loading } = useStudentPerformance(student.studentId);

  return (
    <BaseModal
      isOpen={true}
      onClose={onClose}
      title={`Detalles de ${student.studentName}`}
      size="lg"
    >
      {loading ? (
        <BaseLoading message="Cargando detalles..." />
      ) : performance ? (
        <div className="space-y-6">
          {/* Academic Section */}
          {student.canViewGrades && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                📚 Rendimiento Académico
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <MetricCard
                  label="Promedio General"
                  value={performance.averageGrade?.toFixed(1) || 'N/A'}
                  icon={<BarChart3 size={20} strokeWidth={2} />}
                />
                <MetricCard
                  label="Tareas Completadas"
                  value={`${performance.completedAssignments}/${performance.totalAssignments}`}
                  icon={<CheckCircle size={20} strokeWidth={2} />}
                />
                <MetricCard
                  label="Tareas Pendientes"
                  value={performance.pendingAssignments || 0}
                  icon={<Clock size={20} strokeWidth={2} />}
                  variant={performance.pendingAssignments > 3 ? 'warning' : 'default'}
                />
                <MetricCard
                  label="Entregas Tardías"
                  value={performance.lateAssignments || 0}
                  icon={<AlertCircle size={20} strokeWidth={2} />}
                  variant={performance.lateAssignments > 0 ? 'danger' : 'default'}
                />
              </div>
            </div>
          )}

          {/* Attendance Section */}
          {student.canViewAttendance && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                📅 Asistencia
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <MetricCard
                  label="Tasa de Asistencia"
                  value={`${performance.attendanceRate?.toFixed(0) || 0}%`}
                  icon={<Calendar size={20} strokeWidth={2} />}
                />
                <MetricCard
                  label="Clases Asistidas"
                  value={`${performance.attendedClasses || 0}/${performance.totalClasses || 0}`}
                  icon={<CheckCircle size={20} strokeWidth={2} />}
                />
              </div>
            </div>
          )}

          {/* Gamification Section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              🏆 Gamificación
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <MetricCard
                label="Nivel"
                value={performance.level || 1}
                icon={<Trophy size={20} strokeWidth={2} />}
              />
              <MetricCard
                label="XP Total"
                value={performance.totalXP || 0}
                icon={<Target size={20} strokeWidth={2} />}
              />
              <MetricCard
                label="Insignias"
                value={performance.badges || 0}
                icon={<Award size={20} strokeWidth={2} />}
              />
              <MetricCard
                label="Racha de Días"
                value={performance.streakDays || 0}
                icon={<Flame size={20} strokeWidth={2} />}
              />
            </div>
          </div>

          {/* Behavior Section */}
          {student.canViewBehavior && performance.behaviorScore && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                🌟 Comportamiento
              </h3>
              <div className="grid grid-cols-1 gap-4">
                <MetricCard
                  label="Puntuación de Comportamiento"
                  value={`${performance.behaviorScore}/100`}
                  icon={<Users size={20} strokeWidth={2} />}
                />
              </div>
            </div>
          )}
        </div>
      ) : (
        <p className="text-center text-gray-500 dark:text-gray-400">
          No hay datos disponibles
        </p>
      )}
    </BaseModal>
  );
}

/**
 * Tarjeta de métrica individual
 */
function MetricCard({ label, value, icon, variant = 'default' }) {
  const bgColors = {
    default: 'bg-gray-50 dark:bg-gray-800',
    warning: 'bg-warning bg-opacity-10',
    danger: 'bg-error bg-opacity-10'
  };

  return (
    <div className={`${bgColors[variant]} rounded-lg p-4`}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <p className="text-sm text-gray-600 dark:text-gray-400">{label}</p>
      </div>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
    </div>
  );
}

/**
 * Helper: Calcula promedio general de todos los estudiantes
 */
function calculateOverallAverage(students) {
  if (students.length === 0) return 'N/A';

  // TODO: Implementar cálculo real
  return '-';
}

/**
 * Helper: Calcula total de tareas pendientes
 */
function calculateTotalPending(students) {
  // TODO: Implementar cálculo real
  return '-';
}
