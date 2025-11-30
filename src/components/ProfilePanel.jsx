import logger from '../utils/logger';

import { useState, useEffect } from 'react';
import { User, Mail, Shield, Upload, X, ImageIcon, Sparkles, Check } from 'lucide-react';
import { getUserAvatar, updateUserAvatar, getUserBanner, updateUserBanner } from '../firebase/firestore';
import { uploadAvatarImage, deleteAvatarImage, uploadBannerImage, deleteBannerImage } from '../firebase/storage';
import { AVATARS } from './AvatarSelector';
import AvatarSelector from './AvatarSelector';
import UserAvatar from './UserAvatar';
import { BaseButton, CategoryBadge, BaseAlert } from './common';
import { PRESET_BANNERS, generateUserBanner } from '../utils/profileAssets';
import { useTheme } from '../contexts/ThemeContext';

function ProfilePanel({ user, userRole, onClose, onUpdate }) {
  const { theme } = useTheme();
  const [avatarKey, setAvatarKey] = useState(0); // Key para forzar recarga del avatar
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [uploading, setUploading] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState(null);
  const [currentBanner, setCurrentBanner] = useState(null);
  const [currentAvatar, setCurrentAvatar] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAvatarSelector, setShowAvatarSelector] = useState(false);
  const [showBannerOptions, setShowBannerOptions] = useState(false);

  useEffect(() => {
    const loadUserAssets = async () => {
      if (user?.uid) {
        // Cargar avatar
        const avatar = await getUserAvatar(user.uid);
        setCurrentAvatar(avatar);
        if (avatar && avatar.startsWith('http')) {
          setUploadedImageUrl(avatar);
        }

        // Cargar banner
        const banner = await getUserBanner(user.uid);
        setCurrentBanner(banner);
      }
    };
    loadUserAssets();
  }, [user?.uid]);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      setError('Por favor selecciona un archivo de imagen válido');
      return;
    }

    // Validar tamaño (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError('La imagen no debe superar 5MB');
      return;
    }

    setUploading(true);
    setError('');

    try {
      // Subir imagen a Firebase Storage
      const imageUrl = await uploadAvatarImage(user.uid, file);

      // Guardar URL en Firestore
      await updateUserAvatar(user.uid, imageUrl);

      setUploadedImageUrl(imageUrl);
      setCurrentAvatar(imageUrl);
      setAvatarKey(prev => prev + 1); // Forzar recarga del avatar
      setSuccess('Avatar actualizado correctamente');

      if (onUpdate) onUpdate();
    } catch (err) {
      logger.error('Error uploading avatar:', err);
      setError('Error al subir la imagen. Intenta de nuevo.');
    } finally {
      setUploading(false);
    }
  };

  const handleSelectAvatar = async (avatarId) => {
    try {
      // Si había una imagen subida previamente, eliminarla
      if (uploadedImageUrl) {
        await deleteAvatarImage(user.uid);
        setUploadedImageUrl(null);
      }

      await updateUserAvatar(user.uid, avatarId);
      setCurrentAvatar(avatarId);
      setShowAvatarSelector(false);
      setAvatarKey(prev => prev + 1); // Forzar recarga del avatar
      setSuccess('Avatar actualizado correctamente');

      if (onUpdate) onUpdate();
    } catch (err) {
      logger.error('Error updating avatar:', err);
      setError('Error al actualizar el avatar');
    }
  };

  const handleBannerUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Por favor selecciona un archivo de imagen válido');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('La imagen no debe superar 5MB');
      return;
    }

    setUploadingBanner(true);
    setError('');

    try {
      const imageUrl = await uploadBannerImage(user.uid, file);
      await updateUserBanner(user.uid, imageUrl);
      setCurrentBanner(imageUrl);
      setAvatarKey(prev => prev + 1);
      setSuccess('Banner actualizado correctamente');
      if (onUpdate) onUpdate();
    } catch (err) {
      logger.error('Error uploading banner:', err);
      setError('Error al subir el banner. Intenta de nuevo.');
    } finally {
      setUploadingBanner(false);
    }
  };

  const handleSelectBanner = async (bannerId) => {
    try {
      // Si había un banner personalizado, eliminarlo
      if (currentBanner && currentBanner.startsWith('http')) {
        await deleteBannerImage(user.uid);
      }

      await updateUserBanner(user.uid, bannerId);
      setCurrentBanner(bannerId);
      setAvatarKey(prev => prev + 1);
      setSuccess('Banner actualizado correctamente');
      setShowBannerOptions(false);
      if (onUpdate) onUpdate();
    } catch (err) {
      logger.error('Error updating banner:', err);
      setError('Error al actualizar el banner');
    }
  };

  const handleClearBanner = async () => {
    try {
      if (currentBanner && currentBanner.startsWith('http')) {
        await deleteBannerImage(user.uid);
      }
      await updateUserBanner(user.uid, null);
      setCurrentBanner(null);
      setAvatarKey(prev => prev + 1);
      setSuccess('Banner eliminado. Se usará el generativo automático.');
      if (onUpdate) onUpdate();
    } catch (err) {
      logger.error('Error clearing banner:', err);
      setError('Error al eliminar el banner');
    }
  };

  // Generar banner automático para preview
  const autoBannerGradient = generateUserBanner(user?.uid || 'default', theme);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-[1100]" onClick={onClose}>
      <div className="bg-[var(--color-bg-secondary)] border border-zinc-200 dark:border-zinc-800 rounded-lg w-[90%] max-w-[500px] max-h-[90vh] flex flex-col overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Header con Banner */}
        <div className="relative">
          {/* Banner */}
          <div
            className="h-24 w-full"
            style={{
              background: currentBanner && currentBanner.startsWith('http')
                ? `url(${currentBanner}) center/cover`
                : currentBanner && currentBanner.startsWith('banner:')
                  ? PRESET_BANNERS.find(b => `banner:${b.id}` === currentBanner)?.gradient || autoBannerGradient
                  : autoBannerGradient
            }}
          />

          {/* Botón editar banner */}
          <button
            onClick={() => setShowBannerOptions(!showBannerOptions)}
            className="absolute top-2 right-12 p-2 bg-black/40 hover:bg-black/60 rounded-full text-white transition-colors"
            title="Cambiar banner"
          >
            <ImageIcon size={16} />
          </button>

          {/* Botón cerrar */}
          <BaseButton
            onClick={onClose}
            variant="ghost"
            size="sm"
            icon={X}
            className="!p-2 absolute top-2 right-2 bg-black/40 hover:bg-black/60 text-white"
          />

          {/* Avatar sobre el banner */}
          <div
            className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 cursor-pointer"
            onClick={() => setShowAvatarSelector(true)}
            title="Click para cambiar avatar"
          >
            <div className="p-1 bg-[var(--color-bg-secondary)] rounded-full">
              <UserAvatar
                key={avatarKey}
                avatar={currentAvatar}
                name={user?.displayName}
                email={user?.email}
                size="xl"
                clickable
              />
            </div>
          </div>
        </div>

        {/* Título */}
        <div className="pt-14 pb-2 text-center">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
            {user?.displayName || 'Usuario'}
          </h2>
          <CategoryBadge type="role" value={userRole} size="sm" />
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Mensajes */}
          {error && (
            <BaseAlert variant="danger" className="mb-4" onClose={() => setError('')}>
              {error}
            </BaseAlert>
          )}
          {success && (
            <BaseAlert variant="success" className="mb-4" onClose={() => setSuccess('')}>
              {success}
            </BaseAlert>
          )}

          {/* Banner Options */}
          {showBannerOptions && (
            <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 mb-4">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-3 flex items-center gap-2">
                <ImageIcon size={16} />
                Selecciona tu Banner
              </h3>

              {/* Upload Banner */}
              <div className="text-center mb-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
                <label
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--color-bg-secondary)] text-zinc-900 dark:text-zinc-50 border border-zinc-300 dark:border-zinc-700 rounded-md text-sm font-medium cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  htmlFor="banner-upload"
                >
                  <Upload size={16} />
                  {uploadingBanner ? 'Subiendo...' : 'Subir imagen'}
                </label>
                <input
                  id="banner-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleBannerUpload}
                  disabled={uploadingBanner}
                  className="hidden"
                />
              </div>

              {/* Auto-generativo */}
              <div className="mb-4">
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-2 flex items-center gap-1">
                  <Sparkles size={12} />
                  Banner automático (basado en tu ID)
                </p>
                <button
                  onClick={handleClearBanner}
                  className={`w-full h-12 rounded-lg border-2 transition-all ${
                    !currentBanner
                      ? 'border-blue-500 ring-2 ring-blue-500/20'
                      : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600'
                  }`}
                  style={{ background: autoBannerGradient }}
                >
                  {!currentBanner && (
                    <Check size={20} className="mx-auto text-white drop-shadow-md" />
                  )}
                </button>
              </div>

              {/* Preset Banners */}
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-2">Banners predefinidos</p>
              <div className="grid grid-cols-4 gap-2">
                {PRESET_BANNERS.map((banner) => {
                  const bannerId = `banner:${banner.id}`;
                  const isSelected = currentBanner === bannerId;
                  return (
                    <button
                      key={banner.id}
                      onClick={() => handleSelectBanner(bannerId)}
                      className={`h-10 rounded-lg border-2 transition-all ${
                        isSelected
                          ? 'border-blue-500 ring-2 ring-blue-500/20'
                          : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600'
                      }`}
                      style={{ background: banner.gradient }}
                      title={banner.label}
                    >
                      {isSelected && (
                        <Check size={14} className="mx-auto text-white drop-shadow-md" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* User Info */}
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                <User size={14} />
                Nombre
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 text-sm text-zinc-900 dark:text-zinc-50 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600 disabled:opacity-60 disabled:cursor-not-allowed"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Sin nombre"
                disabled
              />
              <p className="text-xs text-zinc-500 dark:text-zinc-400">El nombre se actualiza desde la configuración de la cuenta</p>
            </div>

            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                <Mail size={14} />
                Email
              </label>
              <input
                type="email"
                className="w-full px-3 py-2 text-sm text-zinc-900 dark:text-zinc-50 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600 disabled:opacity-60 disabled:cursor-not-allowed"
                value={user?.email || ''}
                disabled
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                <Shield size={14} />
                Rol
              </label>
              <div>
                <CategoryBadge type="role" value={userRole} size="md" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Avatar Selector Modal */}
      {showAvatarSelector && (
        <AvatarSelector
          currentAvatar={currentAvatar}
          onSelectAvatar={handleSelectAvatar}
          onClose={() => setShowAvatarSelector(false)}
          userName={user?.displayName}
          userEmail={user?.email}
        />
      )}
    </div>
  );
}

export default ProfilePanel;
