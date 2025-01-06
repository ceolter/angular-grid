import type { Group } from 'ag-charts-types/scene';

import type { ChartType } from 'ag-grid-community';

import type { AgChartsExports } from '../../../../../agChartsExports';
import { accumulateData } from '../miniChartHelpers';
import { MiniChartWithPolarAxes } from '../miniChartWithPolarAxes';

export class MiniNightingale extends MiniChartWithPolarAxes {
    static chartType: ChartType = 'nightingale';
    private readonly series: Group[];

    private data = [
        [6, 10, 9, 8, 7, 8],
        [4, 6, 5, 4, 5, 5],
        [3, 5, 4, 3, 4, 7],
    ];

    constructor(container: HTMLElement, agChartsExports: AgChartsExports, fills: string[], strokes: string[]) {
        super(container, agChartsExports, 'nightingaleTooltip');

        this.showRadiusAxisLine = false;
        const {
            size,
            padding,
            data,
            agChartsExports: { _Scene },
        } = this;

        const radius = (size - padding * 2) / 2;

        const angleScale = new _Scene.CategoryScale();
        angleScale.domain = data[0].map((_, index) => index);
        angleScale.range = [-Math.PI, Math.PI];
        angleScale.paddingInner = 0;
        angleScale.paddingOuter = 0;
        const bandwidth = angleScale.bandwidth * 0.7;

        const { processedData, max } = accumulateData(data);

        const radiusScale = new _Scene.LinearScale();
        radiusScale.domain = [0, max];
        radiusScale.range = [0, radius];

        const center = size / 2;
        this.series = processedData.map((series, index) => {
            const previousSeries = index < 0 ? undefined : processedData[index - 1];

            const seriesGroup = new _Scene.Group({ zIndex: 1000_000 });
            const seriesSectors = series.map((datum: number, i: number) => {
                const previousDatum = previousSeries?.[i];
                const outerRadius = radiusScale.convert(datum);
                const innerRadius = radiusScale.convert(previousDatum ?? 0);
                const startAngle = angleScale.convert(i);
                const endAngle = startAngle + bandwidth;

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
