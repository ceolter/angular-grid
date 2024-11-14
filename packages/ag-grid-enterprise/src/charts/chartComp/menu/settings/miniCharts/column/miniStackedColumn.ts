import type { ChartType } from 'ag-grid-community';

import type { AgChartsExports } from '../../../../../agChartsExports';
import type { ChartTranslationKey } from '../../../../services/chartTranslationService';
import type { ThemeTemplateParameters } from '../../miniChartsContainer';
import { createColumnRects } from '../miniChartHelpers';
import { MiniChartWithAxes } from '../miniChartWithAxes';

export class MiniStackedColumn extends MiniChartWithAxes {
    static chartType: ChartType = 'stackedColumn';

    private readonly stackedColumns: any[][];

    static data = [
        [8, 12, 16],
        [6, 9, 12],
        [2, 3, 4],
    ];

    constructor(
        container: HTMLElement,
        agChartsExports: AgChartsExports,
        fills: string[],
        strokes: string[],
        _themeTemplateParameters: ThemeTemplateParameters,
        _isCustomTheme: boolean,
        data = MiniStackedColumn.data,
        yScaleDomain = [0, 16],
        tooltipName: ChartTranslationKey = 'stackedColumnTooltip'
    ) {
        super(container, agChartsExports, tooltipName);

        const { root, size, padding } = this;

        this.stackedColumns = createColumnRects({
            stacked: true,
            root,
            data,
            size,
            padding,
            xScaleDomain: [0, 1, 2],
            yScaleDomain,
            xScalePadding: 0.3,
            agChartsExports,
        });

        root.append(([] as any[]).concat.apply([], this.stackedColumns));

        this.updateColors(fills, strokes);
    }

    updateColors(fills: string[], strokes: string[]) {
        this.stackedColumns.forEach((series: any[], i: number) =>
            series.forEach((column) => {
                column.fill = fills[i];
                column.stroke = strokes[i];
            })
        );
    }
}
