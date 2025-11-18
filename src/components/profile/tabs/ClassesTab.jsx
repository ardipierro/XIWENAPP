/**
 * @fileoverview Pestaña de clases/cursos asignados
 * @module components/profile/tabs/ClassesTab
 */

import { useState, useEffect } from 'react';
import { BookOpen, Calendar, Clock, Users, CheckCircle, AlertCircle } from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../../firebase/config';
import logger from '../../../utils/logger';

/**
 * ClassesTab - Cursos asignados al usuario
 *
 * @param {Object} user - Usuario actual
 * @param {string} userRole - Rol del usuario
 */
function ClassesTab({ user, userRole }) {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, active, completed

  useEffect(() => {
    loadCourses();
  }, [user?.uid, userRole]);

  const loadCourses = async () => {
    if (!user?.uid) {
      logger.warn('ClassesTab: No user UID provided');
      setLoading(false);
      return;
    }

    logger.debug('ClassesTab: Loading courses', { userId: user.uid, userRole });
    setLoading(true);
    try {
      let coursesData = [];

      if (userRole === 'student' || userRole === 'listener' || userRole === 'trial') {
        // Obtener enrollments del estudiante
        const enrollmentsRef = collection(db, 'enrollments');
        const enrollmentsQuery = query(enrollmentsRef, where('studentId', '==', user.uid));
        const enrollmentsSnap = await getDocs(enrollmentsQuery);

        const courseIds = enrollmentsSnap.docs.map(doc => doc.data().courseId);

        // Obtener datos de los cursos
        if (courseIds.length > 0) {
          const coursesRef = collection(db, 'courses');
          const coursesSnap = await getDocs(coursesRef);

          coursesData = coursesSnap.docs
            .filter(doc => courseIds.includes(doc.id))
            .map(doc => {
              const enrollment = enrollmentsSnap.docs.find(e => e.data().courseId === doc.id);
              return {
                id: doc.id,
                ...doc.data(),
                enrollmentId: enrollment?.id,
                enrolledAt: enrollment?.data()?.enrolledAt,
                progress: enrollment?.data()?.progress || 0,
                status: enrollment?.data()?.status || 'active'
              };
            });
        }
      } else if (userRole === 'teacher' || userRole === 'trial_teacher') {
        // Obtener cursos creados por el profesor
        const coursesRef = collection(db, 'courses');
        const coursesQuery = query(coursesRef, where('teacherId', '==', user.uid));
        const coursesSnap = await getDocs(coursesQuery);

        coursesData = coursesSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          isTeacher: true
        }));

        // Contar estudiantes en cada curso
        for (const course of coursesData) {
          const enrollmentsRef = collection(db, 'enrollments');
          const enrollmentsQuery = query(enrollmentsRef, where('courseId', '==', course.id));
          const enrollmentsSnap = await getDocs(enrollmentsQuery);
          course.studentCount = enrollmentsSnap.docs.length;
        }
      }

      logger.debug('ClassesTab: Courses loaded successfully', { count: coursesData.length });
      setCourses(coursesData);
    } catch (err) {
      logger.error('ClassesTab: Error loading courses', err);
      setCourses([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const getFilteredCourses = () => {
    if (filter === 'all') return courses;
    if (filter === 'active') return courses.filter(c => c.status === 'active' || c.isTeacher);
    if (filter === 'completed') return courses.filter(c => c.status === 'completed');
    return courses;
  };

  const filteredCourses = getFilteredCourses();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Filtros */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            filter === 'all'
              ? 'bg-indigo-600 text-white'
              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
          }`}
        >
          Todos ({courses.length})
        </button>
        <button
          onClick={() => setFilter('active')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            filter === 'active'
              ? 'bg-indigo-600 text-white'
              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
          }`}
        >
          Activos ({courses.filter(c => c.status === 'active' || c.isTeacher).length})
        </button>
        {userRole === 'student' && (
          <button
            onClick={() => setFilter('completed')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              filter === 'completed'
                ? 'bg-indigo-600 text-white'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
            }`}
          >
            Completados ({courses.filter(c => c.status === 'completed').length})
          </button>
        )}
      </div>

      {/* Lista de cursos */}
      {filteredCourses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredCourses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              isTeacher={course.isTeacher}
              userRole={userRole}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
          <BookOpen size={48} strokeWidth={2} className="mx-auto text-zinc-300 dark:text-zinc-700 mb-4" />
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
            No hay cursos {filter !== 'all' ? filter + 's' : ''}
          </h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {userRole === 'student'
              ? 'Aún no estás inscrito en ningún curso'
              : 'Aún no has creado ningún curso'}
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * CourseCard - Card individual de curso
 */
function CourseCard({ course, isTeacher, userRole }) {
  const getStatusBadge = () => {
    if (course.status === 'completed') {
      return (
        <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-xs font-semibold">
          <CheckCircle size={14} strokeWidth={2} />
          Completado
        </div>
      );
    }
    if (course.status === 'active' || isTeacher) {
      return (
        <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 text-xs font-semibold">
          <AlertCircle size={14} strokeWidth={2} />
          Activo
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 hover:shadow-lg transition-all cursor-pointer group">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
            {course.name || course.title || 'Curso sin título'}
          </h3>
          {course.description && (
            <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2">
              {course.description}
            </p>
          )}
        </div>
        {getStatusBadge()}
      </div>

      {/* Stats */}
      <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-600 dark:text-zinc-400">
        {isTeacher && (
          <div className="flex items-center gap-1">
            <Users size={16} strokeWidth={2} />
            <span>{course.studentCount || 0} estudiantes</span>
          </div>
        )}

        {!isTeacher && course.progress !== undefined && (
          <div className="flex items-center gap-1">
            <CheckCircle size={16} strokeWidth={2} />
            <span>{course.progress}% completado</span>
          </div>
        )}

        {course.enrolledAt && (
          <div className="flex items-center gap-1">
            <Calendar size={16} strokeWidth={2} />
            <span>Desde {new Date(course.enrolledAt?.toDate()).toLocaleDateString()}</span>
          </div>
        )}

        {course.createdAt && isTeacher && (
          <div className="flex items-center gap-1">
            <Clock size={16} strokeWidth={2} />
            <span>Creado {new Date(course.createdAt?.toDate()).toLocaleDateString()}</span>
          </div>
        )}
      </div>

      {/* Progress bar - Solo para estudiantes */}
      {!isTeacher && course.progress !== undefined && (
        <div className="mt-4">
          <div className="w-full bg-zinc-200 dark:bg-zinc-800 rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full transition-all duration-500"
              style={{ width: `${course.progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default ClassesTab;
