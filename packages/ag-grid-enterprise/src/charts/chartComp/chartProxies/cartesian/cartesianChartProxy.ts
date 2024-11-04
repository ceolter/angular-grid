import type {
    AgCartesianAxisOptions,
    AgCartesianAxisType,
    AgCartesianChartOptions,
    AgCartesianSeriesOptions,
    AgChartTheme,
    AgChartThemeName,
    AgRangeBarSeriesThemeableOptions,
} from 'ag-charts-types';

import { isNormalized, isStacked } from '../../utils/seriesTypeMapper';
import type { ChartProxyParams, UpdateParams } from '../chartProxy';
import { ChartProxy } from '../chartProxy';

export type CartesianChartTypes =
    | 'area'
    | 'bar'
    | 'histogram'
    | 'line'
    | 'scatter'
    | 'bubble'
    | 'waterfall'
    | 'box-plot'
    | 'range-area'
    | 'range-bar';

export abstract class CartesianChartProxy<TSeries extends CartesianChartTypes> extends ChartProxy<
    AgCartesianChartOptions,
    TSeries
> {
    protected constructor(params: ChartProxyParams) {
        super(params);
    }

    protected abstract getAxes(
        params: UpdateParams,
        commonChartOptions: AgCartesianChartOptions
    ): AgCartesianAxisOptions[];

    protected getSeries(_params: UpdateParams): AgCartesianSeriesOptions[] {
        return [];
    }

    protected getUpdateOptions(
        params: UpdateParams,
        commonChartOptions: AgCartesianChartOptions
    ): AgCartesianChartOptions {
        const axes = this.getLocalAxes(params, commonChartOptions);
        const data = this.getData(params, axes);
        const series = this.getLocalSeries(params);

        return {
            ...commonChartOptions,
            data,
            axes,
            series,
        };
    }

    private getLocalAxes(params: UpdateParams, commonChartOptions: AgCartesianChartOptions): AgCartesianAxisOptions[] {
        const axes = this.getAxes(params, commonChartOptions);
        const numberAxis = axes[1];

        // Add a default label formatter to show '%' for normalized charts if none is provided
        if (this.isNormalized() && !numberAxis.label?.formatter) {
            numberAxis.label = { ...numberAxis.label, formatter: (params) => Math.round(params.value) + '%' };
        }

        return axes;
    }

    private getLocalSeries(params: UpdateParams): AgCartesianSeriesOptions[] {
        const series = this.getSeries(params);

        return series.map((s) => ({
            ...(this.isStacked() && { stacked: true }),
            ...(this.isNormalized() && {
                normalizedTo: 100,
            }),
            ...(this.crossFiltering && {
                listeners: {
                    nodeClick: this.crossFilterCallback,
                },
            }),
            ...s,
        })) as unknown as AgCartesianSeriesOptions[];
    }

    protected getData(params: UpdateParams, axes: AgCartesianAxisOptions[]): any[] {
        const supportsCrossFiltering = ['area', 'line'].includes(this.standaloneChartType);
        return this.crossFiltering && supportsCrossFiltering ? params.data : this.getDataTransformedData(params, axes);
    }

    private getDataTransformedData(params: UpdateParams, axes: AgCartesianAxisOptions[]) {
        // assumed that the first axis is always the "category" axis
        const xAxisType = axes[0].type;
        const { categories, data } = params;
        const [category] = categories;
        switch (xAxisType) {
            case 'category':
                return this.transformCategoryData(data, category.id);
            case 'time':
                return this.transformTimeData(data, category.id);
            default:
                return data;
        }
    }

    protected getXAxisType(params: UpdateParams) {
        if (params.grouping) {
            return 'grouped-category';
        } else if (this.isXAxisOfType(params, 'time', (value) => value instanceof Date)) {
            return 'time';
        } else if (this.isXAxisOfType(params, 'number')) {
            return 'number';
        }
        return 'category';
    }

    protected isNormalized() {
        return isNormalized(this.chartType);
    }

    protected isStacked() {
        return isStacked(this.chartType);
    }

    private isXAxisOfType<T>(
        params: UpdateParams,
        type: AgCartesianAxisType,
        isInstance?: (value: T) => boolean
    ): boolean {
        const [category] = params.categories;
        if (category?.chartDataType) {
            return category.chartDataType === type;
        }
        if (!isInstance) {
            return false;
        }
        const testDatum = params.data[0];
        if (!testDatum) {
            return false;
        }
        return isInstance(testDatum[category.id]);
    }

    private transformTimeData(data: any[], categoryKey: string): any[] {
        const firstValue = data[0]?.[categoryKey];
        if (firstValue instanceof Date) {
            return data;
        }

        return data.map((datum) => {
            const value = datum[categoryKey];
            return typeof value === 'string'
                ? {
                      ...datum,
                      [categoryKey]: new Date(value),
                  }
                : datum;
        });
    }

    protected crossFilteringPointSelected(category: string, value: string): boolean {
        return this.selectionModel.isSelected(category, value);
    }

    protected crossFilteringDeselectedPoints(): boolean {
        return this.selectionModel.hasSelection();
    }

    protected crossFilteringAddSelectedPoint(multiSelection: boolean, category: string, value: string): void {
        this.selectionModel.toggleSelection(multiSelection, category, value);
    }

    protected isHorizontal(commonChartOptions: AgCartesianChartOptions): boolean {
        const seriesType = this.standaloneChartType;
        if (seriesType !== 'waterfall' && seriesType !== 'box-plot' && seriesType !== 'range-bar') {
            return false;
        }
        const theme = commonChartOptions.theme;
        const isHorizontal = (theme?: AgChartTheme | AgChartThemeName): boolean => {
            const direction = (
                (theme as AgChartTheme)?.overrides?.[seriesType]?.series as AgRangeBarSeriesThemeableOptions
            )?.direction;
            if (direction != null) {
                return direction === 'horizontal';
            }
            if (typeof (theme as AgChartTheme)?.baseTheme === 'object') {
                return isHorizontal((theme as AgChartTheme).baseTheme as any);
            }
            return false;
        };
        return isHorizontal(theme);
    }
}
