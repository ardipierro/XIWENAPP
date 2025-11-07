import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BaseCard, BaseButton } from '../../components/base';
import {
  Users,
  BookOpen,
  ClipboardList,
  Presentation,
  TrendingUp,
  Calendar,
  CheckCircle,
  Clock,
} from 'lucide-react';

/**
 * DashboardScreen - Teacher overview/home screen
 *
 * Features:
 * - Stats cards (students, courses, classes, assignments)
 * - Quick actions
 * - Recent activity
 * - Upcoming classes
 */
function DashboardScreen() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeCourses: 0,
    upcomingClasses: 0,
    pendingGrading: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Load real data from Firebase
    setTimeout(() => {
      setStats({
        totalStudents: 42,
        activeCourses: 3,
        upcomingClasses: 5,
        pendingGrading: 12,
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
          Teacher Dashboard 📚
        </h1>
        <p className="text-text-secondary dark:text-neutral-400">
          Welcome back! Here's your teaching overview
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <BaseCard
          variant="stat"
          icon={<Users size={24} />}
          hover
          onClick={() => navigate('/teacher/students')}
        >
          <p className="text-3xl font-bold mb-1">{stats.totalStudents}</p>
          <p className="text-sm opacity-90">Total Students</p>
        </BaseCard>

        <BaseCard
          variant="stat"
          icon={<BookOpen size={24} />}
          hover
          onClick={() => navigate('/teacher/courses')}
        >
          <p className="text-3xl font-bold mb-1">{stats.activeCourses}</p>
          <p className="text-sm opacity-90">Active Courses</p>
        </BaseCard>

        <BaseCard
          variant="stat"
          icon={<Presentation size={24} />}
          hover
          onClick={() => navigate('/teacher/classes')}
        >
          <p className="text-3xl font-bold mb-1">{stats.upcomingClasses}</p>
          <p className="text-sm opacity-90">Upcoming Classes</p>
        </BaseCard>

        <BaseCard
          variant="stat"
          icon={<ClipboardList size={24} />}
          hover
          onClick={() => navigate('/teacher/assignments')}
        >
          <p className="text-3xl font-bold mb-1">{stats.pendingGrading}</p>
          <p className="text-sm opacity-90">Pending Grading</p>
        </BaseCard>
      </div>

      {/* Quick Actions */}
      <BaseCard title="Quick Actions">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <BaseButton
            variant="primary"
            iconLeft={<Presentation size={18} />}
            onClick={() => navigate('/teacher/classes')}
            fullWidth
          >
            Start Live Class
          </BaseButton>
          <BaseButton
            variant="secondary"
            iconLeft={<ClipboardList size={18} />}
            onClick={() => navigate('/teacher/assignments')}
            fullWidth
          >
            Create Assignment
          </BaseButton>
          <BaseButton
            variant="secondary"
            iconLeft={<BookOpen size={18} />}
            onClick={() => navigate('/teacher/courses')}
            fullWidth
          >
            Manage Courses
          </BaseButton>
          <BaseButton
            variant="secondary"
            iconLeft={<Users size={18} />}
            onClick={() => navigate('/teacher/students')}
            fullWidth
          >
            View Students
          </BaseButton>
          <BaseButton
            variant="secondary"
            iconLeft={<TrendingUp size={18} />}
            onClick={() => navigate('/teacher/analytics')}
            fullWidth
          >
            View Analytics
          </BaseButton>
          <BaseButton
            variant="secondary"
            iconLeft={<Calendar size={18} />}
            onClick={() => navigate('/teacher/calendar')}
            fullWidth
          >
            Check Schedule
          </BaseButton>
        </div>
      </BaseCard>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Upcoming Classes */}
        <BaseCard
          title="Upcoming Classes"
          icon={<Presentation size={20} className="text-accent-500" />}
        >
          <div className="space-y-3">
            <div className="flex items-start gap-3 pb-3 border-b border-border dark:border-border-dark">
              <div className="w-8 h-8 rounded-full bg-accent-500/10 flex items-center justify-center flex-shrink-0">
                <Presentation size={16} className="text-accent-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-text-primary dark:text-text-inverse">
                  React Advanced Patterns
                </p>
                <p className="text-xs text-text-secondary dark:text-neutral-400 mt-1">
                  Today at 10:00 AM • 24 students
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 pb-3 border-b border-border dark:border-border-dark">
              <div className="w-8 h-8 rounded-full bg-accent-500/10 flex items-center justify-center flex-shrink-0">
                <Presentation size={16} className="text-accent-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-text-primary dark:text-text-inverse">
                  JavaScript ES6 Features
                </p>
                <p className="text-xs text-text-secondary dark:text-neutral-400 mt-1">
                  Tomorrow at 2:00 PM • 18 students
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-accent-500/10 flex items-center justify-center flex-shrink-0">
                <Presentation size={16} className="text-accent-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-text-primary dark:text-text-inverse">
                  CSS Grid & Flexbox
                </p>
                <p className="text-xs text-text-secondary dark:text-neutral-400 mt-1">
                  Friday at 11:00 AM • 22 students
                </p>
              </div>
            </div>
          </div>
        </BaseCard>

        {/* Recent Activity */}
        <BaseCard
          title="Recent Activity"
          icon={<Clock size={20} className="text-accent-500" />}
        >
          <div className="space-y-3">
            <div className="flex items-start gap-3 pb-3 border-b border-border dark:border-border-dark">
              <div className="w-8 h-8 rounded-full bg-accent-500/10 flex items-center justify-center flex-shrink-0">
                <CheckCircle size={16} className="text-accent-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-text-primary dark:text-text-inverse">
                  Graded: JavaScript Quiz
                </p>
                <p className="text-xs text-text-secondary dark:text-neutral-400 mt-1">
                  15 submissions graded • 1 hour ago
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 pb-3 border-b border-border dark:border-border-dark">
              <div className="w-8 h-8 rounded-full bg-accent-500/10 flex items-center justify-center flex-shrink-0">
                <ClipboardList size={16} className="text-accent-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-text-primary dark:text-text-inverse">
                  Created: React Hooks Assignment
                </p>
                <p className="text-xs text-text-secondary dark:text-neutral-400 mt-1">
                  Due: January 15 • 3 hours ago
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-accent-500/10 flex items-center justify-center flex-shrink-0">
                <Users size={16} className="text-accent-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-text-primary dark:text-text-inverse">
                  New Student Enrolled
                </p>
                <p className="text-xs text-text-secondary dark:text-neutral-400 mt-1">
                  John Doe joined React Course • Yesterday
                </p>
              </div>
            </div>
          </div>
        </BaseCard>
      </div>
    </div>
  );
}

export default DashboardScreen;
