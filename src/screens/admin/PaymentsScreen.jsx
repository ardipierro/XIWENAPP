import { useState, useEffect } from 'react';
import { BaseCard, BaseTable, BaseButton } from '../../components/base';
import { DollarSign, TrendingUp, CreditCard, Download } from 'lucide-react';

function PaymentsScreen() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setTransactions([
        { id: 1, user: 'Alice Student', course: 'React Basics', amount: 299, status: 'completed', date: '2024-02-15', method: 'credit_card' },
        { id: 2, user: 'Bob Student', course: 'JavaScript Pro', amount: 399, status: 'completed', date: '2024-02-14', method: 'paypal' },
        { id: 3, user: 'Charlie Student', course: 'Advanced CSS', amount: 199, status: 'pending', date: '2024-02-13', method: 'credit_card' },
        { id: 4, user: 'David Student', course: 'React Basics', amount: 299, status: 'completed', date: '2024-02-12', method: 'credit_card' },
        { id: 5, user: 'Eve Student', course: 'Web Development', amount: 499, status: 'failed', date: '2024-02-11', method: 'paypal' },
      ]);
      setLoading(false);
    }, 500);
  }, []);

  const columns = [
    {
      key: 'user',
      label: 'Customer',
      render: (value, row) => (
        <div>
          <p className="font-semibold text-text-primary dark:text-text-inverse">{value}</p>
          <p className="text-xs text-text-secondary dark:text-neutral-400">{row.course}</p>
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
      label: 'Method',
      render: (value) => (
        <span className="text-sm">{value === 'credit_card' ? 'Credit Card' : 'PayPal'}</span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => (
        <span className={`px-2 py-1 rounded text-xs font-semibold ${
          value === 'completed' ? 'bg-accent-500 text-white' :
          value === 'pending' ? 'bg-neutral-400 text-white' : 'bg-red-500 text-white'
        }`}>{value}</span>
      ),
    },
    { key: 'date', label: 'Date' },
  ];

  const totalRevenue = transactions.filter(t => t.status === 'completed').reduce((sum, t) => sum + t.amount, 0);
  const pendingRevenue = transactions.filter(t => t.status === 'pending').reduce((sum, t) => sum + t.amount, 0);
  const completedCount = transactions.filter(t => t.status === 'completed').length;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-text-primary dark:text-text-inverse mb-2">Payment Management</h1>
          <p className="text-text-secondary dark:text-neutral-400">{transactions.length} total transactions</p>
        </div>
        <BaseButton variant="secondary" iconLeft={<Download size={18} />}>Export Report</BaseButton>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <BaseCard variant="stat" icon={<DollarSign size={24} />}>
          <p className="text-3xl font-bold mb-1">${totalRevenue.toLocaleString()}</p>
          <p className="text-sm opacity-90">Total Revenue</p>
        </BaseCard>
        <BaseCard variant="stat" icon={<TrendingUp size={24} />}>
          <p className="text-3xl font-bold mb-1">${pendingRevenue}</p>
          <p className="text-sm opacity-90">Pending</p>
        </BaseCard>
        <BaseCard variant="stat" icon={<CreditCard size={24} />}>
          <p className="text-3xl font-bold mb-1">{completedCount}</p>
          <p className="text-sm opacity-90">Completed</p>
        </BaseCard>
        <BaseCard variant="stat" icon={<TrendingUp size={24} />}>
          <p className="text-3xl font-bold mb-1">{((totalRevenue / 10000) * 100).toFixed(1)}%</p>
          <p className="text-sm opacity-90">Growth</p>
        </BaseCard>
      </div>

      <BaseCard>
        <BaseTable columns={columns} data={transactions} loading={loading} searchable searchPlaceholder="Search transactions..." />
      </BaseCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <BaseCard title="Payment Methods">
          <div className="space-y-3">
            {[{ method: 'Credit Card', count: 3, amount: 897 },
              { method: 'PayPal', count: 2, amount: 798 }].map((item) => (
              <div key={item.method} className="flex justify-between items-center p-3 rounded bg-bg-secondary dark:bg-primary-800">
                <div>
                  <p className="font-semibold text-text-primary dark:text-text-inverse">{item.method}</p>
                  <p className="text-xs text-text-secondary dark:text-neutral-400">{item.count} transactions</p>
                </div>
                <span className="text-lg font-bold text-accent-500">${item.amount}</span>
              </div>
            ))}
          </div>
        </BaseCard>

        <BaseCard title="Recent Failures">
          <div className="space-y-2">
            {transactions.filter(t => t.status === 'failed').map((trans) => (
              <div key={trans.id} className="p-3 rounded bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                <p className="text-sm font-semibold text-text-primary dark:text-text-inverse">{trans.user}</p>
                <p className="text-xs text-text-secondary dark:text-neutral-400">${trans.amount} - {trans.date}</p>
              </div>
            ))}
          </div>
        </BaseCard>
      </div>
    </div>
  );
}

export default PaymentsScreen;
