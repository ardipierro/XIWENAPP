/**
 * @fileoverview Payment Result Page Component
 * @module components/PaymentResult
 *
 * Page displayed after MercadoPago payment redirect
 * Shows payment result (success, failure, pending)
 */

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  CheckCircle,
  XCircle,
  Clock,
  Home,
  CreditCard,
  AlertCircle
} from 'lucide-react';
import logger from '../utils/logger';
import {
  BaseButton,
  BaseCard,
  BaseLoading
} from './common';

function PaymentResult() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [paymentType, setPaymentType] = useState(null);

  useEffect(() => {
    processPaymentResult();
  }, []);

  const processPaymentResult = async () => {
    try {
      setLoading(true);

      // Get URL parameters
      const status = searchParams.get('status'); // success, failure, pending
      const type = searchParams.get('type'); // matricula, cuota, course
      const paymentId = searchParams.get('payment_id');
      const preferenceId = searchParams.get('preference_id');

      logger.info('Processing payment result', {
        status,
        type,
        paymentId,
        preferenceId
      });

      setPaymentStatus(status);
      setPaymentType(type);

      // Wait a moment to allow webhook to process
      // (webhook usually arrives before redirect, but not always)
      await new Promise(resolve => setTimeout(resolve, 2000));

    } catch (err) {
      logger.error('Error processing payment result:', err);
    } finally {
      setLoading(false);
    }
  };

  const getTypeLabel = (type) => {
    const labels = {
      'matricula': 'Matrícula',
      'cuota': 'Cuota Mensual',
      'course': 'Curso'
    };
    return labels[type] || 'Pago';
  };

  const handleGoHome = () => {
    navigate('/');
  };

  const handleGoToPayments = () => {
    navigate('/student/payments');
  };

  if (loading) {
    return (
      <BaseLoading
        variant="fullscreen"
        text="Procesando resultado del pago..."
      />
    );
  }

  // Success State
  if (paymentStatus === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50 dark:bg-gray-900">
        <BaseCard className="max-w-md w-full">
          <div className="text-center space-y-6">
            {/* Success Icon */}
            <div className="flex justify-center">
              <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: 'var(--color-success-bg)' }}>
                <CheckCircle
                  size={48}
                  strokeWidth={2}
                  className="" style={{ color: 'var(--color-success)' }}
                />
              </div>
            </div>

            {/* Title */}
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                ¡Pago Exitoso!
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Tu pago de {getTypeLabel(paymentType)} ha sido procesado correctamente
              </p>
            </div>

            {/* Info Box */}
            <div className="p-4 rounded-lg border border-green-200 dark:border-green-800" style={{ background: 'var(--color-success-bg)' }}>
              <p className="text-sm" style={{ color: 'var(--color-success)' }}>
                <strong>Confirmación:</strong> Recibirás un comprobante por email en los próximos minutos.
              </p>
            </div>

            {/* Instructions */}
            <div className="text-left p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                ¿Qué sigue?
              </h3>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>✓ El pago se reflejará en tu cuenta inmediatamente</li>
                <li>✓ Puedes descargar tu comprobante desde "Mis Pagos"</li>
                <li>✓ Revisa tu historial de pagos para más detalles</li>
              </ul>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <BaseButton
                variant="primary"
                icon={CreditCard}
                onClick={handleGoToPayments}
                fullWidth
              >
                Ver Mis Pagos
              </BaseButton>

              <BaseButton
                variant="ghost"
                icon={Home}
                onClick={handleGoHome}
                fullWidth
              >
                Ir al Inicio
              </BaseButton>
            </div>
          </div>
        </BaseCard>
      </div>
    );
  }

  // Pending State
  if (paymentStatus === 'pending') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50 dark:bg-gray-900">
        <BaseCard className="max-w-md w-full">
          <div className="text-center space-y-6">
            {/* Pending Icon */}
            <div className="flex justify-center">
              <div className="w-20 h-20 dark:bg-amber-900/30 rounded-full flex items-center justify-center" style={{ background: 'var(--color-warning-bg)' }}>
                <Clock
                  size={48}
                  strokeWidth={2}
                  className="dark:text-amber-400" style={{ color: 'var(--color-warning)' }}
                />
              </div>
            </div>

            {/* Title */}
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Pago Pendiente
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Tu pago de {getTypeLabel(paymentType)} está en proceso
              </p>
            </div>

            {/* Info Box */}
            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                <strong>En proceso:</strong> Estamos esperando la confirmación de tu entidad bancaria.
                Esto puede tomar algunos minutos o hasta 48 horas.
              </p>
            </div>

            {/* Instructions */}
            <div className="text-left p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                ¿Qué hacer mientras tanto?
              </h3>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>⏳ El pago puede tardar hasta 48 horas en acreditarse</li>
                <li>📧 Recibirás un email cuando se confirme</li>
                <li>🔍 Puedes ver el estado en "Mis Pagos"</li>
                <li>💬 Contacta soporte si tienes dudas</li>
              </ul>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <BaseButton
                variant="primary"
                icon={CreditCard}
                onClick={handleGoToPayments}
                fullWidth
              >
                Ver Estado del Pago
              </BaseButton>

              <BaseButton
                variant="ghost"
                icon={Home}
                onClick={handleGoHome}
                fullWidth
              >
                Ir al Inicio
              </BaseButton>
            </div>
          </div>
        </BaseCard>
      </div>
    );
  }

  // Failure State
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50 dark:bg-gray-900">
      <BaseCard className="max-w-md w-full">
        <div className="text-center space-y-6">
          {/* Failure Icon */}
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: 'var(--color-error-bg)' }}>
              <XCircle
                size={48}
                strokeWidth={2}
                className="" style={{ color: 'var(--color-error)' }}
              />
            </div>
          </div>

          {/* Title */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Pago No Completado
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              No pudimos procesar tu pago de {getTypeLabel(paymentType)}
            </p>
          </div>

          {/* Info Box */}
          <div className="p-4 rounded-lg border border-red-200 dark:border-red-800" style={{ background: 'var(--color-error-bg)' }}>
            <div className="flex items-start gap-2">
              <AlertCircle
                size={20}
                strokeWidth={2}
                className="flex-shrink-0 mt-0.5" style={{ color: 'var(--color-error)' }}
              />
              <div className="text-left">
                <p className="text-sm font-medium mb-1" style={{ color: 'var(--color-error)' }}>
                  El pago fue rechazado o cancelado
                </p>
                <p className="text-xs" style={{ color: 'var(--color-error)' }}>
                  Esto puede ocurrir por fondos insuficientes, datos incorrectos, o
                  si cancelaste la operación.
                </p>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="text-left p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              ¿Qué puedes hacer?
            </h3>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li>🔄 Intenta nuevamente con otro método de pago</li>
              <li>💳 Verifica los datos de tu tarjeta</li>
              <li>💰 Asegúrate de tener fondos suficientes</li>
              <li>📞 Contacta a tu banco si el problema persiste</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <BaseButton
              variant="primary"
              icon={CreditCard}
              onClick={handleGoToPayments}
              fullWidth
            >
              Intentar Nuevamente
            </BaseButton>

            <BaseButton
              variant="ghost"
              icon={Home}
              onClick={handleGoHome}
              fullWidth
            >
              Ir al Inicio
            </BaseButton>
          </div>
        </div>
      </BaseCard>
    </div>
  );
}

export default PaymentResult;
