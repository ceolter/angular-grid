import rootESLint from '../../eslint.config.mjs';

export default [
    ...rootESLint,
    {
        ignores: ['dist/'],
    },
    {
        rules: {
            '@typescript-eslint/no-explicit-any': 'off',
            "no-empty": "warn",
            "prefer-const": "warn",
            "no-undef": "warn",
            "no-useless-escape": "warn",
            "no-extra-boolean-cast": "warn",
            '@typescript-eslint/no-unused-vars': 'warn',
            "@typescript-eslint/ban-types": "warn",
            "@typescript-eslint/no-var-requires": "warn",
        },
    },
];
