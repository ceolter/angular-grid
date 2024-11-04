import type { AgBarSeriesOptions, AgCartesianAxisOptions } from 'ag-charts-types';

import { CROSS_FILTER_FIELD_POSTFIX } from '../../crossfilter/crossFilterApi';
import type { ChartProxyParams, UpdateParams } from '../chartProxy';
import { CartesianChartProxy } from './cartesianChartProxy';

const HORIZONTAL_CHART_TYPES = new Set(['bar', 'groupedBar', 'stackedBar', 'normalizedBar']);

export class BarChartProxy extends CartesianChartProxy<'bar'> {
    public constructor(params: ChartProxyParams) {
        super(params);
    }

    protected override getAxes(params: UpdateParams): AgCartesianAxisOptions[] {
        const axes: AgCartesianAxisOptions[] = [
            {
                type: this.getXAxisType(params),
                position: this.isHorizontal() ? 'left' : 'bottom',
            },
            {
                type: 'number',
                position: this.isHorizontal() ? 'bottom' : 'left',
            },
        ];

        return axes;
    }

    protected override getSeries(params: UpdateParams): AgBarSeriesOptions[] {
        const [category] = params.categories;
        const series: AgBarSeriesOptions[] = params.fields.map(
            (field) =>
                ({
                    type: this.standaloneChartType,
                    direction: this.isHorizontal() ? 'horizontal' : 'vertical',
                    xKey: category.id,
                    xName: category.name,
                    yKey: field.colId,
                    yName: field.displayName,
                    ...(this.crossFiltering && {
                        yFilterKey: `${field.colId}${CROSS_FILTER_FIELD_POSTFIX}`,
                    }),
                }) as AgBarSeriesOptions
        );

        return series;
    }

    protected override isHorizontal(): boolean {
        return HORIZONTAL_CHART_TYPES.has(this.chartType);
    }
}
