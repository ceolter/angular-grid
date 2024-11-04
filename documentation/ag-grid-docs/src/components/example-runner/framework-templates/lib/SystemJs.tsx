import type { InternalFramework } from '@ag-grid-types';
import { FILES_BASE_PATH, NPM_CDN, PUBLISHED_URLS, SITE_BASE_URL, agGridVersion } from '@constants';
import { isUsingPublishedPackages } from '@utils/pages';
import { pathJoin } from '@utils/pathJoin';

import agChartsAngular from '../../../../../../../node_modules/ag-charts-angular/package.json';
import agChartsCommunity from '../../../../../../../node_modules/ag-charts-community/package.json';
import agChartsEnterprise from '../../../../../../../node_modules/ag-charts-enterprise/package.json';
import agChartsReact from '../../../../../../../node_modules/ag-charts-react/package.json';
import agChartsTypes from '../../../../../../../node_modules/ag-charts-types/package.json';
import agChartsVue3 from '../../../../../../../node_modules/ag-charts-vue3/package.json';

interface Props {
    boilerplatePath: string;
    appLocation: string;
    startFile: string;
    internalFramework: InternalFramework;
    isEnterprise: boolean;
    isDev: boolean;
}

type Paths = Record<string, string>;
interface Configuration {
    gridMap: Paths;
    gridCommunityPaths: Paths;
    gridEnterprisePaths: Paths;
}

const localPrefix = pathJoin(import.meta.env?.PUBLIC_SITE_URL, SITE_BASE_URL, FILES_BASE_PATH);

const localBuildAndArchiveConfiguration: Configuration = {
    gridMap: {
        'ag-grid-community': `${localPrefix}/ag-grid-community`,
        'ag-grid-enterprise': `${localPrefix}/ag-grid-enterprise`,
        'ag-grid-angular': `${localPrefix}/ag-grid-angular`,
        'ag-grid-react': `${localPrefix}/ag-grid-react`,
        'ag-grid-vue3': `${localPrefix}/ag-grid-vue3`,
    },
    gridCommunityPaths: {
        'ag-grid-community': `${localPrefix}/ag-grid-community`,
        '@ag-grid-community/locale': `${localPrefix}/@ag-grid-community/locale/dist/package/main.cjs.js`,
    },
    gridEnterprisePaths: {
        'ag-charts-types': `${localPrefix}/ag-charts-types/dist/package/main.cjs.js`,
        'ag-charts-community': `${localPrefix}/ag-charts-community/dist/package/main.cjs.js`,
        'ag-charts-enterprise': `${localPrefix}/ag-charts-enterprise/dist/package/main.cjs.js`,
        'ag-charts-community/modules': `${localPrefix}/ag-charts-community/dist/package/main-modules.cjs.js`,
        'ag-charts-enterprise/modules': `${localPrefix}/ag-charts-enterprise/dist/package/main-modules.cjs.js`,
        '@ag-grid-community/locale': `${localPrefix}/@ag-grid-community/locale/dist/package/main.cjs.js`,
    },
};

const publishedConfiguration: Configuration = {
    gridMap: PUBLISHED_URLS,
    gridCommunityPaths: {
        'ag-charts-react': `${NPM_CDN}/ag-charts-react@${agChartsReact.version}/`,
        'ag-charts-angular': `${NPM_CDN}/ag-charts-angular@${agChartsAngular.version}/`,
        'ag-charts-vue3': `${NPM_CDN}/ag-charts-vue3@${agChartsVue3.version}/`,
        'ag-charts-community': `${NPM_CDN}/ag-charts-community@${agChartsCommunity.version}/`,
        'ag-charts-types': `${NPM_CDN}/ag-charts-types@${agChartsTypes.version}/`,
        '@ag-grid-community/locale': `${NPM_CDN}/@ag-grid-community/locale@${agGridVersion}/dist/package/main.cjs.js`,
    },
    gridEnterprisePaths: {
        'ag-charts-react': `${NPM_CDN}/ag-charts-react@${agChartsReact.version}/`,
        'ag-charts-angular': `${NPM_CDN}/ag-charts-angular@${agChartsAngular.version}/`,
        'ag-charts-vue3': `${NPM_CDN}/ag-charts-vue3@${agChartsVue3.version}/`,
        'ag-charts-community': `${NPM_CDN}/ag-charts-community@${agChartsCommunity.version}/dist/package/main.cjs.js`,
        'ag-charts-types': `${NPM_CDN}/ag-charts-types@${agChartsTypes.version}/`,
        'ag-charts-enterprise': `${NPM_CDN}/ag-charts-enterprise@${agChartsEnterprise.version}/dist/package/main.cjs.js`,
        '@ag-grid-community/locale': `${NPM_CDN}/@ag-grid-community/locale@${agGridVersion}/dist/package/main.cjs.js`,
    },
};

function getRelevantConfig(configuration: Configuration, framework: InternalFramework) {
    const filterByFramework = ([k]: string[]) => {
        const inverseFrameworks: Record<string, string[]> = {
            reactFunctional: ['angular', 'vue3'],
            reactFunctionalTs: ['angular', 'vue3'],
            angular: ['react', 'vue3'],
            vue3: ['angular', 'react'],
            typescript: ['angular', 'react', 'vue3'],
        };
        return !inverseFrameworks[framework].some((f) => k.endsWith(f));
    };

    const filterOutChartWrapper = ([k]: string[]) => {
        // integrated does not need the charts framework wrapper
        if (k.includes('ag-charts')) {
            return k !== `ag-charts-${framework}`;
        }
        return true;
    };

    const buildCopy = (config: Paths) => {
        const valid = {} as Paths;
        Object.entries(config)
            .filter(filterOutChartWrapper)
            .filter(filterByFramework)
            .sort(([k1], [k2]) => (k1 < k2 ? -1 : 1))
            .forEach(([k, v]) => {
                valid[k] = v;
            });
        return valid;
    };

    return {
        gridMap: buildCopy(configuration.gridMap),
        gridCommunityPaths: buildCopy(configuration.gridCommunityPaths),
        gridEnterprisePaths: buildCopy(configuration.gridEnterprisePaths),
    };
}

/**
 * Our framework examples use SystemJS to load the various dependencies. This component is used to insert the required
 * code to load SystemJS and the relevant modules depending on the framework.
 */
export const SystemJs = ({
    boilerplatePath,
    appLocation,
    startFile,
    internalFramework,
    isEnterprise,
    isDev,
}: Props) => {
    const systemJsPath = pathJoin(boilerplatePath, `systemjs.config${isDev ? '.dev' : ''}.js`);

    let configuration = isUsingPublishedPackages() ? publishedConfiguration : localBuildAndArchiveConfiguration;

    if (isDev) {
        configuration.gridMap = {
            ...configuration.gridMap,
            'ag-charts-community': `${localPrefix}/ag-charts-community`,
            'ag-charts-enterprise': `${localPrefix}/ag-charts-enterprise`,
            'ag-charts-types': `${localPrefix}/ag-charts-types`,
            '@ag-grid-community/locale': `${localPrefix}/@ag-grid-community/locale`,
        };
    }
    configuration = getRelevantConfig(configuration, internalFramework);

    const systemJsMap = configuration.gridMap;
    const systemJsPaths = { ...(isEnterprise ? configuration.gridEnterprisePaths : configuration.gridCommunityPaths) };

    let systemJsVersion = `${NPM_CDN}/systemjs@0.19.47/dist/system.js`;
    if (internalFramework === 'angular') {
        // Angular needs a later version to be able to import @esm-bundle/angular__compiler which
        // it requires to correctly renderer dynamic components.
        systemJsVersion = `${NPM_CDN}/systemjs@0.21.6/dist/system.js`;
    }

    return (
        <>
            <script
                dangerouslySetInnerHTML={{
                    __html: `
            var appLocation = '${appLocation}';
            var boilerplatePath = '${boilerplatePath}';
            var systemJsMap = ${format(systemJsMap)};
            ${Object.keys(systemJsPaths).length > 0 ? `var systemJsPaths = ${format(systemJsPaths)};` : ''}
        `,
                }}
            />
            <script src={systemJsVersion} />
            <script src={systemJsPath} />
            <script
                dangerouslySetInnerHTML={{
                    __html: `System.import('${startFile}').catch(function(err) { document.body.innerHTML = '<div class="example-error" style="background:#fdb022;padding:1rem;">' + 'Example Error: ' + err + '</div>'; console.error(err); });`,
                }}
            />
        </>
    );
};

const format = (value: object) => JSON.stringify(value, null, 4).replace(/\n/g, '\n            ');
