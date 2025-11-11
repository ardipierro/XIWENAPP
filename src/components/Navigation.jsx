import logger from '../utils/logger';

import { signOut } from 'firebase/auth';
import { auth } from '../firebase/config';
import { useNavigate } from 'react-router-dom';
import { Home, GraduationCap, Crown, LogOut } from 'lucide-react';
import { BaseButton } from './common';

function Navigation({ user, userRole }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      logger.debug('✅ Sesión cerrada');
      navigate('/');
    } catch (error) {
      logger.error('❌ Error al cerrar sesión:', error);
    }
  };

  const handleNavigateToDashboard = () => {
    // Redirigir al dashboard correspondiente según el rol
    switch (userRole) {
      case 'student':
      case 'listener':
      case 'trial':
        navigate('/student');
        break;
      case 'teacher':
      case 'trial_teacher':
        navigate('/teacher');
        break;
      case 'admin':
        navigate('/admin');
        break;
      default:
        navigate('/dashboard');
    }
  };

  const canAccessTeacher = ['teacher', 'trial_teacher', 'admin'].includes(userRole);
  const canAccessAdmin = userRole === 'admin';

  return (
    <nav className="bg-primary-900 shadow-md sticky top-0 z-[100] py-4">
      <div className="max-w-[1400px] mx-auto px-6 flex md:flex-row flex-col items-center justify-between gap-6 md:gap-6 md:gap-4">
        <div className="flex items-center gap-4">
          <span className="text-3xl font-bold text-white [text-shadow:2px_2px_4px_rgba(0,0,0,0.2)]">习文</span>
          <span className="text-lg font-semibold text-white tracking-wider">XIWEN APP</span>
        </div>

        <div className="flex md:flex-row flex-col items-center gap-4 flex-wrap md:w-auto w-full md:justify-start justify-center">
          <BaseButton
            onClick={handleNavigateToDashboard}
            variant="ghost"
            size="sm"
            icon={Home}
          >
            Mi Dashboard
          </BaseButton>

          {canAccessTeacher && (
            <BaseButton
              onClick={() => navigate('/teacher')}
              variant="ghost"
              size="sm"
              icon={GraduationCap}
            >
              Profesor
            </BaseButton>
          )}

          {canAccessAdmin && (
            <BaseButton
              onClick={() => navigate('/admin')}
              variant="ghost"
              size="sm"
              icon={Crown}
            >
              Admin
            </BaseButton>
          )}

          <div className="flex flex-col md:items-end items-center gap-1 md:pl-4 md:border-l md:border-white/30 md:pt-0 pt-2 md:border-t-0 border-t border-white/30">
            <span className="text-white text-sm font-medium">{user?.email}</span>
            <span className="bg-white/25 text-white px-2 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide">{userRole}</span>
          </div>

          <BaseButton
            onClick={handleLogout}
            variant="danger"
            size="sm"
            icon={LogOut}
          >
            Cerrar Sesión
          </BaseButton>
        </div>
      </div>
    </nav>
  );
}

export default Navigation;
