module.exports = {
  env: {
    browser: true,
    es2020: true,
    node: true,
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  plugins: [
    '@typescript-eslint',
  ],
  rules: {
    // TypeScript specific rules
    '@typescript-eslint/no-unused-vars': 'off', // Allow unused vars for WordPress patterns
    '@typescript-eslint/no-explicit-any': 'off', // Allow any types for WordPress compatibility
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-non-null-assertion': 'off', // Allow for WordPress patterns
    
    // General rules
    'no-console': 'off', // Allow console for debugging
    'no-debugger': 'error',
    'prefer-const': 'off', // Allow let for WordPress patterns
    'no-var': 'error',
    
    // Allow unused variables with underscore prefix
    'no-unused-vars': 'off',
  },
};
