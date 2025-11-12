/**
 * @fileoverview Homework Correction Profiles Modal - Manage correction profiles
 * @module components/homework/HomeworkCorrectionProfilesModal
 */

import { useState, useEffect } from 'react';
import {
  Plus,
  Edit3,
  Trash2,
  Check,
  Users,
  Settings,
  X,
  Star
} from 'lucide-react';
import {
  BaseButton,
  BaseModal,
  BaseCard,
  BaseBadge,
  BaseAlert,
  BaseEmptyState,
  BaseLoading
} from '../common';
import {
  getCorrectionProfilesByTeacher,
  deleteCorrectionProfile,
  setDefaultProfile,
  initializeDefaultProfiles
} from '../../firebase/correctionProfiles';
import ProfileEditor from './ProfileEditor';
import logger from '../../utils/logger';

export default function HomeworkCorrectionProfilesModal({ onClose, teacherId }) {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [showEditor, setShowEditor] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    loadProfiles();
  }, [teacherId]);

  const loadProfiles = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getCorrectionProfilesByTeacher(teacherId);

      // If no profiles exist, initialize defaults
      if (result.length === 0) {
        logger.info('No profiles found, initializing defaults', 'ProfilesModal');
        const initResult = await initializeDefaultProfiles(teacherId);
        if (initResult.success) {
          const newProfiles = await getCorrectionProfilesByTeacher(teacherId);
          setProfiles(newProfiles);
        }
      } else {
        setProfiles(result);
      }
    } catch (err) {
      logger.error('Error loading correction profiles', 'ProfilesModal', err);
      setError('Error al cargar perfiles');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    setSelectedProfile(null);
    setShowEditor(true);
  };

  const handleEdit = (profile) => {
    setSelectedProfile(profile);
    setShowEditor(true);
  };

  const handleDelete = async (profileId) => {
    if (!window.confirm('¿Eliminar este perfil?')) return;

    try {
      const result = await deleteCorrectionProfile(profileId);
      if (result.success) {
        setSuccess('Perfil eliminado');
        loadProfiles();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      logger.error('Error deleting profile', 'ProfilesModal', err);
      setError('Error al eliminar perfil');
    }
  };

  const handleSetDefault = async (profileId) => {
    try {
      const result = await setDefaultProfile(teacherId, profileId);
      if (result.success) {
        setSuccess('Perfil predeterminado actualizado');
        loadProfiles();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      logger.error('Error setting default profile', 'ProfilesModal', err);
      setError('Error al establecer perfil predeterminado');
    }
  };

  const handleEditorClose = (saved) => {
    setShowEditor(false);
    setSelectedProfile(null);
    if (saved) {
      setSuccess(selectedProfile ? 'Perfil actualizado' : 'Perfil creado');
      loadProfiles();
      setTimeout(() => setSuccess(null), 3000);
    }
  };

  if (showEditor) {
    return (
      <ProfileEditor
        profile={selectedProfile}
        teacherId={teacherId}
        onClose={handleEditorClose}
      />
    );
  }

  return (
    <BaseModal
      isOpen={true}
      onClose={onClose}
      title="Perfiles de Corrección"
      size="xl"
    >
      <div className="space-y-6">
        {/* Alerts */}
        {error && (
          <BaseAlert variant="danger" dismissible onDismiss={() => setError(null)}>
            {error}
          </BaseAlert>
        )}
        {success && (
          <BaseAlert variant="success" dismissible onDismiss={() => setSuccess(null)}>
            {success}
          </BaseAlert>
        )}

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Configura diferentes perfiles de corrección para tus alumnos
            </p>
          </div>
          <BaseButton
            variant="primary"
            icon={Plus}
            onClick={handleCreateNew}
          >
            Crear Perfil
          </BaseButton>
        </div>

        {/* Profiles List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <BaseLoading variant="spinner" size="lg" text="Cargando perfiles..." />
          </div>
        ) : profiles.length === 0 ? (
          <BaseEmptyState
            icon={Settings}
            title="Sin perfiles"
            description="Crea tu primer perfil de corrección"
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {profiles.map(profile => (
              <ProfileCard
                key={profile.id}
                profile={profile}
                onEdit={() => handleEdit(profile)}
                onDelete={() => handleDelete(profile.id)}
                onSetDefault={() => handleSetDefault(profile.id)}
              />
            ))}
          </div>
        )}
      </div>
    </BaseModal>
  );
}

function ProfileCard({ profile, onEdit, onDelete, onSetDefault }) {
  const settings = profile.settings || {};
  const totalAssigned = (profile.assignedToStudents?.length || 0) + (profile.assignedToGroups?.length || 0);

  return (
    <BaseCard>
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{profile.icon || '📝'}</span>
            <div>
              <h3 className="font-semibold text-zinc-900 dark:text-white">
                {profile.name}
              </h3>
              {profile.isDefault && (
                <BaseBadge variant="primary" size="sm">
                  <Star size={12} strokeWidth={2} />
                  Predeterminado
                </BaseBadge>
              )}
            </div>
          </div>
          <div className="flex gap-1">
            <button
              onClick={onEdit}
              className="p-1.5 text-zinc-600 dark:text-zinc-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors"
            >
              <Edit3 size={16} strokeWidth={2} />
            </button>
            <button
              onClick={onDelete}
              className="p-1.5 text-zinc-600 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors"
            >
              <Trash2 size={16} strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {profile.description}
        </p>

        {/* Settings Summary */}
        <div className="flex flex-wrap gap-2">
          {settings.checks?.map(check => (
            <BaseBadge key={check} variant="default" size="sm">
              {check}
            </BaseBadge>
          ))}
          <BaseBadge variant="info" size="sm">
            {settings.strictness}
          </BaseBadge>
        </div>

        {/* Assignment Info */}
        <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
          <Users size={14} strokeWidth={2} />
          <span>{totalAssigned} asignaciones</span>
        </div>

        {/* Actions */}
        {!profile.isDefault && (
          <BaseButton
            variant="outline"
            size="sm"
            fullWidth
            onClick={onSetDefault}
          >
            <Check size={14} strokeWidth={2} />
            Establecer como predeterminado
          </BaseButton>
        )}
      </div>
    </BaseCard>
  );
}
