import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BaseCard, BaseButton } from '../../components/base';
import { Users, BookOpen, TrendingUp, DollarSign, Shield, Settings } from 'lucide-react';

function DashboardScreen() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ totalUsers: 0, totalCourses: 0, activeStudents: 0, revenue: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setStats({ totalUsers: 127, totalCourses: 18, activeStudents: 89, revenue: 12450 });
      setLoading(false);
    }, 500);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-neutral-300 border-t-accent-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-text-primary dark:text-text-inverse mb-2">
          Admin Dashboard 🛡️
        </h1>
        <p className="text-text-secondary dark:text-neutral-400">System overview and management</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <BaseCard variant="stat" icon={<Users size={24} />} hover onClick={() => navigate('/admin/users')}>
          <p className="text-3xl font-bold mb-1">{stats.totalUsers}</p>
          <p className="text-sm opacity-90">Total Users</p>
        </BaseCard>
        <BaseCard variant="stat" icon={<BookOpen size={24} />} hover onClick={() => navigate('/admin/courses')}>
          <p className="text-3xl font-bold mb-1">{stats.totalCourses}</p>
          <p className="text-sm opacity-90">Total Courses</p>
        </BaseCard>
        <BaseCard variant="stat" icon={<TrendingUp size={24} />} hover onClick={() => navigate('/admin/analytics')}>
          <p className="text-3xl font-bold mb-1">{stats.activeStudents}</p>
          <p className="text-sm opacity-90">Active Students</p>
        </BaseCard>
        <BaseCard variant="stat" icon={<DollarSign size={24} />} hover onClick={() => navigate('/admin/payments')}>
          <p className="text-3xl font-bold mb-1">${stats.revenue.toLocaleString()}</p>
          <p className="text-sm opacity-90">Total Revenue</p>
        </BaseCard>
      </div>

      <BaseCard title="Quick Actions">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <BaseButton variant="primary" iconLeft={<Users size={18} />} onClick={() => navigate('/admin/users')} fullWidth>
            Manage Users
          </BaseButton>
          <BaseButton variant="secondary" iconLeft={<BookOpen size={18} />} onClick={() => navigate('/admin/courses')} fullWidth>
            Manage Courses
          </BaseButton>
          <BaseButton variant="secondary" iconLeft={<TrendingUp size={18} />} onClick={() => navigate('/admin/analytics')} fullWidth>
            View Analytics
          </BaseButton>
          <BaseButton variant="secondary" iconLeft={<DollarSign size={18} />} onClick={() => navigate('/admin/payments')} fullWidth>
            Payments
          </BaseButton>
          <BaseButton variant="secondary" iconLeft={<Shield size={18} />} onClick={() => navigate('/admin/settings')} fullWidth>
            System Settings
          </BaseButton>
        </div>
      </BaseCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <BaseCard title="Recent Activity">
          <div className="space-y-3">
            {['New user registered: John Doe', 'Course published: Advanced React', 'Payment received: $299'].map((activity, idx) => (
              <div key={idx} className="flex items-start gap-3 pb-3 border-b border-border dark:border-border-dark last:border-0">
                <div className="w-8 h-8 rounded-full bg-accent-500/10 flex items-center justify-center flex-shrink-0">
                  <Shield size={16} className="text-accent-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-text-primary dark:text-text-inverse">{activity}</p>
                  <p className="text-xs text-text-secondary dark:text-neutral-400 mt-1">{idx + 1} hour ago</p>
                </div>
              </div>
            ))}
          </div>
        </BaseCard>

        <BaseCard title="System Health">
          <div className="space-y-3">
            {[{ label: 'Server Status', value: 'Operational', status: 'good' },
              { label: 'Database', value: 'Healthy', status: 'good' },
              { label: 'API Response', value: '45ms avg', status: 'good' }].map((item) => (
              <div key={item.label} className="flex justify-between items-center">
                <span className="text-sm text-text-secondary dark:text-neutral-400">{item.label}</span>
                <span className="text-sm font-semibold text-accent-500">{item.value}</span>
              </div>
            ))}
          </div>
        </BaseCard>
      </div>
    </div>
  );
}

export default DashboardScreen;
