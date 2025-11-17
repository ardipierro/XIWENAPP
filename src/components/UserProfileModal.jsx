/**
 * @fileoverview Modal universal de perfil de usuario
 * @module components/UserProfileModal
 *
 * Sistema de perfil unificado con:
 * - Banner y avatar editables
 * - Pestañas contextuales por rol
 * - Modo de edición diferenciado (admin vs usuario)
 * - Gamificación integrada
 * - Mobile First y Dark Mode
 */

import { useState, useEffect } from 'react';
import { Camera, X, Edit2, User as UserIcon, BookOpen, FileText, Users, Award } from 'lucide-react';
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

  // Estados de edición
  const [uploading, setUploading] = useState(false);
  const [showAvatarOptions, setShowAvatarOptions] = useState(false);

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

  // Handlers de imagen
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

  const handleRemoveBanner = async () => {
    try {
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

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      size="xl"
      showCloseButton={false}
      noPadding={true}
      className="!overflow-hidden !max-h-[90vh]"
    >
      <div className="flex flex-col h-full max-h-[90vh]">
        {/* Banner Section */}
        <div className="relative h-32 md:h-40 overflow-hidden flex-shrink-0">
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

          {/* Overlay con botones */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-transparent">
            <div className="flex justify-between items-start p-3 md:p-4">
              {/* Botón editar banner - Solo si es su perfil o es admin */}
              {(isOwnProfile || isAdmin) && (
                <label
                  className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all backdrop-blur-md text-xs md:text-sm font-semibold"
                  style={{
                    background: 'rgba(255, 255, 255, 0.2)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    color: 'white'
                  }}
                  htmlFor="banner-upload"
                >
                  <Camera size={16} strokeWidth={2} />
                  <span className="hidden sm:inline">
                    {userBanner ? 'Cambiar banner' : 'Agregar banner'}
                  </span>
                </label>
              )}
              <input
                id="banner-upload"
                type="file"
                accept="image/*"
                onChange={handleBannerUpload}
                disabled={uploading}
                className="hidden"
              />

              {/* Botón cerrar */}
              <BaseButton
                onClick={onClose}
                variant="ghost"
                size="sm"
                icon={X}
                className="!p-2 !bg-white/20 backdrop-blur-md hover:!bg-white/30 !text-white !border-white/30 ml-auto"
              />
            </div>

            {/* Botón eliminar banner si existe */}
            {userBanner && (isOwnProfile || isAdmin) && (
              <div className="absolute bottom-3 left-3">
                <BaseButton
                  onClick={handleRemoveBanner}
                  variant="danger"
                  size="sm"
                  className="!bg-red-500/80 backdrop-blur-md hover:!bg-red-600/90 text-xs"
                >
                  Eliminar
                </BaseButton>
              </div>
            )}
          </div>
        </div>

        {/* Profile Header - Avatar + Info */}
        <div className="relative px-4 md:px-6 flex-shrink-0 bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-3 md:gap-4 -mt-12 md:-mt-16 pb-4">
            {/* Avatar Container */}
            <div className="relative group flex-shrink-0">
              <div
                className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden transition-all"
                style={{
                  background: 'var(--color-bg-secondary)',
                  border: '4px solid var(--color-bg-primary)',
                  boxShadow: '0 8px 16px rgba(0, 0, 0, 0.15)'
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

              {/* Avatar Edit Overlay - Solo si es su perfil o es admin */}
              {(isOwnProfile || isAdmin) && (
                <>
                  <label
                    htmlFor="avatar-upload"
                    className="absolute inset-0 flex items-center justify-center rounded-full cursor-pointer transition-all opacity-0 group-hover:opacity-100"
                    style={{
                      background: 'rgba(0, 0, 0, 0.6)',
                      backdropFilter: 'blur(4px)'
                    }}
                  >
                    <Camera size={24} strokeWidth={2} className="text-white" />
                  </label>
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    disabled={uploading}
                    className="hidden"
                  />

                  {/* Botón de opciones de avatar */}
                  <button
                    onClick={() => setShowAvatarOptions(!showAvatarOptions)}
                    className="absolute bottom-0 right-0 w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-lg"
                    style={{
                      background: 'var(--color-bg-secondary)',
                      border: '2px solid var(--color-bg-primary)',
                      color: 'var(--color-text-primary)'
                    }}
                  >
                    <Edit2 size={14} strokeWidth={2} />
                  </button>
                </>
              )}
            </div>

            {/* User Info */}
            <div className="flex-1 text-center sm:text-left mb-2">
              <h2 className="text-xl md:text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">
                {user?.displayName || user?.name || user?.email || 'Usuario'}
              </h2>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                {/* Badge de Rol */}
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold text-white bg-indigo-600">
                  {userRole}
                </span>

                {/* Stats de gamificación */}
                {gamification && (
                  <>
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400">
                      ⭐ Nivel {gamification.level}
                    </span>
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400">
                      ⚡ {gamification.xp} XP
                    </span>
                    {gamification.streakDays > 0 && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400">
                        🔥 {gamification.streakDays} días
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Mensajes de feedback */}
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

        {/* Avatar Options - Expandible */}
        {showAvatarOptions && (isOwnProfile || isAdmin) && (
          <div className="px-4 md:px-6 pt-4 flex-shrink-0">
            <div className="rounded-lg p-4 border bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                  Selecciona tu avatar
                </h3>
                <button
                  onClick={() => setShowAvatarOptions(false)}
                  className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                >
                  <X size={16} strokeWidth={2} />
                </button>
              </div>

              {/* Icon Avatars */}
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

        {/* Tabs Section - Scrollable */}
        <div className="flex-1 overflow-hidden">
          <ProfileTabs tabs={tabs} defaultTab="info" />
        </div>
      </div>
    </BaseModal>
  );
}

export default UserProfileModal;
