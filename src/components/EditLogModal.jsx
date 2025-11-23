/**
 * @fileoverview Modal para editar Diario de Clase
 * Permite editar nombre y gestionar alumnos asignados
 * @module components/EditLogModal
 *
 * ✅ Refactored to use BaseModal following DESIGN_SYSTEM.md guidelines
 */

import { useState, useEffect } from 'react';
import { Users, Check, Search, Edit3 } from 'lucide-react';
import { BaseModal, BaseButton, BaseInput, BaseLoading, BaseAlert } from './common';
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

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Editar Diario de Clase"
      icon={Edit3}
      size="md"
      loading={saving}
      footer={
        <>
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
            loading={saving}
            onClick={handleSubmit}
          >
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </BaseButton>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Error */}
        {error && (
          <BaseAlert variant="danger" dismissible onDismiss={() => setError(null)}>
            {error}
          </BaseAlert>
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
            <label
              className="flex items-center gap-2 text-sm font-medium"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              <Users size={16} />
              Estudiantes asignados ({formData.assignedStudents.length})
            </label>
            {filteredStudents.length > 0 && (
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-xs hover:underline"
                style={{ color: 'var(--color-accent)' }}
              >
                {filteredStudents.every(s => formData.assignedStudents.includes(s.id || s.uid))
                  ? 'Deseleccionar todos'
                  : 'Seleccionar todos'}
              </button>
            )}
          </div>

          {/* Búsqueda */}
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--color-text-muted)' }}
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar estudiantes..."
              className="w-full pl-9 pr-4 py-2 text-sm rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              style={{
                background: 'var(--color-bg-tertiary)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-primary)'
              }}
            />
          </div>

          {/* Lista de estudiantes */}
          <div
            className="rounded-lg max-h-60 overflow-y-auto"
            style={{ border: '1px solid var(--color-border)' }}
          >
            {loadingStudents ? (
              <div className="p-4 flex justify-center">
                <BaseLoading size="sm" text="Cargando..." />
              </div>
            ) : filteredStudents.length === 0 ? (
              <div
                className="p-4 text-center text-sm"
                style={{ color: 'var(--color-text-muted)' }}
              >
                {searchTerm ? 'No se encontraron estudiantes' : 'No hay estudiantes disponibles'}
              </div>
            ) : (
              <div>
                {filteredStudents.map(student => {
                  const studentId = student.id || student.uid;
                  const isSelected = formData.assignedStudents.includes(studentId);

                  return (
                    <button
                      key={studentId}
                      type="button"
                      onClick={() => handleToggleStudent(studentId)}
                      className={`w-full flex items-center gap-3 p-3 text-left transition-colors hover:bg-opacity-80 ${
                        isSelected ? 'bg-blue-50 dark:bg-blue-900/30' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                      }`}
                      style={{
                        borderBottom: '1px solid var(--color-border)'
                      }}
                    >
                      <div
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                          isSelected
                            ? 'bg-blue-500 border-blue-500'
                            : 'bg-transparent border-gray-300 dark:border-gray-600'
                        }`}
                      >
                        {isSelected && <Check size={14} className="text-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-sm font-medium truncate ${
                            isSelected ? 'text-blue-700 dark:text-blue-300' : ''
                          }`}
                          style={{ color: isSelected ? undefined : 'var(--color-text-primary)' }}
                        >
                          {student.displayName || student.name || 'Sin nombre'}
                        </p>
                        <p
                          className="text-xs truncate"
                          style={{ color: 'var(--color-text-muted)' }}
                        >
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
      </form>
    </BaseModal>
  );
}

export default EditLogModal;
