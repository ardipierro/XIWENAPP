/**
 * @fileoverview Flash Card Manager - Gestión de colecciones de flashcards
 * @module components/FlashCardManager
 */

import { useState, useEffect } from 'react';
import { CreditCard, Plus, Sparkles, Search, Grid3x3, List, Eye, Edit, Trash2, Play } from 'lucide-react';
import { BaseButton, BaseInput, BaseCard, BaseBadge, BaseLoading, BaseAlert, BaseEmptyState } from './common';
import FlashCardGeneratorModal from './FlashCardGeneratorModal';
import FlashCardViewer from './FlashCardViewer';
import FlashCardEditor from './FlashCardEditor';
import {
  getAllFlashCardCollections,
  getFlashCardCollectionsByTeacher,
  deleteFlashCardCollection
} from '../firebase/flashcards';
import logger from '../utils/logger';
import './FlashCardManager.css';

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

  // Modals
  const [showGenerator, setShowGenerator] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [showViewer, setShowViewer] = useState(false);

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
    <div className="flashcard-manager">
      {/* Header */}
      <div className="flashcard-manager__header">
        <div className="flashcard-manager__header-text">
          <h1 className="flashcard-manager__title">
            <CreditCard size={28} className="flashcard-manager__title-icon" />
            Colecciones de FlashCards
          </h1>
          <p className="flashcard-manager__subtitle">
            Crea y gestiona tarjetas de vocabulario y expresiones
          </p>
        </div>
        <div className="flashcard-manager__header-actions">
          <BaseButton
            variant="secondary"
            icon={Plus}
            onClick={handleCreateManual}
          >
            Crear Colección
          </BaseButton>
          <BaseButton
            variant="primary"
            icon={Sparkles}
            onClick={handleGenerateAI}
          >
            Generar con IA
          </BaseButton>
        </div>
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <BaseAlert variant="success" className="mb-4">
          {successMessage}
        </BaseAlert>
      )}

      {errorMessage && (
        <BaseAlert variant="error" className="mb-4">
          {errorMessage}
        </BaseAlert>
      )}

      {/* Filters */}
      <div className="flashcard-manager__filters">
        <div className="flashcard-manager__search">
          <BaseInput
            icon={Search}
            placeholder="Buscar colecciones..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flashcard-manager__view-toggle">
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
        <div className={`flashcard-manager__collections flashcard-manager__collections--${viewMode}`}>
          {filteredCollections.map(collection => (
            <BaseCard
              key={collection.id}
              className="flashcard-collection-card"
              image={collection.imageUrl || null}
            >
              <div className="flashcard-collection-card__content">
                {/* Badges */}
                <div className="flashcard-collection-card__badges">
                  <BaseBadge variant="info" size="sm">
                    {collection.level}
                  </BaseBadge>
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
                <h3 className="flashcard-collection-card__title">
                  {collection.name}
                </h3>

                {/* Description */}
                <p className="flashcard-collection-card__description">
                  {collection.description}
                </p>

                {/* Actions */}
                <div className="flashcard-collection-card__actions">
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
                    icon={Eye}
                    size="sm"
                    onClick={() => handleViewCollection(collection.id)}
                  />
                  <BaseButton
                    variant="ghost"
                    icon={Edit}
                    size="sm"
                    onClick={() => handleEditCollection(collection.id)}
                  />
                  <BaseButton
                    variant="ghost"
                    icon={Trash2}
                    size="sm"
                    onClick={() => handleDeleteCollection(collection.id)}
                  />
                </div>
              </div>
            </BaseCard>
          ))}
        </div>
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
      />
    </div>
  );
}

export default FlashCardManager;
