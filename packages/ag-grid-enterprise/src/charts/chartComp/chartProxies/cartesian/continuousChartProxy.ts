import type { AgCartesianAxisOptions, AgCartesianSeriesOptions } from 'ag-charts-types';

import { CROSS_FILTER_FIELD_POSTFIX } from '../../crossfilter/crossFilterApi';
import type { ChartProxyParams, UpdateParams } from '../chartProxy';
import { CartesianChartProxy } from './cartesianChartProxy';
import type { CartesianChartTypes } from './cartesianChartProxy';
import { FULLY_OPAQUE, FULLY_TRANSPARENT, ITEM_HIGHLIGHT_SIZE } from './constants';

export class ContinuousChartProxy<T extends CartesianChartTypes> extends CartesianChartProxy<T> {
    public constructor(params: ChartProxyParams) {
        super(params);
    }

    protected override getAxes(params: UpdateParams): AgCartesianAxisOptions[] {
        return [
            {
                type: this.getXAxisType(params),
                position: 'bottom',
            },
            {
                type: 'number',
                position: 'left',
            },
        ];
    }

    protected override getSeries(params: UpdateParams): AgCartesianSeriesOptions[] {
        const [category] = params.categories;
        const selectionSource = params.chartId === params.getCrossFilteringContext().lastSelectedChartId;

        const series: any[] = params.fields.map((f) => ({
            type: this.standaloneChartType,
            xKey: category.id,
            xName: category.name,
            yKey: f.colId,
            yName: f.displayName,
            ...(this.crossFiltering && !selectionSource && { yKey: `${f.colId}${CROSS_FILTER_FIELD_POSTFIX}` }),
        }));

        return this.crossFiltering ? this.applyCrossFilter(series, params) : series;
    }

    protected applyCrossFilter(series: any[], params: UpdateParams): AgCartesianSeriesOptions[] {
        const [category] = params.categories;

        const anySelected = this.selectionModel.hasSelection();

        return series.map((s) => ({
            listeners: {
                nodeClick: this.crossFilterCallback,
            },
            marker: {
                itemStyler: ({ highlighted, fill, size, datum }: any) => ({
                    fill: highlighted ? 'yellow' : fill,
                    fillOpacity:
                        anySelected && !highlighted && !this.selectionModel.isSelected(category.id, datum[category.id])
                            ? FULLY_TRANSPARENT
                            : FULLY_OPAQUE,
                    size: highlighted ? ITEM_HIGHLIGHT_SIZE : size,
                }),
            },
            ...s,
        }));
    }
}
