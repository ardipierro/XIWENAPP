import { useState, useEffect } from 'react';
import { BaseCard, BaseTable, BaseButton } from '../../components/base';
import { UserPlus, Crown, GraduationCap, Users as UsersIcon } from 'lucide-react';

function UsersScreen() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setUsers([
        { id: 1, name: 'John Admin', email: 'john@admin.com', role: 'admin', status: 'active', created: '2024-01-15' },
        { id: 2, name: 'Prof. Smith', email: 'smith@teacher.com', role: 'teacher', status: 'active', created: '2024-02-01' },
        { id: 3, name: 'Alice Student', email: 'alice@student.com', role: 'student', status: 'active', created: '2024-03-10' },
        { id: 4, name: 'Bob Teacher', email: 'bob@teacher.com', role: 'teacher', status: 'active', created: '2024-03-15' },
        { id: 5, name: 'Charlie Student', email: 'charlie@student.com', role: 'student', status: 'inactive', created: '2024-04-01' },
      ]);
      setLoading(false);
    }, 500);
  }, []);

  const getRoleIcon = (role) => {
    if (role === 'admin') return <Crown size={14} className="text-accent-500" />;
    if (role === 'teacher') return <GraduationCap size={14} className="text-accent-500" />;
    return <UsersIcon size={14} className="text-accent-500" />;
  };

  const columns = [
    {
      key: 'name',
      label: 'User',
      render: (value, row) => (
        <div className="flex items-center gap-2">
          {getRoleIcon(row.role)}
          <div>
            <p className="font-semibold text-text-primary dark:text-text-inverse">{value}</p>
            <p className="text-xs text-text-secondary dark:text-neutral-400">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      label: 'Role',
      render: (value) => (
        <span className={`px-2 py-1 rounded text-xs font-semibold ${
          value === 'admin' ? 'bg-accent-500 text-white' :
          value === 'teacher' ? 'bg-neutral-500 text-white' : 'bg-neutral-400 text-white'
        }`}>{value}</span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => (
        <span className={`px-2 py-1 rounded text-xs font-semibold ${
          value === 'active' ? 'bg-accent-500 text-white' : 'bg-neutral-400 text-white'
        }`}>{value}</span>
      ),
    },
    { key: 'created', label: 'Created' },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-text-primary dark:text-text-inverse mb-2">User Management</h1>
          <p className="text-text-secondary dark:text-neutral-400">{users.length} total users</p>
        </div>
        <BaseButton variant="primary" iconLeft={<UserPlus size={18} />}>Add User</BaseButton>
      </div>

      <BaseCard>
        <BaseTable columns={columns} data={users} loading={loading} searchable searchPlaceholder="Search users..." />
      </BaseCard>
    </div>
  );
}

export default UsersScreen;
