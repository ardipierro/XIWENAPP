import { Eye, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useViewAs } from '../contexts/ViewAsContext';
import { useAuth } from '../contexts/AuthContext';

/**
 * Banner que indica que estás viendo la app como otro usuario
 * Solo visible cuando está activo el modo "Ver como"
 */
function ViewAsBanner() {
  const navigate = useNavigate();
  const { userRole } = useAuth();
  const { isViewingAs, viewAsUser, returnToUserId, stopViewingAs, clearViewAsState } = useViewAs();

  if (!isViewingAs) {
    return null;
  }

  const handleExitViewAs = () => {
    // Guardar el userId del usuario que estábamos viendo ANTES de limpiar
    const userIdToReturn = returnToUserId || viewAsUser?.id;
    if (userIdToReturn) {
      sessionStorage.setItem('viewAsReturnUserId', userIdToReturn);
      sessionStorage.setItem('viewAsReturning', 'true');
    }

    // Desactivar modo "Ver como" ANTES de navegar para que los permisos se restauren
    stopViewingAs();
    clearViewAsState();

    // Determinar la ruta a la que volver según el rol del usuario REAL (admin)
    const getRoleBasedRoute = () => {
      if (userRole === 'admin') return '/admin';
      if (userRole === 'teacher' || userRole === 'trial_teacher') return '/teacher';
      return '/dashboard';
    };

    // Pequeño delay para que React actualice los permisos antes de navegar
    setTimeout(() => {
      navigate(getRoleBasedRoute());
    }, 50);
  };

  return (
    // Safe area: top-[max(env(safe-area-inset-top),20px)] para móviles, top-0 en desktop
    <div className="fixed top-[max(env(safe-area-inset-top),20px)] lg:top-0 left-0 right-0 z-[1000] flex justify-between items-center px-4 sm:px-5 py-2 h-[38px] sm:h-11 bg-orange-500 text-white shadow-[0_2px_8px_rgba(251,146,60,0.3)] gap-3 sm:gap-4 flex-nowrap animate-slide-down">
      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
        <div className="text-[22px] sm:text-[28px] animate-pulse">
          <Eye size={20} strokeWidth={2} />
        </div>
        <div className="text-sm sm:text-[15px] font-semibold tracking-wide whitespace-nowrap sm:whitespace-normal overflow-hidden text-ellipsis">
          <strong className="font-extrabold mr-1 hidden sm:inline">Modo Visualización:</strong> Viendo como {viewAsUser?.name || viewAsUser?.email}
        </div>
      </div>
      <button
        onClick={handleExitViewAs}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.375rem 0.75rem',
          backgroundColor: 'rgba(255, 255, 255, 0.25)',
          color: 'white',
          border: '1px solid rgba(255, 255, 255, 0.4)',
          borderRadius: '0.5rem',
          fontWeight: '600',
          fontSize: '0.875rem',
          cursor: 'pointer',
          transition: 'all 0.2s'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.35)';
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.6)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.25)';
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.4)';
        }}
      >
        <ArrowLeft size={16} strokeWidth={2} />
        <span className="hidden sm:inline">Volver a Admin</span>
        <span className="sm:hidden">Admin</span>
      </button>
    </div>
  );
}

export default ViewAsBanner;
