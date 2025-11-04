import { Eye, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useViewAs } from '../contexts/ViewAsContext';
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
    console.log('ViewAsBanner: Saliendo del modo Ver Como');
    console.log('ViewAsBanner: returnToUserId =', returnToUserId);

    // Marcar que estamos procesando el retorno (para mostrar loading)
    sessionStorage.setItem('viewAsReturning', 'true');

    // Guardar el userId en sessionStorage ANTES de navegar
    if (returnToUserId) {
      console.log('ViewAsBanner: Guardando returnToUserId en sessionStorage:', returnToUserId);
      sessionStorage.setItem('viewAsReturnUserId', returnToUserId);
    }

    // Desactivar modo "Ver como"
    stopViewingAs();

    // Navegar a la pantalla de usuarios si hay un userId para reabrir
    // De lo contrario, ir al dashboard principal
    const targetRoute = returnToUserId ? '/teacher/users' : '/teacher';
    console.log('ViewAsBanner: Navegando a', targetRoute);
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
      <button
        onClick={handleExitViewAs}
        className="banner-button"
      >
        <div className="banner-button-icon">
          <ArrowLeft size={20} strokeWidth={2} />
        </div>
        <span className="banner-button-full">Volver a Admin</span>
        <span className="banner-button-short">Admin</span>
      </button>
    </div>
  );
}

export default ViewAsBanner;
