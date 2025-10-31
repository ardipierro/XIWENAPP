/**
 * Advanced Exercise Parser
 *
 * Parses multiple types of exercises from text files:
 * - MULTIPLE_CHOICE: Standard 4-option questions
 * - FILL_BLANK: Fill in the blank questions
 * - TRUE_FALSE: True/False questions
 * - MATCHING: Match items from two columns
 * - ORDER: Order sentences/words correctly
 * - HIGHLIGHT: Highlight specific words in text
 * - DRAG_DROP: Drag items to correct positions
 * - TABLE: Fill table cells
 */

// Exercise type constants
export const EXERCISE_TYPES = {
  MULTIPLE_CHOICE: 'multiple_choice',
  FILL_BLANK: 'fill_blank',
  TRUE_FALSE: 'true_false',
  MATCHING: 'matching',
  ORDER: 'order',
  HIGHLIGHT: 'highlight',
  DRAG_DROP: 'drag_drop',
  TABLE: 'table'
};

/**
 * Main parser function that detects and routes to specific parsers
 */
export function parseExerciseFile(text, category) {
  const exercises = [];
  const sections = text.split(/\n\s*\n/); // Split by blank lines

  let currentType = EXERCISE_TYPES.MULTIPLE_CHOICE; // Default type

  for (let section of sections) {
    const trimmedSection = section.trim();
    if (!trimmedSection) continue;

    // Detect exercise type markers
    if (trimmedSection.startsWith('[MULTIPLE_CHOICE]')) {
      currentType = EXERCISE_TYPES.MULTIPLE_CHOICE;
      continue;
    } else if (trimmedSection.startsWith('[FILL_BLANK]')) {
      currentType = EXERCISE_TYPES.FILL_BLANK;
      continue;
    } else if (trimmedSection.startsWith('[TRUE_FALSE]')) {
      currentType = EXERCISE_TYPES.TRUE_FALSE;
      continue;
    } else if (trimmedSection.startsWith('[MATCHING]')) {
      currentType = EXERCISE_TYPES.MATCHING;
      continue;
    } else if (trimmedSection.startsWith('[ORDER]')) {
      currentType = EXERCISE_TYPES.ORDER;
      continue;
    } else if (trimmedSection.startsWith('[HIGHLIGHT]')) {
      currentType = EXERCISE_TYPES.HIGHLIGHT;
      continue;
    } else if (trimmedSection.startsWith('[DRAG_DROP]')) {
      currentType = EXERCISE_TYPES.DRAG_DROP;
      continue;
    } else if (trimmedSection.startsWith('[TABLE]')) {
      currentType = EXERCISE_TYPES.TABLE;
      continue;
    }

    // Parse based on current type
    const parsed = parseByType(trimmedSection, currentType, category);
    if (parsed) {
      exercises.push(parsed);
    }
  }

  return exercises;
}

/**
 * Route to specific parser based on type
 */
function parseByType(text, type, category) {
  switch (type) {
    case EXERCISE_TYPES.MULTIPLE_CHOICE:
      return parseMultipleChoice(text, category);
    case EXERCISE_TYPES.FILL_BLANK:
      return parseFillBlank(text, category);
    case EXERCISE_TYPES.TRUE_FALSE:
      return parseTrueFalse(text, category);
    case EXERCISE_TYPES.MATCHING:
      return parseMatching(text, category);
    case EXERCISE_TYPES.ORDER:
      return parseOrder(text, category);
    case EXERCISE_TYPES.HIGHLIGHT:
      return parseHighlight(text, category);
    case EXERCISE_TYPES.DRAG_DROP:
      return parseDragDrop(text, category);
    case EXERCISE_TYPES.TABLE:
      return parseTable(text, category);
    default:
      return null;
  }
}

/**
 * Parse Multiple Choice (existing format)
 * Format:
 * Question text?
 * Option 1
 * *Option 2 (correct)
 * Option 3
 * Option 4
 */
function parseMultipleChoice(text, category) {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l);

  if (lines.length < 5) return null;

  const question = lines[0];
  const options = lines.slice(1, 5);

  // Find correct answer (marked with *)
  const correctAnswerText = options.find(opt =>
    opt.startsWith('*') || opt.includes('(correcta)')
  );

  if (!correctAnswerText) return null;

  // Clean options
  const cleanOptions = options.map(opt =>
    opt.replace(/^\*/, '').replace(/\(correcta\)/g, '').trim()
  );

  const correctAnswerCleaned = correctAnswerText
    .replace(/^\*/, '')
    .replace(/\(correcta\)/g, '')
    .trim();

  const correctIndex = cleanOptions.findIndex(opt => opt === correctAnswerCleaned);

  if (correctIndex === -1) return null;

  return {
    type: EXERCISE_TYPES.MULTIPLE_CHOICE,
    category,
    question,
    options: cleanOptions,
    correct: correctIndex
  };
}

/**
 * Parse Fill in the Blank
 * Format:
 * The capital of France is _____.
 * ANSWER: Paris
 */
function parseFillBlank(text, category) {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l);

  if (lines.length < 2) return null;

  const question = lines[0];
  const answerLine = lines.find(l => l.startsWith('ANSWER:') || l.startsWith('RESPUESTA:'));

  if (!answerLine) return null;

  const answer = answerLine.split(':')[1].trim();

  // Extract all acceptable answers (comma separated)
  const acceptableAnswers = answer.split(',').map(a => a.trim().toLowerCase());

  return {
    type: EXERCISE_TYPES.FILL_BLANK,
    category,
    question,
    answers: acceptableAnswers,
    caseSensitive: false
  };
}

/**
 * Parse True/False
 * Format:
 * The Earth is flat.
 * FALSE
 */
function parseTrueFalse(text, category) {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l);

  if (lines.length < 2) return null;

  const question = lines[0];
  const answerLine = lines[1].toUpperCase();

  if (!['TRUE', 'FALSE', 'VERDADERO', 'FALSO', 'V', 'F'].includes(answerLine)) {
    return null;
  }

  const isTrue = ['TRUE', 'VERDADERO', 'V'].includes(answerLine);

  return {
    type: EXERCISE_TYPES.TRUE_FALSE,
    category,
    question,
    correct: isTrue
  };
}

/**
 * Parse Matching
 * Format:
 * MATCH:
 * Dog = Perro
 * Cat = Gato
 * Bird = Pájaro
 */
function parseMatching(text, category) {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l);

  const pairs = [];

  for (let line of lines) {
    if (line === 'MATCH:') continue;

    const parts = line.split('=');
    if (parts.length === 2) {
      pairs.push({
        left: parts[0].trim(),
        right: parts[1].trim()
      });
    }
  }

  if (pairs.length === 0) return null;

  return {
    type: EXERCISE_TYPES.MATCHING,
    category,
    pairs,
    question: 'Empareja los siguientes elementos:'
  };
}

/**
 * Parse Order/Sequence
 * Format:
 * ORDER: The quick brown fox jumps
 * WORDS: fox|brown|The|jumps|quick
 */
function parseOrder(text, category) {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l);

  let question = '';
  let items = [];

  for (let line of lines) {
    if (line.startsWith('ORDER:')) {
      question = line.replace('ORDER:', '').trim();
    } else if (line.startsWith('WORDS:') || line.startsWith('ITEMS:')) {
      items = line.split(':')[1].split('|').map(i => i.trim());
    }
  }

  if (!question || items.length === 0) return null;

  return {
    type: EXERCISE_TYPES.ORDER,
    category,
    question,
    correctOrder: items,
    shuffledItems: [...items].sort(() => Math.random() - 0.5)
  };
}

/**
 * Parse Highlight Words
 * Format:
 * HIGHLIGHT: The quick brown fox jumps over the lazy dog
 * WORDS: quick,fox,lazy
 */
function parseHighlight(text, category) {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l);

  let sentence = '';
  let targetWords = [];

  for (let line of lines) {
    if (line.startsWith('HIGHLIGHT:')) {
      sentence = line.replace('HIGHLIGHT:', '').trim();
    } else if (line.startsWith('WORDS:')) {
      targetWords = line.split(':')[1].split(',').map(w => w.trim());
    }
  }

  if (!sentence || targetWords.length === 0) return null;

  return {
    type: EXERCISE_TYPES.HIGHLIGHT,
    category,
    sentence,
    targetWords,
    question: 'Selecciona las palabras indicadas:'
  };
}

/**
 * Parse Drag & Drop
 * Format:
 * DRAG: Complete the sentence
 * SENTENCE: The ___ is ___
 * OPTIONS: cat,dog,bird|running,sleeping,eating
 * ANSWERS: cat,sleeping
 */
function parseDragDrop(text, category) {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l);

  let question = '';
  let sentence = '';
  let options = [];
  let answers = [];

  for (let line of lines) {
    if (line.startsWith('DRAG:')) {
      question = line.replace('DRAG:', '').trim();
    } else if (line.startsWith('SENTENCE:')) {
      sentence = line.replace('SENTENCE:', '').trim();
    } else if (line.startsWith('OPTIONS:')) {
      const optStr = line.replace('OPTIONS:', '').trim();
      options = optStr.split('|').map(group => group.split(',').map(o => o.trim()));
    } else if (line.startsWith('ANSWERS:')) {
      answers = line.replace('ANSWERS:', '').split(',').map(a => a.trim());
    }
  }

  if (!sentence || options.length === 0 || answers.length === 0) return null;

  return {
    type: EXERCISE_TYPES.DRAG_DROP,
    category,
    question,
    sentence,
    options,
    answers
  };
}

/**
 * Parse Table Fill
 * Format:
 * TABLE: Complete the multiplication table
 * HEADER: x|2|3|4
 * ROW: 2|4|6|___
 * ANSWER: 8
 */
function parseTable(text, category) {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l);

  let question = '';
  let headers = [];
  let rows = [];
  let answers = [];

  for (let line of lines) {
    if (line.startsWith('TABLE:')) {
      question = line.replace('TABLE:', '').trim();
    } else if (line.startsWith('HEADER:')) {
      headers = line.replace('HEADER:', '').split('|').map(h => h.trim());
    } else if (line.startsWith('ROW:')) {
      rows.push(line.replace('ROW:', '').split('|').map(c => c.trim()));
    } else if (line.startsWith('ANSWER:')) {
      answers.push(line.replace('ANSWER:', '').trim());
    }
  }

  if (!question || headers.length === 0 || rows.length === 0) return null;

  return {
    type: EXERCISE_TYPES.TABLE,
    category,
    question,
    headers,
    rows,
    answers
  };
}

/**
 * Legacy parser for backward compatibility
 * Parses old-style multiple choice questions
 */
export function parseQuestions(text, category) {
  const parsedQuestions = [];

  const allLines = text.split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);

  for (let i = 0; i < allLines.length; i += 5) {
    if (i + 4 < allLines.length) {
      const questionText = allLines[i];
      const options = [
        allLines[i + 1],
        allLines[i + 2],
        allLines[i + 3],
        allLines[i + 4]
      ];

      const correctAnswerText = options.find((opt) =>
        opt.startsWith('*') || opt.includes('(correcta)')
      );

      if (correctAnswerText) {
        const cleanOptions = options.map((opt) =>
          opt.replace(/^\*/, '').replace(/\(correcta\)/g, '').trim()
        );

        const correctAnswerCleaned = correctAnswerText
          .replace(/^\*/, '')
          .replace(/\(correcta\)/g, '')
          .trim();

        const correctIndex = cleanOptions.findIndex(opt => opt === correctAnswerCleaned);

        if (correctIndex !== -1) {
          parsedQuestions.push({
            type: EXERCISE_TYPES.MULTIPLE_CHOICE,
            question: questionText,
            options: cleanOptions,
            correct: correctIndex,
            category: category
          });
        }
      }
    }
  }

  return parsedQuestions;
}
