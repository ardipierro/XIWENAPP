import { useState, useEffect } from 'react';
import { BaseCard, BaseButton } from '../../components/base';
import { Video, Users, Clock, Calendar } from 'lucide-react';

/**
 * ClassesScreen - Student classes/sessions view
 *
 * Features:
 * - Upcoming class sessions
 * - Past sessions
 * - Join live class button
 *
 * Uses BaseCard for session cards
 */
function ClassesScreen() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Load real sessions from Firebase
    setTimeout(() => {
      setSessions([
        {
          id: 1,
          title: 'React Advanced Patterns',
          teacher: 'Prof. Smith',
          date: new Date('2025-01-08T10:00:00'),
          duration: 60,
          isLive: true,
          attendees: 24,
        },
        {
          id: 2,
          title: 'JavaScript ES6 Features',
          teacher: 'Prof. Johnson',
          date: new Date('2025-01-09T14:00:00'),
          duration: 90,
          isLive: false,
          attendees: 18,
        },
        {
          id: 3,
          title: 'CSS Grid & Flexbox',
          teacher: 'Prof. Williams',
          date: new Date('2025-01-10T11:00:00'),
          duration: 75,
          isLive: false,
          attendees: 22,
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
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-text-primary dark:text-text-inverse mb-2">
          My Classes
        </h1>
        <p className="text-text-secondary dark:text-neutral-400">
          Upcoming and past class sessions
        </p>
      </div>

      {/* Sessions List */}
      <div className="space-y-4">
        {sessions.map((session) => (
          <BaseCard
            key={session.id}
            className={session.isLive ? 'border-2 border-accent-500' : ''}
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              {/* Session Info */}
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
                  <div className="flex items-center gap-2">
                    <Users size={14} />
                    <span>{session.teacher}</span>
                  </div>
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
                    <span>{session.attendees} attendees</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div>
                {session.isLive ? (
                  <BaseButton
                    variant="primary"
                    size="lg"
                    iconLeft={<Video size={18} />}
                    onClick={() => {
                      // TODO: Join live session
                    }}
                  >
                    Join Now
                  </BaseButton>
                ) : (
                  <BaseButton
                    variant="secondary"
                    onClick={() => {
                      // TODO: View session details
                    }}
                  >
                    View Details
                  </BaseButton>
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
