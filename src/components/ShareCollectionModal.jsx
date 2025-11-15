/**
 * @fileoverview Share Collection Modal - Modal para compartir colecciones
 * @module components/ShareCollectionModal
 */

import { useState } from 'react';
import { Share2, Mail, Send, X } from 'lucide-react';
import { BaseButton, BaseInput, BaseModal, BaseAlert } from './common';
import logger from '../utils/logger';

/**
 * Share Collection Modal
 * @param {Object} props
 * @param {boolean} props.isOpen - Si el modal está abierto
 * @param {Function} props.onClose - Callback al cerrar
 * @param {string} props.collectionId - ID de la colección
 * @param {Function} props.onShare - Callback al compartir (collectionId, email)
 */
export function ShareCollectionModal({ isOpen, onClose, collectionId, onShare }) {
  const [teacherEmail, setTeacherEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!teacherEmail) {
      setError('Por favor ingresa un email');
      return;
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(teacherEmail)) {
      setError('Por favor ingresa un email válido');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await onShare(collectionId, teacherEmail);
      setTeacherEmail('');
      onClose();
    } catch (err) {
      logger.error('Error sharing collection:', err);
      setError(err.message || 'Error al compartir colección');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setTeacherEmail('');
      setError(null);
      onClose();
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Compartir Colección"
      size="medium"
    >
      <form onSubmit={handleSubmit} className="share-collection-modal">
        <div className="share-collection-modal__icon">
          <Share2 size={48} style={{ color: '#3b82f6' }} />
        </div>

        <p className="share-collection-modal__description">
          Comparte esta colección con otro profesor. Ingresa su email y recibirá una invitación para acceder a la colección.
        </p>

        {error && (
          <BaseAlert variant="error">
            {error}
          </BaseAlert>
        )}

        <div className="share-collection-modal__field">
          <label htmlFor="teacher-email">Email del Profesor</label>
          <BaseInput
            id="teacher-email"
            type="email"
            icon={Mail}
            placeholder="profesor@ejemplo.com"
            value={teacherEmail}
            onChange={(e) => setTeacherEmail(e.target.value)}
            disabled={loading}
            required
          />
        </div>

        <div className="share-collection-modal__actions">
          <BaseButton
            type="button"
            variant="ghost"
            onClick={handleClose}
            disabled={loading}
          >
            Cancelar
          </BaseButton>
          <BaseButton
            type="submit"
            variant="primary"
            icon={Send}
            loading={loading}
          >
            Compartir
          </BaseButton>
        </div>
      </form>

      <style>{`
        .share-collection-modal {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .share-collection-modal__icon {
          display: flex;
          justify-content: center;
          padding: 1rem 0;
        }

        .share-collection-modal__description {
          text-align: center;
          color: var(--color-text-secondary);
          line-height: 1.6;
          margin: 0;
        }

        .share-collection-modal__field {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .share-collection-modal__field label {
          font-weight: 500;
          color: var(--color-text-primary);
        }

        .share-collection-modal__actions {
          display: flex;
          gap: 0.75rem;
          justify-content: flex-end;
          padding-top: 1rem;
        }

        .dark .share-collection-modal__field label {
          color: var(--dark-text-primary);
        }

        .dark .share-collection-modal__description {
          color: var(--dark-text-secondary);
        }
      `}</style>
    </BaseModal>
  );
}

export default ShareCollectionModal;
