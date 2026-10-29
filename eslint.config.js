const tseslint = require('typescript-eslint');

// 独立部署版：移除 @lark-apaas/fullstack-presets 的 ESLint 预设，
// 使用 typescript-eslint 基础推荐规则（宽松模式，兼容存量代码）。
module.exports = tseslint.config(
  {
    ignores: [
      'dist',
      'dist-server',
      'node_modules',
      'source_package',
      'coverage/**',
      'logs/**',
      'tmp/**',
      'temp/**',
      '.playwright-cli/**',
      '.agent/**',
      'client/src/api/gen',
      'client/src/components/business-ui/**',
      'client/src/pages/ExamplePage/**',
      'client/src/hooks/use-example.ts',
      'scripts/**',
      '**/*.d.ts',
      '**/*.js.map',
    ],
  },
  ...tseslint.configs.recommended,
  {
    files: ['client/**/*.{ts,tsx}', 'server/**/*.{ts,tsx}', 'shared/**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      'no-undef': 'off',
    },
  },
);
