/**
 * @fileoverview Profile Selector - Select correction profile for a student
 * @module components/homework/ProfileSelector
 */

import { useState, useEffect } from 'react';
import { RefreshCw, User, Plus } from 'lucide-react';
import { BaseButton } from '../common';
import { UniversalCard } from '../cards';
import {
  getCorrectionProfilesByTeacher,
  getStudentProfile,
  getDefaultProfile,
  initializeDefaultProfiles
} from '../../firebase/correctionProfiles';
import logger from '../../utils/logger';

/**
 * Profile Selector Component
 * Shows current profile and allows changing it
 */
export default function ProfileSelector({
  studentId,
  teacherId,
  onProfileSelect,
  onReanalyze,
  currentReviewId
}) {
  const [profiles, setProfiles] = useState([]);
  const [currentProfile, setCurrentProfile] = useState(null);
  const [defaultProfile, setDefaultProfile] = useState(null);
  const [selectedProfileId, setSelectedProfileId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reanalyzing, setReanalyzing] = useState(false);
  const [initializing, setInitializing] = useState(false);

  useEffect(() => {
    loadProfilesAndCurrent();
  }, [studentId, teacherId]);

  const loadProfilesAndCurrent = async () => {
    try {
      setLoading(true);

      // Load all profiles for this teacher
      const allProfiles = await getCorrectionProfilesByTeacher(teacherId, false);
      setProfiles(allProfiles);

      // Load student's current profile
      const studentProfile = await getStudentProfile(studentId, teacherId);
      setCurrentProfile(studentProfile);
      setSelectedProfileId(studentProfile?.id || null);

      // Load default profile
      const defProfile = await getDefaultProfile(teacherId);
      setDefaultProfile(defProfile);
    } catch (error) {
      logger.error('Error loading profiles', 'ProfileSelector', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInitializeProfiles = async () => {
    try {
      setInitializing(true);
      const result = await initializeDefaultProfiles(teacherId);

      if (result.success) {
        // Reload profiles
        await loadProfilesAndCurrent();
        logger.info('Default profiles initialized successfully', 'ProfileSelector');
      } else {
        logger.error('Failed to initialize profiles', 'ProfileSelector', result.error);
        alert('Error al crear perfiles por defecto');
      }
    } catch (error) {
      logger.error('Error initializing profiles', 'ProfileSelector', error);
      alert('Error al crear perfiles por defecto');
    } finally {
      setInitializing(false);
    }
  };

  const handleReanalyze = async () => {
    if (!selectedProfileId) {
      alert('Por favor selecciona un perfil');
      return;
    }

    try {
      setReanalyzing(true);
      await onReanalyze(selectedProfileId);
    } catch (error) {
      logger.error('Error reanalyzing', 'ProfileSelector', error);
      alert('Error al re-analizar la tarea');
    } finally {
      setReanalyzing(false);
    }
  };

  if (loading) {
    return (
      <UniversalCard variant="default" size="md" className="mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <RefreshCw className="animate-spin" size={16} />
          Cargando perfiles...
        </div>
      </UniversalCard>
    );
  }

  if (profiles.length === 0) {
    return (
      <UniversalCard variant="warning" size="md" className="mb-4">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <User size={18} />
            <span className="font-semibold">No hay perfiles de corrección configurados</span>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Los perfiles definen cómo se corrigen las tareas (nivel de exigencia, qué errores revisar, etc.)
          </p>
          <BaseButton
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={handleInitializeProfiles}
            disabled={initializing}
            className="w-full"
          >
            {initializing ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                Creando perfiles...
              </>
            ) : (
              <>
                <Plus size={14} />
                Crear perfiles por defecto (3)
              </>
            )}
          </BaseButton>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Se crearán perfiles para: Principiantes (A1-A2), Intermedio (B1-B2) y Avanzado (C1-C2)
          </p>
        </div>
      </UniversalCard>
    );
  }

  const isProfileChanged = selectedProfileId !== currentProfile?.id;

  return (
    <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
      <div className="flex items-center gap-3">
        {/* Current Profile Info - Compact */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <User size={16} className="text-gray-500 dark:text-gray-400" />
          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
            Perfil:
          </span>
        </div>

        {/* Profile Selector - Inline */}
        <div className="flex-1">
          <select
            value={selectedProfileId || ''}
            onChange={(e) => setSelectedProfileId(e.target.value)}
            className="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="">Selecciona un perfil...</option>
            {profiles.map(profile => (
              <option key={profile.id} value={profile.id}>
                {profile.icon} {profile.name}
                {profile.id === defaultProfile?.id ? ' (Por defecto)' : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Reanalyze Button - Only when changed */}
        {isProfileChanged && (
          <BaseButton
            variant="primary"
            size="sm"
            onClick={handleReanalyze}
            disabled={reanalyzing}
            className="flex items-center gap-1.5 flex-shrink-0"
          >
            <RefreshCw size={12} className={reanalyzing ? 'animate-spin' : ''} />
            {reanalyzing ? 'Re-analizando...' : 'Re-analizar'}
          </BaseButton>
        )}
      </div>
    </div>
  );
}
