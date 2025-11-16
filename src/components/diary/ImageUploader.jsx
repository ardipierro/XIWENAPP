import React, { useRef, useState } from 'react';
import { Image, Upload, Link2, X } from 'lucide-react';
import { uploadImage } from '../../firebase/storage';

/**
 * ImageUploader - Componente para subir imágenes al editor
 *
 * @param {Function} onImageInsert - Callback cuando se inserta una imagen (recibe URL)
 * @param {string} userId - ID del usuario para organizar en Storage
 */
export function ImageUploader({ onImageInsert, userId }) {
  const fileInputRef = useRef(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Handle file upload
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar que sea imagen
    if (!file.type.startsWith('image/')) {
      alert('❌ Solo se permiten archivos de imagen');
      return;
    }

    // Validar tamaño (máx 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('❌ La imagen no puede superar 5MB');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Subir a Firebase Storage
      const path = `diary-images/${userId}/${Date.now()}-${file.name}`;
      const result = await uploadImage(file, path);

      if (result.success) {
        onImageInsert(result.url);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('❌ Error al subir la imagen: ' + error.message);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Handle URL input
  const handleUrlSubmit = () => {
    if (!urlInput.trim()) return;

    // Validar que sea una URL válida
    try {
      new URL(urlInput);
      onImageInsert(urlInput);
      setUrlInput('');
      setShowUrlInput(false);
    } catch {
      alert('❌ URL inválida');
    }
  };

  // Handle paste
  const handlePaste = async (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (const item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          const fakeEvent = { target: { files: [file] } };
          await handleFileChange(fakeEvent);
        }
        break;
      }
    }
  };

  // Agregar listener de paste al montar
  React.useEffect(() => {
    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, []);

  return (
    <div className="image-uploader flex items-center gap-2">
      {/* Botón subir desde archivo */}
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        className="flex items-center gap-2 px-3 py-2 rounded-lg
                 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200
                 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors
                 border-2 border-gray-300 dark:border-gray-600
                 disabled:opacity-50 disabled:cursor-not-allowed"
        title="Subir imagen desde archivo"
      >
        {isUploading ? (
          <>
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-semibold">{uploadProgress}%</span>
          </>
        ) : (
          <>
            <Upload size={16} />
            <span className="text-sm font-semibold">Subir</span>
          </>
        )}
      </button>

      {/* Input de archivo (oculto) */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Botón insertar desde URL */}
      <button
        type="button"
        onClick={() => setShowUrlInput(!showUrlInput)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg
                 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200
                 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors
                 border-2 border-gray-300 dark:border-gray-600"
        title="Insertar imagen desde URL"
      >
        <Link2 size={16} />
        <span className="text-sm font-semibold">URL</span>
      </button>

      {/* Input de URL */}
      {showUrlInput && (
        <div className="flex items-center gap-2 flex-1">
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleUrlSubmit()}
            placeholder="https://ejemplo.com/imagen.jpg"
            className="flex-1 px-3 py-2 rounded-lg border-2 border-gray-300 dark:border-gray-600
                     bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                     focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          />
          <button
            onClick={handleUrlSubmit}
            className="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg
                     font-semibold transition-colors"
          >
            Insertar
          </button>
          <button
            onClick={() => {
              setShowUrlInput(false);
              setUrlInput('');
            }}
            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Info */}
      <div className="text-xs text-gray-500 dark:text-gray-400">
        💡 También puedes pegar imágenes con Ctrl+V
      </div>
    </div>
  );
}

export default ImageUploader;
