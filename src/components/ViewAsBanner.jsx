import { Eye } from 'lucide-react';
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

    // Desactivar modo "Ver como"
    stopViewingAs();

    // Navegar a la ruta del usuario específico
    if (returnToUserId) {
      console.log('ViewAsBanner: Navegando a /teacher/users/' + returnToUserId);
      navigate(`/teacher/users/${returnToUserId}`);
    } else {
      console.warn('ViewAsBanner: No hay returnToUserId, navegando a /teacher/users');
      navigate('/teacher/users');
    }

    // Limpiar el estado después de navegar
    setTimeout(() => clearViewAsState(), 100);
  };

  return (
    <div className="view-as-banner">
      <div className="banner-content">
        <div className="banner-icon">
          <Eye size={20} strokeWidth={2} />
        </div>
        <div className="banner-text">
          <strong>Modo Visualización:</strong> Viendo como {viewAsUser?.name || viewAsUser?.email}
        </div>
      </div>
      <button
        onClick={handleExitViewAs}
        className="banner-button"
      >
        ← Volver a Admin
      </button>
    </div>
  );
}

export default ViewAsBanner;
