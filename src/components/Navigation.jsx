import logger from '../utils/logger';

import { signOut } from 'firebase/auth';
import { auth } from '../firebase/config';
import { useNavigate } from 'react-router-dom';
import { Home, GraduationCap, Crown, LogOut } from 'lucide-react';
import { BaseButton } from './common';
import './Navigation.css';

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
    <nav className="app-navigation">
      <div className="nav-content">
        <div className="nav-brand">
          <span className="nav-logo">习文</span>
          <span className="nav-title">XIWEN APP</span>
        </div>

        <div className="nav-links">
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

          <div className="nav-user">
            <span className="user-email">{user?.email}</span>
            <span className="user-role-badge">{userRole}</span>
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
