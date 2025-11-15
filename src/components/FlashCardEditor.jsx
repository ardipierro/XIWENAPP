/**
 * @fileoverview FlashCard Editor - Editor manual de colecciones
 * @module components/FlashCardEditor
 */

import { useState, useEffect } from 'react';
import { Plus, Trash2, Save, X, Image as ImageIcon, Upload } from 'lucide-react';
import { BaseButton, BaseInput, BaseSelect, BaseModal, BaseAlert, BaseCard } from './common';
import { createFlashCardCollection, updateFlashCardCollection, getFlashCardCollectionById } from '../firebase/flashcards';
import { uploadFlashCardImage, deleteFlashCardImage, compressImage } from '../services/flashcardImageService';
import logger from '../utils/logger';
import './FlashCardEditor.css';

const LEVELS = [
  { value: 'A1', label: 'A1 - Principiante' },
  { value: 'A2', label: 'A2 - Básico' },
  { value: 'B1', label: 'B1 - Intermedio' },
  { value: 'B2', label: 'B2 - Intermedio Alto' },
  { value: 'C1', label: 'C1 - Avanzado' },
  { value: 'C2', label: 'C2 - Maestría' }
];

const CATEGORIES = [
  { value: 'vocabulary', label: 'Vocabulario' },
  { value: 'expressions', label: 'Expresiones' },
  { value: 'idioms', label: 'Modismos' },
  { value: 'phrases', label: 'Frases Útiles' }
];

/**
 * FlashCard Editor
 * @param {Object} props
 * @param {boolean} props.isOpen - Si el editor está abierto
 * @param {Function} props.onClose - Callback al cerrar
 * @param {Function} props.onSave - Callback al guardar
 * @param {string} props.collectionId - ID de colección a editar (null para crear nueva)
 * @param {Object} props.user - Usuario actual
 */
export function FlashCardEditor({ isOpen, onClose, onSave, collectionId, user }) {
  const [collection, setCollection] = useState({
    name: '',
    description: '',
    level: 'A2',
    category: 'vocabulary',
    cards: []
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(new Set());

  useEffect(() => {
    if (isOpen) {
      if (collectionId) {
        loadCollection();
      } else {
        resetForm();
      }
    }
  }, [isOpen, collectionId]);

  const loadCollection = async () => {
    try {
      setLoading(true);
      const data = await getFlashCardCollectionById(collectionId);
      if (data) {
        setCollection({
          name: data.name,
          description: data.description,
          level: data.level,
          category: data.category,
          cards: data.cards || []
        });
      }
    } catch (err) {
      logger.error('Error loading collection:', err);
      setError('Error al cargar la colección');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setCollection({
      name: '',
      description: '',
      level: 'A2',
      category: 'vocabulary',
      cards: []
    });
    setError(null);
    setSuccess(false);
  };

  const handleAddCard = () => {
    const newCard = {
      id: `card-${Date.now()}`,
      spanish: '',
      translation: '',
      hint: '',
      context: '',
      imageUrl: '',
      audioUrl: '',
      difficulty: 1
    };

    setCollection({
      ...collection,
      cards: [...collection.cards, newCard]
    });
  };

  const handleUpdateCard = (index, field, value) => {
    const updatedCards = [...collection.cards];
    updatedCards[index] = {
      ...updatedCards[index],
      [field]: value
    };

    setCollection({
      ...collection,
      cards: updatedCards
    });
  };

  const handleDeleteCard = (index) => {
    if (confirm('¿Estás seguro de eliminar esta tarjeta?')) {
      const updatedCards = collection.cards.filter((_, i) => i !== index);
      setCollection({
        ...collection,
        cards: updatedCards
      });
    }
  };

  const handleSave = async () => {
    try {
      // Validación
      if (!collection.name.trim()) {
        setError('El nombre de la colección es requerido');
        return;
      }

      if (collection.cards.length === 0) {
        setError('Debes agregar al menos una tarjeta');
        return;
      }

      // Validar tarjetas
      const invalidCards = collection.cards.filter(
        card => !card.spanish.trim() || !card.translation.trim()
      );

      if (invalidCards.length > 0) {
        setError('Todas las tarjetas deben tener texto en español y traducción');
        return;
      }

      setSaving(true);
      setError(null);

      const data = {
        ...collection,
        createdBy: user.uid
      };

      let result;
      if (collectionId) {
        // Actualizar
        result = await updateFlashCardCollection(collectionId, data);
      } else {
        // Crear
        result = await createFlashCardCollection(data);
      }

      if (!result.success) {
        throw new Error(result.error);
      }

      setSuccess(true);
      logger.info('Collection saved successfully');

      setTimeout(() => {
        onSave && onSave(result.id || collectionId);
        handleClose();
      }, 1500);

    } catch (err) {
      logger.error('Error saving collection:', err);
      setError(err.message || 'Error al guardar la colección');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (!saving) {
      resetForm();
      onClose();
    }
  };

  const handleImageUpload = async (index, event) => {
    const file = event.target.files[0];
    if (!file) return;

    const cardId = collection.cards[index].id;

    try {
      // Mark as uploading
      setUploadingImages(prev => new Set(prev).add(index));
      setError(null);

      // Compress image before upload
      logger.info('Compressing image...');
      const compressedBlob = await compressImage(file, 1024, 0.8);
      const compressedFile = new File([compressedBlob], file.name, { type: 'image/jpeg' });

      // Upload to Firebase Storage
      logger.info('Uploading image to Firebase Storage...');
      const result = await uploadFlashCardImage(
        compressedFile,
        collectionId || 'temp',
        cardId
      );

      if (!result.success) {
        throw new Error(result.error);
      }

      // Update card with Firebase URL
      handleUpdateCard(index, 'imageUrl', result.url);
      logger.info('Image uploaded successfully:', result.url);

    } catch (err) {
      logger.error('Error uploading image:', err);
      setError(`Error al subir imagen: ${err.message}`);
    } finally {
      // Remove from uploading set
      setUploadingImages(prev => {
        const next = new Set(prev);
        next.delete(index);
        return next;
      });
    }
  };

  const handleRemoveImage = async (index) => {
    const card = collection.cards[index];
    if (!card.imageUrl) return;

    try {
      // Delete from Firebase Storage if it's a Firebase URL
      if (card.imageUrl.includes('firebase')) {
        await deleteFlashCardImage(card.imageUrl);
        logger.info('Image deleted from Firebase Storage');
      }

      // Clear imageUrl in card
      handleUpdateCard(index, 'imageUrl', '');

    } catch (err) {
      logger.error('Error deleting image:', err);
      // Still clear the URL even if deletion fails
      handleUpdateCard(index, 'imageUrl', '');
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title={collectionId ? 'Editar Colección' : 'Nueva Colección'}
      size="xlarge"
      className="flashcard-editor-modal"
    >
      <div className="flashcard-editor">
        {loading ? (
          <div className="flashcard-editor__loading">
            <p>Cargando...</p>
          </div>
        ) : (
          <>
            {/* Collection Info */}
            <div className="flashcard-editor__info">
              <div className="flashcard-editor__field">
                <label>Nombre de la Colección *</label>
                <BaseInput
                  value={collection.name}
                  onChange={(e) => setCollection({ ...collection, name: e.target.value })}
                  placeholder="Ej: Expresiones Cotidianas A2"
                />
              </div>

              <div className="flashcard-editor__field">
                <label>Descripción</label>
                <BaseInput
                  value={collection.description}
                  onChange={(e) => setCollection({ ...collection, description: e.target.value })}
                  placeholder="Ej: Frases útiles para el día a día"
                />
              </div>

              <div className="flashcard-editor__row">
                <div className="flashcard-editor__field">
                  <label>Nivel CEFR</label>
                  <BaseSelect
                    value={collection.level}
                    onChange={(e) => setCollection({ ...collection, level: e.target.value })}
                    options={LEVELS}
                  />
                </div>

                <div className="flashcard-editor__field">
                  <label>Categoría</label>
                  <BaseSelect
                    value={collection.category}
                    onChange={(e) => setCollection({ ...collection, category: e.target.value })}
                    options={CATEGORIES}
                  />
                </div>
              </div>
            </div>

            {/* Cards List */}
            <div className="flashcard-editor__cards">
              <div className="flashcard-editor__cards-header">
                <h3>Tarjetas ({collection.cards.length})</h3>
                <BaseButton variant="primary" icon={Plus} size="sm" onClick={handleAddCard}>
                  Agregar Tarjeta
                </BaseButton>
              </div>

              {collection.cards.length === 0 ? (
                <div className="flashcard-editor__empty">
                  <p>No hay tarjetas aún. Haz click en "Agregar Tarjeta" para empezar.</p>
                </div>
              ) : (
                <div className="flashcard-editor__cards-list">
                  {collection.cards.map((card, index) => (
                    <BaseCard key={card.id} className="flashcard-editor__card">
                      <div className="flashcard-editor__card-header">
                        <span className="flashcard-editor__card-number">
                          Tarjeta #{index + 1}
                        </span>
                        <BaseButton
                          variant="ghost"
                          icon={Trash2}
                          size="sm"
                          onClick={() => handleDeleteCard(index)}
                        />
                      </div>

                      <div className="flashcard-editor__card-fields">
                        {/* Spanish */}
                        <div className="flashcard-editor__field">
                          <label>Español *</label>
                          <BaseInput
                            value={card.spanish}
                            onChange={(e) => handleUpdateCard(index, 'spanish', e.target.value)}
                            placeholder="Ej: ¿Cómo estás?"
                          />
                        </div>

                        {/* Translation */}
                        <div className="flashcard-editor__field">
                          <label>Traducción *</label>
                          <BaseInput
                            value={card.translation}
                            onChange={(e) => handleUpdateCard(index, 'translation', e.target.value)}
                            placeholder="Ej: How are you?"
                          />
                        </div>

                        {/* Hint */}
                        <div className="flashcard-editor__field">
                          <label>Pista</label>
                          <BaseInput
                            value={card.hint}
                            onChange={(e) => handleUpdateCard(index, 'hint', e.target.value)}
                            placeholder="Ej: Pregunta informal de saludo"
                          />
                        </div>

                        {/* Context */}
                        <div className="flashcard-editor__field">
                          <label>Contexto</label>
                          <BaseInput
                            value={card.context}
                            onChange={(e) => handleUpdateCard(index, 'context', e.target.value)}
                            placeholder="Ej: Encuentro casual con amigos"
                          />
                        </div>

                        {/* Image Upload */}
                        <div className="flashcard-editor__field">
                          <label>Imagen</label>
                          <div className="flashcard-editor__image-upload">
                            {uploadingImages.has(index) ? (
                              <div className="flashcard-editor__image-button">
                                <Upload size={18} className="animate-pulse" />
                                Subiendo imagen...
                              </div>
                            ) : card.imageUrl ? (
                              <div className="flashcard-editor__image-preview">
                                <img src={card.imageUrl} alt="Preview" />
                                <button
                                  className="flashcard-editor__image-remove"
                                  onClick={() => handleRemoveImage(index)}
                                  type="button"
                                >
                                  <X size={16} />
                                </button>
                              </div>
                            ) : (
                              <label className="flashcard-editor__image-button">
                                <Upload size={18} />
                                Subir Imagen
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => handleImageUpload(index, e)}
                                  style={{ display: 'none' }}
                                />
                              </label>
                            )}
                          </div>
                        </div>

                        {/* Difficulty */}
                        <div className="flashcard-editor__field">
                          <label>Dificultad</label>
                          <BaseSelect
                            value={card.difficulty}
                            onChange={(e) => handleUpdateCard(index, 'difficulty', parseInt(e.target.value))}
                            options={[
                              { value: 1, label: '⭐ Fácil' },
                              { value: 2, label: '⭐⭐ Medio' },
                              { value: 3, label: '⭐⭐⭐ Difícil' }
                            ]}
                          />
                        </div>
                      </div>
                    </BaseCard>
                  ))}
                </div>
              )}
            </div>

            {/* Alerts */}
            {error && (
              <BaseAlert variant="error" className="mt-4">
                {error}
              </BaseAlert>
            )}

            {success && (
              <BaseAlert variant="success" className="mt-4">
                ¡Colección guardada exitosamente!
              </BaseAlert>
            )}

            {/* Actions */}
            <div className="flashcard-editor__actions">
              <BaseButton variant="ghost" onClick={handleClose} disabled={saving}>
                Cancelar
              </BaseButton>
              <BaseButton
                variant="primary"
                icon={Save}
                onClick={handleSave}
                disabled={saving || collection.cards.length === 0}
              >
                {saving ? 'Guardando...' : (collectionId ? 'Actualizar' : 'Crear Colección')}
              </BaseButton>
            </div>
          </>
        )}
      </div>
    </BaseModal>
  );
}

export default FlashCardEditor;
