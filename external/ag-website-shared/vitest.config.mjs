import { getViteConfig } from 'astro/config';
import path from 'node:path';

import packageJson from '../../package.json';

const GRID_PATH_PREFIX = '../../documentation/ag-grid-docs';
const CHARTS_PATH_PREFIX = '../../packages/ag-charts-website';

function resolvePath(srcPath) {
    const pathPrefix = packageJson.name === 'ag-grid' ? GRID_PATH_PREFIX : CHARTS_PATH_PREFIX;
    return path.resolve(__dirname, pathPrefix, srcPath);
}

export default getViteConfig({
    root: __dirname,
    cacheDir: '../../node_modules/.vite/test',
    test: {
        globals: true,
        cacheDir: '../../node_modules/.vitest',
        environment: 'node',
        include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
        reporters: ['default'],
        coverage: { reportsDirectory: '../../coverage/ag-website-shared', provider: 'v8' },
    },
    resolve: {
        alias: {
            // Matches `tsconfig.json`
            '@astro': resolvePath('src/astro'),
            '@components': resolvePath('src/components'),
            '@design-system': resolvePath('src/design-system'),
            '@images': resolvePath('src/images'),
            '@layouts': resolvePath('src/layouts'),
            '@stores': resolvePath('src/stores'),
            '@ag-grid-types': resolvePath('src/types/ag-grid.d.ts'),
            '@utils': resolvePath('src/utils'),
            '@constants': resolvePath('src/constants.ts'),
        },
    },
});
