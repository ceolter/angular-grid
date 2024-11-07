import type { ChartType } from 'ag-grid-community';

import type { AgChartsContext } from '../../../../../gridChartsModule';
import { MiniChartWithAxes } from '../miniChartWithAxes';

export class MiniBubble extends MiniChartWithAxes {
    static chartType: ChartType = 'bubble';
    private readonly points: any[];

    constructor(container: HTMLElement, agChartsContext: AgChartsContext, fills: string[], strokes: string[]) {
        super(container, agChartsContext, 'bubbleTooltip');

        const size = this.size;
        const padding = this.padding;

        // [x, y, radius] triples
        const data = [
            [
                [0.1, 0.3, 5],
                [0.5, 0.4, 7],
                [0.2, 0.8, 7],
            ],
            [
                [0.8, 0.7, 5],
                [0.7, 0.3, 9],
            ],
        ];

        const xScale = new this.agChartsContext._Scene.LinearScale();
        xScale.domain = [0, 1];
        xScale.range = [padding * 2, size - padding];

        const yScale = new this.agChartsContext._Scene.LinearScale();
        yScale.domain = [0, 1];
        yScale.range = [size - padding, padding];

        const points: any[] = [];

        data.forEach((series) => {
            series.forEach(([x, y, radius]) => {
                const arc = new this.agChartsContext._Scene.Arc();
                arc.strokeWidth = 0;
                arc.centerX = xScale.convert(x);
                arc.centerY = yScale.convert(y);
                arc.radius = radius;
                arc.fillOpacity = 0.7;
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
