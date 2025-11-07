import { BaseCard } from '../../components/base';
import { TrendingUp, Users, BookOpen, Target } from 'lucide-react';

/**
 * AnalyticsScreen - Teacher analytics and insights
 */
function AnalyticsScreen() {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-text-primary dark:text-text-inverse mb-2">
          Analytics & Insights
        </h1>
        <p className="text-text-secondary dark:text-neutral-400">
          Track student performance and course metrics
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <BaseCard variant="stat" icon={<Users size={24} />}>
          <p className="text-3xl font-bold mb-1">42</p>
          <p className="text-sm opacity-90">Active Students</p>
        </BaseCard>
        <BaseCard variant="stat" icon={<BookOpen size={24} />}>
          <p className="text-3xl font-bold mb-1">87%</p>
          <p className="text-sm opacity-90">Avg. Completion</p>
        </BaseCard>
        <BaseCard variant="stat" icon={<Target size={24} />}>
          <p className="text-3xl font-bold mb-1">4.6/5</p>
          <p className="text-sm opacity-90">Course Rating</p>
        </BaseCard>
        <BaseCard variant="stat" icon={<TrendingUp size={24} />}>
          <p className="text-3xl font-bold mb-1">+12%</p>
          <p className="text-sm opacity-90">Growth</p>
        </BaseCard>
      </div>

      {/* Charts Placeholder */}
      <BaseCard title="Performance Trends" subtitle="Student progress over time">
        <div className="h-64 flex items-center justify-center text-neutral-400">
          <p>Charts coming in Phase 4 (recharts integration)</p>
        </div>
      </BaseCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <BaseCard title="Top Performing Students">
          <div className="space-y-2">
            {['Alice Johnson', 'Diana Prince', 'Bob Smith'].map((name, idx) => (
              <div key={name} className="flex items-center justify-between p-2 rounded bg-bg-secondary dark:bg-primary-800">
                <span className="font-semibold">#{idx + 1} {name}</span>
                <span className="text-accent-500">95%</span>
              </div>
            ))}
          </div>
        </BaseCard>

        <BaseCard title="Course Engagement">
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>React Course</span>
                <span className="font-semibold">92%</span>
              </div>
              <div className="h-2 bg-primary-200 dark:bg-primary-800 rounded-full">
                <div className="h-full bg-accent-500 rounded-full" style={{ width: '92%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>JavaScript Course</span>
                <span className="font-semibold">85%</span>
              </div>
              <div className="h-2 bg-primary-200 dark:bg-primary-800 rounded-full">
                <div className="h-full bg-accent-500 rounded-full" style={{ width: '85%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>CSS Course</span>
                <span className="font-semibold">78%</span>
              </div>
              <div className="h-2 bg-primary-200 dark:bg-primary-800 rounded-full">
                <div className="h-full bg-accent-500 rounded-full" style={{ width: '78%' }} />
              </div>
            </div>
          </div>
        </BaseCard>
      </div>
    </div>
  );
}

export default AnalyticsScreen;
