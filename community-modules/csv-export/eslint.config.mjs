import rootESLint from '../../eslint.config.mjs';

export default [
    ...rootESLint,
    {
        rules: {
            'prefer-const': 'warn',
            '@typescript-eslint/no-unused-vars': 'warn',
            '@typescript-eslint/no-var-requires': 'warn',
            '@typescript-eslint/ban-ts-comment': 'warn',
        },
    },
];
