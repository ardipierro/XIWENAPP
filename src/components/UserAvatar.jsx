/**
 * @fileoverview Componente universal de Avatar de usuario
 * @module components/UserAvatar
 *
 * Componente estandarizado y optimizado para mostrar avatares de usuarios en toda la app.
 *
 * Características:
 * - Imágenes personalizadas (Firebase Storage)
 * - Iconos predefinidos (AVATARS)
 * - Iniciales como fallback
 * - Banner de fondo opcional
 * - Tamaños predefinidos
 * - Dark mode
 * - Animaciones hover
 * - Badges de estado (online/offline/busy/away)
 * - Badges de notificaciones
 * - Optimizado con React.memo
 */

import { useState, useEffect, memo } from 'react';
import { User, Circle } from 'lucide-react';
import { AVATARS } from './AvatarSelector';
import { getUserAvatar, getUserBanner } from '../firebase/firestore';
import logger from '../utils/logger';

/**
 * Generar iniciales del nombre o email
 */
const getInitials = (name, email) => {
  if (name) {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }
  if (email) {
    return email.substring(0, 2).toUpperCase();
  }
  return '??';
};

/**
 * Tamaños predefinidos del avatar
 */
const SIZES = {
  xs: {
    container: 'w-6 h-6',
    icon: 12,
    text: 'text-xs',
    border: 'border',
    badge: 'w-2 h-2',
    badgeRing: 'ring-1'
  },
  sm: {
    container: 'w-8 h-8',
    icon: 16,
    text: 'text-sm',
    border: 'border',
    badge: 'w-2.5 h-2.5',
    badgeRing: 'ring-1'
  },
  md: {
    container: 'w-12 h-12',
    icon: 20,
    text: 'text-base',
    border: 'border-2',
    badge: 'w-3 h-3',
    badgeRing: 'ring-2'
  },
  lg: {
    container: 'w-16 h-16',
    icon: 28,
    text: 'text-lg',
    border: 'border-2',
    badge: 'w-4 h-4',
    badgeRing: 'ring-2'
  },
  xl: {
    container: 'w-24 h-24',
    icon: 40,
    text: 'text-2xl',
    border: 'border-2',
    badge: 'w-5 h-5',
    badgeRing: 'ring-2'
  },
  '2xl': {
    container: 'w-32 h-32',
    icon: 56,
    text: 'text-4xl',
    border: 'border-3',
    badge: 'w-6 h-6',
    badgeRing: 'ring-2'
  }
};

/**
 * Configuración de badges de estado
 */
const STATUS_BADGES = {
  online: {
    color: 'bg-green-500',
    label: 'En línea'
  },
  offline: {
    color: 'bg-zinc-400 dark:bg-zinc-600',
    label: 'Desconectado'
  },
  busy: {
    color: 'bg-red-500',
    label: 'Ocupado'
  },
  away: {
    color: 'bg-amber-500',
    label: 'Ausente'
  }
};

/**
 * UserAvatar - Componente universal de avatar (Optimizado con memo)
 *
 * @param {string} userId - ID del usuario (si no se proporciona avatar/avatarUrl)
 * @param {string} avatar - Avatar directo (ID de AVATARS o URL)
 * @param {string} avatarUrl - URL directa de imagen
 * @param {string} name - Nombre del usuario (para iniciales)
 * @param {string} email - Email del usuario (para iniciales fallback)
 * @param {string} size - Tamaño: xs, sm, md, lg, xl, 2xl (default: md)
 * @param {boolean} showBanner - Si mostrar banner de fondo (default: false)
 * @param {string} bannerId - ID del usuario para cargar banner (si showBanner=true)
 * @param {string} bannerUrl - URL directa del banner
 * @param {boolean} clickable - Si mostrar efectos hover (default: false)
 * @param {function} onClick - Callback al hacer click
 * @param {string} className - Clases CSS adicionales
 * @param {boolean} showInitials - Si mostrar iniciales como fallback (default: true)
 * @param {string} status - Estado del usuario: online, offline, busy, away (default: null)
 * @param {boolean} showStatusBadge - Si mostrar badge de estado (default: false)
 * @param {number} notificationCount - Número de notificaciones (default: 0)
 * @param {boolean} showNotificationBadge - Si mostrar badge de notificaciones (default: false)
 */
function UserAvatar({
  userId,
  avatar,
  avatarUrl,
  name,
  email,
  size = 'md',
  showBanner = false,
  bannerId,
  bannerUrl,
  clickable = false,
  onClick,
  className = '',
  showInitials = true,
  status = null,
  showStatusBadge = false,
  notificationCount = 0,
  showNotificationBadge = false,
  showBorder = false
}) {
  // Estados
  const [loadedAvatar, setLoadedAvatar] = useState(avatar || avatarUrl || null);
  const [loadedBanner, setLoadedBanner] = useState(bannerUrl || null);
  const [loading, setLoading] = useState(false);

  // Configuración de tamaño
  const sizeConfig = SIZES[size] || SIZES.md;

  // Cargar avatar desde Firebase si se proporciona userId
  useEffect(() => {
    if (userId && !avatar && !avatarUrl) {
      loadAvatarFromFirebase();
    }
  }, [userId, avatar, avatarUrl]);

  // Cargar banner desde Firebase si se solicita
  useEffect(() => {
    if (showBanner && bannerId && !bannerUrl) {
      loadBannerFromFirebase();
    }
  }, [showBanner, bannerId, bannerUrl]);

  const loadAvatarFromFirebase = async () => {
    if (!userId) return;

    setLoading(true);
    try {
      const fetchedAvatar = await getUserAvatar(userId);
      setLoadedAvatar(fetchedAvatar);
    } catch (error) {
      logger.error('Error loading avatar:', error);
      setLoadedAvatar('default');
    } finally {
      setLoading(false);
    }
  };

  const loadBannerFromFirebase = async () => {
    if (!bannerId) return;

    try {
      const fetchedBanner = await getUserBanner(bannerId);
      setLoadedBanner(fetchedBanner);
    } catch (error) {
      logger.error('Error loading banner:', error);
    }
  };

  // Determinar qué renderizar
  const isImageUrl = loadedAvatar && loadedAvatar.startsWith('http');
  const avatarKey = !isImageUrl ? loadedAvatar : null;
  const AvatarIcon = avatarKey && AVATARS[avatarKey] ? AVATARS[avatarKey].icon : AVATARS.default.icon;
  const initials = getInitials(name, email);

  // Estilos base del contenedor
  const containerClasses = [
    sizeConfig.container,
    'rounded-full',
    'flex items-center justify-center',
    'relative overflow-hidden',
    showBorder ? sizeConfig.border : '',
    showBorder ? 'border-[var(--color-border)]' : '',
    clickable ? 'cursor-pointer hover:opacity-80 hover:scale-105 transition-all duration-200' : '',
    className
  ].filter(Boolean).join(' ');

  // Renderizar avatar
  const renderAvatar = () => {
    if (loading) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-[var(--color-bg-tertiary)]">
          <div className="animate-pulse w-1/2 h-1/2 rounded-full bg-[var(--color-border)]" />
        </div>
      );
    }

    // 1. Si hay imagen personalizada
    if (isImageUrl) {
      return (
        <img
          src={loadedAvatar}
          alt={name || 'Avatar'}
          className="w-full h-full object-cover"
          onError={() => setLoadedAvatar('default')}
        />
      );
    }

    // 2. Si hay ícono de AVATARS
    if (avatarKey && AVATARS[avatarKey]) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-[var(--color-bg-tertiary)]">
          <AvatarIcon
            size={sizeConfig.icon}
            strokeWidth={2}
            className="text-[var(--color-text-secondary)]"
          />
        </div>
      );
    }

    // 3. Si se deben mostrar iniciales
    if (showInitials) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-[var(--color-bg-tertiary)]">
          <span className={`${sizeConfig.text} font-semibold text-[var(--color-text-secondary)]`}>
            {initials}
          </span>
        </div>
      );
    }

    // 4. Fallback: ícono de usuario
    return (
      <div className="w-full h-full flex items-center justify-center bg-[var(--color-bg-tertiary)]">
        <User
          size={sizeConfig.icon}
          strokeWidth={2}
          className="text-[var(--color-text-secondary)]"
        />
      </div>
    );
  };

  // Renderizar badge de estado
  const renderStatusBadge = () => {
    if (!showStatusBadge || !status || !STATUS_BADGES[status]) return null;

    const statusConfig = STATUS_BADGES[status];

    return (
      <div
        className={`absolute bottom-0 right-0 ${sizeConfig.badge} rounded-full ${statusConfig.color} ${sizeConfig.badgeRing} ring-white dark:ring-zinc-900`}
        title={statusConfig.label}
        aria-label={statusConfig.label}
      />
    );
  };

  // Renderizar badge de notificaciones
  const renderNotificationBadge = () => {
    if (!showNotificationBadge || notificationCount <= 0) return null;

    const displayCount = notificationCount > 99 ? '99+' : notificationCount;

    return (
      <div
        className={`absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full ${sizeConfig.badgeRing} ring-white dark:ring-zinc-900`}
        title={`${notificationCount} notificaciones`}
        aria-label={`${notificationCount} notificaciones`}
      >
        {displayCount}
      </div>
    );
  };

  // Si se debe mostrar banner de fondo
  if (showBanner) {
    return (
      <div
        className={`relative ${clickable ? 'cursor-pointer' : ''}`}
        onClick={onClick}
      >
        {/* Banner de fondo */}
        {loadedBanner ? (
          <img
            src={loadedBanner}
            alt="Banner"
            className="absolute inset-0 w-full h-full object-cover rounded-full blur-sm opacity-30"
          />
        ) : (
          <div className="absolute inset-0 w-full h-full rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 blur-sm" />
        )}

        {/* Avatar principal */}
        <div className={containerClasses}>
          {renderAvatar()}
          {renderStatusBadge()}
          {renderNotificationBadge()}
        </div>
      </div>
    );
  }

  // Avatar simple sin banner
  return (
    <div className="relative inline-block">
      <div className={containerClasses} onClick={onClick}>
        {renderAvatar()}
      </div>
      {renderStatusBadge()}
      {renderNotificationBadge()}
    </div>
  );
}

// Optimización con React.memo - solo re-renderiza si las props cambian
export default memo(UserAvatar, (prevProps, nextProps) => {
  // Comparación personalizada para optimizar re-renders
  return (
    prevProps.userId === nextProps.userId &&
    prevProps.avatar === nextProps.avatar &&
    prevProps.avatarUrl === nextProps.avatarUrl &&
    prevProps.name === nextProps.name &&
    prevProps.email === nextProps.email &&
    prevProps.size === nextProps.size &&
    prevProps.showBanner === nextProps.showBanner &&
    prevProps.status === nextProps.status &&
    prevProps.notificationCount === nextProps.notificationCount &&
    prevProps.showStatusBadge === nextProps.showStatusBadge &&
    prevProps.showNotificationBadge === nextProps.showNotificationBadge
  );
});
