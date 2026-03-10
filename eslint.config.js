// eslint.config.js — BaZi PWA
// Requer: npm i -D eslint
// Uso: npx eslint js/ public/sw.js

export default [
  // ── Regras modernas — src/ e SW ──────────────────────────────────────────
  {
    files: ['src/**/*.js', 'public/sw.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        // Browser
        document: 'readonly',
        window: 'readonly',
        navigator: 'readonly',
        localStorage: 'readonly',
        fetch: 'readonly',
        requestAnimationFrame: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        console: 'readonly',
        Intl: 'readonly',
        URL: 'readonly',
        // Service Worker globals
        self: 'readonly',
        caches: 'readonly',
        clients: 'readonly',
        indexedDB: 'readonly',
        IDBDatabase: 'readonly',
      },
    },
    rules: {
      // Possíveis erros
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-undef': 'error',
      'no-unreachable': 'error',
      'no-constant-condition': 'warn',

      // Boas práticas
      'eqeqeq': ['error', 'always', { null: 'ignore' }],
      'no-var': 'error',
      'prefer-const': 'warn',
      'no-eval': 'error',

      // Style
      'semi': ['warn', 'always'],
      'no-trailing-spaces': 'warn',
    },
  },

  // ── Regras legacy/ — snapshot histórico, não modernizar ─────────────────
  // Aplica APENAS no-undef para detectar referências quebradas.
  // no-var e demais regras modernas são intencionalmente omitidas.
  {
    files: ['legacy/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        document: 'readonly',
        window: 'readonly',
        navigator: 'readonly',
        localStorage: 'readonly',
        fetch: 'readonly',
        requestAnimationFrame: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        console: 'readonly',
        Intl: 'readonly',
        URL: 'readonly',
      },
    },
    rules: {
      'no-undef': 'error',
    },
  },
];
