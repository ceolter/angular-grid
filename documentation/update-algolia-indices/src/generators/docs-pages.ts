import fs from 'fs';
import { JSDOM, VirtualConsole } from 'jsdom';

import type { AlgoliaRecord } from '../types/algolia';
import { API_FILE_PATH, DIST_DIR, MENU_FILE_PATH } from '../utils/constants';
import { logWarning } from '../utils/output';

const virtualConsole = new VirtualConsole();
// this ignores console errors, this is because JSDOM does not have comprehensive
// css support, and crashes on some pages
virtualConsole.on('error', () => {});

let pageRank = 0;

export const getAllDocPages = (): FlattenedMenuItem[] => {
    const docsMenu = getDocsMenuData();
    const apiMenu = getApiMenuData();
    pageRank = 0;

    const flattenedDocMenuItems = getFlattenedMenuItems(docsMenu.sections);
    const flattenedApiMenuItems = getFlattenedMenuItems(apiMenu.sections);

    return [...flattenedApiMenuItems, ...flattenedDocMenuItems];
};

export const parseDocPage = async (item: FlattenedMenuItem) => {
    const filePath = `${DIST_DIR}${item.path}/index.html`;

    if (!fs.existsSync(filePath)) {
        return null;
    }
    const { title, rank, breadcrumb, path } = item;
    const records: AlgoliaRecord[] = [];
    const dom = await JSDOM.fromFile(filePath, { virtualConsole });

    const titleTag = dom.window.document.querySelector('h1');
    const pageTitle = extractTitle({ dom, titleTag });
    if (pageTitle !== title) {
        logWarning({ pageTitle, title, filePath, message: 'Title mismatched to navbar.' });
    }

    const container = dom.window.document.querySelector('#doc-content article')?.firstChild;
    if (!container) {
        logWarning({ title, filePath, message: 'No content found.' });
        return null;
    }

    let heading: string | undefined = undefined;
    let subHeading: string | undefined = undefined;
    let text = '';
    let position = 0;
    let metaTag: string | undefined = undefined;

    const createPreviousRecord = () => {
        // Because content for the header comes after the header
        // we need to create a record for the previous section
        // after we find the next one.
        const snakeCaseHeading = (subHeading ?? heading)?.replace(/\s+/g, '-').toLowerCase();
        const hashPath = heading ? `${path}#${snakeCaseHeading}` : path;

        records.push({
            source: 'docs',

            objectID: hashPath,
            breadcrumb,
            title,
            heading,
            subHeading,
            path: hashPath,
            text: cleanContents(text).slice(0, 250), // this is only used for display not search, limit chars to reduce load on algolia
            rank,
            positionInPage: position++,
            metaTag,
        });
    };

    const recursivelyParseContent = (container: Element | null) => {
        for (let currentTag = container; currentTag != null; currentTag = currentTag.nextElementSibling) {
            try {
                if (['style', 'pre'].includes(currentTag.nodeName.toLowerCase())) {
                    // ignore this tag
                    continue;
                }

                switch (currentTag.nodeName) {
                    // split records based on H2 and H3 tags
                    case 'H2': {
                        createPreviousRecord();
                        heading = currentTag.textContent?.trim();
                        subHeading = undefined;
                        text = '';
                        break;
                    }

                    case 'H3':
                    case 'H4': {
                        createPreviousRecord();
                        subHeading = currentTag.textContent?.trim();
                        text = '';
                        break;
                    }

                    case 'DIV': {
                        createPreviousRecord();
                        if (currentTag.getAttribute('data-meta')) {
                            metaTag = JSON.parse(currentTag.getAttribute('data-meta')?.replaceAll('&quot;', '"') ?? '');
                        }
                        // process content inside div containers
                        recursivelyParseContent(currentTag.firstChild as Element | null);
                        break;
                    }

                    default: {
                        const contents = currentTag.innerHTML || currentTag.textContent;

                        if (currentTag.nodeName === 'A' && contents?.includes('Example: <!-- -->')) {
                            // exclude example runner titles
                            continue;
                        }

                        // append all HTML content
                        text += `\n${currentTag.innerHTML || currentTag.textContent}`;
                    }
                }
            } catch (e) {
                console.error(`Unable to parse content, got stuck at element: `, currentTag, e);
            }
        }
    };
    recursivelyParseContent(container as Element);
    createPreviousRecord();

    return records;
};

interface MenuItem {
    title: string;
    path?: string;
    children?: MenuItem[];
}

const getDocsMenuData = () => {
    const file = fs.readFileSync(MENU_FILE_PATH, 'utf-8');
    const docsMenuData = JSON.parse(file);

    return docsMenuData;
};

const getApiMenuData = () => {
    const file = fs.readFileSync(API_FILE_PATH, 'utf-8');
    const apiMenuData = JSON.parse(file);

    return apiMenuData;
};

export interface FlattenedMenuItem {
    title: string;
    path: string;
    rank: number;
    breadcrumb: string;
}

const getFlattenedMenuItems = (
    menuItems: MenuItem[],
    result: FlattenedMenuItem[] = [],
    prefix?: string
): FlattenedMenuItem[] => {
    menuItems.forEach((item) => {
        if (item.path) {
            result.push({
                title: item.title,
                path: item.path,
                rank: pageRank++,
                breadcrumb: prefix ? `${prefix} > ${item.title}` : item.title,
            });
        }
        if (item.children) {
            getFlattenedMenuItems(item.children, result, prefix ? `${prefix} > ${item.title}` : item.title);
        }
    });
    return result;
};

const disallowedTags = ['style', 'pre'];
const cleanContents = (contents: string): string => {
    // remove all content from disallowed tags
    disallowedTags.forEach(
        (tag) => (contents = contents.replace(new RegExp(`<${tag}(\\s.*?)?>.*?</${tag}>`, 'gs'), ''))
    );

    return contents
        .replace(/<.*?>/gs, ' ') // remove tags
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&.*?;/g, '') // remove HTML characters
        .replace(/\s+/g, ' ') // compress whitespace
        .replace(/\s+([.,?!:)])/g, '$1')
        .replace(/\(\s+/g, '(') // neaten punctuation
        .trim();
};

const extractTitle = ({ dom, titleTag }: { dom: JSDOM; titleTag: HTMLElement | null }) => {
    let extractedText = '';

    // Only extract text node
    titleTag?.childNodes.forEach((node) => {
        if (node.nodeType === dom.window.Node.TEXT_NODE) {
            extractedText += node?.textContent?.trim();
        }
    });
    return extractedText;
};
