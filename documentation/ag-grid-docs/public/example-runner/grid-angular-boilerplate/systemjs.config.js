(function (global) {
    var ANGULAR_VERSION = '^17';
    window.ENABLE_PROD_MODE = true;

    System.config({
        // DEMO ONLY! REAL CODE SHOULD NOT TRANSPILE IN THE BROWSER
        transpiler: 'ts',
        typescriptOptions: {
            target: 'es2020',
            emitDecoratorMetadata: true,
            experimentalDecorators: true,
        },
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
            '@angular/compiler': 'npm:@angular/compiler@' + ANGULAR_VERSION + '/fesm2022/compiler.mjs',
            '@angular/platform-browser-dynamic':
                'npm:@angular/platform-browser-dynamic@' + ANGULAR_VERSION + '/fesm2022/platform-browser-dynamic.mjs',

            '@angular/core': 'npm:@angular/core@' + ANGULAR_VERSION + '/fesm2022/core.mjs',
            '@angular/core/primitives/signals':
                'npm:@angular/core@' + ANGULAR_VERSION + '/fesm2022/primitives/signals.mjs',
            '@angular/core/primitives/event-dispatch':
                'npm:@angular/core@' + ANGULAR_VERSION + '/fesm2022/primitives/event-dispatch.mjs',
            '@angular/common': 'npm:@angular/common@' + ANGULAR_VERSION + '/fesm2022/common.mjs',
            '@angular/common/http': 'npm:@angular/common@' + ANGULAR_VERSION + '/fesm2022/http.mjs',

            '@angular/platform-browser':
                'npm:@angular/platform-browser@' + ANGULAR_VERSION + '/fesm2022/platform-browser.mjs',
            '@angular/platform-browser/animations':
                'npm:@angular/platform-browser@' + ANGULAR_VERSION + '/fesm2022/animations.mjs',

            '@angular/forms': 'npm:@angular/forms@' + ANGULAR_VERSION + '/fesm2022/forms.mjs',
            '@angular/animations': 'npm:@angular/animations@' + ANGULAR_VERSION + '/fesm2022/animations.mjs',
            '@angular/animations/browser': 'npm:@angular/animations@' + ANGULAR_VERSION + '/fesm2022/browser.mjs',

            rxjs: 'npm:rxjs@7.8.1/dist/bundles/rxjs.umd.min.js',
            'rxjs/operators': 'npm:rxjs@7.8.1/dist/bundles/rxjs.umd.min.js',

            css: (boilerplatePath.length === 0 ? `./` : `${boilerplatePath}/`) + 'css.js',

            ts: 'npm:plugin-typescript@8.0.0/lib/plugin.js',
            tslib: 'npm:tslib@2.3.1/tslib.js',
            typescript: 'npm:typescript@4.4/lib/typescript.min.js',

            // our app is within the app folder, appLocation comes from index.html
            app: appLocation,
            ...systemJsMap,
        },
        // packages tells the System loader how to load when no filename and/or no extension
        packages: {
            css: {}, // Stop css.js from defaulting to apps .ts extension
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
            'ag-grid-angular': {
                main: './fesm2022/ag-grid-angular.mjs',
                defaultExtension: 'mjs',
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
