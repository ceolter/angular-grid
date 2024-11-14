(function (global) {
    System.config({
        // DEMO ONLY! REAL CODE SHOULD NOT TRANSPILE IN THE BROWSER
        transpiler: 'ts',
        typescriptOptions: {},
        meta: {
            typescript: {
                exports: 'ts',
            },
            '*.css': { loader: 'css' },
        },
        paths: {
            // paths serve as alias
            'npm:': 'https://cdn.jsdelivr.net/npm/',
            ...systemJsPaths,
        },
        // map tells the System loader where to look for things
        map: {
            css: (boilerplatePath.length === 0 ? `./` : `${boilerplatePath}/`) + 'css.js',

            ts: 'npm:plugin-typescript@8.0.0/lib/plugin.js',
            tslib: 'npm:tslib@2.3.1/tslib.js',
            typescript: 'npm:typescript@5.4.5/lib/typescript.min.js',

            // appLocation comes from index.html
            app: appLocation,
            ...systemJsMap,
        },
        // packages tells the System loader how to load when no filename and/or no extension
        packages: {
            css: {},
            app: {
                main: './main.ts',
                defaultExtension: 'ts',
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
