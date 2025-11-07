import { useState, useEffect } from 'react';
import { BaseCard, BaseTable, BaseButton } from '../../components/base';
import { Plus, FileText, Video, BookOpen, Link as LinkIcon } from 'lucide-react';

function ContentScreen() {
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setContent([
        { id: 1, title: 'Introduction to React Hooks', type: 'lesson', course: 'React Basics', status: 'published', created: '2024-01-10' },
        { id: 2, title: 'JavaScript ES6 Features', type: 'reading', course: 'JS Fundamentals', status: 'published', created: '2024-01-15' },
        { id: 3, title: 'CSS Grid Tutorial', type: 'video', course: 'Advanced CSS', status: 'draft', created: '2024-02-01' },
        { id: 4, title: 'MDN Web Docs Reference', type: 'link', course: 'Web Development', status: 'published', created: '2024-02-05' },
        { id: 5, title: 'State Management with Redux', type: 'lesson', course: 'React Advanced', status: 'published', created: '2024-02-10' },
      ]);
      setLoading(false);
    }, 500);
  }, []);

  const getTypeIcon = (type) => {
    if (type === 'lesson') return <FileText size={14} className="text-accent-500" />;
    if (type === 'video') return <Video size={14} className="text-accent-500" />;
    if (type === 'reading') return <BookOpen size={14} className="text-accent-500" />;
    return <LinkIcon size={14} className="text-accent-500" />;
  };

  const columns = [
    {
      key: 'title',
      label: 'Content',
      render: (value, row) => (
        <div className="flex items-center gap-2">
          {getTypeIcon(row.type)}
          <div>
            <p className="font-semibold text-text-primary dark:text-text-inverse">{value}</p>
            <p className="text-xs text-text-secondary dark:text-neutral-400">{row.course}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'type',
      label: 'Type',
      render: (value) => (
        <span className={`px-2 py-1 rounded text-xs font-semibold ${
          value === 'lesson' ? 'bg-accent-500 text-white' :
          value === 'video' ? 'bg-neutral-500 text-white' :
          value === 'reading' ? 'bg-neutral-400 text-white' : 'bg-neutral-300 text-neutral-700'
        }`}>{value}</span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => (
        <span className={`px-2 py-1 rounded text-xs font-semibold ${
          value === 'published' ? 'bg-accent-500 text-white' : 'bg-neutral-400 text-white'
        }`}>{value}</span>
      ),
    },
    { key: 'created', label: 'Created' },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-text-primary dark:text-text-inverse mb-2">Content Management</h1>
          <p className="text-text-secondary dark:text-neutral-400">{content.length} total content items</p>
        </div>
        <BaseButton variant="primary" iconLeft={<Plus size={18} />}>Add Content</BaseButton>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <BaseCard variant="stat" icon={<FileText size={24} />}>
          <p className="text-3xl font-bold mb-1">{content.filter(c => c.type === 'lesson').length}</p>
          <p className="text-sm opacity-90">Lessons</p>
        </BaseCard>
        <BaseCard variant="stat" icon={<Video size={24} />}>
          <p className="text-3xl font-bold mb-1">{content.filter(c => c.type === 'video').length}</p>
          <p className="text-sm opacity-90">Videos</p>
        </BaseCard>
        <BaseCard variant="stat" icon={<BookOpen size={24} />}>
          <p className="text-3xl font-bold mb-1">{content.filter(c => c.type === 'reading').length}</p>
          <p className="text-sm opacity-90">Readings</p>
        </BaseCard>
        <BaseCard variant="stat" icon={<LinkIcon size={24} />}>
          <p className="text-3xl font-bold mb-1">{content.filter(c => c.type === 'link').length}</p>
          <p className="text-sm opacity-90">Links</p>
        </BaseCard>
      </div>

      <BaseCard>
        <BaseTable columns={columns} data={content} loading={loading} searchable searchPlaceholder="Search content..." />
      </BaseCard>
    </div>
  );
}

export default ContentScreen;
