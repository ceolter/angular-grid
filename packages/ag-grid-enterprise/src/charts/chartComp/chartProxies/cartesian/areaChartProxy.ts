import type { AgAreaSeriesOptions } from 'ag-charts-types';

import type { ChartProxyParams, UpdateParams } from '../chartProxy';
import { CROSS_FILTER_MARKER_FILL_OPACITY_FACTOR } from './constants';
import { ContinuousChartProxy } from './continuousChartProxy';

export class AreaChartProxy extends ContinuousChartProxy<'area'> {
    public constructor(params: ChartProxyParams) {
        super(params);
    }

    protected override applyCrossFilter(series: AgAreaSeriesOptions[], params: UpdateParams) {
        const anySelected = this.selectionModel.hasSelection();
        return super.applyCrossFilter(series, params).map((s) => ({
            fillOpacity: anySelected ? CROSS_FILTER_MARKER_FILL_OPACITY_FACTOR : 1,
            ...s,
        }));
    }
}
