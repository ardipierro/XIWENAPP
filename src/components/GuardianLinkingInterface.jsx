/**
 * @fileoverview Guardian Linking Interface for Admins/Teachers
 * @module components/GuardianLinkingInterface
 *
 * Interface for admins and teachers to:
 * - Create guardian accounts
 * - Link guardians to students
 * - Manage guardian permissions
 * - View guardian-student relationships
 */

import { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Link as LinkIcon,
  Unlink,
  Edit,
  Trash2,
  Mail,
  Phone,
  UserPlus,
  X,
  Check,
  AlertCircle,
  Search
} from 'lucide-react';
import {
  BaseButton,
  BaseModal,
  BaseBadge,
  BaseLoading,
  BaseEmptyState,
  BaseAlert,
  BaseInput,
  BaseSelect
} from './common';
import { UniversalCard } from './cards';
import UserAvatar from './UserAvatar';
import {
  createGuardian,
  getGuardianByUserId,
  linkGuardianToStudent,
  getGuardianStudents,
  getStudentGuardians,
  unlinkGuardianFromStudent,
  updateGuardianPermissions,
  RELATIONSHIP_TYPES
} from '../firebase/guardians';
import { getAllUsers } from '../firebase/users';
import logger from '../utils/logger';

export default function GuardianLinkingInterface({ adminId }) {
  const [view, setView] = useState('list'); // 'list' | 'create' | 'link'
  const [guardians, setGuardians] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGuardian, setSelectedGuardian] = useState(null);

  // Load guardians and students
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      logger.info('Loading guardians and students');

      // Load all users and filter by role
      const allUsers = await getAllUsers();

      const guardianUsers = allUsers.filter(u => u.role === 'guardian');
      const studentUsers = allUsers.filter(u =>
        u.role === 'student' || u.role === 'listener' || u.role === 'trial'
      );

      setGuardians(guardianUsers);
      setStudents(studentUsers);

      logger.info('Data loaded successfully', {
        guardiansCount: guardianUsers.length,
        studentsCount: studentUsers.length
      });
    } catch (err) {
      logger.error('Error loading data', err);
      setError('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <BaseLoading message="Cargando tutores y estudiantes..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Gestión de Tutores y Encargados
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Vincula padres, tutores y encargados con estudiantes
          </p>
        </div>

        {/* Alerts */}
        {error && (
          <BaseAlert variant="danger" className="mb-6" onClose={() => setError(null)}>
            {error}
          </BaseAlert>
        )}
        {success && (
          <BaseAlert variant="success" className="mb-6" onClose={() => setSuccess(null)}>
            {success}
          </BaseAlert>
        )}

        {/* Actions */}
        <div className="flex gap-4 mb-6">
          <BaseButton
            variant="primary"
            onClick={() => setView('create')}
          >
            <UserPlus size={18} strokeWidth={2} />
            Crear Tutor
          </BaseButton>
          <BaseButton
            variant="secondary"
            onClick={() => setView('link')}
          >
            <LinkIcon size={18} strokeWidth={2} />
            Vincular Tutor a Estudiante
          </BaseButton>
        </div>

        {/* Search */}
        <div className="mb-6">
          <BaseInput
            type="text"
            placeholder="Buscar tutor por nombre o email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon={Search}
          />
        </div>

        {/* Guardians List */}
        {guardians.length === 0 ? (
          <BaseEmptyState
            icon={Users}
            title="No hay tutores registrados"
            description="Crea un nuevo tutor para comenzar a vincular estudiantes"
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {guardians
              .filter(g =>
                g.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                g.email?.toLowerCase().includes(searchTerm.toLowerCase())
              )
              .map(guardian => (
                <GuardianCard
                  key={guardian.id}
                  guardian={guardian}
                  onViewDetails={(g) => setSelectedGuardian(g)}
                  onRefresh={loadData}
                  setError={setError}
                  setSuccess={setSuccess}
                />
              ))}
          </div>
        )}

        {/* Create Guardian Modal */}
        {view === 'create' && (
          <CreateGuardianModal
            onClose={() => setView('list')}
            onSuccess={() => {
              setSuccess('Tutor creado exitosamente');
              setView('list');
              loadData();
            }}
            setError={setError}
          />
        )}

        {/* Link Guardian Modal */}
        {view === 'link' && (
          <LinkGuardianModal
            guardians={guardians}
            students={students}
            adminId={adminId}
            onClose={() => setView('list')}
            onSuccess={() => {
              setSuccess('Tutor vinculado exitosamente');
              setView('list');
              loadData();
            }}
            setError={setError}
          />
        )}

        {/* Guardian Details Modal */}
        {selectedGuardian && (
          <GuardianDetailsModal
            guardian={selectedGuardian}
            onClose={() => setSelectedGuardian(null)}
            onRefresh={loadData}
            setError={setError}
            setSuccess={setSuccess}
          />
        )}
      </div>
    </div>
  );
}

/**
 * Guardian Card Component
 */
function GuardianCard({ guardian, onViewDetails, onRefresh, setError, setSuccess }) {
  const [linkedStudents, setLinkedStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLinkedStudents();
  }, [guardian.id]);

  const loadLinkedStudents = async () => {
    try {
      const students = await getGuardianStudents(guardian.id);
      setLinkedStudents(students);
    } catch (err) {
      logger.error('Error loading guardian students', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <UniversalCard variant="default" size="md" hover>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <UserAvatar
              userId={guardian.id || guardian.guardianId}
              name={guardian.name}
              email={guardian.email}
              size="md"
            />
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {guardian.name}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {guardian.email}
              </p>
            </div>
          </div>

          <BaseButton
            variant="ghost"
            size="sm"
            onClick={() => onViewDetails(guardian)}
          >
            <Edit size={18} strokeWidth={2} />
          </BaseButton>
        </div>

        {/* Contact Info */}
        {guardian.phone && (
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Phone size={16} strokeWidth={2} />
            <span>{guardian.phone}</span>
          </div>
        )}

        {/* Linked Students */}
        <div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Estudiantes vinculados: {linkedStudents.length}
          </p>
          {loading ? (
            <BaseLoading size="sm" />
          ) : linkedStudents.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {linkedStudents.slice(0, 3).map(student => (
                <BaseBadge key={student.relationId} variant="secondary">
                  {student.studentName}
                </BaseBadge>
              ))}
              {linkedStudents.length > 3 && (
                <BaseBadge variant="outline">
                  +{linkedStudents.length - 3} más
                </BaseBadge>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No tiene estudiantes vinculados
            </p>
          )}
        </div>
      </div>
    </UniversalCard>
  );
}

/**
 * Create Guardian Modal
 */
function CreateGuardianModal({ onClose, onSuccess, setError }) {
  const [formData, setFormData] = useState({
    userId: '',
    email: '',
    name: '',
    phone: '',
    relationship: RELATIONSHIP_TYPES.PADRE
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.email || !formData.name) {
      setError('Email y nombre son requeridos');
      return;
    }

    try {
      setLoading(true);
      logger.info('Creating new guardian', { email: formData.email });

      const result = await createGuardian({
        userId: formData.userId || `guardian_${Date.now()}`,
        email: formData.email,
        name: formData.name,
        phone: formData.phone,
        relationship: formData.relationship
      });

      if (result.success) {
        logger.info('Guardian created successfully', { guardianId: result.id });
        onSuccess();
      } else {
        logger.error('Failed to create guardian', { error: result.error });
        setError(result.error || 'Error al crear el tutor');
      }
    } catch (err) {
      logger.error('Error creating guardian', err);
      setError('Error al crear el tutor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <BaseModal
      isOpen={true}
      onClose={onClose}
      title="Crear Nuevo Tutor/Encargado"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <BaseInput
          type="text"
          label="Nombre completo *"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />

        <BaseInput
          type="email"
          label="Email *"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
        />

        <BaseInput
          type="tel"
          label="Teléfono"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
        />

        <BaseSelect
          label="Tipo de relación"
          value={formData.relationship}
          onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
          options={Object.entries(RELATIONSHIP_TYPES).map(([key, value]) => ({
            value: value,
            label: key.charAt(0) + key.slice(1).toLowerCase()
          }))}
        />

        <div className="flex gap-3 pt-4">
          <BaseButton
            type="submit"
            variant="primary"
            disabled={loading}
            className="flex-1"
          >
            {loading ? 'Creando...' : 'Crear Tutor'}
          </BaseButton>
          <BaseButton
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </BaseButton>
        </div>
      </form>
    </BaseModal>
  );
}

/**
 * Link Guardian to Student Modal
 */
function LinkGuardianModal({ guardians, students, adminId, onClose, onSuccess, setError }) {
  const [selectedGuardian, setSelectedGuardian] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [relationship, setRelationship] = useState(RELATIONSHIP_TYPES.PADRE);
  const [permissions, setPermissions] = useState({
    canViewGrades: true,
    canViewAttendance: true,
    canViewBehavior: true,
    canReceiveNotifications: true
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedGuardian || !selectedStudent) {
      setError('Debes seleccionar un tutor y un estudiante');
      return;
    }

    try {
      setLoading(true);
      logger.info('Linking guardian to student', {
        guardianId: selectedGuardian,
        studentId: selectedStudent
      });

      const student = students.find(s => s.id === selectedStudent);

      const result = await linkGuardianToStudent({
        guardianId: selectedGuardian,
        studentId: selectedStudent,
        studentName: student?.name || 'Estudiante',
        relationship,
        permissions,
        addedBy: adminId
      });

      if (result.success) {
        logger.info('Guardian linked successfully');
        onSuccess();
      } else {
        logger.error('Failed to link guardian', { error: result.error });
        setError(result.error || 'Error al vincular el tutor');
      }
    } catch (err) {
      logger.error('Error linking guardian', err);
      setError('Error al vincular el tutor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <BaseModal
      isOpen={true}
      onClose={onClose}
      title="Vincular Tutor a Estudiante"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <BaseSelect
          label="Tutor *"
          value={selectedGuardian}
          onChange={(e) => setSelectedGuardian(e.target.value)}
          options={[
            { value: '', label: '-- Seleccionar --' },
            ...guardians.map(guardian => ({
              value: guardian.id,
              label: `${guardian.name} (${guardian.email})`
            }))
          ]}
          required
        />

        <BaseSelect
          label="Estudiante *"
          value={selectedStudent}
          onChange={(e) => setSelectedStudent(e.target.value)}
          options={[
            { value: '', label: '-- Seleccionar --' },
            ...students.map(student => ({
              value: student.id,
              label: `${student.name} (${student.email})`
            }))
          ]}
          required
        />

        <BaseSelect
          label="Tipo de relación"
          value={relationship}
          onChange={(e) => setRelationship(e.target.value)}
          options={Object.entries(RELATIONSHIP_TYPES).map(([key, value]) => ({
            value: value,
            label: key.charAt(0) + key.slice(1).toLowerCase()
          }))}
        />

        {/* Permissions */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Permisos
          </p>

          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={permissions.canViewGrades}
                onChange={(e) => setPermissions({ ...permissions, canViewGrades: e.target.checked })}
                className="w-4 h-4 text-primary border-gray-300 dark:border-gray-600 rounded focus:ring-primary"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Ver calificaciones
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={permissions.canViewAttendance}
                onChange={(e) => setPermissions({ ...permissions, canViewAttendance: e.target.checked })}
                className="w-4 h-4 text-primary border-gray-300 dark:border-gray-600 rounded focus:ring-primary"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Ver asistencia
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={permissions.canViewBehavior}
                onChange={(e) => setPermissions({ ...permissions, canViewBehavior: e.target.checked })}
                className="w-4 h-4 text-primary border-gray-300 dark:border-gray-600 rounded focus:ring-primary"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Ver comportamiento
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={permissions.canReceiveNotifications}
                onChange={(e) => setPermissions({ ...permissions, canReceiveNotifications: e.target.checked })}
                className="w-4 h-4 text-primary border-gray-300 dark:border-gray-600 rounded focus:ring-primary"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Recibir notificaciones
              </span>
            </label>
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <BaseButton
            type="submit"
            variant="primary"
            disabled={loading}
            className="flex-1"
          >
            {loading ? 'Vinculando...' : 'Vincular'}
          </BaseButton>
          <BaseButton
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </BaseButton>
        </div>
      </form>
    </BaseModal>
  );
}

/**
 * Guardian Details Modal
 */
function GuardianDetailsModal({ guardian, onClose, onRefresh, setError, setSuccess }) {
  const [linkedStudents, setLinkedStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLinkedStudents();
  }, [guardian.id]);

  const loadLinkedStudents = async () => {
    try {
      const students = await getGuardianStudents(guardian.id);
      setLinkedStudents(students);
    } catch (err) {
      logger.error('Error loading linked students', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUnlink = async (relationId, studentName) => {
    if (!confirm(`¿Desvincular a ${studentName}?`)) return;

    try {
      logger.info('Unlinking student from guardian', { relationId });
      const result = await unlinkGuardianFromStudent(relationId);

      if (result.success) {
        logger.info('Student unlinked successfully');
        setSuccess('Estudiante desvinculado exitosamente');
        loadLinkedStudents();
        onRefresh();
      } else {
        setError(result.error || 'Error al desvincular');
      }
    } catch (err) {
      logger.error('Error unlinking student', err);
      setError('Error al desvincular el estudiante');
    }
  };

  return (
    <BaseModal
      isOpen={true}
      onClose={onClose}
      title={`Detalles de ${guardian.name}`}
      size="lg"
    >
      {loading ? (
        <BaseLoading message="Cargando estudiantes vinculados..." />
      ) : (
        <div className="space-y-6">
          {/* Guardian Info */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Información del Tutor
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Mail size={16} strokeWidth={2} className="text-gray-400" />
                <span className="text-gray-700 dark:text-gray-300">{guardian.email}</span>
              </div>
              {guardian.phone && (
                <div className="flex items-center gap-2">
                  <Phone size={16} strokeWidth={2} className="text-gray-400" />
                  <span className="text-gray-700 dark:text-gray-300">{guardian.phone}</span>
                </div>
              )}
            </div>
          </div>

          {/* Linked Students */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Estudiantes Vinculados ({linkedStudents.length})
            </h3>

            {linkedStudents.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No tiene estudiantes vinculados
              </p>
            ) : (
              <div className="space-y-3">
                {linkedStudents.map(student => (
                  <div
                    key={student.relationId}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {student.studentName}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {student.relationship}
                      </p>
                      <div className="flex gap-2 mt-1">
                        {student.canViewGrades && (
                          <BaseBadge variant="success" size="sm">Calificaciones</BaseBadge>
                        )}
                        {student.canViewAttendance && (
                          <BaseBadge variant="info" size="sm">Asistencia</BaseBadge>
                        )}
                        {student.canViewBehavior && (
                          <BaseBadge variant="warning" size="sm">Comportamiento</BaseBadge>
                        )}
                      </div>
                    </div>

                    <BaseButton
                      variant="ghost"
                      size="sm"
                      onClick={() => handleUnlink(student.relationId, student.studentName)}
                    >
                      <Unlink size={18} strokeWidth={2} />
                    </BaseButton>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </BaseModal>
  );
}
