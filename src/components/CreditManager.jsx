import logger from '../utils/logger';

import { useState, useEffect } from 'react';
import {
  CreditCard, ShoppingCart, Minus, Calendar, CheckCircle, AlertTriangle,
  BarChart3, TrendingUp, Plus, FileText, Edit, Save, ClipboardList, X, Loader
} from 'lucide-react';
import {
  getUserCredits,
  addCredits,
  deductCredits,
  getCreditTransactions,
  getCreditStats,
  updateCreditNotes
} from '../firebase/credits';
import BaseButton from './common/BaseButton';
import { UniversalCard } from './cards';

function CreditManager({ userId, currentUser, onUpdate }) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    availableCredits: 0,
    totalPurchased: 0,
    totalUsed: 0,
    usagePercentage: 0
  });
  const [transactions, setTransactions] = useState([]);
  const [notes, setNotes] = useState('');
  const [editingNotes, setEditingNotes] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Modal para agregar/quitar créditos
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('add'); // 'add' o 'deduct'
  const [modalForm, setModalForm] = useState({
    amount: '',
    reason: ''
  });
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadData();
  }, [userId]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Cargar estadísticas
      const statsData = await getCreditStats(userId);
      setStats(statsData);

      // Cargar transacciones
      const transactionsData = await getCreditTransactions(userId);
      setTransactions(transactionsData);

      // Cargar notas
      const creditsData = await getUserCredits(userId);
      if (creditsData) {
        setNotes(creditsData.notes || '');
      }
    } catch (error) {
      logger.error('Error al cargar datos:', error);
      showMessage('error', 'Error al cargar información de créditos');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const handleOpenModal = (type) => {
    setModalType(type);
    setModalForm({ amount: '', reason: '' });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setModalForm({ amount: '', reason: '' });
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    setProcessing(true);

    try {
      const amount = parseInt(modalForm.amount);
      if (isNaN(amount) || amount <= 0) {
        showMessage('error', 'Ingresa una cantidad válida');
        setProcessing(false);
        return;
      }

      if (!modalForm.reason.trim()) {
        showMessage('error', 'Ingresa una razón');
        setProcessing(false);
        return;
      }

      let result;
      if (modalType === 'add') {
        result = await addCredits(userId, amount, modalForm.reason, currentUser.uid);
      } else {
        result = await deductCredits(userId, amount, modalForm.reason, currentUser.uid);
      }

      if (result.success) {
        showMessage('success', modalType === 'add' ? 'Créditos agregados exitosamente' : 'Créditos deducidos exitosamente');
        handleCloseModal();
        await loadData();
        if (onUpdate) onUpdate();
      } else {
        showMessage('error', result.error || 'Error al procesar la operación');
      }
    } catch (error) {
      logger.error('Error:', error);
      showMessage('error', 'Error inesperado al procesar créditos');
    } finally {
      setProcessing(false);
    }
  };

  const handleSaveNotes = async () => {
    try {
      const result = await updateCreditNotes(userId, notes);
      if (result.success) {
        showMessage('success', 'Notas guardadas');
        setEditingNotes(false);
      } else {
        showMessage('error', 'Error al guardar notas');
      }
    } catch (error) {
      logger.error('Error:', error);
      showMessage('error', 'Error al guardar notas');
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Nunca';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTransactionIcon = (type) => {
    const iconProps = { size: 20, strokeWidth: 2 };
    switch (type) {
      case 'purchase':
        return <ShoppingCart {...iconProps} />;
      case 'deduction':
        return <Minus {...iconProps} />;
      case 'class':
        return <Calendar {...iconProps} />;
      default:
        return <CreditCard {...iconProps} />;
    }
  };

  const getTransactionLabel = (type) => {
    switch (type) {
      case 'purchase':
        return 'Compra';
      case 'deduction':
        return 'Deducción';
      case 'class':
        return 'Clase';
      default:
        return 'Transacción';
    }
  };

  if (loading) {
    return (
      <div className="credit-manager loading">
        <div className="spinner"></div>
        <p>Cargando información de créditos...</p>
      </div>
    );
  }

  return (
    <div className="credit-manager">
      {/* Message */}
      {message.text && (
        <div className={`credit-message ${message.type}`}>
          {message.type === 'success' ? (
            <CheckCircle size={18} strokeWidth={2} className="inline-icon" />
          ) : (
            <AlertTriangle size={18} strokeWidth={2} className="inline-icon" />
          )} {message.text}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <UniversalCard
          variant="stats"
          size="sm"
          icon={CreditCard}
          bigNumber={stats.availableCredits}
          description="Disponibles"
        />

        <UniversalCard
          variant="stats"
          size="sm"
          icon={ShoppingCart}
          bigNumber={stats.totalPurchased}
          description="Comprados"
        />

        <UniversalCard
          variant="stats"
          size="sm"
          icon={BarChart3}
          bigNumber={stats.totalUsed}
          description="Usados"
        />

        <UniversalCard
          variant="stats"
          size="sm"
          icon={TrendingUp}
          bigNumber={`${stats.usagePercentage}%`}
          description="Uso"
        />
      </div>

      {/* Actions */}
      <div className="credit-actions">
        <BaseButton
          variant="primary"
          icon={Plus}
          onClick={() => handleOpenModal('add')}
        >
          Agregar Créditos
        </BaseButton>
        <BaseButton
          variant="secondary"
          icon={Minus}
          onClick={() => handleOpenModal('deduct')}
        >
          Quitar Créditos
        </BaseButton>
      </div>

      {/* Notes */}
      <div className="credit-notes-section">
        <div className="notes-header">
          <h3 className="notes-title flex items-center gap-2">
            <FileText size={20} strokeWidth={2} /> Notas
          </h3>
          {!editingNotes ? (
            <BaseButton
              variant="ghost"
              size="sm"
              icon={Edit}
              onClick={() => setEditingNotes(true)}
            >
              Editar
            </BaseButton>
          ) : (
            <div className="btn-group-sm">
              <BaseButton
                variant="ghost"
                size="sm"
                onClick={() => {
                  setEditingNotes(false);
                  loadData();
                }}
              >
                Cancelar
              </BaseButton>
              <BaseButton
                variant="primary"
                size="sm"
                icon={Save}
                onClick={handleSaveNotes}
              >
                Guardar
              </BaseButton>
            </div>
          )}
        </div>
        {editingNotes ? (
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="notes-textarea"
            placeholder="Notas sobre los créditos del usuario..."
            rows="4"
          />
        ) : (
          <div className="notes-display">
            {notes || '(Sin notas)'}
          </div>
        )}
      </div>

      {/* Transaction History */}
      <div className="transactions-section">
        <h3 className="section-title flex items-center gap-2">
          <ClipboardList size={20} strokeWidth={2} /> Historial de Transacciones
        </h3>

        {transactions.length === 0 ? (
          <div className="empty-transactions">
            <p>No hay transacciones registradas</p>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map(transaction => (
              <UniversalCard
                key={transaction.id}
                variant="default"
                size="sm"
                layout="horizontal"
                icon={() => getTransactionIcon(transaction.type)}
                title={getTransactionLabel(transaction.type)}
                description={transaction.reason}
                badges={[
                  {
                    variant: transaction.type === 'purchase' ? 'success' : 'warning',
                    children: `${transaction.type === 'purchase' ? '+' : '-'}${transaction.amount} créditos`
                  }
                ]}
                meta={[
                  { text: formatDate(transaction.createdAt) },
                  { text: `Saldo: ${transaction.balanceAfter}` }
                ]}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                {modalType === 'add' ? (
                  <><Plus size={20} strokeWidth={2} className="inline-icon" /> Agregar Créditos</>
                ) : (
                  <><Minus size={20} strokeWidth={2} className="inline-icon" /> Quitar Créditos</>
                )}
              </h2>
              <button
                className="modal-close-btn"
                onClick={handleCloseModal}
                disabled={processing}
                aria-label="Cerrar modal"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <div className="modal-content">
              <form onSubmit={handleModalSubmit} className="space-y-4">
                <div className="form-group">
                  <label className="label">Cantidad</label>
                  <input
                    type="number"
                    min="1"
                    value={modalForm.amount}
                    onChange={(e) => setModalForm({ ...modalForm, amount: e.target.value })}
                    className="input"
                    placeholder="Ej: 10"
                    required
                    disabled={processing}
                  />
                </div>

                <div className="form-group">
                  <label className="label">Razón</label>
                  <textarea
                    value={modalForm.reason}
                    onChange={(e) => setModalForm({ ...modalForm, reason: e.target.value })}
                    className="input"
                    placeholder="Describe el motivo de esta operación..."
                    rows="3"
                    required
                    disabled={processing}
                  />
                </div>

                {modalType === 'deduct' && stats.availableCredits < parseInt(modalForm.amount || 0) && (
                  <div className="alert alert-warning">
                    <AlertTriangle size={18} strokeWidth={2} /> El usuario no tiene suficientes créditos disponibles
                  </div>
                )}
              </form>
            </div>

            <div className="modal-footer">
              <BaseButton
                type="button"
                variant="outline"
                onClick={handleCloseModal}
                disabled={processing}
              >
                Cancelar
              </BaseButton>
              <BaseButton
                type="submit"
                variant="primary"
                disabled={processing}
                onClick={handleModalSubmit}
                icon={processing ? Loader : CheckCircle}
                iconClassName={processing ? "animate-spin" : ""}
              >
                {processing ? 'Procesando...' : (modalType === 'add' ? 'Agregar' : 'Quitar')}
              </BaseButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CreditManager;
