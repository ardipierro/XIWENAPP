/**
 * @fileoverview Parser de texto plano a componentes de ejercicios React
 * @module components/designlab/TextToExerciseParser
 */

import { useState } from 'react';
import { FileText, Sparkles, AlertCircle } from 'lucide-react';
import { BaseButton, BaseCard, BaseTextarea, BaseAlert, BaseBadge } from '../common';
import {
  MultipleChoiceExercise,
  FillInBlankExercise,
  MatchingExercise,
  TrueFalseExercise
} from './exercises';
import logger from '../../utils/logger';

/**
 * Sintaxis soportada:
 *
 * [TIPO: MCQ]
 * ¿Pregunta?
 * [opción1]* [opción2] [opción3]
 * EXPLICACION: Texto explicativo...
 * NIVEL: A1
 *
 * [TIPO: BLANK]
 * Texto con ___ espacio
 * RESPUESTA: correcta
 * EXPLICACION: ...
 *
 * [TIPO: MATCH]
 * palabra1 -> traducción1
 * palabra2 -> traducción2
 * EXPLICACION: ...
 *
 * [TIPO: TRUEFALSE]
 * Afirmación a evaluar
 * RESPUESTA: true | false
 * EXPLICACION: ...
 */

/**
 * Parser de texto plano a ejercicios
 */
export function TextToExerciseParser({ onExerciseGenerated }) {
  const [inputText, setInputText] = useState('');
  const [parsedExercise, setParsedExercise] = useState(null);
  const [parseError, setParseError] = useState(null);

  /**
   * Parse MCQ exercise
   */
  const parseMCQ = (lines) => {
    const question = lines[0]?.trim();
    if (!question) throw new Error('Falta la pregunta');

    // Buscar líneas con opciones [texto]*? donde * marca la correcta
    const optionsLine = lines[1]?.trim();
    if (!optionsLine) throw new Error('Faltan las opciones');

    const optionRegex = /\[([^\]]+)\](\*)?/g;
    const options = [];
    let correctAnswer = null;
    let match;

    while ((match = optionRegex.exec(optionsLine)) !== null) {
      const optionText = match[1].trim();
      const isCorrect = match[2] === '*';
      const value = `option${options.length}`;

      options.push({ value, label: optionText });

      if (isCorrect) {
        correctAnswer = value;
      }
    }

    if (options.length < 2) throw new Error('Se necesitan al menos 2 opciones');
    if (!correctAnswer) throw new Error('Marca la opción correcta con *');

    const explanation = extractField(lines, 'EXPLICACION');
    const cefrLevel = extractField(lines, 'NIVEL') || 'A1';
    const hints = extractMultiField(lines, 'PISTA');

    return {
      type: 'mcq',
      props: { question, options, correctAnswer, explanation, cefrLevel, hints }
    };
  };

  /**
   * Parse Blank exercise
   */
  const parseBlank = (lines) => {
    const sentence = lines[0]?.trim();
    if (!sentence || !sentence.includes('___')) {
      throw new Error('La oración debe contener ___ para el espacio en blanco');
    }

    const correctAnswer = extractField(lines, 'RESPUESTA');
    if (!correctAnswer) throw new Error('Falta RESPUESTA: ...');

    const explanation = extractField(lines, 'EXPLICACION');
    const cefrLevel = extractField(lines, 'NIVEL') || 'A1';
    const hints = extractMultiField(lines, 'PISTA');

    // Soporte para múltiples respuestas separadas por |
    const correctAnswers = correctAnswer.includes('|')
      ? correctAnswer.split('|').map((a) => a.trim())
      : correctAnswer;

    return {
      type: 'blank',
      props: {
        sentence,
        correctAnswer: correctAnswers,
        explanation,
        cefrLevel,
        hints
      }
    };
  };

  /**
   * Parse Match exercise
   */
  const parseMatch = (lines) => {
    const title = extractField(lines, 'TITULO') || 'Empareja las palabras';
    const pairs = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.includes('->')) {
        const [left, right] = trimmed.split('->').map((s) => s.trim());
        if (left && right) {
          pairs.push({ left, right });
        }
      }
    }

    if (pairs.length < 2) throw new Error('Se necesitan al menos 2 pares (usa ->)');

    const explanation = extractField(lines, 'EXPLICACION');
    const cefrLevel = extractField(lines, 'NIVEL') || 'A1';

    return {
      type: 'match',
      props: { title, pairs, explanation, cefrLevel }
    };
  };

  /**
   * Parse True/False exercise
   */
  const parseTrueFalse = (lines) => {
    const statement = lines[0]?.trim();
    if (!statement) throw new Error('Falta la afirmación');

    const answerStr = extractField(lines, 'RESPUESTA')?.toLowerCase();
    if (!answerStr) throw new Error('Falta RESPUESTA: true o false');

    const correctAnswer = answerStr === 'true' || answerStr === 'verdadero' || answerStr === 'v';

    const explanation = extractField(lines, 'EXPLICACION');
    const cefrLevel = extractField(lines, 'NIVEL') || 'A1';

    return {
      type: 'truefalse',
      props: { statement, correctAnswer, explanation, cefrLevel }
    };
  };

  /**
   * Extrae un campo de formato CAMPO: valor
   */
  const extractField = (lines, fieldName) => {
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.toUpperCase().startsWith(`${fieldName}:`)) {
        return trimmed.substring(fieldName.length + 1).trim();
      }
    }
    return '';
  };

  /**
   * Extrae múltiples campos (ej: PISTA: ...)
   */
  const extractMultiField = (lines, fieldName) => {
    const results = [];
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.toUpperCase().startsWith(`${fieldName}:`)) {
        results.push(trimmed.substring(fieldName.length + 1).trim());
      }
    }
    return results;
  };

  /**
   * Parse main
   */
  const parseText = () => {
    try {
      setParseError(null);

      if (!inputText.trim()) {
        throw new Error('Escribe un ejercicio para parsear');
      }

      const lines = inputText.split('\n').filter((l) => l.trim() !== '');

      // Extraer tipo
      const typeLine = lines.find((l) => l.trim().toUpperCase().startsWith('[TIPO:'));
      if (!typeLine) {
        throw new Error('Falta [TIPO: MCQ|BLANK|MATCH|TRUEFALSE]');
      }

      const typeMatch = typeLine.match(/\[TIPO:\s*(\w+)\s*\]/i);
      if (!typeMatch) {
        throw new Error('Formato de tipo inválido. Usa [TIPO: MCQ]');
      }

      const type = typeMatch[1].toUpperCase();

      // Filtrar líneas de contenido (sin la línea de tipo)
      const contentLines = lines.filter(
        (l) => !l.trim().toUpperCase().startsWith('[TIPO:')
      );

      let exercise;

      switch (type) {
        case 'MCQ':
          exercise = parseMCQ(contentLines);
          break;
        case 'BLANK':
          exercise = parseBlank(contentLines);
          break;
        case 'MATCH':
          exercise = parseMatch(contentLines);
          break;
        case 'TRUEFALSE':
        case 'TF':
          exercise = parseTrueFalse(contentLines);
          break;
        default:
          throw new Error(`Tipo '${type}' no soportado. Usa: MCQ, BLANK, MATCH, TRUEFALSE`);
      }

      setParsedExercise(exercise);
      logger.info('Exercise parsed successfully:', exercise);

      if (onExerciseGenerated) {
        onExerciseGenerated(exercise);
      }
    } catch (error) {
      logger.error('Parse error:', error);
      setParseError(error.message);
      setParsedExercise(null);
    }
  };

  const handleReset = () => {
    setParsedExercise(null);
    setParseError(null);
  };

  const exampleTexts = {
    mcq: `[TIPO: MCQ]
¿Cómo se dice "hello" en español?
[hola]* [adiós] [gracias] [por favor]
EXPLICACION: "Hola" es el saludo más común en español.
NIVEL: A1
PISTA: Es un saludo informal`,

    blank: `[TIPO: BLANK]
Me ___ María.
RESPUESTA: llamo
EXPLICACION: Usamos "me llamo" para presentarnos.
NIVEL: A1
PISTA: Es un verbo reflexivo`,

    match: `[TIPO: MATCH]
TITULO: Empareja las palabras con su traducción
tener sed -> to be thirsty
tener hambre -> to be hungry
tener frío -> to be cold
tener calor -> to be hot
EXPLICACION: En español usamos "tener" para estas expresiones.
NIVEL: B1`,

    truefalse: `[TIPO: TRUEFALSE]
En español, los adjetivos siempre van antes del sustantivo.
RESPUESTA: false
EXPLICACION: En español, la mayoría de los adjetivos van después del sustantivo.
NIVEL: A2`
  };

  return (
    <div className="space-y-6">
      {/* Input section */}
      {!parsedExercise && (
        <BaseCard
          icon={FileText}
          title="Parser de Texto a Ejercicio"
          subtitle="Escribe o pega el ejercicio en formato de texto"
        >
          <div className="space-y-4">
            <BaseTextarea
              label="Texto del ejercicio"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              rows={12}
              placeholder="Ejemplo:&#10;[TIPO: MCQ]&#10;¿Cómo se dice hello?&#10;[hola]* [adiós] [gracias]&#10;EXPLICACION: ..."
              className="font-mono text-sm"
            />

            {parseError && (
              <BaseAlert variant="danger" icon={AlertCircle}>
                {parseError}
              </BaseAlert>
            )}

            {/* Ejemplos rápidos */}
            <div className="space-y-2">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Ejemplos rápidos:
              </p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(exampleTexts).map(([key, text]) => (
                  <BaseButton
                    key={key}
                    variant="outline"
                    size="sm"
                    onClick={() => setInputText(text)}
                  >
                    {key.toUpperCase()}
                  </BaseButton>
                ))}
              </div>
            </div>

            <BaseButton
              variant="primary"
              icon={Sparkles}
              onClick={parseText}
              fullWidth
              disabled={!inputText.trim()}
            >
              Generar Ejercicio
            </BaseButton>
          </div>
        </BaseCard>
      )}

      {/* Rendered exercise */}
      {parsedExercise && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <BaseBadge variant="success" size="lg">
              Ejercicio generado: {parsedExercise.type.toUpperCase()}
            </BaseBadge>
            <BaseButton variant="outline" size="sm" onClick={handleReset}>
              Crear Otro
            </BaseButton>
          </div>

          {parsedExercise.type === 'mcq' && (
            <MultipleChoiceExercise {...parsedExercise.props} />
          )}
          {parsedExercise.type === 'blank' && (
            <FillInBlankExercise {...parsedExercise.props} />
          )}
          {parsedExercise.type === 'match' && (
            <MatchingExercise {...parsedExercise.props} />
          )}
          {parsedExercise.type === 'truefalse' && (
            <TrueFalseExercise {...parsedExercise.props} />
          )}
        </div>
      )}
    </div>
  );
}

export default TextToExerciseParser;
