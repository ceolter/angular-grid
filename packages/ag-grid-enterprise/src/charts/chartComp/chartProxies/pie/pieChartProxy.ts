import type {
    AgDonutSeriesOptions,
    AgPieSeriesOptions,
    AgPolarChartOptions,
    AgPolarSeriesOptions,
} from 'ag-charts-types';

import type { ChartProxyParams, FieldDefinition, UpdateParams } from '../chartProxy';
import { ChartProxy } from '../chartProxy';

interface DonutOffset {
    offsetAmount: number;
    currentOffset: number;
}

function calculateOffsets(offset: DonutOffset) {
    const outerRadiusOffset = offset.currentOffset;
    offset.currentOffset -= offset.offsetAmount;

    const innerRadiusOffset = offset.currentOffset;
    offset.currentOffset -= offset.offsetAmount;

    return { outerRadiusOffset, innerRadiusOffset };
}

export class PieChartProxy extends ChartProxy<AgPolarChartOptions, 'pie' | 'donut'> {
    public constructor(params: ChartProxyParams) {
        super(params);
    }

    protected getUpdateOptions(params: UpdateParams, commonChartOptions: AgPolarChartOptions): AgPolarChartOptions {
        return {
            ...commonChartOptions,
            data: this.crossFiltering ? this.getCrossFilterData(params) : params.data,
            series: this.getSeries(params),
        };
    }

    private getSeries(params: UpdateParams): AgPolarSeriesOptions[] {
        const [category] = params.categories;
        const numFields = params.fields.length;

        const offset = {
            currentOffset: 0,
            offsetAmount: numFields > 1 ? 20 : 40,
        };

        const series: (AgPieSeriesOptions | AgDonutSeriesOptions)[] = this.getFields(params).map(
            (f: FieldDefinition) => {
                // options shared by 'pie' and 'donut' charts
                const options = {
                    type: this.standaloneChartType as AgPieSeriesOptions['type'],
                    angleKey: f.colId,
                    angleName: f.displayName!,
                    sectorLabelKey: f.colId,
                    calloutLabelName: category.name,
                    calloutLabelKey: category.id,
                };

                if (this.chartType === 'donut' || this.chartType === 'doughnut') {
                    const { outerRadiusOffset, innerRadiusOffset } = calculateOffsets(offset);
                    const title = f.displayName
                        ? {
                              title: { text: f.displayName, showInLegend: numFields > 1 },
                          }
                        : undefined;

                    // augment shared options with 'donut' specific options
                    return {
                        ...options,
                        type: 'donut',
                        outerRadiusOffset,
                        innerRadiusOffset,
                        ...title,
                        calloutLine: {
                            colors: this.getChartPalette()?.strokes,
                        },
                    };
                }

                return options;
            }
        );

        return this.crossFiltering ? this.extractCrossFilterSeries(series) : series;
    }

    private getCrossFilterData(params: UpdateParams) {
        const colId = params.fields[0].colId;
        const filteredOutColId = `${colId}-filtered-out`;

        return params.data.map((d) => {
            const total = d[colId] + d[filteredOutColId];
            d[`${colId}-total`] = total;
            d[filteredOutColId] = 1; // normalise to 1
            d[colId] = d[colId] / total; // fraction of 1
            return d;
        });
    }

    private extractCrossFilterSeries(series: (AgPieSeriesOptions | AgDonutSeriesOptions)[]) {
        const palette = this.getChartPalette();

        const primaryOptions = (seriesOptions: AgPieSeriesOptions | AgDonutSeriesOptions) => {
            return {
                ...seriesOptions,
                legendItemKey: seriesOptions.calloutLabelKey,
                calloutLabel: { enabled: false }, // hide labels on primary series
                highlightStyle: { item: { fill: undefined } },
                radiusKey: seriesOptions.angleKey,
                angleKey: seriesOptions.angleKey + '-total',
                radiusMin: 0,
                radiusMax: 1,
                listeners: {
                    nodeClick: this.crossFilterCallback,
                },
            };
        };

        const filteredOutOptions = (seriesOptions: AgPieSeriesOptions | AgDonutSeriesOptions, angleKey: string) => {
            return {
                ...primaryOpts,
                radiusKey: angleKey + '-filtered-out',
                fills: this.changeOpacity(seriesOptions.fills ?? palette?.fills ?? [], 0.3),
                strokes: this.changeOpacity(seriesOptions.strokes ?? palette?.strokes ?? [], 0.3),
                showInLegend: false,
            };
        };

        // currently, only single 'donut' cross-filter series are supported
        const primarySeries = series[0];

        // update primary series
        const angleKey = primarySeries.angleKey!;
        const primaryOpts = primaryOptions(primarySeries);

        return [filteredOutOptions(primaryOptions(primarySeries), angleKey), primaryOpts];
    }

    private getFields(params: UpdateParams): FieldDefinition[] {
        // pie charts only support a single series, donut charts support multiple series
        return this.chartType === 'pie' ? params.fields.slice(0, 1) : params.fields;
    }

    private changeOpacity(fills: string[], alpha: number) {
        const Color = this.agChartsExports._Util.Color;
        return fills.map((fill) => {
            const c = Color.fromString(fill);
            return new Color(c.r, c.g, c.b, alpha).toHexString();
        });
    }
}
