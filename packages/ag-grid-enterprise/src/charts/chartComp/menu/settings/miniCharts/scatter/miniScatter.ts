import type { Shape } from 'ag-charts-types/scene';

import type { ChartType } from 'ag-grid-community';

import type { AgChartsExports } from '../../../../../agChartsExports';
import { MiniChartWithAxes } from '../miniChartWithAxes';

export class MiniScatter extends MiniChartWithAxes {
    static chartType: ChartType = 'scatter';
    private readonly points: Shape[];

    constructor(container: HTMLElement, agChartsExports: AgChartsExports, fills: string[], strokes: string[]) {
        super(container, agChartsExports, 'scatterTooltip');

        const {
            size,
            padding,
            agChartsExports: { _Scene },
        } = this;

        // [x, y] pairs
        const data = [
            [
                [0.3, 3],
                [1.1, 0.9],
                [2, 0.4],
                [3.4, 2.4],
            ],
            [
                [0, 0.3],
                [1, 2],
                [2.4, 1.4],
                [3, 0],
            ],
        ];

        const xScale = new _Scene.LinearScale();
        xScale.domain = [-0.5, 4];
        xScale.range = [padding * 2, size - padding];

        const yScale = new _Scene.LinearScale();
        yScale.domain = [-0.5, 3.5];
        yScale.range = [size - padding, padding];

        const points: any[] = [];

        data.forEach((series) => {
            series.forEach(([x, y]) => {
                const arc = new _Scene.Arc();
                arc.strokeWidth = 0;
                arc.centerX = xScale.convert(x);
                arc.centerY = yScale.convert(y);
                arc.radius = 2.5;
                points.push(arc);
            });
        });

        this.points = points;
        this.updateColors(fills, strokes);

        const pointsGroup = new _Scene.Group();
        pointsGroup.setClipRect(new _Scene.BBox(padding, padding, size - padding * 2, size - padding * 2));
        pointsGroup.append(this.points);
        this.root.append(pointsGroup);
    }

    updateColors(fills: string[], strokes: string[]) {
        this.points.forEach((line, i) => {
            line.stroke = strokes[i % strokes.length];
            line.fill = fills[i % fills.length];
        });
    }
}
