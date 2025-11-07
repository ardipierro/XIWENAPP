import { useState, useEffect } from 'react';
import { BaseCard, BaseButton } from '../../components/base';
import { Video, Users, Calendar, Clock, Plus } from 'lucide-react';

/**
 * ClassesScreen - Teacher class sessions management
 */
function ClassesScreen() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setSessions([
        {
          id: 1,
          title: 'React Advanced Patterns',
          course: 'Introduction to React',
          date: new Date('2025-01-08T10:00:00'),
          duration: 60,
          students: 24,
          isLive: true,
        },
        {
          id: 2,
          title: 'JavaScript ES6 Features',
          course: 'JavaScript Fundamentals',
          date: new Date('2025-01-09T14:00:00'),
          duration: 90,
          students: 18,
          isLive: false,
        },
      ]);
      setLoading(false);
    }, 500);
  }, []);

  const formatDate = (date) => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-neutral-300 border-t-accent-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-text-primary dark:text-text-inverse mb-2">
            My Classes
          </h1>
          <p className="text-text-secondary dark:text-neutral-400">
            Manage and conduct live class sessions
          </p>
        </div>
        <BaseButton variant="primary" iconLeft={<Plus size={18} />}>
          Schedule Class
        </BaseButton>
      </div>

      <div className="space-y-4">
        {sessions.map((session) => (
          <BaseCard
            key={session.id}
            className={session.isLive ? 'border-2 border-accent-500' : ''}
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-bold text-text-primary dark:text-text-inverse">
                    {session.title}
                  </h3>
                  {session.isLive && (
                    <span className="px-2 py-1 bg-error text-white text-xs font-semibold rounded animate-pulse">
                      LIVE
                    </span>
                  )}
                </div>
                <div className="space-y-1 text-sm text-text-secondary dark:text-neutral-400">
                  <p>{session.course}</p>
                  <div className="flex items-center gap-2">
                    <Calendar size={14} />
                    <span>{formatDate(session.date)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={14} />
                    <span>{session.duration} minutes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users size={14} />
                    <span>{session.students} students</span>
                  </div>
                </div>
              </div>
              <div>
                {session.isLive ? (
                  <BaseButton
                    variant="primary"
                    size="lg"
                    iconLeft={<Video size={18} />}
                  >
                    Start Class
                  </BaseButton>
                ) : (
                  <BaseButton variant="secondary">Edit</BaseButton>
                )}
              </div>
            </div>
          </BaseCard>
        ))}
      </div>
    </div>
  );
}

export default ClassesScreen;
