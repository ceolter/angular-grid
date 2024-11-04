import type { BeanCollection, ChartGroupsDef, ChartType } from 'ag-grid-community';
import { Component, KeyCode, _setAriaLabel, _warn } from 'ag-grid-community';

import { AgGroupComponent } from '../../../../widgets/agGroupComponent';
import type { ChartController } from '../../chartController';
import type { ChartTranslationService } from '../../services/chartTranslationService';
import { getFullChartNameTranslationKey } from '../../utils/seriesTypeMapper';
import {
    MiniArea,
    MiniAreaColumnCombo,
    MiniBar,
    MiniBoxPlot,
    MiniBubble,
    MiniColumn,
    MiniColumnLineCombo,
    MiniCustomCombo,
    MiniDonut,
    MiniHeatmap,
    MiniHistogram,
    MiniLine,
    MiniNightingale,
    MiniNormalizedArea,
    MiniNormalizedBar,
    MiniNormalizedColumn,
    MiniNormalizedLine,
    MiniPie,
    MiniRadarArea,
    MiniRadarLine,
    MiniRadialBar,
    MiniRadialColumn,
    MiniRangeArea,
    MiniRangeBar,
    MiniScatter,
    MiniStackedArea,
    MiniStackedBar,
    MiniStackedColumn,
    MiniStackedLine,
    MiniSunburst,
    MiniTreemap,
    MiniWaterfall,
} from './miniCharts/index';
// please leave this as is - we want it to be explicit for build reasons
import type { MiniChart } from './miniCharts/miniChart';

export type ThemeTemplateParameters = Map<any, any>;

type MiniChartMenuMapping = {
    [K in keyof ChartGroupsDef]-?: MiniChartMenuGroup<K>;
};

type MiniChartMenuGroup<K extends keyof ChartGroupsDef> = {
    [T in NonNullable<ChartGroupsDef[K]>[number]]: MiniChartMenuItem;
};

interface MiniChartMenuItem {
    range: boolean;
    pivot: boolean;
    enterprise: boolean;
    icon: MiniChartConstructor;
}

type MiniChartConstructor = {
    chartType: ChartType;
    new (...args: any[]): MiniChart;
};

const miniChartMapping: MiniChartMenuMapping = {
    columnGroup: {
        column: { range: true, pivot: true, enterprise: false, icon: MiniColumn },
        stackedColumn: { range: true, pivot: true, enterprise: false, icon: MiniStackedColumn },
        normalizedColumn: { range: true, pivot: true, enterprise: false, icon: MiniNormalizedColumn },
    },
    barGroup: {
        bar: { range: true, pivot: true, enterprise: false, icon: MiniBar },
        stackedBar: { range: true, pivot: true, enterprise: false, icon: MiniStackedBar },
        normalizedBar: { range: true, pivot: true, enterprise: false, icon: MiniNormalizedBar },
    },
    pieGroup: {
        pie: { range: true, pivot: true, enterprise: false, icon: MiniPie },
        donut: { range: true, pivot: true, enterprise: false, icon: MiniDonut },
        doughnut: { range: true, pivot: true, enterprise: false, icon: MiniDonut },
    },
    lineGroup: {
        line: { range: true, pivot: true, enterprise: false, icon: MiniLine },
        stackedLine: { range: true, pivot: true, enterprise: false, icon: MiniStackedLine },
        normalizedLine: { range: true, pivot: true, enterprise: false, icon: MiniNormalizedLine },
    },
    scatterGroup: {
        scatter: { range: true, pivot: true, enterprise: false, icon: MiniScatter },
        bubble: { range: true, pivot: true, enterprise: false, icon: MiniBubble },
    },
    areaGroup: {
        area: { range: true, pivot: true, enterprise: false, icon: MiniArea },
        stackedArea: { range: true, pivot: true, enterprise: false, icon: MiniStackedArea },
        normalizedArea: { range: true, pivot: true, enterprise: false, icon: MiniNormalizedArea },
    },
    polarGroup: {
        radarLine: { range: true, pivot: false, enterprise: true, icon: MiniRadarLine },
        radarArea: { range: true, pivot: false, enterprise: true, icon: MiniRadarArea },
        nightingale: { range: true, pivot: false, enterprise: true, icon: MiniNightingale },
        radialColumn: { range: true, pivot: false, enterprise: true, icon: MiniRadialColumn },
        radialBar: { range: true, pivot: false, enterprise: true, icon: MiniRadialBar },
    },
    statisticalGroup: {
        boxPlot: { range: true, pivot: false, enterprise: true, icon: MiniBoxPlot },
        histogram: { range: true, pivot: false, enterprise: false, icon: MiniHistogram },
        rangeBar: { range: true, pivot: false, enterprise: true, icon: MiniRangeBar },
        rangeArea: { range: true, pivot: false, enterprise: true, icon: MiniRangeArea },
    },
    hierarchicalGroup: {
        treemap: { range: true, pivot: true, enterprise: true, icon: MiniTreemap },
        sunburst: { range: true, pivot: true, enterprise: true, icon: MiniSunburst },
    },
    specializedGroup: {
        heatmap: { range: true, pivot: false, enterprise: true, icon: MiniHeatmap },
        waterfall: { range: true, pivot: false, enterprise: true, icon: MiniWaterfall },
    },
    combinationGroup: {
        columnLineCombo: { range: true, pivot: true, enterprise: false, icon: MiniColumnLineCombo },
        areaColumnCombo: { range: true, pivot: true, enterprise: false, icon: MiniAreaColumnCombo },
        customCombo: { range: true, pivot: true, enterprise: false, icon: MiniCustomCombo },
    },
};

const DEFAULT_CHART_GROUPS: ChartGroupsDef = {
    columnGroup: ['column', 'stackedColumn', 'normalizedColumn'],
    barGroup: ['bar', 'stackedBar', 'normalizedBar'],
    pieGroup: ['pie', 'donut'],
    lineGroup: ['line', 'stackedLine', 'normalizedLine'],
    areaGroup: ['area', 'stackedArea', 'normalizedArea'],
    scatterGroup: ['scatter', 'bubble'],
    polarGroup: ['radarLine', 'radarArea', 'nightingale', 'radialColumn', 'radialBar'],
    statisticalGroup: ['boxPlot', 'histogram', 'rangeBar', 'rangeArea'],
    hierarchicalGroup: ['treemap', 'sunburst'],
    specializedGroup: ['heatmap', 'waterfall'],
    combinationGroup: ['columnLineCombo', 'areaColumnCombo', 'customCombo'],
};

export class MiniChartsContainer extends Component {
    private chartTranslation: ChartTranslationService;

    public wireBeans(beans: BeanCollection): void {
        this.chartTranslation = beans.chartTranslation as ChartTranslationService;
    }

    private readonly fills: string[];
    private readonly strokes: string[];
    private readonly themeTemplateParameters: ThemeTemplateParameters;
    private readonly isCustomTheme: boolean;
    private wrappers: Map<ChartType, HTMLElement> = new Map();
    private chartController: ChartController;

    private chartGroups: ChartGroupsDef;

    constructor(
        chartController: ChartController,
        fills: string[],
        strokes: string[],
        themeTemplateParameters: ThemeTemplateParameters,
        isCustomTheme: boolean,
        chartGroups: ChartGroupsDef = DEFAULT_CHART_GROUPS
    ) {
        super(/* html */ `<div class="ag-chart-settings-mini-wrapper"></div>`);

        this.chartController = chartController;
        this.fills = fills;
        this.strokes = strokes;
        this.themeTemplateParameters = themeTemplateParameters;
        this.isCustomTheme = isCustomTheme;
        this.chartGroups = { ...chartGroups };
    }

    public postConstruct() {
        // hide MiniCustomCombo if no custom combo exists
        if (!this.chartController.customComboExists() && this.chartGroups.combinationGroup) {
            this.chartGroups.combinationGroup = this.chartGroups.combinationGroup.filter(
                (chartType) => chartType !== 'customCombo'
            );
        }

        const eGui = this.getGui();
        const isEnterprise = this.chartController.isEnterprise();
        const isPivotChart = this.chartController.isPivotChart();
        const isRangeChart = !isPivotChart;

        // Determine the set of chart types that are specified by the chartGroupsDef config, filtering out any entries
        // that are invalid for the current chart configuration (pivot/range) and license type
        const displayedMenuGroups = Object.keys(this.chartGroups)
            .map((group: keyof ChartGroupsDef) => {
                const menuGroup =
                    group in miniChartMapping ? miniChartMapping[group as keyof typeof miniChartMapping] : undefined;
                if (!menuGroup) {
                    // User has specified an invalid chart group in the chartGroupsDef config
                    _warn(148, { group });
                    return null;
                }

                // Determine the valid chart types within this group, based on the chartGroupsDef config
                const chartGroupValues = this.chartGroups[group as keyof ChartGroupsDef] ?? [];
                const menuItems = chartGroupValues
                    .map((chartType) => {
                        const menuItem =
                            chartType in menuGroup
                                ? (menuGroup as Record<typeof chartType, MiniChartMenuItem>)[chartType]
                                : undefined;

                        if (!menuItem) {
                            // User has specified an invalid chart type in the chartGroupsDef config
                            _warn(149, { group, chartType });
                            return null;
                        }

                        if (!isEnterprise && menuItem.enterprise) {
                            return null; // skip enterprise charts if community
                        }
                        // Only show the chart if it is valid for the current chart configuration (pivot/range)
                        if (isRangeChart && menuItem.range) return menuItem;
                        if (isPivotChart && menuItem.pivot) return menuItem;
                        return null;
                    })
                    .filter((menuItem): menuItem is NonNullable<typeof menuItem> => menuItem != null);

                if (menuItems.length === 0) return null; // don't render empty chart groups

                return {
                    label: this.chartTranslation.translate(group),
                    items: menuItems,
                };
            })
            .filter((menuGroup): menuGroup is NonNullable<typeof menuGroup> => menuGroup != null);

        // Render the filtered menu items
        for (const { label, items } of displayedMenuGroups) {
            const groupComponent = this.createBean(
                new AgGroupComponent({
                    title: label,
                    suppressEnabledCheckbox: true,
                    enabled: true,
                    suppressOpenCloseIcons: true,
                    cssIdentifier: 'charts-settings',
                    direction: 'horizontal',
                    suppressKeyboardNavigation: true,
                })
            );

            for (const menuItem of items) {
                const MiniClass = menuItem.icon;
                const miniWrapper = document.createElement('div');
                miniWrapper.classList.add('ag-chart-mini-thumbnail');
                miniWrapper.setAttribute('tabindex', '0');
                miniWrapper.setAttribute('role', 'button');

                const miniClassChartType: ChartType = MiniClass.chartType;
                const listener = () => {
                    this.chartController.setChartType(miniClassChartType);
                    this.updateSelectedMiniChart();
                };
                this.addManagedListeners(miniWrapper, {
                    click: listener,
                    keydown: (event) => {
                        if (event.key == KeyCode.ENTER || event.key === KeyCode.SPACE) {
                            event.preventDefault();
                            listener();
                        }
                    },
                });

                this.wrappers.set(miniClassChartType, miniWrapper);

                this.createBean(
                    new MiniClass(
                        miniWrapper,
                        this.fills,
                        this.strokes,
                        this.themeTemplateParameters,
                        this.isCustomTheme
                    )
                );
                groupComponent.addItem(miniWrapper);
            }

            eGui.appendChild(groupComponent.getGui());
        }

        this.updateSelectedMiniChart();
    }

    public updateSelectedMiniChart(): void {
        const selectedChartType = this.chartController.getChartType();
        this.wrappers.forEach((miniChart, miniChartType) => {
            const selected = miniChartType === selectedChartType;
            miniChart.classList.toggle('ag-selected', selected);

            const chartName = this.chartTranslation.translate(getFullChartNameTranslationKey(miniChartType));
            const ariaLabel = selected
                ? `${chartName}. ${this.chartTranslation.translate('ariaChartSelected')}`
                : chartName;
            _setAriaLabel(miniChart, ariaLabel);
        });
    }

    public override destroy(): void {
        this.wrappers.clear();
        super.destroy();
    }
}
