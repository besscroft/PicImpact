import { dirname } from 'path'
import { fileURLToPath } from 'url'
import { FlatCompat } from '@eslint/eslintrc'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const compat = new FlatCompat({
  baseDirectory: __dirname,
})

const eslintConfig = [
  ...compat.config({
    extends: ['next', 'prettier', 'next/core-web-vitals', 'next/typescript'],
    rules: {
      'react/no-unescaped-entities': 'off',
      '@next/next/no-page-custom-font': 'off',
      'quotes': ['error', 'single'],
      '@typescript-eslint/no-explicit-any': 'warn',
      'no-multiple-empty-lines': ['error', { 'max': 1 }],
      'semi': ['error', 'never'],
      'no-unused-vars': 'warn',
    },
  }),
]

export default eslintConfig
