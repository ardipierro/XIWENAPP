/**
 * @fileoverview Profile Selector - Select correction profile for a student
 * @module components/homework/ProfileSelector
 */

import { useState, useEffect } from 'react';
import { RefreshCw, User, Check } from 'lucide-react';
import { BaseButton, BaseCard, BaseBadge } from '../common';
import {
  getCorrectionProfilesByTeacher,
  getStudentProfile,
  getDefaultProfile
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
      <BaseCard className="mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <RefreshCw className="animate-spin" size={16} />
          Cargando perfiles...
        </div>
      </BaseCard>
    );
  }

  if (profiles.length === 0) {
    return (
      <BaseCard className="mb-4">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          No hay perfiles de corrección configurados
        </div>
      </BaseCard>
    );
  }

  const isProfileChanged = selectedProfileId !== currentProfile?.id;

  return (
    <BaseCard className="mb-4">
      <div className="space-y-3">
        {/* Current Profile Info */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User size={18} className="text-gray-500 dark:text-gray-400" />
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Perfil de Corrección
            </span>
          </div>

          {currentProfile && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {currentProfile.id === defaultProfile?.id ? 'Por defecto' : 'Individual'}
              </span>
              <BaseBadge variant="blue" size="sm">
                {currentProfile.icon} {currentProfile.name}
              </BaseBadge>
            </div>
          )}
        </div>

        {/* Profile Selector */}
        <div>
          <label className="block text-xs text-gray-600 dark:text-gray-400 mb-2">
            Seleccionar perfil:
          </label>
          <select
            value={selectedProfileId || ''}
            onChange={(e) => setSelectedProfileId(e.target.value)}
            className="input text-sm w-full"
          >
            <option value="">Selecciona un perfil...</option>
            {profiles.map(profile => (
              <option key={profile.id} value={profile.id}>
                {profile.icon} {profile.name}
                {profile.id === defaultProfile?.id ? ' (Por defecto)' : ''}
                {profile.id === currentProfile?.id ? ' (Actual)' : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Reanalyze Button */}
        {isProfileChanged && (
          <div className="flex items-center gap-3 pt-2 border-t border-gray-200 dark:border-gray-700">
            <BaseButton
              variant="primary"
              size="sm"
              onClick={handleReanalyze}
              disabled={reanalyzing}
              className="flex items-center gap-2"
            >
              <RefreshCw size={14} className={reanalyzing ? 'animate-spin' : ''} />
              {reanalyzing ? 'Re-analizando...' : 'Re-analizar con nuevo perfil'}
            </BaseButton>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Se reemplazarán las correcciones actuales
            </span>
          </div>
        )}

        {/* Profile Details */}
        {selectedProfileId && (
          <div className="text-xs text-gray-600 dark:text-gray-400 pt-2 border-t border-gray-200 dark:border-gray-700">
            {(() => {
              const selected = profiles.find(p => p.id === selectedProfileId);
              if (!selected) return null;

              const settings = selected.settings || {};
              const strictness = settings.strictness || 'moderate';
              const checks = settings.checks || [];

              return (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <strong>Severidad:</strong>
                    <BaseBadge
                      variant={
                        strictness === 'lenient' ? 'success' :
                        strictness === 'strict' ? 'danger' : 'warning'
                      }
                      size="sm"
                    >
                      {strictness === 'lenient' ? '🟢 Leniente' :
                       strictness === 'strict' ? '🔴 Estricto' : '🟡 Moderado'}
                    </BaseBadge>
                  </div>
                  <div>
                    <strong>Revisa:</strong> {checks.join(', ')}
                  </div>
                  {selected.description && (
                    <div>
                      <strong>Descripción:</strong> {selected.description}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </BaseCard>
  );
}
