import { useState, useEffect } from 'react';
import { BaseCard, BaseButton, BaseModal } from '../../components/base';
import { BookOpen, Play, CheckCircle, Clock, TrendingUp } from 'lucide-react';

/**
 * CoursesScreen - Student courses view
 *
 * Features:
 * - Grid of enrolled courses
 * - Course progress
 * - Continue learning CTA
 * - Course details modal
 *
 * Uses BaseCard for course cards
 */
function CoursesScreen() {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Load real courses from Firebase
    setTimeout(() => {
      setCourses([
        {
          id: 1,
          title: 'Introduction to React',
          description: 'Learn the basics of React and build modern web apps',
          progress: 75,
          lessons: 12,
          completedLessons: 9,
          image: '🎨',
        },
        {
          id: 2,
          title: 'JavaScript Fundamentals',
          description: 'Master JavaScript from scratch',
          progress: 45,
          lessons: 20,
          completedLessons: 9,
          image: '📘',
        },
        {
          id: 3,
          title: 'CSS for Beginners',
          description: 'Design beautiful websites with CSS',
          progress: 90,
          lessons: 15,
          completedLessons: 13,
          image: '🎨',
        },
        {
          id: 4,
          title: 'Node.js Backend Development',
          description: 'Build scalable backend applications',
          progress: 20,
          lessons: 18,
          completedLessons: 4,
          image: '⚙️',
        },
      ]);
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
          My Courses
        </h1>
        <p className="text-text-secondary dark:text-neutral-400">
          {courses.length} courses enrolled • Keep learning!
        </p>
      </div>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {courses.map((course) => (
          <BaseCard
            key={course.id}
            hover
            onClick={() => setSelectedCourse(course)}
            className="cursor-pointer"
          >
            {/* Course Image/Icon */}
            <div className="text-6xl mb-4 text-center">{course.image}</div>

            {/* Title */}
            <h3 className="text-lg font-bold text-text-primary dark:text-text-inverse mb-2">
              {course.title}
            </h3>

            {/* Description */}
            <p className="text-sm text-text-secondary dark:text-neutral-400 mb-4 line-clamp-2">
              {course.description}
            </p>

            {/* Progress */}
            <div className="mb-4">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-text-secondary dark:text-neutral-400">
                  Progress
                </span>
                <span className="font-semibold text-accent-500">
                  {course.progress}%
                </span>
              </div>
              <div className="h-2 bg-primary-200 dark:bg-primary-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent-500 rounded-full transition-all duration-500"
                  style={{ width: `${course.progress}%` }}
                />
              </div>
            </div>

            {/* Lessons */}
            <div className="flex items-center justify-between text-sm text-text-secondary dark:text-neutral-400">
              <span className="flex items-center gap-1">
                <CheckCircle size={14} />
                {course.completedLessons}/{course.lessons} lessons
              </span>
              {course.progress < 100 ? (
                <Clock size={14} />
              ) : (
                <CheckCircle size={14} className="text-accent-500" />
              )}
            </div>
          </BaseCard>
        ))}
      </div>

      {/* Course Details Modal */}
      {selectedCourse && (
        <BaseModal
          title={selectedCourse.title}
          isOpen={!!selectedCourse}
          onClose={() => setSelectedCourse(null)}
          size="lg"
          footer={
            <>
              <BaseButton
                variant="secondary"
                onClick={() => setSelectedCourse(null)}
              >
                Close
              </BaseButton>
              <BaseButton
                variant="primary"
                iconLeft={<Play size={18} />}
                onClick={() => {
                  // TODO: Navigate to course content
                  setSelectedCourse(null);
                }}
              >
                Continue Learning
              </BaseButton>
            </>
          }
        >
          <div className="space-y-4">
            {/* Icon */}
            <div className="text-6xl text-center mb-4">
              {selectedCourse.image}
            </div>

            {/* Description */}
            <p className="text-text-secondary dark:text-neutral-400">
              {selectedCourse.description}
            </p>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 p-4 bg-bg-secondary dark:bg-primary-800 rounded-lg">
              <div className="text-center">
                <p className="text-2xl font-bold text-accent-500">
                  {selectedCourse.progress}%
                </p>
                <p className="text-xs text-text-secondary dark:text-neutral-400 mt-1">
                  Complete
                </p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-text-primary dark:text-text-inverse">
                  {selectedCourse.lessons}
                </p>
                <p className="text-xs text-text-secondary dark:text-neutral-400 mt-1">
                  Lessons
                </p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-accent-500">
                  {selectedCourse.completedLessons}
                </p>
                <p className="text-xs text-text-secondary dark:text-neutral-400 mt-1">
                  Completed
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp size={16} className="text-accent-500" />
                <span className="text-sm font-semibold text-text-primary dark:text-text-inverse">
                  Your Progress
                </span>
              </div>
              <div className="h-3 bg-primary-200 dark:bg-primary-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent-500 rounded-full transition-all duration-500"
                  style={{ width: `${selectedCourse.progress}%` }}
                />
              </div>
            </div>
          </div>
        </BaseModal>
      )}
    </div>
  );
}

export default CoursesScreen;
