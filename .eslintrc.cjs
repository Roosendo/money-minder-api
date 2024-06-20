/** @type {import('eslint').Linter.Config} */
module.exports = {
  extends: ['ts-standard'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    tsconfigRootDir: __dirname,
    sourceType: 'module',
    ecmaVersion: 'latest'
  },
  overrides: [
    {
      files: ['*.ts'],
      parserOptions: {
        parser: '@typescript-eslint/parser'
      }
    }
  ]
}
