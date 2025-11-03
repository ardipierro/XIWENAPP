import { ArrowRight, Plus } from 'lucide-react';
import './QuickAccessCard.css';

/**
 * Tarjeta de acceso rápido para el dashboard
 * Diseño consistente con las tarjetas de los managers
 */
function QuickAccessCard({ icon: Icon, title, description, count, countLabel, onClick, createLabel }) {
  return (
    <div className="quick-access-card" onClick={onClick}>
      {/* Icon Header - Similar a card-image-placeholder */}
      <div className="quick-access-header">
        <Icon size={48} strokeWidth={2} />
      </div>

      {/* Content */}
      <div className="quick-access-content">
        <h3 className="card-title">{title}</h3>

        {description && (
          <p className="card-description">{description}</p>
        )}

        {/* Stats */}
        {count !== undefined && (
          <div className="quick-access-stats">
            <span className="stat-number">{count}</span>
            <span className="stat-label">{countLabel}</span>
          </div>
        )}

        {/* Action Badge */}
        <div className="quick-access-badge">
          <Plus size={16} strokeWidth={2} />
          <span>{createLabel}</span>
        </div>

        {/* Arrow indicator */}
        <div className="quick-access-arrow">
          <ArrowRight size={20} strokeWidth={2} />
        </div>
      </div>
    </div>
  );
}

export default QuickAccessCard;
