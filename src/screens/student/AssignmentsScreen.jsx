import { useState, useEffect } from 'react';
import { BaseCard, BaseTable, BaseButton, BaseBadge } from '../../components/base';
import { Clock, CheckCircle, AlertCircle } from 'lucide-react';

/**
 * AssignmentsScreen - Student assignments view
 *
 * Features:
 * - Table of assignments
 * - Status badges (pending, submitted, graded)
 * - Due date warnings
 * - Submit action
 *
 * Uses BaseTable for assignments list
 */
function AssignmentsScreen() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Load real assignments from Firebase
    setTimeout(() => {
      setAssignments([
        {
          id: 1,
          title: 'React Hooks Exercise',
          course: 'Introduction to React',
          dueDate: new Date('2025-01-10'),
          status: 'pending',
          points: 100,
        },
        {
          id: 2,
          title: 'JavaScript Quiz',
          course: 'JavaScript Fundamentals',
          dueDate: new Date('2025-01-08'),
          status: 'submitted',
          points: 50,
        },
        {
          id: 3,
          title: 'CSS Layout Project',
          course: 'CSS for Beginners',
          dueDate: new Date('2025-01-05'),
          status: 'graded',
          grade: 95,
          points: 100,
        },
        {
          id: 4,
          title: 'Node.js API Assignment',
          course: 'Node.js Backend Development',
          dueDate: new Date('2025-01-15'),
          status: 'pending',
          points: 150,
        },
      ]);
      setLoading(false);
    }, 500);
  }, []);

  // Status badge component
  const StatusBadge = ({ status, grade }) => {
    const variants = {
      pending: { color: 'bg-neutral-400', text: 'Pending', icon: Clock },
      submitted: { color: 'bg-accent-500', text: 'Submitted', icon: CheckCircle },
      graded: { color: 'bg-accent-500', text: `Graded (${grade})`, icon: CheckCircle },
    };

    const variant = variants[status];
    const Icon = variant.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold text-white ${variant.color}`}>
        <Icon size={12} />
        {variant.text}
      </span>
    );
  };

  // Format date
  const formatDate = (date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  };

  // Check if overdue
  const isOverdue = (dueDate, status) => {
    return status === 'pending' && new Date() > dueDate;
  };

  // Table columns
  const columns = [
    {
      key: 'title',
      label: 'Assignment',
      render: (value, row) => (
        <div>
          <p className="font-semibold text-text-primary dark:text-text-inverse">
            {value}
          </p>
          <p className="text-xs text-text-secondary dark:text-neutral-400 mt-1">
            {row.course}
          </p>
        </div>
      ),
    },
    {
      key: 'dueDate',
      label: 'Due Date',
      render: (value, row) => (
        <div className="flex items-center gap-2">
          {isOverdue(value, row.status) && (
            <AlertCircle size={14} className="text-error" />
          )}
          <span className={isOverdue(value, row.status) ? 'text-error font-semibold' : ''}>
            {formatDate(value)}
          </span>
        </div>
      ),
    },
    {
      key: 'points',
      label: 'Points',
      render: (value) => (
        <span className="font-semibold">{value}</span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (value, row) => <StatusBadge status={value} grade={row.grade} />,
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: (_, row) => (
        <BaseButton
          size="sm"
          variant={row.status === 'pending' ? 'primary' : 'secondary'}
          onClick={(e) => {
            e.stopPropagation();
            // TODO: Navigate to assignment submission
          }}
        >
          {row.status === 'pending' ? 'Submit' : 'View'}
        </BaseButton>
      ),
    },
  ];

  // Summary stats
  const stats = {
    total: assignments.length,
    pending: assignments.filter((a) => a.status === 'pending').length,
    submitted: assignments.filter((a) => a.status === 'submitted').length,
    graded: assignments.filter((a) => a.status === 'graded').length,
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-text-primary dark:text-text-inverse mb-2">
          Assignments
        </h1>
        <p className="text-text-secondary dark:text-neutral-400">
          Track and submit your assignments
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <BaseCard variant="default">
          <p className="text-2xl font-bold text-text-primary dark:text-text-inverse">
            {stats.total}
          </p>
          <p className="text-sm text-text-secondary dark:text-neutral-400 mt-1">
            Total Assignments
          </p>
        </BaseCard>
        <BaseCard variant="default">
          <p className="text-2xl font-bold text-neutral-500">
            {stats.pending}
          </p>
          <p className="text-sm text-text-secondary dark:text-neutral-400 mt-1">
            Pending
          </p>
        </BaseCard>
        <BaseCard variant="default">
          <p className="text-2xl font-bold text-accent-500">
            {stats.submitted}
          </p>
          <p className="text-sm text-text-secondary dark:text-neutral-400 mt-1">
            Submitted
          </p>
        </BaseCard>
        <BaseCard variant="default">
          <p className="text-2xl font-bold text-accent-500">
            {stats.graded}
          </p>
          <p className="text-sm text-text-secondary dark:text-neutral-400 mt-1">
            Graded
          </p>
        </BaseCard>
      </div>

      {/* Assignments Table */}
      <BaseCard>
        <BaseTable
          columns={columns}
          data={assignments}
          loading={loading}
          searchable
          searchPlaceholder="Search assignments..."
          emptyMessage="No assignments found"
        />
      </BaseCard>
    </div>
  );
}

export default AssignmentsScreen;
