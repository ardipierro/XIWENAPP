/**
 * @fileoverview Universal Dashboard
 * Dashboard unificado para todos los roles con permisos y créditos integrados
 * @module components/UniversalDashboard
 */

import logger from '../utils/logger';
import { useState, useEffect, lazy, Suspense } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useViewAs } from '../contexts/ViewAsContext';
import { TopBarProvider, useTopBar } from '../contexts/TopBarContext';
import { usePermissions } from '../hooks/usePermissions';
import { getUserGamification } from '../firebase/gamification';
import UniversalTopBar from './UniversalTopBar';
import UniversalSideMenu from './UniversalSideMenu';
import ViewAsBanner from './ViewAsBanner';
import { BaseLoading } from './common';
import { UniversalCard } from './cards';
import { ResponsiveGrid } from './common';
import { getGridColumnsClass } from './cards/cardConfig';
import {
  Layers,
  BookOpen,
  Users,
  ClipboardCheck,
  Target,
  Calendar,
  Gamepad2,
  TrendingUp,
  Zap
} from 'lucide-react';

// Lazy load de componentes pesados
const UnifiedCalendar = lazy(() => import('./UnifiedCalendar'));
const MessagesPanel = lazy(() => import('./MessagesPanel'));
const HomeworkReviewPanel = lazy(() => import('./HomeworkReviewPanel'));
const AdminPaymentsPanel = lazy(() => import('./AdminPaymentsPanel'));
const ContentManagerTabs = lazy(() => import('./ContentManagerTabs'));
const AttendanceView = lazy(() => import('./AttendanceView'));
const ClassSessionManager = lazy(() => import('./ClassSessionManager'));
const ClassDailyLogManager = lazy(() => import('./ClassDailyLogManager'));
const AnalyticsDashboard = lazy(() => import('./AnalyticsDashboard'));
const CreditManager = lazy(() => import('./CreditManager'));
const SettingsPanel = lazy(() => import('./SettingsPanel'));
const UniversalUserManager = lazy(() => import('./UniversalUserManager'));
const UpcomingClassesBanner = lazy(() => import('./UpcomingClassesBanner'));

// Student views
const MyCourses = lazy(() => import('./student/MyCourses'));
const CourseViewer = lazy(() => import('./student/CourseViewer'));
const ContentPlayer = lazy(() => import('./student/ContentPlayer'));
const StudentHomeworkView = lazy(() => import('./student/StudentHomeworkView'));
const StudentFeesPanel = lazy(() => import('./StudentFeesPanel'));
const StudentSessionsView = lazy(() => import('./StudentSessionsView'));
const StudentDailyLogViewer = lazy(() => import('./student/StudentDailyLogViewer'));

// Games views
const LiveGamesHub = lazy(() => import('./LiveGamesHub'));
const GameContainer = lazy(() => import('./GameContainer'));

// Guardian views
const GuardianView = lazy(() => import('./guardian/GuardianView'));

// ADE1 Content Viewer
const ADE1ContentViewer = lazy(() => import('./ADE1ContentViewer'));

// Modal Layout Test
const ModalLayoutTest = lazy(() => import('./exercises/layouts/ModalLayoutTest'));

/**
 * Vista de inicio con accesos directos
 */
function HomeView({ user, onNavigate }) {
  const { getRoleLabel, can } = usePermissions();
  const [gamificationData, setGamificationData] = useState(null);
  const [loadingGamification, setLoadingGamification] = useState(true);

  // Cargar datos de gamificación si es estudiante
  useEffect(() => {
    const loadGamification = async () => {
      if (user.role === 'student' || user.role === 'trial' || user.role === 'listener') {
        try {
          setLoadingGamification(true);
          const data = await getUserGamification(user.uid);
          setGamificationData(data);
        } catch (err) {
          logger.error('Error cargando datos de progreso:', err, 'HomeView');
        } finally {
          setLoadingGamification(false);
        }
      } else {
        setLoadingGamification(false);
      }
    };

    loadGamification();
  }, [user.uid, user.role]);

  // Definición de tarjetas de acceso directo
  const quickAccessCards = [
    {
      title: 'Crear Contenido',
      description: 'Gestiona contenidos, ejercicios y configura IA',
      icon: Layers,
      path: '/dashboard/unified-content',
      permission: 'create-content'
    },
    {
      title: 'Diario de Clases',
      description: 'Crea y administra diarios de clase',
      icon: BookOpen,
      path: '/dashboard/daily-logs',
      permission: 'manage-classes'
    },
    {
      title: 'Clases',
      description: 'Gestiona sesiones de clase en vivo',
      icon: Users,
      path: '/dashboard/classes',
      permission: 'manage-classes'
    },
    {
      title: 'Revisar Tareas',
      description: 'Corrección de tareas con IA',
      icon: ClipboardCheck,
      path: '/dashboard/homework-review',
      permission: 'grade-assignments'
    },
    {
      title: 'Ejercicio por Turnos',
      description: 'Ejercicio clásico de preguntas',
      icon: Target,
      path: '/dashboard/turn-game',
      permission: null, // Disponible para todos
      hideForStudents: true // Ocultar para estudiantes
    },
    {
      title: 'Calendario',
      description: 'Eventos y clases programadas',
      icon: Calendar,
      path: '/dashboard/calendar',
      permission: null, // Disponible para todos
      hideForStudents: true // Ocultar para estudiantes
    },
    {
      title: 'Ejercicio en Vivo',
      description: 'Ejercicios en tiempo real con estudiantes',
      icon: Gamepad2,
      path: '/dashboard/games',
      permission: 'play-live-games',
      hideForStudents: true // Ocultar para estudiantes
    },
    // ✅ DESACTIVADO TEMPORALMENTE - Tarjeta "Unirse a Juego" para estudiantes
    /*
    {
      title: 'Unirse a Juego',
      description: 'Ingresa el código para unirte a un juego en vivo',
      icon: Gamepad2,
      path: '/join',
      permission: null, // Disponible para todos
      showOnlyForStudents: true, // Mostrar solo para estudiantes
      isExternal: true // Indica que es una ruta externa al dashboard
    },
    */
    {
      title: 'ADE1 2026 - Fonética',
      description: 'Libro interactivo con 120+ slides y ejercicios',
      icon: BookOpen,
      path: '/dashboard/ade1-content',
      permission: null, // Disponible para todos
      hideForStudents: true // Ocultar para estudiantes
    },
    {
      title: '🧪 Test Modal Layout',
      description: 'Prueba el nuevo sistema de renderizado de ejercicios',
      icon: Zap,
      path: '/dashboard/test-modal-layout',
      permission: 'manage-system-settings' // Solo admin
    }
  ];

  // Filtrar tarjetas según permisos y rol
  const visibleCards = quickAccessCards.filter(card => {
    // Ocultar tarjetas marcadas para estudiantes
    // ✅ user es effectiveUser (pasado como prop desde UniversalDashboardInner)
    if (card.hideForStudents && user.role === 'student') {
      return false;
    }

    // Mostrar solo para estudiantes
    if (card.showOnlyForStudents && user.role !== 'student') {
      return false;
    }

    // Verificar permisos
    if (!card.permission) return true; // Sin permiso requerido = visible para todos
    return can(card.permission);
  });

  // Formatear fecha completa con día de la semana
  const today = new Date();
  const dateOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  };
  const formattedDate = today.toLocaleDateString('es-ES', dateOptions);

  return (
    <div className="space-y-6">
      {/* Header - Solo fecha */}
      <div>
        <h1 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">
          {formattedDate}
        </h1>
      </div>

      {/* Banner de Próximas Clases - Solo para estudiantes */}
      {/* ✅ user es effectiveUser (pasado como prop desde UniversalDashboardInner) */}
      {user.role === 'student' && (
        <Suspense fallback={<BaseLoading size="small" text="Cargando próximas clases..." />}>
          <UpcomingClassesBanner student={user} />
        </Suspense>
      )}

      {/* Sección de Progreso - Solo para estudiantes */}
      {(user.role === 'student' || user.role === 'trial' || user.role === 'listener') && (
        <div className="space-y-4">
          <h2 className="text-base md:text-lg font-bold text-gray-900 dark:text-white">
            Progreso
          </h2>

          {loadingGamification ? (
            <div className="flex items-center justify-center py-8">
              <BaseLoading size="sm" text="Cargando progreso..." />
            </div>
          ) : (
            <div className={`${getGridColumnsClass('default')} gap-4`}>
              {/* Tarjeta de Nivel */}
              <div className="bg-indigo-50 dark:bg-indigo-950/20 rounded-lg p-4 border border-indigo-200 dark:border-indigo-800">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-gray-100 dark:bg-indigo-900/40 rounded-lg">
                    <TrendingUp className="text-indigo-600 dark:text-indigo-400" size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Nivel</p>
                    <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                      {gamificationData?.level || 1}
                    </p>
                  </div>
                </div>
              </div>

              {/* Tarjeta de XP */}
              <div className="bg-amber-50 dark:bg-amber-950/20 rounded-lg p-4 border border-amber-200 dark:border-amber-800">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-amber-100 dark:bg-amber-900/40 rounded-lg">
                    <Zap className="text-amber-600 dark:text-amber-400" size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Experiencia (XP)</p>
                    <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                      {gamificationData?.xp || 0}
                    </p>
                  </div>
                </div>
              </div>

              {/* Tarjeta de Racha */}
              <div className="bg-red-50 dark:bg-red-950/20 rounded-lg p-4 border border-red-200 dark:border-red-800">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-red-100 dark:bg-red-900/40 rounded-lg flex items-center justify-center text-2xl">
                    🔥
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Racha</p>
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                      {gamificationData?.streakDays || 0} días
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tarjetas de acceso */}
      <div className={`${getGridColumnsClass('compact')} gap-3`}>
        {visibleCards.map((card) => {
          const CardIcon = card.icon;
          return (
            <UniversalCard
              key={card.path}
              variant="compact"
              size="sm"
              showHeader={false}
              title={card.title}
              onClick={() => onNavigate && onNavigate(card.path)}
            >
              {/* Icono + título en el contenido (sin header) */}
              <div className="flex items-center gap-3">
                {CardIcon && (
                  <div className="flex-shrink-0 p-2 rounded-lg" style={{ backgroundColor: 'var(--color-bg-tertiary)' }}>
                    <CardIcon size={24} strokeWidth={2} style={{ color: 'var(--color-text-primary)' }} />
                  </div>
                )}
                <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                  {card.title}
                </h3>
              </div>
            </UniversalCard>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Placeholder para views no implementadas
 */
function PlaceholderView({ title }) {
  return (
    <div className="universal-dashboard__placeholder">
      <h2>{title}</h2>
      <p>Esta vista será implementada próximamente.</p>
    </div>
  );
}

/**
 * Dashboard Universal - Componente interno que usa el TopBarContext
 */
function UniversalDashboardInner() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { getEffectiveUser, isViewingAs } = useViewAs();
  const { initialized, can } = usePermissions();
  const { registerSidebarControl } = useTopBar();

  // En desktop (>= 1024px) el menú está abierto por defecto, en mobile cerrado
  const [menuOpen, setMenuOpen] = useState(window.innerWidth >= 1024);
  const [currentPath, setCurrentPath] = useState(location.pathname);

  // Usuario efectivo: ViewAs user si está activo, sino el user normal
  const effectiveUser = getEffectiveUser(user);

  // Registrar funciones de control del sidebar en el contexto
  useEffect(() => {
    registerSidebarControl({
      hide: () => setMenuOpen(false),
      show: () => setMenuOpen(true),
      toggle: () => setMenuOpen(prev => !prev)
    });
  }, [registerSidebarControl]);

  // Sincronizar currentPath con la URL actual
  useEffect(() => {
    setCurrentPath(location.pathname);
  }, [location.pathname]);

  // Manejar cambios de tamaño de ventana para el menú lateral
  useEffect(() => {
    const handleResize = () => {
      // En desktop, abrir menú por defecto si está cerrado
      if (window.innerWidth >= 1024 && !menuOpen) {
        setMenuOpen(true);
      }
      // En mobile, cerrar menú si está abierto
      if (window.innerWidth < 1024 && menuOpen) {
        setMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [menuOpen]);

  // Student course navigation states
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [selectedContentId, setSelectedContentId] = useState(null);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState(null);

  // Loading state
  if (authLoading || !initialized) {
    return (
      <div className="universal-dashboard__loading">
        <BaseLoading size="large" text="Cargando dashboard..." />
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return (
      <div className="universal-dashboard__error">
        <p>No estás autenticado. Por favor inicia sesión.</p>
      </div>
    );
  }

  const handleNavigate = (path) => {
    // Si la ruta es externa al dashboard (no empieza con /dashboard), usar navigate
    if (!path.startsWith('/dashboard')) {
      navigate(path);
      // En mobile, cerrar menú al navegar
      if (window.innerWidth < 1024) {
        setMenuOpen(false);
      }
      return;
    }

    // Ruta interna del dashboard: actualizar currentPath
    setCurrentPath(path);
    // En mobile, cerrar menú al navegar
    if (window.innerWidth < 1024) {
      setMenuOpen(false);
    }
  };

  const handleMenuToggle = () => {
    setMenuOpen(!menuOpen);
  };

  // Student course navigation handlers
  const handleSelectCourse = (courseId) => {
    setSelectedCourseId(courseId);
  };

  const handleSelectContent = (contentId) => {
    setSelectedContentId(contentId);
  };

  const handleBackToCourses = () => {
    setSelectedCourseId(null);
    setSelectedContentId(null);
  };

  const handleBackToCourseViewer = () => {
    setSelectedContentId(null);
  };

  /**
   * Renderiza el contenido según la ruta actual
   */
  const renderContent = () => {
    return (
      <Suspense fallback={<BaseLoading size="large" text="Cargando..." />}>
        {(() => {
          switch (currentPath) {
            case '/dashboard':
              return <HomeView user={effectiveUser} onNavigate={handleNavigate} />;

            // Legacy Routes - Default views for each role
            case '/admin':
              // Admin default view -> User Management
              if (!can('view-all-users')) return <PlaceholderView title="Sin acceso" />;
              return <UniversalUserManager user={effectiveUser} userRole={effectiveUser.role} />;

            case '/student':
              // Student default view -> My Courses
              return <MyCourses user={effectiveUser} onSelectCourse={handleSelectCourse} />;

            case '/teacher':
              // Teacher default view -> Class Management
              if (!can('manage-classes')) return <PlaceholderView title="Sin acceso" />;
              return <ClassSessionManager user={effectiveUser} />;

            case '/guardian':
              // Guardian default view -> Guardian View
              if (!can('view-linked-students') && !can('view-all-users')) {
                return <PlaceholderView title="Sin acceso" />;
              }
              return (
                <GuardianView
                  user={effectiveUser}
                  onViewStudentDetails={(studentId) => {
                    logger.debug('Ver detalles de estudiante:', studentId);
                  }}
                />
              );

            case '/dashboard/content':
              return <PlaceholderView title="Mi Contenido" />;

            // CALENDARIO - Todos los roles
            case '/dashboard/calendar':
              return <UnifiedCalendar userId={effectiveUser.uid} userRole={effectiveUser.role} />;

            // MENSAJES - Todos los roles con permiso send-messages
            case '/dashboard/messages':
              if (!can('send-messages')) return <PlaceholderView title="Sin acceso a mensajes" />;
              return <MessagesPanel user={effectiveUser} />;

            // CONTENIDOS - Teachers + Admin (incluye Exercise Builder y Configurar IA en tabs)
            case '/dashboard/unified-content':
              if (!can('create-content')) return <PlaceholderView title="Sin acceso" />;
              return <ContentManagerTabs user={effectiveUser} userRole={effectiveUser.role} />;

            // ADE1 2026 CONTENT VIEWER - Libro interactivo
            case '/dashboard/ade1-content':
              return <ADE1ContentViewer />;

            // ESTUDIANTES (redirige a /users)
            case '/dashboard/students':
              if (!can('view-own-students')) return <PlaceholderView title="Sin acceso" />;
              return <UniversalUserManager user={effectiveUser} userRole={effectiveUser.role} />;

            // CLASES - ClassSessionManager integrado
            case '/dashboard/classes':
              if (!can('manage-classes')) return <PlaceholderView title="Sin acceso" />;
              return <ClassSessionManager user={effectiveUser} />;

            // DIARIOS DE CLASE - ClassDailyLogManager integrado
            case '/dashboard/daily-logs':
              if (!can('manage-classes')) return <PlaceholderView title="Sin acceso" />;
              return <ClassDailyLogManager user={effectiveUser} />;

            // ASISTENCIAS
            case '/dashboard/attendance':
              if (!can('view-class-analytics')) return <PlaceholderView title="Sin acceso" />;
              return <AttendanceView user={effectiveUser} />;

            // REVISAR TAREAS IA - Feature estrella
            case '/dashboard/homework-review':
              if (!can('grade-assignments')) return <PlaceholderView title="Sin acceso" />;
              return <HomeworkReviewPanel user={effectiveUser} />;

            // MIS CURSOS (Students)
            case '/dashboard/my-courses':
              // Si hay contenido seleccionado, mostrar ContentPlayer
              if (selectedContentId && selectedCourseId) {
                return (
                  <ContentPlayer
                    user={effectiveUser}
                    courseId={selectedCourseId}
                    contentId={selectedContentId}
                    onBack={handleBackToCourseViewer}
                  />
                );
              }

              // Si hay curso seleccionado, mostrar CourseViewer
              if (selectedCourseId) {
                return (
                  <CourseViewer
                    user={effectiveUser}
                    courseId={selectedCourseId}
                    onSelectContent={handleSelectContent}
                    onBack={handleBackToCourses}
                  />
                );
              }

              // Por defecto, mostrar lista de cursos
              return <MyCourses user={effectiveUser} onSelectCourse={handleSelectCourse} />;

            // MIS TAREAS (Students) - Sistema de Homework Reviews
            case '/dashboard/my-assignments':
              if (!can('view-own-assignments')) return <PlaceholderView title="Sin acceso" />;
              return (
                <StudentHomeworkView
                  user={effectiveUser}
                />
              );

            // MIS CLASES (Students)
            case '/dashboard/my-classes':
              if (!can('view-all-content')) return <PlaceholderView title="Sin acceso" />;
              return <StudentSessionsView student={effectiveUser} />;

            // DIARIOS DE CLASE (Students - Solo lectura)
            case '/dashboard/my-daily-logs':
              return <StudentDailyLogViewer user={effectiveUser} />;

            // EJERCICIO EN VIVO
            case '/dashboard/games':
              if (!can('play-live-games')) return <PlaceholderView title="Sin acceso" />;
              return <LiveGamesHub user={effectiveUser} />;

            // EJERCICIO POR TURNOS
            case '/dashboard/turn-game':
              return (
                <GameContainer
                  onBack={() => handleNavigate('/dashboard')}
                />
              );

            // VISTA DE TUTOR/GUARDIÁN
            case '/dashboard/guardian':
              // Guardians ven el progreso de sus estudiantes asignados
              // Admin también puede acceder para debugging/soporte
              if (!can('view-linked-students') && !can('view-all-users')) {
                return <PlaceholderView title="Sin acceso" />;
              }
              return (
                <GuardianView
                  user={effectiveUser}
                  onViewStudentDetails={(studentId) => {
                    logger.debug('Ver detalles de estudiante:', studentId);
                    // TODO: Navegar a vista detallada del estudiante
                    // Posiblemente navegar a /student/:studentId o abrir modal
                  }}
                />
              );

            // MIS PAGOS (Students)
            case '/dashboard/my-payments':
              if (!can('view-own-credits')) return <PlaceholderView title="Sin acceso" />;
              return <StudentFeesPanel user={effectiveUser} />;

            // ANALYTICS - AnalyticsDashboard integrado
            case '/dashboard/analytics':
              if (!can('view-own-analytics')) return <PlaceholderView title="Sin acceso" />;
              return <AnalyticsDashboard user={effectiveUser} />;

            // GESTIÓN DE USUARIOS/ESTUDIANTES (Universal)
            case '/dashboard/users':
              // Permitir acceso a admin (view-all-users) y teachers (view-own-students)
              if (!can('view-all-users') && !can('view-own-students')) {
                return <PlaceholderView title="Sin acceso" />;
              }
              return <UniversalUserManager user={effectiveUser} userRole={effectiveUser.role} />;

            // GESTIÓN DE CRÉDITOS (Admin) - CreditManager integrado
            case '/dashboard/credits':
              if (!can('manage-credits')) return <PlaceholderView title="Sin acceso" />;
              return <CreditManager userId={effectiveUser.uid} currentUser={effectiveUser} />;

            // SISTEMA DE PAGOS (Admin)
            case '/dashboard/payments':
              if (!can('manage-credits')) return <PlaceholderView title="Sin acceso" />;
              return <AdminPaymentsPanel />;

            // CONFIGURACIÓN (Admin) - SettingsPanel integrado
            case '/dashboard/system-settings':
              if (!can('manage-system-settings')) return <PlaceholderView title="Sin acceso" />;
              return <SettingsPanel />;

            // TEST MODAL LAYOUT (Admin) - Prueba del nuevo sistema de renderizado
            case '/dashboard/test-modal-layout':
              if (!can('manage-system-settings')) return <PlaceholderView title="Sin acceso" />;
              return <ModalLayoutTest />;

            default:
              return <PlaceholderView title="Página no encontrada" />;
          }
        })()}
      </Suspense>
    );
  };

  return (
    <div className={`universal-dashboard ${isViewingAs ? 'universal-dashboard--viewing-as' : ''}`}>
      {/* ViewAs Banner - Siempre arriba de todo */}
      <ViewAsBanner />

      {/* TopBar */}
      <UniversalTopBar onMenuToggle={handleMenuToggle} menuOpen={menuOpen} />

      {/* SideMenu */}
      <UniversalSideMenu
        isOpen={menuOpen}
        currentPath={currentPath}
        onNavigate={handleNavigate}
      />

      {/* Overlay para mobile */}
      {menuOpen && (
        <div
          className="universal-dashboard__overlay"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* Content Area */}
      <main className={`universal-dashboard__content ${menuOpen ? 'universal-dashboard__content--menu-open' : ''}`}>
        {renderContent()}
      </main>
    </div>
  );
}

/**
 * Dashboard Universal - Wrapper con TopBarProvider
 */
export function UniversalDashboard() {
  return (
    <TopBarProvider>
      <UniversalDashboardInner />
    </TopBarProvider>
  );
}

export default UniversalDashboard;
