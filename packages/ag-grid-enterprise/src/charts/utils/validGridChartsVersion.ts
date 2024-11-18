import type { ModuleValidationResult } from 'ag-grid-community';

const VERSION_CHECKING_FIRST_GRID_MAJOR_VERSION = 28;
const VERSION_CHECKING_FIRST_CHARTS_MAJOR_VERSION = 6;

function isValidVersion(version: string) {
    return version && version.match(/\d+\.\d+\.\d+/);
}

function isValidMajorVersion({
    gridMajorVersion,
    chartsMajorVersion,
}: {
    gridMajorVersion: string;
    chartsMajorVersion: string;
}): boolean {
    const gridMajor = parseInt(gridMajorVersion, 10);
    const chartsMajor = parseInt(chartsMajorVersion, 10);

    const gridMajorDifference = gridMajor - VERSION_CHECKING_FIRST_GRID_MAJOR_VERSION;
    const chartsMajorDifference = chartsMajor - VERSION_CHECKING_FIRST_CHARTS_MAJOR_VERSION;
    const isFirstOrAfterVersion = gridMajorDifference >= 0;

    return gridMajorDifference === chartsMajorDifference && isFirstOrAfterVersion;
}

export function gridChartVersion(gridVersion: string):
    | {
          gridMajorMinor: string;
          chartsMajorMinor: string;
      }
    | undefined {
    if (!gridVersion || !isValidVersion(gridVersion)) {
        return undefined;
    }

    const [gridMajor, gridMinor] = gridVersion.split('.') || [];
    const gridMajorMinor = `${gridMajor}.${gridMinor}.x`;

    const gridMajorNumber = parseInt(gridMajor, 10);
    const chartsMajor =
        gridMajorNumber - VERSION_CHECKING_FIRST_GRID_MAJOR_VERSION + VERSION_CHECKING_FIRST_CHARTS_MAJOR_VERSION;

    if (chartsMajor < 0) {
        return undefined;
    }

    const chartsMinor = gridMinor;
    const chartsMajorMinor = `${chartsMajor}.${chartsMinor}.x`;

    return {
        gridMajorMinor,
        chartsMajorMinor,
    };
}

export function validGridChartsVersionErrorMessage({
    type,
    gridVersion,
    chartsVersion,
}: {
    type: 'incompatible' | 'invalidCharts' | 'invalidGrid' | 'invalid';
    gridVersion?: string;
    chartsVersion?: string;
}): string {
    const invalidMessage =
        'AG Grid: AG Grid version is incompatible. Please see https://www.ag-grid.com/javascript-data-grid/modules/ for more information.';

    if (!gridVersion) {
        return invalidMessage;
    }

    const version = gridChartVersion(gridVersion);
    if (!version) {
        return invalidMessage;
    }

    const { gridMajorMinor, chartsMajorMinor } = version;

    if (type === 'incompatible') {
        return `AG Grid version ${gridVersion} and AG Charts version ${chartsVersion} is not supported. AG Grid version ${gridMajorMinor} should be used with AG Chart ${chartsMajorMinor}. Please see https://www.ag-grid.com/javascript-data-grid/modules/ for more information.`;
    } else if (type === 'invalidCharts') {
        return `AG Grid version ${gridMajorMinor} should be used with AG Chart ${chartsMajorMinor} not ${chartsVersion}. Please see https://www.ag-grid.com/javascript-data-grid/modules/ for more information.`;
    }

    return invalidMessage;
}

export function validGridChartsVersion({
    gridVersion,
    chartsVersion,
}: {
    gridVersion: string;
    chartsVersion: string;
}): ModuleValidationResult {
    if (!isValidVersion(chartsVersion)) {
        return {
            isValid: false,
            message: validGridChartsVersionErrorMessage({ type: 'invalidCharts', gridVersion, chartsVersion }),
        };
    }
    if (!isValidVersion(gridVersion)) {
        return {
            isValid: false,
            message: validGridChartsVersionErrorMessage({ type: 'invalidGrid', gridVersion, chartsVersion }),
        };
    }

    const [gridMajor, gridMinor] = gridVersion.split('.') || [];
    const [chartsMajor, chartsMinor, chartsPatch] = chartsVersion.split('.') || [];
    const isValidMajor = isValidMajorVersion({
        gridMajorVersion: gridMajor,
        chartsMajorVersion: chartsMajor,
    });

    if ((isValidMajor && gridMinor === chartsMinor) || chartsPatch.includes('beta')) {
        return {
            isValid: true,
        };
    } else if (!isValidMajor || gridMinor !== chartsMinor) {
        return {
            isValid: false,
            message: validGridChartsVersionErrorMessage({ type: 'incompatible', gridVersion, chartsVersion }),
        };
    }

    return {
        isValid: false,
        message: validGridChartsVersionErrorMessage({ type: 'invalid', gridVersion, chartsVersion }),
    };
}
