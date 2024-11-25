import rootESLint from '../../eslint.config.mjs';

export default [
    ...rootESLint,
    {
        rules: {
            'no-empty': 'error',
            'prefer-const': ['error', { destructuring: 'all' }],
            'no-useless-escape': 'error',
            'no-extra-boolean-cast': 'error',
            '@typescript-eslint/no-unused-vars': 'error',
            '@typescript-eslint/ban-types': 'error',
            '@typescript-eslint/no-var-requires': 'error',
            'no-console': 'error',
        },
    },
];
