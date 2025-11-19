/**
 * @fileoverview Live Games Hub - Vista unificada para crear/unirse a juegos en vivo
 * @module components/LiveGamesHub
 */

import { useState } from 'react';
import { usePermissions } from '../hooks/usePermissions';
import LiveGameSetup from './LiveGameSetup';
import LiveGameProjection from './LiveGameProjection';
import LiveGamesView from './games/LiveGamesView';
import { BaseButton } from './common';
import { Gamepad2, Play, Monitor, Users } from 'lucide-react';

/**
 * Hub central para juegos en vivo
 * - Profesores: Crear y gestionar juegos
 * - Estudiantes: Ver y unirse a juegos
 */
function LiveGamesHub({ user }) {
  const { can } = usePermissions();
  const [view, setView] = useState('default'); // 'default', 'create', 'projection'
  const [currentSessionId, setCurrentSessionId] = useState(null);

  const isTeacher = can('manage-classes') || can('create-content');

  // Handler cuando se crea una sesión
  const handleSessionCreated = (sessionId) => {
    setCurrentSessionId(sessionId);
    setView('projection'); // Ir automáticamente a proyección
  };

  // Handler cuando se sale de una vista
  const handleBack = () => {
    setView('default');
    setCurrentSessionId(null);
  };

  // Handler cuando estudiante se une a juego
  const handleJoinGame = (gameId) => {
    // TODO: Navegar a vista de estudiante con gameId
    console.log('Unirse a juego:', gameId);
  };

  // Vista de creación de juego (solo profesores)
  if (view === 'create' && isTeacher) {
    return (
      <LiveGameSetup
        user={user}
        onSessionCreated={handleSessionCreated}
        onBack={handleBack}
      />
    );
  }

  // Vista de proyección (solo profesores)
  if (view === 'projection' && isTeacher && currentSessionId) {
    return (
      <LiveGameProjection
        sessionId={currentSessionId}
        onBack={handleBack}
      />
    );
  }

  // Vista por defecto
  return (
    <div className="space-y-6">
      {/* Vista para profesores */}
      {isTeacher ? (
        <>
          {/* Header con acciones de profesor */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <Gamepad2 size={32} />
                Ejercicio en Vivo
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Crea ejercicios interactivos para tus estudiantes
              </p>
            </div>

            <div className="flex gap-2">
              <BaseButton
                onClick={() => setView('create')}
                variant="primary"
                size="md"
              >
                <Play size={16} className="mr-2" />
                Crear Ejercicio
              </BaseButton>
            </div>
          </div>

          {/* Grid de opciones */}
          <div className="grid-responsive-cards gap-4">
            {/* Crear nuevo ejercicio */}
            <div
              onClick={() => setView('create')}
              className="group cursor-pointer"
            >
              <div
                className="flex flex-col rounded-xl overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] hover:-translate-y-1 h-full p-6"
                style={{
                  background: 'var(--color-bg-secondary)',
                  border: '1px solid var(--color-border)',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 12px 24px rgba(0, 0, 0, 0.15)';
                  e.currentTarget.style.borderColor = 'var(--color-border-focus)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.06)';
                  e.currentTarget.style.borderColor = 'var(--color-border)';
                }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                    <Play size={24} className="text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Crear Ejercicio
                  </h3>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Configura un nuevo ejercicio interactivo con preguntas de opción múltiple
                </p>
              </div>
            </div>

            {/* Ver proyección */}
            <div
              onClick={() => currentSessionId && setView('projection')}
              className={`group ${currentSessionId ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}
            >
              <div
                className="flex flex-col rounded-xl overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] hover:-translate-y-1 h-full p-6"
                style={{
                  background: 'var(--color-bg-secondary)',
                  border: '1px solid var(--color-border)',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)'
                }}
                onMouseEnter={(e) => {
                  if (!currentSessionId) return;
                  e.currentTarget.style.boxShadow = '0 12px 24px rgba(0, 0, 0, 0.15)';
                  e.currentTarget.style.borderColor = 'var(--color-border-focus)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.06)';
                  e.currentTarget.style.borderColor = 'var(--color-border)';
                }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                    <Monitor size={24} className="text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Proyección
                  </h3>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {currentSessionId
                    ? 'Proyectar el juego actual en pantalla grande'
                    : 'Crea un juego primero para usar la proyección'}
                </p>
              </div>
            </div>

            {/* Ver como estudiante */}
            <div className="group cursor-not-allowed opacity-50">
              <div
                className="flex flex-col rounded-xl overflow-hidden h-full p-6"
                style={{
                  background: 'var(--color-bg-secondary)',
                  border: '1px solid var(--color-border)',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)'
                }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                    <Users size={24} className="text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Vista Estudiantes
                  </h3>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Los estudiantes verán juegos disponibles en esta sección
                </p>
              </div>
            </div>
          </div>

          {/* Instrucciones */}
          <div
            className="rounded-xl p-6"
            style={{
              background: 'var(--color-bg-secondary)',
              border: '1px solid var(--color-border)'
            }}
          >
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
              📋 Cómo usar Ejercicios en Vivo
            </h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li>Haz clic en "Crear Ejercicio" para configurar una nueva sesión</li>
              <li>Selecciona una categoría de preguntas y configura participantes</li>
              <li>Los estudiantes podrán ver y unirse al ejercicio desde sus dispositivos</li>
              <li>Usa "Proyección" para mostrar el ejercicio en pantalla grande</li>
              <li>Los estudiantes responden desde sus propios dispositivos en tiempo real</li>
            </ol>
          </div>
        </>
      ) : (
        /* Vista para estudiantes */
        <LiveGamesView user={user} onJoinGame={handleJoinGame} />
      )}
    </div>
  );
}

export default LiveGamesHub;
