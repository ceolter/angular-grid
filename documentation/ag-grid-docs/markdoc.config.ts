import { isFramework } from '@ag-website-shared/markdoc/functions/isFramework';
import { isNotJavascriptFramework } from '@ag-website-shared/markdoc/functions/isNotJavascriptFramework';
import { heading } from '@ag-website-shared/markdoc/nodes/heading';
import { br } from '@ag-website-shared/markdoc/tags/br';
import { embedSnippet } from '@ag-website-shared/markdoc/tags/embedSnippet';
import { enterpriseIcon } from '@ag-website-shared/markdoc/tags/enterpriseIcon';
import { idea } from '@ag-website-shared/markdoc/tags/idea';
import { image } from '@ag-website-shared/markdoc/tags/image';
import { kbd } from '@ag-website-shared/markdoc/tags/kbd';
import { note } from '@ag-website-shared/markdoc/tags/note';
import { oneTrustCookies } from '@ag-website-shared/markdoc/tags/oneTrustCookies';
import { openInCTA } from '@ag-website-shared/markdoc/tags/openInCTA';
import { tabItem, tabs } from '@ag-website-shared/markdoc/tags/tabs';
import { video } from '@ag-website-shared/markdoc/tags/video';
import { videoSection } from '@ag-website-shared/markdoc/tags/videoSection';
import { warning } from '@ag-website-shared/markdoc/tags/warning';
import { Markdoc, component, defineMarkdocConfig } from '@astrojs/markdoc/config';
import { getFrameworkCapitalised } from '@utils/markdoc/getFrameworkCapitalised';

import { agGridVersion } from './src/constants';
import { link } from './src/utils/markdoc/tags/link';

export default defineMarkdocConfig({
    variables: {
        agGridVersion,
    },
    nodes: {
        heading,
        link,
        fence: {
            attributes: {
                ...Markdoc.nodes.fence.attributes!,
                /**
                 * Determine if snippet component is used or not
                 *
                 * Snippets transform the code based on the user selected framework
                 */
                frameworkTransform: Boolean,
                language: String,
                lineNumbers: Boolean,
                suppressFrameworkContext: Boolean,
                spaceBetweenProperties: Boolean,
                inlineReactProperties: Boolean,
            } as any,
            render: component('./src/components/snippet/Snippet.astro'),
        },
    },
    functions: {
        isFramework,
        isNotJavascriptFramework,
        getFrameworkCapitalised,
    },
    tags: {
        kbd,
        link,
        oneTrustCookies,
        tabs,
        tabItem,
        videoSection,
        image,
        br,
        note,
        warning,
        idea,
        openInCTA,
        enterpriseIcon,
        video,
        licenseSetup: {
            render: component('./src/components/license-setup/LicenseSetup.astro'),
        },
        gridExampleRunner: {
            render: component('./src/components/docs/components/DocsExampleRunner.astro'),
            attributes: {
                title: { type: String, required: true },
                name: { type: String, required: true },
                typescriptOnly: { type: Boolean },
                suppressDarkMode: { type: Boolean },
                exampleHeight: { type: Number },
            },
        },
        apiDocumentation: {
            render: component('./src/components/reference-documentation/components/ApiDocumentation.astro'),
            attributes: {
                source: { type: String },
                sources: { type: Array },
                section: { type: String },
                names: { type: Array },
                config: { type: Object },

                // For `getHeadings` parsing
                __apiDocumentationHeadings: { type: Boolean },
            },
        },
        interfaceDocumentation: {
            render: component('./src/components/reference-documentation/components/InterfaceDocumentation.astro'),
            attributes: {
                interfaceName: { type: String, required: true },
                overrideSrc: { type: String },
                names: { type: Array },
                exclude: { type: Array },
                config: { type: Object },
            },
        },
        matrixTable: {
            render: component('./src/features/matrixTable/components/MatrixTable.astro'),
            attributes: {
                /**
                 * Data file name within `src/content/matrix-table`
                 *
                 * Excluding the extension
                 */
                dataFileName: { type: String },
                /**
                 * Mapping of column keys to the displayed column name and order
                 */
                columns: { type: Object, required: true },
                /**
                 * Filter condition for filtering row data, as a string
                 *
                 * NOTE: Only supports simple field key matches, `!key`, `&&` and `||` cases
                 */
                filter: { type: String },
                /**
                 * Cell renderer to use for the column fields
                 */
                cellRenderer: { type: Object },
            },
        },
        gif: {
            render: component('./src/components/image/Gif.astro'),
            attributes: {
                imagePath: { type: String, required: true },
                alt: { type: String, required: true },
                autoPlay: { type: Boolean },
                wrapped: { type: Boolean },
            },
        },
        embedSnippet,
        iframe: {
            render: 'iframe',
            attributes: {
                src: { type: String, required: true },
                style: { type: String },
            },
        },
        iconsPanel: {
            render: component('./src/components/icon/IconsPanel.astro'),
        },
        imageCaption: {
            render: component('./src/components/image/ImageCaption.astro'),
            attributes: {
                /**
                 * Docs page name in `src/content/[pageName]
                 *
                 * If not provided, will default to the location of the markdoc file
                 */
                pageName: { type: String },
                /**
                 * Relative path within markdoc page folder
                 */
                imagePath: { type: String, required: true },
                alt: { type: String, required: true },
                centered: { type: Boolean },
                constrained: { type: Boolean },
                descriptionTop: { type: Boolean },
                width: { type: String },
                height: { type: String },
                minWidth: { type: String },
                maxWidth: { type: String },
                /**
                 * Enable dark mode CSS filter for image
                 *
                 * Alternatively, add `-dark` suffixed image in `imagePath` to add
                 * dark mode image manually
                 */
                enableDarkModeFilter: { type: Boolean },
                /**
                 * Autoplay gif
                 */
                autoPlay: { type: Boolean },
            },
        },
        flex: {
            render: component('./src/components/flex/Flex.astro'),
            attributes: {
                direction: { type: String, matches: ['row', 'column'] },
                alignItems: {
                    type: String,
                    matches: ['center', 'start', 'end', 'self-start', 'self-end', 'flex-start', 'flex-end'],
                },
                justifyContent: {
                    type: String,
                    matches: ['center', 'start', 'end', 'self-start', 'self-end', 'flex-start', 'flex-end'],
                },
                gap: {
                    type: String,
                    matches: ['size-6', 'size-10'],
                },
                mobileWrap: {
                    type: Boolean,
                },
            },
        },
        learningVideos: {
            render: component('./src/components/learning-videos/LearningVideos.astro'),
            attributes: {
                id: { type: String },
                title: { type: String },
                showHeader: { type: Boolean },
            },
        },
        figmaCommunityButton: {
            render: component('./src/components/figma-community-button/FigmaCommunityButton.astro'),
        },
        metaTag: {
            render: component('./src/components/docs/components/MetaTagComponent.astro'),
            attributes: {
                tags: { type: Array, required: true },
            },
        },
        seedProjectsTable: {
            render: component('./src/components/SeedProjectsTable.astro'),
        },
    },
});
