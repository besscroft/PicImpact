import nextConfig from 'eslint-config-next'
import nextCoreWebVitals from 'eslint-config-next/core-web-vitals'
import nextTypescript from 'eslint-config-next/typescript'
import prettier from 'eslint-config-prettier'

const eslintConfig = [
  ...nextConfig,
  ...nextCoreWebVitals,
  ...nextTypescript,
  prettier,
  {
    rules: {
      'react/no-unescaped-entities': 'off',
      '@next/next/no-page-custom-font': 'off',
      'quotes': ['error', 'single'],
      '@typescript-eslint/no-explicit-any': 'warn',
      'no-multiple-empty-lines': ['error', { 'max': 1 }],
      'semi': ['error', 'never'],
      'no-unused-vars': 'warn',
    },
  },
]

export default eslintConfig
