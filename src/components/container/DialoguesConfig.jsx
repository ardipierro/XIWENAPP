/**
 * @fileoverview Configuración de Diálogos Interactivos
 * @module components/container/DialoguesConfig
 *
 * Panel de configuración para ejercicios de diálogo estilo chat.
 * Reutiliza DialogueBubble y AudioPlayer del libro interactivo.
 */

import { useState, useEffect, useMemo } from 'react';
import {
  MessageCircle,
  Volume2,
  Languages,
  Palette,
  User,
  Settings,
  Eye,
  Zap,
  Trophy,
  Save,
  RotateCcw,
  Plus,
  Trash2
} from 'lucide-react';
import { BaseBadge, BaseButton } from '../common';
import CharacterVoiceManager from '../interactive-book/CharacterVoiceManager';
import logger from '../../utils/logger';

// Configuración por defecto
const DEFAULT_CONFIG = {
  // Display
  showAvatars: true,
  showCharacterNames: true,
  bubbleStyle: 'rounded', // 'rounded', 'square', 'modern'

  // Colores de burbujas (alternadas)
  leftBubbleColor: '#f3f4f6',
  rightBubbleColor: '#dbeafe',
  leftTextColor: '#1f2937',
  rightTextColor: '#1e40af',

  // Audio/TTS
  ttsEnabled: true,
  autoPlayAudio: false,
  playbackSpeed: 1.0,

  // Traducciones
  showTranslations: true,
  translationLanguage: 'zh', // chino por defecto

  // Modo de ejercicio
  exerciseMode: 'read', // 'read', 'fill-blank', 'comprehension', 'order'

  // Gamificación
  pointsPerCorrect: 10,
  showScore: true,
  soundEffects: true,

  // Feedback
  feedbackMode: 'instant', // 'instant', 'end', 'none'
  showHints: true
};

const STORAGE_KEY = 'xiwen_dialogues_config';

/**
 * Panel de configuración para ejercicios de diálogo
 */
function DialoguesConfig({ onSave }) {
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [hasChanges, setHasChanges] = useState(false);
  const [characters, setCharacters] = useState([]);
  const [newCharacterName, setNewCharacterName] = useState('');
  const [showAddCharacter, setShowAddCharacter] = useState(false);

  // Cargar configuración guardada
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setConfig({ ...DEFAULT_CONFIG, ...JSON.parse(saved) });
      }
    } catch (e) {
      logger.error('Error loading dialogues config:', e);
    }
  }, []);

  // Cargar personajes guardados desde CharacterVoiceManager
  useEffect(() => {
    loadCharacters();
  }, []);

  const loadCharacters = () => {
    try {
      const saved = localStorage.getItem('xiwen_character_voices');
      if (saved) {
        const configs = JSON.parse(saved);
        const charList = Object.entries(configs).map(([id, data]) => ({
          id,
          name: data.name || id
        }));

        if (charList.length > 0) {
          setCharacters(charList);
        } else {
          // Personajes de ejemplo si no hay ninguno configurado
          setCharacters([
            { id: 'mozo', name: 'Mozo' },
            { id: 'sofia', name: 'Sofía' },
            { id: 'carlos', name: 'Carlos' }
          ]);
        }
      } else {
        // Personajes de ejemplo si no hay ninguno configurado
        setCharacters([
          { id: 'mozo', name: 'Mozo' },
          { id: 'sofia', name: 'Sofía' },
          { id: 'carlos', name: 'Carlos' }
        ]);
      }
    } catch (e) {
      logger.error('Error loading characters:', e);
      setCharacters([
        { id: 'mozo', name: 'Mozo' },
        { id: 'sofia', name: 'Sofía' },
        { id: 'carlos', name: 'Carlos' }
      ]);
    }
  };

  const addCharacter = () => {
    if (!newCharacterName.trim()) return;

    const id = newCharacterName.toLowerCase().replace(/\s+/g, '_');

    // Verificar si ya existe
    if (characters.find(c => c.id === id)) {
      alert('Este personaje ya existe');
      return;
    }

    const newChar = {
      id,
      name: newCharacterName.trim()
    };

    setCharacters([...characters, newChar]);
    setNewCharacterName('');
    setShowAddCharacter(false);

    logger.info('Personaje agregado:', newChar);
  };

  const removeCharacter = (characterId) => {
    if (confirm('¿Eliminar este personaje y su configuración de voz?')) {
      // Eliminar del estado
      setCharacters(characters.filter(c => c.id !== characterId));

      // Eliminar de localStorage
      try {
        const saved = localStorage.getItem('xiwen_character_voices');
        if (saved) {
          const configs = JSON.parse(saved);
          delete configs[characterId];
          localStorage.setItem('xiwen_character_voices', JSON.stringify(configs));
        }
      } catch (e) {
        logger.error('Error removing character:', e);
      }

      logger.info('Personaje eliminado:', characterId);
    }
  };

  // Actualizar config
  const updateConfig = (key, value) => {
    setConfig(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  // Guardar configuración
  const handleSave = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
      setHasChanges(false);
      onSave?.(config);
      logger.info('Dialogues config saved:', config);
    } catch (e) {
      logger.error('Error saving dialogues config:', e);
    }
  };

  // Resetear a defaults
  const handleReset = () => {
    setConfig(DEFAULT_CONFIG);
    setHasChanges(true);
  };

  return (
    <div className="space-y-6">
      {/* Header con acciones */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-cyan-500" />
          <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            Configuración de Diálogos
          </h3>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border transition-colors"
            style={{
              borderColor: 'var(--color-border)',
              color: 'var(--color-text-secondary)'
            }}
          >
            <RotateCcw size={14} />
            Resetear
          </button>
          <button
            onClick={handleSave}
            disabled={!hasChanges}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition-colors ${
              hasChanges
                ? 'bg-cyan-500 text-white hover:bg-cyan-600'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed dark:bg-gray-700'
            }`}
          >
            <Save size={14} />
            Guardar
          </button>
        </div>
      </div>

      {/* Sección: Visualización */}
      <section className="p-4 rounded-lg border" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-secondary)' }}>
        <div className="flex items-center gap-2 mb-4">
          <Eye size={18} className="text-blue-500" />
          <h4 className="font-medium" style={{ color: 'var(--color-text-primary)' }}>Visualización</h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Mostrar avatares */}
          <label className="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <User size={16} className="text-gray-500" />
              <span className="text-sm" style={{ color: 'var(--color-text-primary)' }}>Mostrar avatares</span>
            </div>
            <input
              type="checkbox"
              checked={config.showAvatars}
              onChange={(e) => updateConfig('showAvatars', e.target.checked)}
              className="w-4 h-4 accent-cyan-500"
            />
          </label>

          {/* Mostrar nombres */}
          <label className="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <span className="text-sm" style={{ color: 'var(--color-text-primary)' }}>Mostrar nombres de personajes</span>
            <input
              type="checkbox"
              checked={config.showCharacterNames}
              onChange={(e) => updateConfig('showCharacterNames', e.target.checked)}
              className="w-4 h-4 accent-cyan-500"
            />
          </label>

          {/* Estilo de burbuja */}
          <div className="p-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <label className="text-sm mb-2 block" style={{ color: 'var(--color-text-primary)' }}>
              Estilo de burbujas
            </label>
            <select
              value={config.bubbleStyle}
              onChange={(e) => updateConfig('bubbleStyle', e.target.value)}
              className="w-full px-3 py-2 rounded border text-sm"
              style={{
                backgroundColor: 'var(--color-bg-primary)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text-primary)'
              }}
            >
              <option value="rounded">Redondeado</option>
              <option value="square">Cuadrado</option>
              <option value="modern">Moderno</option>
            </select>
          </div>
        </div>
      </section>

      {/* Sección: Colores */}
      <section className="p-4 rounded-lg border" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-secondary)' }}>
        <div className="flex items-center gap-2 mb-4">
          <Palette size={18} className="text-purple-500" />
          <h4 className="font-medium" style={{ color: 'var(--color-text-primary)' }}>Colores de Burbujas</h4>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="text-xs mb-1 block" style={{ color: 'var(--color-text-secondary)' }}>
              Burbuja Izq. (fondo)
            </label>
            <input
              type="color"
              value={config.leftBubbleColor}
              onChange={(e) => updateConfig('leftBubbleColor', e.target.value)}
              className="w-full h-10 rounded cursor-pointer"
            />
          </div>
          <div>
            <label className="text-xs mb-1 block" style={{ color: 'var(--color-text-secondary)' }}>
              Burbuja Izq. (texto)
            </label>
            <input
              type="color"
              value={config.leftTextColor}
              onChange={(e) => updateConfig('leftTextColor', e.target.value)}
              className="w-full h-10 rounded cursor-pointer"
            />
          </div>
          <div>
            <label className="text-xs mb-1 block" style={{ color: 'var(--color-text-secondary)' }}>
              Burbuja Der. (fondo)
            </label>
            <input
              type="color"
              value={config.rightBubbleColor}
              onChange={(e) => updateConfig('rightBubbleColor', e.target.value)}
              className="w-full h-10 rounded cursor-pointer"
            />
          </div>
          <div>
            <label className="text-xs mb-1 block" style={{ color: 'var(--color-text-secondary)' }}>
              Burbuja Der. (texto)
            </label>
            <input
              type="color"
              value={config.rightTextColor}
              onChange={(e) => updateConfig('rightTextColor', e.target.value)}
              className="w-full h-10 rounded cursor-pointer"
            />
          </div>
        </div>
      </section>

      {/* Sección: Audio/TTS */}
      <section className="p-4 rounded-lg border" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-secondary)' }}>
        <div className="flex items-center gap-2 mb-4">
          <Volume2 size={18} className="text-green-500" />
          <h4 className="font-medium" style={{ color: 'var(--color-text-primary)' }}>Audio y TTS</h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <label className="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <span className="text-sm" style={{ color: 'var(--color-text-primary)' }}>Habilitar Text-to-Speech</span>
            <input
              type="checkbox"
              checked={config.ttsEnabled}
              onChange={(e) => updateConfig('ttsEnabled', e.target.checked)}
              className="w-4 h-4 accent-cyan-500"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <span className="text-sm" style={{ color: 'var(--color-text-primary)' }}>Auto-reproducir audio</span>
            <input
              type="checkbox"
              checked={config.autoPlayAudio}
              onChange={(e) => updateConfig('autoPlayAudio', e.target.checked)}
              className="w-4 h-4 accent-cyan-500"
            />
          </label>
        </div>

        {/* Configuración de voces por personaje */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <User size={16} className="text-purple-500" />
              <h5 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                Voces por Personaje
              </h5>
              <BaseBadge variant="info" size="sm">
                {characters.length} personaje{characters.length !== 1 ? 's' : ''}
              </BaseBadge>
            </div>
            <BaseButton
              size="sm"
              variant="primary"
              icon={Plus}
              onClick={() => setShowAddCharacter(!showAddCharacter)}
            >
              Agregar Personaje
            </BaseButton>
          </div>

          {/* Formulario para agregar personaje */}
          {showAddCharacter && (
            <div className="mb-4 p-4 rounded-lg bg-white dark:bg-gray-800 border-2 border-purple-300 dark:border-purple-700">
              <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
                Nombre del personaje
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCharacterName}
                  onChange={(e) => setNewCharacterName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addCharacter()}
                  placeholder="ej: María, Andrés, Camarero..."
                  className="flex-1 px-3 py-2 rounded border-2"
                  style={{
                    backgroundColor: 'var(--color-bg-primary)',
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-text-primary)'
                  }}
                  autoFocus
                />
                <BaseButton
                  variant="primary"
                  onClick={addCharacter}
                  disabled={!newCharacterName.trim()}
                >
                  Agregar
                </BaseButton>
                <BaseButton
                  variant="secondary"
                  onClick={() => {
                    setShowAddCharacter(false);
                    setNewCharacterName('');
                  }}
                >
                  Cancelar
                </BaseButton>
              </div>
            </div>
          )}

          <CharacterVoiceManager
            characters={characters}
            alwaysOpen={true}
            onConfigChange={loadCharacters}
          />

          {/* Botones para eliminar personajes */}
          {characters.length > 0 && (
            <div className="mt-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
              <div className="text-xs font-semibold mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                Eliminar personajes
              </div>
              <div className="flex flex-wrap gap-2">
                {characters.map(char => (
                  <button
                    key={char.id}
                    onClick={() => removeCharacter(char.id)}
                    className="flex items-center gap-1 px-2 py-1 text-xs rounded border transition-colors hover:bg-red-50 hover:border-red-300 dark:hover:bg-red-900/20 dark:hover:border-red-700"
                    style={{
                      borderColor: 'var(--color-border)',
                      color: 'var(--color-text-secondary)'
                    }}
                  >
                    <Trash2 size={12} />
                    {char.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Sección: Traducciones */}
      <section className="p-4 rounded-lg border" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-secondary)' }}>
        <div className="flex items-center gap-2 mb-4">
          <Languages size={18} className="text-amber-500" />
          <h4 className="font-medium" style={{ color: 'var(--color-text-primary)' }}>Traducciones</h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <span className="text-sm" style={{ color: 'var(--color-text-primary)' }}>Mostrar traducciones</span>
            <input
              type="checkbox"
              checked={config.showTranslations}
              onChange={(e) => updateConfig('showTranslations', e.target.checked)}
              className="w-4 h-4 accent-cyan-500"
            />
          </label>

          <div className="p-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <label className="text-sm mb-2 block" style={{ color: 'var(--color-text-primary)' }}>
              Idioma de traducción
            </label>
            <select
              value={config.translationLanguage}
              onChange={(e) => updateConfig('translationLanguage', e.target.value)}
              className="w-full px-3 py-2 rounded border text-sm"
              style={{
                backgroundColor: 'var(--color-bg-primary)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text-primary)'
              }}
            >
              <option value="zh">中文 (Chino)</option>
              <option value="en">English</option>
              <option value="pt">Português</option>
            </select>
          </div>
        </div>
      </section>

      {/* Sección: Modo de Ejercicio */}
      <section className="p-4 rounded-lg border" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-secondary)' }}>
        <div className="flex items-center gap-2 mb-4">
          <Settings size={18} className="text-indigo-500" />
          <h4 className="font-medium" style={{ color: 'var(--color-text-primary)' }}>Modo de Ejercicio</h4>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { value: 'read', label: 'Lectura', desc: 'Solo leer diálogo' },
            { value: 'fill-blank', label: 'Completar', desc: 'Rellenar blancos' },
            { value: 'comprehension', label: 'Comprensión', desc: 'Preguntas al final' },
            { value: 'order', label: 'Ordenar', desc: 'Ordenar líneas' }
          ].map(mode => (
            <button
              key={mode.value}
              onClick={() => updateConfig('exerciseMode', mode.value)}
              className={`p-3 rounded-lg border-2 text-left transition-all ${
                config.exerciseMode === mode.value
                  ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="font-medium text-sm" style={{ color: 'var(--color-text-primary)' }}>
                {mode.label}
              </div>
              <div className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                {mode.desc}
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Sección: Gamificación */}
      <section className="p-4 rounded-lg border" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-secondary)' }}>
        <div className="flex items-center gap-2 mb-4">
          <Trophy size={18} className="text-yellow-500" />
          <h4 className="font-medium" style={{ color: 'var(--color-text-primary)' }}>Gamificación</h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <label className="text-sm mb-2 block" style={{ color: 'var(--color-text-primary)' }}>
              Puntos por respuesta correcta
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={config.pointsPerCorrect}
              onChange={(e) => updateConfig('pointsPerCorrect', parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 rounded border text-sm"
              style={{
                backgroundColor: 'var(--color-bg-primary)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text-primary)'
              }}
            />
          </div>

          <label className="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <span className="text-sm" style={{ color: 'var(--color-text-primary)' }}>Mostrar puntuación</span>
            <input
              type="checkbox"
              checked={config.showScore}
              onChange={(e) => updateConfig('showScore', e.target.checked)}
              className="w-4 h-4 accent-cyan-500"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <span className="text-sm" style={{ color: 'var(--color-text-primary)' }}>Efectos de sonido</span>
            <input
              type="checkbox"
              checked={config.soundEffects}
              onChange={(e) => updateConfig('soundEffects', e.target.checked)}
              className="w-4 h-4 accent-cyan-500"
            />
          </label>

          <div className="p-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <label className="text-sm mb-2 block" style={{ color: 'var(--color-text-primary)' }}>
              Modo de feedback
            </label>
            <select
              value={config.feedbackMode}
              onChange={(e) => updateConfig('feedbackMode', e.target.value)}
              className="w-full px-3 py-2 rounded border text-sm"
              style={{
                backgroundColor: 'var(--color-bg-primary)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text-primary)'
              }}
            >
              <option value="instant">Inmediato</option>
              <option value="end">Al finalizar</option>
              <option value="none">Sin feedback</option>
            </select>
          </div>
        </div>
      </section>

      {/* Guía de formato */}
      <section className="p-6 rounded-lg border-2 border-cyan-200 dark:border-cyan-800" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
        <div className="flex items-center gap-2 mb-3">
          <MessageCircle className="w-5 h-5 text-cyan-500" />
          <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            Cómo Escribir el Texto
          </h3>
        </div>
        <p className="text-sm mb-4" style={{ color: 'var(--color-text-secondary)' }}>
          Para <strong>Diálogos</strong>, usa el marcador <strong>#DIALOGO</strong> y escribe cada línea con el formato <strong>Personaje: texto</strong>. Las palabras entre <strong>*asteriscos*</strong> se convierten en espacios en blanco que el alumno debe completar.
        </p>

        <div className="space-y-3">
          <div className="p-4 rounded-lg bg-cyan-50 dark:bg-cyan-900/10">
            <p className="text-xs font-semibold mb-2 text-cyan-700 dark:text-cyan-300">
              ✏️ Ejemplo de texto:
            </p>
            <pre className="text-sm font-mono p-3 rounded bg-white dark:bg-gray-800 overflow-x-auto" style={{ color: 'var(--color-text-primary)' }}>
{`#DIALOGO
Mozo: Buenas noches. ¿Tienen *reserva*?
Sofía: Sí, a nombre de *Sofía Torres*.
Mozo: Perfecto, síganme por *favor*.
Carlos: Gracias, muy *amable*.`}
            </pre>
          </div>

          <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/10">
            <p className="text-xs font-semibold mb-2 text-blue-700 dark:text-blue-300">
              ✅ Resultado:
            </p>
            <p className="text-sm mb-2" style={{ color: 'var(--color-text-primary)' }}>
              Se mostrará un diálogo estilo chat con:
            </p>
            <ul className="text-xs space-y-1 ml-4 list-disc" style={{ color: 'var(--color-text-secondary)' }}>
              <li><strong>Burbujas de chat</strong> alternadas por personaje</li>
              <li><strong>Espacios en blanco</strong> donde estaban las palabras con *asteriscos*</li>
              <li><strong>Audio</strong> opcional para cada línea (si está habilitado TTS)</li>
              <li><strong>Traducciones</strong> opcionales (si están habilitadas)</li>
            </ul>
          </div>

          <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/10">
            <p className="text-xs font-semibold mb-1 text-yellow-700 dark:text-yellow-300">
              💡 Tips:
            </p>
            <ul className="text-xs space-y-1 ml-4 list-disc" style={{ color: 'var(--color-text-secondary)' }}>
              <li>Cada línea debe empezar con <code className="px-1 bg-white dark:bg-gray-800 rounded">Personaje:</code></li>
              <li>Los personajes deben estar configurados en la sección "Personajes y Voces"</li>
              <li>Usa *asteriscos* solo si quieres modo de ejercicio con espacios en blanco</li>
              <li>Para diálogos solo de lectura, no uses asteriscos</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}

// Exportar también la config por defecto y key
export { DEFAULT_CONFIG, STORAGE_KEY };
export default DialoguesConfig;
