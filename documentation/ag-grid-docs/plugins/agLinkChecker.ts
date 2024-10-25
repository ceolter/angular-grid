import type { AstroIntegration } from 'astro';
import fs, { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

type Options = {
    include: boolean;
};

const IGNORED_PATHS = ['/archive'];

const findAllFiles = (dir: string): string[] => {
    const results: string[] = [];
    const files = readdirSync(dir, { recursive: true });
    files.forEach((file) => {
        results.push(file);
    });
    return results;
};

const filePathToUrl = (filePath: string) => {
    return `/${filePath.replace('index.html', '')}`;
};

const filePathsString = (filePaths: Set<string>): string => {
    const pageNames = Array.from(filePaths).map((filePath) => {
        const filePathParts = filePath.split('/');
        if (filePathParts.at(-1) === 'index.html') {
            filePathParts.pop();
        }
        // Take page name from path
        // eg, javascript-data-grid/grid-options/index.html
        if (filePathParts.length > 1 && filePathParts[0].match(/.*-data-grid/)) {
            filePathParts.shift();
        }
        return filePathParts.join('/');
    });

    return pageNames.join(', ');
};

const checkLinks = async (dir: string, files: string[]) => {
    const anchors = new Set<string>();
    const linksToValidate: Record<string, { filePaths: Set<string> }> = {};

    for (let i = 0; i < files.length; i++) {
        const filePath = files[i];
        if (!filePath.endsWith('index.html') || filePath.startsWith('example')) {
            // don't search non-html files, or example files.
            continue;
        }

        const anchorTags: string[] = [];

        // uses a stream as ingesting the entire file was causing memory crashes.
        const fileStream = fs.createReadStream(join(dir, filePath));
        await new Promise<void>((resolve) => {
            fileStream.on('readable', function () {
                let prev;
                let active = false;
                let str = '';
                let chunk;
                while (null !== (chunk = fileStream.read(16384))) {
                    const strChunk = chunk.toString();
                    for (let i = 0; i < strChunk.length; i++) {
                        const chr = strChunk[i];
                        if (!prev || prev === '<') {
                            if (chr === 'a') {
                                active = true;
                            }
                        } else if (active && chr === '>') {
                            active = false;
                            anchorTags.push(str);
                            str = '';
                        }

                        if (active) {
                            str += chr;

                            if (str.length >= 2 && !str.startsWith('a ')) {
                                active = false;
                                str = '';
                            }
                        }

                        prev = chr;
                    }
                }
            });

            fileStream.on('end', () => {
                resolve();
            });
        });
        fileStream.close();

        anchorTags.forEach((tag) => {
            const regex = /.*href="(.*?)".*/g;
            const match = regex.exec(tag);
            if (match) {
                const href = match[1];
                if (href.includes('?')) {
                    // ignore links with queries.
                    return;
                } else if (href.includes('#reference-')) {
                    // ignore API references, as it is rendered client side
                    return;
                }

                if (href.startsWith('#')) {
                    const thisFileUrl = filePathToUrl(filePath);
                    const thisHash = href;
                    anchors.add(`${thisFileUrl}${thisHash}`);
                } else if (href.startsWith('/')) {
                    const filePaths = linksToValidate[href]?.filePaths ?? new Set();
                    filePaths.add(filePath);

                    linksToValidate[href] = {
                        filePaths,
                    };
                }
            }
        });
    }

    const errors: string[] = [];
    // validate the unchecked links
    Object.entries(linksToValidate).forEach(([link, { filePaths }]) => {
        if (IGNORED_PATHS.includes(link)) return;

        const originalLink = link;
        if (link.startsWith('/')) link = link.slice(1);

        if (!link.includes('#')) {
            // if this is a file, do direct lookup in files list
            const fileExtRegex = /\.[a-zA-Z]+$/;
            if (fileExtRegex.test(link)) {
                if (!files.includes(link)) {
                    errors.push(`File link to ${link} does not exist.`);
                }
                return;
            }

            // if this is a directory, check for index.html
            const dirHtml = `${!link || link.endsWith('/') ? link : `${link}/`}index.html`;
            if (files.includes(dirHtml)) {
                return;
            }

            // might be a html file itself...
            if (files.includes(`${link.endsWith('/') ? link.slice(0, -1) : link}.html`)) {
                return;
            }

            errors.push(`Link to ${link} could not be resolved (${filePathsString(filePaths)}).`);
            return;
        } else {
            // check if the hash exists in the file
            if (!anchors.has(originalLink)) {
                errors.push(`Link to ${originalLink} could not be resolved in (${filePathsString(filePaths)}).`);
            }
        }
    });

    if (errors.length) {
        throw new Error(`
            Invalid links found, please fix the following issues:
            ${errors.join('\n')}
        `);
    } else {
        // eslint-disable-next-line no-console
        console.log('Link checker completed with no issues.');
    }
};

export default function createPlugin(options: Options): AstroIntegration {
    return {
        name: 'ag-link-test',
        hooks: {
            'astro:build:done': async ({ dir, logger }) => {
                if (!options.include) {
                    logger.info('Link checking disabled, skipping');
                    return;
                }

                const destDir = fileURLToPath(dir.href);
                const files = findAllFiles(destDir);
                await checkLinks(destDir, files);
            },
        },
    };
}
