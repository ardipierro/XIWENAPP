import { useState } from 'react';
import AssignmentManager from './components/AssignmentManager';
import StudentAssignmentsView from './components/StudentAssignmentsView';
import GradingInterface from './components/GradingInterface';
import GamificationPanel from './components/GamificationPanel';
import UnifiedCalendar from './components/UnifiedCalendar';
import GuardianLinkingInterface from './components/GuardianLinkingInterface';
import GuardianDashboard from './components/GuardianDashboard';
import { BaseButton } from './components/common';

/**
 * Página de prueba para los nuevos componentes
 * Para probar: Cambia el import en App.jsx temporalmente
 */
export default function TestPage() {
  const [currentView, setCurrentView] = useState('menu');
  const [testUserId] = useState('test-user-123');
  const [testTeacherId] = useState('test-teacher-456');
  const [testAdminId] = useState('test-admin-789');

  // Mock assignment for grading
  const mockAssignment = {
    id: 'test-assignment-1',
    title: 'Tarea de Prueba - Matemáticas',
    points: 100,
    deadline: new Date()
  };

  // Mock user for guardian dashboard
  const mockGuardianUser = {
    uid: 'test-guardian-001',
    email: 'guardian@test.com',
    displayName: 'Tutor de Prueba'
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            🧪 Página de Prueba - Nuevos Componentes
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Selecciona un componente para probarlo
          </p>
        </div>

        {/* Menu */}
        {currentView === 'menu' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="card p-6">
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                📝 Assignment Manager
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Gestión de tareas (vista profesor)
              </p>
              <BaseButton variant="primary" onClick={() => setCurrentView('assignments')}>
                Probar
              </BaseButton>
            </div>

            <div className="card p-6">
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                🎓 Student Assignments
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Vista de tareas (estudiante)
              </p>
              <BaseButton variant="primary" onClick={() => setCurrentView('student')}>
                Probar
              </BaseButton>
            </div>

            <div className="card p-6">
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                ✅ Grading Interface
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Interfaz de calificación
              </p>
              <BaseButton variant="primary" onClick={() => setCurrentView('grading')}>
                Probar
              </BaseButton>
            </div>

            <div className="card p-6">
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                🏆 Gamification Panel
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Sistema de gamificación (XP, badges, leaderboard)
              </p>
              <BaseButton variant="primary" onClick={() => setCurrentView('gamification')}>
                Probar
              </BaseButton>
            </div>

            <div className="card p-6">
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                📅 Unified Calendar
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Calendario unificado (clases + tareas + eventos)
              </p>
              <BaseButton variant="primary" onClick={() => setCurrentView('calendar')}>
                Probar
              </BaseButton>
            </div>

            <div className="card p-6">
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                👨‍👩‍👧 Guardian Dashboard
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Dashboard para tutores/padres
              </p>
              <BaseButton variant="primary" onClick={() => setCurrentView('guardian')}>
                Probar
              </BaseButton>
            </div>

            <div className="card p-6">
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                🔗 Guardian Linking
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Vincular tutores a estudiantes (admin)
              </p>
              <BaseButton variant="primary" onClick={() => setCurrentView('guardian-linking')}>
                Probar
              </BaseButton>
            </div>

            <div className="card p-6 bg-gray-100 dark:bg-gray-800">
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                ℹ️ Información
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                <strong>Nota:</strong> Necesitas estar conectado a Firebase para que funcione correctamente.
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500">
                Usuario de prueba: test-user-123
              </p>
            </div>
          </div>
        )}

        {/* Back Button */}
        {currentView !== 'menu' && (
          <div className="mb-4">
            <BaseButton variant="ghost" onClick={() => setCurrentView('menu')}>
              ← Volver al Menú
            </BaseButton>
          </div>
        )}

        {/* Component Views */}
        {currentView === 'assignments' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
            <AssignmentManager teacherId={testTeacherId} />
          </div>
        )}

        {currentView === 'student' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
            <StudentAssignmentsView studentId={testUserId} />
          </div>
        )}

        {currentView === 'grading' && (
          <GradingInterface
            assignment={mockAssignment}
            teacherId={testTeacherId}
            onClose={() => setCurrentView('menu')}
          />
        )}

        {currentView === 'gamification' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
            <GamificationPanel userId={testUserId} />
          </div>
        )}

        {currentView === 'calendar' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
            <UnifiedCalendar userId={testUserId} userRole="student" />
          </div>
        )}

        {currentView === 'guardian' && (
          <GuardianDashboard user={mockGuardianUser} />
        )}

        {currentView === 'guardian-linking' && (
          <GuardianLinkingInterface adminId={testAdminId} />
        )}
      </div>
    </div>
  );
}
