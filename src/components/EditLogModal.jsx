/**
 * @fileoverview Modal para editar Diario de Clase
 * Permite editar nombre y gestionar alumnos asignados
 * @module components/EditLogModal
 */

import { useState, useEffect } from 'react';
import { X, Users, Check, Search } from 'lucide-react';
import { BaseButton, BaseInput, BaseLoading } from './common';
import { getStudentsByTeacher } from '../firebase/users';
import { updateLog } from '../firebase/classDailyLogs';
import logger from '../utils/logger';

function EditLogModal({ isOpen, onClose, log, teacherId, onSave }) {
  const [formData, setFormData] = useState({
    name: '',
    assignedStudents: []
  });
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState(null);

  // Cargar datos del log cuando se abre
  useEffect(() => {
    if (isOpen && log) {
      setFormData({
        name: log.name || '',
        assignedStudents: log.assignedStudents || []
      });
      setSearchTerm('');
      setError(null);
      loadStudents();
    }
  }, [isOpen, log]);

  const loadStudents = async () => {
    try {
      setLoadingStudents(true);
      const studentsData = await getStudentsByTeacher(teacherId);
      setStudents(studentsData || []);
    } catch (err) {
      logger.error('Error cargando estudiantes:', err);
      setError('Error al cargar estudiantes');
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleToggleStudent = (studentId) => {
    setFormData(prev => {
      const isAssigned = prev.assignedStudents.includes(studentId);
      return {
        ...prev,
        assignedStudents: isAssigned
          ? prev.assignedStudents.filter(id => id !== studentId)
          : [...prev.assignedStudents, studentId]
      };
    });
  };

  const handleSelectAll = () => {
    const filteredIds = filteredStudents.map(s => s.id || s.uid);
    const allSelected = filteredIds.every(id => formData.assignedStudents.includes(id));

    if (allSelected) {
      // Deseleccionar todos los filtrados
      setFormData(prev => ({
        ...prev,
        assignedStudents: prev.assignedStudents.filter(id => !filteredIds.includes(id))
      }));
    } else {
      // Seleccionar todos los filtrados
      setFormData(prev => ({
        ...prev,
        assignedStudents: [...new Set([...prev.assignedStudents, ...filteredIds])]
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setError('El nombre es obligatorio');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      await updateLog(log.id, {
        name: formData.name.trim(),
        assignedStudents: formData.assignedStudents,
        updatedAt: Date.now()
      });

      logger.info('Diario actualizado:', log.id);

      if (onSave) {
        onSave({
          ...log,
          name: formData.name.trim(),
          assignedStudents: formData.assignedStudents
        });
      }

      onClose();
    } catch (err) {
      logger.error('Error guardando diario:', err);
      setError('Error al guardar cambios');
    } finally {
      setSaving(false);
    }
  };

  // Filtrar estudiantes por búsqueda
  const filteredStudents = students.filter(student => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    const name = (student.displayName || student.name || '').toLowerCase();
    const email = (student.email || '').toLowerCase();
    return name.includes(search) || email.includes(search);
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Editar Diario de Clase
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Error */}
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            )}

            {/* Nombre del diario */}
            <BaseInput
              label="Nombre del diario"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
              placeholder="Ej: Clase de Español - Unidad 5"
            />

            {/* Sección de estudiantes */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  <Users size={16} />
                  Estudiantes asignados ({formData.assignedStudents.length})
                </label>
                {filteredStudents.length > 0 && (
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {filteredStudents.every(s => formData.assignedStudents.includes(s.id || s.uid))
                      ? 'Deseleccionar todos'
                      : 'Seleccionar todos'}
                  </button>
                )}
              </div>

              {/* Búsqueda */}
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar estudiantes..."
                  className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Lista de estudiantes */}
              <div className="border border-gray-200 dark:border-gray-600 rounded-lg max-h-60 overflow-y-auto">
                {loadingStudents ? (
                  <div className="p-4 flex justify-center">
                    <BaseLoading size="sm" text="Cargando..." />
                  </div>
                ) : filteredStudents.length === 0 ? (
                  <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
                    {searchTerm ? 'No se encontraron estudiantes' : 'No hay estudiantes disponibles'}
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100 dark:divide-gray-700">
                    {filteredStudents.map(student => {
                      const studentId = student.id || student.uid;
                      const isSelected = formData.assignedStudents.includes(studentId);

                      return (
                        <button
                          key={studentId}
                          type="button"
                          onClick={() => handleToggleStudent(studentId)}
                          className={`
                            w-full flex items-center gap-3 p-3 text-left transition-colors
                            ${isSelected
                              ? 'bg-blue-50 dark:bg-blue-900/20'
                              : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'}
                          `}
                        >
                          <div className={`
                            w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0
                            ${isSelected
                              ? 'bg-blue-600 border-blue-600'
                              : 'border-gray-300 dark:border-gray-500'}
                          `}>
                            {isSelected && <Check size={14} className="text-white" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {student.displayName || student.name || 'Sin nombre'}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                              {student.email}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            <BaseButton
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={saving}
            >
              Cancelar
            </BaseButton>
            <BaseButton
              type="submit"
              variant="primary"
              disabled={saving}
            >
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </BaseButton>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditLogModal;
