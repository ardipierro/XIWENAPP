import { useState } from 'react';
import { BookOpen, Crown, Users, FileText, Calendar, Grid3x3, List } from 'lucide-react';
import QuickAccessCard from '../QuickAccessCard';
import SearchBar from '../common/SearchBar';

/**
 * Vista principal del dashboard del profesor
 * Muestra las tarjetas de acceso rápido a las diferentes secciones
 *
 * @param {Object} props - Propiedades del componente
 * @param {Object} props.user - Usuario actual
 * @param {string} props.userRole - Rol del usuario
 * @param {boolean} props.isAdmin - Si el usuario es administrador
 * @param {Array} props.users - Lista de usuarios
 * @param {Array} props.courses - Lista de cursos
 * @param {Array} props.allContent - Lista de contenidos
 * @param {Array} props.allClasses - Lista de clases
 * @param {Function} props.onNavigate - Callback para navegación
 * @param {Function} props.onOpenAddUserModal - Callback para abrir modal de agregar usuario
 * @param {Function} props.onOpenCourseModal - Callback para abrir modal de curso
 * @param {Function} props.onOpenContentModal - Callback para abrir modal de contenido
 * @param {Function} props.onOpenClassModal - Callback para abrir modal de clase
 */
function DashboardMainView({
  user,
  userRole,
  isAdmin,
  users = [],
  courses = [],
  allContent = [],
  allClasses = [],
  onNavigate,
  onOpenAddUserModal,
  onOpenCourseModal,
  onOpenContentModal,
  onOpenClassModal
}) {
  const [dashboardSearchTerm, setDashboardSearchTerm] = useState('');
  const [dashboardViewMode, setDashboardViewMode] = useState('grid');

  // Configuración de las tarjetas del dashboard
  const dashboardCards = [
    {
      id: 'users',
      icon: isAdmin ? Crown : Users,
      title: isAdmin ? "Usuarios" : "Alumnos",
      count: users.length,
      countLabel: users.length === 1 ? "usuario" : "usuarios",
      onClick: () => onNavigate('users'),
      createLabel: isAdmin ? "Nuevo Usuario" : "Nuevo Alumno",
      onCreateClick: () => onOpenAddUserModal && onOpenAddUserModal(true)
    },
    {
      id: 'courses',
      icon: BookOpen,
      title: "Cursos",
      count: courses.length,
      countLabel: courses.length === 1 ? "curso" : "cursos",
      onClick: () => onNavigate('courses'),
      createLabel: "Nuevo Curso",
      onCreateClick: () => {
        if (onOpenCourseModal) onOpenCourseModal(true);
        onNavigate('courses');
      }
    },
    {
      id: 'content',
      icon: FileText,
      title: "Contenidos",
      count: allContent.length,
      countLabel: allContent.length === 1 ? "contenido" : "contenidos",
      onClick: () => onNavigate('content'),
      createLabel: "Nuevo Contenido",
      onCreateClick: () => {
        if (onOpenContentModal) onOpenContentModal(true);
        onNavigate('content');
      }
    },
    {
      id: 'classes',
      icon: Calendar,
      title: "Clases",
      count: allClasses.length,
      countLabel: allClasses.length === 1 ? "clase" : "clases",
      onClick: () => onNavigate('classes'),
      createLabel: "Nueva Clase",
      onCreateClick: () => {
        if (onOpenClassModal) onOpenClassModal(true);
        onNavigate('classes');
      }
    }
  ];

  // Filtrar tarjetas según búsqueda
  const filteredDashboardCards = dashboardCards.filter(card =>
    card.title.toLowerCase().includes(dashboardSearchTerm.toLowerCase())
  );

  return (
    <div className="teacher-dashboard">
      <div className="dashboard-content mt-6">
        {/* Barra de búsqueda y selector de vista */}
        <div className="flex gap-3 items-center mb-6">
          <SearchBar
            value={dashboardSearchTerm}
            onChange={setDashboardSearchTerm}
            placeholder="Buscar secciones..."
            className="flex-1"
          />
          <div className="view-toggle">
            <button
              onClick={() => setDashboardViewMode('grid')}
              className={`view-toggle-btn ${dashboardViewMode === 'grid' ? 'active' : ''}`}
              title="Vista grilla"
            >
              <Grid3x3 size={18} strokeWidth={2} />
            </button>
            <button
              onClick={() => setDashboardViewMode('list')}
              className={`view-toggle-btn ${dashboardViewMode === 'list' ? 'active' : ''}`}
              title="Vista lista"
            >
              <List size={18} strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* Quick Access Cards */}
        <div className={dashboardViewMode === 'grid' ? 'quick-access-grid' : 'quick-access-list'}>
          {filteredDashboardCards.map(card => (
            <QuickAccessCard
              key={card.id}
              icon={card.icon}
              title={card.title}
              count={card.count}
              countLabel={card.countLabel}
              onClick={card.onClick}
              createLabel={card.createLabel}
              onCreateClick={card.onCreateClick}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default DashboardMainView;
