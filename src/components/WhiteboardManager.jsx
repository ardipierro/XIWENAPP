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
  Download,
  ArrowLeft
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
import BaseButton from './common/BaseButton';
import { UniversalCard } from './cards';
import { BaseBadge } from './common';

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
        <BaseButton
          variant="ghost"
          onClick={onBack}
          icon={ArrowLeft}
          className="mb-4"
        >
          Volver a Inicio
        </BaseButton>

        <PageHeader
          icon={Presentation}
          title="Pizarras"
          actionLabel="Nueva pizarra"
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
      <BaseButton
        variant="ghost"
        onClick={onBack}
        icon={ArrowLeft}
        className="mb-4"
      >
        Volver a Inicio
      </BaseButton>

      {/* Header */}
      <PageHeader
        icon={Presentation}
        title="Pizarras"
        actionLabel="Nueva pizarra"
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
            <BaseButton
              variant="primary"
              onClick={onOpenWhiteboard}
            >
              Crear primera pizarra
            </BaseButton>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        /* Vista Grid */
        <div className="grid-responsive-cards gap-4">
          {filteredSessions.map((session) => {
            const slideCount = session.slides?.length || 0;
            const lastModified = formatDate(session.updatedAt);

            return (
              <UniversalCard
                key={session.id}
                variant="content"
                size="md"
                image={session.slides?.[0]?.thumbnail}
                icon={Presentation}
                title={session.title}
                description={`${slideCount} ${slideCount === 1 ? 'diapositiva' : 'diapositivas'}`}
                badges={[
                  { variant: 'info', children: 'Pizarra' }
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
                      title="Editar"
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
            const slideCount = session.slides?.length || 0;
            const lastModified = formatDate(session.updatedAt);

            return (
              <UniversalCard
                key={session.id}
                variant="content"
                size="sm"
                layout="horizontal"
                image={session.slides?.[0]?.thumbnail}
                icon={Presentation}
                title={session.title}
                description={`${slideCount} ${slideCount === 1 ? 'diapositiva' : 'diapositivas'}`}
                badges={[
                  { variant: 'info', children: 'Pizarra' }
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
