import type { AgChartThemeOverrides } from 'ag-charts-types';

import type { ChartType, ChartTypeExCombo, ComboChartType, SeriesGroupType } from 'ag-grid-community';

import type { ChartTranslationKey } from '../services/chartTranslationService';

const CHART_TYPE_TO_SERIES_TYPE: Record<ChartTypeExCombo, string> = {
    column: 'bar',
    groupedColumn: 'bar',
    stackedColumn: 'bar',
    normalizedColumn: 'bar',
    bar: 'bar',
    groupedBar: 'bar',
    stackedBar: 'bar',
    normalizedBar: 'bar',
    line: 'line',
    stackedLine: 'line',
    normalizedLine: 'line',
    scatter: 'scatter',
    bubble: 'bubble',
    pie: 'pie',
    donut: 'donut',
    doughnut: 'donut',
    area: 'area',
    stackedArea: 'area',
    normalizedArea: 'area',
    histogram: 'histogram',
    radarLine: 'radar-line',
    radarArea: 'radar-area',
    nightingale: 'nightingale',
    radialColumn: 'radial-column',
    radialBar: 'radial-bar',
    sunburst: 'sunburst',
    rangeBar: 'range-bar',
    rangeArea: 'range-area',
    boxPlot: 'box-plot',
    treemap: 'treemap',
    heatmap: 'heatmap',
    waterfall: 'waterfall',
} as const;

const COMBO_CHART_TYPES: Set<ComboChartType> = new Set(['columnLineCombo', 'areaColumnCombo', 'customCombo']);

export const SERIES_GROUP_TYPES: SeriesGroupType[] = ['grouped', 'stacked', 'normalized'];

export type ChartSeriesType = (typeof CHART_TYPE_TO_SERIES_TYPE)[keyof typeof CHART_TYPE_TO_SERIES_TYPE] &
    keyof AgChartThemeOverrides;

// these values correspond to top level object names in `AgChartThemeOverrides`
export type ChartThemeOverridesSeriesType = keyof AgChartThemeOverrides & (ChartSeriesType | 'common');

interface SeriesParams {
    isCartesian?: boolean;
    isPolar?: boolean;
    isEnterprise?: boolean;
    isRadial?: boolean;
    isHierarchical?: boolean;
    isPie?: boolean;
    canInvert?: boolean;
    canSwitchDirection?: boolean;
}

type SeriesTypeParams = Partial<{ [key in ChartSeriesType]: SeriesParams }>;

const SERIES_TYPES: SeriesTypeParams = {
    area: {
        isCartesian: true,
        canInvert: true,
    },
    bar: {
        isCartesian: true,
        canInvert: true,
    },
    histogram: {
        isCartesian: true,
    },
    line: {
        isCartesian: true,
        canInvert: true,
    },
    pie: {
        isPie: true,
    },
    donut: {
        isPie: true,
        canInvert: true,
    },
    scatter: {
        isCartesian: true,
    },
    bubble: {
        isCartesian: true,
    },
    'radial-column': {
        isPolar: true,
        isEnterprise: true,
        isRadial: true,
        canInvert: true,
    },
    'radial-bar': {
        isPolar: true,
        isEnterprise: true,
        isRadial: true,
        canInvert: true,
    },
    'radar-line': {
        isPolar: true,
        isEnterprise: true,
        canInvert: true,
    },
    'radar-area': {
        isPolar: true,
        isEnterprise: true,
        canInvert: true,
    },
    nightingale: {
        isPolar: true,
        isEnterprise: true,
        canInvert: true,
    },
    'range-bar': {
        isCartesian: true,
        isEnterprise: true,
        canSwitchDirection: true,
    },
    'range-area': {
        isCartesian: true,
        isEnterprise: true,
    },
    'box-plot': {
        isCartesian: true,
        isEnterprise: true,
        canSwitchDirection: true,
    },
    treemap: {
        isEnterprise: true,
        isHierarchical: true,
    },
    sunburst: {
        isEnterprise: true,
        isHierarchical: true,
    },
    heatmap: {
        isCartesian: true,
        isEnterprise: true,
    },
    waterfall: {
        isCartesian: true,
        isEnterprise: true,
        canSwitchDirection: true,
    },
};

export function isSeriesType(seriesType: ChartSeriesType): boolean {
    return !!SERIES_TYPES[seriesType];
}

export function isComboChart(chartType: ChartType): boolean {
    return COMBO_CHART_TYPES.has(chartType as ComboChartType);
}

function doesSeriesHaveProperty(seriesType: ChartSeriesType, prop: keyof SeriesParams): boolean {
    return !!SERIES_TYPES[seriesType]?.[prop];
}

export function isEnterpriseChartType(chartType: ChartType): boolean {
    return doesSeriesHaveProperty(getSeriesType(chartType), 'isEnterprise');
}

const stackedChartTypes = new Set(['stackedColumn', 'normalizedColumn', 'stackedBar', 'normalizedBar']);
export function isStacked(chartType: ChartType): boolean {
    return stackedChartTypes.has(chartType);
}

export function isCartesian(seriesType: ChartSeriesType): boolean {
    return doesSeriesHaveProperty(seriesType, 'isCartesian');
}

export function isPolar(seriesType: ChartSeriesType): boolean {
    return doesSeriesHaveProperty(seriesType, 'isPolar');
}

export function isRadial(seriesType: ChartSeriesType): boolean {
    return doesSeriesHaveProperty(seriesType, 'isRadial');
}

export function isHierarchical(seriesType: ChartSeriesType): boolean {
    return doesSeriesHaveProperty(seriesType, 'isHierarchical');
}

export function isHierarchicalChart(chartType: ChartType | ChartType[]): boolean {
    if (Array.isArray(chartType)) {
        return chartType.every((type) => isHierarchicalChart(type));
    }
    return isHierarchical(getSeriesType(chartType));
}

export function getCanonicalChartType(chartType: ChartType): Exclude<ChartType, 'doughnut'> {
    return chartType === 'doughnut' ? 'donut' : chartType;
}

export function getSeriesTypeIfExists(chartType: ChartType): ChartSeriesType | undefined {
    return CHART_TYPE_TO_SERIES_TYPE[chartType as ChartTypeExCombo] as ChartSeriesType | undefined;
}

export function getSeriesType(chartType: ChartType): ChartSeriesType {
    return getSeriesTypeIfExists(chartType) ?? 'line';
}

export function isPieChartSeries(seriesType: ChartSeriesType): boolean {
    return doesSeriesHaveProperty(seriesType, 'isPie');
}

function canOnlyHaveSingleSeries(chartType: ChartType): boolean {
    return chartType === 'pie' || chartType === 'waterfall' || chartType === 'histogram';
}

export function getMaxNumCategories(chartType: ChartType): number | undefined {
    return isHierarchical(getSeriesType(chartType)) ? undefined : 1;
}

export function getMaxNumSeries(chartType: ChartType): number | undefined {
    if (isHierarchical(getSeriesType(chartType))) {
        return 2;
    } else if (canOnlyHaveSingleSeries(chartType)) {
        return 1;
    } else {
        return undefined;
    }
}

export function supportsInvertedCategorySeries(chartType: ChartType): boolean {
    return !isComboChart(chartType) && doesSeriesHaveProperty(getSeriesType(chartType), 'canInvert');
}

export function canSwitchDirection(chartType: ChartType): boolean {
    return doesSeriesHaveProperty(getSeriesType(chartType), 'canSwitchDirection');
}

export function getFullChartNameTranslationKey(chartType: ChartType): ChartTranslationKey {
    switch (chartType) {
        case 'groupedColumn':
        case 'stackedColumn':
        case 'normalizedColumn':
        case 'groupedBar':
        case 'stackedBar':
        case 'normalizedBar':
        case 'stackedLine':
        case 'normalizedLine':
        case 'stackedArea':
        case 'normalizedArea':
            return `${chartType}Full`;
        case 'doughnut':
            return 'donut';
        case 'areaColumnCombo':
            return 'AreaColumnCombo';
        default:
            return chartType;
    }
}
