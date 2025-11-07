import { useState, useEffect } from 'react';
import { BaseCard, BaseTable, BaseButton } from '../../components/base';
import { Plus, CheckCircle, Clock } from 'lucide-react';

/**
 * AssignmentsScreen - Teacher assignments management
 */
function AssignmentsScreen() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setAssignments([
        { id: 1, title: 'React Hooks Exercise', course: 'React', dueDate: new Date('2025-01-10'), submitted: 18, total: 24 },
        { id: 2, title: 'JavaScript Quiz', course: 'JavaScript', dueDate: new Date('2025-01-08'), submitted: 15, total: 18 },
        { id: 3, title: 'CSS Layout Project', course: 'CSS', dueDate: new Date('2025-01-05'), submitted: 22, total: 22 },
      ]);
      setLoading(false);
    }, 500);
  }, []);

  const columns = [
    {
      key: 'title',
      label: 'Assignment',
      render: (value, row) => (
        <div>
          <p className="font-semibold text-text-primary dark:text-text-inverse">{value}</p>
          <p className="text-xs text-text-secondary dark:text-neutral-400">{row.course}</p>
        </div>
      ),
    },
    {
      key: 'dueDate',
      label: 'Due Date',
      render: (value) => value.toLocaleDateString(),
    },
    {
      key: 'submitted',
      label: 'Submissions',
      render: (value, row) => (
        <div className="flex items-center gap-2">
          {value === row.total ? (
            <CheckCircle size={14} className="text-accent-500" />
          ) : (
            <Clock size={14} className="text-neutral-400" />
          )}
          <span className={value === row.total ? 'text-accent-500 font-semibold' : ''}>
            {value}/{row.total}
          </span>
        </div>
      ),
    },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-text-primary dark:text-text-inverse mb-2">
            Assignments
          </h1>
          <p className="text-text-secondary dark:text-neutral-400">
            Create and manage student assignments
          </p>
        </div>
        <BaseButton variant="primary" iconLeft={<Plus size={18} />}>
          Create Assignment
        </BaseButton>
      </div>

      <BaseCard>
        <BaseTable
          columns={columns}
          data={assignments}
          loading={loading}
          searchable
          onRowClick={(assignment) => console.log('View assignment:', assignment)}
        />
      </BaseCard>
    </div>
  );
}

export default AssignmentsScreen;
