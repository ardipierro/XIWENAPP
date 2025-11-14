/**
 * @fileoverview Panel de Analytics para Contenidos
 * @module components/ContentAnalytics
 */

import { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
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
  TrendingUp,
  Clock,
  Eye,
  CheckCircle2,
  Users,
  BookOpen,
  Calendar,
  Download,
  RefreshCw,
  X
} from 'lucide-react';
import {
  getContentMetrics,
  getTopContents,
  getCourseAnalytics,
  getTeacherAnalytics,
  getAnalyticsByDateRange
} from '../firebase/contentAnalytics';
import { formatTimeSpent } from '../firebase/courseProgress';
import ContentRepository from '../services/ContentRepository';
import logger from '../utils/logger';

/**
 * MetricCard - Tarjeta de métrica individual
 */
function MetricCard({ icon: Icon, label, value, subValue, color = 'blue' }) {
  const colorClasses = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    green: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
    purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
    orange: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400'
  };

  return (
    <div className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">{label}</p>
          <p className="text-2xl font-bold text-zinc-900 dark:text-white">{value}</p>
          {subValue && (
            <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">{subValue}</p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}

/**
 * TopContentsList - Lista de contenidos más populares
 */
function TopContentsList({ contents, allContents }) {
  const getContentTitle = (contentId) => {
    const content = allContents.find(c => c.id === contentId);
    return content?.title || contentId;
  };

  const getContentType = (contentId) => {
    const content = allContents.find(c => c.id === contentId);
    return content?.type || 'unknown';
  };

  const typeColors = {
    course: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
    lesson: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
    reading: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
    video: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
    exercise: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
  };

  return (
    <div className="space-y-2">
      {contents.map((content, index) => (
        <div
          key={content.contentId}
          className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 p-4 flex items-center gap-4"
        >
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-700 flex items-center justify-center font-bold text-zinc-600 dark:text-zinc-400">
            {index + 1}
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-zinc-900 dark:text-white truncate">
              {getContentTitle(content.contentId)}
            </h4>
            <div className="flex items-center gap-3 mt-1">
              <span className={`text-xs px-2 py-0.5 rounded ${typeColors[getContentType(content.contentId)] || 'bg-zinc-100 dark:bg-zinc-700'}`}>
                {getContentType(content.contentId)}
              </span>
              <span className="text-xs text-zinc-500 dark:text-zinc-500">
                {content.views} vistas
              </span>
              <span className="text-xs text-zinc-500 dark:text-zinc-500">
                {content.completionRate}% completado
              </span>
            </div>
          </div>

          <div className="flex-shrink-0 text-right">
            <div className="text-sm font-medium text-zinc-900 dark:text-white">
              {formatTimeSpent(content.avgTimeSpent)}
            </div>
            <div className="text-xs text-zinc-500 dark:text-zinc-500">
              promedio
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * ContentAnalytics - Componente principal de analytics
 */
export default function ContentAnalytics({ contentId = null, courseId = null, teacherId, onClose }) {
  // Estados
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('overview'); // overview | content | course
  const [metrics, setMetrics] = useState(null);
  const [topContents, setTopContents] = useState([]);
  const [allContents, setAllContents] = useState([]);
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 días atrás
    end: new Date()
  });

  /**
   * Carga datos iniciales
   */
  useEffect(() => {
    loadAnalytics();
  }, [contentId, courseId, teacherId, viewMode]);

  /**
   * Carga todos los contenidos para referencias
   */
  useEffect(() => {
    loadAllContents();
  }, []);

  const loadAllContents = async () => {
    try {
      const result = await getAllContent();
      if (result.success) {
        setAllContents(result.data);
      }
    } catch (error) {
      logger.error('Error loading contents', error, 'ContentAnalytics');
    }
  };

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      if (contentId) {
        // Analytics de un contenido específico
        const result = await getContentMetrics(contentId);
        if (result.success) {
          setMetrics(result.data);
        }
      } else if (courseId) {
        // Analytics de un curso
        const result = await getCourseAnalytics(courseId);
        if (result.success) {
          setMetrics(result.data);
        }
      } else {
        // Analytics generales del profesor
        const [teacherResult, topResult] = await Promise.all([
          getTeacherAnalytics(teacherId),
          getTopContents(10)
        ]);

        if (teacherResult.success) {
          setMetrics(teacherResult.data);
        }

        if (topResult.success) {
          setTopContents(topResult.data);
        }
      }
    } catch (error) {
      logger.error('Error loading analytics', error, 'ContentAnalytics');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadAnalytics();
  };

  const handleExport = () => {
    // Exportar datos a CSV
    const csvData = topContents.map(c => ({
      Contenido: allContents.find(ac => ac.id === c.contentId)?.title || c.contentId,
      Vistas: c.views,
      Completados: c.completions,
      'Tasa Completitud': `${c.completionRate}%`,
      'Tiempo Promedio': formatTimeSpent(c.avgTimeSpent),
      'Tiempo Total': formatTimeSpent(c.totalTime)
    }));

    const headers = Object.keys(csvData[0] || {});
    const csv = [
      headers.join(','),
      ...csvData.map(row => headers.map(h => row[h]).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Vista específica de contenido
  if (contentId && metrics) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
            Analytics del Contenido
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700"
            >
              <RefreshCw size={18} />
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700"
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            icon={Eye}
            label="Total de Vistas"
            value={metrics.totalViews}
            color="blue"
          />
          <MetricCard
            icon={CheckCircle2}
            label="Completados"
            value={metrics.totalCompletions}
            subValue={`${metrics.completionRate}% tasa`}
            color="green"
          />
          <MetricCard
            icon={Clock}
            label="Tiempo Promedio"
            value={formatTimeSpent(metrics.avgTimeSpent)}
            color="purple"
          />
          <MetricCard
            icon={Users}
            label="Estudiantes"
            value={metrics.viewerCount}
            color="orange"
          />
        </div>

        {/* Chart */}
        <div className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 p-6">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">
            Resumen de Engagement
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={[
              { name: 'Vistas', value: metrics.totalViews },
              { name: 'Completados', value: metrics.totalCompletions },
              { name: 'Estudiantes', value: metrics.viewerCount }
            ]}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }

  // Vista general del profesor
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
          Analytics General
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="px-3 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 flex items-center gap-2"
          >
            <Download size={16} />
            Exportar
          </button>
          <button
            onClick={handleRefresh}
            className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700"
          >
            <RefreshCw size={18} />
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Overview Metrics */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            icon={BookOpen}
            label="Total Contenidos"
            value={metrics.totalContents}
            color="blue"
          />
          <MetricCard
            icon={Eye}
            label="Total Vistas"
            value={metrics.totalViews}
            color="green"
          />
          <MetricCard
            icon={CheckCircle2}
            label="Tasa Completitud"
            value={`${metrics.avgCompletionRate}%`}
            color="purple"
          />
          <MetricCard
            icon={Users}
            label="Estudiantes Únicos"
            value={metrics.uniqueStudents}
            color="orange"
          />
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Content Type Distribution */}
        {metrics?.contentsByType && (
          <div className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 p-6">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">
              Distribución por Tipo
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={Object.entries(metrics.contentsByType).map(([type, count]) => ({
                    name: type,
                    value: count
                  }))}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {Object.keys(metrics.contentsByType).map((_, index) => (
                    <Cell key={`cell-${index}`} fill={['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444'][index % 5]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Time Stats */}
        {metrics && (
          <div className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 p-6">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">
              Estadísticas de Tiempo
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">Tiempo Total</span>
                  <span className="text-lg font-bold text-zinc-900 dark:text-white">
                    {formatTimeSpent(metrics.totalTimeSpent)}
                  </span>
                </div>
                <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: '100%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">Promedio por Vista</span>
                  <span className="text-lg font-bold text-zinc-900 dark:text-white">
                    {formatTimeSpent(metrics.avgTimePerView)}
                  </span>
                </div>
                <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '75%' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Top Contents */}
      {topContents.length > 0 && (
        <div className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 p-6">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">
            Top 10 Contenidos Más Populares
          </h3>
          <TopContentsList contents={topContents} allContents={allContents} />
        </div>
      )}
    </div>
  );
}
