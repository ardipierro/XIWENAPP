import logger from '../utils/logger';

import { useState, useEffect } from 'react';
import { PenTool, Edit, Trash2, Copy, Calendar, Download } from 'lucide-react';
import { auth } from '../firebase/config';
import {
  getExcalidrawSessionsByTeacher,
  createExcalidrawSession,
  deleteExcalidrawSession,
  duplicateExcalidrawSession,
  updateExcalidrawSession,
} from '../firebase/excalidraw';
import PageHeader from './common/PageHeader';
import SearchBar from './common/SearchBar';
import ConfirmModal from './ConfirmModal';
import BaseButton from './common/BaseButton';
import { UniversalCard } from './cards';

/**
 * Componente para gestión de pizarras Excalidraw guardadas
 * @param {Object} props
 * @param {Function} props.onOpenSession - Callback para abrir sesión en pizarra
 * @param {Function} props.onCreateNew - Callback para crear nueva pizarra
 * @param {Function} props.onBack - Callback para volver al dashboard
 */
function ExcalidrawManager({ onBack, onOpenSession, onCreateNew }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [newTitle, setNewTitle] = useState('');

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    if (!auth.currentUser) {
      logger.debug('🟡 [ExcalidrawManager] No hay usuario autenticado');
      return;
    }

    logger.debug('🟢 [ExcalidrawManager] Cargando sesiones para usuario:', auth.currentUser.uid);
    setLoading(true);
    try {
      const data = await getExcalidrawSessionsByTeacher(auth.currentUser.uid);
      logger.debug('🟢 [ExcalidrawManager] Sesiones cargadas:', data.length);
      logger.debug('🟢 [ExcalidrawManager] Datos completos:', data);
      setSessions(data);
    } catch (error) {
      logger.error('❌ [ExcalidrawManager] Error loading sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  // Abrir modal de edición
  const handleEdit = (session) => {
    setSelectedSession(session);
    setNewTitle(session.title);
    setShowEditModal(true);
  };

  // Eliminar sesión
  const handleDelete = async () => {
    if (!selectedSession) return;

    try {
      await deleteExcalidrawSession(selectedSession.id);
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
    if (onOpenSession) {
      onOpenSession(session);
    }
  };

  // Guardar título editado
  const handleSaveEdit = async () => {
    if (!newTitle.trim()) {
      alert('Por favor ingresa un título');
      return;
    }

    try {
      await updateExcalidrawSession(selectedSession.id, { title: newTitle.trim() });
      setShowEditModal(false);
      setSelectedSession(null);
      setNewTitle('');
      await loadSessions();
    } catch (error) {
      logger.error('Error actualizando título:', error);
      alert('Error al actualizar el título');
    }
  };

  // Duplicar sesión
  const handleDuplicate = async (sessionId) => {
    try {
      await duplicateExcalidrawSession(sessionId);
      await loadSessions();
    } catch (error) {
      logger.error('Error duplicando sesión:', error);
      alert('Error al duplicar la sesión');
    }
  };

  // Descargar sesión como JSON
  const handleDownload = (session) => {
    const data = JSON.stringify({
      title: session.title,
      elements: session.elements || [],
      appState: session.appState || {},
      files: session.files || {}
    }, null, 2);
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
    const date = typeof timestamp === 'string' ? new Date(timestamp) : new Date(timestamp.seconds * 1000);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Filtrar sesiones por búsqueda
  const filteredSessions = sessions.filter(session =>
    session.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  logger.debug('🔵 [ExcalidrawManager] Renderizando con:', {
    sessionsCount: sessions.length,
    filteredCount: filteredSessions.length,
    loading
  });

  if (loading) {
    return (
      <div className="class-manager">
        {/* Botón Volver */}
        <BaseButton onClick={onBack} variant="ghost" className="mb-4">
          ← Volver a Inicio
        </BaseButton>

        <PageHeader
          icon={PenTool}
          title="Pizarras Excalidraw"
          actionLabel="+ Nueva Pizarra"
          onAction={onCreateNew}
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
      <BaseButton onClick={onBack} variant="ghost" className="mb-4">
        ← Volver a Inicio
      </BaseButton>

      {/* Header */}
      <PageHeader
        icon={PenTool}
        title="Pizarras Excalidraw"
        actionLabel="+ Nueva Pizarra"
        onAction={onCreateNew}
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
          <p>{searchTerm ? 'No se encontraron pizarras' : 'No hay pizarras Excalidraw guardadas aún'}</p>
          {!searchTerm && (
            <BaseButton onClick={onCreateNew} variant="primary">
              Crear primera pizarra
            </BaseButton>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        /* Vista Grid */
        <div className="grid-responsive-cards gap-4">
          {filteredSessions.map((session) => {
            // Parsear elements si es string JSON
            let elements = [];
            try {
              elements = typeof session.elements === 'string'
                ? JSON.parse(session.elements)
                : (session.elements || []);
            } catch (e) {
              logger.error('Error parseando elements:', e);
              elements = [];
            }
            const elementCount = elements.length || 0;
            const lastModified = formatDate(session.updatedAt);

            return (
              <UniversalCard
                key={session.id}
                variant="content"
                size="md"
                icon={PenTool}
                title={session.title}
                description={`${elementCount} ${elementCount === 1 ? 'elemento' : 'elementos'}`}
                badges={[
                  { variant: 'info', children: 'Excalidraw' }
                ]}
                meta={[
                  { icon: <Calendar size={14} />, text: lastModified }
                ]}
                actions={
                  <div className="flex gap-2 w-full">
                    <BaseButton
                      variant="secondary"
                      size="sm"
                      icon={Download}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(session);
                      }}
                      title="Descargar"
                    />
                    <BaseButton
                      variant="secondary"
                      size="sm"
                      icon={Edit}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(session);
                      }}
                      title="Editar título"
                    />
                    <BaseButton
                      variant="secondary"
                      size="sm"
                      icon={Copy}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDuplicate(session.id);
                      }}
                      title="Duplicar"
                    />
                    {/* Botón eliminar movido al footer (usando onDelete prop) */}
                  </div>
                }
                onClick={() => handleOpenSession(session)}
                onDelete={async () => {
                  setSelectedSession(session);
                  setShowConfirmDelete(true);
                }}
                deleteConfirmMessage={`¿Eliminar pizarra "${session.title}"?`}
              />
            );
          })}
        </div>
      ) : (
        /* Vista Lista */
        <div className="flex flex-col gap-3">
          {filteredSessions.map((session) => {
            // Parsear elements si es string JSON
            let elements = [];
            try {
              elements = typeof session.elements === 'string'
                ? JSON.parse(session.elements)
                : (session.elements || []);
            } catch (e) {
              logger.error('Error parseando elements:', e);
              elements = [];
            }
            const elementCount = elements.length || 0;
            const lastModified = formatDate(session.updatedAt);

            return (
              <UniversalCard
                key={session.id}
                variant="content"
                size="sm"
                layout="horizontal"
                icon={PenTool}
                title={session.title}
                description={`${elementCount} ${elementCount === 1 ? 'elemento' : 'elementos'}`}
                badges={[
                  { variant: 'info', children: 'Excalidraw' }
                ]}
                stats={[
                  { icon: Calendar, label: lastModified }
                ]}
                actions={
                  <div className="flex gap-2">
                    <BaseButton
                      variant="ghost"
                      size="sm"
                      icon={Download}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(session);
                      }}
                      title="Descargar"
                    />
                    <BaseButton
                      variant="ghost"
                      size="sm"
                      icon={Edit}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(session);
                      }}
                      title="Editar"
                    />
                    <BaseButton
                      variant="ghost"
                      size="sm"
                      icon={Copy}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDuplicate(session.id);
                      }}
                      title="Duplicar"
                    />
                    {/* Botón eliminar movido al footer (usando onDelete prop) */}
                  </div>
                }
                onClick={() => handleOpenSession(session)}
                onDelete={async () => {
                  setSelectedSession(session);
                  setShowConfirmDelete(true);
                }}
                deleteConfirmMessage={`¿Eliminar pizarra "${session.title}"?`}
              />
            );
          })}
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedSession && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Editar Título</h3>
              <button onClick={() => setShowEditModal(false)} className="modal-close">
                ✕
              </button>
            </div>
            <div className="modal-body">
              <input
                type="text"
                placeholder="Nuevo título"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSaveEdit()}
                autoFocus
                className="input-full"
              />
            </div>
            <div className="modal-footer">
              <BaseButton onClick={() => setShowEditModal(false)} variant="secondary">
                Cancelar
              </BaseButton>
              <BaseButton onClick={handleSaveEdit} variant="primary">
                Guardar
              </BaseButton>
            </div>
          </div>
        </div>
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

export default ExcalidrawManager;
