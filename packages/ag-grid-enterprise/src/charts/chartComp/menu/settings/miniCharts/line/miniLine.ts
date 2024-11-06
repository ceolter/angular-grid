import type { _Scene } from 'ag-charts-community';

import type { ChartType } from 'ag-grid-community';

import type { AgChartsContext } from '../../../../../gridChartsModule';
import type { ChartTranslationKey } from '../../../../services/chartTranslationService';
import type { ThemeTemplateParameters } from '../../miniChartsContainer';
import { createLinePaths } from '../miniChartHelpers';
import { MiniChartWithAxes } from '../miniChartWithAxes';

export class MiniLine extends MiniChartWithAxes {
    static chartType: ChartType = 'line';

    protected lines: _Scene.Path[];

    static readonly data = [
        [1, 3, 5],
        [2, 6, 4],
        [5, 3, 1],
    ];

    constructor(
        container: HTMLElement,
        agChartsContext: AgChartsContext,
        fills: string[],
        strokes: string[],
        _themeTemplateParameters: ThemeTemplateParameters,
        _isCustomTheme: boolean,
        data: number[][] = MiniLine.data,
        tooltipName: ChartTranslationKey = 'lineTooltip'
    ) {
        super(container, agChartsContext, tooltipName);

        this.lines = createLinePaths(this.agChartsContext, this.root, data, this.size, this.padding);

        this.updateColors(fills, strokes);
    }

    updateColors(fills: string[], _strokes: string[]) {
        this.lines.forEach((line: _Scene.Path, i: number) => {
            line.stroke = fills[i];
        });
    }
}
