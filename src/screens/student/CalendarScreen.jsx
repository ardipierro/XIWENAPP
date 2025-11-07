import { useState } from 'react';
import { BaseCard } from '../../components/base';
import { Calendar as CalendarIcon, Clock, MapPin } from 'lucide-react';

/**
 * CalendarScreen - Student calendar view
 *
 * Features:
 * - Upcoming events list
 * - Event details
 * - Date/time display
 *
 * Uses BaseCard for event cards
 * Note: Full calendar component would be added in later phase
 */
function CalendarScreen() {
  const [events] = useState([
    {
      id: 1,
      title: 'React Advanced Patterns Class',
      type: 'class',
      date: new Date('2025-01-08T10:00:00'),
      duration: 60,
      location: 'Online - Zoom',
      teacher: 'Prof. Smith',
    },
    {
      id: 2,
      title: 'JavaScript Quiz Due',
      type: 'assignment',
      date: new Date('2025-01-08T23:59:00'),
      course: 'JavaScript Fundamentals',
    },
    {
      id: 3,
      title: 'CSS Grid & Flexbox Class',
      type: 'class',
      date: new Date('2025-01-10T11:00:00'),
      duration: 75,
      location: 'Online - Zoom',
      teacher: 'Prof. Williams',
    },
    {
      id: 4,
      title: 'Node.js API Assignment Due',
      type: 'assignment',
      date: new Date('2025-01-15T23:59:00'),
      course: 'Node.js Backend Development',
    },
  ]);

  const formatDate = (date) => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const getEventColor = (type) => {
    return type === 'class'
      ? 'border-l-accent-500 bg-accent-500/5'
      : 'border-l-neutral-500 bg-neutral-500/5';
  };

  const getEventIcon = (type) => {
    return type === 'class' ? '📚' : '📝';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-text-primary dark:text-text-inverse mb-2">
          Calendar
        </h1>
        <p className="text-text-secondary dark:text-neutral-400">
          Upcoming classes and assignment due dates
        </p>
      </div>

      {/* Calendar Placeholder */}
      <BaseCard
        title="Calendar View"
        subtitle="Full calendar component coming soon"
      >
        <div className="flex items-center justify-center py-12 text-neutral-400">
          <CalendarIcon size={48} />
        </div>
      </BaseCard>

      {/* Upcoming Events */}
      <BaseCard title="Upcoming Events">
        <div className="space-y-3">
          {events.map((event) => (
            <div
              key={event.id}
              className={`
                p-4 rounded-lg border-l-4
                ${getEventColor(event.type)}
              `}
            >
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div className="text-2xl">{getEventIcon(event.type)}</div>

                {/* Content */}
                <div className="flex-1">
                  <h3 className="font-semibold text-text-primary dark:text-text-inverse mb-1">
                    {event.title}
                  </h3>

                  <div className="space-y-1 text-sm text-text-secondary dark:text-neutral-400">
                    <div className="flex items-center gap-2">
                      <Clock size={14} />
                      <span>{formatDate(event.date)}</span>
                    </div>

                    {event.type === 'class' && (
                      <>
                        {event.duration && (
                          <div className="flex items-center gap-2">
                            <Clock size={14} />
                            <span>{event.duration} minutes</span>
                          </div>
                        )}
                        {event.location && (
                          <div className="flex items-center gap-2">
                            <MapPin size={14} />
                            <span>{event.location}</span>
                          </div>
                        )}
                        {event.teacher && (
                          <div className="text-xs">
                            <span className="font-medium">Teacher: </span>
                            {event.teacher}
                          </div>
                        )}
                      </>
                    )}

                    {event.type === 'assignment' && event.course && (
                      <div className="text-xs">
                        <span className="font-medium">Course: </span>
                        {event.course}
                      </div>
                    )}
                  </div>
                </div>

                {/* Type Badge */}
                <span
                  className={`
                    px-2 py-1 rounded text-xs font-semibold
                    ${event.type === 'class'
                      ? 'bg-accent-500 text-white'
                      : 'bg-neutral-400 text-white'
                    }
                  `}
                >
                  {event.type === 'class' ? 'Class' : 'Assignment'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </BaseCard>
    </div>
  );
}

export default CalendarScreen;
