/**
 * @fileoverview Profile Selector - Select correction profile for a student
 * @module components/homework/ProfileSelector
 */

import { useState, useEffect } from 'react';
import { RefreshCw, User } from 'lucide-react';
import { BaseButton } from '../common';
import { UniversalCard } from '../cards';
import {
  getAllCorrectionProfiles,
  getStudentProfile,
  getDefaultProfile
} from '../../firebase/correctionProfiles';
import logger from '../../utils/logger';

/**
 * Profile Selector Component
 * Shows universal correction profiles and allows selecting one for the student
 * All profiles are system-wide, not teacher-specific
 */
export default function ProfileSelector({
  studentId,
  teacherId, // Kept for backwards compatibility but not used for profile loading
  onProfileSelect, // Callback with full profile object (not just ID)
  onReanalyze,
  currentReviewId
}) {
  const [profiles, setProfiles] = useState([]);
  const [currentProfile, setCurrentProfile] = useState(null);
  const [defaultProfile, setDefaultProfile] = useState(null);
  const [selectedProfileId, setSelectedProfileId] = useState(null);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reanalyzing, setReanalyzing] = useState(false);

  useEffect(() => {
    loadProfilesAndCurrent();
  }, [studentId]); // teacherId no longer needed for loading universal profiles

  const loadProfilesAndCurrent = async () => {
    try {
      setLoading(true);

      // Load all universal correction profiles
      const allProfiles = await getAllCorrectionProfiles();
      setProfiles(allProfiles);

      // Load student's current profile (individual assignment or system default)
      const studentProfile = await getStudentProfile(studentId);

      // Load system-wide default profile
      const defProfile = await getDefaultProfile();
      setDefaultProfile(defProfile);

      // Use studentProfile if available, otherwise fallback to default profile, otherwise first profile
      const profileToUse = studentProfile || defProfile || (allProfiles.length > 0 ? allProfiles[0] : null);

      setCurrentProfile(profileToUse);
      setSelectedProfileId(profileToUse?.id || null);
      setSelectedProfile(profileToUse);

      // ALWAYS notify parent of profile selection (even with fallback)
      if (onProfileSelect && profileToUse) {
        const source = studentProfile ? 'student-assignment' : defProfile ? 'system-default' : 'first-available';
        logger.info(`✅ Profile auto-selected: "${profileToUse.name}" (source: ${source})`, 'ProfileSelector', {
          profileId: profileToUse.id,
          profileName: profileToUse.name,
          source
        });
        onProfileSelect(profileToUse);
      } else if (onProfileSelect && !profileToUse) {
        logger.warn('⚠️ No profiles available in system - using hardcoded defaults for visualization', 'ProfileSelector');
      }
    } catch (error) {
      logger.error('Error loading profiles', 'ProfileSelector', error);
    } finally {
      setLoading(false);
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
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <User size={18} />
            <span className="font-semibold">No hay perfiles de corrección en el sistema</span>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Los perfiles de corrección son universales y deben configurarse desde <strong>Configurar → Contenidos</strong> por un administrador.
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 italic">
            Solo los administradores pueden crear y gestionar perfiles de corrección.
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
            onChange={(e) => {
              const newProfileId = e.target.value;
              setSelectedProfileId(newProfileId);

              // Find the full profile object
              const fullProfile = profiles.find(p => p.id === newProfileId);
              setSelectedProfile(fullProfile || null);

              // Notify parent with full profile object
              if (onProfileSelect && fullProfile) {
                onProfileSelect(fullProfile);
              }
            }}
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

        {/* Reanalyze Button - Always visible */}
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
      </div>
    </div>
  );
}
