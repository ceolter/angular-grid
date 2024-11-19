import rootESLint from '../../eslint.config.mjs';

export default [
    ...rootESLint,
    {
        languageOptions: {
            parserOptions: {
                // NOTE: Loading tsconfig.json references does not work, so
                // loading explicitly here
                project: ['./tsconfig.lib.json', 'tsconfig.umd.json', './tsconfig.spec.json'],
                tsconfigRootDir: import.meta.dirname,
            },
        },
        rules: {
            'no-fallthrough': 'error',
            'no-case-declarations': 'error',
            'no-prototype-builtins': 'error',
            'no-unexpected-multiline': 'error',
            'no-useless-escape': 'error',
            'prefer-spread': 'error',
            'no-irregular-whitespace': 'error',
            'prefer-const': ['error', { destructuring: 'all' }],
            'prefer-rest-params': 'error',
            '@typescript-eslint/ban-types': 'error',
            '@typescript-eslint/no-unused-vars': 'error',
            '@typescript-eslint/no-var-requires': 'error',
            '@typescript-eslint/prefer-as-const': 'error',
            '@typescript-eslint/ban-ts-comment': 'error',
            '@typescript-eslint/no-non-null-asserted-optional-chain': 'error',
            '@typescript-eslint/no-unnecessary-type-constraint': 'error',
            '@typescript-eslint/no-this-alias': 'off',
            '@typescript-eslint/no-for-in-array': 'error',
            'no-restricted-syntax': ['error', 'ForInStatement'],
            'no-restricted-imports': [
                'error',
                {
                    name: 'ag-charts-community',
                    message: 'There should be no direct imports of ag-charts-community',
                },
                {
                    name: 'ag-charts-enterprise',
                    message: 'There should be no direct imports of ag-charts-enterprise',
                },
            ],
        },
    },
    {
        ignores: ['webpack.config.js', 'jest.*.js', 'eslint.config.mjs', 'jest.jsdom-env.cjs', 'test-utils/mock.ts'],
    },
];
