import { useState, useCallback } from 'react';
import logger from '../utils/logger';

/**
 * Hook para gestión de navegación de pantallas (Admin/Teacher)
 * Maneja: currentScreen, modales, sesiones seleccionadas, navegación back
 */
export function useScreenNavigation() {
  // Screen states
  const [currentScreen, setCurrentScreen] = useState('dashboard');
  const [selectedExerciseId, setSelectedExerciseId] = useState(null);
  const [selectedWhiteboardSession, setSelectedWhiteboardSession] = useState(null);
  const [selectedExcalidrawSession, setSelectedExcalidrawSession] = useState(null);
  const [selectedLiveClass, setSelectedLiveClass] = useState(null);
  const [liveGameSessionId, setLiveGameSessionId] = useState(null);
  const [editSessionId, setEditSessionId] = useState(null); // For editing session from calendar
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [selectedUserProfile, setSelectedUserProfile] = useState(null);

  // Manager refresh keys (to force remount after returning from fullscreen)
  const [whiteboardManagerKey, setWhiteboardManagerKey] = useState(0);
  const [excalidrawManagerKey, setExcalidrawManagerKey] = useState(0);

  // Modal states for "Create New" quick actions
  const [openCourseModal, setOpenCourseModal] = useState(false);
  const [openContentModal, setOpenContentModal] = useState(false);
  const [openClassModal, setOpenClassModal] = useState(false);

  // Collapsible menu states
  const [adminSectionExpanded, setAdminSectionExpanded] = useState(true);
  const [teachingSectionExpanded, setTeachingSectionExpanded] = useState(false);

  // ViewAs return handling
  const [hasProcessedReturn, setHasProcessedReturn] = useState(false);

  // Dashboard view states (grid/list, search)
  const [dashboardSearchTerm, setDashboardSearchTerm] = useState('');
  const [dashboardViewMode, setDashboardViewMode] = useState('grid');
  const [studentsSearchTerm, setStudentsSearchTerm] = useState('');
  const [studentsViewMode, setStudentsViewMode] = useState('grid');

  // Users panel view states (table/grid/list, search, role filter)
  const [usersSearchTerm, setUsersSearchTerm] = useState('');
  const [usersViewMode, setUsersViewMode] = useState('table'); // 'table', 'grid', 'list'
  const [usersRoleFilter, setUsersRoleFilter] = useState('all'); // 'all', 'students', 'teachers', 'admins'

  /**
   * Action map: Menu action -> Screen name
   * Usado por handleMenuAction para mapear clicks del SideMenu a screens
   */
  const ACTION_MAP = {
    'dashboard': 'dashboard',
    'users': 'users',
    'students': 'students',
    'courses': 'courses',
    'content': 'content',
    'unifiedContent': 'unifiedContent', // Unified Content Manager (NEW)
    'classes': 'classes',
    'classSessions': 'classSessions', // Unified Class Sessions (LiveKit + Whiteboards)
    'exercises': 'exercises',
    'analytics': 'analytics',
    'attendance': 'attendance',
    'whiteboardSessions': 'whiteboardSessions',
    'excalidrawSessions': 'excalidrawSessions',
    'liveClasses': 'liveClasses',
    'liveGame': 'liveGame', // Live Game Setup
    'setup': 'setup', // Game Setup (GameContainer)
    'homeworkReview': 'homeworkReview', // Homework Review Panel (Teacher/Admin)
    'calendar': 'calendar', // Unified Calendar (Teacher/Student)
    'quickCorrection': 'quickCorrection', // Quick Homework Correction (Student)
    'gamification': 'gamification', // Gamification Panel (Student)
    'messages': 'messages', // Messages Panel (Teacher/Student)
    'payments': 'payments', // Payments Panel (Admin)
    'aiConfig': 'aiConfig', // AI Configuration (Admin)
    'imageProviders': 'imageProviders', // Image Providers Configuration (Admin)
    'settings': 'settings', // Settings (Admin)
    'themeBuilder': 'themeBuilder', // Theme Builder (Admin/Teacher)
    'exerciseBuilder': 'exerciseBuilder', // Exercise Builder (Admin/Teacher)
    'designLab': 'designLab', // Design Lab - Theme Tester (Admin/Teacher)
    'interactiveBook': 'interactiveBook', // Interactive Book Viewer (Admin/Teacher)
  };

  /**
   * Navegar a un screen desde el menú lateral
   */
  const handleMenuAction = useCallback((action) => {
    const screen = ACTION_MAP[action];
    if (screen) {
      logger.debug(`📍 [Navigation] Menu action: ${action} -> Screen: ${screen}`);
      setCurrentScreen(screen);
      setSelectedExerciseId(null);
      setSelectedWhiteboardSession(null);
    } else {
      logger.warn(`⚠️ [Navigation] Unknown menu action: ${action}`);
    }
  }, []);

  /**
   * Volver al dashboard principal (desde cualquier pantalla)
   */
  const handleBackToDashboard = useCallback(() => {
    logger.debug('🏠 [Navigation] Back to dashboard');
    setCurrentScreen('dashboard');
    setSelectedExerciseId(null);
    setShowUserProfile(false);
    setSelectedUserProfile(null);
    setOpenCourseModal(false);
    setOpenContentModal(false);
    setOpenClassModal(false);
  }, []);

  /**
   * Navegar a reproducir ejercicio
   */
  const handlePlayExercise = useCallback((exerciseId) => {
    logger.debug(`🎮 [Navigation] Play exercise: ${exerciseId}`);
    setSelectedExerciseId(exerciseId);
    setCurrentScreen('playExercise');
  }, []);

  /**
   * Navegar a pizarra blanca (Whiteboard)
   */
  const handleOpenWhiteboard = useCallback((session = null) => {
    logger.debug(`🎨 [Navigation] Open whiteboard`, session);
    setSelectedWhiteboardSession(session);
    setCurrentScreen('whiteboard');
  }, []);

  /**
   * Navegar a pizarra Excalidraw
   */
  const handleOpenExcalidraw = useCallback((session = null) => {
    logger.debug(`✏️ [Navigation] Open Excalidraw`, session);
    setSelectedExcalidrawSession(session);
    setCurrentScreen('excalidrawWhiteboard');
  }, []);

  /**
   * Navegar de regreso desde pizarra blanca (fuerza re-render del manager)
   */
  const handleBackFromWhiteboard = useCallback(() => {
    logger.debug('🔙 [Navigation] Back from whiteboard');
    setWhiteboardManagerKey(prev => prev + 1);
    setCurrentScreen('whiteboardSessions');
  }, []);

  /**
   * Navegar de regreso desde Excalidraw (fuerza re-render del manager)
   */
  const handleBackFromExcalidraw = useCallback(() => {
    logger.debug('🔙 [Navigation] Back from Excalidraw');
    setExcalidrawManagerKey(prev => prev + 1);
    setCurrentScreen('excalidrawSessions');
  }, []);

  /**
   * Iniciar clase en vivo
   */
  const handleStartLiveClass = useCallback((liveClass) => {
    logger.debug(`👥 [Navigation] Start live class:`, liveClass);
    setSelectedLiveClass(liveClass);
    setCurrentScreen('liveClassRoom');
  }, []);

  /**
   * Iniciar proyección de juego en vivo
   */
  const handleStartLiveGame = useCallback((sessionId) => {
    logger.debug(`🎮 [Navigation] Start live game projection: ${sessionId}`);
    setLiveGameSessionId(sessionId);
    setCurrentScreen('liveGameProjection');
  }, []);

  /**
   * Abrir perfil de usuario
   */
  const handleOpenUserProfile = useCallback((userData) => {
    logger.debug(`👤 [Navigation] Open user profile:`, userData);
    setSelectedUserProfile(userData);
    setShowUserProfile(true);
  }, []);

  /**
   * Cerrar perfil de usuario
   */
  const handleCloseUserProfile = useCallback(() => {
    logger.debug('❌ [Navigation] Close user profile');
    setShowUserProfile(false);
    setSelectedUserProfile(null);
  }, []);

  /**
   * Navegar con modal abierto (para quick actions: Crear curso, contenido, etc.)
   */
  const navigateToWithModal = useCallback((screen, modalType) => {
    logger.debug(`🚀 [Navigation] Navigate to ${screen} with modal: ${modalType}`);
    setCurrentScreen(screen);

    if (modalType === 'course') setOpenCourseModal(true);
    else if (modalType === 'content') setOpenContentModal(true);
    else if (modalType === 'class') setOpenClassModal(true);
  }, []);

  return {
    // Screen states
    currentScreen,
    selectedExerciseId,
    selectedWhiteboardSession,
    selectedExcalidrawSession,
    selectedLiveClass,
    liveGameSessionId,
    editSessionId,
    showUserProfile,
    selectedUserProfile,

    // Manager refresh keys
    whiteboardManagerKey,
    excalidrawManagerKey,

    // Modal states
    openCourseModal,
    openContentModal,
    openClassModal,

    // Collapsible menu states
    adminSectionExpanded,
    teachingSectionExpanded,

    // ViewAs return
    hasProcessedReturn,

    // Dashboard view states
    dashboardSearchTerm,
    dashboardViewMode,
    studentsSearchTerm,
    studentsViewMode,

    // Users panel view states
    usersSearchTerm,
    usersViewMode,
    usersRoleFilter,

    // Direct setters (para cuando los componentes hijos necesiten actualizar)
    setCurrentScreen,
    setSelectedExerciseId,
    setSelectedWhiteboardSession,
    setSelectedExcalidrawSession,
    setSelectedLiveClass,
    setLiveGameSessionId,
    setEditSessionId,
    setShowUserProfile,
    setSelectedUserProfile,
    setOpenCourseModal,
    setOpenContentModal,
    setOpenClassModal,
    setAdminSectionExpanded,
    setTeachingSectionExpanded,
    setHasProcessedReturn,
    setDashboardSearchTerm,
    setDashboardViewMode,
    setStudentsSearchTerm,
    setStudentsViewMode,
    setUsersSearchTerm,
    setUsersViewMode,
    setUsersRoleFilter,
    setWhiteboardManagerKey,
    setExcalidrawManagerKey,

    // Navigation actions
    handleMenuAction,
    handleBackToDashboard,
    handlePlayExercise,
    handleOpenWhiteboard,
    handleOpenExcalidraw,
    handleBackFromWhiteboard,
    handleBackFromExcalidraw,
    handleStartLiveClass,
    handleStartLiveGame,
    handleOpenUserProfile,
    handleCloseUserProfile,
    navigateToWithModal
  };
}
