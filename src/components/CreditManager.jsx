import { useState, useEffect } from 'react';
import {
  getUserCredits,
  addCredits,
  deductCredits,
  getCreditTransactions,
  getCreditStats,
  updateCreditNotes
} from '../firebase/credits';
import './CreditManager.css';

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
      console.error('Error al cargar datos:', error);
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
      console.error('Error:', error);
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
      console.error('Error:', error);
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
    switch (type) {
      case 'purchase':
        return '💰';
      case 'deduction':
        return '➖';
      case 'class':
        return '📅';
      default:
        return '💳';
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
          {message.type === 'success' ? '✅' : '⚠️'} {message.text}
        </div>
      )}

      {/* Stats Cards */}
      <div className="credit-stats-grid">
        <div className="credit-stat-card available">
          <div className="stat-icon">💳</div>
          <div className="stat-content">
            <div className="stat-value">{stats.availableCredits}</div>
            <div className="stat-label">Créditos Disponibles</div>
          </div>
        </div>

        <div className="credit-stat-card purchased">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <div className="stat-value">{stats.totalPurchased}</div>
            <div className="stat-label">Total Comprados</div>
          </div>
        </div>

        <div className="credit-stat-card used">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <div className="stat-value">{stats.totalUsed}</div>
            <div className="stat-label">Total Usados</div>
          </div>
        </div>

        <div className="credit-stat-card usage">
          <div className="stat-icon">📈</div>
          <div className="stat-content">
            <div className="stat-value">{stats.usagePercentage}%</div>
            <div className="stat-label">Uso</div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="credit-actions">
        <button
          className="btn btn-primary"
          onClick={() => handleOpenModal('add')}
        >
          ➕ Agregar Créditos
        </button>
        <button
          className="btn btn-secondary"
          onClick={() => handleOpenModal('deduct')}
        >
          ➖ Quitar Créditos
        </button>
      </div>

      {/* Notes */}
      <div className="credit-notes-section">
        <div className="notes-header">
          <h3 className="notes-title">📝 Notas</h3>
          {!editingNotes ? (
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setEditingNotes(true)}
            >
              ✏️ Editar
            </button>
          ) : (
            <div className="btn-group-sm">
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  setEditingNotes(false);
                  loadData();
                }}
              >
                Cancelar
              </button>
              <button
                className="btn btn-primary btn-sm"
                onClick={handleSaveNotes}
              >
                💾 Guardar
              </button>
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
        <h3 className="section-title">📋 Historial de Transacciones</h3>

        {transactions.length === 0 ? (
          <div className="empty-transactions">
            <p>No hay transacciones registradas</p>
          </div>
        ) : (
          <div className="transactions-list">
            {transactions.map(transaction => (
              <div key={transaction.id} className={`transaction-item ${transaction.type}`}>
                <div className="transaction-icon">
                  {getTransactionIcon(transaction.type)}
                </div>
                <div className="transaction-content">
                  <div className="transaction-header">
                    <span className="transaction-type">
                      {getTransactionLabel(transaction.type)}
                    </span>
                    <span className={`transaction-amount ${transaction.type === 'purchase' ? 'positive' : 'negative'}`}>
                      {transaction.type === 'purchase' ? '+' : '-'}{transaction.amount}
                    </span>
                  </div>
                  <div className="transaction-reason">
                    {transaction.reason}
                  </div>
                  <div className="transaction-footer">
                    <span className="transaction-date">
                      {formatDate(transaction.createdAt)}
                    </span>
                    <span className="transaction-balance">
                      Saldo: {transaction.balanceAfter}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content credit-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                {modalType === 'add' ? '➕ Agregar Créditos' : '➖ Quitar Créditos'}
              </h2>
              <button
                className="modal-close"
                onClick={handleCloseModal}
                disabled={processing}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleModalSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Cantidad</label>
                  <input
                    type="number"
                    min="1"
                    value={modalForm.amount}
                    onChange={(e) => setModalForm({ ...modalForm, amount: e.target.value })}
                    className="form-input"
                    placeholder="Ej: 10"
                    required
                    disabled={processing}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Razón</label>
                  <textarea
                    value={modalForm.reason}
                    onChange={(e) => setModalForm({ ...modalForm, reason: e.target.value })}
                    className="form-textarea"
                    placeholder="Describe el motivo de esta operación..."
                    rows="3"
                    required
                    disabled={processing}
                  />
                </div>

                {modalType === 'deduct' && stats.availableCredits < parseInt(modalForm.amount || 0) && (
                  <div className="warning-message">
                    ⚠️ El usuario no tiene suficientes créditos disponibles
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={handleCloseModal}
                  disabled={processing}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={processing}
                >
                  {processing ? '⏳ Procesando...' : (modalType === 'add' ? '✅ Agregar' : '✅ Quitar')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default CreditManager;
