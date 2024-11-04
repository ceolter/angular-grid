import type { InternalFramework } from '@ag-grid-types';
import type { Framework } from '@ag-grid-types';
import { SITE_BASE_URL } from '@constants';
import { pathJoin } from '@utils/pathJoin';

import { DOCS_FRAMEWORK_PATH_INDEX, DOCS_PAGE_NAME_PATH_INDEX } from '../constants';

export function getFrameworkPath(framework: Framework) {
    return `${framework}-data-grid`;
}

export function getFrameworkFromPath(path: string): Framework {
    const frameworkPath = path.split('/')[DOCS_FRAMEWORK_PATH_INDEX];
    const framework = frameworkPath.replace('-data-grid', '');
    return framework as Framework;
}

export function getPageNameFromPath(path: string): string {
    return path.split('/')[DOCS_PAGE_NAME_PATH_INDEX];
}

export const getExamplePageUrl = ({ framework, path }: { framework: Framework; path: string }) => {
    const frameworkPath = getFrameworkPath(framework);
    return pathJoin(SITE_BASE_URL, frameworkPath, path) + '/';
};

export interface UrlParams {
    internalFramework: InternalFramework;
    pageName: string;
    exampleName: string;
}

/**
 * Dynamic path where examples are
 */
export const getExampleUrl = ({ internalFramework, pageName, exampleName }: UrlParams) => {
    return pathJoin(SITE_BASE_URL, 'examples', pageName, exampleName, internalFramework);
};

/**
 * Dynamic path where docs example runner examples are
 */
export const getExampleRunnerExampleUrl = ({ internalFramework, pageName, exampleName }: UrlParams) => {
    const exampleUrl = getExampleUrl({
        internalFramework,
        pageName,
        exampleName,
    });
    return pathJoin(exampleUrl, 'example-runner');
};

/**
 * Dynamic path for Plunkr examples url
 */
export const getExamplePlunkrUrl = ({ internalFramework, pageName, exampleName }: UrlParams) => {
    const exampleUrl = getExampleUrl({
        internalFramework,
        pageName,
        exampleName,
    });
    return pathJoin(exampleUrl, 'plunkr');
};

/**
 * Dynamic path for Code Sandbox examples url
 */
export const getExampleCodeSandboxUrl = ({ internalFramework, pageName, exampleName }: UrlParams) => {
    const exampleUrl = getExampleUrl({
        internalFramework,
        pageName,
        exampleName,
    });
    return pathJoin(exampleUrl, 'codesandbox');
};

/**
 * Endpoint for all example files
 */
export const getExampleContentsUrl = ({ internalFramework, pageName, exampleName }: UrlParams) => {
    const exampleUrl = getExampleUrl({
        internalFramework,
        pageName,
        exampleName,
    });
    return pathJoin(exampleUrl, 'contents.json');
};

export interface ExampleFileUrlParams extends UrlParams {
    fileName: string;
}
/**
 * Dynamic path where example files are
 */
export const getExampleFileUrl = ({ internalFramework, pageName, exampleName, fileName }: ExampleFileUrlParams) => {
    const exampleUrl = getExampleUrl({
        internalFramework,
        pageName,
        exampleName,
    });
    return pathJoin(exampleUrl, fileName);
};

export const getGifStillImageUrl = ({ pageName, imagePath }: { pageName: string; imagePath: string }) => {
    const stillImagePath = imagePath.replace('.gif', '-still.png');
    return pathJoin(SITE_BASE_URL, 'docs', pageName, stillImagePath);
};
