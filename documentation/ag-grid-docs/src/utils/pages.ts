import type { InternalFramework, Library } from '@ag-grid-types';
import type { ImageMetadata } from 'astro';
import type { CollectionEntry } from 'astro:content';
import fs from 'fs/promises';
import * as glob from 'glob';
import { readFileSync } from 'node:fs';

import { SITE_BASE_URL, USE_PUBLISHED_PACKAGES } from '../constants';
import { type GlobConfig, createFilePathFinder } from './createFilePathFinder';
import { pathJoin } from './pathJoin';
import { urlWithBaseUrl } from './urlWithBaseUrl';

export type DocsPage =
    | CollectionEntry<'docs'>
    | {
          slug: string;
      };

export interface InternalFrameworkExample {
    internalFramework: InternalFramework;
    pageName: string;
    exampleName: string;
    supportedFrameworks: Set<InternalFramework> | undefined;
}

export interface ExtraFileRoute {
    params: {
        filePath: string;
    };
    props: {
        fullFilePath: string;
    };
}

/**
 * Mapping for extra files, from route to file path
 *
 * NOTE:
 *  * File path is after `getRootUrl()`
 *  * Remember to add references to `ag-grid-docs/project.json` > `targets.build.inputs`
 *    if the nx build does not already account for the files. Otherwise, the website may not
 *    rebuild if there are changes in the mapped files
 *
 */
export const FILES_PATH_MAP: Record<string, string | GlobConfig> = {
    // Code doc reference files
    // NOTE: Manually specified, so it can be referenced by key
    'reference/column-options.AUTO.json': 'dist/documentation/reference/column-options.AUTO.json',
    'reference/column.AUTO.json': 'dist/documentation/reference/column.AUTO.json',
    'reference/columnGroup.AUTO.json': 'dist/documentation/reference/columnGroup.AUTO.json',
    'reference/providedColumnGroup.AUTO.json': 'dist/documentation/reference/providedColumnGroup.AUTO.json',
    'reference/doc-interfaces.AUTO.json': 'dist/documentation/reference/doc-interfaces.AUTO.json',
    'reference/grid-api.AUTO.json': 'dist/documentation/reference/grid-api.AUTO.json',
    'reference/grid-options.AUTO.json': 'dist/documentation/reference/grid-options.AUTO.json',
    'reference/interfaces.AUTO.json': 'dist/documentation/reference/interfaces.AUTO.json',
    'reference/row-node.AUTO.json': 'dist/documentation/reference/row-node.AUTO.json',

    // Community modules
    '@ag-grid-community/locale/dist/**': 'community-modules/locale/dist/**/*.{cjs,js,map}',

    // packages
    'ag-grid-community/styles/**': 'packages/ag-grid-community/styles/**/*.css',
    'ag-grid-community/dist/**': 'packages/ag-grid-community/dist/**/*.{cjs,js,map}',
    'ag-grid-enterprise/styles/**': 'packages/ag-grid-enterprise/styles/**/*.css',
    'ag-grid-enterprise/dist/**': 'packages/ag-grid-enterprise/dist/**/*.{cjs,js,map}',

    // Charts modules
    'ag-charts-types/dist/**': 'node_modules/ag-charts-types/dist/**/*.{cjs,js,map}',
    'ag-charts-community/modules': 'node_modules/ag-charts-community/dist/package/main-modules.cjs.js',
    'ag-charts-community/dist/**': 'node_modules/ag-charts-community/dist/**/*.{cjs,js,map}',
    'ag-charts-enterprise/modules': 'node_modules/ag-charts-enterprise/dist/package/main-modules.cjs.js',
    'ag-charts-enterprise/dist/**': 'node_modules/ag-charts-enterprise/dist/**/*.{cjs,js,map}',

    // Framework libraries
    'ag-grid-react/dist/**': 'packages/ag-grid-react/dist/**/*.{cjs,mjs,js,map}',
    'ag-grid-react/src/**': 'packages/ag-grid-react/src/**/*.{tsx,ts}',
    'ag-grid-angular/fesm2022/ag-grid-angular.mjs':
        'packages/ag-grid-angular/dist/ag-grid-angular/fesm2022/ag-grid-angular.mjs',
    'ag-grid-vue3/dist/**': 'packages/ag-grid-vue3/dist/**/*.{cjs,mjs,js,map}',
};

type FileKey = keyof typeof FILES_PATH_MAP;

export function getJsonFile(fileKey: FileKey) {
    const filePath = FILES_PATH_MAP[fileKey] as string;

    if (!filePath) {
        return {};
    }

    const file = pathJoin(getRootUrl().pathname, filePath);
    const fileContents = readFileSync(file).toString();
    return fileContents ? JSON.parse(fileContents) : {};
}

/**
 * The root url where the monorepo exists
 */
export const getRootUrl = (): URL => {
    // Relative to the folder of this file
    const root = '../../../../';
    return new URL(root, import.meta.url);
};

/**
 *  TODO: Figure this out when working on build
 */
export const getExampleRootFileUrl = (): URL => {
    const root = getRootUrl().pathname;
    return new URL(`${root}/dist/generated-examples/ag-grid-docs/`, import.meta.url);
};

/**
 * The `ag-charts-website` root url where the monorepo exists
 */
const getWebsiteRootUrl = (): URL => {
    // Relative to the folder of this file
    const root = '../../';
    return new URL(root, import.meta.url);
};

export const getContentRootFileUrl = (): URL => {
    const websiteRoot = getWebsiteRootUrl();
    const contentRoot = pathJoin(websiteRoot, 'src/content');
    return new URL(contentRoot, import.meta.url);
};

export const getDebugFolderUrl = (): URL => {
    const websiteRoot = getWebsiteRootUrl();
    const contentRoot = pathJoin(websiteRoot, 'src/pages/debug');
    return new URL(contentRoot, import.meta.url);
};

export const getDebugPageUrls = async ({
    allFiles,
}: {
    /**
     * Get all files, by default only returns `.astro` pages
     */
    allFiles?: boolean;
} = {}) => {
    const debugFolder = getDebugFolderUrl();
    const pages = await fs.readdir(debugFolder);
    const filteredPages = allFiles
        ? pages
        : pages.filter((pageName) => {
              return pageName.match(/\.astro$/);
          });

    const pagePathPromises = filteredPages
        .map(async (pageName) => {
            const pageNameWithoutExt = pageName.replace(/\.[^.]+$/, '');
            return urlWithBaseUrl(pathJoin('/debug', pageNameWithoutExt));
        })
        .flat();

    return Promise.all(pagePathPromises);
};

export const isUsingPublishedPackages = () => USE_PUBLISHED_PACKAGES === true;

/**
 * Get Dev File URL for referencing on the front end
 */
export const getDevFileList = () => {
    const distFolder = getRootUrl();
    return Object.values(FILES_PATH_MAP).map((file) => {
        return pathJoin(distFolder.pathname, file as string);
    });
};

export function getExtraFiles(): ExtraFileRoute[] {
    const result = [];

    for (const [filePath, sourceFilePath] of Object.entries(FILES_PATH_MAP)) {
        if (typeof sourceFilePath === 'string') {
            const fullFilePath = pathJoin(getRootUrl().pathname, sourceFilePath);
            if (fullFilePath.includes('**')) {
                const pathPrefix = filePath.substring(0, filePath.indexOf('**'));
                const sourcePrefix = fullFilePath.substring(0, fullFilePath.indexOf('**'));

                const matches = glob.sync(fullFilePath);
                if (matches.length === 0) {
                    throw new Error(`No files match the glob ${fullFilePath}`);
                }

                for (const globFile of matches) {
                    const relativeFile = globFile.replace(sourcePrefix, '');

                    result.push({
                        params: { filePath: `${pathPrefix}${relativeFile}` },
                        props: { fullFilePath: globFile },
                    });
                }
                continue;
            }

            result.push({ params: { filePath }, props: { fullFilePath } });
        } else if (typeof sourceFilePath === 'object') {
            const { globPattern, getFilePath } = createFilePathFinder({
                baseUrl: getRootUrl().pathname,
                globConfig: sourceFilePath as GlobConfig,
            });

            const matches = glob.sync(globPattern);
            if (matches.length === 0) {
                throw new Error(`No files match the glob ${globPattern} for config ${JSON.stringify(sourceFilePath)}`);
            }

            for (const globFile of matches) {
                const filePath = getFilePath(globFile);

                result.push({
                    params: { filePath },
                    props: { fullFilePath: globFile },
                });
            }
        }
    }

    return result;
}

/**
 * Get url of example boiler plate files
 */
export const getBoilerPlateUrl = ({
    library,
    internalFramework,
}: {
    library: Library;
    internalFramework: InternalFramework;
}) => {
    let boilerPlateFramework;
    switch (internalFramework) {
        case 'reactFunctional':
            boilerPlateFramework = 'react';
            break;
        case 'reactFunctionalTs':
            boilerPlateFramework = 'react-ts';
            break;
        default:
            boilerPlateFramework = internalFramework;
            break;
    }

    const boilerplatePath = pathJoin(
        SITE_BASE_URL,
        '/example-runner',
        `${library}-${boilerPlateFramework}-boilerplate`
    );

    return boilerplatePath;
};

export function getDocsGifs() {
    const gifsGlob = import.meta.glob<{ default: ImageMetadata }>('../content/docs/**/*.gif');
    const docsGifs = Object.keys(gifsGlob).map((fullPath) => {
        return fullPath.replace('../content/docs/', '');
    });

    return docsGifs;
}
