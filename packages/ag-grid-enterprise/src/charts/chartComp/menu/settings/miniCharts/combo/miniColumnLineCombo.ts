import type { _Scene } from 'ag-charts-community';

import type { ChartType } from 'ag-grid-community';

import type { AgChartsContext } from '../../../../../gridChartsModule';
import type { CreateColumnRectsParams } from '../miniChartHelpers';
import { createColumnRects, createLinePaths } from '../miniChartHelpers';
import { MiniChartWithAxes } from '../miniChartWithAxes';

export class MiniColumnLineCombo extends MiniChartWithAxes {
    static chartType: ChartType = 'columnLineCombo';

    private columns: _Scene.Rect[];
    private lines: _Scene.Path[];

    private columnData = [3, 4];

    private lineData = [[5, 4, 6, 5, 4]];

    constructor(container: HTMLElement, agChartsContext: AgChartsContext, fills: string[], strokes: string[]) {
        super(container, agChartsContext, 'columnLineComboTooltip');

        const { root, columnData, lineData, size, padding } = this;

        this.columns = createColumnRects({
            stacked: false,
            root,
            data: columnData,
            size,
            padding,
            xScaleDomain: [0, 1],
            yScaleDomain: [0, 4],
            xScalePadding: 0.5,
        } as CreateColumnRectsParams);

        root.append(this.columns);

        this.lines = createLinePaths(this.agChartsContext, root, lineData, size, padding);

        this.updateColors(fills, strokes);
    }

    updateColors(fills: string[], strokes: string[]) {
        this.columns.forEach((bar: _Scene.Rect, i: number) => {
            bar.fill = fills[i];
            bar.stroke = strokes[i];
        });

        this.lines.forEach((line: _Scene.Path, i: number) => {
            line.stroke = fills[i + 2];
        });
    }
}
