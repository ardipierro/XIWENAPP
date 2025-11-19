/**
 * @fileoverview Live Games View - Vista de juegos en vivo para estudiantes
 * @module components/games/LiveGamesView
 */

import logger from '../../utils/logger';
import { useState, useEffect } from 'react';
import {
  Gamepad2,
  Users,
  Clock,
  Play,
  Trophy,
  Target,
  Zap
} from 'lucide-react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase/config';
import {
  BaseButton,
  BaseLoading,
  BaseEmptyState,
  BaseBadge,
  CategoryBadge
} from '../common';
import { UniversalCard } from '../cards';

/**
 * Vista de juegos en vivo para estudiantes
 */
function LiveGamesView({ user, onJoinGame }) {
  const [liveGames, setLiveGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'available', 'in_progress'

  useEffect(() => {
    // Suscribirse a juegos en vivo
    const gamesRef = collection(db, 'gameSessions');
    const q = query(
      gamesRef,
      where('status', 'in', ['waiting', 'active', 'in_progress'])
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const games = [];
        snapshot.forEach((doc) => {
          games.push({
            id: doc.id,
            ...doc.data()
          });
        });

        logger.debug(`🎮 ${games.length} juegos en vivo encontrados`);
        setLiveGames(games);
        setLoading(false);
      },
      (error) => {
        logger.error('Error listening to live games:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Filtrar juegos
  const filteredGames = liveGames.filter(game => {
    if (filter === 'all') return true;
    if (filter === 'available') return game.status === 'waiting';
    if (filter === 'in_progress') return game.status === 'active' || game.status === 'in_progress';
    return true;
  });

  // Get status badge - Mapped to system status
  const getStatusBadge = (status) => {
    // Map game status to system status
    const statusMap = {
      'waiting': 'draft',        // Esperando → Borrador
      'active': 'published',     // Activo → Publicado
      'in_progress': 'published', // En progreso → Publicado
      'finished': 'archived'     // Finalizado → Archivado
    };

    const mappedStatus = statusMap[status] || 'draft';
    return <CategoryBadge type="status" value={mappedStatus} />;
  };

  // Get game type label
  const getGameTypeLabel = (type) => {
    const types = {
      'vocabulary': 'Vocabulario',
      'grammar': 'Gramática',
      'listening': 'Listening',
      'reading': 'Lectura',
      'quiz': 'Quiz',
      'mixed': 'Mixto'
    };
    return types[type] || type;
  };

  // Get game icon
  const getGameIcon = (type) => {
    switch (type) {
      case 'vocabulary':
        return Target;
      case 'grammar':
        return Zap;
      default:
        return Gamepad2;
    }
  };

  // Loading state
  if (loading) {
    return <BaseLoading size="large" text="Buscando ejercicios en vivo..." />;
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Gamepad2 size={32} />
            Ejercicios en Vivo
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {filteredGames.length} {filteredGames.length === 1 ? 'ejercicio disponible' : 'ejercicios disponibles'}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <BaseButton
          onClick={() => setFilter('all')}
          variant={filter === 'all' ? 'primary' : 'ghost'}
          size="sm"
        >
          Todos ({liveGames.length})
        </BaseButton>
        <BaseButton
          onClick={() => setFilter('available')}
          variant={filter === 'available' ? 'primary' : 'ghost'}
          size="sm"
        >
          Disponibles ({liveGames.filter(g => g.status === 'waiting').length})
        </BaseButton>
        <BaseButton
          onClick={() => setFilter('in_progress')}
          variant={filter === 'in_progress' ? 'primary' : 'ghost'}
          size="sm"
        >
          En progreso ({liveGames.filter(g => g.status === 'active' || g.status === 'in_progress').length})
        </BaseButton>
      </div>

      {/* Empty state */}
      {filteredGames.length === 0 ? (
        <BaseEmptyState
          icon={Gamepad2}
          title="No hay ejercicios disponibles"
          description={
            filter === 'all'
              ? 'No hay ejercicios en vivo en este momento. Tu profesor creará un ejercicio próximamente.'
              : filter === 'available'
              ? 'No hay ejercicios esperando jugadores en este momento'
              : 'No hay ejercicios en progreso en este momento'
          }
          action={
            filter !== 'all' && (
              <BaseButton onClick={() => setFilter('all')} variant="primary">
                Ver todos los ejercicios
              </BaseButton>
            )
          }
        />
      ) : (
        /* Game cards */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredGames.map((game) => {
            const GameIcon = getGameIcon(game.gameType);
            const playerCount = game.players?.length || 0;
            const maxPlayers = game.maxPlayers || 30;

            return (
              <UniversalCard
                variant="default"
                size="md"
                key={game.id}
                className="cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1"
                onClick={() => onJoinGame && onJoinGame(game.id)}
              >
                <div className="space-y-4">
                  {/* Header with icon */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white">
                        <GameIcon size={24} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                          {game.name || 'Juego en Vivo'}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {getGameTypeLabel(game.gameType)}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(game.status)}
                  </div>

                  {/* Teacher */}
                  {game.teacherName && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <span className="font-medium">Profesor:</span>
                      <span>{game.teacherName}</span>
                    </div>
                  )}

                  {/* Players */}
                  <div className="flex items-center gap-2 text-sm">
                    <Users size={16} className="text-gray-600 dark:text-gray-400" />
                    <span className="text-gray-900 dark:text-white font-medium">
                      {playerCount} / {maxPlayers}
                    </span>
                    <span className="text-gray-600 dark:text-gray-400">jugadores</span>
                  </div>

                  {/* Category if available */}
                  {game.categoryName && (
                    <div className="flex items-center gap-2">
                      <BaseBadge variant="secondary" size="sm">
                        {game.categoryName}
                      </BaseBadge>
                    </div>
                  )}

                  {/* Description */}
                  {game.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                      {game.description}
                    </p>
                  )}

                  {/* Action button */}
                  <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                    <BaseButton
                      onClick={(e) => {
                        e.stopPropagation();
                        onJoinGame && onJoinGame(game.id);
                      }}
                      variant={game.status === 'waiting' ? 'primary' : 'secondary'}
                      size="sm"
                      icon={game.status === 'waiting' ? Play : Gamepad2}
                      fullWidth
                    >
                      {game.status === 'waiting' ? 'Unirse al juego' : 'Ver juego'}
                    </BaseButton>
                  </div>
                </div>
              </UniversalCard>
            );
          })}
        </div>
      )}

      {/* Info banner */}
      <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-800/20 border border-gray-200 dark:border-gray-700 rounded-lg">
        <div className="flex items-start gap-3">
          <Gamepad2 size={20} className="text-gray-600 dark:text-gray-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
              ¿Cómo funcionan los ejercicios en vivo?
            </h4>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Tu profesor creará ejercicios en vivo durante la clase. Cuando veas un ejercicio "Esperando",
              puedes unirte haciendo clic. ¡Compite con tus compañeros y gana puntos!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LiveGamesView;
