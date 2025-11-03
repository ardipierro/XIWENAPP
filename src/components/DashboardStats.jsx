/**
 * @fileoverview Estadísticas del dashboard con QuickAccessCards
 * @module components/DashboardStats
 */

import PropTypes from 'prop-types';
import {
  Crown,
  Users,
  BookOpen,
  FileText,
  Gamepad2,
  UsersRound
} from 'lucide-react';
import QuickAccessCard from './QuickAccessCard';

/**
 * Grid de estadísticas del dashboard
 * Muestra cards con información rápida y acceso directo
 */
function DashboardStats({
  isAdmin,
  usersCount,
  coursesCount,
  contentCount,
  exercisesCount,
  classesCount,
  onNavigate,
  onCreateUser,
  onCreateCourse,
  onCreateContent,
  onCreateExercise,
  onCreateClass,
  onCreateGroup
}) {
  return (
    <div className="dashboard-content mt-6">
      <div className="quick-access-grid">
        {/* Card de Usuarios (solo admin) o Alumnos (profesor) */}
        <QuickAccessCard
          icon={isAdmin ? Crown : Users}
          title={isAdmin ? "Usuarios" : "Alumnos"}
          count={usersCount}
          countLabel={usersCount === 1 ? "usuario" : "usuarios"}
          onClick={() => onNavigate('users')}
          createLabel={isAdmin ? "Nuevo Usuario" : "Nuevo Alumno"}
          onCreateClick={onCreateUser}
        />

        {/* Card de Cursos */}
        <QuickAccessCard
          icon={BookOpen}
          title="Cursos"
          count={coursesCount}
          countLabel={coursesCount === 1 ? "curso" : "cursos"}
          onClick={() => onNavigate('courses')}
          createLabel="Nuevo Curso"
          onCreateClick={onCreateCourse}
        />

        {/* Card de Contenido */}
        <QuickAccessCard
          icon={FileText}
          title="Contenido"
          count={contentCount}
          countLabel={contentCount === 1 ? "contenido" : "contenidos"}
          onClick={() => onNavigate('content')}
          createLabel="Nuevo Contenido"
          onCreateClick={onCreateContent}
        />

        {/* Card de Ejercicios */}
        <QuickAccessCard
          icon={Gamepad2}
          title="Ejercicios"
          count={exercisesCount}
          countLabel={exercisesCount === 1 ? "ejercicio" : "ejercicios"}
          onClick={() => onNavigate('exercises')}
          createLabel="Nuevo Ejercicio"
          onCreateClick={onCreateExercise}
        />

        {/* Card de Clases */}
        <QuickAccessCard
          icon={UsersRound}
          title="Clases"
          count={classesCount}
          countLabel={classesCount === 1 ? "clase" : "clases"}
          onClick={() => onNavigate('classes')}
          createLabel="Nueva Clase"
          onCreateClick={onCreateClass}
        />

        {/* Card de Grupos */}
        <QuickAccessCard
          icon={UsersRound}
          title="Grupos"
          count={0}
          countLabel="grupos"
          onClick={() => onNavigate('groups')}
          createLabel="Nuevo Grupo"
          onCreateClick={onCreateGroup}
        />
      </div>
    </div>
  );
}

DashboardStats.propTypes = {
  isAdmin: PropTypes.bool.isRequired,
  usersCount: PropTypes.number.isRequired,
  coursesCount: PropTypes.number.isRequired,
  contentCount: PropTypes.number.isRequired,
  exercisesCount: PropTypes.number.isRequired,
  classesCount: PropTypes.number.isRequired,
  onNavigate: PropTypes.func.isRequired,
  onCreateUser: PropTypes.func,
  onCreateCourse: PropTypes.func,
  onCreateContent: PropTypes.func,
  onCreateExercise: PropTypes.func,
  onCreateClass: PropTypes.func,
  onCreateGroup: PropTypes.func
};

export default DashboardStats;
