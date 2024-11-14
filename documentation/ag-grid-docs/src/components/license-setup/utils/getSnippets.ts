import type { Framework, Library } from '@ag-grid-types';
import { agLibraryVersion } from '@constants';

import { getDependencies } from './getDependencies';
import { CHARTS_LICENSE_TEMPLATES, GRID_LICENSE_TEMPLATES } from './templates';

export const getDependenciesSnippet = ({
    library,
    framework,
    isIntegratedCharts,
}: {
    library: Library;
    framework: Framework;
    isIntegratedCharts: boolean;
}) => {
    const dependencies = getDependencies({
        library,
        framework,
        isIntegratedCharts,
    });

    const depObject: Record<string, string> = {};
    dependencies.forEach((dependency) => {
        depObject[dependency] = `~${agLibraryVersion}`;
    });

    return dependencies.length > 0 ? `dependencies: ${JSON.stringify(depObject, null, 4)}` : undefined;
};

export const getNpmInstallSnippet = ({
    library,
    framework,
    isIntegratedCharts,
}: {
    library: Library;
    framework: Framework;
    isIntegratedCharts: boolean;
}) => {
    const dependencies = getDependencies({
        library,
        framework,
        isIntegratedCharts,
    });
    const dependenciesStr = dependencies.join(' ');

    return dependencies.length > 0 ? `npm install ${dependenciesStr}` : undefined;
};

export const getBootstrapSnippet = ({
    framework,
    license: rawLicense,
    isIntegratedCharts,
}: {
    framework: Framework;
    license?: string;
    isIntegratedCharts?: boolean;
}): {
    grid: string;
    charts: string;
} => {
    const license = rawLicense?.trim();
    const gridTemplate = GRID_LICENSE_TEMPLATES[framework];
    const chartsTemplate = CHARTS_LICENSE_TEMPLATES[framework];

    return {
        grid: (gridTemplate && gridTemplate({ license, isIntegratedCharts })).trim() || '',
        charts: (chartsTemplate && chartsTemplate({ license }).trim()) || '',
    };
};
