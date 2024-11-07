import type { ChartType } from 'ag-grid-community';

import type { AgChartsContext } from '../../../../../gridChartsModule';
import { MiniChartWithAxes } from '../miniChartWithAxes';

export class MiniScatter extends MiniChartWithAxes {
    static chartType: ChartType = 'scatter';
    private readonly points: any[];

    constructor(container: HTMLElement, agChartsContext: AgChartsContext, fills: string[], strokes: string[]) {
        super(container, agChartsContext, 'scatterTooltip');

        const size = this.size;
        const padding = this.padding;

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

        const xScale = new this.agChartsContext._Scene.LinearScale();
        xScale.domain = [-0.5, 4];
        xScale.range = [padding * 2, size - padding];

        const yScale = new this.agChartsContext._Scene.LinearScale();
        yScale.domain = [-0.5, 3.5];
        yScale.range = [size - padding, padding];

        const points: any[] = [];

        data.forEach((series) => {
            series.forEach(([x, y]) => {
                const arc = new this.agChartsContext._Scene.Arc();
                arc.strokeWidth = 0;
                arc.centerX = xScale.convert(x);
                arc.centerY = yScale.convert(y);
                arc.radius = 2.5;
                points.push(arc);
            });
        });

        this.points = points;
        this.updateColors(fills, strokes);

        const pointsGroup = new this.agChartsContext._Scene.Group();
        pointsGroup.setClipRect(
            new this.agChartsContext._Scene.BBox(padding, padding, size - padding * 2, size - padding * 2)
        );
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
