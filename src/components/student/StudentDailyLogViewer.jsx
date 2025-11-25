/**
 * @fileoverview Visualizador de Diarios de Clase para Estudiantes
 * Lista de diarios asignados al estudiante (solo lectura)
 * @module components/student/StudentDailyLogViewer
 */

import { useState, useEffect } from 'react';
import {
  BookOpen,
  Calendar,
  Clock,
  Users,
  Play,
  CheckCircle,
  Archive
} from 'lucide-react';
import logger from '../../utils/logger';
import { getStudentLogs, LOG_STATUS } from '../../firebase/classDailyLogs';
import {
  BaseLoading,
  BaseEmptyState,
} from '../common';
import PageHeader from '../common/PageHeader';
import SearchBar from '../common/SearchBar';
import { UniversalCard, CardGrid } from '../cards';
import ClassDailyLog from '../ClassDailyLog';

function StudentDailyLogViewer({ user }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeLogId, setActiveLogId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid');

  useEffect(() => {
    loadLogs();
  }, [user]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      setError(null);

      const logsData = await getStudentLogs(user.uid);
      setLogs(logsData || []);

      logger.info(`Cargados ${logsData?.length || 0} diarios asignados`, 'StudentDailyLogViewer');
    } catch (err) {
      logger.error('Error cargando diarios:', err, 'StudentDailyLogViewer');
      setError('Error al cargar diarios');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenLog = (logId) => {
    setActiveLogId(logId);
  };

  const handleCloseLog = () => {
    setActiveLogId(null);
  };

  const filteredLogs = logs.filter(log => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      log.name?.toLowerCase().includes(searchLower) ||
      log.teacherName?.toLowerCase().includes(searchLower) ||
      log.courseName?.toLowerCase().includes(searchLower)
    );
  });

  // Si hay un diario activo, mostrarlo
  if (activeLogId) {
    return (
      <ClassDailyLog
        logId={activeLogId}
        user={user}
        onBack={handleCloseLog}
      />
    );
  }

  // Vista principal de lista de diarios
  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        icon={BookOpen}
        title="Diarios"
      />

      {/* Search Bar */}
      <SearchBar
        value={searchTerm}
        onChange={setSearchTerm}
        placeholder="Buscar por nombre, profesor o curso..."
        onViewModeChange={setViewMode}
        currentViewMode={viewMode}
      />

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <BaseLoading size="lg" text="Cargando diarios..." />
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredLogs.length === 0 && (
        <BaseEmptyState
          icon={BookOpen}
          title={searchTerm ? 'No se encontraron diarios' : 'No hay diarios disponibles'}
          description={searchTerm ? 'Intenta con otro término de búsqueda' : 'Cuando tu profesor comparta un diario, aparecerá aquí'}
        />
      )}

      {/* Logs Grid */}
      {!loading && !error && filteredLogs.length > 0 && (
        viewMode === 'grid' ? (
        <CardGrid columnsType="default" gap="gap-4">
          {filteredLogs.map((log) => (
            <LogCard
              key={log.id}
              log={log}
              viewMode={viewMode}
              onClick={() => handleOpenLog(log.id)}
            />
          ))}
        </CardGrid>
        ) : (
        <div className="flex flex-col gap-4">
          {filteredLogs.map((log) => (
            <LogCard
              key={log.id}
              log={log}
              viewMode={viewMode}
              onClick={() => handleOpenLog(log.id)}
            />
          ))}
        </div>
        )
      )}
    </div>
  );
}

/**
 * LogCard - Tarjeta individual de diario
 */
function LogCard({ log, viewMode, onClick }) {
  // Ícono según estado
  const StatusIcon = log.status === LOG_STATUS.ACTIVE ? Play :
                     log.status === LOG_STATUS.ENDED ? CheckCircle :
                     Archive;

  // Badge de estado
  const statusBadge = {
    [LOG_STATUS.ACTIVE]: { text: 'En Curso', variant: 'success' },
    [LOG_STATUS.ENDED]: { text: 'Finalizado', variant: 'info' },
    [LOG_STATUS.ARCHIVED]: { text: 'Archivado', variant: 'default' }
  }[log.status] || { text: 'Desconocido', variant: 'default' };

  // Fecha formateada
  const createdDate = log.createdAt?.toDate?.();
  const formattedDate = createdDate ? new Date(createdDate).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }) : 'Sin fecha';

  // Stats
  const stats = [
    {
      icon: Users,
      label: 'Contenidos',
      value: log.entries?.length || 0,
      variant: 'indigo'
    },
    {
      icon: Calendar,
      label: 'Creado',
      value: formattedDate,
      variant: 'gray'
    }
  ];

  // Badges
  const badges = [
    {
      text: statusBadge.text,
      variant: statusBadge.variant
    }
  ];

  // Agregar curso si existe
  if (log.courseName) {
    badges.push({
      text: log.courseName,
      variant: 'blue'
    });
  }

  return (
    <UniversalCard
      variant="content"
      size="md"
      viewMode={viewMode}
      icon={BookOpen}
      title={log.name || 'Sin nombre'}
      description={log.description || `Por ${log.teacherName}`}
      badges={badges}
      stats={stats}
      onClick={onClick}
      hover={true}
    />
  );
}

export default StudentDailyLogViewer;
