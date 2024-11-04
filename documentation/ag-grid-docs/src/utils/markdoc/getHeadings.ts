import { type Framework } from '@ag-grid-types';
import { getPagePath } from '@components/docs/utils/filesData';
import { getPropertiesFromSource } from '@components/reference-documentation/utils/getPropertiesFromSource';
import { getAllSectionHeadingLinks } from '@components/reference-documentation/utils/interface-helpers';
import Markdoc, { type Node, type RenderableTreeNode } from '@markdoc/markdoc';
import { type MarkdownHeading } from 'astro';
import Slugger from 'github-slugger';
import { readFileSync } from 'node:fs';
import path from 'node:path';

import { transformMarkdoc } from './transformMarkdoc';

const TABS_TAG_NAME = 'tabs';
const TAB_ITEM_TAG_NAME = 'tabItem';
const API_DOC_HEADINGS_ATTR_NAME = '__apiDocumentationHeadings';

function isTabsTag({ tag, type }: Node) {
    return type === 'tag' && tag === TABS_TAG_NAME;
}

function isTabItemTag({ tag, type }: Node) {
    return type === 'tag' && tag === TAB_ITEM_TAG_NAME;
}

function isDocumentNode({ type }: Node) {
    return type === 'document';
}

/**
 * Check if node is a heading
 *
 * @see https://github.com/withastro/astro/blob/1539e04a8e5865027b3a8718c6f142885e7c8d88/packages/integrations/markdoc/src/runtime.ts#L145
 */
function isHeadingTag(node: Node) {
    return (
        Boolean(Markdoc.Tag.isTag(node)) &&
        node.attributes.__collectHeading === true &&
        typeof node.attributes.level === 'number'
    );
}

// Only show ApiDocumentation headings if it's not showing a section
function isApiDocsHeadingNode(node: Node) {
    return node.tag === 'apiDocumentation' && !node.attributes.section;
}

function hasApiDocsHeadingAttribute(node: Node) {
    return node.attributes[API_DOC_HEADINGS_ATTR_NAME];
}

function addAttributeToNode({ node, name, value }: { node: Node; name: string; value: any }) {
    node.attributes[name] = value;
    node.annotations.push({
        type: 'attribute',
        name,
        value,
    });
}

function createHeadingRenderableNode({
    level,
    id,
    text,
}: {
    level: number;
    id: string;
    text: string;
}): RenderableTreeNode {
    return {
        $$mdtype: 'Tag',
        attributes: {
            id,
            __collectHeading: true,
            level,
        },
        children: [text],
    };
}

/**
 * Get markdoc tabs (ie, `{% tabs %}`)
 *
 * Filter out tabs with `omitFromOverview`, do not have a heading directly before it
 */
function getMarkdocTabs(ast: Node) {
    const slugger = new Slugger();
    let lastHeading: Node;

    return ast.children
        .map((node) => {
            if (node.type === 'heading') {
                lastHeading = node;
            }

            if (!isTabsTag(node) || !lastHeading || node.attributes.omitFromOverview) {
                return;
            }

            const { level } = lastHeading.attributes;
            const { content } = lastHeading.children[0].children[0].attributes;
            const heading: MarkdownHeading = { slug: slugger.slug(content), depth: level, text: content.trim() };
            const tabItems = node.children.filter(isTabItemTag).map(({ attributes }) => attributes);

            return { heading, tabItems };
        })
        .filter(<T>(val: T | undefined): val is T => val != null);
}

function addTabsToHeadings({
    headings,
    markdocAst,
    getTabItemSlug,
}: {
    headings: MarkdownHeading[];
    markdocAst: Node;
    getTabItemSlug: (id: string) => string;
}) {
    const tabHeadings = getMarkdocTabs(markdocAst);
    const headingsClone = headings.slice();

    for (const tab of tabHeadings) {
        const tabHeadingIndex = headingsClone.findIndex(({ slug }) => slug === tab.heading.slug);

        if (tabHeadingIndex === -1) continue;

        const tabItemsHeading: MarkdownHeading[] = tab.tabItems.map(({ id, label }) => ({
            slug: getTabItemSlug(id),
            depth: tab.heading.depth + 1,
            text: label,
        }));

        headingsClone.splice(tabHeadingIndex + 1, 0, ...tabItemsHeading);
    }

    return headingsClone;
}

async function transformRenderTreeWithReferenceHeadings(renderTree: RenderableTreeNode) {
    const childrenPromises = renderTree!.children.map(async (node) => {
        if (hasApiDocsHeadingAttribute(node)) {
            const { source, sources, config = {} } = node.attributes;

            const { propertiesFromFiles } = await getPropertiesFromSource({
                source,
                sources,
            });

            const headingLinks = getAllSectionHeadingLinks({
                propertiesFromFiles,
                suppressSort: config.suppressSort,
            });
            const headingNodes = headingLinks.map(({ title, id }) => {
                return createHeadingRenderableNode({ level: 2, id, text: title });
            });

            return headingNodes;
        } else {
            return node;
        }
    });
    const children = (await Promise.all(childrenPromises)).flat();

    renderTree!.children = children;
}

function getTextFromChildren(node: Node): string {
    const { children } = node;

    return children
        .map((child) => {
            return typeof child === 'string' ? child : getTextFromChildren(child);
        })
        .join(' ');
}

/**
 * Find partials and add it to the AST
 */
async function resolvePartials({ pageName, ast, framework }: { pageName: string; ast: Node; framework: Framework }) {
    const pagePath = getPagePath({ pageName });
    for (const node of ast.walk()) {
        if (node.type === 'tag' && node.tag === 'partial') {
            const { file } = node.attributes;
            const filePath = path.join(pagePath, file);

            const partialContents = readFileSync(filePath).toString();
            const { ast: partialAst } = transformMarkdoc({ framework, markdocContent: partialContents });

            Object.assign(node, partialAst);
        }
    }

    // Flatten partials nodes
    ast.children = ast.children
        .map((child) => {
            return isDocumentNode(child) ? child.children : child;
        })
        .flat();
}

export function getTopHeading(title: string) {
    return { slug: 'top', depth: 1, text: title };
}

/**
 * Get headings within markdoc content, resolving headings shown based on framework and adding
 * tab headings
 */
export async function getHeadings({
    title,
    pageName,
    markdocContent,
    framework,
    getTabItemSlug,
}: {
    title: string;
    pageName: string;
    markdocContent: string;
    framework: Framework;
    getTabItemSlug: (id: string) => string;
}): Promise<MarkdownHeading[]> {
    const transformAst = (ast: Node) => {
        ast.children = ast.children.map((node) => {
            if (isApiDocsHeadingNode(node)) {
                addAttributeToNode({ node, name: API_DOC_HEADINGS_ATTR_NAME, value: true });
            }
            return node;
        });

        resolvePartials({ pageName, ast, framework });
    };
    const { ast, renderTree } = transformMarkdoc({ framework, markdocContent, transformAst });
    if (!renderTree) {
        return [];
    }

    await transformRenderTreeWithReferenceHeadings(renderTree);

    const renderTreeHeadings = renderTree['children']?.filter(isHeadingTag).map((node) => {
        const { id: slug, level: depth } = node.attributes;
        const text = getTextFromChildren(node);

        return {
            depth,
            slug,
            text,
        };
    });

    const topHeading = getTopHeading(title);

    const headingsWithTabs = addTabsToHeadings({ headings: renderTreeHeadings, markdocAst: ast, getTabItemSlug });

    return [topHeading, ...headingsWithTabs];
}
