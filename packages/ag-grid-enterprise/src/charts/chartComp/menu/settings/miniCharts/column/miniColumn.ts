import type { ChartType } from 'ag-grid-community';

import type { AgChartsExports } from '../../../../../agChartsExports';
import type { CreateColumnRectsParams } from '../miniChartHelpers';
import { createColumnRects } from '../miniChartHelpers';
import { MiniChartWithAxes } from '../miniChartWithAxes';

export class MiniColumn extends MiniChartWithAxes {
    static chartType: ChartType = 'groupedColumn';

    private readonly columns: any[];

    private columnData = [2, 3, 4];

    constructor(container: HTMLElement, agChartsExports: AgChartsExports, fills: string[], strokes: string[]) {
        super(container, agChartsExports, 'groupedColumnTooltip');

        const { root, columnData, size, padding } = this;

        this.columns = createColumnRects({
            stacked: false,
            root,
            data: columnData,
            size,
            padding,
            xScaleDomain: [0, 1, 2],
            yScaleDomain: [0, 4],
            xScalePadding: 0.3,
        } as CreateColumnRectsParams);

        root.append(this.columns);

        this.updateColors(fills, strokes);
    }

    updateColors(fills: string[], strokes: string[]) {
        this.columns.forEach((column: any, i) => {
            column.fill = fills[i];
            column.stroke = strokes[i];
        });
    }
}
