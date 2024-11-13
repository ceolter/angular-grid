import type { ChartType } from 'ag-grid-community';

import type { AgChartsExports } from '../../../../../agChartsExports';
import type { ChartTranslationKey } from '../../../../services/chartTranslationService';
import type { ThemeTemplateParameters } from '../../miniChartsContainer';
import { createLinePaths } from '../miniChartHelpers';
import { MiniChartWithAxes } from '../miniChartWithAxes';

export class MiniLine extends MiniChartWithAxes {
    static chartType: ChartType = 'line';

    protected lines: any[];

    static readonly data = [
        [1, 3, 5],
        [2, 6, 4],
        [5, 3, 1],
    ];

    constructor(
        container: HTMLElement,
        agChartsExports: AgChartsExports,
        fills: string[],
        strokes: string[],
        _themeTemplateParameters: ThemeTemplateParameters,
        _isCustomTheme: boolean,
        data: number[][] = MiniLine.data,
        tooltipName: ChartTranslationKey = 'lineTooltip'
    ) {
        super(container, agChartsExports, tooltipName);

        const { size, padding, root } = this;
        this.lines = createLinePaths(agChartsExports, root, data, size, padding);

        this.updateColors(fills, strokes);
    }

    updateColors(fills: string[], _strokes: string[]) {
        this.lines.forEach((line: any, i: number) => {
            line.stroke = fills[i];
        });
    }
}
