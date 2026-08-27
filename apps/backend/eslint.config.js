const nodeConfig = require('@aabha/eslint-config/node');

module.exports = [
  ...nodeConfig,
  {
    ignores: ['dist/**', 'node_modules/**', 'prisma/generated/**', '.pgdata/**'],
  },
];
