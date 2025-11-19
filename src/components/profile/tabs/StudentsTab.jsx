/**
 * @fileoverview Pestaña de estudiantes para profesores
 * @module components/profile/tabs/StudentsTab
 */

import { useState, useEffect } from 'react';
import { Users, Search, BookOpen, TrendingUp, Mail } from 'lucide-react';
import { getStudentsByTeacher } from '../../../firebase/users';
import { getUserGamification } from '../../../firebase/gamification';
import UserAvatar from '../../UserAvatar';
import logger from '../../../utils/logger';

/**
 * StudentsTab - Lista de estudiantes del profesor
 *
 * @param {Object} user - Usuario actual (profesor)
 */
function StudentsTab({ user }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadStudents();
  }, [user?.uid]);

  const loadStudents = async () => {
    if (!user?.uid) return;

    setLoading(true);
    try {
      const studentsData = await getStudentsByTeacher(user.uid);

      // Cargar gamificación de cada estudiante
      const studentsWithGamification = await Promise.all(
        studentsData.map(async (student) => {
          const gamification = await getUserGamification(student.id);
          return {
            ...student,
            level: gamification?.level || 1,
            xp: gamification?.xp || 0,
            streakDays: gamification?.streakDays || 0
          };
        })
      );

      setStudents(studentsWithGamification);
    } catch (err) {
      logger.error('Error loading students:', err);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredStudents = () => {
    if (!searchTerm) return students;

    const term = searchTerm.toLowerCase();
    return students.filter(student =>
      student.name?.toLowerCase().includes(term) ||
      student.email?.toLowerCase().includes(term)
    );
  };

  const filteredStudents = getFilteredStudents();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header con búsqueda */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
            <Users size={20} strokeWidth={2} />
            Estudiantes ({students.length})
          </h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
            Todos los estudiantes activos de la plataforma
          </p>
        </div>

        {/* Buscador */}
        <div className="relative w-full md:w-auto">
          <Search size={18} strokeWidth={2} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Buscar estudiante..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-64 pl-10 pr-4 py-2 rounded-lg text-sm
                       bg-white dark:bg-zinc-950
                       border border-zinc-200 dark:border-zinc-800
                       text-zinc-900 dark:text-zinc-50
                       focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Lista de estudiantes */}
      {filteredStudents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStudents.map((student) => (
            <StudentCard key={student.id} student={student} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
          <Users size={48} strokeWidth={2} className="mx-auto text-zinc-300 dark:text-zinc-700 mb-4" />
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
            {searchTerm ? 'No se encontraron estudiantes' : 'No hay estudiantes'}
          </h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {searchTerm ? 'Intenta con otro término de búsqueda' : 'Los estudiantes aparecerán aquí cuando se inscriban'}
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * StudentCard - Card individual de estudiante
 */
function StudentCard({ student }) {
  return (
    <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 hover:shadow-lg transition-all cursor-pointer group">
      {/* Header con avatar y nombre */}
      <div className="flex items-start gap-3 mb-3">
        {/* Avatar - Componente Universal */}
        <UserAvatar
          userId={student.id || student.uid}
          name={student.name}
          email={student.email}
          size="md"
          className="flex-shrink-0"
        />

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h4 className="text-base font-bold text-zinc-900 dark:text-zinc-50 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
            {student.name || 'Sin nombre'}
          </h4>
          <div className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
            <Mail size={12} strokeWidth={2} />
            <span className="truncate">{student.email}</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        {/* Nivel */}
        <div className="bg-indigo-50 dark:bg-indigo-950/20 rounded-lg p-2 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <TrendingUp size={14} strokeWidth={2} className="text-indigo-600 dark:text-indigo-400" />
          </div>
          <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Nivel</p>
          <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{student.level}</p>
        </div>

        {/* XP */}
        <div className="bg-amber-50 dark:bg-amber-950/20 rounded-lg p-2 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <span className="text-amber-600 dark:text-amber-400">⚡</span>
          </div>
          <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">XP</p>
          <p className="text-lg font-bold text-amber-600 dark:text-amber-400">{student.xp}</p>
        </div>

        {/* Racha */}
        <div className="bg-red-50 dark:bg-red-950/20 rounded-lg p-2 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <span className="text-red-600 dark:text-red-400">🔥</span>
          </div>
          <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Racha</p>
          <p className="text-lg font-bold text-red-600 dark:text-red-400">{student.streakDays}</p>
        </div>
      </div>

      {/* Estado */}
      <div className="mt-3 flex items-center justify-between">
        <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
          student.active !== false
            ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
            : 'bg-gray-100 dark:bg-gray-900/20 text-gray-700 dark:text-gray-400'
        }`}>
          {student.active !== false ? 'Activo' : 'Inactivo'}
        </div>
      </div>
    </div>
  );
}

export default StudentsTab;
