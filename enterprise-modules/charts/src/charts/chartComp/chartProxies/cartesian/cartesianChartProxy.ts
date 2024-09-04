import type {
    AgCartesianAxisOptions,
    AgCartesianAxisType,
    AgCartesianChartOptions,
    AgCartesianSeriesOptions,
    AgChartTheme,
    AgChartThemeName,
    AgRangeBarSeriesThemeableOptions,
} from 'ag-charts-community';

import type { ChartProxyParams, UpdateParams } from '../chartProxy';
import { ChartProxy } from '../chartProxy';

export abstract class CartesianChartProxy<
    TSeries extends
        | 'area'
        | 'bar'
        | 'histogram'
        | 'line'
        | 'scatter'
        | 'bubble'
        | 'waterfall'
        | 'box-plot'
        | 'range-area'
        | 'range-bar',
> extends ChartProxy<AgCartesianChartOptions, TSeries> {
    protected crossFilteringAllPoints = new Set<string>();
    protected crossFilteringSelectedPoints: string[] = [];

    protected constructor(params: ChartProxyParams) {
        super(params);
    }

    protected abstract getAxes(
        params: UpdateParams,
        commonChartOptions: AgCartesianChartOptions
    ): AgCartesianAxisOptions[];
    protected abstract getSeries(params: UpdateParams): AgCartesianSeriesOptions[];

    protected getUpdateOptions(
        params: UpdateParams,
        commonChartOptions: AgCartesianChartOptions
    ): AgCartesianChartOptions {
        const axes = this.getAxes(params, commonChartOptions);

        return {
            ...commonChartOptions,
            data: this.getData(params, axes),
            axes,
            series: this.getSeries(params),
        };
    }

    protected getData(params: UpdateParams, axes: AgCartesianAxisOptions[]): any[] {
        return this.getDataTransformedData(params, axes);
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
