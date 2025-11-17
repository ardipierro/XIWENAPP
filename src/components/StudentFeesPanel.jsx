/**
 * @fileoverview Student Fees Panel Component
 * @module components/StudentFeesPanel
 *
 * Panel for students to view and pay their monthly fees and enrollment
 */

import { useState, useEffect } from 'react';
import { CreditCard, Calendar, AlertCircle, CheckCircle, Clock, DollarSign } from 'lucide-react';
import logger from '../utils/logger';
import {
  createMatriculaPayment,
  createMonthlyFeePayment,
  checkSubscriptionStatus,
  getPaymentHistory,
  redirectToCheckout,
  formatCurrency,
  formatDate,
  getStatusVariant,
  getStatusLabel,
  getDaysUntilDue
} from '../firebase/studentPayments';
import {
  getFirestore,
  collection,
  query,
  where,
  orderBy,
  getDocs
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { app } from '../firebase/config';
import {
  BaseButton,
  BaseCard,
  BaseBadge,
  BaseLoading,
  BaseEmptyState,
  BaseAlert,
  BaseTabs
} from './common';

const db = getFirestore(app);
const auth = getAuth(app);

function StudentFeesPanel() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [enrollment, setEnrollment] = useState(null);
  const [monthlyFees, setMonthlyFees] = useState([]);
  const [paymentHistory, setPaymentHistory] = useState([]);

  const [processingPayment, setProcessingPayment] = useState(false);
  const [activeTab, setActiveTab] = useState('fees'); // fees, history

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const user = auth.currentUser;
      if (!user) {
        setError('Debes iniciar sesión');
        return;
      }

      await loadEnrollment(user.uid);
      await loadMonthlyFees(user.uid);
      await loadPaymentHistory();

    } catch (err) {
      logger.error('Error loading fees data:', err);
      setError('Error al cargar datos de pagos');
    } finally {
      setLoading(false);
    }
  };

  const loadEnrollment = async (userId) => {
    try {
      const q = query(
        collection(db, 'student_enrollments'),
        where('studentId', '==', userId),
        where('status', '==', 'active'),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const enrollmentData = {
          id: snapshot.docs[0].id,
          ...snapshot.docs[0].data()
        };
        setEnrollment(enrollmentData);
        logger.info('Enrollment loaded', enrollmentData);
      } else {
        logger.info('No active enrollment found');
      }

    } catch (err) {
      logger.error('Error loading enrollment:', err);
      throw err;
    }
  };

  const loadMonthlyFees = async (userId) => {
    try {
      const q = query(
        collection(db, 'monthly_fees'),
        where('studentId', '==', userId),
        orderBy('dueDate', 'desc')
      );

      const snapshot = await getDocs(q);
      const fees = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        dueDate: doc.data().dueDate?.toDate(),
        paidAt: doc.data().paidAt?.toDate(),
        createdAt: doc.data().createdAt?.toDate()
      }));

      setMonthlyFees(fees);
      logger.info(`Loaded ${fees.length} monthly fees`);

    } catch (err) {
      logger.error('Error loading monthly fees:', err);
      throw err;
    }
  };

  const loadPaymentHistory = async () => {
    try {
      const result = await getPaymentHistory(10);

      if (result.success) {
        setPaymentHistory(result.payments || []);
        logger.info(`Loaded ${result.payments?.length || 0} payment records`);
      }

    } catch (err) {
      logger.error('Error loading payment history:', err);
    }
  };

  const handlePayMatricula = async () => {
    if (!enrollment) {
      setError('No se encontró inscripción activa');
      return;
    }

    try {
      setProcessingPayment(true);
      setError(null);
      setSuccess(null);

      logger.info('Creating matricula payment', { enrollmentId: enrollment.id });

      const result = await createMatriculaPayment(enrollment.id);

      if (result.success) {
        logger.info('Matricula payment created, redirecting to checkout');
        setSuccess('Redirigiendo a MercadoPago...');

        setTimeout(() => {
          redirectToCheckout(result.initPoint, result.sandboxInitPoint);
        }, 1000);

      } else {
        setError(result.error || 'Error al crear pago de matrícula');
      }

    } catch (err) {
      logger.error('Error creating matricula payment:', err);
      setError('Error al procesar pago');
    } finally {
      setProcessingPayment(false);
    }
  };

  const handlePayFee = async (feeId) => {
    try {
      setProcessingPayment(true);
      setError(null);
      setSuccess(null);

      logger.info('Creating monthly fee payment', { feeId });

      const result = await createMonthlyFeePayment(feeId);

      if (result.success) {
        logger.info('Monthly fee payment created, redirecting to checkout');
        setSuccess('Redirigiendo a MercadoPago...');

        setTimeout(() => {
          redirectToCheckout(result.initPoint, result.sandboxInitPoint);
        }, 1000);

      } else {
        setError(result.error || 'Error al crear pago de cuota');
      }

    } catch (err) {
      logger.error('Error creating monthly fee payment:', err);
      setError('Error al procesar pago');
    } finally {
      setProcessingPayment(false);
    }
  };

  if (loading) {
    return <BaseLoading variant="fullscreen" text="Cargando información de pagos..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
          Pagos
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
          Gestiona tus cuotas mensuales y matrícula
        </p>
      </div>

      {/* Alerts */}
      {error && (
        <BaseAlert
          variant="danger"
          title="Error"
          dismissible
          onDismiss={() => setError(null)}
          className="mb-6"
        >
          {error}
        </BaseAlert>
      )}

      {success && (
        <BaseAlert
          variant="success"
          title="Éxito"
          dismissible
          onDismiss={() => setSuccess(null)}
          className="mb-6"
        >
          {success}
        </BaseAlert>
      )}

      {/* No Enrollment Warning */}
      {!enrollment && (
        <BaseAlert
          variant="warning"
          title="Sin inscripción activa"
          className="mb-6"
        >
          No tienes una inscripción activa. Contacta al administrador para inscribirte.
        </BaseAlert>
      )}

      {/* Enrollment Card */}
      {enrollment && (
        <BaseCard
          icon={CreditCard}
          title="Inscripción Anual"
          className="mb-6"
          badges={[
            <BaseBadge
              key="status"
              variant={getStatusVariant(enrollment.status)}
            >
              {getStatusLabel(enrollment.status)}
            </BaseBadge>
          ]}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">Año Académico</p>
                <p className="text-lg font-semibold text-zinc-900 dark:text-white">
                  {enrollment.academicYear || '2025'}
                </p>
              </div>

              <div>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">Matrícula</p>
                <p className="text-lg font-semibold text-zinc-900 dark:text-white">
                  {formatCurrency(enrollment.matriculaAmount || 15000)}
                </p>
              </div>

              <div>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">Cuota Mensual</p>
                <p className="text-lg font-semibold text-zinc-900 dark:text-white">
                  {formatCurrency(enrollment.cuotaAmount || 8000)}
                  {enrollment.discount > 0 && (
                    <span className="text-sm text-green-600 dark:text-green-400 ml-2">
                      (-{enrollment.discount}%)
                    </span>
                  )}
                </p>
              </div>

              <div>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">Estado de Matrícula</p>
                <div className="flex items-center gap-2 mt-1">
                  {enrollment.matriculaPaid ? (
                    <>
                      <CheckCircle size={20} className="text-green-500" strokeWidth={2} />
                      <span className="text-green-600 dark:text-green-400 font-medium">
                        Pagada
                      </span>
                    </>
                  ) : (
                    <>
                      <AlertCircle size={20} className="text-amber-500" strokeWidth={2} />
                      <span className="text-amber-600 dark:text-amber-400 font-medium">
                        Pendiente
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {enrollment.discount > 0 && (
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <p className="text-sm text-green-800 dark:text-green-200">
                  <strong>Descuento aplicado:</strong> {enrollment.discountReason || `${enrollment.discount}% de descuento`}
                </p>
              </div>
            )}

            {!enrollment.matriculaPaid && (
              <div className="pt-4 border-t border-zinc-200 dark:border-zinc-700">
                <BaseButton
                  variant="primary"
                  icon={CreditCard}
                  onClick={handlePayMatricula}
                  loading={processingPayment}
                  fullWidth
                >
                  Pagar Matrícula {formatCurrency(enrollment.matriculaAmount || 15000)}
                </BaseButton>
              </div>
            )}
          </div>
        </BaseCard>
      )}

      {/* Tabs */}
      <BaseTabs
        tabs={[
          { id: 'fees', label: 'Cuotas Mensuales', icon: Calendar },
          { id: 'history', label: 'Historial de Pagos', icon: CreditCard }
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
        variant="underline"
        size="md"
        className="mb-6"
      />

      {/* Monthly Fees Tab */}
      {activeTab === 'fees' && (
        <div>
          {monthlyFees.length === 0 ? (
            <BaseEmptyState
              icon={Calendar}
              title="No hay cuotas generadas"
              description="Las cuotas mensuales se generan automáticamente el 1ro de cada mes"
              size="lg"
            />
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {monthlyFees.map((fee) => {
                const daysUntilDue = getDaysUntilDue(fee.dueDate);
                const isOverdue = fee.status === 'overdue';
                const isPaid = fee.status === 'paid';
                const totalAmount = fee.finalAmount + (fee.lateFee || 0);

                return (
                  <BaseCard
                    key={fee.id}
                    icon={DollarSign}
                    title={fee.monthName}
                    badges={[
                      <BaseBadge
                        key="status"
                        variant={getStatusVariant(fee.status)}
                      >
                        {getStatusLabel(fee.status)}
                      </BaseBadge>
                    ]}
                    hover
                  >
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm text-zinc-600 dark:text-zinc-400">
                            Monto
                          </p>
                          <p className="text-2xl font-bold text-zinc-900 dark:text-white">
                            {formatCurrency(totalAmount)}
                          </p>
                          {fee.lateFee > 0 && (
                            <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                              Incluye recargo: {formatCurrency(fee.lateFee)}
                            </p>
                          )}
                        </div>

                        <div className="text-right">
                          <p className="text-sm text-zinc-600 dark:text-zinc-400">
                            Vencimiento
                          </p>
                          <p className="text-sm font-medium text-zinc-900 dark:text-white">
                            {formatDate(fee.dueDate)}
                          </p>
                          {!isPaid && (
                            <p className={`text-xs mt-1 ${
                              isOverdue
                                ? 'text-red-600 dark:text-red-400'
                                : daysUntilDue <= 3
                                ? 'text-amber-600 dark:text-amber-400'
                                : 'text-zinc-600 dark:text-zinc-400'
                            }`}>
                              {isOverdue
                                ? `Vencido hace ${Math.abs(daysUntilDue)} días`
                                : daysUntilDue === 0
                                ? 'Vence hoy'
                                : `Vence en ${daysUntilDue} días`
                              }
                            </p>
                          )}
                        </div>
                      </div>

                      {isPaid && fee.paidAt && (
                        <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                          <p className="text-sm text-green-800 dark:text-green-200">
                            Pagado el {formatDate(fee.paidAt)}
                          </p>
                        </div>
                      )}

                      {!isPaid && (
                        <BaseButton
                          variant={isOverdue ? 'danger' : 'primary'}
                          icon={CreditCard}
                          onClick={() => handlePayFee(fee.id)}
                          loading={processingPayment}
                          fullWidth
                        >
                          Pagar {formatCurrency(totalAmount)}
                        </BaseButton>
                      )}
                    </div>
                  </BaseCard>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Payment History Tab */}
      {activeTab === 'history' && (
        <div>
          {paymentHistory.length === 0 ? (
            <BaseEmptyState
              icon={Clock}
              title="Sin pagos registrados"
              description="Aquí verás el historial de tus pagos una vez que realices tu primer pago"
              size="lg"
            />
          ) : (
            <div className="space-y-4">
              {paymentHistory.map((payment) => (
                <div
                  key={payment.id}
                  className="p-4 bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold text-zinc-900 dark:text-white">
                        {payment.type === 'matricula'
                          ? 'Matrícula'
                          : payment.type === 'monthly_fee'
                          ? 'Cuota Mensual'
                          : 'Compra de Curso'}
                      </h3>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                        {formatDate(payment.createdAt)}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-lg font-bold text-zinc-900 dark:text-white">
                        {formatCurrency(payment.amount)}
                      </p>
                      <BaseBadge variant={getStatusVariant(payment.status)}>
                        {getStatusLabel(payment.status)}
                      </BaseBadge>
                    </div>
                  </div>

                  {payment.paymentMethod && (
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      Método: {payment.paymentMethod}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default StudentFeesPanel;
