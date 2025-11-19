/**
 * @fileoverview ShareContentModal - Modal para compartir contenido en sesión colaborativa
 * Componente extraído de Whiteboard.jsx para mejorar mantenibilidad
 * @module components/whiteboard/ShareContentModal
 */

import BaseButton from '../../common/BaseButton';
import { Film, FileText, FileImage } from 'lucide-react';

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
  if (!show) return null;

  return (
    <div className="whiteboard-modal-overlay" onClick={onClose}>
      <div className="whiteboard-modal" onClick={(e) => e.stopPropagation()}>
        <h3 className="whiteboard-modal-title">Compartir Contenido</h3>

        <div className="share-content-type-selector">
          <BaseButton
            variant={shareContentType === 'video' ? 'primary' : 'outline'}
            onClick={() => setShareContentType('video')}
            icon={Film}
          >
            Video
          </BaseButton>
          <BaseButton
            variant={shareContentType === 'pdf' ? 'primary' : 'outline'}
            onClick={() => setShareContentType('pdf')}
            icon={FileText}
          >
            PDF
          </BaseButton>
          <BaseButton
            variant={shareContentType === 'image' ? 'primary' : 'outline'}
            onClick={() => setShareContentType('image')}
            icon={FileImage}
          >
            Imagen
          </BaseButton>
        </div>

        <input
          type="url"
          value={shareContentUrl}
          onChange={(e) => setShareContentUrl(e.target.value)}
          placeholder={`URL del ${shareContentType === 'video' ? 'video (YouTube, Vimeo, MP4)' : shareContentType === 'pdf' ? 'PDF' : 'imagen'}`}
          className="whiteboard-modal-input"
          autoFocus
        />

        <div className="share-content-info">
          <p>💡 El contenido se sincronizará en tiempo real con todos los participantes</p>
          {shareContentType === 'video' && (
            <p>📹 Solo el presentador puede controlar la reproducción</p>
          )}
          {shareContentType === 'pdf' && (
            <p>📄 Solo el presentador puede cambiar de página</p>
          )}
        </div>

        <div className="whiteboard-modal-actions">
          <BaseButton onClick={onClose} variant="secondary">
            Cancelar
          </BaseButton>
          <BaseButton onClick={onShare} variant="primary">
            Compartir
          </BaseButton>
        </div>
      </div>
    </div>
  );
}

export default ShareContentModal;
