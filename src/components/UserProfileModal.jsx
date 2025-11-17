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
import { Camera, X, Upload, Trash2, User as UserIcon, BookOpen, FileText, Users, Award, Save } from 'lucide-react';
import BaseModal from './common/BaseModal';
import { BaseButton } from './common';
import ProfileTabs from './profile/ProfileTabs';
import InfoTab from './profile/tabs/InfoTab';
import ClassesTab from './profile/tabs/ClassesTab';
import ContentTab from './profile/tabs/ContentTab';
import StudentsTab from './profile/tabs/StudentsTab';
import BadgesTab from './profile/tabs/BadgesTab';
import { AVATARS } from './AvatarSelector';
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
import logger from '../utils/logger';

/**
 * UserProfileModal - Modal universal de perfil
 *
 * @param {boolean} isOpen - Si el modal está abierto
 * @param {function} onClose - Callback al cerrar
 * @param {object} user - Usuario a mostrar
 * @param {string} userRole - Rol del usuario
 * @param {string} currentUserRole - Rol del usuario actual (quien está viendo)
 * @param {boolean} isAdmin - Si el usuario actual es admin
 * @param {function} onUpdate - Callback cuando se actualiza el perfil
 */
function UserProfileModal({
  isOpen,
  onClose,
  user,
  userRole,
  currentUserRole,
  isAdmin = false,
  onUpdate
}) {
  // Estados del perfil
  const [userAvatar, setUserAvatar] = useState('default');
  const [userBanner, setUserBanner] = useState(null);
  const [gamification, setGamification] = useState(null);

  // Estados de edición y navegación
  const [uploading, setUploading] = useState(false);
  const [showAvatarOptions, setShowAvatarOptions] = useState(false);
  const [showBannerMenu, setShowBannerMenu] = useState(false);
  const [activeTab, setActiveTab] = useState('info');
  const [isEditing, setIsEditing] = useState(false);

  // Estados de imagen
  const [uploadedAvatarUrl, setUploadedAvatarUrl] = useState(null);
  const [uploadedBannerUrl, setUploadedBannerUrl] = useState(null);

  // Estados de feedback
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Determinar si está viendo su propio perfil
  const isOwnProfile = user?.uid === user?.uid; // TODO: Comparar con currentUser.uid

  // Cargar datos del perfil
  useEffect(() => {
    const loadProfile = async () => {
      if (user?.uid) {
        try {
          // Cargar avatar
          const avatar = await getUserAvatar(user.uid);
          setUserAvatar(avatar);
          if (avatar && avatar.startsWith('http')) {
            setUploadedAvatarUrl(avatar);
          }

          // Cargar banner
          const banner = await getUserBanner(user.uid);
          if (banner) {
            setUserBanner(banner);
            setUploadedBannerUrl(banner);
          }

          // Cargar gamificación
          const gamData = await getUserGamification(user.uid);
          setGamification(gamData);
        } catch (err) {
          logger.error('Error loading profile:', err);
        }
      }
    };
    if (isOpen) {
      loadProfile();
    }
  }, [user?.uid, isOpen]);

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
    setShowBannerMenu(false);

    try {
      const imageUrl = await uploadBannerImage(user.uid, file);
      await updateUserBanner(user.uid, imageUrl);

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
      setShowBannerMenu(false);
      if (uploadedBannerUrl) {
        await deleteBannerImage(user.uid);
      }
      await updateUserBanner(user.uid, null);
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
      const imageUrl = await uploadAvatarImage(user.uid, file);
      await updateUserAvatar(user.uid, imageUrl);

      setUserAvatar(imageUrl);
      setUploadedAvatarUrl(imageUrl);
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
      if (uploadedAvatarUrl) {
        await deleteAvatarImage(user.uid);
        setUploadedAvatarUrl(null);
      }

      await updateUserAvatar(user.uid, avatarId);
      setUserAvatar(avatarId);
      setShowAvatarOptions(false);
      setSuccess('Avatar actualizado correctamente');

      if (onUpdate) onUpdate();
    } catch (err) {
      logger.error('Error updating avatar:', err);
      setError('Error al actualizar el avatar');
    }
  };

  // Generar gradiente aleatorio para banner por defecto
  const getDefaultBannerGradient = () => {
    const gradients = [
      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
    ];
    const index = user?.email
      ? user.email.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % gradients.length
      : 0;
    return gradients[index];
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

    // Tab de Info - Todos los usuarios
    tabs.push({
      id: 'info',
      label: 'Información',
      icon: UserIcon,
      component: (
        <InfoTab
          user={user}
          userRole={userRole}
          isAdmin={isAdmin}
          isOwnProfile={isOwnProfile}
          onUpdate={onUpdate}
          onEditingChange={handleEditingChange}
        />
      )
    });

    // Tab de Clases - Estudiantes y Profesores
    if (userRole === 'student' || userRole === 'teacher' || userRole === 'trial_teacher') {
      tabs.push({
        id: 'classes',
        label: 'Clases',
        icon: BookOpen,
        component: <ClassesTab user={user} userRole={userRole} />
      });
    }

    // Tab de Contenidos - Solo Estudiantes
    if (userRole === 'student') {
      tabs.push({
        id: 'content',
        label: 'Contenidos',
        icon: FileText,
        component: <ContentTab user={user} />
      });
    }

    // Tab de Estudiantes - Solo Profesores
    if (userRole === 'teacher' || userRole === 'trial_teacher') {
      tabs.push({
        id: 'students',
        label: 'Estudiantes',
        icon: Users,
        component: <StudentsTab user={user} />
      });
    }

    // Tab de Badges - Todos los usuarios
    tabs.push({
      id: 'badges',
      label: 'Gamificación',
      icon: Award,
      component: <BadgesTab user={user} isAdmin={isAdmin} />
    });

    return tabs;
  };

  const tabs = getTabs();

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
      className="!overflow-hidden !h-[90vh] !max-h-[90vh]"
    >
      <div className="flex flex-col h-full overflow-hidden">
        {/* Banner Section - FIJO */}
        <div className="relative h-28 md:h-36 overflow-hidden flex-shrink-0 group">
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
              style={{ background: getDefaultBannerGradient() }}
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

          {/* Overlay con ícono - Solo visible al hover si puede editar */}
          {(isOwnProfile || isAdmin) && (
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200">
              <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <button
                  onClick={() => setShowBannerMenu(!showBannerMenu)}
                  className="w-10 h-10 rounded-full bg-white/90 dark:bg-zinc-900/90
                             backdrop-blur-sm hover:bg-white dark:hover:bg-zinc-800
                             flex items-center justify-center shadow-lg transition-all"
                  aria-label="Editar banner"
                >
                  <Camera size={20} strokeWidth={2} className="text-zinc-900 dark:text-white" />
                </button>

                {/* Menú de opciones de banner */}
                {showBannerMenu && (
                  <div className="absolute bottom-12 right-0 min-w-[180px] bg-white dark:bg-zinc-900
                                  rounded-lg shadow-xl border border-zinc-200 dark:border-zinc-800
                                  overflow-hidden z-20">
                    <label
                      htmlFor="banner-upload"
                      className="flex items-center gap-2 px-4 py-3 hover:bg-zinc-100 dark:hover:bg-zinc-800
                                 cursor-pointer transition-colors text-sm font-medium text-zinc-900 dark:text-white"
                    >
                      <Upload size={16} strokeWidth={2} />
                      {userBanner ? 'Cambiar banner' : 'Subir banner'}
                    </label>
                    <input
                      id="banner-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleBannerUpload}
                      disabled={uploading}
                      className="hidden"
                    />

                    {userBanner && (
                      <button
                        onClick={handleRemoveBanner}
                        className="flex items-center gap-2 px-4 py-3 w-full hover:bg-red-50 dark:hover:bg-red-900/20
                                   transition-colors text-sm font-medium text-red-600 dark:text-red-400"
                      >
                        <Trash2 size={16} strokeWidth={2} />
                        Eliminar banner
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile Header - Avatar + Info - FIJO */}
        <div className="relative px-4 md:px-6 flex-shrink-0 bg-gradient-to-b from-transparent via-black/50 to-black/80 dark:from-transparent dark:via-black/60 dark:to-black/90 border-b border-white/20 dark:border-white/10">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-2 md:gap-3 -mt-10 md:-mt-14 pb-3">
            {/* Avatar Container */}
            <div className="relative group flex-shrink-0">
              <div
                className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden transition-all border-4 border-white shadow-2xl"
                style={{
                  background: 'var(--color-bg-secondary)'
                }}
              >
                {uploadedAvatarUrl ? (
                  <img
                    src={uploadedAvatarUrl}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center"
                    style={{ background: 'var(--color-bg-tertiary)' }}
                  >
                    {(() => {
                      const AvatarIcon = AVATARS[userAvatar]?.icon || AVATARS.default.icon;
                      return <AvatarIcon size={48} strokeWidth={2} />;
                    })()}
                  </div>
                )}
              </div>

              {/* Avatar Edit Overlay - Solo visible al hover */}
              {(isOwnProfile || isAdmin) && (
                <div className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/40 transition-all duration-200">
                  <button
                    onClick={() => setShowAvatarOptions(!showAvatarOptions)}
                    className="absolute bottom-0 right-0 w-8 h-8 md:w-10 md:h-10 rounded-full
                               bg-white dark:bg-zinc-900 border-2 border-white dark:border-zinc-950
                               flex items-center justify-center shadow-lg
                               opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    aria-label="Cambiar avatar"
                  >
                    <Camera size={16} strokeWidth={2} className="text-zinc-900 dark:text-white" />
                  </button>
                </div>
              )}
            </div>

            {/* User Info */}
            <div className="flex-1 text-center sm:text-left mb-1">
              <h2 className="text-xl md:text-2xl font-bold text-white drop-shadow-lg mb-1">
                {user?.displayName || user?.name || user?.email || 'Usuario'}
              </h2>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                {/* Badge de Rol */}
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold text-white bg-indigo-600 shadow-lg">
                  {isAdmin ? 'admin' : userRole}
                </span>

                {/* Stats de gamificación */}
                {gamification && (
                  <>
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/90 text-white shadow-lg backdrop-blur-sm">
                      ⭐ Nivel {gamification.level}
                    </span>
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/90 text-white shadow-lg backdrop-blur-sm">
                      ⚡ {gamification.xp} XP
                    </span>
                    {gamification.streakDays > 0 && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-red-500/90 text-white shadow-lg backdrop-blur-sm">
                        🔥 {gamification.streakDays} días
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

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

        {/* Avatar Options - Expandible - FIJO */}
        {showAvatarOptions && (isOwnProfile || isAdmin) && (
          <div className="px-4 md:px-6 pt-4 flex-shrink-0">
            <div className="rounded-lg p-4 border bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                  Cambiar avatar
                </h3>
                <button
                  onClick={() => setShowAvatarOptions(false)}
                  className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                >
                  <X size={16} strokeWidth={2} />
                </button>
              </div>

              {/* Upload Option */}
              <div className="mb-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
                <label
                  htmlFor="avatar-upload"
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg
                             bg-white dark:bg-zinc-800 border-2 border-zinc-300 dark:border-zinc-700
                             hover:border-indigo-500 dark:hover:border-indigo-500
                             cursor-pointer transition-all text-sm font-semibold"
                >
                  <Upload size={18} strokeWidth={2} />
                  Subir imagen personalizada
                </label>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  disabled={uploading}
                  className="hidden"
                />
                <p className="mt-2 text-xs text-center text-zinc-500 dark:text-zinc-400">
                  JPG, PNG o GIF (máx 5MB)
                </p>
              </div>

              {/* Icon Avatars */}
              <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-2">O elige un ícono:</p>
              <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
                {Object.entries(AVATARS).map(([key, { icon: Icon, label }]) => (
                  <button
                    key={key}
                    className={`aspect-square rounded-lg flex items-center justify-center transition-all ${
                      userAvatar === key && !uploadedAvatarUrl
                        ? 'bg-indigo-100 dark:bg-indigo-900/20 border-2 border-indigo-500'
                        : 'bg-white dark:bg-zinc-800 border-2 border-zinc-200 dark:border-zinc-700 hover:border-indigo-400'
                    }`}
                    onClick={() => handleSelectIconAvatar(key)}
                    title={label}
                  >
                    <Icon size={24} strokeWidth={2} />
                  </button>
                ))}
              </div>
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

        {/* Footer Contextual - FIJO - Solo en InfoTab cuando está editando */}
        {activeTab === 'info' && isEditing && (
          <div className="flex-shrink-0 border-t-2 border-zinc-200 dark:border-zinc-800
                          bg-white dark:bg-zinc-950 px-4 md:px-6 py-3 z-10">
            <div className="flex items-center justify-end gap-3">
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
                disabled={false}
              >
                <Save size={16} className="mr-2" />
                Guardar cambios
              </BaseButton>
            </div>
          </div>
        )}
      </div>
    </BaseModal>
  );
}

export default UserProfileModal;
