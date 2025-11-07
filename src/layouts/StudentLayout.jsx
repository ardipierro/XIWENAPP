import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import {
  BookOpen,
  ClipboardList,
  Calendar,
  Trophy,
  Users,
  Menu,
  X,
  LogOut,
  Moon,
  Sun,
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

/**
 * StudentLayout - Main layout wrapper for student screens
 *
 * Features:
 * - Top bar with logo, title, theme toggle, logout
 * - Side navigation menu
 * - Mobile responsive (hamburger menu)
 * - Active route highlighting
 * - Outlet for nested routes
 */
function StudentLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);

  // Navigation items
  const navItems = [
    { path: '/student', icon: BookOpen, label: 'Dashboard', exact: true },
    { path: '/student/courses', icon: BookOpen, label: 'My Courses' },
    { path: '/student/assignments', icon: ClipboardList, label: 'Assignments' },
    { path: '/student/classes', icon: Users, label: 'Classes' },
    { path: '/student/gamification', icon: Trophy, label: 'Achievements' },
    { path: '/student/calendar', icon: Calendar, label: 'Calendar' },
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
              XIWENAPP
            </h1>
          </div>

          {/* Right: Theme toggle + Logout */}
          <div className="flex items-center gap-2">
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
    </div>
  );
}

export default StudentLayout;
