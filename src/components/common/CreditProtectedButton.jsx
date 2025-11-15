/**
 * @fileoverview Credit Protected Button Component
 * Botón que requiere créditos para ser usado
 * @module components/common/CreditProtectedButton
 */

import { useState } from 'react';
import { Coins, Lock, Loader } from 'lucide-react';
import { useCredits } from '../../hooks/useCredits';
import { getCost } from '../../config/creditCosts';
import BaseButton from './BaseButton';

/**
 * Botón protegido por créditos
 * @param {Object} props
 * @param {string} props.featureKey - Key de la feature en creditCosts
 * @param {Function} props.onClick - Callback al hacer click (recibe result como parámetro)
 * @param {string} [props.children] - Contenido del botón
 * @param {boolean} [props.showCost] - Mostrar costo en el botón
 * @param {string} [props.variant] - Variante del botón
 * @param {boolean} [props.disabled] - Deshabilitar botón
 * @param {Object} [props.metadata] - Metadata adicional para la transacción
 */
export function CreditProtectedButton({
  featureKey,
  onClick,
  children,
  showCost = true,
  variant = 'primary',
  disabled = false,
  metadata = {},
  ...rest
}) {
  const { hasEnough, useFeature, isUnlimited, loading: creditsLoading } = useCredits();
  const [processing, setProcessing] = useState(false);

  const cost = getCost(featureKey);
  const hasCredits = isUnlimited || hasEnough(cost);

  const handleClick = async () => {
    if (!hasCredits || processing) return;

    setProcessing(true);

    try {
      const result = await useFeature(featureKey, metadata);

      if (result.success) {
        await onClick(result);
      } else {
        // Mostrar error
        console.error('Error usando feature:', result.error);
        // Podrías agregar un toast aquí
      }
    } catch (error) {
      console.error('Error en CreditProtectedButton:', error);
    } finally {
      setProcessing(false);
    }
  };

  const isDisabled = disabled || !hasCredits || processing || creditsLoading;

  return (
    <BaseButton
      variant={variant}
      onClick={handleClick}
      disabled={isDisabled}
      className="credit-protected-button"
      {...rest}
    >
      <div className="credit-protected-button__content">
        {processing ? (
          <>
            <Loader size={16} className="animate-spin" />
            <span>Procesando...</span>
          </>
        ) : (
          <>
            {children}

            {showCost && cost > 0 && (
              <div className="credit-protected-button__cost">
                {hasCredits ? (
                  <>
                    <Coins size={14} />
                    <span>{isUnlimited ? '0' : cost}</span>
                  </>
                ) : (
                  <>
                    <Lock size={14} />
                    <span>Requiere {cost}</span>
                  </>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </BaseButton>
  );
}

export default CreditProtectedButton;
