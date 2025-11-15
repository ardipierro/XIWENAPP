import logger from '../utils/logger';

import { useState, useEffect } from 'react';
import { User, Mail, Shield, Upload, Camera, X, Edit2, Save } from 'lucide-react';
import BaseModal from './common/BaseModal';
import { BaseButton } from './common';
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

/**
 * UserProfileModal - Modal de perfil de usuario con banner y avatar editables
 *
 * Características:
 * - Banner/imagen de fondo editable
 * - Avatar redondo editable (imagen o icono)
 * - Datos del usuario (editables y no editables)
 * - Mobile First y Dark Mode compatible
 * - Usa BaseModal siguiendo DESIGN_SYSTEM.md
 *
 * @param {boolean} isOpen - Si el modal está abierto
 * @param {function} onClose - Callback al cerrar
 * @param {object} user - Usuario actual (con uid, email, displayName)
 * @param {string} userRole - Rol del usuario
 * @param {function} onUpdate - Callback cuando se actualiza el perfil
 */
function UserProfileModal({ isOpen, onClose, user, userRole, onUpdate }) {
  // Estados del perfil
  const [userAvatar, setUserAvatar] = useState('default');
  const [userBanner, setUserBanner] = useState(null);
  const [displayName, setDisplayName] = useState(user?.displayName || '');

  // Estados de edición
  const [editing, setEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showAvatarOptions, setShowAvatarOptions] = useState(false);

  // Estados de imagen
  const [uploadedAvatarUrl, setUploadedAvatarUrl] = useState(null);
  const [uploadedBannerUrl, setUploadedBannerUrl] = useState(null);

  // Estados de feedback
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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

          // Actualizar nombre
          setDisplayName(user.displayName || '');
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

  // Handlers
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

  const getRoleBadge = () => {
    const badges = {
      admin: { text: 'Administrador', color: '#ef4444' },
      teacher: { text: 'Profesor', color: '#10b981' },
      trial_teacher: { text: 'Profesor (Prueba)', color: '#f59e0b' },
      student: { text: 'Estudiante', color: '#3b82f6' },
      listener: { text: 'Oyente', color: '#6b7280' },
      trial: { text: 'Prueba', color: '#f59e0b' },
    };
    return badges[userRole] || { text: userRole, color: '#6b7280' };
  };

  const roleBadge = getRoleBadge();

  // Generar gradiente aleatorio para banner por defecto
  const getDefaultBannerGradient = () => {
    const gradients = [
      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
      'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
      'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
    ];
    // Usar el email del usuario para generar un índice consistente
    const index = user?.email
      ? user.email.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % gradients.length
      : 0;
    return gradients[index];
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      size="lg"
      showCloseButton={false}
      className="!p-0"
    >
      <div className="flex flex-col -m-6 overflow-hidden" style={{ borderRadius: 'inherit' }}>
        {/* Banner Section */}
        <div className="relative h-40 md:h-48 lg:h-56 overflow-hidden flex-shrink-0" style={{ borderTopLeftRadius: 'inherit', borderTopRightRadius: 'inherit' }}>
          {/* Banner Image o Gradient */}
          {userBanner ? (
            <img
              src={userBanner}
              alt="Banner de perfil"
              className="w-full h-full object-cover"
              style={{ borderTopLeftRadius: 'inherit', borderTopRightRadius: 'inherit' }}
            />
          ) : (
            <div
              className="w-full h-full"
              style={{
                background: getDefaultBannerGradient(),
                borderTopLeftRadius: 'inherit',
                borderTopRightRadius: 'inherit'
              }}
            />
          )}

          {/* Overlay con botones */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-transparent" style={{ borderTopLeftRadius: 'inherit', borderTopRightRadius: 'inherit' }}>
            <div className="flex justify-between items-start p-4">
              {/* Botón editar banner */}
              <label
                className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all backdrop-blur-md"
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  color: 'white'
                }}
                htmlFor="banner-upload"
              >
                <Camera size={18} strokeWidth={2} />
                <span className="hidden sm:inline text-sm font-semibold">
                  {userBanner ? 'Cambiar banner' : 'Agregar banner'}
                </span>
              </label>
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
                className="!p-2 !bg-white/20 backdrop-blur-md hover:!bg-white/30 !text-white !border-white/30"
              />
            </div>

            {/* Botón eliminar banner si existe */}
            {userBanner && (
              <div className="absolute bottom-4 left-4">
                <BaseButton
                  onClick={handleRemoveBanner}
                  variant="danger"
                  size="sm"
                  className="!bg-red-500/80 backdrop-blur-md hover:!bg-red-600/90"
                >
                  Eliminar banner
                </BaseButton>
              </div>
            )}
          </div>
        </div>

        {/* Avatar Section - Positioned over banner */}
        <div className="relative -mt-16 md:-mt-20 px-6 flex-shrink-0">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4">
            {/* Avatar Container */}
            <div className="relative group">
              <div
                className="w-32 h-32 md:w-36 md:h-36 rounded-full overflow-hidden transition-all"
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
                      return <AvatarIcon size={64} strokeWidth={2} />;
                    })()}
                  </div>
                )}
              </div>

              {/* Avatar Edit Overlay */}
              <label
                htmlFor="avatar-upload"
                className="absolute inset-0 flex items-center justify-center rounded-full cursor-pointer transition-all opacity-0 group-hover:opacity-100"
                style={{
                  background: 'rgba(0, 0, 0, 0.6)',
                  backdropFilter: 'blur(4px)'
                }}
              >
                <Camera size={32} strokeWidth={2} className="text-white" />
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
                className="absolute bottom-0 right-0 w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-lg"
                style={{
                  background: 'var(--color-bg-secondary)',
                  border: '2px solid var(--color-bg-primary)',
                  color: 'var(--color-text-primary)'
                }}
              >
                <Edit2 size={18} strokeWidth={2} />
              </button>
            </div>

            {/* User Info */}
            <div className="flex-1 text-center sm:text-left mb-4 sm:mb-2">
              <h2
                className="text-2xl md:text-3xl font-bold mb-2"
                style={{ color: 'var(--color-text-primary)' }}
              >
                {displayName || user?.email || 'Usuario'}
              </h2>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                {/* Badge de Rol */}
                <span
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold text-white"
                  style={{ backgroundColor: roleBadge.color }}
                >
                  <Shield size={16} strokeWidth={2} />
                  {roleBadge.text}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="px-6 py-6 space-y-6">
          {/* Mensajes de feedback */}
          {error && (
            <div
              className="p-3 px-4 rounded-lg text-sm font-semibold border"
              style={{
                background: 'var(--color-error-bg, #fee)',
                color: 'var(--color-error)',
                borderColor: 'var(--color-error)'
              }}
            >
              {error}
            </div>
          )}
          {success && (
            <div
              className="p-3 px-4 rounded-lg text-sm font-semibold border"
              style={{
                background: 'var(--color-success-bg, #efe)',
                color: 'var(--color-success)',
                borderColor: 'var(--color-success)'
              }}
            >
              {success}
            </div>
          )}

          {/* Avatar Options */}
          {showAvatarOptions && (
            <div
              className="rounded-lg p-5 border"
              style={{
                background: 'var(--color-bg-tertiary)',
                borderColor: 'var(--color-border)'
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3
                  className="text-sm font-semibold m-0"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  Selecciona tu avatar
                </h3>
                <button
                  onClick={() => setShowAvatarOptions(false)}
                  className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                >
                  <X size={18} strokeWidth={2} />
                </button>
              </div>

              {/* Upload Option */}
              <div
                className="text-center mb-5 pb-5"
                style={{ borderBottom: '1px solid var(--color-border)' }}
              >
                <label
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-semibold cursor-pointer transition-colors"
                  style={{
                    background: 'var(--color-bg-secondary)',
                    color: 'var(--color-text-primary)',
                    border: '1px solid var(--color-border)'
                  }}
                  htmlFor="avatar-upload-alt"
                >
                  <Upload size={20} strokeWidth={2} />
                  {uploading ? 'Subiendo...' : 'Subir imagen personalizada'}
                </label>
                <input
                  id="avatar-upload-alt"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  disabled={uploading}
                  className="hidden"
                />
                <p
                  className="mt-2 text-xs"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  JPG, PNG o GIF (máx 5MB)
                </p>
              </div>

              {/* Icon Avatars */}
              <div className="grid grid-cols-5 gap-2">
                {Object.entries(AVATARS).map(([key, { icon: Icon, label }]) => (
                  <button
                    key={key}
                    className="aspect-square rounded-lg flex items-center justify-center transition-all"
                    style={{
                      background:
                        userAvatar === key && !uploadedAvatarUrl
                          ? 'var(--color-bg-hover)'
                          : 'var(--color-bg-secondary)',
                      border: `2px solid ${
                        userAvatar === key && !uploadedAvatarUrl
                          ? 'var(--color-border-focus)'
                          : 'var(--color-border)'
                      }`
                    }}
                    onClick={() => handleSelectIconAvatar(key)}
                    title={label}
                  >
                    <Icon size={32} strokeWidth={2} />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* User Details */}
          <div className="space-y-5">
            {/* Email */}
            <div className="flex flex-col gap-2">
              <label
                className="flex items-center gap-2 text-sm font-semibold"
                style={{ color: 'var(--color-text-primary)' }}
              >
                <Mail size={16} strokeWidth={2} />
                Email
              </label>
              <input
                type="email"
                className="w-full px-3.5 py-2.5 text-[15px] rounded-md disabled:opacity-60 disabled:cursor-not-allowed"
                style={{
                  color: 'var(--color-text-primary)',
                  background: 'var(--color-bg-tertiary)',
                  border: '1px solid var(--color-border)'
                }}
                value={user?.email || ''}
                disabled
              />
              <p
                className="text-xs m-0"
                style={{ color: 'var(--color-text-muted)' }}
              >
                El email no se puede cambiar
              </p>
            </div>

            {/* Nombre */}
            <div className="flex flex-col gap-2">
              <label
                className="flex items-center gap-2 text-sm font-semibold"
                style={{ color: 'var(--color-text-primary)' }}
              >
                <User size={16} strokeWidth={2} />
                Nombre
              </label>
              <input
                type="text"
                className="w-full px-3.5 py-2.5 text-[15px] rounded-md disabled:opacity-60 disabled:cursor-not-allowed"
                style={{
                  color: 'var(--color-text-primary)',
                  background: 'var(--color-bg-tertiary)',
                  border: '1px solid var(--color-border)'
                }}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Sin nombre"
                disabled
              />
              <p
                className="text-xs m-0"
                style={{ color: 'var(--color-text-muted)' }}
              >
                El nombre se actualiza desde la configuración de la cuenta
              </p>
            </div>

            {/* Rol */}
            <div className="flex flex-col gap-2">
              <label
                className="flex items-center gap-2 text-sm font-semibold"
                style={{ color: 'var(--color-text-primary)' }}
              >
                <Shield size={16} strokeWidth={2} />
                Rol
              </label>
              <div
                className="inline-flex items-center px-4 py-2 rounded-md text-sm font-semibold text-white w-fit"
                style={{ backgroundColor: roleBadge.color }}
              >
                {roleBadge.text}
              </div>
            </div>
          </div>
        </div>
      </div>
    </BaseModal>
  );
}

export default UserProfileModal;
