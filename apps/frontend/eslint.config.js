const reactConfig = require('@aabha/eslint-config/react');

module.exports = [
  ...reactConfig,
  {
    ignores: ['.next/**', 'node_modules/**', 'next-env.d.ts'],
  },
];
