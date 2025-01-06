import type { Group } from 'ag-charts-types/scene';

import type { ChartType } from 'ag-grid-community';

import type { AgChartsExports } from '../../../../../agChartsExports';
import { accumulateData } from '../miniChartHelpers';
import { MiniChartWithPolarAxes } from '../miniChartWithPolarAxes';

export class MiniRadialColumn extends MiniChartWithPolarAxes {
    static chartType: ChartType = 'radialColumn';
    private readonly series: Group[];

    private data = [
        [6, 8, 10, 2, 6, 5],
        [4, 4, 3, 6, 4, 4],
        [5, 4, 2, 9, 8, 9],
    ];

    constructor(container: HTMLElement, agChartsExports: AgChartsExports, fills: string[], strokes: string[]) {
        super(container, agChartsExports, 'radialColumnTooltip');

        this.showRadiusAxisLine = false;

        const {
            padding,
            size,
            data,
            agChartsExports: { _Scene },
        } = this;
        const radius = (size - padding * 2) / 2;
        const innerRadiusRatio = 0.4;
        const axisInnerRadius = radius * innerRadiusRatio;

        const angleScale = new _Scene.CategoryScale();
        angleScale.domain = data[0].map((_, index) => index);
        angleScale.range = [0, 2 * Math.PI];
        angleScale.paddingInner = 0;
        angleScale.paddingOuter = 0;
        const bandwidth = angleScale.bandwidth * 0.7;

        const { processedData, max } = accumulateData(data);

        const radiusScale = new _Scene.LinearScale();
        radiusScale.domain = [0, max];
        radiusScale.range = [axisInnerRadius, radius];

        const center = this.size / 2;
        this.series = processedData.map((series, seriesIndex) => {
            const firstSeries = seriesIndex === 0;
            const previousSeries = firstSeries ? undefined : processedData[seriesIndex - 1];

            const seriesGroup = new _Scene.TranslatableGroup({ zIndex: 1000_000 });
            const seriesColumns = series.map((datum: number, i: number) => {
                const previousDatum = previousSeries?.[i];
                const outerRadius = radiusScale.convert(datum);
                const innerRadius = radiusScale.convert(previousDatum ?? 0);
                const startAngle = angleScale.convert(i);
                const endAngle = startAngle + bandwidth;

                const columnWidth = _Scene.getRadialColumnWidth(startAngle, endAngle, radius, 0.5, 0.5);

                const column = new _Scene.RadialColumnShape();

                column.columnWidth = columnWidth;
                column.innerRadius = innerRadius;
                column.outerRadius = outerRadius;
                column.startAngle = startAngle;
                column.endAngle = endAngle;
                column.isBeveled = true;
                column.axisInnerRadius = axisInnerRadius;
                column.axisOuterRadius = radius;

                column.stroke = undefined;
                column.strokeWidth = 0;

                return column;
            });

            seriesGroup.append(seriesColumns);

            seriesGroup.translationX = center;
            seriesGroup.translationY = center;

            return seriesGroup;
        });

        this.root.append(this.series);

        this.updateColors(fills, strokes);
    }

    updateColors(fills: string[], strokes: string[]) {
        this.series.forEach((group, i) => {
            for (const sector of group.children() as Iterable<any>) {
                sector.fill = fills[i % fills.length];
                sector.stroke = strokes[i % strokes.length];
            }
        });
    }
}
