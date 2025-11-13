import { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import {
  BarChart3, Trophy, BookOpen, Gamepad2, Target, Users
} from 'lucide-react';
import {
  getActivityByDay,
  getTopStudents,
  getCourseStats,
  getPopularExercises
} from '../firebase/analytics';
import { DashboardContainer, SectionHeader } from './common';
import BaseCard from './common/BaseCard';

const COLORS = ['#52525b', '#71717a', '#a1a1aa', '#f59e0b', '#10b981', '#d4d4d8', '#ef4444', '#3f3f46'];

/**
 * AnalyticsDashboard - Dashboard de análisis y estadísticas
 * Refactorizado para usar Design System 3.0 (DashboardContainer + BaseCard)
 */
function AnalyticsDashboard({ user }) {
  const [loading, setLoading] = useState(true);
  const [activityData, setActivityData] = useState([]);
  const [topStudents, setTopStudents] = useState([]);
  const [courseStats, setCourseStats] = useState([]);
  const [popularExercises, setPopularExercises] = useState([]);

  useEffect(() => {
    loadAnalytics();
  }, [user]);

  const loadAnalytics = async () => {
    setLoading(true);
    const [activity, students, courses, exercises] = await Promise.all([
      getActivityByDay(user.uid),
      getTopStudents(),
      getCourseStats(),
      getPopularExercises()
    ]);

    setActivityData(activity);
    setTopStudents(students);
    setCourseStats(courses);
    setPopularExercises(exercises);
    setLoading(false);
  };

  if (loading) {
    return (
      <DashboardContainer>
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="spinner"></div>
          <p className="ml-4" style={{ color: 'var(--color-text-secondary)' }}>Cargando análisis...</p>
        </div>
      </DashboardContainer>
    );
  }

  const totalGames = activityData.reduce((sum, d) => sum + d.games, 0);
  const activeStudents = topStudents.length;
  const activeCourses = courseStats.length;

  return (
    <DashboardContainer>
      <SectionHeader
        title="Analytics"
        subtitle="Estadísticas y métricas de rendimiento"
      />

      {/* Activity by Day */}
      <BaseCard className="mb-6">
        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
          <BarChart3 size={20} strokeWidth={2} /> Actividad de Juegos (Últimos 7 Días)
        </h3>
        {activityData.length === 0 ? (
          <p className="text-center py-8" style={{ color: 'var(--color-text-secondary)' }}>
            No hay datos de actividad reciente
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={activityData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis
                dataKey="date"
                stroke="var(--color-text-secondary)"
              />
              <YAxis stroke="var(--color-text-secondary)" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--color-bg-secondary)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px',
                  color: 'var(--color-text-primary)'
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="games"
                stroke="var(--color-primary)"
                strokeWidth={2}
                name="Juegos jugados"
                dot={{ fill: 'var(--color-primary)', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </BaseCard>

      {/* Top Students and Course Stats Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Top Students */}
        <BaseCard>
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
            <Trophy size={20} strokeWidth={2} /> Top 10 Estudiantes
          </h3>
          {topStudents.length === 0 ? (
            <p className="text-center py-8" style={{ color: 'var(--color-text-secondary)' }}>
              No hay datos de estudiantes
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topStudents} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis type="number" stroke="var(--color-text-secondary)" />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={100}
                  stroke="var(--color-text-secondary)"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--color-bg-secondary)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    color: 'var(--color-text-primary)'
                  }}
                />
                <Bar dataKey="points" fill="var(--color-text-secondary)" name="Puntos totales" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </BaseCard>

        {/* Course Stats */}
        <BaseCard>
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
            <BookOpen size={20} strokeWidth={2} /> Rendimiento por Curso
          </h3>
          {courseStats.length === 0 ? (
            <p className="text-center py-8" style={{ color: 'var(--color-text-secondary)' }}>
              No hay estadísticas de cursos
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={courseStats}
                  dataKey="average"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, average }) => `${name}: ${average}%`}
                >
                  {courseStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => `${value}% de aciertos`}
                  contentStyle={{
                    backgroundColor: 'var(--color-bg-secondary)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    color: 'var(--color-text-primary)'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </BaseCard>
      </div>

      {/* Popular Exercises */}
      <BaseCard className="mb-6">
        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
          <Gamepad2 size={20} strokeWidth={2} /> Ejercicios Más Jugados
        </h3>
        {popularExercises.length === 0 ? (
          <p className="text-center py-8" style={{ color: 'var(--color-text-secondary)' }}>
            No hay datos de ejercicios
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={popularExercises}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis
                dataKey="name"
                stroke="var(--color-text-secondary)"
                angle={-45}
                textAnchor="end"
                height={100}
              />
              <YAxis stroke="var(--color-text-secondary)" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--color-bg-secondary)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px',
                  color: 'var(--color-text-primary)'
                }}
              />
              <Legend />
              <Bar dataKey="plays" fill="var(--color-success)" name="Veces jugado" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </BaseCard>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <BaseCard>
          <div className="text-center py-4">
            <div className="text-4xl mb-2 flex justify-center">
              <Target size={40} strokeWidth={2} style={{ color: 'var(--color-info)' }} />
            </div>
            <div className="text-3xl font-bold mb-1" style={{ color: 'var(--color-text-primary)' }}>
              {totalGames}
            </div>
            <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              Juegos Totales (7 días)
            </div>
          </div>
        </BaseCard>

        <BaseCard>
          <div className="text-center py-4">
            <div className="text-4xl mb-2 flex justify-center">
              <Users size={40} strokeWidth={2} style={{ color: 'var(--color-success)' }} />
            </div>
            <div className="text-3xl font-bold mb-1" style={{ color: 'var(--color-text-primary)' }}>
              {activeStudents}
            </div>
            <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              Estudiantes Activos
            </div>
          </div>
        </BaseCard>

        <BaseCard>
          <div className="text-center py-4">
            <div className="text-4xl mb-2 flex justify-center">
              <BookOpen size={40} strokeWidth={2} style={{ color: 'var(--color-warning)' }} />
            </div>
            <div className="text-3xl font-bold mb-1" style={{ color: 'var(--color-text-primary)' }}>
              {activeCourses}
            </div>
            <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              Cursos con Actividad
            </div>
          </div>
        </BaseCard>
      </div>
    </DashboardContainer>
  );
}

export default AnalyticsDashboard;
