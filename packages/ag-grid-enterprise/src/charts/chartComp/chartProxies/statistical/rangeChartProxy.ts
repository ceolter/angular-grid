import type { AgRangeAreaSeriesOptions } from 'ag-charts-types';

import type { ChartProxyParams, UpdateParams } from '../chartProxy';
import { StatisticalChartProxy } from './statisticalChartProxy';

export class RangeChartProxy extends StatisticalChartProxy<'range-bar' | 'range-area'> {
    public constructor(params: ChartProxyParams) {
        super(params);
    }

    public override getSeries(params: UpdateParams): AgRangeAreaSeriesOptions<any>[] {
        const [category] = params.categories;
        return params.fields.map((field, seriesIndex) => ({
            type: this.standaloneChartType as AgRangeAreaSeriesOptions['type'],
            // xKey/xName refer to category buckets
            xKey: category.id,
            xName: category.name,
            // yName is used to label the series
            yName: field.displayName ?? undefined,
            // custom field labels shown in the tooltip
            yLowName: 'Min',
            yHighName: 'Max',
            // generated 'synthetic fields' from getData()
            yLowKey: `min:${seriesIndex}`,
            yHighKey: `max:${seriesIndex}`,
        }));
    }

    protected override getData(params: UpdateParams): any[] {
        return this.computeSeriesStatistics(params, (seriesValues: number[]): Record<string, number> => {
            return {
                min: Math.min(...seriesValues),
                max: Math.max(...seriesValues),
            };
        });
    }
}
