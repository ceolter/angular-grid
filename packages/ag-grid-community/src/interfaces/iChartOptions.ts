export interface ChartGroupsDef {
    // community chart groups
    columnGroup?: ('column' | 'stackedColumn' | 'normalizedColumn')[];
    barGroup?: ('bar' | 'stackedBar' | 'normalizedBar')[];
    pieGroup?: ('pie' | 'donut' | 'doughnut')[];
    lineGroup?: ('line' | 'stackedLine' | 'normalizedLine')[];
    areaGroup?: ('area' | 'stackedArea' | 'normalizedArea')[];
    scatterGroup?: ('scatter' | 'bubble')[];
    combinationGroup?: ('columnLineCombo' | 'areaColumnCombo' | 'customCombo')[];

    // enterprise chart groups
    polarGroup?: ('radarLine' | 'radarArea' | 'nightingale' | 'radialColumn' | 'radialBar')[];
    statisticalGroup?: ('boxPlot' | 'histogram' | 'rangeBar' | 'rangeArea')[];
    hierarchicalGroup?: ('treemap' | 'sunburst')[];
    specializedGroup?: ('heatmap' | 'waterfall')[];
}

export type ChartToolPanelName = 'settings' | 'data' | 'format';

/** Configuration for the `Chart` panel */
export interface ChartSettingsPanel {
    /** Chart groups customisations for which charts are displayed in the chart panel */
    chartGroupsDef?: ChartGroupsDef;
}

export type ChartFormatPanelGroup =
    | 'chart'
    | 'titles'
    | 'legend'
    | 'axis'
    | 'horizontalAxis'
    | 'verticalAxis'
    | 'series';

export type ChartDataPanelGroup = 'categories' | 'series' | 'seriesChartType' | 'chartSpecific';

export interface ChartPanelGroupDef<GroupType> {
    /** The panel group type */
    type: GroupType;
    /** Whether the panel group is open by default. If not specified, it is closed */
    isOpen?: boolean;
}

/** Configuration for the `Customize` panel */
export interface ChartFormatPanel {
    /** The customize panel group configurations, their order and whether they are shown. If not specified shows all groups */
    groups?: ChartPanelGroupDef<ChartFormatPanelGroup>[];
}

/** Configuration for the `Set Up` panel */
export interface ChartDataPanel {
    /** The set up panel group configurations, their order and whether they are shown. If not specified shows all groups */
    groups?: ChartPanelGroupDef<ChartDataPanelGroup>[];
}

export interface ChartToolPanelsDef {
    /** Customisations for the chart panel and chart menu items in the Context Menu. */
    settingsPanel?: ChartSettingsPanel;
    /** Customisations for the customize panel */
    formatPanel?: ChartFormatPanel;
    /** Customisations for the set up panel */
    dataPanel?: ChartDataPanel;
    /** The ordered list of panels to show in the chart tool panels. If none specified, all panels are shown */
    panels?: ChartToolPanelName[];
    /** The panel to open by default when the chart loads. If none specified, the tool panel is hidden by default and the first panel is open when triggered. */
    defaultToolPanel?: ChartToolPanelName;
}

export type CrossFilterChartType =
    | 'column'
    | 'bar'
    | 'line'
    | 'scatter'
    | 'bubble'
    | 'pie'
    | 'donut'
    | 'doughnut'
    | 'area';

export type ChartToolPanelMenuOptions = 'chartSettings' | 'chartData' | 'chartFormat';
export type ChartToolbarMenuItemOptions = 'chartLink' | 'chartUnlink' | 'chartDownload' | 'chartMenu';

export interface SeriesChartType {
    colId: string;
    chartType: ChartType;
    secondaryAxis?: boolean;
}

export type ChartType =
    | 'column'
    | 'groupedColumn'
    | 'stackedColumn'
    | 'normalizedColumn'
    | 'bar'
    | 'groupedBar'
    | 'stackedBar'
    | 'normalizedBar'
    | 'line'
    | 'stackedLine'
    | 'normalizedLine'
    | 'scatter'
    | 'bubble'
    | 'pie'
    | 'donut'
    | 'doughnut'
    | 'area'
    | 'stackedArea'
    | 'normalizedArea'
    | 'histogram'
    | 'radarLine'
    | 'radarArea'
    | 'nightingale'
    | 'radialColumn'
    | 'radialBar'
    | 'sunburst'
    | 'rangeBar'
    | 'rangeArea'
    | 'boxPlot'
    | 'treemap'
    | 'sunburst'
    | 'heatmap'
    | 'waterfall'
    | 'columnLineCombo'
    | 'areaColumnCombo'
    | 'customCombo';

export type ChartTypeExCombo = Exclude<ChartType, 'columnLineCombo' | 'areaColumnCombo' | 'customCombo'>;

export class ChartMappings {
    public static readonly CHART_TYPE_TO_SERIES_TYPE: Record<ChartTypeExCombo, string> = {
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

    public static readonly COMBO_CHART_TYPES = ['columnLineCombo', 'areaColumnCombo', 'customCombo'] as const;

    public static readonly SERIES_GROUP_TYPES = ['grouped', 'stacked', 'normalized'] as const;
}

export type SeriesGroupType = (typeof ChartMappings.SERIES_GROUP_TYPES)[number];
