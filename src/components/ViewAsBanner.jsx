import { Eye, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useViewAs } from '../contexts/ViewAsContext';
import { BaseButton } from './common';
import './ViewAsBanner.css';

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
    <div className="view-as-banner">
      <div className="banner-content">
        <div className="banner-icon">
          <Eye size={20} strokeWidth={2} />
        </div>
        <div className="banner-text">
          <strong className="banner-label">Modo Visualización:</strong> Viendo como {viewAsUser?.name || viewAsUser?.email}
        </div>
      </div>
      <BaseButton
        onClick={handleExitViewAs}
        variant="warning"
        size="sm"
        icon={ArrowLeft}
      >
        <span className="hidden sm:inline">Volver a Admin</span>
        <span className="sm:hidden">Admin</span>
      </BaseButton>
    </div>
  );
}

export default ViewAsBanner;
