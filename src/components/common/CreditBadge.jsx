/**
 * @fileoverview Credit Badge Component
 * Muestra los créditos disponibles del usuario
 * @module components/common/CreditBadge
 */

import { Coins, Infinity as InfinityIcon, Loader } from 'lucide-react';
import { useCredits } from '../../hooks/useCredits';
import './CreditBadge.css';

/**
 * Badge de créditos para TopBar
 * @param {Object} props
 * @param {Function} [props.onClick] - Callback al hacer click
 * @param {boolean} [props.showLabel] - Mostrar label "créditos"
 */
export function CreditBadge({ onClick, showLabel = true }) {
  const { availableCredits, isUnlimited, loading } = useCredits();

  if (loading) {
    return (
      <div className="credit-badge credit-badge--loading">
        <Loader size={16} className="animate-spin" />
      </div>
    );
  }

  return (
    <button
      className={`credit-badge ${onClick ? 'credit-badge--clickable' : ''}`}
      onClick={onClick}
      disabled={!onClick}
      title={isUnlimited ? 'Créditos ilimitados' : `${availableCredits} créditos disponibles`}
    >
      <div className="credit-badge__icon">
        {isUnlimited ? (
          <InfinityIcon size={16} />
        ) : (
          <Coins size={16} />
        )}
      </div>

      <div className="credit-badge__amount">
        {isUnlimited ? '∞' : availableCredits.toLocaleString()}
      </div>

      {showLabel && (
        <div className="credit-badge__label">
          {isUnlimited ? 'ilimitado' : 'créditos'}
        </div>
      )}
    </button>
  );
}

export default CreditBadge;
