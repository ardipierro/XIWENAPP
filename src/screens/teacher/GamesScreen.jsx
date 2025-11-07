import { useState } from 'react';
import { BaseCard, BaseButton, BaseModal } from '../../components/base';
import { Plus, Play, Settings, Trophy, Users, Clock } from 'lucide-react';

/**
 * GamesScreen - Teacher game management
 *
 * Features:
 * - Create/setup educational games
 * - Launch live games
 * - View game history
 * - Real-time game monitoring
 */
function GamesScreen() {
  const [games, setGames] = useState([
    { id: 1, title: 'React Quiz Championship', type: 'quiz', participants: 0, status: 'ready', created: '2024-02-10' },
    { id: 2, title: 'JavaScript Speed Challenge', type: 'speed', participants: 0, status: 'ready', created: '2024-02-08' },
    { id: 3, title: 'CSS Battle Arena', type: 'battle', participants: 15, status: 'live', created: '2024-02-05' },
  ]);
  const [setupModalOpen, setSetupModalOpen] = useState(false);
  const [liveGameId, setLiveGameId] = useState(null);
  const [newGame, setNewGame] = useState({ title: '', type: 'quiz', duration: 30, questions: 10 });

  const handleCreateGame = () => {
    if (!newGame.title.trim()) return;

    const game = {
      id: Math.max(...games.map(g => g.id), 0) + 1,
      ...newGame,
      participants: 0,
      status: 'ready',
      created: new Date().toISOString().split('T')[0],
    };

    setGames(prev => [...prev, game]);
    setNewGame({ title: '', type: 'quiz', duration: 30, questions: 10 });
    setSetupModalOpen(false);
  };

  const handleLaunchGame = (gameId) => {
    setGames(prev => prev.map(g =>
      g.id === gameId ? { ...g, status: 'live' } : g
    ));
    setLiveGameId(gameId);
  };

  const handleEndGame = () => {
    if (!liveGameId) return;
    setGames(prev => prev.map(g =>
      g.id === liveGameId ? { ...g, status: 'completed' } : g
    ));
    setLiveGameId(null);
  };

  const getStatusColor = (status) => {
    if (status === 'live') return 'bg-accent-500 text-white';
    if (status === 'completed') return 'bg-neutral-500 text-white';
    return 'bg-neutral-300 text-neutral-700';
  };

  const liveGame = games.find(g => g.id === liveGameId);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-text-primary dark:text-text-inverse mb-2">Educational Games</h1>
          <p className="text-text-secondary dark:text-neutral-400">{games.length} total games</p>
        </div>
        <BaseButton variant="primary" iconLeft={<Plus size={18} />} onClick={() => setSetupModalOpen(true)}>
          Create Game
        </BaseButton>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <BaseCard variant="stat" icon={<Play size={24} />}>
          <p className="text-3xl font-bold mb-1">{games.filter(g => g.status === 'live').length}</p>
          <p className="text-sm opacity-90">Live Games</p>
        </BaseCard>
        <BaseCard variant="stat" icon={<Trophy size={24} />}>
          <p className="text-3xl font-bold mb-1">{games.filter(g => g.status === 'completed').length}</p>
          <p className="text-sm opacity-90">Completed</p>
        </BaseCard>
        <BaseCard variant="stat" icon={<Users size={24} />}>
          <p className="text-3xl font-bold mb-1">{games.reduce((sum, g) => sum + g.participants, 0)}</p>
          <p className="text-sm opacity-90">Total Players</p>
        </BaseCard>
      </div>

      {/* Live Game Monitor */}
      {liveGame && (
        <BaseCard title="🎮 Live Game Monitor" className="bg-accent-500/10 border-accent-500">
          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-bold text-text-primary dark:text-text-inverse mb-2">{liveGame.title}</h3>
              <p className="text-sm text-text-secondary dark:text-neutral-400">Type: {liveGame.type}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-bg-secondary dark:bg-primary-800">
                <div className="flex items-center gap-2 mb-2">
                  <Users size={16} className="text-accent-500" />
                  <span className="text-sm font-semibold">Participants</span>
                </div>
                <p className="text-2xl font-bold text-text-primary dark:text-text-inverse">{liveGame.participants}</p>
              </div>
              <div className="p-4 rounded-lg bg-bg-secondary dark:bg-primary-800">
                <div className="flex items-center gap-2 mb-2">
                  <Clock size={16} className="text-accent-500" />
                  <span className="text-sm font-semibold">Time Elapsed</span>
                </div>
                <p className="text-2xl font-bold text-text-primary dark:text-text-inverse">5:30</p>
              </div>
              <div className="p-4 rounded-lg bg-bg-secondary dark:bg-primary-800">
                <div className="flex items-center gap-2 mb-2">
                  <Trophy size={16} className="text-accent-500" />
                  <span className="text-sm font-semibold">Top Score</span>
                </div>
                <p className="text-2xl font-bold text-text-primary dark:text-text-inverse">850</p>
              </div>
            </div>

            <div className="flex justify-end">
              <BaseButton variant="danger" onClick={handleEndGame}>End Game</BaseButton>
            </div>
          </div>
        </BaseCard>
      )}

      {/* Games Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {games.map((game) => (
          <BaseCard key={game.id} hover>
            <div className="space-y-3">
              <div>
                <h3 className="text-lg font-bold text-text-primary dark:text-text-inverse mb-2">{game.title}</h3>
                <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(game.status)}`}>
                  {game.status}
                </span>
              </div>

              <div className="space-y-2 text-sm text-text-secondary dark:text-neutral-400">
                <div className="flex items-center gap-2">
                  <Settings size={14} />
                  <span>Type: {game.type}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users size={14} />
                  <span>{game.participants} participants</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={14} />
                  <span>Created: {game.created}</span>
                </div>
              </div>

              <div className="flex gap-2">
                {game.status === 'ready' && (
                  <BaseButton variant="primary" iconLeft={<Play size={16} />} onClick={() => handleLaunchGame(game.id)} fullWidth>
                    Launch
                  </BaseButton>
                )}
                {game.status === 'live' && (
                  <BaseButton variant="secondary" onClick={() => setLiveGameId(game.id)} fullWidth>
                    Monitor
                  </BaseButton>
                )}
                {game.status === 'completed' && (
                  <BaseButton variant="secondary" fullWidth>View Results</BaseButton>
                )}
              </div>
            </div>
          </BaseCard>
        ))}
      </div>

      {/* Create Game Modal */}
      <BaseModal
        isOpen={setupModalOpen}
        onClose={() => setSetupModalOpen(false)}
        title="Create New Game"
        footer={
          <>
            <BaseButton variant="secondary" onClick={() => setSetupModalOpen(false)}>Cancel</BaseButton>
            <BaseButton variant="primary" onClick={handleCreateGame}>Create</BaseButton>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-text-primary dark:text-text-inverse mb-2">Game Title</label>
            <input
              type="text"
              value={newGame.title}
              onChange={(e) => setNewGame({ ...newGame, title: e.target.value })}
              className="w-full px-4 py-2 border border-border dark:border-border-dark rounded-lg bg-bg-primary dark:bg-primary-900 text-text-primary dark:text-text-inverse"
              placeholder="Enter game title..."
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-text-primary dark:text-text-inverse mb-2">Game Type</label>
            <select
              value={newGame.type}
              onChange={(e) => setNewGame({ ...newGame, type: e.target.value })}
              className="w-full px-4 py-2 border border-border dark:border-border-dark rounded-lg bg-bg-primary dark:bg-primary-900 text-text-primary dark:text-text-inverse"
            >
              <option value="quiz">Quiz</option>
              <option value="speed">Speed Challenge</option>
              <option value="battle">Battle Arena</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-text-primary dark:text-text-inverse mb-2">Duration (minutes)</label>
            <input
              type="number"
              value={newGame.duration}
              onChange={(e) => setNewGame({ ...newGame, duration: parseInt(e.target.value) })}
              className="w-full px-4 py-2 border border-border dark:border-border-dark rounded-lg bg-bg-primary dark:bg-primary-900 text-text-primary dark:text-text-inverse"
              min="5"
              max="120"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-text-primary dark:text-text-inverse mb-2">Number of Questions</label>
            <input
              type="number"
              value={newGame.questions}
              onChange={(e) => setNewGame({ ...newGame, questions: parseInt(e.target.value) })}
              className="w-full px-4 py-2 border border-border dark:border-border-dark rounded-lg bg-bg-primary dark:bg-primary-900 text-text-primary dark:text-text-inverse"
              min="5"
              max="50"
            />
          </div>
        </div>
      </BaseModal>
    </div>
  );
}

export default GamesScreen;
