import type { InternalFramework } from '@ag-grid-types';
import {
    type DocsPage,
    type InternalFrameworkExample,
    getContentRootFileUrl,
    getExampleRootFileUrl,
} from '@utils/pages';
import type { ImageMetadata } from 'astro';
import fs, { readFile, readdir } from 'fs/promises';
import path from 'path';

// NOTE: These imports can't be aliases because it is used by `astro.config.mjs`
// and ts alias paths don't work there
import { INTERNAL_FRAMEWORKS } from '../../../constants';
import { getIsDev } from '../../../utils/env';
import { getFolders } from '../../../utils/fs';
import { getGifStillImageUrl } from './urlPaths';

interface PageImages {
    imageSrc?: string;
    darkModeImageSrc?: string;
    gifStillImageSrc?: string;
    gifDarkModeStillImageSrc?: string;
}

function ignoreUnderscoreFiles(page: DocsPage) {
    const pageFolders = page.slug.split('/');
    const pageName = pageFolders[pageFolders.length - 1];
    return pageName && !pageName.startsWith('_');
}

export const getPagePath = ({ pageName }: { pageName: string }) => {
    const contentRoot = getContentRootFileUrl();
    const sourceExamplesPath = path.join(contentRoot.pathname, 'docs', pageName);

    return sourceExamplesPath;
};

export const getExamplesPath = ({ pageName }: { pageName: string }) => {
    const sourceExamplesPath = path.join(getPagePath({ pageName }), '_examples');

    return sourceExamplesPath;
};

export const getFolderPath = ({ pageName, exampleName }: { pageName: string; exampleName: string }) => {
    const examplesFolderPath = getExamplesPath({
        pageName,
    });
    const exampleFolderPath = path.join(examplesFolderPath, exampleName);

    return new URL(exampleFolderPath, import.meta.url);
};

export const getInternalFrameworkExamples = async ({
    pages,
}: {
    pages: DocsPage[];
}): Promise<InternalFrameworkExample[]> => {
    const examplePromises = pages.map(async (page) => {
        const pageName = page.slug;
        const docsExamplesPath = getExamplesPath({
            pageName,
        });
        const examples = await getFolders(docsExamplesPath);

        const exampleDirs = examples.flatMap(async (exampleName) => {
            //const exampleDir = existsSync(path.join(docsExamplesPath, exampleName, 'exampleConfig.json'));
            const exampleDir = await readdir(path.join(docsExamplesPath, exampleName));
            const hasExampleConfig = exampleDir.includes('exampleConfig.json');

            let supportedFrameworks: Set<InternalFramework> | undefined = undefined;
            if (hasExampleConfig) {
                const exampleConfig = await readFile(
                    path.join(docsExamplesPath, exampleName, 'exampleConfig.json'),
                    'utf-8'
                );
                const exampleConfigJson = JSON.parse(exampleConfig);
                supportedFrameworks = exampleConfigJson.supportedFrameworks
                    ? new Set(exampleConfigJson.supportedFrameworks)
                    : undefined;
            }

            return INTERNAL_FRAMEWORKS.map((internalFramework) => {
                return {
                    internalFramework,
                    pageName,
                    exampleName,
                    supportedFrameworks,
                };
            });
        });

        return (await Promise.all(exampleDirs)).flat();
    });
    const examples = (await Promise.all(examplePromises)).flat();
    return examples;
};

export const getPagesList = (pages: DocsPage[]) => {
    return pages.filter(ignoreUnderscoreFiles);
};

export const getAllExamplesFileList = async () => {
    const contentRoot = getExampleRootFileUrl();
    const pagesFolder = path.join(contentRoot.pathname, 'docs');
    const pages = await fs.readdir(pagesFolder);

    const examplesPromises = pages.map(async (pageName) => {
        const examplesFolder = path.join(pagesFolder, pageName, '_examples');
        const examples = await getFolders(examplesFolder);

        return examples.map((file) => {
            return path.join(examplesFolder, file);
        });
    });
    const exampleFolders = (await Promise.all(examplesPromises)).flat();

    const exampleFilesPromises = exampleFolders.map(async (exampleFolder) => {
        const exampleFiles = await fs.readdir(exampleFolder);
        return exampleFiles.map((exampleFile) => {
            return path.join(exampleFolder, exampleFile);
        });
    });
    const exampleFiles = (await Promise.all(exampleFilesPromises)).flat();

    return exampleFiles;
};

/**
 * Get image on docs page
 *
 * If a `-dark` suffixed image in `imagePath` exists, return the dark mode
 * image source.
 *
 * If the image is a gif, return the still image of the gif
 */
export const getPageImages = async ({
    pageName,
    imagePath,
}: {
    /**
     * Page name within `/src/content/docs`
     */
    pageName: string;
    /**
     * Image path relative to `/src/content/docs/[pageName]`
     */
    imagePath: string;
}): Promise<PageImages> => {
    // NOTE: Relative to this file
    const docsPath = '../../../content/docs/';
    const fullImagePath = path.join(docsPath, pageName, imagePath);

    // NOTE: Can't use variable in glob parameter. Need to use a string literal as it
    // is compiled before runtime. Should be the same as `docsPath` variable
    const images = import.meta.glob<{ default: ImageMetadata }>(
        '../../../content/docs/**/*.{jpeg,jpg,png,gif,svg,mp4}'
    );

    if (!images[fullImagePath]) {
        const errorMsg = `Page "${pageName}" image "${imagePath}" does not exist in glob: "${docsPath}**/*.{jpeg,jpg,png,gif,svg,mp4}" (fullImagePath = ${fullImagePath})`;
        if (getIsDev()) {
            // eslint-disable-next-line no-console
            console.error(errorMsg);

            return {};
        } else {
            throw new Error(errorMsg);
        }
    }

    const image = await images[fullImagePath]();
    const imageSrc = image.default.src || image.default;

    const splitName = fullImagePath.split('.');
    const extension = splitName.at(-1);
    const darkModeImagePath = imagePath.replace(`.${extension}`, `-dark.${extension}`);
    const fullDarkModeImagePath = path.join(docsPath, pageName, darkModeImagePath);
    const darkModeImage = images[fullDarkModeImagePath];
    const darkModeImageSrc = darkModeImage
        ? (await darkModeImage()).default.src || (await darkModeImage()).default
        : undefined;

    const gifImages: Partial<PageImages> = {};
    if (extension === 'gif') {
        gifImages.gifStillImageSrc = getGifStillImageUrl({ pageName, imagePath });

        if (darkModeImage) {
            gifImages.gifDarkModeStillImageSrc = getGifStillImageUrl({
                pageName,
                imagePath: darkModeImagePath,
            });
        }
    }

    return {
        imageSrc,
        darkModeImageSrc,
        ...gifImages,
    };
};
