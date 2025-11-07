import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BaseCard, BaseButton } from '../../components/base';
import {
  BookOpen,
  ClipboardList,
  Trophy,
  Calendar,
  TrendingUp,
  Target,
} from 'lucide-react';

/**
 * DashboardScreen - Student overview/home screen
 *
 * Features:
 * - Stats cards (courses, assignments, achievements)
 * - Quick actions
 * - Recent activity
 * - Upcoming events
 *
 * Uses BaseCard for all content boxes
 */
function DashboardScreen() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    enrolledCourses: 0,
    pendingAssignments: 0,
    achievements: 0,
    upcomingClasses: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Load real data from Firebase
    setTimeout(() => {
      setStats({
        enrolledCourses: 5,
        pendingAssignments: 3,
        achievements: 12,
        upcomingClasses: 2,
      });
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
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-text-primary dark:text-text-inverse mb-2">
          Welcome Back! 👋
        </h1>
        <p className="text-text-secondary dark:text-neutral-400">
          Here's what's happening with your learning today
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <BaseCard
          variant="stat"
          icon={<BookOpen size={24} />}
          hover
          onClick={() => navigate('/student/courses')}
        >
          <p className="text-3xl font-bold mb-1">{stats.enrolledCourses}</p>
          <p className="text-sm opacity-90">Enrolled Courses</p>
        </BaseCard>

        <BaseCard
          variant="stat"
          icon={<ClipboardList size={24} />}
          hover
          onClick={() => navigate('/student/assignments')}
        >
          <p className="text-3xl font-bold mb-1">{stats.pendingAssignments}</p>
          <p className="text-sm opacity-90">Pending Assignments</p>
        </BaseCard>

        <BaseCard
          variant="stat"
          icon={<Trophy size={24} />}
          hover
          onClick={() => navigate('/student/gamification')}
        >
          <p className="text-3xl font-bold mb-1">{stats.achievements}</p>
          <p className="text-sm opacity-90">Achievements</p>
        </BaseCard>

        <BaseCard
          variant="stat"
          icon={<Calendar size={24} />}
          hover
          onClick={() => navigate('/student/calendar')}
        >
          <p className="text-3xl font-bold mb-1">{stats.upcomingClasses}</p>
          <p className="text-sm opacity-90">Upcoming Classes</p>
        </BaseCard>
      </div>

      {/* Quick Actions */}
      <BaseCard title="Quick Actions">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <BaseButton
            variant="primary"
            iconLeft={<BookOpen size={18} />}
            onClick={() => navigate('/student/courses')}
            fullWidth
          >
            Browse Courses
          </BaseButton>
          <BaseButton
            variant="secondary"
            iconLeft={<ClipboardList size={18} />}
            onClick={() => navigate('/student/assignments')}
            fullWidth
          >
            View Assignments
          </BaseButton>
          <BaseButton
            variant="secondary"
            iconLeft={<Calendar size={18} />}
            onClick={() => navigate('/student/calendar')}
            fullWidth
          >
            Check Schedule
          </BaseButton>
          <BaseButton
            variant="secondary"
            iconLeft={<Trophy size={18} />}
            onClick={() => navigate('/student/gamification')}
            fullWidth
          >
            View Achievements
          </BaseButton>
        </div>
      </BaseCard>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <BaseCard
          title="Recent Activity"
          icon={<TrendingUp size={20} className="text-accent-500" />}
        >
          <div className="space-y-3">
            <div className="flex items-start gap-3 pb-3 border-b border-border dark:border-border-dark">
              <div className="w-8 h-8 rounded-full bg-accent-500/10 flex items-center justify-center flex-shrink-0">
                <BookOpen size={16} className="text-accent-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-text-primary dark:text-text-inverse">
                  Completed: Introduction to React
                </p>
                <p className="text-xs text-text-secondary dark:text-neutral-400 mt-1">
                  2 hours ago
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 pb-3 border-b border-border dark:border-border-dark">
              <div className="w-8 h-8 rounded-full bg-accent-500/10 flex items-center justify-center flex-shrink-0">
                <ClipboardList size={16} className="text-accent-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-text-primary dark:text-text-inverse">
                  Submitted: JavaScript Assignment
                </p>
                <p className="text-xs text-text-secondary dark:text-neutral-400 mt-1">
                  Yesterday
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-accent-500/10 flex items-center justify-center flex-shrink-0">
                <Trophy size={16} className="text-accent-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-text-primary dark:text-text-inverse">
                  Earned: Quick Learner Badge
                </p>
                <p className="text-xs text-text-secondary dark:text-neutral-400 mt-1">
                  2 days ago
                </p>
              </div>
            </div>
          </div>
        </BaseCard>

        <BaseCard
          title="Progress"
          icon={<Target size={20} className="text-accent-500" />}
        >
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-text-secondary dark:text-neutral-400">
                  Overall Progress
                </span>
                <span className="font-semibold text-text-primary dark:text-text-inverse">
                  68%
                </span>
              </div>
              <div className="h-2 bg-primary-200 dark:bg-primary-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent-500 rounded-full transition-all duration-500"
                  style={{ width: '68%' }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-text-secondary dark:text-neutral-400">
                  Assignments Completed
                </span>
                <span className="font-semibold text-text-primary dark:text-text-inverse">
                  85%
                </span>
              </div>
              <div className="h-2 bg-primary-200 dark:bg-primary-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent-500 rounded-full transition-all duration-500"
                  style={{ width: '85%' }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-text-secondary dark:text-neutral-400">
                  Course Progress
                </span>
                <span className="font-semibold text-text-primary dark:text-text-inverse">
                  52%
                </span>
              </div>
              <div className="h-2 bg-primary-200 dark:bg-primary-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent-500 rounded-full transition-all duration-500"
                  style={{ width: '52%' }}
                />
              </div>
            </div>
          </div>
        </BaseCard>
      </div>
    </div>
  );
}

export default DashboardScreen;
