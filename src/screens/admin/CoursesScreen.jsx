import { useState, useEffect } from 'react';
import { BaseCard, BaseButton } from '../../components/base';
import { Plus, Users, BookOpen } from 'lucide-react';

function CoursesScreen() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setCourses([
        { id: 1, title: 'Introduction to React', students: 45, lessons: 12, published: true, image: '⚛️' },
        { id: 2, title: 'JavaScript Fundamentals', students: 32, lessons: 20, published: true, image: '📘' },
        { id: 3, title: 'Advanced CSS', students: 28, lessons: 15, published: false, image: '🎨' },
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
          <h1 className="text-3xl font-bold text-text-primary dark:text-text-inverse mb-2">Course Management</h1>
          <p className="text-text-secondary dark:text-neutral-400">{courses.length} total courses</p>
        </div>
        <BaseButton variant="primary" iconLeft={<Plus size={18} />}>Create Course</BaseButton>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {courses.map((course) => (
          <BaseCard key={course.id} hover>
            <div className="text-6xl mb-4 text-center">{course.image}</div>
            <h3 className="text-lg font-bold text-text-primary dark:text-text-inverse mb-2">{course.title}</h3>
            <div className="space-y-2 text-sm text-text-secondary dark:text-neutral-400">
              <div className="flex items-center gap-2">
                <Users size={14} />
                <span>{course.students} students</span>
              </div>
              <div className="flex items-center gap-2">
                <BookOpen size={14} />
                <span>{course.lessons} lessons</span>
              </div>
              <div>
                <span className={`px-2 py-1 rounded text-xs font-semibold ${
                  course.published ? 'bg-accent-500 text-white' : 'bg-neutral-400 text-white'
                }`}>{course.published ? 'Published' : 'Draft'}</span>
              </div>
            </div>
          </BaseCard>
        ))}
      </div>
    </div>
  );
}

export default CoursesScreen;
