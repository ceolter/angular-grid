import { AgCharts, _ModuleSupport, _Theme } from 'ag-charts-community';
import type {
    AgChartInstance,
    AgChartOptions,
    AgChartTheme,
    AgChartThemeOverrides,
    AgChartThemePalette,
    AgCommonThemeableChartOptions,
    AgCrosshairOptions,
} from 'ag-charts-types';

import type { ChartType, SeriesChartType, SeriesGroupType } from 'ag-grid-community';

import type { ChartSelectionModel } from '../crossfilter/chartSelectionModel';
import type { CrossFilteringContext } from '../crossfilter/crossFilteringContext';
import { deproxy } from '../utils/integration';
import { get } from '../utils/object';
import type { ChartSeriesType } from '../utils/seriesTypeMapper';
import { getSeriesType } from '../utils/seriesTypeMapper';
import { createAgChartTheme, lookupCustomChartTheme } from './chartTheme';

export interface ChartProxyParams {
    chartId: string;
    chartInstance?: AgChartInstance;
    chartType: ChartType;
    customChartThemes?: { [name: string]: AgChartTheme };
    parentElement: HTMLElement;
    grouping: boolean;
    getChartThemeName: () => string;
    getChartThemes: () => string[];
    getGridOptionsChartThemeOverrides: () => AgChartThemeOverrides | undefined;
    getExtraPaddingDirections: () => ExtraPaddingDirection[];
    apiChartThemeOverrides?: AgChartThemeOverrides;
    crossFiltering: boolean;
    crossFilteringContext: CrossFilteringContext;
    crossFilterCallback: (event: any, reset?: boolean) => void;
    chartThemeToRestore?: string;
    chartOptionsToRestore?: AgChartThemeOverrides;
    chartPaletteToRestore?: AgChartThemePalette;
    seriesChartTypes: SeriesChartType[];
    translate: (toTranslate: string, defaultText?: string) => string;
}

export type ExtraPaddingDirection = 'top' | 'right' | 'bottom' | 'left';

export interface FieldDefinition {
    colId: string;
    displayName: string | null;
}

export interface UpdateParams {
    data: any[];
    groupData?: any[];
    grouping: boolean;
    categories: {
        id: string;
        name: string;
        chartDataType?: string;
    }[];
    fields: FieldDefinition[];
    chartId: string;
    getCrossFilteringContext: () => CrossFilteringContext;
    seriesChartTypes: SeriesChartType[];
    updatedOverrides?: AgChartThemeOverrides;
    seriesGroupType?: SeriesGroupType;
}

export abstract class ChartProxy<
    TOptions extends AgChartOptions = AgChartOptions,
    TSeries extends ChartSeriesType = ChartSeriesType,
> {
    private readonly isEnterpriseCharts: boolean;
    protected readonly chartType: ChartType;
    protected readonly standaloneChartType: TSeries;

    protected readonly chart: AgChartInstance;
    protected readonly crossFiltering: boolean;
    protected readonly crossFilterCallback: (event: any, reset?: boolean) => void;

    protected clearThemeOverrides = false;
    protected selectionModel: ChartSelectionModel;

    protected constructor(protected readonly chartProxyParams: ChartProxyParams) {
        this.isEnterpriseCharts = _ModuleSupport.enterpriseModule.isEnterprise;
        this.chart = chartProxyParams.chartInstance!;
        this.chartType = chartProxyParams.chartType;
        this.crossFiltering = chartProxyParams.crossFiltering;
        this.crossFilterCallback = chartProxyParams.crossFilterCallback;
        this.standaloneChartType = getSeriesType(this.chartType) as TSeries;

        this.selectionModel = chartProxyParams.crossFilteringContext.createChartSelectionModel(
            this.chartProxyParams.chartId
        );

        if (this.chart == null) {
            this.chart = AgCharts.create(this.getCommonChartOptions());
        } else {
            // On chart change, reset formatting panel changes.
            this.clearThemeOverrides = true;
        }
    }

    protected abstract getUpdateOptions(params: UpdateParams, commonChartOptions: TOptions): TOptions;

    protected updateSelection(params: UpdateParams): void {
        const category = params.categories[0].id;

        this.selectionModel.category = category;
        this.selectionModel.available = params.data.map((d) => ({ category, value: d[category] }));
    }

    public update(params: UpdateParams): void {
        const updateOptions = this.getUpdateOptions(params, this.getCommonChartOptions(params.updatedOverrides));

        this.updateSelection(params);

        this.getChartRef().update(updateOptions);
    }

    public updateThemeOverrides(themeOverrides: AgChartThemeOverrides): void {
        this.getChartRef().updateDelta({ theme: { overrides: themeOverrides } });
    }

    public getCategoryKey(): string {
        return 'xKey';
    }

    public getChart() {
        return deproxy(this.chart);
    }

    public getChartRef() {
        return this.chart;
    }

    public downloadChart(dimensions?: { width: number; height: number }, fileName?: string, fileFormat?: string) {
        const { chart } = this;
        const rawChart = deproxy(chart);
        const imageFileName = fileName || (rawChart.title ? rawChart.title.text : 'chart');
        const { width, height } = dimensions || {};

        chart.download({ width, height, fileName: imageFileName, fileFormat });
    }

    public getChartImageDataURL(type?: string) {
        return this.getChart().getCanvasDataURL(type);
    }

    private getChartOptions(): AgChartOptions {
        return this.chart.getOptions();
    }

    public getChartThemeOverrides(): AgChartThemeOverrides {
        const chartOptionsTheme = this.getChartOptions().theme as AgChartTheme;
        return chartOptionsTheme.overrides ?? {};
    }

    public getChartPalette(): AgChartThemePalette | undefined {
        return _Theme.getChartTheme(this.getChartOptions().theme).palette;
    }

    public setPaired(paired: boolean) {
        // Special handling to make scatter charts operate in paired mode by default, where
        // columns alternate between being X and Y (and size for bubble). In standard mode,
        // the first column is used for X and every other column is treated as Y
        // (or alternates between Y and size for bubble)
        const seriesType = getSeriesType(this.chartProxyParams.chartType);
        this.chart.updateDelta({ theme: { overrides: { [seriesType]: { paired } } } });
    }

    public isPaired(): boolean {
        const seriesType = getSeriesType(this.chartProxyParams.chartType);
        return get(this.getChartThemeOverrides(), `${seriesType}.paired`, true);
    }

    public lookupCustomChartTheme(themeName: string) {
        return lookupCustomChartTheme(this.chartProxyParams, themeName);
    }

    public getSeriesGroupType(): SeriesGroupType | undefined {
        return undefined;
    }

    protected transformCategoryData(data: any[], categoryKey: string): any[] {
        // replace the values for the selected category with a complex object to allow for duplicated categories
        return data.map((d, index) => {
            const value = d[categoryKey];
            const valueString = value && value.toString ? value.toString() : '';
            const datum = { ...d };

            datum[categoryKey] = { id: index, value, toString: () => valueString };

            return datum;
        });
    }

    private getCommonChartOptions(updatedOverrides?: AgChartThemeOverrides): TOptions & { mode: 'integrated' } {
        // Only apply active overrides if chart is initialised.
        const existingOptions = (this.clearThemeOverrides ? {} : this.chart?.getOptions() ?? {}) as TOptions;
        const formattingPanelOverrides = this.chart != null ? this.getActiveFormattingPanelOverrides() : undefined;
        this.clearThemeOverrides = false;

        const theme = createAgChartTheme(
            this.chartProxyParams,
            this,
            this.isEnterpriseCharts,
            this.getChartThemeDefaults(),
            updatedOverrides ?? formattingPanelOverrides
        );

        const newOptions = {
            ...existingOptions,
            mode: 'integrated',
        } as const;
        newOptions.theme = theme;
        newOptions.container = this.chartProxyParams.parentElement;
        return newOptions;
    }

    private getChartThemeDefaults(): AgChartThemeOverrides | undefined {
        const seriesOverrides = this.getSeriesChartThemeDefaults();
        const seriesChartOptions = seriesOverrides
            ? {
                  [this.standaloneChartType]: seriesOverrides,
              }
            : {};
        const crosshair: AgCrosshairOptions = {
            enabled: true,
            snap: true,
            label: {
                enabled: false,
            },
        };
        const common: AgCommonThemeableChartOptions = this.isEnterpriseCharts
            ? {
                  zoom: {
                      enabled: true,
                  },
                  animation: {
                      enabled: true,
                      duration: 500,
                  },
                  axes: {
                      number: { crosshair },
                      category: { crosshair },
                      log: { crosshair },
                      time: { crosshair },
                  },
              }
            : {};
        common.minHeight = 0;
        common.minWidth = 0;
        common.navigator = {
            enabled: false,
        };
        return {
            common,
            ...seriesChartOptions,
        };
    }

    protected getSeriesChartThemeDefaults(): AgChartThemeOverrides[TSeries] {
        return undefined;
    }

    private getActiveFormattingPanelOverrides(): AgChartThemeOverrides {
        if (this.clearThemeOverrides) {
            return {};
        }

        const inUseTheme = this.chart?.getOptions().theme as AgChartTheme;
        return inUseTheme?.overrides ?? {};
    }

    public destroy({ keepChartInstance = false } = {}): AgChartInstance | undefined {
        if (keepChartInstance) {
            // Reset Charts animation state, so that future updates to this re-used chart instance
            // behave as-if the chart is brand new. When switching chartTypes, this means we hide
            // the fact we are reusing the chart instance; the user sees a new chart which behaves
            // as-if it is a completely new and distinct chart instance.
            this.chart.resetAnimations();
            return this.chart;
        }

        this.destroyChart();
    }

    protected destroyChart(): void {
        if (this.chart) {
            this.chart.destroy();
            (this.chart as any) = undefined;
        }
    }
}
