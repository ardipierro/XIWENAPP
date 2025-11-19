/**
 * @fileoverview Parser de texto plano a componentes de ejercicios React
 * @module components/designlab/TextToExerciseParser
 */

import { useState } from 'react';
import { FileText, Sparkles, AlertCircle } from 'lucide-react';
import { BaseButton, BaseTextarea, BaseAlert, BaseBadge } from '../common';
import { UniversalCard } from '../cards';
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

  // 19 Ejemplos organizados por categorías
  const exampleTexts = {
    // FASE 1: BÁSICOS
    mcq: {
      label: 'Opción Múltiple',
      icon: '📝',
      category: 'Básicos',
      text: `[TIPO: MCQ]
¿Cómo se dice "hello" en español?
[hola]* [adiós] [gracias] [por favor]
EXPLICACION: "Hola" es el saludo más común en español.
NIVEL: A1
PISTA: Es un saludo informal`
    },

    blank: {
      label: 'Completar Espacios',
      icon: '✏️',
      category: 'Básicos',
      text: `[TIPO: BLANK]
Me ___ María.
RESPUESTA: llamo
EXPLICACION: Usamos "me llamo" para presentarnos.
NIVEL: A1
PISTA: Es un verbo reflexivo`
    },

    match: {
      label: 'Emparejar',
      icon: '🔗',
      category: 'Básicos',
      text: `[TIPO: MATCH]
TITULO: Empareja las palabras con su traducción
tener sed -> to be thirsty
tener hambre -> to be hungry
tener frío -> to be cold
tener calor -> to be hot
EXPLICACION: En español usamos "tener" para estas expresiones.
NIVEL: B1`
    },

    truefalse: {
      label: 'Verdadero/Falso',
      icon: '✅',
      category: 'Básicos',
      text: `[TIPO: TRUEFALSE]
En español, los adjetivos siempre van antes del sustantivo.
RESPUESTA: false
EXPLICACION: En español, la mayoría de los adjetivos van después del sustantivo.
NIVEL: A2`
    },

    // FASE 2: AUDIO (Nota: Parser no genera componentes de audio, pero muestra sintaxis)
    audiolistening: {
      label: 'Comprensión Auditiva',
      icon: '🎧',
      category: 'Audio',
      text: `[TIPO: AUDIO]
AUDIO: /audio/dialogo-restaurante.mp3
TRANSCRIPT: ¿Qué desea ordenar? - Quiero una pizza por favor.
PREGUNTA: ¿Qué quiere ordenar la persona?
[pizza]* [hamburguesa] [ensalada] [pasta]
EXPLICACION: La persona dice "quiero una pizza".
NIVEL: A2`
    },

    aiaudio: {
      label: 'Pronunciación IA',
      icon: '🎤',
      category: 'Audio',
      text: `[TIPO: AI_AUDIO]
La jirafa jaranera jugaba en el jardín
FONETICA: la xi.ˈɾa.fa xa.ɾa.ˈne.ɾa xu.ˈɣa.βa en el xaɾ.ˈdin
DIFICULTAD: hard
TIP: La 'j' en español es gutural
NIVEL: B2`
    },

    dictation: {
      label: 'Dictado',
      icon: '📝',
      category: 'Audio',
      text: `[TIPO: DICTATION]
AUDIO: /audio/dictado-01.mp3
RESPUESTA: El perro corre por el parque
EXPLICACION: Dictado de una oración simple en presente.
NIVEL: A1`
    },

    // FASE 3: INTERACTIVOS
    textselection: {
      label: 'Selección de Texto',
      icon: '🎯',
      category: 'Interactivos',
      text: `[TIPO: TEXT_SELECTION]
INSTRUCCION: Selecciona todos los verbos
TEXTO: María estudia español todos los días. Juan trabaja en un banco.
PALABRAS: estudia|trabaja
EXPLICACION: Los verbos son acciones.
NIVEL: A2`
    },

    dragdrop: {
      label: 'Ordenar Arrastrando',
      icon: '🔄',
      category: 'Interactivos',
      text: `[TIPO: DRAG_DROP]
INSTRUCCION: Ordena las palabras para formar la oración
PALABRAS: Yo|me|levanto|a|las|ocho
EXPLICACION: El orden correcto en español.
NIVEL: A1`
    },

    freedragdrop: {
      label: 'Categorizar Arrastrando',
      icon: '📦',
      category: 'Interactivos',
      text: `[TIPO: FREE_DRAG]
TITULO: Clasifica por género
CATEGORIA: Masculino|Femenino
ITEMS: el libro→Masculino|la mesa→Femenino|el coche→Masculino|la casa→Femenino
EXPLICACION: Los sustantivos en español tienen género.
NIVEL: A1`
    },

    dialoguerole: {
      label: 'Diálogo por Roles',
      icon: '💬',
      category: 'Interactivos',
      text: `[TIPO: DIALOGUE_ROLE]
CONTEXTO: En un restaurante
ROLE_A: Mesero|ROLE_B: Cliente
USER_ROLE: B
A: Buenas tardes, ¿qué desea ordenar?
B: [USER_INPUT]|Quiero una pizza|Una pizza por favor
A: ¿Qué sabor de pizza prefiere?
EXPLICACION: Usa expresiones corteses como "por favor".
NIVEL: A2`
    },

    dialoguecompletion: {
      label: 'Completar Diálogo',
      icon: '💭',
      category: 'Interactivos',
      text: `[TIPO: DIALOGUE_COMPLETE]
A: ¿Cómo te llamas?
B: [Me llamo Ana]*[Soy Ana][Mi nombre Ana]
A: Encantado de conocerte
EXPLICACION: "Me llamo" es la forma más formal.
NIVEL: A1`
    },

    // FASE 4: LENGUAJE
    verbid: {
      label: 'Identificar Verbos',
      icon: '🔤',
      category: 'Lenguaje',
      text: `[TIPO: VERB_ID]
INSTRUCCION: Selecciona todos los verbos conjugados
TEXTO: María estudia español. Juan trabaja mucho. Ellos viven en Madrid.
VERBOS: estudia→estudiar→presente|trabaja→trabajar→presente|viven→vivir→presente
EXPLICACION: Los verbos conjugados indican la acción.
NIVEL: B1`
    },

    grammar: {
      label: 'Transformación Gramatical',
      icon: '🔄',
      category: 'Lenguaje',
      text: `[TIPO: GRAMMAR_TRANSFORM]
INSTRUCCION: Transforma al pasado
ORACION: Yo como pizza
RESPUESTA: Yo comí pizza|Comí pizza
EXPLICACION: Pretérito indefinido de "comer".
NIVEL: B1`
    },

    error: {
      label: 'Detectar Errores',
      icon: '🔍',
      category: 'Lenguaje',
      text: `[TIPO: ERROR_DETECT]
TEXTO: Yo *es* estudiante. María *trabaja* en el banco.
ERRORES: es→soy
EXPLICACION: Con "yo" usamos "soy", no "es".
NIVEL: A2`
    },

    collocation: {
      label: 'Colocaciones',
      icon: '🔗',
      category: 'Lenguaje',
      text: `[TIPO: COLLOCATION]
TITULO: Empareja las colocaciones
hacer -> la cama
tomar -> una decisión
poner -> la mesa
dar -> las gracias
EXPLICACION: Colocaciones comunes en español.
NIVEL: B2`
    },

    // FASE 5: COMPLEJOS
    cloze: {
      label: 'Cloze Test',
      icon: '📋',
      category: 'Complejos',
      text: `[TIPO: CLOZE]
El [___] corre por el [___] mientras el niño [___].
RESPUESTAS: perro|parque|juega
BANCO: perro|gato|parque|casa|juega|duerme
EXPLICACION: Completa el texto con las palabras del banco.
NIVEL: A1`
    },

    sentencebuilder: {
      label: 'Construir Oraciones',
      icon: '🏗️',
      category: 'Complejos',
      text: `[TIPO: SENTENCE_BUILD]
PALABRAS: María|estudia|español|todos|los|días
ORDEN_CORRECTO: María|estudia|español|todos|los|días
EXPLICACION: Sujeto + Verbo + Objeto + Complemento.
NIVEL: A2`
    },

    reading: {
      label: 'Lectura Interactiva',
      icon: '📖',
      category: 'Complejos',
      text: `[TIPO: INTERACTIVE_READING]
TITULO: Un día en Barcelona
TEXTO: Barcelona es una ciudad cosmopolita situada en la costa mediterránea...
VOCABULARIO: cosmopolita→international→国际化的|costa→coast→海岸|mediterránea→Mediterranean→地中海的
PREGUNTA: ¿Dónde está situada Barcelona?
[En la costa atlántica][En la costa mediterránea]*[En el interior]
NIVEL: B1`
    },

    hotspot: {
      label: 'Puntos en Imagen',
      icon: '🖼️',
      category: 'Complejos',
      text: `[TIPO: HOTSPOT]
IMAGEN: /images/room.jpg
HOTSPOTS: 100,150→mesa|200,300→silla|150,100→lámpara
INSTRUCCION: Haz clic en la mesa
EXPLICACION: Identifica objetos en la imagen.
NIVEL: A1`
    }
  };

  return (
    <div className="space-y-6">
      {/* Input section */}
      {!parsedExercise && (
        <UniversalCard
          variant="default"
          size="md"
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

            {/* Ejemplos organizados por categorías */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  📚 19 Ejemplos de Sintaxis (Click para cargar):
                </p>
                <BaseBadge variant="primary">
                  {Object.keys(exampleTexts).length} tipos
                </BaseBadge>
              </div>

              {/* Agrupar por categorías */}
              {['Básicos', 'Audio', 'Interactivos', 'Lenguaje', 'Complejos'].map(category => {
                const examples = Object.entries(exampleTexts).filter(([_, ex]) => ex.category === category);
                return (
                  <div key={category} className="space-y-2">
                    <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                      {category}
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                      {examples.map(([key, example]) => (
                        <button
                          key={key}
                          onClick={() => setInputText(example.text)}
                          className="flex items-center gap-2 p-3 rounded-lg border-2 border-gray-200
                                   dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-400
                                   bg-white dark:bg-gray-800 transition-all hover:shadow-md group"
                        >
                          <span className="text-xl flex-shrink-0 group-hover:scale-110 transition-transform">
                            {example.icon}
                          </span>
                          <span className="text-xs font-medium text-gray-900 dark:text-white text-left">
                            {example.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
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
        </UniversalCard>
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
