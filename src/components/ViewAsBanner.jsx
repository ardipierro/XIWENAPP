import { useViewAs } from '../contexts/ViewAsContext';
import './ViewAsBanner.css';

/**
 * Banner que indica que estás viendo la app como otro usuario
 * Solo visible cuando está activo el modo "Ver como"
 */
function ViewAsBanner() {
  const { isViewingAs, viewAsUser, stopViewingAs } = useViewAs();

  if (!isViewingAs) {
    return null;
  }

  const handleExitViewAs = () => {
    stopViewingAs();
    // Recargar y volver al dashboard de admin
    window.location.href = '/teacher';
  };

  return (
    <div className="view-as-banner">
      <div className="banner-content">
        <div className="banner-icon">👁️</div>
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
