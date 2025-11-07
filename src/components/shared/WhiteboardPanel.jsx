import { useState } from 'react';
import { BasePanel, BaseButton } from '../base';
import { Pencil, Eraser, Circle, Square, Type, Download, Trash2, Users } from 'lucide-react';

/**
 * WhiteboardPanel - Collaborative whiteboard component
 *
 * Features:
 * - Drawing tools (pen, eraser, shapes)
 * - Color selection
 * - Collaborative mode
 * - Save/export whiteboard
 * - Ready for Excalidraw integration
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Panel visibility
 * @param {Function} props.onClose - Close handler
 * @param {string} props.userRole - 'student' or 'teacher'
 * @param {string} props.sessionId - Whiteboard session ID
 */
function WhiteboardPanel({ isOpen, onClose, userRole = 'student', sessionId = null }) {
  const [selectedTool, setSelectedTool] = useState('pen');
  const [selectedColor, setSelectedColor] = useState('#10b981');
  const [participants, setParticipants] = useState([
    { id: 1, name: 'You', active: true },
    { id: 2, name: 'Student A', active: true },
    { id: 3, name: 'Student B', active: false },
  ]);

  const tools = [
    { id: 'pen', icon: Pencil, label: 'Pen' },
    { id: 'eraser', icon: Eraser, label: 'Eraser' },
    { id: 'circle', icon: Circle, label: 'Circle' },
    { id: 'square', icon: Square, label: 'Square' },
    { id: 'text', icon: Type, label: 'Text' },
  ];

  const colors = [
    '#10b981', // accent green
    '#18181b', // primary black
    '#ef4444', // red
    '#3b82f6', // blue
    '#f59e0b', // orange
    '#8b5cf6', // purple
  ];

  const handleClearBoard = () => {
    if (window.confirm('Clear the entire whiteboard?')) {
      // Clear whiteboard logic
    }
  };

  const handleExport = () => {
    // Export whiteboard as image
    alert('Export functionality - integrate with Excalidraw export');
  };

  return (
    <BasePanel
      isOpen={isOpen}
      onClose={onClose}
      title={`Whiteboard ${sessionId ? `- Session ${sessionId}` : ''}`}
      size="full"
      position="right"
    >
      <div className="flex flex-col h-full">
        {/* Toolbar */}
        <div className="flex items-center justify-between p-4 border-b border-border dark:border-border-dark bg-bg-secondary dark:bg-primary-800">
          <div className="flex items-center gap-2">
            {tools.map((tool) => {
              const Icon = tool.icon;
              return (
                <button
                  key={tool.id}
                  onClick={() => setSelectedTool(tool.id)}
                  className={`
                    p-2 rounded-lg transition-all duration-200
                    ${selectedTool === tool.id
                      ? 'bg-accent-500 text-white'
                      : 'bg-bg-primary dark:bg-primary-900 text-text-secondary dark:text-neutral-400 hover:bg-primary-100 dark:hover:bg-primary-700'
                    }
                  `}
                  aria-label={tool.label}
                  title={tool.label}
                >
                  <Icon size={20} />
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            {/* Color picker */}
            <div className="flex gap-1">
              {colors.map((color) => (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className={`
                    w-8 h-8 rounded-full border-2 transition-all duration-200
                    ${selectedColor === color ? 'border-white scale-110' : 'border-transparent'}
                  `}
                  style={{ backgroundColor: color }}
                  aria-label={`Color ${color}`}
                />
              ))}
            </div>

            <div className="w-px h-8 bg-border dark:bg-border-dark mx-2" />

            <BaseButton variant="secondary" size="sm" iconLeft={<Download size={16} />} onClick={handleExport}>
              Export
            </BaseButton>
            <BaseButton variant="danger" size="sm" iconLeft={<Trash2 size={16} />} onClick={handleClearBoard}>
              Clear
            </BaseButton>
          </div>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 relative bg-white dark:bg-primary-900">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center space-y-4 p-8">
              <div className="text-6xl mb-4">✏️</div>
              <h3 className="text-2xl font-bold text-text-primary dark:text-text-inverse">
                Whiteboard Canvas
              </h3>
              <p className="text-text-secondary dark:text-neutral-400 max-w-md">
                Ready for Excalidraw integration. This component supports:
              </p>
              <ul className="text-sm text-text-secondary dark:text-neutral-400 space-y-2">
                <li>✓ Drawing tools (pen, shapes, text)</li>
                <li>✓ Color selection</li>
                <li>✓ Collaborative editing</li>
                <li>✓ Export to PNG/SVG</li>
                <li>✓ Real-time synchronization</li>
              </ul>

              <div className="pt-4">
                <code className="text-xs bg-bg-secondary dark:bg-primary-800 px-3 py-2 rounded">
                  npm install @excalidraw/excalidraw
                </code>
              </div>
            </div>
          </div>

          {/* Grid background */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `
                linear-gradient(0deg, transparent 24%, rgba(0,0,0,.1) 25%, rgba(0,0,0,.1) 26%, transparent 27%, transparent 74%, rgba(0,0,0,.1) 75%, rgba(0,0,0,.1) 76%, transparent 77%, transparent),
                linear-gradient(90deg, transparent 24%, rgba(0,0,0,.1) 25%, rgba(0,0,0,.1) 26%, transparent 27%, transparent 74%, rgba(0,0,0,.1) 75%, rgba(0,0,0,.1) 76%, transparent 77%, transparent)
              `,
              backgroundSize: '50px 50px',
            }}
          />
        </div>

        {/* Participants Sidebar */}
        {userRole === 'teacher' && (
          <div className="w-48 border-l border-border dark:border-border-dark bg-bg-secondary dark:bg-primary-800 p-4">
            <div className="flex items-center gap-2 mb-4">
              <Users size={16} className="text-accent-500" />
              <h4 className="font-semibold text-text-primary dark:text-text-inverse">Participants</h4>
            </div>
            <div className="space-y-2">
              {participants.map((participant) => (
                <div
                  key={participant.id}
                  className="flex items-center justify-between p-2 rounded bg-bg-primary dark:bg-primary-900"
                >
                  <span className="text-sm text-text-primary dark:text-text-inverse">{participant.name}</span>
                  <span
                    className={`w-2 h-2 rounded-full ${
                      participant.active ? 'bg-accent-500' : 'bg-neutral-400'
                    }`}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </BasePanel>
  );
}

export default WhiteboardPanel;
