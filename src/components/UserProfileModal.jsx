/**
 * @fileoverview Modal universal de perfil de usuario
 * @module components/UserProfileModal
 *
 * Sistema de perfil unificado con:
 * - Banner y avatar editables con hover discreto
 * - Pestañas contextuales por rol
 * - Modo de edición diferenciado (admin vs usuario)
 * - Footer contextual
 * - Gamificación integrada
 * - Mobile First y Dark Mode
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pencil, X, Upload, Trash2, User as UserIcon, BookOpen, FileText, Users, Save, CreditCard, UsersRound, Coins, Eye, Image as ImageIcon, Grid3X3 } from 'lucide-react';
import BaseModal from './common/BaseModal';
import { BaseButton } from './common';
import CategoryBadge from './common/CategoryBadge';
import {
  getBadgeByKey,
  getContrastText,
  getIconLibraryConfig,
  getBadgeSizeClasses,
  getBadgeIconSize,
  getBadgeTextColor,
  getBadgeStyles
} from '../config/badgeSystem';
import * as HeroIcons from '@heroicons/react/24/outline';
import * as HeroIconsSolid from '@heroicons/react/24/solid';
import { useViewAs } from '../contexts/ViewAsContext';
import ProfileTabs from './profile/ProfileTabs';
import InfoTab from './profile/tabs/InfoTab';
import ClassesTab from './profile/tabs/ClassesTab';
import ContentTab from './profile/tabs/ContentTab';
import TasksTab from './profile/tabs/TasksTab';
import StudentsTab from './profile/tabs/StudentsTab';
import CreditsTab from './profile/tabs/CreditsTab';
import GuardiansTab from './profile/tabs/GuardiansTab';
import { AVATARS } from './AvatarSelector';
import UserAvatar from './UserAvatar';
import PicsumSelector from './PicsumSelector';
import { isPicsumUrl } from '../utils/picsumHelpers';
import {
  getUserAvatar,
  updateUserAvatar,
  getUserBanner,
  updateUserBanner
} from '../firebase/firestore';
import {
  uploadAvatarImage,
  deleteAvatarImage,
  uploadBannerImage,
  deleteBannerImage,
  validateImageFile
} from '../firebase/storage';
import { getUserGamification } from '../firebase/gamification';
import { getUserCredits } from '../firebase/credits';
import logger from '../utils/logger';

/**
 * UserProfileModal - Modal universal de perfil
 *
 * @param {boolean} isOpen - Si el modal está abierto
 * @param {function} onClose - Callback al cerrar
 * @param {object} user - Usuario a mostrar
 * @param {string} userRole - Rol del usuario
 * @param {string} currentUserRole - Rol del usuario actual (quien está viendo)
 * @param {object} currentUser - Usuario actual completo (quien está viendo)
 * @param {boolean} isAdmin - Si el usuario actual es admin
 * @param {function} onUpdate - Callback cuando se actualiza el perfil
 */
function UserProfileModal({
  isOpen,
  onClose,
  user,
  userRole,
  currentUserRole,
  currentUser,
  isAdmin = false,
  onUpdate
}) {
  // Estado para forzar re-render cuando cambia la configuración de badges
  const [badgeConfigVersion, setBadgeConfigVersion] = useState(0);
  // Hooks
  const navigate = useNavigate();
  const { startViewingAs } = useViewAs();

  // ✅ CRÍTICO: Normalizar usuario para tener tanto id como uid
  // Los documentos de Firestore tienen 'id' pero las tabs esperan 'uid'
  const normalizedUser = user ? {
    ...user,
    uid: user.uid || user.id, // Asegurar que tenga uid
    id: user.id || user.uid    // Asegurar que tenga id
  } : null;

  // Estados del perfil
  const [avatarKey, setAvatarKey] = useState(0); // Key para forzar recarga del avatar
  const [userBanner, setUserBanner] = useState(null);
  const [gamification, setGamification] = useState(null);
  const [credits, setCredits] = useState(null);
  const [iconLibraryConfig, setIconLibraryConfig] = useState(getIconLibraryConfig());

  // Estados de edición y navegación
  const [uploading, setUploading] = useState(false);
  const [showAvatarOptions, setShowAvatarOptions] = useState(false);
  const [activeTab, setActiveTab] = useState('info');
  const [isEditing, setIsEditing] = useState(false);
  const [imageSelectionTab, setImageSelectionTab] = useState('picsum'); // 'upload', 'picsum', 'icon'

  // Estados de imagen
  const [uploadedAvatarUrl, setUploadedAvatarUrl] = useState(null);
  const [uploadedBannerUrl, setUploadedBannerUrl] = useState(null);

  // Estados de feedback
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Determinar si está viendo su propio perfil
  const isOwnProfile = currentUser?.uid === normalizedUser?.uid;

  // Cargar datos del perfil
  useEffect(() => {
    const loadProfile = async () => {
      if (normalizedUser?.uid) {
        try {
          // Cargar avatar para detectar si es imagen personalizada
          const avatar = await getUserAvatar(normalizedUser.uid);
          if (avatar && avatar.startsWith('http')) {
            setUploadedAvatarUrl(avatar);
          }

          // Cargar banner
          const banner = await getUserBanner(normalizedUser.uid);
          if (banner) {
            setUserBanner(banner);
            setUploadedBannerUrl(banner);
          }

          // Cargar gamificación
          const gamData = await getUserGamification(normalizedUser.uid);
          setGamification(gamData);

          // Cargar créditos
          const creditsData = await getUserCredits(normalizedUser.uid);
          setCredits(creditsData);
        } catch (err) {
          logger.error('Error loading profile:', err);
        }
      }
    };
    if (isOpen) {
      loadProfile();
    }
  }, [normalizedUser?.uid, isOpen]);

  // Escuchar cambios en la configuración de badges
  useEffect(() => {
    const handleBadgeConfigChange = () => {
      setBadgeConfigVersion(prev => prev + 1);
    };

    window.addEventListener('globalBadgeConfigChange', handleBadgeConfigChange);
    return () => {
      window.removeEventListener('globalBadgeConfigChange', handleBadgeConfigChange);
    };
  }, []);

  // Limpiar mensajes después de 3 segundos
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError('');
        setSuccess('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  // Handlers de imagen - Banner
  const handleBannerUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.valid) {
      setError(validation.error);
      return;
    }

    setUploading(true);
    setError('');
    setShowAvatarOptions(false);

    try {
      const imageUrl = await uploadBannerImage(normalizedUser.uid, file);
      await updateUserBanner(normalizedUser.uid, imageUrl);

      setUserBanner(imageUrl);
      setUploadedBannerUrl(imageUrl);
      setSuccess('Banner actualizado correctamente');

      if (onUpdate) onUpdate();
    } catch (err) {
      logger.error('Error uploading banner:', err);
      setError('Error al subir el banner. Intenta de nuevo.');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveBanner = async () => {
    try {
      setShowAvatarOptions(false);
      if (uploadedBannerUrl) {
        await deleteBannerImage(normalizedUser.uid);
      }
      await updateUserBanner(normalizedUser.uid, null);
      setUserBanner(null);
      setUploadedBannerUrl(null);
      setSuccess('Banner eliminado correctamente');
      if (onUpdate) onUpdate();
    } catch (err) {
      logger.error('Error removing banner:', err);
      setError('Error al eliminar el banner');
    }
  };

  // Handlers de imagen - Avatar
  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.valid) {
      setError(validation.error);
      return;
    }

    setUploading(true);
    setError('');
    setShowAvatarOptions(false);

    try {
      const imageUrl = await uploadAvatarImage(normalizedUser.uid, file);
      await updateUserAvatar(normalizedUser.uid, imageUrl);

      setUploadedAvatarUrl(imageUrl);
      setAvatarKey(prev => prev + 1); // Forzar recarga del avatar
      setSuccess('Avatar actualizado correctamente');

      if (onUpdate) onUpdate();
    } catch (err) {
      logger.error('Error uploading avatar:', err);
      setError('Error al subir el avatar. Intenta de nuevo.');
    } finally {
      setUploading(false);
    }
  };

  const handleSelectIconAvatar = async (avatarId) => {
    try {
      // Si había una imagen subida previamente, eliminarla
      if (uploadedAvatarUrl && !isPicsumUrl(uploadedAvatarUrl)) {
        await deleteAvatarImage(normalizedUser.uid);
      }
      setUploadedAvatarUrl(null);

      await updateUserAvatar(normalizedUser.uid, avatarId);
      setShowAvatarOptions(false);
      setAvatarKey(prev => prev + 1); // Forzar recarga del avatar
      setSuccess('Avatar actualizado correctamente');

      if (onUpdate) onUpdate();
    } catch (err) {
      logger.error('Error updating avatar:', err);
      setError('Error al actualizar el avatar');
    }
  };

  // Handler para selección de avatar de Picsum
  const handleSelectPicsumAvatar = async (url, id) => {
    try {
      // Si había una imagen subida previamente (no Picsum), eliminarla
      if (uploadedAvatarUrl && !isPicsumUrl(uploadedAvatarUrl)) {
        await deleteAvatarImage(normalizedUser.uid);
      }

      await updateUserAvatar(normalizedUser.uid, url);
      setUploadedAvatarUrl(url);
      setShowAvatarOptions(false);
      setAvatarKey(prev => prev + 1);
      setSuccess('Avatar de Picsum aplicado correctamente');

      if (onUpdate) onUpdate();
    } catch (err) {
      logger.error('Error updating Picsum avatar:', err);
      setError('Error al aplicar el avatar');
    }
  };

  // Handler para selección de banner de Picsum
  const handleSelectPicsumBanner = async (url, id) => {
    try {
      // Si había un banner subido previamente (no Picsum), eliminarlo
      if (uploadedBannerUrl && !isPicsumUrl(uploadedBannerUrl)) {
        await deleteBannerImage(normalizedUser.uid);
      }

      await updateUserBanner(normalizedUser.uid, url);
      setUserBanner(url);
      setUploadedBannerUrl(url);
      setSuccess('Banner de Picsum aplicado correctamente');

      if (onUpdate) onUpdate();
    } catch (err) {
      logger.error('Error updating Picsum banner:', err);
      setError('Error al aplicar el banner');
    }
  };

  // Handler para modo "Ver como"
  const handleViewAs = () => {
    // Guardar userId para reabrir el perfil al volver
    sessionStorage.setItem('viewAsReturnUserId', normalizedUser.uid || normalizedUser.id);

    // Activar modo "Ver como" - usar user original, startViewingAs hace su propia normalización
    startViewingAs(currentUser, user);

    // Cerrar modal
    onClose();

    // Navegar directamente al home del dashboard
    navigate('/dashboard', { replace: true });
  };

  // Banner con color de fondo usando CSS variables (sin gradientes hardcoded)
  const getDefaultBannerStyle = () => {
    return {
      background: 'var(--color-bg-tertiary)',
    };
  };

  // Callbacks para comunicación con InfoTab
  const handleEditingChange = (editing) => {
    console.log('🔔 handleEditingChange called:', { editing, activeTab });
    setIsEditing(editing);
  };

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setIsEditing(false); // Reset editing al cambiar de pestaña
  };

  // Configurar pestañas según el rol
  const getTabs = () => {
    const tabs = [];

    // Normalizar y validar el rol
    const normalizedRole = (userRole || '').toLowerCase();

    // Definir grupos de roles para facilitar validaciones
    const isStudent = ['student', 'listener', 'trial'].includes(normalizedRole);
    const isTeacher = ['teacher', 'trial_teacher'].includes(normalizedRole);
    const isGuardian = normalizedRole === 'guardian';
    const isAdminRole = normalizedRole === 'admin';

    // Tab de Info - Todos los usuarios
    tabs.push({
      id: 'info',
      label: 'Información',
      icon: UserIcon,
      component: (
        <InfoTab
          user={normalizedUser}
          userRole={userRole}
          isAdmin={isAdmin}
          isOwnProfile={isOwnProfile}
          onUpdate={onUpdate}
          onEditingChange={handleEditingChange}
        />
      )
    });

    // Tab de Clases - Solo Profesores (NO para estudiantes ni guardians)
    // ✅ DESHABILITADO PARA ESTUDIANTES - Solo mostrar pestaña "Información"
    if (isTeacher) {
      tabs.push({
        id: 'classes',
        label: 'Clases',
        icon: BookOpen,
        component: <ClassesTab user={normalizedUser} userRole={userRole} />
      });
    }

    // Tab de Créditos - Solo para NO estudiantes (teachers, admins, guardians)
    if (!isStudent) {
      tabs.push({
        id: 'credits',
        label: 'Créditos',
        icon: CreditCard,
        component: (
          <CreditsTab
            user={normalizedUser}
            currentUser={currentUser || normalizedUser}
            onUpdate={onUpdate}
          />
        )
      });
    }

    // Tab de Contenidos - DESHABILITADO PARA ESTUDIANTES
    // ✅ Solo mostrar pestaña "Información" para alumnos
    /*
    if (isStudent) {
      tabs.push({
        id: 'content',
        label: 'Contenidos',
        icon: FileText,
        component: <ContentTab user={normalizedUser} />
      });
    }
    */

    // Tab de Tareas - DESHABILITADO PARA ESTUDIANTES
    // ✅ Solo mostrar pestaña "Información" para alumnos
    /*
    if (isStudent) {
      tabs.push({
        id: 'tasks',
        label: 'Tareas',
        icon: FileText,
        component: <TasksTab user={normalizedUser} />
      });
    }
    */

    // Tab de Estudiantes - Solo Profesores Y Admins
    // IMPORTANTE: Validar que NO sea estudiante aunque tenga rol 'admin' corrupto
    if ((isTeacher || isAdminRole) && !isStudent) {
      tabs.push({
        id: 'students',
        label: 'Estudiantes',
        icon: Users,
        component: <StudentsTab user={normalizedUser} />
      });
    }

    // Tab de Estudiantes Supervisados - Solo para Tutores
    if (isGuardian) {
      tabs.push({
        id: 'guardians',
        label: 'Estudiantes Supervisados',
        icon: UsersRound,
        component: <GuardiansTab user={normalizedUser} isTutor={true} />
      });
    }

    return tabs;
  };

  const tabs = getTabs();

  /**
   * Renderiza el icono del badge según la configuración global
   * Lee automáticamente el tamaño desde la configuración global
   * @param {string} badgeKey - Key del badge en el sistema (ej: 'GAMIFICATION_LEVEL')
   * @param {string} fallbackEmoji - Emoji a usar si library='emoji'
   * @param {string} textColor - Color de contraste para los iconos (debe coincidir con el texto)
   * @returns {JSX.Element|null} Icono renderizado o null
   */
  const renderBadgeIcon = (badgeKey, fallbackEmoji, textColor) => {
    const library = iconLibraryConfig.library || 'emoji';
    const iconSize = getBadgeIconSize(); // Lee tamaño global

    // Sin icono
    if (library === 'none') return null;

    // HeroIcons (outline o filled)
    if (library === 'heroicon' || library === 'heroicon-filled') {
      const badgeConfig = getBadgeByKey(badgeKey);
      const iconName = badgeConfig?.heroicon;

      if (iconName) {
        const IconComponent = library === 'heroicon-filled'
          ? HeroIconsSolid[iconName]
          : HeroIcons[iconName];

        if (IconComponent) {
          return <IconComponent style={{ width: iconSize, height: iconSize, marginRight: '4px', color: textColor }} />;
        }
      }
    }

    // Emoji (por defecto)
    return <span style={{ marginRight: '4px' }}>{fallbackEmoji}</span>;
  };

  // Debug logs
  console.log('📊 UserProfileModal state:', {
    activeTab,
    isEditing,
    isAdmin,
    userRole,
    shouldShowFooter: activeTab === 'info' && isEditing
  });

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      size="xl"
      showCloseButton={false}
      noPadding={true}
      className="!overflow-hidden !h-[90vh] !max-h-[90vh] md:!max-w-[820px]"
    >
      <div className="flex flex-col h-full overflow-hidden">
        {/* Banner Section - Con avatar y nombre superpuestos */}
        <div className="relative h-64 md:h-72 overflow-hidden flex-shrink-0 group">
          {/* Banner Image o Gradient */}
          {userBanner ? (
            <img
              src={userBanner}
              alt="Banner de perfil"
              className="w-full h-full object-cover"
            />
          ) : (
            <div
              className="w-full h-full"
              style={getDefaultBannerStyle()}
            />
          )}

          {/* Botón cerrar - Siempre visible */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 md:top-4 md:right-4
                       w-8 h-8 rounded-full flex items-center justify-center
                       bg-black/20 backdrop-blur-md hover:bg-black/40
                       text-white transition-all z-10"
            aria-label="Cerrar"
          >
            <X size={18} strokeWidth={2} />
          </button>

          {/* Profile Header - Avatar + Info - ABSOLUTAMENTE dentro del banner */}
          <div className="absolute bottom-0 left-0 right-0 px-4 md:px-6 pb-4">
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-2 md:gap-3">
            {/* Avatar Container */}
            <div className="relative group flex-shrink-0">
              {/* Avatar Universal con sombra */}
              <div className="shadow-2xl rounded-full">
                <UserAvatar
                  key={avatarKey}
                  userId={normalizedUser?.uid}
                  name={normalizedUser?.displayName || normalizedUser?.name}
                  email={normalizedUser?.email}
                  size="xl"
                  showBorder={false}
                />
              </div>

              {/* Avatar Edit Overlay - Solo visible al hover */}
              {(isOwnProfile || isAdmin) && (
                <div className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/10 transition-all duration-200">
                  <button
                    onClick={() => setShowAvatarOptions(!showAvatarOptions)}
                    className="absolute bottom-0 right-0 w-8 h-8 md:w-10 md:h-10 rounded-full
                               bg-white dark:bg-zinc-900 border-2 border-white dark:border-zinc-950
                               flex items-center justify-center shadow-lg
                               opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    aria-label="Cambiar avatar"
                  >
                    <Pencil size={16} strokeWidth={2} className="text-zinc-900 dark:text-white" />
                  </button>
                </div>
              )}
            </div>

            {/* User Info */}
            <div className="flex-1 text-center sm:text-left mb-1">
              <h2 className="text-xl md:text-2xl font-bold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] mb-1">
                {normalizedUser?.displayName || normalizedUser?.name || normalizedUser?.email || 'Usuario'}
              </h2>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                {/* Badge de Rol */}
                {/* ✅ CRÍTICO: Mostrar userRole del perfil, no si quien está viendo es admin */}
                {userRole && (() => {
                  const badgeConfig = getBadgeByKey(`ROLE_${userRole.toUpperCase()}`);
                  const bgColor = badgeConfig?.color || '#6b7280';
                  const badgeStyles = getBadgeStyles(bgColor);
                  return (
                    <span
                      key={`badge-role-${badgeConfigVersion}`}
                      className={`inline-flex items-centers gap-1 ${getBadgeSizeClasses()} rounded-full font-semibold shadow-lg backdrop-blur-sm`}
                      style={badgeStyles}
                    >
                      {renderBadgeIcon(`ROLE_${userRole.toUpperCase()}`, '👤', badgeStyles.color)}
                      {badgeConfig?.label || userRole}
                    </span>
                  );
                })()}

                {/* Badge de Créditos */}
                {credits && (() => {
                  const badgeConfig = getBadgeByKey('GAMIFICATION_CREDITS');
                  // Chequear si el badge está enabled
                  if (badgeConfig?.enabled === false) return null;

                  const bgColor = badgeConfig?.color || '#10b981';
                  const badgeStyles = getBadgeStyles(bgColor);
                  return (
                    <span
                      key={`badge-credits-${badgeConfigVersion}`}
                      className={`inline-flex items-center gap-1 ${getBadgeSizeClasses()} rounded-full font-semibold shadow-lg backdrop-blur-sm`}
                      style={badgeStyles}
                    >
                      {renderBadgeIcon('GAMIFICATION_CREDITS', '💰', badgeStyles.color)}
                      {credits.availableCredits || 0} créditos
                    </span>
                  );
                })()}

                {/* Badges de Gamificación */}
                {gamification && (
                  <>
                    {(() => {
                      const badgeConfig = getBadgeByKey('GAMIFICATION_LEVEL');
                      // Chequear si el badge está enabled
                      if (badgeConfig?.enabled === false) return null;

                      const bgColor = badgeConfig?.color || '#a78bfa';
                      const badgeStyles = getBadgeStyles(bgColor);
                      return (
                        <span
                          key={`badge-level-${badgeConfigVersion}`}
                          className={`inline-flex items-center gap-1 ${getBadgeSizeClasses()} rounded-full font-semibold shadow-lg backdrop-blur-sm`}
                          style={badgeStyles}
                        >
                          {renderBadgeIcon('GAMIFICATION_LEVEL', '⭐', badgeStyles.color)}
                          Nivel {gamification.level || 1}
                        </span>
                      );
                    })()}
                    {(() => {
                      const badgeConfig = getBadgeByKey('GAMIFICATION_XP');
                      // Chequear si el badge está enabled
                      if (badgeConfig?.enabled === false) return null;

                      const bgColor = badgeConfig?.color || '#f59e0b';
                      const badgeStyles = getBadgeStyles(bgColor);
                      return (
                        <span
                          key={`badge-xp-${badgeConfigVersion}`}
                          className={`inline-flex items-center gap-1 ${getBadgeSizeClasses()} rounded-full font-semibold shadow-lg backdrop-blur-sm`}
                          style={badgeStyles}
                        >
                          {renderBadgeIcon('GAMIFICATION_XP', '⚡', badgeStyles.color)}
                          {gamification.xp || 0} XP
                        </span>
                      );
                    })()}
                    {(() => {
                      const badgeConfig = getBadgeByKey('GAMIFICATION_STREAK');
                      // Chequear si el badge está enabled
                      if (badgeConfig?.enabled === false) return null;

                      const bgColor = badgeConfig?.color || '#ef4444';
                      const badgeStyles = getBadgeStyles(bgColor);
                      return (
                        <span
                          key={`badge-streak-${badgeConfigVersion}`}
                          className={`inline-flex items-center gap-1 ${getBadgeSizeClasses()} rounded-full font-semibold shadow-lg backdrop-blur-sm`}
                          style={badgeStyles}
                        >
                          {renderBadgeIcon('GAMIFICATION_STREAK', '🔥', badgeStyles.color)}
                          {gamification.streakDays || 0} días
                        </span>
                      );
                    })()}
                  </>
                )}

                {/* Badge Ver como (clickeable) - Solo para admins */}
                {isAdmin && currentUser?.uid !== normalizedUser?.uid && (() => {
                  const bgColor = '#f97316';
                  const badgeStyles = getBadgeStyles(bgColor);
                  const iconSize = getBadgeIconSize();
                  return (
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewAs();
                      }}
                      className={`inline-flex items-center gap-1 ${getBadgeSizeClasses()} rounded-full font-semibold shadow-lg backdrop-blur-sm cursor-pointer hover:opacity-90 transition-opacity`}
                      style={badgeStyles}
                      title="Cambiar a la vista de este usuario"
                    >
                      <Eye size={iconSize} strokeWidth={2} style={{ color: 'inherit' }} />
                      Ver como
                    </span>
                  );
                })()}
              </div>
            </div>
          </div>
          </div>
        </div>

        {/* Separador después del banner */}
        <div className="flex-shrink-0 border-b border-zinc-200 dark:border-zinc-800"></div>

        {/* Mensajes de feedback - FIJO */}
        {(error || success) && (
          <div className="px-4 md:px-6 pt-4 flex-shrink-0">
            {error && (
              <div className="p-3 px-4 rounded-lg text-sm font-semibold bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800">
                {error}
              </div>
            )}
            {success && (
              <div className="p-3 px-4 rounded-lg text-sm font-semibold bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-800">
                {success}
              </div>
            )}
          </div>
        )}

        {/* Avatar & Banner Options - Expandible con Tabs */}
        {showAvatarOptions && (isOwnProfile || isAdmin) && (
          <div className="px-4 md:px-6 pt-4 flex-shrink-0 max-h-[50vh] overflow-y-auto">
            <div className="rounded-lg p-4 border bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                  Personalizar perfil
                </h3>
                <button
                  onClick={() => setShowAvatarOptions(false)}
                  className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                >
                  <X size={16} strokeWidth={2} />
                </button>
              </div>

              {/* Tabs de selección */}
              <div className="flex gap-1 mb-4 p-1 bg-zinc-200 dark:bg-zinc-800 rounded-lg">
                <button
                  onClick={() => setImageSelectionTab('picsum')}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs font-semibold transition-all ${
                    imageSelectionTab === 'picsum'
                      ? 'bg-white dark:bg-zinc-700 text-purple-600 dark:text-purple-400 shadow-sm'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                  }`}
                >
                  <ImageIcon size={14} strokeWidth={2} />
                  Galería
                </button>
                <button
                  onClick={() => setImageSelectionTab('icon')}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs font-semibold transition-all ${
                    imageSelectionTab === 'icon'
                      ? 'bg-white dark:bg-zinc-700 text-purple-600 dark:text-purple-400 shadow-sm'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                  }`}
                >
                  <Grid3X3 size={14} strokeWidth={2} />
                  Iconos
                </button>
                <button
                  onClick={() => setImageSelectionTab('upload')}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs font-semibold transition-all ${
                    imageSelectionTab === 'upload'
                      ? 'bg-white dark:bg-zinc-700 text-purple-600 dark:text-purple-400 shadow-sm'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                  }`}
                >
                  <Upload size={14} strokeWidth={2} />
                  Subir
                </button>
              </div>

              {/* Tab: Galería Picsum */}
              {imageSelectionTab === 'picsum' && (
                <div className="space-y-6">
                  {/* Avatar Picsum */}
                  <div>
                    <h4 className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-3 flex items-center gap-2">
                      <UserIcon size={14} strokeWidth={2} />
                      Avatar
                    </h4>
                    <PicsumSelector
                      type="avatar"
                      currentUrl={uploadedAvatarUrl}
                      user={normalizedUser}
                      onSelect={handleSelectPicsumAvatar}
                      showAutoSelect={true}
                      compact={false}
                    />
                  </div>

                  {/* Banner Picsum */}
                  <div className="pt-4 border-t border-zinc-200 dark:border-zinc-700">
                    <h4 className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-3 flex items-center gap-2">
                      <ImageIcon size={14} strokeWidth={2} />
                      Banner
                    </h4>
                    <PicsumSelector
                      type="banner"
                      currentUrl={userBanner}
                      user={normalizedUser}
                      onSelect={handleSelectPicsumBanner}
                      showAutoSelect={true}
                      compact={false}
                    />
                    {userBanner && (
                      <button
                        onClick={handleRemoveBanner}
                        className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg
                                   bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800
                                   hover:bg-red-100 dark:hover:bg-red-900/30
                                   transition-all text-sm font-semibold text-red-600 dark:text-red-400"
                      >
                        <Trash2 size={16} strokeWidth={2} />
                        Eliminar banner
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Tab: Iconos */}
              {imageSelectionTab === 'icon' && (
                <div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-3">
                    Elige un ícono como avatar:
                  </p>
                  <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-9 gap-2">
                    {Object.entries(AVATARS).map(([key, { icon: Icon, label }]) => (
                      <button
                        key={key}
                        className={`aspect-square rounded-lg flex items-center justify-center transition-all ${
                          !uploadedAvatarUrl && !isPicsumUrl(uploadedAvatarUrl)
                            ? 'bg-purple-50 dark:bg-purple-900/20 border-2 border-purple-400 dark:border-purple-600'
                            : 'bg-white dark:bg-zinc-800 border-2 border-zinc-200 dark:border-zinc-700 hover:border-purple-400 dark:hover:border-purple-500'
                        }`}
                        onClick={() => handleSelectIconAvatar(key)}
                        title={label}
                      >
                        <Icon size={24} strokeWidth={2} />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab: Subir imagen */}
              {imageSelectionTab === 'upload' && (
                <div className="space-y-4">
                  {/* Upload Avatar */}
                  <div>
                    <h4 className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-2 flex items-center gap-2">
                      <UserIcon size={14} strokeWidth={2} />
                      Subir avatar personalizado
                    </h4>
                    <label
                      htmlFor="avatar-upload"
                      className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg
                                 bg-white dark:bg-zinc-800 border-2 border-dashed border-zinc-300 dark:border-zinc-600
                                 hover:border-purple-400 dark:hover:border-purple-500
                                 cursor-pointer transition-all text-sm font-semibold"
                    >
                      <Upload size={18} strokeWidth={2} />
                      {uploading ? 'Subiendo...' : 'Elegir imagen'}
                    </label>
                    <input
                      id="avatar-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      disabled={uploading}
                      className="hidden"
                    />
                    <p className="mt-1 text-xs text-center text-zinc-400">
                      JPG, PNG o GIF (máx 5MB)
                    </p>
                  </div>

                  {/* Upload Banner */}
                  <div className="pt-4 border-t border-zinc-200 dark:border-zinc-700">
                    <h4 className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-2 flex items-center gap-2">
                      <ImageIcon size={14} strokeWidth={2} />
                      Subir banner personalizado
                    </h4>
                    <label
                      htmlFor="banner-upload-2"
                      className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg
                                 bg-white dark:bg-zinc-800 border-2 border-dashed border-zinc-300 dark:border-zinc-600
                                 hover:border-purple-400 dark:hover:border-purple-500
                                 cursor-pointer transition-all text-sm font-semibold"
                    >
                      <Upload size={18} strokeWidth={2} />
                      {uploading ? 'Subiendo...' : (userBanner ? 'Cambiar banner' : 'Elegir imagen')}
                    </label>
                    <input
                      id="banner-upload-2"
                      type="file"
                      accept="image/*"
                      onChange={handleBannerUpload}
                      disabled={uploading}
                      className="hidden"
                    />
                    <p className="mt-1 text-xs text-center text-zinc-400">
                      Recomendado: 800x200px
                    </p>
                    {userBanner && (
                      <button
                        onClick={handleRemoveBanner}
                        className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg
                                   bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800
                                   hover:bg-red-100 dark:hover:bg-red-900/30
                                   transition-all text-sm font-semibold text-red-600 dark:text-red-400"
                      >
                        <Trash2 size={16} strokeWidth={2} />
                        Eliminar banner
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tabs Section - SCROLLEABLE */}
        <div className="flex-1 overflow-hidden min-h-0">
          <ProfileTabs
            tabs={tabs}
            defaultTab="info"
            onTabChange={handleTabChange}
          />
        </div>

        {/* Footer - SIEMPRE VISIBLE */}
        <div
          className="flex items-center justify-end gap-3 px-6 py-5 shrink-0"
        >
            {activeTab === 'info' && (
              <>
                {isEditing ? (
                  <>
                    <BaseButton
                      onClick={() => setIsEditing(false)}
                      variant="ghost"
                      size="md"
                    >
                      Cancelar
                    </BaseButton>
                    <BaseButton
                      type="submit"
                      form="profile-info-form"
                      variant="primary"
                      size="md"
                    >
                      <Save size={16} className="mr-2" />
                      Guardar
                    </BaseButton>
                  </>
                ) : (
                  <BaseButton
                    onClick={() => setIsEditing(true)}
                    variant="primary"
                    size="md"
                  >
                    Editar perfil
                  </BaseButton>
                )}
              </>
            )}
        </div>
      </div>
    </BaseModal>
  );
}

export default UserProfileModal;
