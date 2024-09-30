import type {
    AgDonutSeriesOptions,
    AgPieSeriesOptions,
    AgPolarChartOptions,
    AgPolarSeriesOptions,
} from 'ag-charts-community';

import { CROSS_FILTER_FIELD_POSTFIX } from '../../crossfilter/crossFilterAPI';
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
            data: params.data,
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
                    calloutLabel: { enabled: false }, // hide labels on primary series
                    highlightStyle: { item: { fill: undefined } },
                    ...(this.crossFiltering && {
                        angleFilterKey: `${f.colId}${CROSS_FILTER_FIELD_POSTFIX}`,
                        listeners: {
                            nodeClick: this.crossFilterCallback,
                        },
                    }),
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

    private extractCrossFilterSeries(series: (AgPieSeriesOptions | AgDonutSeriesOptions)[]) {
        return series.map((seriesOptions) => ({
            ...seriesOptions,
        }));
    }

    private getFields(params: UpdateParams): FieldDefinition[] {
        // pie charts only support a single series, donut charts support multiple series
        return this.chartType === 'pie' ? params.fields.slice(0, 1) : params.fields;
    }

    public override getCategoryKey(): string {
        return 'calloutLabelKey';
    }
}
