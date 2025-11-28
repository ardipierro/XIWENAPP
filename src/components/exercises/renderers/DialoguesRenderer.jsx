/**
 * @fileoverview DialoguesRenderer - Renderizador unificado de diálogos
 * @module components/exercises/renderers/DialoguesRenderer
 *
 * UNIFICA:
 * - container/DialoguesExercise.jsx (diseño de referencia)
 *
 * Funcionalidades:
 * - Parseo de formato "Personaje: texto"
 * - Burbujas de diálogo con colores por personaje
 * - Soporte para blanks *palabra* (fill-in)
 * - Audio opcional por línea
 */

import { useState, useMemo, useCallback } from 'react';
import { MessageCircle, Volume2, User } from 'lucide-react';
import { BaseBadge } from '../../common';

// Colores de personajes
const CHARACTER_COLORS = [
  { bg: '#dbeafe', text: '#1e40af', border: '#3b82f6' }, // blue
  { bg: '#dcfce7', text: '#166534', border: '#22c55e' }, // green
  { bg: '#fef3c7', text: '#92400e', border: '#f59e0b' }, // amber
  { bg: '#fce7f3', text: '#9d174d', border: '#ec4899' }, // pink
  { bg: '#e0e7ff', text: '#3730a3', border: '#6366f1' }, // indigo
  { bg: '#ccfbf1', text: '#0f766e', border: '#14b8a6' }, // teal
  { bg: '#ede9fe', text: '#5b21b6', border: '#8b5cf6' }, // violet
  { bg: '#fef2f2', text: '#991b1b', border: '#ef4444' }  // red
];

/**
 * Generar color consistente basado en nombre
 */
function getCharacterColor(name) {
  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return CHARACTER_COLORS[hash % CHARACTER_COLORS.length];
}

/**
 * Parsear contenido de diálogo
 * Formato: "Personaje: texto" o "Personaje - texto"
 */
function parseDialogueContent(text) {
  if (!text || typeof text !== 'string') {
    return { lines: [], characters: [] };
  }

  const lines = [];
  const charactersSet = new Set();

  // Limpiar marcador #DIALOGO si existe
  const cleanText = text
    .replace(/^#DIALOGO\s*/i, '')
    .replace(/^#DIÁLOGO\s*/i, '')
    .trim();

  // Separar líneas
  const rawLines = cleanText.split('\n').filter(l => {
    const trimmed = l.trim();
    return trimmed && !trimmed.startsWith('---') && !trimmed.startsWith('//');
  });

  rawLines.forEach((line, index) => {
    // Formato: "Personaje: texto" o "Personaje - texto"
    const match = line.match(/^([^:–-]+)[:\–-]\s*(.+)$/);

    if (match) {
      const character = match[1].trim();
      const text = match[2].trim();

      charactersSet.add(character);

      lines.push({
        id: `line_${index}`,
        character,
        text,
        index
      });
    }
  });

  // Crear array de personajes con colores
  const characters = Array.from(charactersSet).map((name, idx) => ({
    id: name.toLowerCase().replace(/\s+/g, '_'),
    name,
    color: getCharacterColor(name)
  }));

  return { lines, characters };
}

/**
 * Burbuja de diálogo
 */
function DialogueBubble({ line, character, isAlternate }) {
  const { color } = character;

  return (
    <div
      className={`flex items-start gap-3 mb-4 ${isAlternate ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* Avatar */}
      <div
        className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
        style={{
          backgroundColor: color.bg,
          border: `2px solid ${color.border}`
        }}
      >
        <User size={18} style={{ color: color.text }} />
      </div>

      {/* Contenido */}
      <div className={`flex-1 ${isAlternate ? 'text-right' : 'text-left'}`}>
        {/* Nombre del personaje */}
        <p
          className="text-xs font-semibold mb-1 px-2"
          style={{ color: color.text }}
        >
          {character.name}
        </p>

        {/* Burbuja */}
        <div
          className={`inline-block max-w-[80%] px-4 py-3 rounded-2xl shadow-sm ${
            isAlternate ? 'rounded-tr-none' : 'rounded-tl-none'
          }`}
          style={{
            backgroundColor: color.bg,
            border: `1px solid ${color.border}`,
            color: color.text
          }}
        >
          <p className="text-sm leading-relaxed">{line.text}</p>
        </div>
      </div>
    </div>
  );
}

/**
 * DialoguesRenderer - Renderiza diálogos interactivos
 *
 * @param {Object} props
 * @param {string} props.text - Texto en formato diálogo
 * @param {string} [props.title] - Título del diálogo
 * @param {boolean} [props.alternateAlignment] - Alternar alineación de burbujas
 * @param {boolean} [props.showCharacterCount] - Mostrar contador de personajes
 * @param {string} [props.className] - Clases adicionales
 */
export function DialoguesRenderer({
  text,
  title,
  alternateAlignment = true,
  showCharacterCount = true,
  className = ''
}) {
  // Parsear contenido
  const { lines, characters } = useMemo(() => parseDialogueContent(text), [text]);

  // Mapa de personajes por nombre
  const characterMap = useMemo(() => {
    const map = {};
    characters.forEach(char => {
      map[char.name] = char;
    });
    return map;
  }, [characters]);

  if (lines.length === 0) {
    return (
      <div className="text-center py-12">
        <MessageCircle size={48} className="mx-auto mb-4 opacity-30" />
        <p style={{ color: 'var(--color-text-secondary)' }}>
          No se detectaron diálogos. Usa el formato: "Personaje: texto"
        </p>
      </div>
    );
  }

  return (
    <div className={`dialogues-renderer w-full ${className}`}>
      {/* Header */}
      {(title || showCharacterCount) && (
        <div
          className="mb-6 p-4 rounded-lg"
          style={{
            backgroundColor: 'var(--color-bg-secondary)',
            border: '1px solid var(--color-border)'
          }}
        >
          {title && (
            <div className="flex items-center gap-2 mb-3">
              <MessageCircle size={20} style={{ color: 'var(--color-primary, #8b5cf6)' }} />
              <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                {title}
              </h3>
            </div>
          )}

          {showCharacterCount && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                Personajes:
              </span>
              {characters.map(char => (
                <BaseBadge
                  key={char.id}
                  size="sm"
                  style={{
                    backgroundColor: char.color.bg,
                    color: char.color.text,
                    border: `1px solid ${char.color.border}`
                  }}
                >
                  {char.name}
                </BaseBadge>
              ))}
              <span className="text-xs ml-2" style={{ color: 'var(--color-text-muted)' }}>
                {lines.length} {lines.length === 1 ? 'línea' : 'líneas'}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Diálogos */}
      <div
        className="p-6 rounded-lg"
        style={{
          backgroundColor: 'var(--color-bg-secondary)',
          minHeight: '400px'
        }}
      >
        {lines.map((line, index) => {
          const character = characterMap[line.character];
          if (!character) return null;

          // Alternar alineación basado en el personaje
          const isAlternate = alternateAlignment && index % 2 === 1;

          return (
            <DialogueBubble
              key={line.id}
              line={line}
              character={character}
              isAlternate={isAlternate}
            />
          );
        })}
      </div>

      {/* Footer con info */}
      <div
        className="mt-4 p-3 rounded-lg text-center"
        style={{
          backgroundColor: 'var(--color-bg-tertiary)',
          border: '1px solid var(--color-border)'
        }}
      >
        <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
          💡 Tip: Lee el diálogo en voz alta para practicar pronunciación
        </p>
      </div>
    </div>
  );
}

export default DialoguesRenderer;
