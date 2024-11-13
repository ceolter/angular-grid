import { getIsDev } from '@utils/env';
import { getExampleRootFileUrl } from '@utils/pages';
import fs from 'node:fs/promises';
import path from 'node:path';

import type { InternalFramework } from './types';

type GeneratedExampleParams = ExampleParams & DocsExampleParams;

type ExampleParams = {
    exampleName: string;
    ignoreDarkMode?: boolean;
};

type DocsExampleParams = {
    type: 'docs';
    framework: InternalFramework;
    pageName: string;
};

const getFolderPath = (params: GeneratedExampleParams) => {
    const { exampleName } = params;

    const contentRoot = getExampleRootFileUrl();

    const result = [contentRoot.pathname];
    if (params.type === 'docs') {
        result.push(params.type, params.pageName, '_examples', exampleName, params.framework);
    }

    return path.join(...result);
};

const getContentJsonPath = (params: GeneratedExampleParams) => {
    const folderPath = getFolderPath(params);

    return path.join(folderPath, 'contents.json');
};

type GeneratedContents = {
    entryFileName: string;
    files: Record<string, string>;
    scriptFiles: string[];
    boilerPlateFiles?: Record<string, string>;
    extras?: string[];
};

const cacheKeys: Record<string, object> = {};
const cacheValues = new WeakMap<object, GeneratedContents>();

const readContentJson = async (params: GeneratedExampleParams) => {
    const useCache = !getIsDev();
    const jsonPath = getContentJsonPath(params);

    let result;

    const cacheKey = cacheKeys[jsonPath] ?? { jsonPath };
    if (useCache) {
        if (cacheValues.has(cacheKey)) {
            result = cacheValues.get(cacheKey);
        }
    }

    if (!result) {
        const buffer = await fs.readFile(jsonPath);
        result = JSON.parse(buffer.toString('utf-8')) as GeneratedContents;
    }

    if (params.framework === 'angular') {
        result.files['main.ts'] = result.boilerPlateFiles!['main.ts'];
    }

    if (useCache) {
        cacheKeys[jsonPath] = cacheKey;
        cacheValues.set(cacheKey, result);
    }

    return result;
};

export const getGeneratedContentsFileList = async (params: GeneratedExampleParams) => {
    const contents = await readContentJson(params);

    return Object.keys(contents.files);
};

export const getGeneratedContents = async (params: GeneratedExampleParams) => {
    return readContentJson(params);
};
