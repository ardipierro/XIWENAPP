/**
 * @fileoverview ShareContentModal - Modal para compartir contenido en sesión colaborativa
 * Refactorizado para usar BaseModal
 * @module components/whiteboard/ShareContentModal
 */

import { Share2, Film, FileText, FileImage } from 'lucide-react';
import { BaseModal, BaseButton, BaseInput, BaseAlert } from '../../common';

/**
 * Modal para compartir contenido (video/PDF/imagen)
 * @param {Object} props
 * @param {boolean} props.show - Si el modal está visible
 * @param {Function} props.onClose - Callback para cerrar modal
 * @param {Function} props.onShare - Callback para compartir contenido
 * @param {string} props.shareContentUrl - URL del contenido a compartir
 * @param {Function} props.setShareContentUrl - Cambiar URL del contenido
 * @param {string} props.shareContentType - Tipo de contenido (video/pdf/image)
 * @param {Function} props.setShareContentType - Cambiar tipo de contenido
 */
function ShareContentModal({
  show,
  onClose,
  onShare,
  shareContentUrl,
  setShareContentUrl,
  shareContentType,
  setShareContentType
}) {
  const placeholderByType = {
    video: 'URL del video (YouTube, Vimeo, MP4)',
    pdf: 'URL del PDF',
    image: 'URL de la imagen'
  };

  return (
    <BaseModal
      isOpen={show}
      onClose={onClose}
      title="Compartir Contenido"
      icon={Share2}
      size="sm"
      footer={
        <div className="flex justify-end gap-3">
          <BaseButton onClick={onClose} variant="secondary">
            Cancelar
          </BaseButton>
          <BaseButton onClick={onShare} variant="primary">
            Compartir
          </BaseButton>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Selector de tipo */}
        <div className="flex gap-2">
          <BaseButton
            variant={shareContentType === 'video' ? 'primary' : 'outline'}
            onClick={() => setShareContentType('video')}
            iconLeft={Film}
            size="sm"
          >
            Video
          </BaseButton>
          <BaseButton
            variant={shareContentType === 'pdf' ? 'primary' : 'outline'}
            onClick={() => setShareContentType('pdf')}
            iconLeft={FileText}
            size="sm"
          >
            PDF
          </BaseButton>
          <BaseButton
            variant={shareContentType === 'image' ? 'primary' : 'outline'}
            onClick={() => setShareContentType('image')}
            iconLeft={FileImage}
            size="sm"
          >
            Imagen
          </BaseButton>
        </div>

        {/* Input de URL */}
        <BaseInput
          type="url"
          value={shareContentUrl}
          onChange={(e) => setShareContentUrl(e.target.value)}
          placeholder={placeholderByType[shareContentType]}
          autoFocus
        />

        {/* Info */}
        <BaseAlert variant="info" size="sm">
          El contenido se sincronizará en tiempo real con todos los participantes.
          {shareContentType === 'video' && ' Solo el presentador puede controlar la reproducción.'}
          {shareContentType === 'pdf' && ' Solo el presentador puede cambiar de página.'}
        </BaseAlert>
      </div>
    </BaseModal>
  );
}

export default ShareContentModal;
