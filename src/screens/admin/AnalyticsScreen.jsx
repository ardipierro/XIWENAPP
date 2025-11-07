import { BaseCard } from '../../components/base';
import { TrendingUp, Users, BookOpen, DollarSign } from 'lucide-react';

function AnalyticsScreen() {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-text-primary dark:text-text-inverse mb-2">Analytics & Reports</h1>
        <p className="text-text-secondary dark:text-neutral-400">Platform-wide metrics and insights</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <BaseCard variant="stat" icon={<Users size={24} />}>
          <p className="text-3xl font-bold mb-1">127</p>
          <p className="text-sm opacity-90">Total Users</p>
        </BaseCard>
        <BaseCard variant="stat" icon={<BookOpen size={24} />}>
          <p className="text-3xl font-bold mb-1">18</p>
          <p className="text-sm opacity-90">Courses</p>
        </BaseCard>
        <BaseCard variant="stat" icon={<TrendingUp size={24} />}>
          <p className="text-3xl font-bold mb-1">92%</p>
          <p className="text-sm opacity-90">Engagement</p>
        </BaseCard>
        <BaseCard variant="stat" icon={<DollarSign size={24} />}>
          <p className="text-3xl font-bold mb-1">$12.4K</p>
          <p className="text-sm opacity-90">Revenue</p>
        </BaseCard>
      </div>

      <BaseCard title="Growth Trends" subtitle="User registration over time">
        <div className="h-64 flex items-center justify-center text-neutral-400">
          <p>Charts integration (recharts) - Phase 5</p>
        </div>
      </BaseCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <BaseCard title="Platform Usage">
          <div className="space-y-3">
            {[{ label: 'Active Users', value: '89/127', pct: 70 },
              { label: 'Course Completion', value: '78%', pct: 78 },
              { label: 'Avg Session Time', value: '24 min', pct: 85 }].map((item) => (
              <div key={item.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span>{item.label}</span>
                  <span className="font-semibold">{item.value}</span>
                </div>
                <div className="h-2 bg-primary-200 dark:bg-primary-800 rounded-full">
                  <div className="h-full bg-accent-500 rounded-full" style={{ width: `${item.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </BaseCard>

        <BaseCard title="Revenue Breakdown">
          <div className="space-y-2">
            {[{ label: 'Course Sales', amount: '$8,200' },
              { label: 'Subscriptions', amount: '$3,100' },
              { label: 'Other', amount: '$1,150' }].map((item) => (
              <div key={item.label} className="flex justify-between p-2 rounded bg-bg-secondary dark:bg-primary-800">
                <span className="text-sm">{item.label}</span>
                <span className="font-semibold text-accent-500">{item.amount}</span>
              </div>
            ))}
          </div>
        </BaseCard>
      </div>
    </div>
  );
}

export default AnalyticsScreen;
