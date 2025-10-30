import { signOut } from 'firebase/auth';
import { auth } from '../firebase/config';
import { useNavigate } from 'react-router-dom';
import './Navigation.css';

function Navigation({ user, userRole }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      console.log('✅ Sesión cerrada');
      navigate('/');
    } catch (error) {
      console.error('❌ Error al cerrar sesión:', error);
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
          <button onClick={handleNavigateToDashboard} className="nav-btn">
            🏠 Mi Dashboard
          </button>

          {canAccessTeacher && (
            <button onClick={() => navigate('/teacher')} className="nav-btn">
              👨‍🏫 Profesor
            </button>
          )}

          {canAccessAdmin && (
            <button onClick={() => navigate('/admin')} className="nav-btn">
              👑 Admin
            </button>
          )}

          <div className="nav-user">
            <span className="user-email">{user?.email}</span>
            <span className="user-role-badge">{userRole}</span>
          </div>

          <button onClick={handleLogout} className="nav-btn logout-btn">
            🚪 Cerrar Sesión
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navigation;
