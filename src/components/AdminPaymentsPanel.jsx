/**
 * @fileoverview Admin Payments Panel Component
 * @module components/AdminPaymentsPanel
 *
 * Complete payment management dashboard for administrators
 */

import { useState, useEffect } from 'react';
import {
  DollarSign,
  TrendingUp,
  Users,
  CreditCard,
  Calendar,
  Search,
  Download,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';
import logger from '../utils/logger';
import {
  getAllEnrollments,
  getAllMonthlyFees,
  getAllPayments,
  getPaymentStatistics,
  updateFeeStatus
} from '../firebase/adminPayments';
import {
  formatCurrency,
  formatDate,
  getStatusVariant,
  getStatusLabel
} from '../firebase/studentPayments';
import {
  BaseButton,
  BaseCard,
  BaseInput,
  BaseSelect,
  BaseBadge,
  BaseLoading,
  BaseEmptyState,
  BaseAlert,
  BaseModal
} from './common';

function AdminPaymentsPanel() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [stats, setStats] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [monthlyFees, setMonthlyFees] = useState([]);
  const [payments, setPayments] = useState([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('overview'); // overview, fees, payments, enrollments

  const [showFeeModal, setShowFeeModal] = useState(false);
  const [selectedFee, setSelectedFee] = useState(null);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);
      setError(null);

      logger.info('Loading admin payment data');

      const [statsResult, enrollmentsResult, feesResult, paymentsResult] = await Promise.all([
        getPaymentStatistics(),
        getAllEnrollments({ status: 'active' }),
        getAllMonthlyFees({ limit: 100 }),
        getAllPayments({ limit: 50 })
      ]);

      if (statsResult.success) {
        setStats(statsResult.stats);
      }

      if (enrollmentsResult.success) {
        setEnrollments(enrollmentsResult.enrollments);
      }

      if (feesResult.success) {
        setMonthlyFees(feesResult.fees);
      }

      if (paymentsResult.success) {
        setPayments(paymentsResult.payments);
      }

      logger.info('Admin payment data loaded successfully');

    } catch (err) {
      logger.error('Error loading admin payment data:', err);
      setError('Error al cargar datos de pagos');
    } finally {
      setLoading(false);
    }
  };

  const handleForgiveFee = async (fee) => {
    try {
      setError(null);
      setSuccess(null);

      const result = await updateFeeStatus(
        fee.id,
        'forgiven',
        'Cuota condonada por administrador'
      );

      if (result.success) {
        setSuccess('Cuota condonada exitosamente');
        setShowFeeModal(false);
        await loadAllData();
      } else {
        setError(result.error);
      }

    } catch (err) {
      logger.error('Error forgiving fee:', err);
      setError('Error al condonar cuota');
    }
  };

  const filteredFees = monthlyFees.filter(fee => {
    const matchesSearch = !searchTerm ||
      fee.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fee.monthName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || fee.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return <BaseLoading variant="fullscreen" text="Cargando datos de pagos..." />;
  }

  return (
    <div className="p-6 bg-zinc-50 dark:bg-zinc-900 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
          Gestión de Pagos
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
          Panel de control de ingresos y cobros
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

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <BaseCard
            icon={DollarSign}
            title="Ingresos Totales"
            variant="elevated"
          >
            <p className="text-3xl font-bold text-zinc-900 dark:text-white">
              {formatCurrency(stats.payments.totalRevenue)}
            </p>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
              {stats.payments.approved} pagos aprobados
            </p>
          </BaseCard>

          <BaseCard
            icon={Users}
            title="Inscripciones Activas"
            variant="elevated"
          >
            <p className="text-3xl font-bold text-zinc-900 dark:text-white">
              {stats.enrollments.active}
            </p>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
              de {stats.enrollments.total} totales
            </p>
          </BaseCard>

          <BaseCard
            icon={CreditCard}
            title="Cuotas Pendientes"
            variant="elevated"
          >
            <p className="text-3xl font-bold text-zinc-900 dark:text-white">
              {stats.monthlyFees.pending + stats.monthlyFees.overdue}
            </p>
            <p className="text-sm text-red-600 dark:text-red-400 mt-1">
              {stats.monthlyFees.overdue} vencidas
            </p>
          </BaseCard>

          <BaseCard
            icon={TrendingUp}
            title="Recaudado Este Mes"
            variant="elevated"
          >
            <p className="text-3xl font-bold text-zinc-900 dark:text-white">
              {formatCurrency(stats.monthlyFees.collectedAmount)}
            </p>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
              de {formatCurrency(stats.monthlyFees.totalAmount)}
            </p>
          </BaseCard>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-zinc-200 dark:border-zinc-700">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'overview'
              ? 'text-zinc-900 dark:text-zinc-100 border-b-2 border-zinc-900 dark:border-zinc-100'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
          }`}
        >
          Resumen
        </button>
        <button
          onClick={() => setActiveTab('fees')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'fees'
              ? 'text-zinc-900 dark:text-zinc-100 border-b-2 border-zinc-900 dark:border-zinc-100'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
          }`}
        >
          Cuotas Mensuales
        </button>
        <button
          onClick={() => setActiveTab('payments')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'payments'
              ? 'text-zinc-900 dark:text-zinc-100 border-b-2 border-zinc-900 dark:border-zinc-100'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
          }`}
        >
          Pagos
        </button>
        <button
          onClick={() => setActiveTab('enrollments')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'enrollments'
              ? 'text-zinc-900 dark:text-zinc-100 border-b-2 border-zinc-900 dark:border-zinc-100'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
          }`}
        >
          Inscripciones
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Recent Payments */}
          <BaseCard title="Últimos Pagos" icon={CreditCard}>
            {payments.length === 0 ? (
              <BaseEmptyState
                icon={CreditCard}
                title="Sin pagos registrados"
                description="Los pagos aparecerán aquí cuando los estudiantes completen sus pagos"
              />
            ) : (
              <div className="space-y-3">
                {payments.slice(0, 5).map((payment) => (
                  <div
                    key={payment.id}
                    className="flex justify-between items-center p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-zinc-900 dark:text-white">
                        {payment.payerName || 'Estudiante'}
                      </p>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        {payment.type === 'matricula'
                          ? 'Matrícula'
                          : payment.type === 'monthly_fee'
                          ? 'Cuota mensual'
                          : 'Curso'}
                        {' - '}
                        {formatDate(payment.createdAt)}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="font-bold text-zinc-900 dark:text-white">
                        {formatCurrency(payment.amount)}
                      </p>
                      <BaseBadge variant={getStatusVariant(payment.status)}>
                        {getStatusLabel(payment.status)}
                      </BaseBadge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </BaseCard>

          {/* Overdue Fees Alert */}
          {stats && stats.monthlyFees.overdue > 0 && (
            <BaseAlert
              variant="warning"
              title={`${stats.monthlyFees.overdue} cuotas vencidas`}
            >
              Hay cuotas mensuales que han pasado su fecha de vencimiento.
              Revisa la pestaña "Cuotas Mensuales" para más detalles.
            </BaseAlert>
          )}
        </div>
      )}

      {/* Monthly Fees Tab */}
      {activeTab === 'fees' && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <BaseInput
              type="text"
              placeholder="Buscar por estudiante o mes..."
              icon={Search}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            <BaseSelect
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: 'all', label: 'Todos los estados' },
                { value: 'pending', label: 'Pendientes' },
                { value: 'paid', label: 'Pagadas' },
                { value: 'overdue', label: 'Vencidas' },
                { value: 'forgiven', label: 'Condonadas' }
              ]}
            />
          </div>

          {/* Fees List */}
          {filteredFees.length === 0 ? (
            <BaseEmptyState
              icon={Calendar}
              title="No se encontraron cuotas"
              description="No hay cuotas que coincidan con los filtros seleccionados"
            />
          ) : (
            <div className="space-y-3">
              {filteredFees.map((fee) => (
                <BaseCard
                  key={fee.id}
                  hover
                  onClick={() => {
                    setSelectedFee(fee);
                    setShowFeeModal(true);
                  }}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-zinc-900 dark:text-white">
                        {fee.studentName}
                      </p>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        {fee.monthName}
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-bold text-zinc-900 dark:text-white">
                          {formatCurrency(fee.finalAmount + (fee.lateFee || 0))}
                        </p>
                        {fee.lateFee > 0 && (
                          <p className="text-xs text-red-600 dark:text-red-400">
                            +{formatCurrency(fee.lateFee)} mora
                          </p>
                        )}
                      </div>

                      <BaseBadge variant={getStatusVariant(fee.status)}>
                        {getStatusLabel(fee.status)}
                      </BaseBadge>
                    </div>
                  </div>
                </BaseCard>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Payments Tab */}
      {activeTab === 'payments' && (
        <div>
          {payments.length === 0 ? (
            <BaseEmptyState
              icon={CreditCard}
              title="Sin pagos registrados"
              description="Los pagos aparecerán aquí cuando se procesen"
            />
          ) : (
            <div className="space-y-3">
              {payments.map((payment) => (
                <BaseCard key={payment.id}>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-zinc-900 dark:text-white">
                        {payment.payerName || 'Estudiante'}
                      </p>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                        {payment.payerEmail}
                      </p>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        {formatDate(payment.createdAt)}
                      </p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">
                        ID: {payment.mercadopagoPaymentId}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-2xl font-bold text-zinc-900 dark:text-white">
                        {formatCurrency(payment.amount)}
                      </p>
                      <BaseBadge variant={getStatusVariant(payment.status)}>
                        {getStatusLabel(payment.status)}
                      </BaseBadge>
                      <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                        {payment.paymentMethod}
                      </p>
                    </div>
                  </div>
                </BaseCard>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Enrollments Tab */}
      {activeTab === 'enrollments' && (
        <div>
          {enrollments.length === 0 ? (
            <BaseEmptyState
              icon={Users}
              title="Sin inscripciones activas"
              description="No hay estudiantes inscritos actualmente"
            />
          ) : (
            <div className="space-y-3">
              {enrollments.map((enrollment) => (
                <BaseCard key={enrollment.id}>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-zinc-900 dark:text-white">
                        {enrollment.studentName}
                      </p>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        {enrollment.studentEmail}
                      </p>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                        Año: {enrollment.academicYear}
                      </p>
                      {enrollment.discount > 0 && (
                        <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                          Descuento: {enrollment.discount}% - {enrollment.discountReason}
                        </p>
                      )}
                    </div>

                    <div className="text-right space-y-2">
                      <div>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400">
                          Matrícula
                        </p>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-zinc-900 dark:text-white">
                            {formatCurrency(enrollment.matriculaAmount)}
                          </p>
                          {enrollment.matriculaPaid ? (
                            <CheckCircle size={16} className="text-green-500" strokeWidth={2} />
                          ) : (
                            <AlertCircle size={16} className="text-amber-500" strokeWidth={2} />
                          )}
                        </div>
                      </div>

                      <div>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400">
                          Cuota
                        </p>
                        <p className="font-medium text-zinc-900 dark:text-white">
                          {formatCurrency(enrollment.cuotaAmount)}
                        </p>
                      </div>

                      <BaseBadge variant={getStatusVariant(enrollment.status)}>
                        {getStatusLabel(enrollment.status)}
                      </BaseBadge>
                    </div>
                  </div>
                </BaseCard>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Fee Detail Modal */}
      {selectedFee && (
        <BaseModal
          isOpen={showFeeModal}
          onClose={() => {
            setShowFeeModal(false);
            setSelectedFee(null);
          }}
          title="Detalle de Cuota"
          size="md"
        >
          <div className="space-y-4">
            <div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">Estudiante</p>
              <p className="text-lg font-semibold text-zinc-900 dark:text-white">
                {selectedFee.studentName}
              </p>
            </div>

            <div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">Mes</p>
              <p className="font-medium text-zinc-900 dark:text-white">
                {selectedFee.monthName}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">Monto base</p>
                <p className="font-medium text-zinc-900 dark:text-white">
                  {formatCurrency(selectedFee.amount)}
                </p>
              </div>

              <div>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">Descuento</p>
                <p className="font-medium text-green-600 dark:text-green-400">
                  -{formatCurrency(selectedFee.discount || 0)}
                </p>
              </div>

              {selectedFee.lateFee > 0 && (
                <>
                  <div>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">Recargo</p>
                    <p className="font-medium text-red-600 dark:text-red-400">
                      +{formatCurrency(selectedFee.lateFee)}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">Días de mora</p>
                    <p className="font-medium text-zinc-900 dark:text-white">
                      {selectedFee.daysPastDue} días
                    </p>
                  </div>
                </>
              )}
            </div>

            <div className="pt-4 border-t border-zinc-200 dark:border-zinc-700">
              <div className="flex justify-between items-center">
                <p className="text-lg font-semibold text-zinc-900 dark:text-white">
                  Total
                </p>
                <p className="text-2xl font-bold text-zinc-900 dark:text-white">
                  {formatCurrency(selectedFee.finalAmount + (selectedFee.lateFee || 0))}
                </p>
              </div>
            </div>

            {selectedFee.status !== 'paid' && selectedFee.status !== 'forgiven' && (
              <div className="pt-4">
                <BaseButton
                  variant="warning"
                  onClick={() => handleForgiveFee(selectedFee)}
                  fullWidth
                >
                  Condonar Cuota
                </BaseButton>
              </div>
            )}
          </div>
        </BaseModal>
      )}
    </div>
  );
}

export default AdminPaymentsPanel;
