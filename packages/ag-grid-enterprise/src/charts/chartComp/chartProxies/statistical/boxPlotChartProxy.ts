import type { AgBoxPlotSeriesOptions } from 'ag-charts-types';

import type { ChartProxyParams, UpdateParams } from '../chartProxy';
import { StatisticalChartProxy } from './statisticalChartProxy';

export class BoxPlotChartProxy extends StatisticalChartProxy<'box-plot'> {
    public constructor(params: ChartProxyParams) {
        super(params);
    }

    public override getSeries(params: UpdateParams): AgBoxPlotSeriesOptions<any>[] {
        const [category] = params.categories;
        return params.fields.map((field, seriesIndex) => ({
            type: this.standaloneChartType as AgBoxPlotSeriesOptions['type'],
            // xKey/xName refer to category buckets
            xKey: category.id,
            xName: category.name,
            // yName is used to label the series
            yName: field.displayName ?? undefined,
            // custom field labels shown in the tooltip
            minName: 'Min',
            q1Name: 'Q1',
            medianName: 'Median',
            q3Name: 'Q3',
            maxName: 'Max',
            // generated 'synthetic fields' from getData()
            minKey: `min:${seriesIndex}`,
            q1Key: `q1:${seriesIndex}`,
            medianKey: `median:${seriesIndex}`,
            q3Key: `q3:${seriesIndex}`,
            maxKey: `max:${seriesIndex}`,
        }));
    }

    protected override getData(params: UpdateParams): any[] {
        return this.computeSeriesStatistics(params, (seriesValues: number[]): Record<string, number> => {
            const sortedValues = seriesValues.sort((a, b) => a - b);
            return {
                min: sortedValues[0],
                q1: this.quantile(sortedValues, 0.25),
                median: this.quantile(sortedValues, 0.5),
                q3: this.quantile(sortedValues, 0.75),
                max: sortedValues[sortedValues.length - 1],
            };
        });
    }

    private quantile(sortedValues: number[], q: number): number {
        const position = (sortedValues.length - 1) * q;
        const indexBelow = Math.floor(position);
        const aboveValue = position - indexBelow;
        if (sortedValues[indexBelow + 1] !== undefined) {
            return sortedValues[indexBelow] + aboveValue * (sortedValues[indexBelow + 1] - sortedValues[indexBelow]);
        }
        return sortedValues[indexBelow];
    }
}
