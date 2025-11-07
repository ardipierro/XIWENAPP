import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  BarChart3,
  Settings,
  DollarSign,
  Shield,
  FileText,
  Menu,
  X,
  LogOut,
  Moon,
  Sun,
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

/**
 * AdminLayout - Main layout wrapper for admin screens
 */
function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);

  const navItems = [
    { path: '/admin', icon: LayoutDashboard, label: 'Dashboard', exact: true },
    { path: '/admin/users', icon: Users, label: 'Users' },
    { path: '/admin/courses', icon: BookOpen, label: 'Courses' },
    { path: '/admin/content', icon: FileText, label: 'Content' },
    { path: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
    { path: '/admin/payments', icon: DollarSign, label: 'Payments' },
    { path: '/admin/settings', icon: Settings, label: 'Settings' },
  ];

  const isActive = (path, exact = false) => {
    if (exact) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  const handleLogout = () => navigate('/login');

  return (
    <div className="min-h-screen bg-bg-primary dark:bg-primary-900">
      <header className="sticky top-0 z-40 bg-bg-primary dark:bg-primary-900 border-b border-border dark:border-border-dark">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-800 lg:hidden"
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div className="flex items-center gap-2">
              <Shield size={24} className="text-accent-500" />
              <h1 className="text-xl font-bold text-text-primary dark:text-text-inverse">
                XIWENAPP <span className="text-accent-500">Admin</span>
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-800 text-text-secondary dark:text-neutral-400"
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-800 text-text-secondary dark:text-neutral-400"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        <aside className="hidden lg:block w-64 border-r border-border dark:border-border-dark min-h-[calc(100vh-57px)] bg-bg-primary dark:bg-primary-900">
          <nav className="p-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path, item.exact);
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    active
                      ? 'bg-accent-500 text-white font-semibold'
                      : 'text-text-secondary dark:text-neutral-400 hover:bg-primary-100 dark:hover:bg-primary-800'
                  }`}
                >
                  <Icon size={20} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        {menuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden" onClick={() => setMenuOpen(false)}>
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <aside className="absolute left-0 top-0 bottom-0 w-64 bg-bg-primary dark:bg-primary-900 border-r border-border dark:border-border-dark">
              <div className="p-4">
                <button onClick={() => setMenuOpen(false)} className="p-2 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-800 mb-4">
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
                      onClick={() => { navigate(item.path); setMenuOpen(false); }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                        active ? 'bg-accent-500 text-white font-semibold' : 'text-text-secondary dark:text-neutral-400 hover:bg-primary-100 dark:hover:bg-primary-800'
                      }`}
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

        <main className="flex-1 p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;
