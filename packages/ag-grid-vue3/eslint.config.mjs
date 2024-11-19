import rootESLint from '../../eslint.config.mjs';

export default [
    ...rootESLint,
    {
        rules: {
            'prefer-rest-params': 'error',
            'no-extra-boolean-cast': 'error',
            '@typescript-eslint/no-unused-vars': 'error',
            '@typescript-eslint/ban-types': 'error',
            '@typescript-eslint/no-this-alias': 'off',
        },
    },
    {
        ignores: ['updateGridAndColumnProperties.cjs', 'eslint.config.mjs', 'vite.config.d.ts'],
    },
];
