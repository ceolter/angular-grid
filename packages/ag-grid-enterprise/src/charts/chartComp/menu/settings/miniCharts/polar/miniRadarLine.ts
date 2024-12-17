import type { Marker, Path } from 'ag-charts-types/scene';

import type { ChartType } from 'ag-grid-community';

import type { AgChartsExports } from '../../../../../agChartsExports';
import { createPolarPaths } from '../miniChartHelpers';
import { MiniChartWithPolarAxes } from '../miniChartWithPolarAxes';

export class MiniRadarLine extends MiniChartWithPolarAxes {
    static chartType: ChartType = 'radarLine';
    private readonly lines: Path[];
    private readonly markers: Marker[];
    private readonly markerSize: number = 4;

    private data = [
        [8, 7, 8, 7, 8, 8, 7, 8],
        [6, 8, 5, 10, 6, 7, 4, 6],
        [0, 3, 3, 5, 4, 4, 2, 0],
    ];

    constructor(container: HTMLElement, agChartsExports: AgChartsExports, fills: string[], strokes: string[]) {
        super(container, agChartsExports, 'radarLineTooltip');

        this.showRadiusAxisLine = false;

        const { size, padding, root, data } = this;

        const radius = (size - padding * 2) / 2;
        const innerRadius = 0;

        const { paths, markers } = createPolarPaths(
            agChartsExports,
            root,
            data,
            size,
            radius,
            innerRadius,
            this.markerSize
        );

        this.lines = paths;
        this.markers = markers;

        this.updateColors(fills, strokes);
    }

    updateColors(fills: string[], strokes: string[]) {
        this.lines.forEach((line: any, i: number) => {
            const n = this.data[i].length;
            line.stroke = fills[i];
            const startIdx = i * n;
            const endIdx = startIdx + n;
            const markers = this.markers.slice(startIdx, endIdx);
            markers.forEach((marker) => {
                marker.stroke = strokes[i];
                marker.fill = fills[i];
            });
        });
    }
}
