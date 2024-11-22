import type { Group } from 'ag-charts-types/scene';

import type { ChartType } from 'ag-grid-community';

import type { AgChartsExports } from '../../../../../agChartsExports';
import { accumulateData } from '../miniChartHelpers';
import { MiniChartWithPolarAxes } from '../miniChartWithPolarAxes';

export class MiniRadialBar extends MiniChartWithPolarAxes {
    static chartType: ChartType = 'radialBar';
    private readonly series: Group[];

    private data = [
        [6, 8, 10],
        [4, 4, 3],
        [5, 4, 2],
    ];

    constructor(container: HTMLElement, agChartsExports: AgChartsExports, fills: string[], strokes: string[]) {
        super(container, agChartsExports, 'radialBarTooltip');

        this.showRadiusAxisLine = false;

        const {
            size,
            padding,
            data,
            agChartsExports: { _Scene },
        } = this;

        const radius = (size - padding) / 2;
        const innerRadiusRatio = 0.4;
        const innerRadius = radius * innerRadiusRatio;

        const radiusScale = new _Scene.BandScale();
        radiusScale.domain = data[0].map((_, index) => index);
        radiusScale.range = [innerRadius, radius];
        radiusScale.paddingInner = 0.5;
        radiusScale.paddingOuter = 0;
        const bandwidth = radiusScale.bandwidth;

        const { processedData, max } = accumulateData(data);

        const angleScale = new _Scene.LinearScale();
        angleScale.domain = [0, Math.ceil(max * 1.5)];
        const start = (3 / 2) * Math.PI;
        const end = start + 2 * Math.PI;
        angleScale.range = [start, end];

        const center = size / 2;
        this.series = processedData.map((series, index) => {
            const previousSeries = index < 0 ? undefined : processedData[index - 1];

            const seriesGroup = new _Scene.Group({ zIndex: 1000_000 });
            const seriesSectors = series.map((datum: number, i: number) => {
                const previousDatum = previousSeries?.[i] ?? 0;

                const outerRadius = radiusScale.convert(i);
                const innerRadius = outerRadius - bandwidth;
                const startAngle = angleScale.convert(previousDatum);
                const endAngle = angleScale.convert(datum);

                const sector = new _Scene.Sector();
                sector.centerX = center;
                sector.centerY = center;
                sector.innerRadius = innerRadius;
                sector.outerRadius = outerRadius;
                sector.startAngle = startAngle;
                sector.endAngle = endAngle;
                sector.stroke = undefined;
                sector.strokeWidth = 0;
                return sector;
            });

            seriesGroup.append(seriesSectors);

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
