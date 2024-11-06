import type { _Scene } from 'ag-charts-community';

import type { ChartType } from 'ag-grid-community';

import type { AgChartsContext } from '../../../../../gridChartsModule';
import { MiniChartWithAxes } from '../miniChartWithAxes';

export class MiniRangeBar extends MiniChartWithAxes {
    static chartType: ChartType = 'rangeBar';

    private readonly bars: _Scene.Rect[];

    constructor(container: HTMLElement, agChartsContext: AgChartsContext, fills: string[], strokes: string[]) {
        super(container, agChartsContext, 'rangeBarTooltip');
        const data = [3, 3.5, 3];

        this.bars = this.createRangeBar(this.root, data, this.size, this.padding, 'vertical');
        this.updateColors(fills, strokes);
    }

    updateColors(fills: string[], strokes: string[]) {
        this.bars.forEach((bar, i) => {
            bar.fill = fills[i];
            bar.stroke = strokes[i];
        });
    }

    createRangeBar(
        root: _Scene.Group,
        data: number[],
        size: number,
        padding: number,
        direction: 'horizontal' | 'vertical'
    ): _Scene.Rect[] {
        const barAlongX = direction === 'horizontal';
        const scalePadding = 2 * padding;

        const xScale = new this.agChartsContext._Scene.BandScale<number>();
        xScale.domain = data.map((_, index) => index);
        xScale.range = [padding, size - padding];
        xScale.paddingInner = 0.3;
        xScale.paddingOuter = 0.3;

        const lowRatio = 0.7;
        const highRatio = 1.3;

        const yScale = new this.agChartsContext._Scene.LinearScale();
        yScale.domain = [
            data.reduce((a, b) => Math.min(a, b), Infinity) * lowRatio,
            data.reduce((a, b) => Math.max(a, b), 0) * highRatio,
        ];
        yScale.range = [scalePadding, size - scalePadding];

        const width = xScale.bandwidth;

        const bars = data.map((datum, i) => {
            const [low, high] = [datum * lowRatio, datum * highRatio];

            const x = xScale.convert(i);
            const y = yScale.convert(low);
            const height = yScale.convert(high) - y;

            const rect = new this.agChartsContext._Scene.Rect();
            rect.x = barAlongX ? y : x;
            rect.y = barAlongX ? x : y;
            rect.width = barAlongX ? height : width;
            rect.height = barAlongX ? width : height;
            rect.strokeWidth = 0;
            rect.crisp = true;

            return rect;
        });

        root.append(bars);

        return bars;
    }
}
