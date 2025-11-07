import { useState, useEffect } from 'react';
import { BaseCard, BaseTable, BaseButton, BaseModal } from '../../components/base';
import { CreditCard, Download, DollarSign, Calendar, CheckCircle, XCircle } from 'lucide-react';

/**
 * PaymentsScreen - Student payment history and management
 *
 * Features:
 * - Transaction history
 * - Payment methods
 * - Invoice downloads
 * - Payment status tracking
 * - Subscription management
 */
function PaymentsScreen() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  useEffect(() => {
    setTimeout(() => {
      setTransactions([
        { id: 1, course: 'React Basics', amount: 299, status: 'completed', date: '2024-02-15', method: 'Credit Card (****1234)', invoice: 'INV-001' },
        { id: 2, course: 'JavaScript Pro', amount: 399, status: 'completed', date: '2024-01-10', method: 'PayPal', invoice: 'INV-002' },
        { id: 3, course: 'Advanced CSS', amount: 199, status: 'completed', date: '2023-12-05', method: 'Credit Card (****1234)', invoice: 'INV-003' },
        { id: 4, course: 'Monthly Subscription', amount: 49, status: 'pending', date: '2024-03-01', method: 'Credit Card (****1234)', invoice: null },
      ]);
      setLoading(false);
    }, 500);
  }, []);

  const handleDownloadInvoice = (transaction) => {
    setSelectedInvoice(transaction);
    setInvoiceModalOpen(true);
  };

  const totalSpent = transactions.filter(t => t.status === 'completed').reduce((sum, t) => sum + t.amount, 0);
  const pendingAmount = transactions.filter(t => t.status === 'pending').reduce((sum, t) => sum + t.amount, 0);

  const columns = [
    {
      key: 'course',
      label: 'Description',
      render: (value, row) => (
        <div>
          <p className="font-semibold text-text-primary dark:text-text-inverse">{value}</p>
          <p className="text-xs text-text-secondary dark:text-neutral-400">{row.invoice || 'Pending'}</p>
        </div>
      ),
    },
    {
      key: 'amount',
      label: 'Amount',
      render: (value) => (
        <span className="font-semibold text-accent-500">${value}</span>
      ),
    },
    {
      key: 'method',
      label: 'Payment Method',
    },
    {
      key: 'date',
      label: 'Date',
      render: (value) => (
        <div className="flex items-center gap-2">
          <Calendar size={14} className="text-text-secondary dark:text-neutral-400" />
          <span>{value}</span>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => (
        <span className={`px-2 py-1 rounded text-xs font-semibold flex items-center gap-1 w-fit ${
          value === 'completed' ? 'bg-accent-500 text-white' :
          value === 'pending' ? 'bg-neutral-400 text-white' : 'bg-red-500 text-white'
        }`}>
          {value === 'completed' ? <CheckCircle size={12} /> : <XCircle size={12} />}
          {value}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        row.invoice ? (
          <BaseButton
            variant="secondary"
            size="sm"
            iconLeft={<Download size={14} />}
            onClick={() => handleDownloadInvoice(row)}
          >
            Invoice
          </BaseButton>
        ) : (
          <span className="text-xs text-text-secondary dark:text-neutral-400">-</span>
        )
      ),
    },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-text-primary dark:text-text-inverse mb-2">Payment History</h1>
        <p className="text-text-secondary dark:text-neutral-400">{transactions.length} total transactions</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <BaseCard variant="stat" icon={<DollarSign size={24} />}>
          <p className="text-3xl font-bold mb-1">${totalSpent}</p>
          <p className="text-sm opacity-90">Total Spent</p>
        </BaseCard>
        <BaseCard variant="stat" icon={<CreditCard size={24} />}>
          <p className="text-3xl font-bold mb-1">{transactions.filter(t => t.status === 'completed').length}</p>
          <p className="text-sm opacity-90">Completed</p>
        </BaseCard>
        <BaseCard variant="stat" icon={<Calendar size={24} />}>
          <p className="text-3xl font-bold mb-1">${pendingAmount}</p>
          <p className="text-sm opacity-90">Pending</p>
        </BaseCard>
      </div>

      {/* Payment Methods */}
      <BaseCard title="Payment Methods">
        <div className="space-y-3">
          <div className="flex justify-between items-center p-4 rounded-lg bg-bg-secondary dark:bg-primary-800">
            <div className="flex items-center gap-3">
              <div className="w-12 h-8 bg-neutral-700 rounded flex items-center justify-center">
                <CreditCard size={20} className="text-white" />
              </div>
              <div>
                <p className="font-semibold text-text-primary dark:text-text-inverse">Visa ending in 1234</p>
                <p className="text-xs text-text-secondary dark:text-neutral-400">Expires 12/25</p>
              </div>
            </div>
            <span className="px-2 py-1 rounded text-xs font-semibold bg-accent-500 text-white">Default</span>
          </div>

          <div className="flex justify-between items-center p-4 rounded-lg bg-bg-secondary dark:bg-primary-800">
            <div className="flex items-center gap-3">
              <div className="w-12 h-8 bg-blue-600 rounded flex items-center justify-center">
                <span className="text-white text-xs font-bold">PP</span>
              </div>
              <div>
                <p className="font-semibold text-text-primary dark:text-text-inverse">PayPal</p>
                <p className="text-xs text-text-secondary dark:text-neutral-400">student@email.com</p>
              </div>
            </div>
          </div>

          <BaseButton variant="secondary" fullWidth>Add Payment Method</BaseButton>
        </div>
      </BaseCard>

      {/* Transaction History */}
      <BaseCard title="Transaction History">
        <BaseTable columns={columns} data={transactions} loading={loading} searchable searchPlaceholder="Search transactions..." />
      </BaseCard>

      {/* Invoice Modal */}
      <BaseModal
        isOpen={invoiceModalOpen}
        onClose={() => setInvoiceModalOpen(false)}
        title="Invoice Details"
        size="lg"
        footer={
          <>
            <BaseButton variant="secondary" onClick={() => setInvoiceModalOpen(false)}>Close</BaseButton>
            <BaseButton variant="primary" iconLeft={<Download size={18} />}>Download PDF</BaseButton>
          </>
        }
      >
        {selectedInvoice && (
          <div className="space-y-6">
            <div className="border-b border-border dark:border-border-dark pb-4">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-2xl font-bold text-text-primary dark:text-text-inverse">XIWENAPP</h3>
                  <p className="text-sm text-text-secondary dark:text-neutral-400">Educational Platform</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-text-primary dark:text-text-inverse">{selectedInvoice.invoice}</p>
                  <p className="text-sm text-text-secondary dark:text-neutral-400">{selectedInvoice.date}</p>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-text-primary dark:text-text-inverse mb-3">Invoice Items</h4>
              <div className="space-y-2">
                <div className="flex justify-between p-3 rounded bg-bg-secondary dark:bg-primary-800">
                  <span className="text-text-primary dark:text-text-inverse">{selectedInvoice.course}</span>
                  <span className="font-semibold text-text-primary dark:text-text-inverse">${selectedInvoice.amount}</span>
                </div>
              </div>
            </div>

            <div className="border-t border-border dark:border-border-dark pt-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-text-primary dark:text-text-inverse">Total</span>
                <span className="text-2xl font-bold text-accent-500">${selectedInvoice.amount}</span>
              </div>
            </div>

            <div className="bg-bg-secondary dark:bg-primary-800 p-4 rounded-lg">
              <p className="text-sm text-text-secondary dark:text-neutral-400">
                <strong>Payment Method:</strong> {selectedInvoice.method}
              </p>
              <p className="text-sm text-text-secondary dark:text-neutral-400 mt-2">
                <strong>Status:</strong> <span className="text-accent-500 font-semibold capitalize">{selectedInvoice.status}</span>
              </p>
            </div>
          </div>
        )}
      </BaseModal>
    </div>
  );
}

export default PaymentsScreen;
