/**
 * @fileoverview Manual Homework Upload - Teacher uploads homework for students
 * @module components/homework/ManualHomeworkUpload
 */

import { useState, useEffect } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { BaseButton, BaseAlert, BaseLoading, BaseSelect } from '../common';
import { getStudentsByTeacher, getAllUsers } from '../../firebase/users';
import { createHomeworkReview, REVIEW_STATUS } from '../../firebase/homework_reviews';
import { uploadImage } from '../../firebase/storage';
import logger from '../../utils/logger';

/**
 * Manual Homework Upload Component
 * Allows teachers/admins to upload homework images for students manually
 *
 * @param {Object} props
 * @param {string} props.teacherId - Current teacher ID
 * @param {string} props.userRole - Current user role (admin/teacher)
 * @param {function} props.onSuccess - Callback when upload succeeds
 * @param {function} props.onCancel - Callback when cancelled
 */
export default function ManualHomeworkUpload({ teacherId, userRole, onSuccess, onCancel }) {
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  // Load students on mount
  useEffect(() => {
    loadStudents();
  }, [teacherId, userRole]);

  const loadStudents = async () => {
    try {
      setLoading(true);
      let studentsList = [];

      // Admin can see ALL students, Teacher only sees their own
      if (userRole === 'admin') {
        const allUsers = await getAllUsers({ role: 'student', activeOnly: true });
        studentsList = allUsers;
        logger.info(`[ADMIN] Loaded ${studentsList.length} students (all active)`, 'ManualHomeworkUpload');
      } else {
        studentsList = await getStudentsByTeacher(teacherId);
        logger.info(`[TEACHER] Loaded ${studentsList.length} students for teacher ${teacherId}`, 'ManualHomeworkUpload');
      }

      setStudents(studentsList);
    } catch (err) {
      logger.error('Error loading students', 'ManualHomeworkUpload', err);
      setError('Error al cargar la lista de estudiantes');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Por favor selecciona un archivo de imagen');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('La imagen es demasiado grande (máximo 5MB)');
      return;
    }

    setSelectedFile(file);
    setError(null);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      // Create a synthetic event to reuse handleFileSelect
      handleFileSelect({ target: { files: [file] } });
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleSubmit = async () => {
    if (!selectedFile) {
      setError('Por favor selecciona una imagen');
      return;
    }

    try {
      setUploading(true);
      setError(null);

      const selectedStudent = students.find(s => s.id === selectedStudentId);

      // Upload image to Firebase Storage
      logger.info('Uploading homework image...', 'ManualHomeworkUpload');
      const timestamp = Date.now();

      // If no student selected, store in 'unassigned' folder
      const studentFolder = selectedStudentId || 'unassigned';
      const storagePath = `homework/${teacherId}/${studentFolder}/${timestamp}_${selectedFile.name}`;

      const uploadResult = await uploadImage(selectedFile, storagePath);

      if (!uploadResult.success) {
        throw new Error(uploadResult.error || 'Error al subir la imagen');
      }

      logger.info('Image uploaded successfully', 'ManualHomeworkUpload');

      // Create homework review record
      const reviewData = {
        studentId: selectedStudentId || null,
        studentName: selectedStudent?.name || selectedStudent?.email || 'Sin asignar',
        teacherId: teacherId,
        imageUrl: uploadResult.url,
        filename: selectedFile.name,
        imageSize: selectedFile.size,
        status: REVIEW_STATUS.PROCESSING, // Manual uploads will be analyzed by AI automatically
        isManualUpload: true, // Flag to distinguish manual uploads
        uploadedBy: teacherId,
        isFreeCorrection: false,
        needsStudentAssignment: !selectedStudentId, // Flag to indicate if student needs to be assigned later
        // These will be populated by the Cloud Function after AI analysis
        aiSuggestions: [],
        detailedCorrections: [],
        errorSummary: { total: 0 },
        overallFeedback: '',
        suggestedGrade: 0
      };

      const result = await createHomeworkReview(reviewData);

      if (!result.success) {
        throw new Error(result.error || 'Error al crear la corrección');
      }

      logger.info(`Created homework review: ${result.id}`, 'ManualHomeworkUpload');

      // Success!
      onSuccess?.();

    } catch (err) {
      logger.error('Error uploading manual homework', 'ManualHomeworkUpload', err);
      setError(err.message || 'Error al subir la tarea');
    } finally {
      setUploading(false);
    }
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <BaseLoading variant="spinner" size="lg" text="Cargando estudiantes..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <BaseAlert variant="danger" onClose={() => setError(null)}>
          {error}
        </BaseAlert>
      )}

      {/* Student Selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Estudiante (opcional)
        </label>
        <select
          value={selectedStudentId}
          onChange={(e) => setSelectedStudentId(e.target.value)}
          disabled={uploading}
          className="input w-full"
        >
          <option value="">Sin asignar (asignar después)</option>
          {students.length > 0 ? (
            students.map(student => (
              <option key={student.id} value={student.id}>
                {student.name || student.email}
              </option>
            ))
          ) : (
            <option value="" disabled>No hay estudiantes disponibles</option>
          )}
        </select>
        {!selectedStudentId && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Puedes asignar el estudiante más tarde al revisar la corrección
          </p>
        )}
      </div>

      {/* Image Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Imagen de la Tarea
        </label>

        {!selectedFile ? (
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center hover:border-blue-400 dark:hover:border-blue-500 transition-colors cursor-pointer"
            onClick={() => document.getElementById('file-input').click()}
          >
            <Upload className="mx-auto mb-4 text-gray-400" size={48} />
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Arrastra una imagen aquí o haz click para seleccionar
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500">
              JPG, PNG • Máximo 5MB
            </p>
            <input
              id="file-input"
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              disabled={uploading}
              className="hidden"
            />
          </div>
        ) : (
          <div className="space-y-3">
            {/* Preview */}
            <div className="relative rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
              <img
                src={previewUrl}
                alt="Vista previa"
                className="w-full max-h-96 object-contain bg-gray-50 dark:bg-gray-900"
              />
              <button
                onClick={handleClearFile}
                disabled={uploading}
                className="absolute top-2 right-2 p-2 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            {/* File Info */}
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <ImageIcon size={16} />
              <span>{selectedFile.name}</span>
              <span className="text-gray-400">•</span>
              <span>{(selectedFile.size / 1024).toFixed(1)} KB</span>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <BaseButton
          variant="outline"
          onClick={onCancel}
          disabled={uploading}
        >
          Cancelar
        </BaseButton>
        <BaseButton
          variant="primary"
          onClick={handleSubmit}
          disabled={!selectedFile || uploading}
          loading={uploading}
          fullWidth
        >
          <Upload size={18} />
          {uploading ? 'Subiendo...' : 'Enviar a Corrección'}
        </BaseButton>
      </div>
    </div>
  );
}
