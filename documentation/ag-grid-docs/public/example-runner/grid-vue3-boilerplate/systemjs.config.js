(function (global) {
    System.config({
        // DEMO ONLY! REAL CODE SHOULD NOT TRANSPILE IN THE BROWSER
        transpiler: 'ts',
        typescriptOptions: {
            target: 'es2020',
        },
        meta: {
            typescript: {
                exports: 'ts',
            },
            '*.css': { loader: 'css' },
        },
        defaultExtension: 'js',
        paths: {
            // paths serve as alias
            'npm:': 'https://cdn.jsdelivr.net/npm/',
            ...systemJsPaths,
        },
        map: {
            css: (boilerplatePath.length === 0 ? `./` : `${boilerplatePath}/`) + 'css.js',

            ts: 'npm:plugin-typescript@8.0.0/lib/plugin.js',
            tslib: 'npm:tslib@2.3.1/tslib.js',
            typescript: 'npm:typescript@5.4.5/lib/typescript.min.js',

            vue: 'npm:vue@3.5.0/dist/vue.esm-browser.js',
            '@vue/reactivity': 'npm:@vue/reactivity@3.0.0/dist/reactivity.esm-browser.prod.js',

            // vue class component
            'vue-class-component': 'npm:vue-class-component@^8.0.0-beta.3/dist/vue-class-component.cjs.js',

            app: appLocation,
            // systemJsMap comes from index.html
            ...systemJsMap,
        },
        packages: {
            vue: {
                defaultExtension: 'js',
            },
            'vue-class-component': {
                defaultExtension: 'js',
            },
            'vue-property-decorator': {
                defaultExtension: 'js',
            },
            app: {
                defaultExtension: 'js',
            },
            'ag-grid-community': {
                main: './dist/package/main.cjs.js',
                defaultExtension: 'js',
                format: 'cjs',
            },
            'ag-grid-enterprise': {
                main: './dist/package/main.cjs.js',
                defaultExtension: 'js',
                format: 'cjs',
            },
            'ag-grid-vue3': {
                main: './dist/main.umd.js',
                defaultExtension: 'js',
                format: 'cjs',
            },
            'ag-charts-types': {
                defaultExtension: 'js',
                format: 'cjs',
            },
            'ag-charts-community': {
                defaultExtension: 'js',
                format: 'cjs',
            },
            'ag-charts-enterprise': {
                defaultExtension: 'js',
                format: 'cjs',
            },
            '@ag-grid-community/locale': {
                format: 'cjs',
            },
        },
    });
})(this);

window.addEventListener('error', (e) => {
    console.error('ERROR', e.message, e.filename);
});
