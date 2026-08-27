const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const prettierConfig = require('eslint-config-prettier/flat');
const tseslint = require('typescript-eslint');

module.exports = defineConfig([
  {
    ignores: ['coverage/**', 'dist/**', 'dist-*/**', '.expo/**', '.agents/**'],
  },
  expoConfig,
  prettierConfig,
  {
    plugins: {
      '@typescript-eslint': tseslint.plugin,
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      // react-hooks/immutability doesn't recognize Reanimated's SharedValue
      // as an intentionally mutable container (it's not React state) — every
      // `.value = ...` write on a useSharedValue() result is flagged as a
      // false positive. This is a documented, known gap, not sloppy code.
      'react-hooks/immutability': 'off',
    },
  },
]);
