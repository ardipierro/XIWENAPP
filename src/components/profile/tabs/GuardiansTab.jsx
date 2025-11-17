/**
 * @fileoverview Tab de Tutores para el perfil de usuario
 * @module components/profile/tabs/GuardiansTab
 */

import { useState, useEffect } from 'react';
import { User, UsersRound } from 'lucide-react';
import { getStudentGuardians } from '../../../firebase/guardians';
import { BaseAlert } from '../../common';
import logger from '../../../utils/logger';

/**
 * GuardiansTab - Pestaña de tutores vinculados al estudiante
 *
 * @param {object} user - Usuario estudiante
 */
function GuardiansTab({ user }) {
  const [guardians, setGuardians] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadGuardians();
  }, [user?.uid, user?.id]);

  const loadGuardians = async () => {
    setLoading(true);
    try {
      const userId = user?.uid || user?.id;
      if (!userId) return;

      const guardianLinks = await getStudentGuardians(userId);
      setGuardians(guardianLinks);
    } catch (error) {
      logger.error('Error al cargar tutores:', error);
      // Si es un error de permisos, no mostrar mensaje de error
      if (error.code !== 'permission-denied') {
        logger.error('Error loading guardians:', error);
      }
      setGuardians([]); // Establecer array vacío en caso de error
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="w-12 h-12 border-4 border-zinc-200 dark:border-zinc-800 border-t-zinc-900 dark:border-t-white rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-zinc-600 dark:text-zinc-400">Cargando tutores...</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center gap-2 mb-6">
        <UsersRound size={24} strokeWidth={2} className="text-zinc-900 dark:text-white" />
        <h3 className="text-xl font-semibold text-zinc-900 dark:text-white">
          Tutores Vinculados
        </h3>
      </div>

      {guardians.length === 0 ? (
        <BaseAlert variant="info">
          <div className="flex items-start gap-3">
            <UsersRound size={20} strokeWidth={2} className="flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold mb-1">Sin tutores vinculados</p>
              <p className="text-sm">
                Este estudiante no tiene tutores asignados. La funcionalidad de tutores permite a padres o responsables acceder a información del estudiante.
              </p>
              <p className="text-xs mt-2 opacity-75">
                Nota: Esta función requiere configuración de permisos en Firebase.
              </p>
            </div>
          </div>
        </BaseAlert>
      ) : (
        <div className="space-y-3">
          {guardians.map((guardian) => (
            <div
              key={guardian.id}
              className="p-4 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-700 flex items-center justify-center">
                    <User size={20} className="text-zinc-600 dark:text-zinc-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-zinc-900 dark:text-white">
                      {guardian.guardianName}
                    </h4>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      {guardian.guardianEmail}
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">
                      Relación: {guardian.relationshipType || 'No especificada'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default GuardiansTab;
