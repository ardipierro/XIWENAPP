import logger from '../utils/logger';

/**
 * @fileoverview Gestor de pizarras guardadas
 * @module components/WhiteboardManager
 */

import { useState, useEffect } from 'react';
import {
  Presentation,
  Trash2,
  Edit,
  Calendar,
  Download
} from 'lucide-react';
import {
  getUserWhiteboardSessions,
  deleteWhiteboardSession,
  updateWhiteboardSession
} from '../firebase/whiteboard';
import { auth } from '../firebase/config';
import PageHeader from './common/PageHeader';
import SearchBar from './common/SearchBar';
import ConfirmModal from './ConfirmModal';
import WhiteboardAssignmentModal from './WhiteboardAssignmentModal';

/**
 * Componente para gestión de pizarras guardadas
 * @param {Object} props
 * @param {Function} props.onOpenWhiteboard - Callback para abrir pizarra
 * @param {Function} props.onLoadSession - Callback para cargar sesión en pizarra
 * @param {Function} props.onBack - Callback para volver al dashboard
 */
function WhiteboardManager({ onOpenWhiteboard, onLoadSession, onBack, onGoLive }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);

  // Cargar sesiones (se recarga cada vez que el componente se muestra)
  useEffect(() => {
    loadSessions();
  }, []); // Vacío es correcto, pero necesitamos una forma de recargar desde fuera

  const loadSessions = async () => {
    if (!auth.currentUser) {
      logger.debug('🟡 [WhiteboardManager] No hay usuario autenticado');
      return;
    }

    logger.debug('🟢 [WhiteboardManager] Cargando sesiones para usuario:', auth.currentUser.uid);
    setLoading(true);
    try {
      const data = await getUserWhiteboardSessions(auth.currentUser.uid);
      logger.debug('🟢 [WhiteboardManager] Sesiones cargadas:', data.length);
      logger.debug('🟢 [WhiteboardManager] Datos:', data);
      setSessions(data);
    } catch (error) {
      logger.error('❌ [WhiteboardManager] Error loading sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filtrar sesiones por búsqueda
  const filteredSessions = sessions.filter(session =>
    session.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Abrir modal de edición
  const handleEdit = (session) => {
    setSelectedSession(session);
    setShowEditModal(true);
  };

  // Eliminar sesión
  const handleDelete = async () => {
    if (!selectedSession) return;

    try {
      await deleteWhiteboardSession(selectedSession.id);
      await loadSessions();
      setShowConfirmDelete(false);
      setSelectedSession(null);
    } catch (error) {
      logger.error('Error deleting session:', error);
      alert('Error al eliminar la sesión');
    }
  };

  // Abrir sesión en pizarra
  const handleOpenSession = (session) => {
    if (onLoadSession) {
      onLoadSession(session);
    }
    // NO llamar a onOpenWhiteboard() aquí - eso abre una pizarra nueva
  };


  // Descargar sesión como JSON
  const handleDownload = (session) => {
    const data = JSON.stringify(session.slides || []);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${session.title.replace(/\s+/g, '_')}_${new Date().getTime()}.json`;
    a.click();
  };

  // Formatear fecha
  const formatDate = (timestamp) => {
    if (!timestamp) return 'Sin fecha';
    const date = new Date(timestamp.seconds * 1000);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="class-manager">
        {/* Botón Volver */}
        <button onClick={onBack} className="btn btn-ghost mb-4">
          ← Volver a Inicio
        </button>

        <PageHeader
          icon={Presentation}
          title="Pizarras"
          actionLabel="+ Nueva Pizarra"
          onAction={onOpenWhiteboard}
        />
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Cargando pizarras...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="class-manager">
      {/* Botón Volver */}
      <button onClick={onBack} className="btn btn-ghost mb-4">
        ← Volver a Inicio
      </button>

      {/* Header */}
      <PageHeader
        icon={Presentation}
        title="Pizarras"
        actionLabel="+ Nueva Pizarra"
        onAction={onOpenWhiteboard}
      />

      {/* Search Bar con Toggle de Vista integrado */}
      <SearchBar
        value={searchTerm}
        onChange={setSearchTerm}
        placeholder="Buscar pizarra..."
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        className="mb-6"
      />

      {/* Empty State */}
      {filteredSessions.length === 0 ? (
        <div className="empty-state">
          <p>{searchTerm ? 'No se encontraron pizarras' : 'No hay pizarras guardadas aún'}</p>
          {!searchTerm && (
            <button onClick={onOpenWhiteboard} className="btn btn-primary">
              Crear primera pizarra
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        /* Vista Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredSessions.map((session) => {
            const slideCount = session.slides?.length || 0;
            const lastModified = formatDate(session.updatedAt);

            return (
              <div
                key={session.id}
                className="card card-grid-item cursor-pointer hover:shadow-lg transition-all duration-300 flex flex-col overflow-hidden"
                onClick={() => handleOpenSession(session)}
                style={{ padding: 0 }}
              >
                {/* Thumbnail - Mitad superior sin bordes */}
                {session.slides?.[0]?.thumbnail ? (
                  <div className="card-image-large overflow-hidden">
                    <img
                      src={session.slides[0].thumbnail}
                      alt={session.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="card-image-large-placeholder">
                    <Presentation size={48} strokeWidth={1.5} />
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 flex flex-col" style={{ padding: '12px' }}>
                  <h3 className="card-title">{session.title}</h3>
                  <p className="card-description">
                    {slideCount} {slideCount === 1 ? 'diapositiva' : 'diapositivas'}
                  </p>

                  {/* Stats */}
                  <div className="card-stats">
                    <span className="flex items-center gap-1">
                      <Calendar size={14} />
                      {lastModified}
                    </span>
                  </div>

                  {/* Badges */}
                  <div className="card-badges">
                    <span className="badge badge-info">Pizarra</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="card-actions">
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownload(session);
                    }}
                    title="Descargar"
                  >
                    <Download size={16} />
                  </button>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(session);
                    }}
                    title="Editar y asignar"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    className="btn btn-ghost btn-sm text-red-600"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedSession(session);
                      setShowConfirmDelete(true);
                    }}
                    title="Eliminar"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Vista Lista */
        <div className="flex flex-col gap-3">
          {filteredSessions.map((session) => {
            const slideCount = session.slides?.length || 0;
            const lastModified = formatDate(session.updatedAt);

            return (
              <div
                key={session.id}
                className="card card-list cursor-pointer hover:shadow-lg transition-all duration-300"
                onClick={() => handleOpenSession(session)}
              >
                {/* Thumbnail pequeño */}
                <div className="card-image-placeholder-sm">
                  {session.slides?.[0]?.thumbnail ? (
                    <img
                      src={session.slides[0].thumbnail}
                      alt={session.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Presentation size={24} strokeWidth={1.5} />
                  )}
                </div>

                {/* Contenido */}
                <div className="flex-1 min-w-0 p-4">
                  <div className="flex gap-4 items-start">
                    <div className="flex-1">
                      <h3 className="card-title">{session.title}</h3>
                      <p className="card-description">
                        {slideCount} {slideCount === 1 ? 'diapositiva' : 'diapositivas'}
                      </p>

                      {/* Stats */}
                      <div className="card-stats">
                        <span className="flex items-center gap-1">
                          <Calendar size={14} />
                          {lastModified}
                        </span>
                      </div>
                    </div>

                    {/* Badges y Acciones */}
                    <div className="card-badges-list">
                      <span className="badge badge-info">Pizarra</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="card-actions-inline">
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownload(session);
                    }}
                    title="Descargar"
                  >
                    <Download size={16} />
                  </button>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(session);
                    }}
                    title="Editar"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    className="btn btn-ghost btn-sm text-red-600"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedSession(session);
                      setShowConfirmDelete(true);
                    }}
                    title="Eliminar"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit/Assignment Modal */}
      {showEditModal && selectedSession && (
        <WhiteboardAssignmentModal
          session={selectedSession}
          onClose={() => {
            setShowEditModal(false);
            setSelectedSession(null);
            loadSessions(); // Refresh to show updated changes
          }}
          onGoLive={onGoLive}
        />
      )}

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={showConfirmDelete && selectedSession !== null}
        title="Eliminar Pizarra"
        message={selectedSession ? `¿Estás seguro de que deseas eliminar "${selectedSession.title}"? Esta acción no se puede deshacer.` : ''}
        confirmText="Eliminar"
        cancelText="Cancelar"
        isDanger={true}
        onConfirm={handleDelete}
        onCancel={() => {
          setShowConfirmDelete(false);
          setSelectedSession(null);
        }}
      />
    </div>
  );
}

export default WhiteboardManager;
