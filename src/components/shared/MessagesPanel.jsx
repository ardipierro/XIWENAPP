import { useState } from 'react';
import { BasePanel, BaseButton } from '../base';
import { Send, User, Clock } from 'lucide-react';

/**
 * MessagesPanel - Shared messaging panel for Student/Teacher
 *
 * Features:
 * - Message list with sender info
 * - Compose new message
 * - Time indicators
 * - User avatars
 * - Send button with validation
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Panel visibility
 * @param {Function} props.onClose - Close handler
 * @param {string} props.userRole - 'student' or 'teacher'
 */
function MessagesPanel({ isOpen, onClose, userRole = 'student' }) {
  const [messages, setMessages] = useState([
    { id: 1, sender: 'Prof. Smith', content: 'Great work on your last assignment!', time: '10 min ago', isMe: false },
    { id: 2, sender: 'You', content: 'Thank you! I really enjoyed the project.', time: '8 min ago', isMe: true },
    { id: 3, sender: 'Prof. Smith', content: 'Keep up the good work. See you in class tomorrow.', time: '5 min ago', isMe: false },
  ]);
  const [newMessage, setNewMessage] = useState('');

  const handleSend = () => {
    if (!newMessage.trim()) return;

    const message = {
      id: messages.length + 1,
      sender: 'You',
      content: newMessage,
      time: 'Just now',
      isMe: true,
    };

    setMessages([...messages, message]);
    setNewMessage('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <BasePanel
      isOpen={isOpen}
      onClose={onClose}
      title="Messages"
      size="lg"
      position="right"
    >
      <div className="flex flex-col h-full">
        {/* Messages list */}
        <div className="flex-1 space-y-4 mb-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.isMe ? 'flex-row-reverse' : ''}`}
            >
              <div className={`
                w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0
                ${msg.isMe ? 'bg-accent-500' : 'bg-neutral-400'}
              `}>
                <User size={20} className="text-white" />
              </div>

              <div className={`flex-1 ${msg.isMe ? 'text-right' : ''}`}>
                <div className="flex items-center gap-2 mb-1">
                  {!msg.isMe && (
                    <span className="text-sm font-semibold text-text-primary dark:text-text-inverse">
                      {msg.sender}
                    </span>
                  )}
                  <span className="text-xs text-text-secondary dark:text-neutral-400 flex items-center gap-1">
                    <Clock size={12} />
                    {msg.time}
                  </span>
                </div>

                <div className={`
                  inline-block px-4 py-2 rounded-lg max-w-md
                  ${msg.isMe
                    ? 'bg-accent-500 text-white'
                    : 'bg-bg-secondary dark:bg-primary-800 text-text-primary dark:text-text-inverse'
                  }
                `}>
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Compose area */}
        <div className="border-t border-border dark:border-border-dark pt-4">
          <div className="flex gap-2">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              rows={3}
              className="
                flex-1 px-4 py-2 border border-border dark:border-border-dark rounded-lg
                bg-bg-primary dark:bg-primary-900
                text-text-primary dark:text-text-inverse
                placeholder-text-secondary dark:placeholder-neutral-400
                focus:outline-none focus:ring-2 focus:ring-accent-500
                resize-none
              "
            />
          </div>
          <div className="flex justify-end mt-2">
            <BaseButton
              variant="primary"
              iconLeft={<Send size={16} />}
              onClick={handleSend}
              disabled={!newMessage.trim()}
            >
              Send
            </BaseButton>
          </div>
        </div>
      </div>
    </BasePanel>
  );
}

export default MessagesPanel;
