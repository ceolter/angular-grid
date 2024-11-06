import type { _Scene } from 'ag-charts-community';

import type { ChartType } from 'ag-grid-community';

import type { AgChartsContext } from '../../../../../gridChartsModule';
import { createPolarPaths } from '../miniChartHelpers';
import { MiniChartWithPolarAxes } from '../miniChartWithPolarAxes';

export class MiniRadarLine extends MiniChartWithPolarAxes {
    static chartType: ChartType = 'radarLine';
    private readonly lines: _Scene.Path[];
    private readonly markers: _Scene.Circle[];
    private readonly markerSize: number = 4;

    private data = [
        [8, 7, 8, 7, 8, 8, 7, 8],
        [6, 8, 5, 10, 6, 7, 4, 6],
        [0, 3, 3, 5, 4, 4, 2, 0],
    ];

    constructor(container: HTMLElement, agChartsContext: AgChartsContext, fills: string[], strokes: string[]) {
        super(container, agChartsContext, 'radarLineTooltip');

        this.showRadiusAxisLine = false;

        const radius = (this.size - this.padding * 2) / 2;
        const innerRadius = 0;

        const { paths, markers } = createPolarPaths(
            this.agChartsContext,
            this.root,
            this.data,
            this.size,
            radius,
            innerRadius,
            this.markerSize
        );

        this.lines = paths;
        this.markers = markers;

        this.updateColors(fills, strokes);
    }

    updateColors(fills: string[], strokes: string[]) {
        this.lines.forEach((line: _Scene.Path, i: number) => {
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
