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
  BaseInput,
  BaseSelect,
  BaseBadge,
  BaseLoading,
  BaseEmptyState,
  BaseAlert,
  BaseModal,
  BaseTabs
} from './common';
import { UniversalCard } from './cards';

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
    <div className="universal-panel universal-panel--scrollable p-6 min-h-screen" style={{ background: 'var(--color-bg-tertiary)' }}>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
          Gestión de Pagos
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
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
          <UniversalCard
            variant="stats"
            size="md"
            icon={DollarSign}
            title="Ingresos Totales"
            bigNumber={formatCurrency(stats.payments.totalRevenue)}
            description={`${stats.payments.approved} pagos aprobados`}
          />

          <UniversalCard
            variant="stats"
            size="md"
            icon={Users}
            title="Inscripciones Activas"
            bigNumber={stats.enrollments.active}
            description={`de ${stats.enrollments.total} totales`}
          />

          <UniversalCard
            variant="stats"
            size="md"
            icon={CreditCard}
            title="Cuotas Pendientes"
            bigNumber={stats.monthlyFees.pending + stats.monthlyFees.overdue}
            description={`${stats.monthlyFees.overdue} vencidas`}
          />

          <UniversalCard
            variant="stats"
            size="md"
            icon={TrendingUp}
            title="Recaudado Este Mes"
            bigNumber={formatCurrency(stats.monthlyFees.collectedAmount)}
            description={`de ${formatCurrency(stats.monthlyFees.totalAmount)}`}
          />
        </div>
      )}

      {/* Tabs - Using BaseTabs component */}
      <BaseTabs
        tabs={[
          { id: 'overview', label: 'Resumen', icon: TrendingUp },
          { id: 'fees', label: 'Cuotas Mensuales', icon: Calendar },
          { id: 'payments', label: 'Pagos', icon: CreditCard },
          { id: 'enrollments', label: 'Inscripciones', icon: Users },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
        variant="underline"
        size="md"
        className="mb-6"
      />

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Recent Payments */}
          <UniversalCard
            variant="default"
            size="md"
            icon={CreditCard}
            title="Últimos Pagos"
          >
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
                      <p className="font-medium style={{ color: 'var(--color-text-primary)' }}">
                        {payment.payerName || 'Estudiante'}
                      </p>
                      <p className="text-sm style={{ color: 'var(--color-text-secondary)' }}">
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
                      <p className="font-bold style={{ color: 'var(--color-text-primary)' }}">
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
          </UniversalCard>

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
                <UniversalCard
                  key={fee.id}
                  variant="compact"
                  size="sm"
                  title={fee.studentName}
                  subtitle={fee.monthName}
                  badges={[
                    { variant: getStatusVariant(fee.status), children: getStatusLabel(fee.status) }
                  ]}
                  onClick={() => {
                    setSelectedFee(fee);
                    setShowFeeModal(true);
                  }}
                >
                  <div className="flex items-center gap-4 mt-2">
                    <div className="text-right">
                      <p className="font-bold style={{ color: 'var(--color-text-primary)' }}">
                        {formatCurrency(fee.finalAmount + (fee.lateFee || 0))}
                      </p>
                      {fee.lateFee > 0 && (
                        <p className="text-xs text-red-600 dark:text-red-400">
                          +{formatCurrency(fee.lateFee)} mora
                        </p>
                      )}
                    </div>
                  </div>
                </UniversalCard>
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
                <UniversalCard
                  key={payment.id}
                  variant="compact"
                  size="md"
                  title={payment.payerName || 'Estudiante'}
                  subtitle={payment.payerEmail}
                  description={formatDate(payment.createdAt)}
                  badges={[
                    { variant: getStatusVariant(payment.status), children: getStatusLabel(payment.status) }
                  ]}
                >
                  <div className="flex justify-between items-start mt-2">
                    <p className="text-xs text-zinc-500 dark:text-zinc-500">
                      ID: {payment.mercadopagoPaymentId}
                    </p>
                    <div className="text-right">
                      <p className="text-2xl font-bold style={{ color: 'var(--color-text-primary)' }}">
                        {formatCurrency(payment.amount)}
                      </p>
                      <p className="text-xs style={{ color: 'var(--color-text-secondary)' }}">
                        {payment.paymentMethod}
                      </p>
                    </div>
                  </div>
                </UniversalCard>
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
                <UniversalCard
                  key={enrollment.id}
                  variant="compact"
                  size="md"
                  title={enrollment.studentName}
                  subtitle={enrollment.studentEmail}
                  description={`Año: ${enrollment.academicYear}`}
                  badges={[
                    { variant: getStatusVariant(enrollment.status), children: getStatusLabel(enrollment.status) }
                  ]}
                >
                  <div className="mt-2 space-y-2">
                    {enrollment.discount > 0 && (
                      <p className="text-sm text-green-600 dark:text-green-400">
                        Descuento: {enrollment.discount}% - {enrollment.discountReason}
                      </p>
                    )}

                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm style={{ color: 'var(--color-text-secondary)' }}">
                          Matrícula
                        </p>
                        <div className="flex items-center gap-2">
                          <p className="font-medium style={{ color: 'var(--color-text-primary)' }}">
                            {formatCurrency(enrollment.matriculaAmount)}
                          </p>
                          {enrollment.matriculaPaid ? (
                            <CheckCircle size={16} className="text-green-500" strokeWidth={2} />
                          ) : (
                            <AlertCircle size={16} className="text-amber-500" strokeWidth={2} />
                          )}
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-sm style={{ color: 'var(--color-text-secondary)' }}">
                          Cuota
                        </p>
                        <p className="font-medium style={{ color: 'var(--color-text-primary)' }}">
                          {formatCurrency(enrollment.cuotaAmount)}
                        </p>
                      </div>
                    </div>
                  </div>
                </UniversalCard>
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
              <p className="text-sm style={{ color: 'var(--color-text-secondary)' }}">Estudiante</p>
              <p className="text-lg font-semibold style={{ color: 'var(--color-text-primary)' }}">
                {selectedFee.studentName}
              </p>
            </div>

            <div>
              <p className="text-sm style={{ color: 'var(--color-text-secondary)' }}">Mes</p>
              <p className="font-medium style={{ color: 'var(--color-text-primary)' }}">
                {selectedFee.monthName}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm style={{ color: 'var(--color-text-secondary)' }}">Monto base</p>
                <p className="font-medium style={{ color: 'var(--color-text-primary)' }}">
                  {formatCurrency(selectedFee.amount)}
                </p>
              </div>

              <div>
                <p className="text-sm style={{ color: 'var(--color-text-secondary)' }}">Descuento</p>
                <p className="font-medium text-green-600 dark:text-green-400">
                  -{formatCurrency(selectedFee.discount || 0)}
                </p>
              </div>

              {selectedFee.lateFee > 0 && (
                <>
                  <div>
                    <p className="text-sm style={{ color: 'var(--color-text-secondary)' }}">Recargo</p>
                    <p className="font-medium text-red-600 dark:text-red-400">
                      +{formatCurrency(selectedFee.lateFee)}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm style={{ color: 'var(--color-text-secondary)' }}">Días de mora</p>
                    <p className="font-medium style={{ color: 'var(--color-text-primary)' }}">
                      {selectedFee.daysPastDue} días
                    </p>
                  </div>
                </>
              )}
            </div>

            <div className="pt-4 border-t style={{ borderColor: 'var(--color-border)' }}">
              <div className="flex justify-between items-center">
                <p className="text-lg font-semibold style={{ color: 'var(--color-text-primary)' }}">
                  Total
                </p>
                <p className="text-2xl font-bold style={{ color: 'var(--color-text-primary)' }}">
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
