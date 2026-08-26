const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const prettierConfig = require('eslint-config-prettier/flat');
const tseslint = require('typescript-eslint');

module.exports = defineConfig([
  expoConfig,
  prettierConfig,
  {
    ignores: ['coverage/**', 'dist/**'],
    plugins: {
      '@typescript-eslint': tseslint.plugin,
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },
]);
