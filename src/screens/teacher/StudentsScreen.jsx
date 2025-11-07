import { useState, useEffect } from 'react';
import { BaseCard, BaseTable, BaseButton } from '../../components/base';
import { UserPlus } from 'lucide-react';

/**
 * StudentsScreen - Teacher student management
 */
function StudentsScreen() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setStudents([
        { id: 1, name: 'Alice Johnson', email: 'alice@example.com', courses: 3, avgGrade: 92, status: 'active' },
        { id: 2, name: 'Bob Smith', email: 'bob@example.com', courses: 2, avgGrade: 85, status: 'active' },
        { id: 3, name: 'Charlie Brown', email: 'charlie@example.com', courses: 4, avgGrade: 78, status: 'active' },
        { id: 4, name: 'Diana Prince', email: 'diana@example.com', courses: 3, avgGrade: 95, status: 'active' },
        { id: 5, name: 'Eve Martinez', email: 'eve@example.com', courses: 2, avgGrade: 88, status: 'inactive' },
      ]);
      setLoading(false);
    }, 500);
  }, []);

  const columns = [
    {
      key: 'name',
      label: 'Student',
      render: (value, row) => (
        <div>
          <p className="font-semibold text-text-primary dark:text-text-inverse">{value}</p>
          <p className="text-xs text-text-secondary dark:text-neutral-400">{row.email}</p>
        </div>
      ),
    },
    { key: 'courses', label: 'Enrolled Courses' },
    {
      key: 'avgGrade',
      label: 'Avg. Grade',
      render: (value) => (
        <span className={`font-semibold ${value >= 90 ? 'text-accent-500' : ''}`}>
          {value}%
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => (
        <span className={`px-2 py-1 rounded text-xs font-semibold ${
          value === 'active' ? 'bg-accent-500 text-white' : 'bg-neutral-400 text-white'
        }`}>
          {value}
        </span>
      ),
    },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-text-primary dark:text-text-inverse mb-2">
            My Students
          </h1>
          <p className="text-text-secondary dark:text-neutral-400">
            {students.length} students • Manage your class roster
          </p>
        </div>
        <BaseButton variant="primary" iconLeft={<UserPlus size={18} />}>
          Add Student
        </BaseButton>
      </div>

      <BaseCard>
        <BaseTable
          columns={columns}
          data={students}
          loading={loading}
          searchable
          searchPlaceholder="Search students..."
          onRowClick={(student) => console.log('View student:', student)}
        />
      </BaseCard>
    </div>
  );
}

export default StudentsScreen;
