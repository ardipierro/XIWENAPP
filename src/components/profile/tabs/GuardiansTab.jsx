/**
 * @fileoverview Tab de Tutores para el perfil de usuario
 * @module components/profile/tabs/GuardiansTab
 */

import { useState, useEffect } from 'react';
import { User, UsersRound } from 'lucide-react';
import { getStudentGuardians, getGuardianStudents } from '../../../firebase/guardians';
import { BaseAlert } from '../../common';
import logger from '../../../utils/logger';

/**
 * GuardiansTab - Pestaña de tutores vinculados al estudiante o estudiantes supervisados por tutor
 *
 * @param {object} user - Usuario estudiante o tutor
 * @param {boolean} isTutor - Si el usuario es tutor (muestra sus estudiantes) o estudiante (muestra sus tutores)
 */
function GuardiansTab({ user, isTutor = false }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [user?.uid, user?.id, isTutor]);

  const loadData = async () => {
    setLoading(true);
    try {
      const userId = user?.uid || user?.id;
      if (!userId) return;

      if (isTutor) {
        // Cargar estudiantes supervisados por el tutor
        const students = await getGuardianStudents(userId);
        setItems(students);
      } else {
        // Cargar tutores del estudiante
        const guardianLinks = await getStudentGuardians(userId);
        setItems(guardianLinks);
      }
    } catch (error) {
      logger.error('Error al cargar datos:', error);
      // Si es un error de permisos, no mostrar mensaje de error
      if (error.code !== 'permission-denied') {
        logger.error('Error loading data:', error);
      }
      setItems([]); // Establecer array vacío en caso de error
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
          {isTutor ? 'Estudiantes Supervisados' : 'Tutores Vinculados'}
        </h3>
      </div>

      {items.length === 0 ? (
        <BaseAlert variant="info">
          <div className="flex items-start gap-3">
            <UsersRound size={20} strokeWidth={2} className="flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold mb-1">
                {isTutor ? 'No hay estudiantes supervisados' : 'Sin tutores vinculados'}
              </p>
              <p className="text-sm">
                {isTutor
                  ? 'Este tutor no tiene estudiantes asignados.'
                  : 'Este estudiante no tiene tutores asignados. La funcionalidad de tutores permite a padres o responsables acceder a información del estudiante.'
                }
              </p>
              {!isTutor && (
                <p className="text-xs mt-2 opacity-75">
                  Nota: Esta función requiere configuración de permisos en Firebase.
                </p>
              )}
            </div>
          </div>
        </BaseAlert>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.relationId || item.id}
              className="p-4 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-700 flex items-center justify-center">
                    <User size={20} className="text-zinc-600 dark:text-zinc-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-zinc-900 dark:text-white">
                      {isTutor ? item.studentName : item.guardianName || item.guardianData?.name}
                    </h4>
                    {!isTutor && item.guardianData?.email && (
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        {item.guardianData.email}
                      </p>
                    )}
                    {item.relationship && (
                      <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">
                        Relación: {item.relationship}
                      </p>
                    )}
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
