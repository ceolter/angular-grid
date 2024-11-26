import rootESLint from '../../eslint.config.mjs';

export default [
    ...rootESLint,
    {
        ignores: ['.angular/'],
    },
    {
        rules: {
            '@typescript-eslint/ban-types': 'error',
            '@typescript-eslint/no-this-alias': 'off',
            '@typescript-eslint/no-var-requires': 'error',
            '@typescript-eslint/no-unused-vars': 'error',
            'no-console': 'error',
        },
    },
    {
        files: ['projects/ag-grid-angular/src/**'],
        rules: {
            '@typescript-eslint/consistent-type-imports': 'off',
        },
    },
];
