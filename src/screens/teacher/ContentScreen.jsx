import { useState, useEffect } from 'react';
import { BaseCard, BaseTable, BaseButton, BaseModal } from '../../components/base';
import { Plus, FileText, Video, BookOpen, Link as LinkIcon, Edit, Trash } from 'lucide-react';

/**
 * ContentScreen - Teacher content management
 *
 * Features:
 * - Create/edit/delete educational content
 * - Content types: lesson, video, reading, link
 * - Assign content to courses
 * - Search and filter
 */
function ContentScreen() {
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newContent, setNewContent] = useState({ title: '', type: 'lesson', course: '', description: '' });

  useEffect(() => {
    setTimeout(() => {
      setContent([
        { id: 1, title: 'React Hooks Introduction', type: 'lesson', course: 'React Basics', status: 'published', created: '2024-01-10' },
        { id: 2, title: 'ES6 Features Deep Dive', type: 'reading', course: 'JS Fundamentals', status: 'published', created: '2024-01-15' },
        { id: 3, title: 'CSS Grid Tutorial', type: 'video', course: 'Advanced CSS', status: 'draft', created: '2024-02-01' },
        { id: 4, title: 'MDN Documentation', type: 'link', course: 'Web Development', status: 'published', created: '2024-02-05' },
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

  const handleCreateContent = () => {
    if (!newContent.title.trim()) return;

    const content = {
      id: Math.max(...content.map(c => c.id), 0) + 1,
      ...newContent,
      status: 'draft',
      created: new Date().toISOString().split('T')[0],
    };

    setContent(prev => [...prev, content]);
    setNewContent({ title: '', type: 'lesson', course: '', description: '' });
    setCreateModalOpen(false);
  };

  const handleDelete = (id) => {
    setContent(prev => prev.filter(c => c.id !== id));
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
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex gap-2">
          <button className="p-1 text-text-secondary hover:text-accent-500" aria-label="Edit">
            <Edit size={16} />
          </button>
          <button className="p-1 text-text-secondary hover:text-red-500" onClick={() => handleDelete(row.id)} aria-label="Delete">
            <Trash size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-text-primary dark:text-text-inverse mb-2">My Content</h1>
          <p className="text-text-secondary dark:text-neutral-400">{content.length} total content items</p>
        </div>
        <BaseButton variant="primary" iconLeft={<Plus size={18} />} onClick={() => setCreateModalOpen(true)}>
          Create Content
        </BaseButton>
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

      {/* Create Content Modal */}
      <BaseModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create New Content"
        footer={
          <>
            <BaseButton variant="secondary" onClick={() => setCreateModalOpen(false)}>Cancel</BaseButton>
            <BaseButton variant="primary" onClick={handleCreateContent}>Create</BaseButton>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-text-primary dark:text-text-inverse mb-2">Title</label>
            <input
              type="text"
              value={newContent.title}
              onChange={(e) => setNewContent({ ...newContent, title: e.target.value })}
              className="w-full px-4 py-2 border border-border dark:border-border-dark rounded-lg bg-bg-primary dark:bg-primary-900 text-text-primary dark:text-text-inverse"
              placeholder="Content title..."
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-text-primary dark:text-text-inverse mb-2">Type</label>
            <select
              value={newContent.type}
              onChange={(e) => setNewContent({ ...newContent, type: e.target.value })}
              className="w-full px-4 py-2 border border-border dark:border-border-dark rounded-lg bg-bg-primary dark:bg-primary-900 text-text-primary dark:text-text-inverse"
            >
              <option value="lesson">Lesson</option>
              <option value="video">Video</option>
              <option value="reading">Reading</option>
              <option value="link">Link</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-text-primary dark:text-text-inverse mb-2">Course</label>
            <input
              type="text"
              value={newContent.course}
              onChange={(e) => setNewContent({ ...newContent, course: e.target.value })}
              className="w-full px-4 py-2 border border-border dark:border-border-dark rounded-lg bg-bg-primary dark:bg-primary-900 text-text-primary dark:text-text-inverse"
              placeholder="Course name..."
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-text-primary dark:text-text-inverse mb-2">Description</label>
            <textarea
              value={newContent.description}
              onChange={(e) => setNewContent({ ...newContent, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-border dark:border-border-dark rounded-lg bg-bg-primary dark:bg-primary-900 text-text-primary dark:text-text-inverse"
              placeholder="Brief description..."
            />
          </div>
        </div>
      </BaseModal>
    </div>
  );
}

export default ContentScreen;
