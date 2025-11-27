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
  TABLE: 'table',
  OPEN_QUESTIONS: 'open_questions',
  INFO_TABLE: 'info_table'
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
    } else if (trimmedSection.startsWith('#RESPUESTA_LIBRE') ||
               trimmedSection.startsWith('#OPEN_QUESTIONS') ||
               trimmedSection.startsWith('[OPEN_QUESTIONS]')) {
      currentType = EXERCISE_TYPES.OPEN_QUESTIONS;
      // Don't continue - parse this section as open questions
    } else if (trimmedSection.startsWith('#TABLA_INFO') ||
               trimmedSection.startsWith('#INFO_TABLE') ||
               trimmedSection.startsWith('[INFO_TABLE]')) {
      currentType = EXERCISE_TYPES.INFO_TABLE;
      // Don't continue - parse this section as info table
    }

    // Auto-detect numbered questions format (1. 2. 3. etc.)
    if (currentType === EXERCISE_TYPES.MULTIPLE_CHOICE) {
      const numberedPattern = /^\d+\.\s+.+/;
      const lines = trimmedSection.split('\n').filter(l => l.trim());
      if (lines.length >= 1 && lines.every(l => numberedPattern.test(l.trim()))) {
        currentType = EXERCISE_TYPES.OPEN_QUESTIONS;
      }
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
    case EXERCISE_TYPES.OPEN_QUESTIONS:
      return parseOpenQuestions(text, category);
    case EXERCISE_TYPES.INFO_TABLE:
      return parseInfoTable(text, category);
    default:
      return null;
  }
}

/**
 * Helper: Remove leading letter (A., B), a), etc.) from option text
 */
function removeLeadingLetter(text) {
  return text.replace(/^[A-Da-d][\.\)\s]+\s*/, '').trim();
}

/**
 * Parse Multiple Choice (enhanced format)
 * Supports:
 * - Multiple correct answers (multiple * markers)
 * - 2-4 options (flexible)
 * - Inline explanations per option (:: syntax)
 * - General explanation (:: on its own line)
 *
 * Format:
 * Question text?
 * *Option 1 :: explanation for this option
 * Option 2
 * *Option 3 (another correct)
 * Option 4
 * :: General explanation for the question
 */
function parseMultipleChoice(text, category) {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l);

  if (lines.length < 3) return null; // Minimum: 1 question + 2 options

  const question = lines[0];
  const options = [];
  const optionExplanations = [];
  const correctIndices = [];
  let explanation = null;

  // Process option lines
  for (let i = 1; i < lines.length && options.length < 6; i++) {
    const line = lines[i];

    // Check if this is a general explanation line (starts with :: alone)
    if (line.startsWith('::') && !line.match(/^[*]?[A-Da-d]?[\.\)\s]?/)) {
      explanation = line.substring(2).trim();
      continue;
    }

    // Detect if option is correct
    const isCorrect = line.startsWith('*') || line.includes('(correcta)');
    let fullOptionText = line.replace(/^\*/, '').replace(/\(correcta\)/g, '').trim();

    // Remove leading letter if present (A., B), etc.)
    fullOptionText = removeLeadingLetter(fullOptionText);

    // Separate option text from inline explanation (:: syntax)
    let optionText = fullOptionText;
    let inlineExplanation = null;

    const explIndex = fullOptionText.indexOf('::');
    if (explIndex !== -1) {
      optionText = fullOptionText.substring(0, explIndex).trim();
      inlineExplanation = fullOptionText.substring(explIndex + 2).trim();
    }

    if (optionText) {
      if (isCorrect) {
        correctIndices.push(options.length);
      }
      options.push(optionText);
      optionExplanations.push(inlineExplanation);
    }
  }

  // Validate: at least 2 options and at least 1 correct answer
  if (options.length < 2 || correctIndices.length === 0) return null;

  return {
    type: EXERCISE_TYPES.MULTIPLE_CHOICE,
    category,
    question,
    options,
    optionExplanations,
    correct: correctIndices.length === 1 ? correctIndices[0] : correctIndices,
    explanation
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
 * Parse Open Questions / Respuesta Libre
 * Formats supported:
 * 1. Explicit format with P: and R:
 *    #RESPUESTA_LIBRE
 *    P: Acá llueve mucho.
 *    R: Acá llueve poco.
 *
 * 2. Numbered format (auto-detected)
 *    1. Acá llueve mucho.
 *    2. El tiempo es muy agradable.
 */
function parseOpenQuestions(text, category) {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l);
  const questions = [];

  // Try P:/R: format first
  let currentQuestion = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Skip header markers
    if (line.startsWith('#RESPUESTA_LIBRE') ||
        line.startsWith('#OPEN_QUESTIONS') ||
        line.startsWith('---')) {
      continue;
    }

    // P: format
    if (line.startsWith('P:') || line.startsWith('PREGUNTA:')) {
      if (currentQuestion) {
        questions.push(currentQuestion);
      }
      currentQuestion = {
        question: line.replace(/^(P:|PREGUNTA:)\s*/, '').trim(),
        answer: null
      };
    }
    // R: format
    else if (line.startsWith('R:') || line.startsWith('RESPUESTA:')) {
      if (currentQuestion) {
        currentQuestion.answer = line.replace(/^(R:|RESPUESTA:)\s*/, '').trim();
      }
    }
    // Numbered format: 1. Question text
    else if (/^\d+[\.\)]\s+/.test(line)) {
      if (currentQuestion) {
        questions.push(currentQuestion);
      }
      currentQuestion = {
        question: line.replace(/^\d+[\.\)]\s+/, '').trim(),
        answer: null
      };
    }
    // Line starting with - could be expected answer for numbered format
    else if (line.startsWith('-') && currentQuestion && !currentQuestion.answer) {
      currentQuestion.answer = line.replace(/^-\s*/, '').trim();
    }
  }

  // Don't forget last question
  if (currentQuestion) {
    questions.push(currentQuestion);
  }

  if (questions.length === 0) return null;

  return {
    type: EXERCISE_TYPES.OPEN_QUESTIONS,
    category,
    questions,
    title: 'Ejercicio de Respuesta Libre'
  };
}

/**
 * Parse Info Table / Cuadro Informativo
 * Format:
 * #TABLA_INFO
 * TITULO: mucho vs muy
 * COLUMNAS: mucho|muy
 * ---
 * Hace mucho calor|El tiempo está muy bueno
 * Hace mucho frío|El tiempo está muy malo
 * ---
 * NOTA: muy (副词) + 形容词
 */
function parseInfoTable(text, category) {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l);

  let title = '';
  let columns = [];
  let rows = [];
  let notes = [];
  let inDataSection = false;

  for (const line of lines) {
    // Skip header markers
    if (line.startsWith('#TABLA_INFO') ||
        line.startsWith('#INFO_TABLE')) {
      continue;
    }

    // Title
    if (line.startsWith('TITULO:') || line.startsWith('TITLE:')) {
      title = line.replace(/^(TITULO:|TITLE:)\s*/, '').trim();
    }
    // Column headers
    else if (line.startsWith('COLUMNAS:') || line.startsWith('COLUMNS:')) {
      columns = line.replace(/^(COLUMNAS:|COLUMNS:)\s*/, '').split('|').map(c => c.trim());
    }
    // Notes
    else if (line.startsWith('NOTA:') || line.startsWith('NOTE:')) {
      notes.push(line.replace(/^(NOTA:|NOTE:)\s*/, '').trim());
    }
    // Section separator
    else if (line === '---') {
      inDataSection = true;
    }
    // Data rows (contain |)
    else if (line.includes('|')) {
      const cells = line.split('|').map(c => c.trim());
      // If no columns defined yet, first row with | becomes columns
      if (columns.length === 0) {
        columns = cells;
      } else {
        rows.push(cells);
      }
    }
  }

  if (columns.length === 0 && rows.length === 0) return null;

  return {
    type: EXERCISE_TYPES.INFO_TABLE,
    category,
    title: title || 'Cuadro Informativo',
    columns,
    rows,
    notes
  };
}

/**
 * Enhanced parser for multiple choice questions
 * Supports:
 * - Multiple correct answers (multiple * markers)
 * - 2-6 options (flexible, not fixed to 4)
 * - Inline explanations per option (:: syntax)
 * - General explanation (:: on its own line)
 *
 * Format:
 * Question text?
 * *Option 1 :: why this is correct
 * Option 2
 * *Option 3
 * Option 4
 * :: General explanation
 *
 * Next question?
 * Option A
 * *Option B
 * Option C
 */
export function parseQuestions(text, category) {
  const parsedQuestions = [];

  const allLines = text.split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);

  let i = 0;
  while (i < allLines.length) {
    const questionText = allLines[i];
    i++;

    // Collect options (up to 6, or until we hit a line that looks like a new question)
    const options = [];
    const optionExplanations = [];
    const correctIndices = [];
    let explanation = null;

    while (i < allLines.length && options.length < 6) {
      const line = allLines[i];

      // Check if this is a general explanation line (starts with :: alone)
      if (line.startsWith('::') && !line.match(/^[*]?[A-Da-d]?[\.\)\s]/)) {
        explanation = line.substring(2).trim();
        i++;
        continue;
      }

      // Check if this looks like a new question (ends with ? and isn't an option)
      // A new question typically doesn't start with *, A), B), etc.
      if (options.length >= 2 && line.endsWith('?') && !line.startsWith('*') && !line.match(/^[A-Da-d][\.\)]/)) {
        break; // This is the next question
      }

      // Detect if option is correct
      const isCorrect = line.startsWith('*') || line.includes('(correcta)');
      let fullOptionText = line.replace(/^\*/, '').replace(/\(correcta\)/g, '').trim();

      // Remove leading letter if present (A., B), etc.)
      fullOptionText = removeLeadingLetter(fullOptionText);

      // Separate option text from inline explanation (:: syntax)
      let optionText = fullOptionText;
      let inlineExplanation = null;

      const explIndex = fullOptionText.indexOf('::');
      if (explIndex !== -1) {
        optionText = fullOptionText.substring(0, explIndex).trim();
        inlineExplanation = fullOptionText.substring(explIndex + 2).trim();
      }

      if (optionText) {
        if (isCorrect) {
          correctIndices.push(options.length);
        }
        options.push(optionText);
        optionExplanations.push(inlineExplanation);
      }
      i++;
    }

    // Validate: at least 2 options and at least 1 correct answer
    if (options.length >= 2 && correctIndices.length > 0) {
      parsedQuestions.push({
        type: EXERCISE_TYPES.MULTIPLE_CHOICE,
        question: questionText,
        options,
        optionExplanations,
        correct: correctIndices.length === 1 ? correctIndices[0] : correctIndices,
        explanation,
        category
      });
    }
  }

  return parsedQuestions;
}
