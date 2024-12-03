import type {
    AgCartesianChartOptions,
    AgChartThemeOverrides,
    AgHeatmapSeriesOptions,
    AgHeatmapSeriesTooltipRendererParams,
    AgTooltipRendererResult,
} from 'ag-charts-types';

import { flatMap } from '../../utils/array';
import type { ChartProxyParams, UpdateParams } from '../chartProxy';
import { ChartProxy } from '../chartProxy';

export const HEATMAP_CATEGORY_KEY = 'AG-GRID-DEFAULT-HEATMAP-CATEGORY-KEY';
export const HEATMAP_SERIES_KEY = 'AG-GRID-DEFAULT-HEATMAP-SERIES-KEY';
export const HEATMAP_VALUE_KEY = 'AG-GRID-DEFAULT-HEATMAP-VALUE-KEY';

export class HeatmapChartProxy extends ChartProxy<AgCartesianChartOptions, 'heatmap'> {
    public constructor(params: ChartProxyParams) {
        super(params);
    }

    protected getUpdateOptions(
        params: UpdateParams,
        commonChartOptions: AgCartesianChartOptions
    ): AgCartesianChartOptions {
        const xSeriesKey = HEATMAP_SERIES_KEY;
        const xValueKey = HEATMAP_VALUE_KEY;
        const yKey = HEATMAP_CATEGORY_KEY;
        return {
            ...commonChartOptions,
            series: this.getSeries(params, xSeriesKey, xValueKey, yKey),
            data: this.getData(params, xSeriesKey, xValueKey, yKey),
        };
    }

    protected getSeries(
        params: UpdateParams,
        xSeriesKey: string,
        xValueKey: string,
        yKey: string
    ): AgHeatmapSeriesOptions[] {
        const [category] = params.categories;
        return [
            {
                type: this.standaloneChartType as AgHeatmapSeriesOptions['type'],
                // The axis keys reference synthetic fields based on the category values and series column names
                yKey,
                xKey: xSeriesKey,
                // The color key references a synthetic field based on the series column value for a specific cell
                colorKey: xValueKey,
                yName: category.name,
                // We don't know how to label the 'x' series, as it is a synthetic series created from the set of all input columns
                // In future releases we may want to consider inferring the series label from column groupings etc
                xName: undefined,
                colorName: undefined,
            },
        ];
    }

    protected getData(params: UpdateParams, xSeriesKey: string, xValueKey: string, yKey: string): any[] {
        const [category] = params.categories;
        // Heatmap chart expects a flat array of data, with each row representing a single cell in the heatmap
        // This means we need to explode the list of input rows into their individual cells
        return flatMap(params.data, (datum, index) => {
            // We need to create a unique y value object for each row to prevent unintended category grouping
            // when there are multiple rows with the same category value
            const value = datum[category.id];
            const valueString = value == null ? '' : String(value);
            const yValue = { id: index, value, toString: () => valueString };
            // Return a flat list of output data items corresponding to each cell,
            // appending the synthetic series and category fields to the cell data
            return params.fields.map(({ colId, displayName }) => ({
                ...datum,
                [xSeriesKey]: displayName,
                [xValueKey]: datum[colId],
                [yKey]: yValue,
            }));
        });
    }

    protected override getSeriesChartThemeDefaults(): AgChartThemeOverrides['heatmap'] {
        return {
            gradientLegend: {
                gradient: {
                    preferredLength: 200,
                },
            },
            series: {
                tooltip: {
                    renderer: renderHeatmapTooltip,
                },
            },
        };
    }
}

function renderHeatmapTooltip(params: AgHeatmapSeriesTooltipRendererParams<any>): string | AgTooltipRendererResult {
    const { xKey, yKey, colorKey, yName, datum } = params;
    const table: Array<{ label: string; value: string | undefined }> = [
        { label: yName, value: datum[yKey] },
        { label: datum[xKey], value: colorKey && datum[colorKey] },
    ];
    return {
        title: '',
        data: table.map(({ label, value }) => ({ label: String(label), value: String(value) })),
    };
}
