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
import { BaseButton, BaseInput, BaseTextarea, BaseModal } from './common';

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
      <div className="flex items-center justify-center p-8">
        <div className="spinner"></div>
        <p className="ml-4 text-gray-600 dark:text-gray-400">Cargando información de créditos...</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Message */}
      {message.text && (
        <div className={`mb-4 p-3 rounded-lg border ${
          message.type === 'success'
            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-300'
            : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle size={18} strokeWidth={2} className="inline mr-2" />
          ) : (
            <AlertTriangle size={18} strokeWidth={2} className="inline mr-2" />
          )} {message.text}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
              <CreditCard size={20} strokeWidth={2} className="text-zinc-600 dark:text-zinc-400" />
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">{stats.availableCredits}</div>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Disponibles</div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
              <ShoppingCart size={20} strokeWidth={2} className="text-zinc-600 dark:text-zinc-400" />
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalPurchased}</div>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Comprados</div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
              <BarChart3 size={20} strokeWidth={2} className="text-zinc-600 dark:text-zinc-400" />
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalUsed}</div>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Usados</div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
              <TrendingUp size={20} strokeWidth={2} className="text-zinc-600 dark:text-zinc-400" />
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">{stats.usagePercentage}%</div>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Uso</div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 mb-6">
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
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
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
            <div className="flex gap-2">
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
          <BaseTextarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notas sobre los créditos del usuario..."
            rows={4}
          />
        ) : (
          <div className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
            {notes || '(Sin notas)'}
          </div>
        )}
      </div>

      {/* Transaction History */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
          <ClipboardList size={20} strokeWidth={2} /> Historial de Transacciones
        </h3>

        {transactions.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <p>No hay transacciones registradas</p>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map(transaction => (
              <div key={transaction.id} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
                <div className="w-10 h-10 rounded-lg bg-white dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                  {getTransactionIcon(transaction.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {getTransactionLabel(transaction.type)}
                    </span>
                    <span className={`text-lg font-bold ${transaction.type === 'purchase' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {transaction.type === 'purchase' ? '+' : '-'}{transaction.amount}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {transaction.reason}
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-500">
                    <span>{formatDate(transaction.createdAt)}</span>
                    <span>Saldo: {transaction.balanceAfter}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      <BaseModal
        isOpen={showModal}
        onClose={handleCloseModal}
        title={modalType === 'add' ? 'Agregar Créditos' : 'Quitar Créditos'}
        icon={modalType === 'add' ? Plus : Minus}
        size="md"
      >
        <form onSubmit={handleModalSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Cantidad
            </label>
            <BaseInput
              type="number"
              min="1"
              value={modalForm.amount}
              onChange={(e) => setModalForm({ ...modalForm, amount: e.target.value })}
              placeholder="Ej: 10"
              required
              disabled={processing}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Razón
            </label>
            <BaseTextarea
              value={modalForm.reason}
              onChange={(e) => setModalForm({ ...modalForm, reason: e.target.value })}
              placeholder="Describe el motivo de esta operación..."
              rows={3}
              required
              disabled={processing}
            />
          </div>

          {modalType === 'deduct' && stats.availableCredits < parseInt(modalForm.amount || 0) && (
            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-amber-800 dark:text-amber-300">
              <AlertTriangle size={18} strokeWidth={2} className="inline mr-2" />
              El usuario no tiene suficientes créditos disponibles
            </div>
          )}

          <div className="flex gap-2 justify-end pt-4">
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
              loading={processing}
              icon={processing ? undefined : CheckCircle}
            >
              {processing ? 'Procesando...' : (modalType === 'add' ? 'Agregar' : 'Quitar')}
            </BaseButton>
          </div>
        </form>
      </BaseModal>
    </div>
  );
}

export default CreditManager;
