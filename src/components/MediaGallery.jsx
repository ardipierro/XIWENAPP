/**
 * @fileoverview Media Gallery - View all shared media in a conversation
 * @module components/MediaGallery
 */

import { useState, useEffect } from 'react';
import { X, Download, Image as ImageIcon, File, Search } from 'lucide-react';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import logger from '../utils/logger';

/**
 * Media Gallery Component
 * @param {Object} props
 * @param {string} props.conversationId - Conversation ID
 * @param {Function} props.onClose - Close handler
 * @param {Function} props.onImageClick - Image click handler (for lightbox)
 */
function MediaGallery({ conversationId, onClose, onImageClick }) {
  const [activeTab, setActiveTab] = useState('images');
  const [images, setImages] = useState([]);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadMedia();
  }, [conversationId]);

  /**
   * Load all media from conversation
   */
  const loadMedia = async () => {
    setLoading(true);
    try {
      const messagesRef = collection(db, 'messages');
      const q = query(
        messagesRef,
        where('conversationId', '==', conversationId),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      const imagesList = [];
      const filesList = [];

      snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.attachment && !data.deleted) {
          const attachment = {
            id: doc.id,
            ...data.attachment,
            createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt),
            senderName: data.senderName
          };

          if (data.attachment.type?.startsWith('image/')) {
            imagesList.push(attachment);
          } else {
            filesList.push(attachment);
          }
        }
      });

      setImages(imagesList);
      setFiles(filesList);
      logger.info(`Loaded ${imagesList.length} images and ${filesList.length} files`, 'MediaGallery');
    } catch (error) {
      logger.error('Error loading media', error, 'MediaGallery');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Format file size
   */
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  /**
   * Format date
   */
  const formatDate = (date) => {
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  /**
   * Filter media by search term
   */
  const filterMedia = (mediaList) => {
    if (!searchTerm.trim()) return mediaList;
    const term = searchTerm.toLowerCase();
    return mediaList.filter(item =>
      item.filename?.toLowerCase().includes(term) ||
      item.senderName?.toLowerCase().includes(term)
    );
  };

  const filteredImages = filterMedia(images);
  const filteredFiles = filterMedia(files);

  return (
    <div className="media-gallery-overlay" onClick={onClose}>
      <div className="media-gallery" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="media-gallery-header">
          <h2>Multimedia compartido</h2>
          <button className="media-gallery-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        {/* Search */}
        <div className="media-gallery-search">
          <Search size={16} />
          <input
            type="text"
            placeholder="Buscar archivos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Tabs */}
        <div className="media-gallery-tabs">
          <button
            className={`media-tab ${activeTab === 'images' ? 'active' : ''}`}
            onClick={() => setActiveTab('images')}
          >
            <ImageIcon size={16} />
            Imágenes ({filteredImages.length})
          </button>
          <button
            className={`media-tab ${activeTab === 'files' ? 'active' : ''}`}
            onClick={() => setActiveTab('files')}
          >
            <File size={16} />
            Archivos ({filteredFiles.length})
          </button>
        </div>

        {/* Content */}
        <div className="media-gallery-content">
          {loading ? (
            <div className="media-gallery-loading">
              <div className="spinner"></div>
              <p>Cargando multimedia...</p>
            </div>
          ) : activeTab === 'images' ? (
            filteredImages.length === 0 ? (
              <div className="media-gallery-empty">
                <ImageIcon size={48} />
                <p>No hay imágenes compartidas</p>
              </div>
            ) : (
              <div className="media-gallery-grid">
                {filteredImages.map((image) => (
                  <div
                    key={image.id}
                    className="media-gallery-item"
                    onClick={() => onImageClick({ url: image.url, filename: image.filename })}
                  >
                    <img src={image.url} alt={image.filename} />
                    <div className="media-item-overlay">
                      <span className="media-item-name">{image.filename}</span>
                      <span className="media-item-date">{formatDate(image.createdAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            filteredFiles.length === 0 ? (
              <div className="media-gallery-empty">
                <File size={48} />
                <p>No hay archivos compartidos</p>
              </div>
            ) : (
              <div className="media-gallery-files">
                {filteredFiles.map((file) => (
                  <a
                    key={file.id}
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="media-file-item"
                  >
                    <div className="media-file-icon">
                      <File size={32} />
                    </div>
                    <div className="media-file-info">
                      <span className="media-file-name">{file.filename}</span>
                      <div className="media-file-meta">
                        <span>{formatFileSize(file.size)}</span>
                        <span>•</span>
                        <span>{formatDate(file.createdAt)}</span>
                        <span>•</span>
                        <span>{file.senderName}</span>
                      </div>
                    </div>
                    <div className="media-file-download">
                      <Download size={20} />
                    </div>
                  </a>
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}

export default MediaGallery;
