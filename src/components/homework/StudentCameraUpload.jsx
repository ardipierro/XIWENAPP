/**
 * @fileoverview Student Camera Upload - Camera capture for homework submission
 * @module components/homework/StudentCameraUpload
 *
 * Allows students to take photos of their homework or upload images
 * for teacher review and AI correction.
 */

import { useState, useRef, useCallback } from 'react';
import {
  Camera,
  Upload,
  X,
  RotateCcw,
  Check,
  Image as ImageIcon,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { BaseButton, BaseModal, BaseAlert } from '../common';
import { uploadImage } from '../../firebase/storage';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';
import logger from '../../utils/logger';

// Max file size: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Allowed file types
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];

/**
 * Compress image to reduce file size
 * @param {File} file - Original file
 * @param {number} maxWidth - Max width in pixels
 * @param {number} quality - JPEG quality (0-1)
 * @returns {Promise<Blob>} Compressed image blob
 */
async function compressImage(file, maxWidth = 1920, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Scale down if needed
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => resolve(blob),
          'image/jpeg',
          quality
        );
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * StudentCameraUpload Component
 * @param {Object} props
 * @param {string} props.studentId - Student user ID
 * @param {string} props.studentName - Student display name
 * @param {string} props.teacherId - Teacher user ID
 * @param {string} props.assignmentId - Optional assignment ID
 * @param {string} props.assignmentTitle - Optional assignment title
 * @param {Function} props.onSuccess - Callback on successful upload
 * @param {Function} props.onClose - Close modal callback
 */
export default function StudentCameraUpload({
  studentId,
  studentName,
  teacherId,
  assignmentId = null,
  assignmentTitle = '',
  onSuccess,
  onClose
}) {
  const [mode, setMode] = useState('select'); // select | camera | preview | uploading
  const [preview, setPreview] = useState(null);
  const [file, setFile] = useState(null);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  /**
   * Handle file selection (from gallery)
   */
  const handleFileSelect = useCallback((event) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    setError(null);

    // Validate file type
    if (!ALLOWED_TYPES.includes(selectedFile.type)) {
      setError('Formato no soportado. Usa JPG, PNG o WebP.');
      return;
    }

    // Validate file size
    if (selectedFile.size > MAX_FILE_SIZE) {
      setError('La imagen es muy grande. Máximo 5MB.');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target.result);
      setFile(selectedFile);
      setMode('preview');
    };
    reader.readAsDataURL(selectedFile);
  }, []);

  /**
   * Handle camera capture
   */
  const handleCameraCapture = useCallback((event) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    setError(null);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target.result);
      setFile(selectedFile);
      setMode('preview');
    };
    reader.readAsDataURL(selectedFile);
  }, []);

  /**
   * Reset to selection mode
   */
  const handleRetake = () => {
    setPreview(null);
    setFile(null);
    setError(null);
    setMode('select');
  };

  /**
   * Upload the image and create homework review
   */
  const handleUpload = async () => {
    if (!file || !studentId || !teacherId) {
      setError('Faltan datos requeridos');
      return;
    }

    setUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      // Compress image if needed
      setUploadProgress(10);
      let fileToUpload = file;
      if (file.size > 1024 * 1024) { // Compress if > 1MB
        const compressed = await compressImage(file);
        fileToUpload = new File([compressed], file.name, { type: 'image/jpeg' });
      }
      setUploadProgress(30);

      // Upload to Firebase Storage
      const timestamp = Date.now();
      const path = `homework/${teacherId}/${studentId}/${timestamp}_${file.name}`;

      const uploadResult = await uploadImage(fileToUpload, path);
      if (!uploadResult.success) {
        throw new Error(uploadResult.error || 'Error al subir imagen');
      }
      setUploadProgress(60);

      // Create homework review document
      const reviewData = {
        studentId,
        studentName: studentName || 'Estudiante',
        teacherId,
        assignmentId: assignmentId || null,
        assignmentTitle: assignmentTitle || 'Tarea sin título',
        imageUrl: uploadResult.url,
        storagePath: path,
        status: 'processing', // Will trigger Cloud Function
        submittedAt: serverTimestamp(),
        submittedBy: 'student', // Mark as student submission
        source: 'camera_upload'
      };

      const docRef = await addDoc(collection(db, 'homework_reviews'), reviewData);
      setUploadProgress(100);

      logger.info(`Student homework uploaded: ${docRef.id}`, 'StudentCameraUpload');

      // Success callback
      if (onSuccess) {
        onSuccess({
          reviewId: docRef.id,
          imageUrl: uploadResult.url,
          ...reviewData
        });
      }

      // Close modal after short delay
      setTimeout(() => {
        onClose?.();
      }, 1000);

    } catch (err) {
      logger.error('Error uploading homework', 'StudentCameraUpload', err);
      setError(err.message || 'Error al subir la tarea');
      setUploading(false);
    }
  };

  return (
    <BaseModal
      isOpen={true}
      title="Subir Tarea"
      onClose={onClose}
      size="md"
    >
      <div className="space-y-4">
        {/* Error message */}
        {error && (
          <BaseAlert variant="danger" icon={AlertCircle}>
            {error}
          </BaseAlert>
        )}

        {/* Assignment info */}
        {assignmentTitle && (
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              <span className="font-medium">Tarea:</span> {assignmentTitle}
            </p>
          </div>
        )}

        {/* Mode: Select (initial) */}
        {mode === 'select' && (
          <div className="space-y-4">
            <p className="text-sm text-zinc-600 dark:text-zinc-400 text-center">
              Toma una foto de tu tarea o selecciona una imagen
            </p>

            <div className="grid grid-cols-2 gap-4">
              {/* Camera button */}
              <button
                onClick={() => cameraInputRef.current?.click()}
                className="flex flex-col items-center justify-center gap-3 p-6 rounded-xl border-2 border-dashed border-zinc-300 dark:border-zinc-600 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
              >
                <div className="w-14 h-14 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Camera className="w-7 h-7 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Tomar Foto
                </span>
              </button>

              {/* Gallery button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center gap-3 p-6 rounded-xl border-2 border-dashed border-zinc-300 dark:border-zinc-600 hover:border-green-400 dark:hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
              >
                <div className="w-14 h-14 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <ImageIcon className="w-7 h-7 text-green-600 dark:text-green-400" />
                </div>
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Galería
                </span>
              </button>
            </div>

            {/* Hidden inputs */}
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleCameraCapture}
              className="hidden"
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileSelect}
              className="hidden"
            />

            <p className="text-xs text-zinc-500 dark:text-zinc-400 text-center">
              Formatos: JPG, PNG, WebP • Máximo 5MB
            </p>
          </div>
        )}

        {/* Mode: Preview */}
        {mode === 'preview' && preview && (
          <div className="space-y-4">
            {/* Image preview */}
            <div className="relative rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800">
              <img
                src={preview}
                alt="Vista previa"
                className="w-full h-auto max-h-[400px] object-contain"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <BaseButton
                variant="secondary"
                icon={RotateCcw}
                onClick={handleRetake}
                disabled={uploading}
                className="flex-1"
              >
                Volver a tomar
              </BaseButton>
              <BaseButton
                variant="primary"
                icon={uploading ? Loader2 : Check}
                onClick={handleUpload}
                disabled={uploading}
                className="flex-1"
              >
                {uploading ? 'Subiendo...' : 'Enviar'}
              </BaseButton>
            </div>

            {/* Upload progress */}
            {uploading && (
              <div className="space-y-2">
                <div className="h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-xs text-center text-zinc-500 dark:text-zinc-400">
                  {uploadProgress < 30 && 'Preparando imagen...'}
                  {uploadProgress >= 30 && uploadProgress < 60 && 'Subiendo...'}
                  {uploadProgress >= 60 && uploadProgress < 100 && 'Guardando...'}
                  {uploadProgress >= 100 && '¡Listo!'}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </BaseModal>
  );
}
