import type { ChartType } from 'ag-grid-community';

import type { AgChartsExports } from '../../../../../agChartsExports';
import type { CreateColumnRectsParams } from '../miniChartHelpers';
import { createColumnRects, createLinePaths } from '../miniChartHelpers';
import { MiniChartWithAxes } from '../miniChartWithAxes';

export class MiniColumnLineCombo extends MiniChartWithAxes {
    static chartType: ChartType = 'columnLineCombo';

    private columns: any[];
    private lines: any[];

    private columnData = [3, 4];

    private lineData = [[5, 4, 6, 5, 4]];

    constructor(container: HTMLElement, agChartsExports: AgChartsExports, fills: string[], strokes: string[]) {
        super(container, agChartsExports, 'columnLineComboTooltip');

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

        this.lines = createLinePaths(agChartsExports, root, lineData, size, padding);

        this.updateColors(fills, strokes);
    }

    updateColors(fills: string[], strokes: string[]) {
        this.columns.forEach((bar: any, i: number) => {
            bar.fill = fills[i];
            bar.stroke = strokes[i];
        });

        this.lines.forEach((line: any, i: number) => {
            line.stroke = fills[i + 2];
        });
    }
}
