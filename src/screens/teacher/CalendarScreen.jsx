import { useState } from 'react';
import { BaseCard } from '../../components/base';
import { Calendar as CalendarIcon, Clock, MapPin } from 'lucide-react';

/**
 * CalendarScreen - Teacher calendar and schedule
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
      students: 24,
    },
    {
      id: 2,
      title: 'JavaScript Quiz Due',
      type: 'deadline',
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
      students: 22,
    },
  ]);

  const formatDate = (date) => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-text-primary dark:text-text-inverse mb-2">
          Calendar & Schedule
        </h1>
        <p className="text-text-secondary dark:text-neutral-400">
          View your upcoming classes and deadlines
        </p>
      </div>

      <BaseCard title="Calendar View" subtitle="Full calendar integration coming soon">
        <div className="flex items-center justify-center py-12 text-neutral-400">
          <CalendarIcon size={48} />
        </div>
      </BaseCard>

      <BaseCard title="Upcoming Events">
        <div className="space-y-3">
          {events.map((event) => (
            <div
              key={event.id}
              className={`p-4 rounded-lg border-l-4 ${
                event.type === 'class'
                  ? 'border-l-accent-500 bg-accent-500/5'
                  : 'border-l-neutral-500 bg-neutral-500/5'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="text-2xl">{event.type === 'class' ? '📚' : '📝'}</div>
                <div className="flex-1">
                  <h3 className="font-semibold text-text-primary dark:text-text-inverse mb-1">
                    {event.title}
                  </h3>
                  <div className="space-y-1 text-sm text-text-secondary dark:text-neutral-400">
                    <div className="flex items-center gap-2">
                      <Clock size={14} />
                      <span>{formatDate(event.date)}</span>
                    </div>
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
                    {event.students && (
                      <div className="text-xs">
                        <span className="font-medium">{event.students} students</span>
                      </div>
                    )}
                    {event.course && (
                      <div className="text-xs">
                        <span className="font-medium">Course: </span>
                        {event.course}
                      </div>
                    )}
                  </div>
                </div>
                <span
                  className={`px-2 py-1 rounded text-xs font-semibold ${
                    event.type === 'class' ? 'bg-accent-500 text-white' : 'bg-neutral-400 text-white'
                  }`}
                >
                  {event.type === 'class' ? 'Class' : 'Deadline'}
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
