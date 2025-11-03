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
  const { isViewingAs, viewAsUser, stopViewingAs } = useViewAs();

  if (!isViewingAs) {
    return null;
  }

  const handleExitViewAs = () => {
    // Desactivar modo "Ver como"
    stopViewingAs();

    // Recargar la página para volver al teacher dashboard
    window.location.href = '/teacher';
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
