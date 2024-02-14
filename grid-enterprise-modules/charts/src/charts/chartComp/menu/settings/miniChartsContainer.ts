
import {
    _,
    AgGroupComponent,
    Autowired,
    ChartGroupsDef,
    ChartType,
    Component,
    DEFAULT_CHART_GROUPS,
    PostConstruct
} from "@ag-grid-community/core";
import { ChartController } from "../../chartController";
import { ChartTranslationService } from "../../services/chartTranslationService";
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
    MiniPie,
    MiniRadarArea,
    MiniRadarLine,
    MiniRadialBar,
    MiniRadialColumn,
    MiniRangeBar,
    MiniRangeArea,
    MiniWaterfall,
    MiniScatter,
    MiniStackedArea,
    MiniStackedBar,
    MiniStackedColumn,
    MiniSunburst,
    MiniTreemap,
} from "./miniCharts/index"; // please leave this as is - we want it to be explicit for build reasons
import { MiniChart } from './miniCharts/miniChart';

// import {enterprise} from "../../../../main";

export type ThemeTemplateParameters = {
    extensions: Map<any, any>;
    properties: Map<any, any>;
};

type MiniChartMenuMapping = {
    [K in keyof ChartGroupsDef]-?: MiniChartMenuGroup<K>;
};

type MiniChartMenuGroup<K extends keyof ChartGroupsDef> = {
    [T in NonNullable<ChartGroupsDef[K]>[number]]: MiniChartMenuItem;
}

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
    lineGroup: { line: { range: true, pivot: true, enterprise: false, icon: MiniLine } },
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
        treemap: { range: true, pivot: false, enterprise: true, icon: MiniTreemap },
        sunburst: { range: true, pivot: false, enterprise: true, icon: MiniSunburst },
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

export class MiniChartsContainer extends Component {
    static TEMPLATE = /* html */ `<div class="ag-chart-settings-mini-wrapper"></div>`;

    private readonly fills: string[];
    private readonly strokes: string[];
    private readonly themeTemplateParameters: ThemeTemplateParameters;
    private readonly isCustomTheme: boolean;
    private wrappers: { [key: string]: HTMLElement } = {};
    private chartController: ChartController;

    private chartGroups: ChartGroupsDef;

    @Autowired('chartTranslationService') private chartTranslationService: ChartTranslationService;

    constructor(chartController: ChartController, fills: string[], strokes: string[], themeTemplateParameters: ThemeTemplateParameters, isCustomTheme: boolean, chartGroups: ChartGroupsDef = DEFAULT_CHART_GROUPS) {
        super(MiniChartsContainer.TEMPLATE);

        this.chartController = chartController;
        this.fills = fills;
        this.strokes = strokes;
        this.themeTemplateParameters = themeTemplateParameters;
        this.isCustomTheme = isCustomTheme;
        this.chartGroups = {...chartGroups};
    }

    @PostConstruct
    private init() {
        const eGui = this.getGui();
        const isEnterprise = this.chartController.isEnterprise();
        const isPivotChart = this.chartController.isPivotChart();
        const isRangeChart = !isPivotChart;

        // Determine the set of chart types that are specified by the chartGroupsDef config, filtering out any entries
        // that are invalid for the current chart configuration (pivot/range) and license type
        const displayedMenuGroups = Object.keys(this.chartGroups).map((group) => {
            const menuGroup = group in miniChartMapping
                ? miniChartMapping[group as keyof typeof miniChartMapping]
                : undefined;
            if (!menuGroup) {
                // User has specified an invalid chart group in the chartGroupsDef config
                _.warnOnce(`invalid chartGroupsDef config '${group}'`);
                return null;
            }

            // Determine the valid chart types within this group, based on the chartGroupsDef config
            const chartGroupValues = this.chartGroups[group as keyof ChartGroupsDef] ?? [];
            const menuItems = chartGroupValues.map((chartType) => {
                const menuItem = chartType in menuGroup
                        ? (menuGroup as Record<typeof chartType, MiniChartMenuItem>)[chartType]
                        : undefined;

                if (!menuItem) {
                     // User has specified an invalid chart type in the chartGroupsDef config
                    _.warnOnce(`invalid chartGroupsDef config '${group}.${chartType}'`);
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
                label: this.chartTranslationService.translate(group),
                items: menuItems
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
                })
            );

            for (const menuItem of items) {
                const MiniClass = menuItem.icon;
                const miniWrapper = document.createElement('div');
                miniWrapper.classList.add('ag-chart-mini-thumbnail');

                const miniClassChartType: ChartType = MiniClass.chartType;
                this.addManagedListener(miniWrapper, 'click', () => {
                    this.chartController.setChartType(miniClassChartType);
                    this.updateSelectedMiniChart();
                });

                this.wrappers[miniClassChartType] = miniWrapper;

                this.createBean(new MiniClass(miniWrapper, this.fills, this.strokes, this.themeTemplateParameters, this.isCustomTheme));
                groupComponent.addItem(miniWrapper);
            }

            eGui.appendChild(groupComponent.getGui());
        }            

        // hide MiniCustomCombo if no custom combo exists
        if (!this.chartController.customComboExists() && this.chartGroups.combinationGroup) {
            this.chartGroups.combinationGroup = this.chartGroups.combinationGroup.filter(chartType => chartType !== 'customCombo');
        }

        this.updateSelectedMiniChart();
    }

    public updateSelectedMiniChart(): void {
        const selectedChartType = this.chartController.getChartType();
        for (const miniChartType in this.wrappers) {
            const miniChart = this.wrappers[miniChartType];
            const selected = miniChartType === selectedChartType;
            miniChart.classList.toggle('ag-selected', selected);
        }
    }
}
