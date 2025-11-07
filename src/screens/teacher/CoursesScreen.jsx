import { useState, useEffect } from 'react';
import { BaseCard, BaseButton, BaseModal } from '../../components/base';
import { BookOpen, Plus, Users, TrendingUp } from 'lucide-react';

/**
 * CoursesScreen - Teacher courses management
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
          students: 24,
          lessons: 12,
          progress: 68,
          image: '⚛️',
        },
        {
          id: 2,
          title: 'JavaScript Fundamentals',
          students: 18,
          lessons: 20,
          progress: 45,
          image: '📘',
        },
        {
          id: 3,
          title: 'CSS for Beginners',
          students: 22,
          lessons: 15,
          progress: 90,
          image: '🎨',
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-text-primary dark:text-text-inverse mb-2">
            My Courses
          </h1>
          <p className="text-text-secondary dark:text-neutral-400">
            {courses.length} courses • Manage your teaching content
          </p>
        </div>
        <BaseButton variant="primary" iconLeft={<Plus size={18} />}>
          Create Course
        </BaseButton>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {courses.map((course) => (
          <BaseCard
            key={course.id}
            hover
            onClick={() => setSelectedCourse(course)}
          >
            <div className="text-6xl mb-4 text-center">{course.image}</div>
            <h3 className="text-lg font-bold text-text-primary dark:text-text-inverse mb-2">
              {course.title}
            </h3>
            <div className="space-y-2 text-sm text-text-secondary dark:text-neutral-400">
              <div className="flex items-center gap-2">
                <Users size={14} />
                <span>{course.students} students enrolled</span>
              </div>
              <div className="flex items-center gap-2">
                <BookOpen size={14} />
                <span>{course.lessons} lessons</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp size={14} />
                <span>Avg. progress: {course.progress}%</span>
              </div>
            </div>
          </BaseCard>
        ))}
      </div>

      {selectedCourse && (
        <BaseModal
          title={selectedCourse.title}
          isOpen={!!selectedCourse}
          onClose={() => setSelectedCourse(null)}
          footer={
            <>
              <BaseButton variant="secondary" onClick={() => setSelectedCourse(null)}>
                Close
              </BaseButton>
              <BaseButton variant="primary">Manage Content</BaseButton>
            </>
          }
        >
          <div className="space-y-4">
            <div className="text-6xl text-center mb-4">{selectedCourse.image}</div>
            <div className="grid grid-cols-3 gap-4 p-4 bg-bg-secondary dark:bg-primary-800 rounded-lg">
              <div className="text-center">
                <p className="text-2xl font-bold text-accent-500">{selectedCourse.students}</p>
                <p className="text-xs text-text-secondary dark:text-neutral-400 mt-1">Students</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-text-primary dark:text-text-inverse">{selectedCourse.lessons}</p>
                <p className="text-xs text-text-secondary dark:text-neutral-400 mt-1">Lessons</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-accent-500">{selectedCourse.progress}%</p>
                <p className="text-xs text-text-secondary dark:text-neutral-400 mt-1">Avg. Progress</p>
              </div>
            </div>
          </div>
        </BaseModal>
      )}
    </div>
  );
}

export default CoursesScreen;
