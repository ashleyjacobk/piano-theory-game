import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'node_modules']),
  // Frontend Environment Configuration
  {
    files: ['src/**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: {
        ...globals.browser,
      },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      "react-hooks/set-state-in-effect": "off",
      "no-unused-vars": ["warn", { "varsIgnorePattern": "^(React|_)$", "argsIgnorePattern": "^_" }],
      "no-useless-assignment": "off",
    },
  },
  // Backend Environment Configuration (Node/CommonJS)
  {
    files: ['backend/**/*.js'],
    extends: [
      js.configs.recommended,
    ],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    rules: {
      "no-unused-vars": ["warn", { "varsIgnorePattern": "^(React|_)$", "argsIgnorePattern": "^_" }],
      "no-empty": "off",
      "no-useless-assignment": "off",
    },
  },
])
