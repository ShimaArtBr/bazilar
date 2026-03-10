import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    exclude: ['**/node_modules/**', '**/tests/e2e/**'],
    // FLAGS = 0 para modo legacy (paridade pura)
    env: {
      VITE_BAZI_STEMS_V2: '0',
      VITE_BAZI_SOLAR_V2: '0',
      VITE_BAZI_JIEQI_V2: '0',
      VITE_BAZI_EPHEM_V2: '0',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary'],
      include: [
        'src/modules/engine.js',
        'src/modules/pillars.js',
        'src/modules/data.js',
        'src/core/bazi-engine.js',
        'src/core/ten-gods.js',
        'src/config/flags.js',
        'src/modules/i18n.js',
        'src/modules/geo.js',
      ],
      thresholds: {
        lines:     95,
        functions: 95,
        branches:  90,
        statements: 95,
      },
    },
  },
});
