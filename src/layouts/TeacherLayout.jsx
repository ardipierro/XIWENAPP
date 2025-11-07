import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import {
  BookOpen,
  Users,
  ClipboardList,
  BarChart3,
  Calendar,
  Presentation,
  FileText,
  Gamepad2,
  Menu,
  X,
  LogOut,
  Moon,
  Sun,
  MessageSquare,
  Pencil,
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import MessagesPanel from '../components/shared/MessagesPanel';
import WhiteboardPanel from '../components/shared/WhiteboardPanel';

/**
 * TeacherLayout - Main layout wrapper for teacher screens
 *
 * Features:
 * - Top bar with logo, title, theme toggle, logout
 * - Side navigation menu (teacher-specific)
 * - Mobile responsive (hamburger menu)
 * - Active route highlighting
 * - Outlet for nested routes
 */
function TeacherLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [messagesOpen, setMessagesOpen] = useState(false);
  const [whiteboardOpen, setWhiteboardOpen] = useState(false);

  // Navigation items for teachers
  const navItems = [
    { path: '/teacher', icon: BarChart3, label: 'Dashboard', exact: true },
    { path: '/teacher/courses', icon: BookOpen, label: 'My Courses' },
    { path: '/teacher/students', icon: Users, label: 'Students' },
    { path: '/teacher/classes', icon: Presentation, label: 'Classes' },
    { path: '/teacher/assignments', icon: ClipboardList, label: 'Assignments' },
    { path: '/teacher/analytics', icon: BarChart3, label: 'Analytics' },
    { path: '/teacher/content', icon: FileText, label: 'Content' },
    { path: '/teacher/games', icon: Gamepad2, label: 'Games' },
    { path: '/teacher/calendar', icon: Calendar, label: 'Calendar' },
  ];

  const isActive = (path, exact = false) => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  const handleLogout = () => {
    // TODO: Implement logout logic
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-bg-primary dark:bg-primary-900">
      {/* Top Bar */}
      <header className="sticky top-0 z-40 bg-bg-primary dark:bg-primary-900 border-b border-border dark:border-border-dark">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Left: Logo + Title */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-800 lg:hidden"
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <h1 className="text-xl font-bold text-text-primary dark:text-text-inverse">
              XIWENAPP <span className="text-accent-500">Teacher</span>
            </h1>
          </div>

          {/* Right: Whiteboard + Messages + Theme toggle + Logout */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setWhiteboardOpen(true)}
              className="p-2 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-800 text-text-secondary dark:text-neutral-400"
              aria-label="Whiteboard"
            >
              <Pencil size={20} />
            </button>
            <button
              onClick={() => setMessagesOpen(true)}
              className="p-2 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-800 text-text-secondary dark:text-neutral-400"
              aria-label="Messages"
            >
              <MessageSquare size={20} />
            </button>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-800 text-text-secondary dark:text-neutral-400"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-800 text-text-secondary dark:text-neutral-400"
              aria-label="Logout"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Side Menu - Desktop */}
        <aside className="hidden lg:block w-64 border-r border-border dark:border-border-dark min-h-[calc(100vh-57px)] bg-bg-primary dark:bg-primary-900">
          <nav className="p-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path, item.exact);

              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-lg
                    transition-all duration-200
                    ${active
                      ? 'bg-accent-500 text-white font-semibold'
                      : 'text-text-secondary dark:text-neutral-400 hover:bg-primary-100 dark:hover:bg-primary-800 hover:text-text-primary dark:hover:text-text-inverse'
                    }
                  `}
                >
                  <Icon size={20} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Side Menu - Mobile (Overlay) */}
        {menuOpen && (
          <div
            className="fixed inset-0 z-50 lg:hidden"
            onClick={() => setMenuOpen(false)}
          >
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <aside className="absolute left-0 top-0 bottom-0 w-64 bg-bg-primary dark:bg-primary-900 border-r border-border dark:border-border-dark">
              <div className="p-4">
                <button
                  onClick={() => setMenuOpen(false)}
                  className="p-2 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-800 mb-4"
                >
                  <X size={20} />
                </button>
              </div>
              <nav className="px-4 space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.path, item.exact);

                  return (
                    <button
                      key={item.path}
                      onClick={() => {
                        navigate(item.path);
                        setMenuOpen(false);
                      }}
                      className={`
                        w-full flex items-center gap-3 px-4 py-3 rounded-lg
                        transition-all duration-200
                        ${active
                          ? 'bg-accent-500 text-white font-semibold'
                          : 'text-text-secondary dark:text-neutral-400 hover:bg-primary-100 dark:hover:bg-primary-800'
                        }
                      `}
                    >
                      <Icon size={20} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </aside>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 p-6 lg:p-8">
          <Outlet />
        </main>
      </div>

      {/* Messages Panel */}
      <MessagesPanel
        isOpen={messagesOpen}
        onClose={() => setMessagesOpen(false)}
        userRole="teacher"
      />

      {/* Whiteboard Panel */}
      <WhiteboardPanel
        isOpen={whiteboardOpen}
        onClose={() => setWhiteboardOpen(false)}
        userRole="teacher"
        sessionId="live-session-1"
      />
    </div>
  );
}

export default TeacherLayout;
