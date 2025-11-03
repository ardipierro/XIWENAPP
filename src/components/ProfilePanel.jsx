import { useState, useEffect } from 'react';
import { User, Mail, Shield, Upload, X, Camera } from 'lucide-react';
import { getUserAvatar, updateUserAvatar } from '../firebase/firestore';
import { uploadAvatarImage, deleteAvatarImage } from '../firebase/storage';
import { AVATARS } from './AvatarSelector';
import './ProfilePanel.css';

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
      console.error('Error uploading avatar:', err);
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
      console.error('Error updating avatar:', err);
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
    <div className="profile-panel-overlay" onClick={onClose}>
      <div className="profile-panel" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="profile-header">
          <h2 className="profile-title">
            <User size={24} strokeWidth={2} />
            Perfil de Usuario
          </h2>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} strokeWidth={2} />
          </button>
        </div>

        {/* Body */}
        <div className="profile-body">
          {/* Mensajes */}
          {error && (
            <div className="profile-message error">
              {error}
            </div>
          )}
          {success && (
            <div className="profile-message success">
              {success}
            </div>
          )}

          {/* Avatar Section */}
          <div className="profile-avatar-section">
            <div className="avatar-display">
              {uploadedImageUrl ? (
                <img src={uploadedImageUrl} alt="Avatar" className="avatar-image" />
              ) : (
                <div className="avatar-emoji">
                  {(() => {
                    const AvatarIcon = AVATARS[userAvatar]?.icon || AVATARS.default.icon;
                    return <AvatarIcon size={48} strokeWidth={2} />;
                  })()}
                </div>
              )}
              <button className="avatar-change-btn" onClick={() => setShowAvatarOptions(!showAvatarOptions)}>
                <Camera size={20} strokeWidth={2} />
              </button>
            </div>

            {showAvatarOptions && (
              <div className="avatar-options">
                <h3 className="avatar-options-title">Selecciona tu avatar</h3>

                {/* Upload Option */}
                <div className="avatar-upload-option">
                  <label className="upload-btn" htmlFor="avatar-upload">
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
                  <p className="upload-hint">JPG, PNG o GIF (máx 5MB)</p>
                </div>

                {/* Icon Avatars */}
                <div className="avatar-emoji-grid">
                  {Object.entries(AVATARS).map(([key, { icon: Icon, label }]) => (
                    <button
                      key={key}
                      className={`emoji-option ${userAvatar === key && !uploadedImageUrl ? 'selected' : ''}`}
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
          <div className="profile-info-section">
            <div className="info-field">
              <label className="info-label">
                <User size={16} strokeWidth={2} />
                Nombre
              </label>
              <input
                type="text"
                className="info-input"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Sin nombre"
                disabled
              />
              <p className="info-hint">El nombre se actualiza desde la configuración de la cuenta</p>
            </div>

            <div className="info-field">
              <label className="info-label">
                <Mail size={16} strokeWidth={2} />
                Email
              </label>
              <input
                type="email"
                className="info-input"
                value={user?.email || ''}
                disabled
              />
            </div>

            <div className="info-field">
              <label className="info-label">
                <Shield size={16} strokeWidth={2} />
                Rol
              </label>
              <div className="role-badge" style={{ backgroundColor: roleBadge.color }}>
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
