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
  getActivityByDay,
  getTopStudents,
  getCourseStats,
  getPopularExercises
} from '../firebase/analytics';

const COLORS = ['#52525b', '#71717a', '#a1a1aa', '#f59e0b', '#10b981', '#d4d4d8', '#ef4444', '#3f3f46'];

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
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="spinner"></div>
        <p className="ml-4 text-gray-600 dark:text-gray-300">Cargando análisis...</p>
      </div>
    );
  }

  return (
    <div className="analytics-dashboard">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Análisis y Estadísticas</h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Visualización de datos y métricas de rendimiento
        </p>
      </div>

      {/* Activity by Day */}
      <div className="card mb-6">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
          📊 Actividad de Juegos (Últimos 7 Días)
        </h3>
        {activityData.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">
            No hay datos de actividad reciente
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={activityData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
              <XAxis
                dataKey="date"
                stroke="#71717a"
              />
              <YAxis stroke="#71717a" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#18181b',
                  border: '1px solid #3f3f46',
                  borderRadius: '8px',
                  color: '#f4f4f5'
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="games"
                stroke="#6366f1"
                strokeWidth={2}
                name="Juegos jugados"
                dot={{ fill: '#6366f1', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Top Students and Course Stats Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Top Students */}
        <div className="card">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
            🏆 Top 10 Estudiantes
          </h3>
          {topStudents.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
              No hay datos de estudiantes
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topStudents} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
                <XAxis type="number" stroke="#71717a" />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={100}
                  stroke="#71717a"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#18181b',
                    border: '1px solid #3f3f46',
                    borderRadius: '8px',
                    color: '#f4f4f5'
                  }}
                />
                <Bar dataKey="points" fill="#71717a" name="Puntos totales" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Course Stats */}
        <div className="card">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
            📚 Rendimiento por Curso
          </h3>
          {courseStats.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
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
                    backgroundColor: '#18181b',
                    border: '1px solid #3f3f46',
                    borderRadius: '8px',
                    color: '#f4f4f5'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Popular Exercises */}
      <div className="card">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
          🎮 Ejercicios Más Jugados
        </h3>
        {popularExercises.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">
            No hay datos de ejercicios
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={popularExercises}>
              <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
              <XAxis
                dataKey="name"
                stroke="#71717a"
                angle={-45}
                textAnchor="end"
                height={100}
              />
              <YAxis stroke="#71717a" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#18181b',
                  border: '1px solid #3f3f46',
                  borderRadius: '8px',
                  color: '#f4f4f5'
                }}
              />
              <Legend />
              <Bar dataKey="plays" fill="#10b981" name="Veces jugado" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <div className="card text-center">
          <div className="text-4xl mb-2">🎯</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {activityData.reduce((sum, d) => sum + d.games, 0)}
          </div>
          <div className="text-gray-600 dark:text-gray-400">Juegos Totales (7 días)</div>
        </div>
        <div className="card text-center">
          <div className="text-4xl mb-2">👥</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {topStudents.length}
          </div>
          <div className="text-gray-600 dark:text-gray-400">Estudiantes Activos</div>
        </div>
        <div className="card text-center">
          <div className="text-4xl mb-2">📖</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {courseStats.length}
          </div>
          <div className="text-gray-600 dark:text-gray-400">Cursos con Actividad</div>
        </div>
      </div>
    </div>
  );
}

export default AnalyticsDashboard;
