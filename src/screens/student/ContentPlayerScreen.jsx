import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BaseCard, BaseButton } from '../../components/base';
import { ArrowLeft, Play, BookOpen, Link as LinkIcon, CheckCircle, Clock } from 'lucide-react';

/**
 * ContentPlayerScreen - Student content consumption
 *
 * Features:
 * - Play lessons, videos, readings, links
 * - Progress tracking
 * - Mark as complete
 * - Next/previous navigation
 * - Responsive content rendering
 */
function ContentPlayerScreen() {
  const { contentId } = useParams();
  const navigate = useNavigate();
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    // Mock content fetch
    setTimeout(() => {
      const mockContent = {
        id: contentId || '1',
        title: 'Introduction to React Hooks',
        type: 'lesson',
        course: 'React Basics',
        description: 'Learn the fundamentals of React Hooks including useState, useEffect, and custom hooks.',
        duration: '25 min',
        content: `
# React Hooks Introduction

React Hooks revolutionized how we write React components by allowing us to use state and other React features without writing a class.

## useState Hook

The useState hook lets you add state to function components:

\`\`\`javascript
import { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
    </div>
  );
}
\`\`\`

## useEffect Hook

The useEffect hook lets you perform side effects in function components:

\`\`\`javascript
import { useEffect } from 'react';

useEffect(() => {
  document.title = \`Count: \${count}\`;
}, [count]);
\`\`\`

## Key Takeaways

- Hooks allow function components to have state
- useState is for managing component state
- useEffect is for side effects
- Custom hooks let you reuse stateful logic
        `,
        nextContentId: '2',
        prevContentId: null,
      };

      if (contentId === '2') {
        mockContent.title = 'Advanced CSS Grid Techniques';
        mockContent.type = 'video';
        mockContent.course = 'Advanced CSS';
        mockContent.content = 'https://www.youtube.com/embed/example';
      }

      setContent(mockContent);
      setLoading(false);
    }, 500);
  }, [contentId]);

  const handleMarkComplete = () => {
    setCompleted(true);
    setProgress(100);
  };

  const handleNext = () => {
    if (content?.nextContentId) {
      navigate(`/student/content/${content.nextContentId}`);
    }
  };

  const handlePrevious = () => {
    if (content?.prevContentId) {
      navigate(`/student/content/${content.prevContentId}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-text-secondary dark:text-neutral-400">Loading content...</p>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-text-secondary dark:text-neutral-400">Content not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <BaseButton variant="secondary" iconLeft={<ArrowLeft size={18} />} onClick={() => navigate('/student/courses')}>
          Back to Courses
        </BaseButton>
        <div className="flex items-center gap-2">
          {!completed && (
            <BaseButton variant="primary" iconLeft={<CheckCircle size={18} />} onClick={handleMarkComplete}>
              Mark Complete
            </BaseButton>
          )}
          {completed && (
            <span className="px-3 py-2 rounded-lg bg-accent-500 text-white text-sm font-semibold flex items-center gap-2">
              <CheckCircle size={16} />
              Completed
            </span>
          )}
        </div>
      </div>

      {/* Content Info */}
      <BaseCard>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-accent-500 font-semibold mb-2">{content.course}</p>
            <h1 className="text-3xl font-bold text-text-primary dark:text-text-inverse mb-2">{content.title}</h1>
            <p className="text-text-secondary dark:text-neutral-400">{content.description}</p>
          </div>

          <div className="flex items-center gap-4 text-sm text-text-secondary dark:text-neutral-400">
            <div className="flex items-center gap-2">
              {content.type === 'lesson' && <BookOpen size={16} />}
              {content.type === 'video' && <Play size={16} />}
              {content.type === 'link' && <LinkIcon size={16} />}
              <span className="capitalize">{content.type}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock size={16} />
              <span>{content.duration}</span>
            </div>
          </div>

          {/* Progress bar */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-text-secondary dark:text-neutral-400">Progress</span>
              <span className="font-semibold text-text-primary dark:text-text-inverse">{progress}%</span>
            </div>
            <div className="w-full bg-bg-secondary dark:bg-primary-800 rounded-full h-2">
              <div
                className="bg-accent-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </BaseCard>

      {/* Content Body */}
      <BaseCard>
        {content.type === 'lesson' && (
          <div className="prose dark:prose-invert max-w-none">
            <div className="whitespace-pre-wrap text-text-primary dark:text-text-inverse">
              {content.content.split('\n').map((line, idx) => {
                if (line.startsWith('# ')) {
                  return <h1 key={idx} className="text-3xl font-bold mt-6 mb-4">{line.substring(2)}</h1>;
                }
                if (line.startsWith('## ')) {
                  return <h2 key={idx} className="text-2xl font-bold mt-4 mb-3">{line.substring(3)}</h2>;
                }
                if (line.startsWith('```')) {
                  return null; // Skip code fence markers for now
                }
                if (line.trim() === '') {
                  return <br key={idx} />;
                }
                return <p key={idx} className="mb-2">{line}</p>;
              })}
            </div>
          </div>
        )}

        {content.type === 'video' && (
          <div className="aspect-video bg-neutral-900 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <Play size={64} className="mx-auto mb-4 text-white" />
              <p className="text-white">Video Player Placeholder</p>
              <p className="text-sm text-neutral-400 mt-2">Integrate with YouTube, Vimeo, or custom player</p>
            </div>
          </div>
        )}

        {content.type === 'reading' && (
          <div className="prose dark:prose-invert max-w-none">
            <p className="text-text-primary dark:text-text-inverse">{content.content}</p>
          </div>
        )}

        {content.type === 'link' && (
          <div className="text-center py-12">
            <LinkIcon size={64} className="mx-auto mb-4 text-accent-500" />
            <p className="text-text-primary dark:text-text-inverse mb-4">External Resource</p>
            <BaseButton variant="primary" iconLeft={<LinkIcon size={18} />}>
              Open in New Tab
            </BaseButton>
          </div>
        )}
      </BaseCard>

      {/* Navigation */}
      <div className="flex justify-between">
        <BaseButton
          variant="secondary"
          onClick={handlePrevious}
          disabled={!content.prevContentId}
        >
          Previous
        </BaseButton>
        <BaseButton
          variant="primary"
          onClick={handleNext}
          disabled={!content.nextContentId}
        >
          Next
        </BaseButton>
      </div>
    </div>
  );
}

export default ContentPlayerScreen;
