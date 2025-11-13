/**
 * @fileoverview Modal para crear clases instantáneas con Google Meet
 * @module components/InstantMeetModal
 */

import { useState, useEffect } from 'react';
import { Video, Zap, Users, ExternalLink, Check } from 'lucide-react';
import {
  BaseModal,
  BaseButton,
  BaseInput,
  BaseAlert
} from './common';
import logger from '../utils/logger';

/**
 * Modal para crear clase instantánea con Google Meet
 */
function InstantMeetModal({ isOpen, onClose, onCreateSession, teacherId, teacherName, students = [], groups = [] }) {
  const [meetLink, setMeetLink] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [assignmentMode, setAssignmentMode] = useState('students'); // 'students' | 'groups'

  useEffect(() => {
    if (isOpen) {
      // Limpiar formulario al abrir
      setMeetLink('');
      setError(null);
      setSelectedStudents([]);
      setSelectedGroups([]);
    }
  }, [isOpen]);

  const handleCreate = async () => {
    try {
      setCreating(true);
      setError(null);

      // Validar que haya al menos un estudiante o grupo seleccionado
      if (selectedStudents.length === 0 && selectedGroups.length === 0) {
        setError('⚠️ Debes seleccionar al menos un estudiante o grupo para la clase');
        setCreating(false);
        return;
      }

      // Validar link de Meet si se proporciona
      if (meetLink && !isValidMeetLink(meetLink)) {
        setError('❌ El link de Google Meet no es válido. Debe empezar con https://meet.google.com/');
        setCreating(false);
        return;
      }

      // Advertencia si no hay link de Meet
      if (!meetLink || meetLink.trim() === '') {
        const confirmed = window.confirm(
          '⚠️ NO has pegado un link de Google Meet.\n\n' +
          'Sin link de Meet:\n' +
          '• Los estudiantes NO podrán unirse a Google Meet\n' +
          '• Se intentará usar LiveKit (puede no funcionar correctamente)\n\n' +
          '¿Estás seguro de continuar SIN link de Google Meet?'
        );

        if (!confirmed) {
          setCreating(false);
          return;
        }
      }

      // Crear clase instantánea
      logger.info('Creating instant Meet session with assignments...');
      await onCreateSession({
        teacherId,
        teacherName,
        meetLink: meetLink.trim(),
        assignedStudents: selectedStudents,
        assignedGroups: selectedGroups
      });

      // Cerrar modal
      onClose();
    } catch (err) {
      logger.error('Error creating instant Meet session:', err);
      setError(`❌ Error al crear la clase: ${err.message}`);
    } finally {
      setCreating(false);
    }
  };

  const toggleStudent = (studentId) => {
    setSelectedStudents(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const toggleGroup = (groupId) => {
    setSelectedGroups(prev =>
      prev.includes(groupId)
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  const selectAllStudents = () => {
    setSelectedStudents(students.map(s => s.id));
  };

  const clearAllStudents = () => {
    setSelectedStudents([]);
  };

  const selectAllGroups = () => {
    setSelectedGroups(groups.map(g => g.id));
  };

  const clearAllGroups = () => {
    setSelectedGroups([]);
  };

  const isValidMeetLink = (link) => {
    return link.startsWith('https://meet.google.com/');
  };

  const openGoogleMeet = () => {
    window.open('https://meet.google.com/new', '_blank');
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Iniciar Clase Instantánea"
      icon={Zap}
      size="md"
      footer={
        <>
          <BaseButton
            variant="secondary"
            onClick={onClose}
            disabled={creating}
          >
            Cancelar
          </BaseButton>
          <BaseButton
            variant="primary"
            icon={Video}
            onClick={handleCreate}
            loading={creating}
          >
            {creating ? 'Creando...' : 'Crear e Iniciar Ahora'}
          </BaseButton>
        </>
      }
    >
      <div className="space-y-6">
        {/* Info Alert */}
        <BaseAlert variant="info">
          <div className="space-y-2">
            <p className="font-semibold">📋 Flujo completo en 3 pasos:</p>
            <div className="text-sm space-y-1">
              <p><strong>1️⃣ Crear link de Meet:</strong> Click en botón → Se abre Google Meet → COPIA el link → PÉGALO abajo</p>
              <p><strong>2️⃣ Seleccionar estudiantes:</strong> Marca los estudiantes o grupos que verán la notificación</p>
              <p><strong>3️⃣ Iniciar clase:</strong> Click en "Crear e Iniciar Ahora" → ¡Listo! 🎉</p>
            </div>
          </div>
        </BaseAlert>

        {/* Error Alert */}
        {error && (
          <BaseAlert variant="danger" dismissible onDismiss={() => setError(null)}>
            {error}
          </BaseAlert>
        )}

        {/* Google Meet Link */}
        <div className="space-y-3 border-2 border-primary-200 dark:border-primary-800 rounded-lg p-4 bg-primary-50/50 dark:bg-primary-900/10">
          <div className="flex items-center gap-2 mb-2">
            <Video className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            <h3 className="font-semibold text-primary-900 dark:text-primary-100">Paso 1: Link de Google Meet</h3>
          </div>

          <BaseButton
            variant="primary"
            size="md"
            icon={ExternalLink}
            onClick={openGoogleMeet}
            fullWidth
          >
            🎥 Crear link de Google Meet (abre nueva pestaña)
          </BaseButton>

          <BaseInput
            label="Pega el link de Meet aquí"
            type="url"
            value={meetLink}
            onChange={(e) => setMeetLink(e.target.value)}
            placeholder="https://meet.google.com/abc-defg-hij"
            helperText={meetLink ? "✅ Link de Meet detectado" : "⚠️ Recuerda copiar y pegar el link de Meet"}
          />

          {!meetLink && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded p-3">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                <strong>⚠️ Importante:</strong> Sin link de Meet, los estudiantes no podrán unirse a la videollamada de Google Meet.
              </p>
            </div>
          )}
        </div>

        {/* Asignación de Estudiantes/Grupos */}
        <div className="border-2 border-orange-200 dark:border-orange-800 rounded-lg overflow-hidden bg-orange-50/30 dark:bg-orange-900/10">
          <div className="px-4 py-3 bg-orange-100 dark:bg-orange-900/20 border-b border-orange-200 dark:border-orange-800">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              <h3 className="font-semibold text-orange-900 dark:text-orange-100">
                Paso 2: Selecciona quién verá la notificación
              </h3>
            </div>
            <p className="text-xs text-orange-700 dark:text-orange-300 mt-1">
              Los estudiantes seleccionados recibirán una notificación instantánea en su dashboard
            </p>
          </div>

          {/* Tab Header */}
          <div className="flex border-b border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900">
            <button
              type="button"
              onClick={() => setAssignmentMode('students')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                assignmentMode === 'students'
                  ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 border-b-2 border-primary-600'
                  : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700'
              }`}
            >
              <Users className="w-4 h-4 inline mr-2" />
              Estudiantes {selectedStudents.length > 0 && `(${selectedStudents.length})`}
            </button>
            <button
              type="button"
              onClick={() => setAssignmentMode('groups')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                assignmentMode === 'groups'
                  ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 border-b-2 border-primary-600'
                  : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700'
              }`}
            >
              <Users className="w-4 h-4 inline mr-2" />
              Grupos {selectedGroups.length > 0 && `(${selectedGroups.length})`}
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-4">
            {assignmentMode === 'students' ? (
              <>
                {/* Students Actions */}
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">
                    {selectedStudents.length} de {students.length} seleccionados
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={selectAllStudents}
                      className="text-xs text-primary-600 dark:text-primary-400 hover:underline"
                    >
                      Todos
                    </button>
                    <button
                      type="button"
                      onClick={clearAllStudents}
                      className="text-xs text-zinc-600 dark:text-zinc-400 hover:underline"
                    >
                      Limpiar
                    </button>
                  </div>
                </div>

                {/* Students List */}
                <div className="max-h-48 overflow-y-auto space-y-2">
                  {students.length === 0 ? (
                    <p className="text-sm text-zinc-500 dark:text-zinc-500 text-center py-4">
                      No hay estudiantes disponibles
                    </p>
                  ) : (
                    students.map(student => (
                      <label
                        key={student.id}
                        className="flex items-center gap-3 p-2 rounded hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedStudents.includes(student.id)}
                          onChange={() => toggleStudent(student.id)}
                          className="w-4 h-4 text-primary-600 rounded border-zinc-300 dark:border-zinc-600 focus:ring-primary-500"
                        />
                        <span className="text-sm text-zinc-900 dark:text-white">
                          {student.displayName || student.email}
                        </span>
                      </label>
                    ))
                  )}
                </div>
              </>
            ) : (
              <>
                {/* Groups Actions */}
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">
                    {selectedGroups.length} de {groups.length} seleccionados
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={selectAllGroups}
                      className="text-xs text-primary-600 dark:text-primary-400 hover:underline"
                    >
                      Todos
                    </button>
                    <button
                      type="button"
                      onClick={clearAllGroups}
                      className="text-xs text-zinc-600 dark:text-zinc-400 hover:underline"
                    >
                      Limpiar
                    </button>
                  </div>
                </div>

                {/* Groups List */}
                <div className="max-h-48 overflow-y-auto space-y-2">
                  {groups.length === 0 ? (
                    <p className="text-sm text-zinc-500 dark:text-zinc-500 text-center py-4">
                      No hay grupos disponibles
                    </p>
                  ) : (
                    groups.map(group => (
                      <label
                        key={group.id}
                        className="flex items-center gap-3 p-2 rounded hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedGroups.includes(group.id)}
                          onChange={() => toggleGroup(group.id)}
                          className="w-4 h-4 text-primary-600 rounded border-zinc-300 dark:border-zinc-600 focus:ring-primary-500"
                        />
                        <div className="flex-1">
                          <span className="text-sm text-zinc-900 dark:text-white block">
                            {group.name}
                          </span>
                          {group.studentCount > 0 && (
                            <span className="text-xs text-zinc-500 dark:text-zinc-500">
                              {group.studentCount} estudiantes
                            </span>
                          )}
                        </div>
                      </label>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Quick Info */}
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2 flex items-center gap-2">
            <Check className="w-5 h-5" />
            ¿Qué pasa cuando creas la clase?
          </h4>
          <ul className="text-sm text-green-800 dark:text-green-200 space-y-1">
            <li>✅ La clase se inicia <strong>inmediatamente</strong></li>
            <li>✅ Los estudiantes seleccionados reciben una <strong>notificación en tiempo real</strong></li>
            <li>✅ Podrán unirse con <strong>un solo click</strong> desde su dashboard</li>
            <li>✅ El link de Google Meet estará disponible para todos</li>
            <li>✅ Duración: 60 minutos (configurable después)</li>
          </ul>
        </div>

        {/* Tip */}
        <div className="border-t border-zinc-200 dark:border-zinc-700 pt-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded p-3">
            <p className="text-xs text-blue-800 dark:text-blue-200">
              💡 <strong>Alternativa:</strong> También puedes crear el link desde Google Calendar:
              crea un evento, agrega "Videollamada de Google Meet", copia el link y pégalo aquí.
            </p>
          </div>
        </div>
      </div>
    </BaseModal>
  );
}

export default InstantMeetModal;
