/**
 * @fileoverview Flash Card Manager - Gestión de colecciones de flashcards
 * @module components/FlashCardManager
 */

import { useState, useEffect } from 'react';
import { CreditCard, Plus, Sparkles, Search, Grid3x3, List, Eye, Edit, Trash2, Play } from 'lucide-react';
import { BaseButton, BaseInput, BaseCard, BaseBadge, BaseLoading, BaseAlert, BaseEmptyState } from './common';
import logger from '../utils/logger';
import './FlashCardManager.css';

/**
 * FlashCard Manager - Gestión de colecciones de flashcards
 * @param {Object} props
 * @param {Object} props.user - Usuario actual
 */
export function FlashCardManager({ user }) {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [showGenerator, setShowGenerator] = useState(false);

  // Cargar colecciones (TODO: integrar con Firebase)
  useEffect(() => {
    loadCollections();
  }, [user]);

  const loadCollections = async () => {
    try {
      setLoading(true);
      // TODO: Cargar desde Firebase
      // const result = await getFlashCardCollections(user.uid);
      // setCollections(result);

      // Mock data de ejemplo
      setCollections([
        {
          id: '1',
          name: 'Expresiones Cotidianas A2',
          description: 'Frases útiles para el día a día',
          level: 'A2',
          cardCount: 24,
          imageUrl: null,
          createdAt: new Date(),
        },
        {
          id: '2',
          name: 'Modismos Argentinos',
          description: 'Expresiones típicas de Argentina',
          level: 'B1',
          cardCount: 36,
          imageUrl: null,
          createdAt: new Date(),
        },
      ]);

      logger.info('FlashCard collections loaded', 'FlashCardManager');
    } catch (err) {
      logger.error('Error loading collections:', err, 'FlashCardManager');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateManual = () => {
    logger.info('Create manual collection clicked', 'FlashCardManager');
    // TODO: Abrir modal para crear colección manual
  };

  const handleGenerateAI = () => {
    logger.info('Generate with AI clicked', 'FlashCardManager');
    setShowGenerator(true);
    // TODO: Abrir modal del generador automático
  };

  const handleViewCollection = (collection) => {
    logger.info('View collection:', collection.id, 'FlashCardManager');
    // TODO: Abrir visor de flashcards
  };

  const handleEditCollection = (collection) => {
    logger.info('Edit collection:', collection.id, 'FlashCardManager');
    // TODO: Abrir editor de colección
  };

  const handleDeleteCollection = async (collectionId) => {
    if (!confirm('¿Estás seguro de eliminar esta colección?')) return;

    logger.info('Delete collection:', collectionId, 'FlashCardManager');
    // TODO: Eliminar de Firebase
  };

  const handlePracticeCollection = (collection) => {
    logger.info('Practice collection:', collection.id, 'FlashCardManager');
    // TODO: Abrir modo de práctica
  };

  // Filtrar colecciones por búsqueda
  const filteredCollections = collections.filter(col => {
    if (!searchTerm) return true;
    const lowerSearch = searchTerm.toLowerCase();
    return (
      col.name.toLowerCase().includes(lowerSearch) ||
      col.description.toLowerCase().includes(lowerSearch)
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
            <BaseButton variant="primary" icon={Sparkles} onClick={handleGenerateAI}>
              Generar con IA
            </BaseButton>
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
                    {collection.cardCount} tarjetas
                  </BaseBadge>
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
                    onClick={() => handlePracticeCollection(collection)}
                  >
                    Practicar
                  </BaseButton>
                  <BaseButton
                    variant="ghost"
                    icon={Eye}
                    size="sm"
                    onClick={() => handleViewCollection(collection)}
                  />
                  <BaseButton
                    variant="ghost"
                    icon={Edit}
                    size="sm"
                    onClick={() => handleEditCollection(collection)}
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

      {/* Generator Modal (placeholder) */}
      {showGenerator && (
        <div className="flashcard-generator-placeholder">
          <BaseCard className="p-8">
            <h2 className="text-xl font-bold mb-4">Generador de FlashCards con IA</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Esta funcionalidad será implementada próximamente.
            </p>
            <BaseButton onClick={() => setShowGenerator(false)}>
              Cerrar
            </BaseButton>
          </BaseCard>
        </div>
      )}
    </div>
  );
}

export default FlashCardManager;
