/**
 * @fileoverview Barra superior del dashboard con navegación y menú de usuario
 * @module components/TopBar
 *
 * Mobile First:
 * - Altura 48px (móvil) → 64px (desktop)
 * - Touch targets mínimo 48px
 * - 100% Tailwind CSS
 * - Dark mode completo
 * - Safe areas para iOS
 */

import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Bell, MessageCircle, Shield, Lightbulb, ArrowLeft } from 'lucide-react';
import UserMenu from './UserMenu.jsx';
import AvatarSelector, { AVATARS } from './AvatarSelector.jsx';
import ProfilePanel from './ProfilePanel.jsx';
import ThemeSwitcher from './ThemeSwitcher.jsx';
import AIAssistantModal from './AIAssistantModal.jsx';
import { getUserAvatar, updateUserAvatar } from '../firebase/firestore.js';
import { isAdminEmail } from '../firebase/roleConfig.js';
import { useUnreadMessages } from '../hooks/useUnreadMessages.js';
import { useFont } from '../contexts/FontContext.jsx';
import { useTopBar } from '../contexts/TopBarContext.jsx';
import logger from '../utils/logger.js';

/**
 * Barra superior del dashboard
 * Incluye toggle del sidebar, notificaciones, mensajes y menú de usuario
 *
 * @param {Object} props
 * @param {Object} props.user - Usuario autenticado
 * @param {string} props.userRole - Rol del usuario
 * @param {Function} props.onToggleSidebar - Callback para toggle del sidebar
 * @param {boolean} props.sidebarOpen - Si el sidebar está abierto
 * @param {Function} props.onMenuAction - Callback para acciones del menú
 * @param {boolean} props.hasBanner - Si hay un banner activo arriba
 */
function TopBar({ user, userRole, onToggleSidebar, sidebarOpen, onMenuAction, hasBanner = false }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showAvatarSelector, setShowAvatarSelector] = useState(false);
  const [showProfilePanel, setShowProfilePanel] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [userAvatar, setUserAvatar] = useState('default');
  const [notificationCount] = useState(0); // Placeholder para futuro
  const messageCount = useUnreadMessages(user?.uid); // Real-time unread count
  const { selectedFont, fontWeight, fontSize } = useFont(); // Fuente del logo
  const { config } = useTopBar(); // Configuración dinámica de TopBar

  // Verificar si es admin
  const isAdmin = isAdminEmail(user?.email) || userRole === 'admin';

  // Cargar avatar del usuario al montar
  useEffect(() => {
    loadUserAvatar();
  }, [user?.uid]);

  const loadUserAvatar = async () => {
    if (user?.uid) {
      try {
        const avatar = await getUserAvatar(user.uid);
        setUserAvatar(avatar);
      } catch (err) {
        logger.error('TopBar: Error loading avatar', err);
      }
    }
  };

  // Obtener iniciales para el avatar
  const getUserInitials = () => {
    if (user?.displayName) {
      return user.displayName
        .split(' ')
        .map(name => name[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);
    }
    if (user?.email) {
      return user.email.substring(0, 2).toUpperCase();
    }
    return '??';
  };

  // Obtener nombre para mostrar
  const getDisplayName = () => {
    if (user?.displayName) return user.displayName;
    if (user?.email) return user.email.split('@')[0];
    return 'Usuario';
  };

  // Manejar cambio de avatar
  const handleAvatarChange = async (avatarId) => {
    if (user?.uid) {
      try {
        const success = await updateUserAvatar(user.uid, avatarId);
        if (success) {
          setUserAvatar(avatarId);
          setShowAvatarSelector(false);
          logger.info('TopBar: Avatar updated successfully', { avatarId });
        }
      } catch (err) {
        logger.error('TopBar: Error updating avatar', err);
      }
    }
  };

  // Navegación a secciones principales
  const handleNavigate = (path) => {
    navigate(path);
  };



  return (
    <>
      {/* TopBar - Mobile First: 48px (móvil) → 56px (md) → 64px (lg) */}
      <header
        className={`topbar fixed left-0 right-0 z-50
                   h-12 md:h-14 lg:h-16
                   bg-white dark:bg-zinc-900
                   border-b border-zinc-200 dark:border-zinc-800
                   pt-safe
                   transition-all duration-300
                   ${hasBanner ? 'top-[38px] sm:top-[44px]' : 'top-0'}`}
      >
        <div className="flex items-center justify-between h-full px-3 md:px-5">
          {/* Sección Izquierda: Menú Hamburguesa + Logo o Back Button */}
          <div className="flex items-center gap-3 md:gap-4">
            {/* Back Button (si está configurado) */}
            {config.showBackButton ? (
              <button
                onClick={config.onBack}
                className="flex items-center gap-2
                           p-2 rounded-lg
                           bg-transparent border-none cursor-pointer
                           text-zinc-900 dark:text-white
                           hover:bg-zinc-100 dark:hover:bg-zinc-800
                           transition-colors"
                aria-label="Volver"
              >
                <ArrowLeft size={20} strokeWidth={2} />
                <span className="hidden md:inline text-sm font-semibold">Volver</span>
              </button>
            ) : (
              <>
                {/* Hamburger Button */}
                <button
                  onClick={onToggleSidebar}
                  className="flex flex-col justify-between
                             w-5 h-3.5 p-0
                             bg-transparent border-none cursor-pointer
                             hover:opacity-70 transition-opacity"
                  aria-label="Toggle sidebar"
                  aria-expanded={sidebarOpen}
                >
                  <span className="block w-full h-0.5 bg-zinc-900 dark:bg-white" />
                  <span className="block w-full h-0.5 bg-zinc-900 dark:bg-white" />
                  <span className="block w-full h-0.5 bg-zinc-900 dark:bg-white" />
                </button>

                {/* Logo - Oculto en móvil */}
                <button
                  onClick={() => handleNavigate('/')}
                  className="hidden md:flex items-center gap-2
                             text-zinc-900 dark:text-white
                             cursor-pointer select-none
                             hover:opacity-80 transition-all duration-300"
                  style={{
                    fontFamily: selectedFont,
                    fontWeight: fontWeight,
                    fontSize: `${fontSize}rem`
                  }}
                  aria-label="Ir al inicio"
                >
                  西文教室
                </button>
              </>
            )}
          </div>

          {/* Sección Central: Título Dinámico y Acciones */}
          {(config.title || config.customContent || config.actions.length > 0) && (
            <div className="flex items-center gap-3 flex-1 mx-4">
              {/* Custom Content */}
              {config.customContent ? (
                <div className="flex-1">{config.customContent}</div>
              ) : (
                <>
                  {/* Title & Subtitle */}
                  {config.title && (
                    <div className="flex flex-col justify-center flex-1">
                      <h1 className="text-sm md:text-base font-bold text-zinc-900 dark:text-white truncate">
                        {config.title}
                      </h1>
                      {config.subtitle && (
                        <p className="text-xs text-zinc-600 dark:text-zinc-400 truncate">
                          {config.subtitle}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Dynamic Actions */}
                  {config.actions.length > 0 && (
                    <div className="flex items-center gap-2">
                      {config.actions.map((action, index) => (
                        <button
                          key={action.key || index}
                          onClick={action.onClick}
                          disabled={action.disabled}
                          className={`flex items-center gap-2
                                     px-3 py-1.5 rounded-lg
                                     text-sm font-medium
                                     transition-colors
                                     ${action.variant === 'primary'
                                       ? 'bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-zinc-300 dark:disabled:bg-zinc-700'
                                       : action.variant === 'danger'
                                       ? 'bg-red-600 text-white hover:bg-red-700 disabled:bg-zinc-300 dark:disabled:bg-zinc-700'
                                       : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-white hover:bg-zinc-300 dark:hover:bg-zinc-600 disabled:opacity-50'
                                     }`}
                          aria-label={action.label}
                          title={action.title || action.label}
                        >
                          {action.icon && <span>{action.icon}</span>}
                          <span className="hidden md:inline">{action.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Sección Derecha: Acciones + Avatar */}
          <div className="flex items-center gap-2 md:gap-3">
            {/* Theme Switcher */}
            <ThemeSwitcher />

            {/* AI Assistant Button */}
            <button
              onClick={() => setShowAIModal(true)}
              className="relative flex items-center justify-center
                         w-9 h-9 p-2
                         bg-transparent border-none cursor-pointer
                         rounded-md
                         hover:bg-zinc-100 dark:hover:bg-zinc-800
                         transition-colors"
              aria-label="Asistente IA"
              title="Asistente IA"
            >
              <Lightbulb size={20} strokeWidth={2} className="text-amber-500" />
            </button>

            {/* Admin Panel Button - Solo admins */}
            {isAdmin && (
              <button
                onClick={() => handleNavigate('/admin')}
                className={`relative flex items-center justify-center
                           w-9 h-9 p-2
                           border-none cursor-pointer rounded-md
                           transition-colors
                           ${location.pathname.startsWith('/admin')
                             ? 'bg-gradient-to-br from-indigo-500 to-indigo-600 text-white hover:from-indigo-600 hover:to-indigo-700'
                             : 'bg-transparent text-zinc-900 dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800'
                           }`}
                aria-label="Panel de Administración"
                title="Panel de Administración"
              >
                <Shield size={20} strokeWidth={2} />
              </button>
            )}

            {/* Notificaciones */}
            <button
              className="relative flex items-center justify-center
                         w-9 h-9 p-2
                         bg-transparent border-none cursor-pointer
                         rounded-md text-zinc-900 dark:text-white
                         hover:bg-zinc-100 dark:hover:bg-zinc-800
                         transition-colors"
              aria-label="Notificaciones"
            >
              <Bell size={20} strokeWidth={2} />
              {notificationCount > 0 && (
                <span
                  className="absolute top-1 right-1
                             min-w-[18px] h-[18px] px-1.5
                             flex items-center justify-center
                             bg-red-500 text-white
                             text-[10px] font-bold leading-none
                             rounded-full"
                  aria-label={`${notificationCount} notificaciones`}
                >
                  {notificationCount}
                </span>
              )}
            </button>

            {/* Mensajes */}
            <button
              onClick={() => onMenuAction?.('messages')}
              className="relative flex items-center justify-center
                         w-9 h-9 p-2
                         bg-transparent border-none cursor-pointer
                         rounded-md text-zinc-900 dark:text-white
                         hover:bg-zinc-100 dark:hover:bg-zinc-800
                         transition-colors"
              aria-label="Mensajes"
              title="Mensajes"
            >
              <MessageCircle size={20} strokeWidth={2} />
              {messageCount > 0 && (
                <span
                  className="absolute top-1 right-1
                             min-w-[18px] h-[18px] px-1.5
                             flex items-center justify-center
                             bg-red-500 text-white
                             text-[10px] font-bold leading-none
                             rounded-full"
                  aria-label={`${messageCount} mensajes sin leer`}
                >
                  {messageCount}
                </span>
              )}
            </button>

            {/* Divider - Oculto en móvil */}
            <div
              className="hidden md:block
                         w-px h-8 mx-2
                         bg-zinc-200 dark:bg-zinc-700"
              aria-hidden="true"
            />

            {/* User Section */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-3
                           p-2 md:px-3 md:pr-3
                           bg-transparent border-none cursor-pointer
                           rounded-lg text-zinc-900 dark:text-white
                           hover:bg-zinc-100 dark:hover:bg-zinc-800
                           transition-colors"
                aria-label="Menú de usuario"
                aria-expanded={showUserMenu}
              >
                {/* Avatar */}
                <div
                  className="relative flex items-center justify-center
                             w-8 h-8 flex-shrink-0
                             rounded-full"
                >
                  {userAvatar && userAvatar.startsWith('http') ? (
                    <img
                      src={userAvatar}
                      alt="Avatar"
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    (() => {
                      const AvatarIcon = AVATARS[userAvatar]?.icon || AVATARS.default.icon;
                      return (
                        <AvatarIcon
                          size={20}
                          strokeWidth={2}
                          className="text-zinc-900 dark:text-white"
                        />
                      );
                    })()
                  )}
                </div>

                {/* User Name - Oculto en móvil */}
                <span
                  className="hidden md:block
                             text-sm font-semibold
                             text-zinc-900 dark:text-white
                             max-w-[150px] truncate"
                >
                  {getDisplayName()}
                </span>
              </button>

              {/* User Dropdown Menu */}
              {showUserMenu && (
                <UserMenu
                  user={user}
                  userRole={userRole}
                  onClose={() => setShowUserMenu(false)}
                  onChangeAvatar={() => {
                    setShowUserMenu(false);
                    setShowAvatarSelector(true);
                  }}
                  onViewProfile={() => {
                    setShowUserMenu(false);
                    setShowProfilePanel(true);
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Avatar Selector Modal */}
      {showAvatarSelector && (
        <AvatarSelector
          currentAvatar={userAvatar}
          onSelectAvatar={handleAvatarChange}
          onClose={() => setShowAvatarSelector(false)}
        />
      )}

      {/* Profile Panel */}
      {showProfilePanel && (
        <ProfilePanel
          user={user}
          userRole={userRole}
          onClose={() => setShowProfilePanel(false)}
          onUpdate={loadUserAvatar}
        />
      )}

      {/* AI Assistant Modal */}
      <AIAssistantModal
        isOpen={showAIModal}
        onClose={() => setShowAIModal(false)}
      />
    </>
  );
}

export default TopBar;
