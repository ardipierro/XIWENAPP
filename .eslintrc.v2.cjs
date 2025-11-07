/**
 * XIWENAPP V2 - ESLint Configuration
 *
 * STRICT MODE - Enforces coding guidelines
 *
 * Rules enforced:
 * - Max 300 lines per file
 * - Max 50 lines per function
 * - Max complexity of 10
 * - No CSS imports (Tailwind only)
 * - No console statements (use logger)
 * - React best practices
 *
 * To use: Rename to .eslintrc.cjs or update package.json
 */

module.exports = {
  root: true,
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    'plugin:react-hooks/recommended',
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  plugins: ['react', 'react-hooks', 'react-refresh'],
  settings: {
    react: {
      version: 'detect',
    },
  },

  rules: {
    // ============================================
    // 📏 FILE & FUNCTION SIZE LIMITS (STRICT)
    // ============================================
    'max-lines': [
      'error',
      {
        max: 300,
        skipBlankLines: true,
        skipComments: true,
      },
    ],
    'max-lines-per-function': [
      'error',
      {
        max: 50,
        skipBlankLines: true,
        skipComments: true,
        IIFEs: true,
      },
    ],
    'max-depth': ['error', 4],
    'complexity': ['error', 10],

    // ============================================
    // 🎨 STYLING RULES (NO CSS IMPORTS)
    // ============================================
    // Note: This is a basic check, for full enforcement consider
    // creating a custom ESLint plugin
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: ['*.css', '*.scss', '*.sass', '*.less'],
            message: '❌ CSS imports are forbidden! Use Tailwind classes only.',
          },
        ],
      },
    ],

    // ============================================
    // 🚫 NO CONSOLE (USE LOGGER)
    // ============================================
    'no-console': [
      'error',
      {
        allow: ['warn', 'error'], // Allow console.warn and console.error
      },
    ],
    'no-alert': 'error',
    'no-debugger': 'error',

    // ============================================
    // ⚛️ REACT RULES
    // ============================================
    'react/prop-types': 'off', // We'll use JSDoc or TypeScript
    'react/react-in-jsx-scope': 'off', // Not needed in React 17+
    'react/jsx-uses-react': 'off',
    'react/jsx-no-target-blank': 'error',
    'react/jsx-key': 'error',
    'react/no-array-index-key': 'warn',
    'react/no-unused-state': 'error',
    'react/no-direct-mutation-state': 'error',
    'react/jsx-pascal-case': 'error',
    'react/jsx-no-duplicate-props': 'error',
    'react/jsx-no-useless-fragment': 'warn',
    'react/self-closing-comp': 'warn',
    'react/jsx-curly-brace-presence': ['warn', 'never'],

    // ============================================
    // 🪝 REACT HOOKS RULES
    // ============================================
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',

    // ============================================
    // 🔄 REACT REFRESH (HMR)
    // ============================================
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],

    // ============================================
    // 📝 CODE QUALITY
    // ============================================
    'no-var': 'error',
    'prefer-const': 'error',
    'prefer-arrow-callback': 'warn',
    'prefer-template': 'warn',
    'no-unused-vars': [
      'error',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      },
    ],
    'no-unused-expressions': 'error',
    'no-return-await': 'warn',
    'require-await': 'warn',
    'no-async-promise-executor': 'error',

    // ============================================
    // 🎯 NAMING CONVENTIONS
    // ============================================
    'camelcase': [
      'warn',
      {
        properties: 'never',
        ignoreDestructuring: true,
        allow: ['^UNSAFE_', '^firebase_', '^[A-Z0-9_]+$'], // Allow CONSTANTS
      },
    ],

    // ============================================
    // 🧹 CODE STYLE
    // ============================================
    'eqeqeq': ['error', 'always'],
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-with': 'error',
    'no-new-func': 'error',
    'no-new-wrappers': 'error',
    'no-throw-literal': 'error',
    'prefer-promise-reject-errors': 'error',

    // ============================================
    // 📦 IMPORTS
    // ============================================
    'no-duplicate-imports': 'error',
    'sort-imports': [
      'warn',
      {
        ignoreCase: true,
        ignoreDeclarationSort: true, // We'll use a plugin for this
      },
    ],

    // ============================================
    // 🐛 POTENTIAL ERRORS
    // ============================================
    'no-await-in-loop': 'warn',
    'no-promise-executor-return': 'warn',
    'no-unreachable-loop': 'error',
    'require-atomic-updates': 'error',

    // ============================================
    // ♿ ACCESSIBILITY
    // ============================================
    'jsx-a11y/alt-text': 'off', // Will enable if we add jsx-a11y plugin
    'jsx-a11y/anchor-is-valid': 'off',
  },

  // ============================================
  // 📁 FILE SPECIFIC OVERRIDES
  // ============================================
  overrides: [
    {
      // Allow longer files for base templates
      files: ['**/components/base/*.jsx', '**/components/base/*.tsx'],
      rules: {
        'max-lines': ['warn', 400], // Base templates can be slightly longer
      },
    },
    {
      // Allow longer files for hooks (but still warn)
      files: ['**/hooks/*.js', '**/hooks/*.ts'],
      rules: {
        'max-lines': ['warn', 350],
      },
    },
    {
      // Test files can be longer
      files: ['**/*.test.js', '**/*.test.jsx', '**/*.spec.js'],
      rules: {
        'max-lines': 'off',
        'max-lines-per-function': 'off',
      },
    },
    {
      // Config files can have longer lines
      files: ['**/*.config.js', '**/*.config.cjs'],
      rules: {
        'max-lines': 'off',
      },
    },
    {
      // Firebase functions (external, don't modify)
      files: ['**/firebase/*.js', '**/firebase/*.ts'],
      rules: {
        'max-lines': 'warn', // Warn but don't error
        'max-lines-per-function': 'warn',
      },
    },
  ],

  // ============================================
  // 🔇 IGNORES
  // ============================================
  ignorePatterns: [
    'node_modules/',
    'dist/',
    'build/',
    'functions/',
    'public/',
    '*.config.js',
    '*.config.cjs',
    'vite.config.js',
    'tailwind.config.js',
    'postcss.config.js',
  ],
};
