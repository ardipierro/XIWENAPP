/**
 * @fileoverview Flash Card Manager - Gestión de colecciones de flashcards
 * @module components/FlashCardManager
 */

import { useState, useEffect } from 'react';
import { CreditCard, Plus, Sparkles, Search, Grid3x3, List, Eye, Edit, Trash2, Play, Download, Share2, Award, Trophy, BarChart3 } from 'lucide-react';
import { BaseButton, BaseInput, BaseCard, BaseBadge, CategoryBadge, BaseLoading, BaseAlert, BaseEmptyState, BaseModal, BaseTabs } from './common';
import { CardDeleteButton } from './cards';
import FlashCardGeneratorModal from './FlashCardGeneratorModal';
import FlashCardViewer from './FlashCardViewer';
import FlashCardEditor from './FlashCardEditor';
import FlashCardStatsPanel from './FlashCardStatsPanel';
import ShareCollectionModal from './ShareCollectionModal';
import QuizModal from './QuizModal';
import {
  getAllFlashCardCollections,
  getFlashCardCollectionsByTeacher,
  deleteFlashCardCollection,
  getFlashCardCollectionById
} from '../firebase/flashcards';
import { exportCollection } from '../services/flashcardExportService';
import { shareCollection } from '../services/flashcardSharingService';
import logger from '../utils/logger';

/**
 * FlashCard Manager - Gestión de colecciones de flashcards
 * @param {Object} props
 * @param {Object} props.user - Usuario actual
 */
export function FlashCardManager({ user }) {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [activeTab, setActiveTab] = useState('collections'); // 'collections' | 'stats'

  // Modals
  const [showGenerator, setShowGenerator] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [showViewer, setShowViewer] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(null); // collectionId
  const [showShareModal, setShowShareModal] = useState(null); // collectionId
  const [showQuizModal, setShowQuizModal] = useState(null); // collectionId

  // Selected items
  const [selectedCollectionId, setSelectedCollectionId] = useState(null);
  const [editingCollectionId, setEditingCollectionId] = useState(null);

  // Alerts
  const [successMessage, setSuccessMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  // Cargar colecciones
  useEffect(() => {
    if (user) {
      loadCollections();
    }
  }, [user]);

  const loadCollections = async () => {
    try {
      setLoading(true);

      // Si es admin, cargar todas; si es teacher, solo las suyas
      const result = user.role === 'admin'
        ? await getAllFlashCardCollections()
        : await getFlashCardCollectionsByTeacher(user.uid);

      setCollections(result || []);
      logger.info(`Loaded ${result?.length || 0} flashcard collections`, 'FlashCardManager');
    } catch (err) {
      logger.error('Error loading collections:', err, 'FlashCardManager');
      setErrorMessage('Error al cargar colecciones');
    } finally {
      setLoading(false);
    }
  };

  // Handlers
  const handleCreateManual = () => {
    setEditingCollectionId(null);
    setShowEditor(true);
  };

  const handleGenerateAI = () => {
    setShowGenerator(true);
  };

  const handleViewCollection = (collectionId) => {
    setSelectedCollectionId(collectionId);
    setShowViewer(true);
  };

  const handleEditCollection = (collectionId) => {
    setEditingCollectionId(collectionId);
    setShowEditor(true);
  };

  const handleDeleteCollection = async (collectionId) => {
    if (!confirm('¿Estás seguro de eliminar esta colección?')) return;

    try {
      const result = await deleteFlashCardCollection(collectionId);

      if (result.success) {
        setSuccessMessage('Colección eliminada exitosamente');
        await loadCollections();

        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setErrorMessage(result.error || 'Error al eliminar colección');
        setTimeout(() => setErrorMessage(null), 3000);
      }
    } catch (err) {
      logger.error('Error deleting collection:', err);
      setErrorMessage('Error al eliminar colección');
      setTimeout(() => setErrorMessage(null), 3000);
    }
  };

  const handlePracticeCollection = (collectionId) => {
    setSelectedCollectionId(collectionId);
    setShowViewer(true);
  };

  const handleGeneratorSuccess = (collectionId) => {
    setSuccessMessage('¡Colección generada exitosamente!');
    loadCollections();
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleEditorSave = (collectionId) => {
    setSuccessMessage('Colección guardada exitosamente');
    loadCollections();
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleExport = async (collectionId, format) => {
    try {
      const collection = await getFlashCardCollectionById(collectionId);
      if (!collection) {
        throw new Error('Colección no encontrada');
      }

      const result = exportCollection(collection, format);
      if (result.success) {
        setSuccessMessage(`Colección exportada a ${format.toUpperCase()}`);
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (error) {
      logger.error('Error exporting collection:', error);
      setErrorMessage('Error al exportar colección');
      setTimeout(() => setErrorMessage(null), 3000);
    }
    setShowExportMenu(null);
  };

  const handleShare = async (collectionId, teacherEmail) => {
    try {
      const result = await shareCollection(collectionId, teacherEmail, user);
      if (result.success) {
        setSuccessMessage(`Colección compartida con ${teacherEmail}`);
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      logger.error('Error sharing collection:', error);
      setErrorMessage(error.message || 'Error al compartir colección');
      setTimeout(() => setErrorMessage(null), 3000);
    }
    setShowShareModal(null);
  };

  const handleStartQuiz = (collectionId) => {
    setShowQuizModal(collectionId);
  };

  // Filtrar colecciones por búsqueda
  const filteredCollections = collections.filter(col => {
    if (!searchTerm) return true;
    const lowerSearch = searchTerm.toLowerCase();
    return (
      col.name?.toLowerCase().includes(lowerSearch) ||
      col.description?.toLowerCase().includes(lowerSearch)
    );
  });

  if (loading) {
    return <BaseLoading variant="fullscreen" text="Cargando colecciones..." />;
  }

  return (
    <div className="w-full">
      {/* Header - Simplificado */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <CreditCard size={24} className="text-zinc-700 dark:text-zinc-300" />
          <h1 className="text-xl font-bold text-zinc-900 dark:text-white">
            FlashCards
          </h1>
        </div>
        <div className="flex gap-2">
          <BaseButton
            variant="secondary"
            icon={Plus}
            onClick={handleCreateManual}
            title="Crear colección manual"
            size="md"
          />
          <BaseButton
            variant="primary"
            icon={Sparkles}
            onClick={handleGenerateAI}
            title="Generar con IA"
            size="md"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <BaseTabs
          tabs={[
            { id: 'collections', label: 'Colecciones', icon: CreditCard },
            { id: 'stats', label: 'Estadísticas', icon: BarChart3 }
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
          variant="underline"
          size="md"
        />
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <BaseAlert variant="success" className="mb-6">
          {successMessage}
        </BaseAlert>
      )}

      {errorMessage && (
        <BaseAlert variant="error" className="mb-6">
          {errorMessage}
        </BaseAlert>
      )}

      {/* Stats Panel */}
      {activeTab === 'stats' && (
        <FlashCardStatsPanel user={user} collectionId={null} />
      )}

      {/* Collections Tab */}
      {activeTab === 'collections' && (
        <>
          {/* Filters */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 mb-6">
            <div className="flex-1">
              <BaseInput
                icon={Search}
                placeholder="Buscar colecciones..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <BaseButton
                variant={viewMode === 'grid' ? 'primary' : 'ghost'}
                icon={Grid3x3}
                size="sm"
                onClick={() => setViewMode('grid')}
              />
              <BaseButton
                variant={viewMode === 'list' ? 'primary' : 'ghost'}
                icon={List}
                size="sm"
                onClick={() => setViewMode('list')}
              />
            </div>
          </div>

      {/* Collections Grid/List */}
      {filteredCollections.length === 0 ? (
        <BaseEmptyState
          icon={CreditCard}
          title="No hay colecciones de flashcards"
          description="Crea tu primera colección o genera una automáticamente con IA"
          action={
            <div className="flex gap-3">
              <BaseButton variant="secondary" icon={Plus} onClick={handleCreateManual}>
                Crear Manual
              </BaseButton>
              <BaseButton variant="primary" icon={Sparkles} onClick={handleGenerateAI}>
                Generar con IA
              </BaseButton>
            </div>
          }
        />
      ) : (
        <div className={viewMode === 'grid'
          ? 'grid-responsive-cards gap-4'
          : 'flex flex-col gap-3'}>
          {filteredCollections.map(collection => (
            <BaseCard
              key={collection.id}
              className="group hover:shadow-lg transition-all duration-200"
              image={collection.imageUrl || null}
            >
              <div className="p-4 flex flex-col h-full">
                {/* Badges */}
                <div className="flex flex-wrap gap-2 mb-3">
                  <CategoryBadge
                    type="cefr"
                    value={collection.level}
                    size="sm"
                  />
                  <BaseBadge variant="default" size="sm">
                    {collection.cardCount || collection.cards?.length || 0} tarjetas
                  </BaseBadge>
                  {collection.category && (
                    <BaseBadge variant="default" size="sm">
                      {collection.category}
                    </BaseBadge>
                  )}
                </div>

                {/* Title */}
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2 line-clamp-2">
                  {collection.name}
                </h3>

                {/* Description */}
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4 flex-1 line-clamp-3">
                  {collection.description}
                </p>

                {/* Actions */}
                <div className="flex flex-wrap gap-2 pt-3 border-t border-zinc-200 dark:border-zinc-700">
                  <BaseButton
                    variant="primary"
                    icon={Play}
                    size="sm"
                    onClick={() => handlePracticeCollection(collection.id)}
                  >
                    Practicar
                  </BaseButton>
                  <BaseButton
                    variant="ghost"
                    icon={Trophy}
                    size="sm"
                    onClick={() => handleStartQuiz(collection.id)}
                    title="Hacer Quiz"
                  />
                  <BaseButton
                    variant="ghost"
                    icon={Download}
                    size="sm"
                    onClick={() => setShowExportMenu(collection.id)}
                    title="Exportar"
                  />
                  <BaseButton
                    variant="ghost"
                    icon={Share2}
                    size="sm"
                    onClick={() => setShowShareModal(collection.id)}
                    title="Compartir"
                  />
                  <BaseButton
                    variant="ghost"
                    icon={Edit}
                    size="sm"
                    onClick={() => handleEditCollection(collection.id)}
                    title="Editar"
                  />
                  <CardDeleteButton
                    onDelete={() => handleDeleteCollection(collection.id)}
                    variant="solid"
                    size="sm"
                    confirmMessage={`¿Eliminar colección "${collection.name}"?`}
                  />
                </div>
              </div>
            </BaseCard>
          ))}
        </div>
      )}
        </>
      )}

      {/* Export Menu Modal */}
      {showExportMenu && (
        <BaseModal
          isOpen={true}
          onClose={() => setShowExportMenu(null)}
          title="Exportar Colección"
          size="small"
        >
          <div className="space-y-4">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Selecciona el formato de exportación:
            </p>
            <div className="flex flex-col gap-2">
              <BaseButton
                variant="outline"
                icon={Download}
                onClick={() => handleExport(showExportMenu, 'anki')}
                fullWidth
              >
                Anki (.txt)
              </BaseButton>
              <BaseButton
                variant="outline"
                icon={Download}
                onClick={() => handleExport(showExportMenu, 'quizlet')}
                fullWidth
              >
                Quizlet (.txt)
              </BaseButton>
              <BaseButton
                variant="outline"
                icon={Download}
                onClick={() => handleExport(showExportMenu, 'csv')}
                fullWidth
              >
                CSV (.csv)
              </BaseButton>
              <BaseButton
                variant="outline"
                icon={Download}
                onClick={() => handleExport(showExportMenu, 'json')}
                fullWidth
              >
                JSON (.json)
              </BaseButton>
            </div>
          </div>
        </BaseModal>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <ShareCollectionModal
          isOpen={true}
          onClose={() => setShowShareModal(null)}
          collectionId={showShareModal}
          onShare={handleShare}
        />
      )}

      {/* Quiz Modal */}
      {showQuizModal && (
        <QuizModal
          isOpen={true}
          onClose={() => setShowQuizModal(null)}
          collectionId={showQuizModal}
          user={user}
        />
      )}

      {/* Generator Modal */}
      <FlashCardGeneratorModal
        isOpen={showGenerator}
        onClose={() => setShowGenerator(false)}
        onSuccess={handleGeneratorSuccess}
        user={user}
      />

      {/* Editor Modal */}
      <FlashCardEditor
        isOpen={showEditor}
        onClose={() => setShowEditor(false)}
        onSave={handleEditorSave}
        collectionId={editingCollectionId}
        user={user}
      />

      {/* Viewer Modal */}
      <FlashCardViewer
        isOpen={showViewer}
        onClose={() => setShowViewer(false)}
        collectionId={selectedCollectionId}
        user={user}
      />
    </div>
  );
}

export default FlashCardManager;
