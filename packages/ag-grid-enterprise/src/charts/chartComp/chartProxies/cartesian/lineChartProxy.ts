import type { AgAreaSeriesOptions, AgLineSeriesOptions } from 'ag-charts-types';

import type { ChartProxyParams, UpdateParams } from '../chartProxy';
import { CROSS_FILTER_MARKER_STROKE_OPACITY_FACTOR } from './constants';
import { ContinuousChartProxy } from './continuousChartProxy';

export class LineChartProxy extends ContinuousChartProxy<'line'> {
    public constructor(params: ChartProxyParams) {
        super(params);
    }

    protected override applyCrossFilter(series: (AgLineSeriesOptions | AgAreaSeriesOptions)[], params: UpdateParams) {
        const anySelected = this.selectionModel.hasSelection();

        return super.applyCrossFilter(series, params).map((s) => ({
            strokeOpacity: anySelected ? CROSS_FILTER_MARKER_STROKE_OPACITY_FACTOR : 1,
            ...s,
        }));
    }
}
