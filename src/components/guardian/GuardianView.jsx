/**
 * @fileoverview Guardian View - Vista para tutores/padres en Universal Dashboard
 * @module components/guardian/GuardianView
 *
 * Vista simplificada para que tutores vean el progreso de sus estudiantes asignados
 */

import logger from '../../utils/logger';
import { useState } from 'react';
import { useGuardian } from '../../hooks/useGuardian';
import {
  Users,
  TrendingUp,
  Award,
  BookOpen,
  Target,
  Eye,
  Calendar,
  Trophy,
  BarChart3
} from 'lucide-react';
import {
  BaseButton,
  BaseBadge,
  BaseLoading,
  BaseEmptyState,
  BaseAlert
} from '../common';
import { UniversalCard } from '../cards';

/**
 * Vista de Guardian para Universal Dashboard
 */
function GuardianView({ user, onViewStudentDetails }) {
  const { guardian, students, loading, error } = useGuardian(user.uid);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

  // Loading state
  if (loading) {
    return <BaseLoading size="large" text="Cargando información de tus estudiantes..." />;
  }

  // Error state
  if (error) {
    return (
      <div className="p-6">
        <BaseAlert variant="danger" title="Error al cargar">
          {error}
        </BaseAlert>
      </div>
    );
  }

  // No guardian profile
  if (!guardian) {
    return (
      <div className="p-6">
        <BaseEmptyState
          icon={Users}
          title="Perfil de tutor no configurado"
          description="Contacta al administrador para configurar tu acceso como tutor y vincular estudiantes"
        />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Users size={32} />
            Panel de {guardian.name || 'Tutor'}
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {students.length} {students.length === 1 ? 'estudiante asignado' : 'estudiantes asignados'}
          </p>
        </div>

        {/* View mode toggle */}
        {students.length > 0 && (
          <div className="flex gap-2">
            <BaseButton
              onClick={() => setViewMode('grid')}
              variant={viewMode === 'grid' ? 'primary' : 'ghost'}
              size="sm"
            >
              Tarjetas
            </BaseButton>
            <BaseButton
              onClick={() => setViewMode('list')}
              variant={viewMode === 'list' ? 'primary' : 'ghost'}
              size="sm"
            >
              Lista
            </BaseButton>
          </div>
        )}
      </div>

      {/* Empty state */}
      {students.length === 0 ? (
        <BaseEmptyState
          icon={Users}
          title="No hay estudiantes asignados"
          description="Contacta al administrador para que te asignen estudiantes que puedas supervisar"
        />
      ) : (
        /* Student cards */
        <div className={
          viewMode === 'grid'
            ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4'
            : 'flex flex-col gap-3'
        }>
          {students.map((student) => {
            // Calcular estadísticas básicas
            const enrollmentCount = student.enrollmentCount || 0;
            const completedCount = student.completedCourses || 0;
            const averageGrade = student.averageGrade || 0;
            const streak = student.streak || 0;

            // Avatar inicial
            const initial = student.name?.charAt(0).toUpperCase() || '?';
            const avatarColor = '#3b82f6'; // blue

            return (
              <UniversalCard
                key={student.id}
                variant="user"
                size="md"
                layout={viewMode === 'list' ? 'horizontal' : 'vertical'}
                avatar={initial}
                avatarColor={avatarColor}
                title={student.name}
                subtitle={student.email}
                badges={[
                  { variant: 'primary', children: 'Estudiante' }
                ]}
                stats={[
                  { label: 'Cursos', value: enrollmentCount, icon: BookOpen },
                  { label: 'Completados', value: completedCount, icon: Trophy },
                  ...(averageGrade > 0 ? [{ label: 'Promedio', value: averageGrade.toFixed(1), icon: Target }] : []),
                  ...(streak > 0 ? [{ label: 'Racha', value: `${streak} días`, icon: TrendingUp }] : [])
                ]}
                onClick={() => onViewStudentDetails && onViewStudentDetails(student.id)}
                actions={
                  <BaseButton
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewStudentDetails && onViewStudentDetails(student.id);
                    }}
                    variant="primary"
                    size="sm"
                    icon={Eye}
                    fullWidth
                  >
                    Ver Detalle
                  </BaseButton>
                }
              />
            );
          })}
        </div>
      )}

      {/* Info section */}
      {students.length > 0 && (
        <div className="mt-8">
          <UniversalCard variant="default" size="md">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <BarChart3 size={20} />
                Resumen General
              </h3>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {students.length}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Estudiantes
                  </div>
                </div>

                <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {students.reduce((sum, s) => sum + (s.enrollmentCount || 0), 0)}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Total Cursos
                  </div>
                </div>

                <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {students.reduce((sum, s) => sum + (s.completedCourses || 0), 0)}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Completados
                  </div>
                </div>

                <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {students.length > 0
                      ? (students.reduce((sum, s) => sum + (s.averageGrade || 0), 0) / students.length).toFixed(1)
                      : '0.0'
                    }
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Promedio Gral.
                  </div>
                </div>
              </div>
            </div>
          </UniversalCard>
        </div>
      )}

      {/* Help banner */}
      <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <div className="flex items-start gap-3">
          <Award size={20} className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
              Panel de Tutor
            </h4>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Como tutor, puedes ver el progreso de los estudiantes que te han sido asignados.
              Haz clic en "Ver Detalle" para ver información más completa de cada estudiante.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GuardianView;
