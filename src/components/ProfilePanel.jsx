import logger from '../utils/logger';

import { useState, useEffect } from 'react';
import { User, Mail, Shield, Upload, X } from 'lucide-react';
import { getUserAvatar, updateUserAvatar } from '../firebase/firestore';
import { uploadAvatarImage, deleteAvatarImage } from '../firebase/storage';
import { AVATARS } from './AvatarSelector';
import { BaseButton } from './common';

function ProfilePanel({ user, userRole, onClose, onUpdate }) {
  const [userAvatar, setUserAvatar] = useState('default');
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [uploading, setUploading] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAvatarOptions, setShowAvatarOptions] = useState(false);

  useEffect(() => {
    const loadAvatar = async () => {
      if (user?.uid) {
        const avatar = await getUserAvatar(user.uid);
        setUserAvatar(avatar);

        // Si el avatar es una URL (imagen subida), guardarlo
        if (avatar && avatar.startsWith('http')) {
          setUploadedImageUrl(avatar);
        }
      }
    };
    loadAvatar();
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

      setUserAvatar(imageUrl);
      setUploadedImageUrl(imageUrl);
      setSuccess('Avatar actualizado correctamente');

      if (onUpdate) onUpdate();
    } catch (err) {
      logger.error('Error uploading avatar:', err);
      setError('Error al subir la imagen. Intenta de nuevo.');
    } finally {
      setUploading(false);
    }
  };

  const handleSelectEmoji = async (avatarId) => {
    try {
      // Si había una imagen subida previamente, eliminarla
      if (uploadedImageUrl) {
        await deleteAvatarImage(user.uid);
        setUploadedImageUrl(null);
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

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-[1100]" onClick={onClose}>
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg w-[90%] max-w-[500px] max-h-[90vh] flex flex-col overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-zinc-200 dark:border-zinc-800">
          <h2 className="flex items-center gap-3 text-[22px] font-bold text-zinc-900 dark:text-zinc-50 m-0">
            <User size={24} strokeWidth={2} />
            Perfil de Usuario
          </h2>
          <BaseButton
            onClick={onClose}
            variant="ghost"
            size="sm"
            icon={X}
            className="!p-2"
          />
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-gutter-stable">
          {/* Mensajes */}
          {error && (
            <div className="p-3 px-4 rounded-md mb-5 text-sm font-semibold bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800">
              {error}
            </div>
          )}
          {success && (
            <div className="p-3 px-4 rounded-md mb-5 text-sm font-semibold bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-800">
              {success}
            </div>
          )}

          {/* Avatar Section */}
          <div className="mb-8">
            <div
              className="relative w-[120px] h-[120px] mx-auto mb-5 transition-all hover:scale-105 hover:opacity-80"
              onClick={() => setShowAvatarOptions(!showAvatarOptions)}
              style={{ cursor: 'pointer' }}
              title="Click para cambiar avatar"
            >
              {uploadedImageUrl ? (
                <img
                  src={uploadedImageUrl}
                  alt="Avatar"
                  className="w-full h-full rounded-full object-cover border-[3px] border-zinc-200 dark:border-zinc-700"
                />
              ) : (
                <div className="w-full h-full rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-[64px] border-[3px] border-zinc-200 dark:border-zinc-700">
                  {(() => {
                    const AvatarIcon = AVATARS[userAvatar]?.icon || AVATARS.default.icon;
                    return <AvatarIcon size={48} strokeWidth={2} />;
                  })()}
                </div>
              )}
            </div>

            {showAvatarOptions && (
              <div className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg p-5 mt-4">
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 m-0 mb-4">Selecciona tu avatar</h3>

                {/* Upload Option */}
                <div className="text-center mb-5 pb-5 border-b border-zinc-200 dark:border-zinc-800">
                  <label
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 border border-zinc-300 dark:border-zinc-700 rounded-md text-sm font-semibold cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                    htmlFor="avatar-upload"
                  >
                    <Upload size={20} strokeWidth={2} />
                    {uploading ? 'Subiendo...' : 'Subir imagen'}
                  </label>
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    disabled={uploading}
                    style={{ display: 'none' }}
                  />
                  <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">JPG, PNG o GIF (máx 5MB)</p>
                </div>

                {/* Icon Avatars */}
                <div className="grid grid-cols-5 md:grid-cols-5 gap-2">
                  {Object.entries(AVATARS).map(([key, { icon: Icon, label }]) => (
                    <button
                      key={key}
                      className={`aspect-square bg-white dark:bg-zinc-900 border-2 ${userAvatar === key && !uploadedImageUrl ? 'border-zinc-400 dark:border-zinc-600 bg-zinc-100 dark:bg-zinc-800' : 'border-zinc-200 dark:border-zinc-800'} rounded-lg text-[32px] cursor-pointer hover:border-zinc-400 dark:hover:border-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all flex items-center justify-center`}
                      onClick={() => handleSelectEmoji(key)}
                      title={label}
                    >
                      <Icon size={32} strokeWidth={2} />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* User Info */}
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                <User size={16} strokeWidth={2} />
                Nombre
              </label>
              <input
                type="text"
                className="w-full px-3.5 py-2.5 text-[15px] text-zinc-900 dark:text-zinc-50 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-md focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600 disabled:opacity-60 disabled:cursor-not-allowed"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Sin nombre"
                disabled
              />
              <p className="text-xs text-zinc-500 dark:text-zinc-400 m-0">El nombre se actualiza desde la configuración de la cuenta</p>
            </div>

            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                <Mail size={16} strokeWidth={2} />
                Email
              </label>
              <input
                type="email"
                className="w-full px-3.5 py-2.5 text-[15px] text-zinc-900 dark:text-zinc-50 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-md focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600 disabled:opacity-60 disabled:cursor-not-allowed"
                value={user?.email || ''}
                disabled
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                <Shield size={16} strokeWidth={2} />
                Rol
              </label>
              <div className="inline-flex items-center px-4 py-2 rounded-md text-sm font-semibold text-white w-fit" style={{ backgroundColor: roleBadge.color }}>
                {roleBadge.text}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfilePanel;
