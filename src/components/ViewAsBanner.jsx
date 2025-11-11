import { Eye, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useViewAs } from '../contexts/ViewAsContext';
import { BaseButton } from './common';

/**
 * Banner que indica que estás viendo la app como otro usuario
 * Solo visible cuando está activo el modo "Ver como"
 */
function ViewAsBanner() {
  const navigate = useNavigate();
  const { isViewingAs, viewAsUser, returnToUserId, stopViewingAs, clearViewAsState } = useViewAs();

  if (!isViewingAs) {
    return null;
  }

  const handleExitViewAs = () => {
    // Marcar que estamos procesando el retorno (para mostrar loading)
    sessionStorage.setItem('viewAsReturning', 'true');

    // Guardar el userId del usuario que estábamos viendo
    if (returnToUserId) {
      sessionStorage.setItem('viewAsReturnUserId', returnToUserId);
    }

    // Desactivar modo "Ver como"
    stopViewingAs();

    // Navegar a la pantalla de usuarios si hay un perfil para reabrir
    // De lo contrario, ir al dashboard principal
    const targetRoute = returnToUserId ? '/teacher/users' : '/teacher';
    navigate(targetRoute);

    // Limpiar el contexto después de navegar
    setTimeout(() => clearViewAsState(), 100);
  };

  return (
    <div className="fixed top-[64px] left-0 right-0 z-[900] flex justify-between items-center px-4 sm:px-5 py-2 h-[38px] sm:h-11 bg-orange-500 text-white shadow-[0_2px_8px_rgba(251,146,60,0.3)] gap-3 sm:gap-4 flex-nowrap animate-slide-down">
      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
        <div className="text-[22px] sm:text-[28px] animate-pulse">
          <Eye size={20} strokeWidth={2} />
        </div>
        <div className="text-sm sm:text-[15px] font-semibold tracking-wide whitespace-nowrap sm:whitespace-normal overflow-hidden text-ellipsis">
          <strong className="font-extrabold mr-1 hidden sm:inline">Modo Visualización:</strong> Viendo como {viewAsUser?.name || viewAsUser?.email}
        </div>
      </div>
      <BaseButton
        onClick={handleExitViewAs}
        variant="ghost"
        size="sm"
        icon={ArrowLeft}
        className="bg-orange-600 hover:bg-orange-700 text-white border-none"
      >
        <span className="hidden sm:inline">Volver a Admin</span>
        <span className="sm:hidden">Admin</span>
      </BaseButton>
    </div>
  );
}

export default ViewAsBanner;
