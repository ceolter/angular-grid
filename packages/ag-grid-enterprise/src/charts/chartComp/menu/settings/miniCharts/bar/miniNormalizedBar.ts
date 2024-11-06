import type { ChartType } from 'ag-grid-community';

import type { AgChartsContext } from '../../../../../gridChartsModule';
import type { ThemeTemplateParameters } from '../../miniChartsContainer';
import { MiniStackedBar } from './miniStackedBar';

export class MiniNormalizedBar extends MiniStackedBar {
    static override chartType: ChartType = 'normalizedBar';
    static override data = [
        [10, 10, 10],
        [6, 7, 8],
        [2, 4, 6],
    ];

    constructor(
        container: HTMLElement,
        agChartsContext: AgChartsContext,
        fills: string[],
        strokes: string[],
        themeTemplateParameters: ThemeTemplateParameters,
        isCustomTheme: boolean
    ) {
        super(
            container,
            agChartsContext,
            fills,
            strokes,
            themeTemplateParameters,
            isCustomTheme,
            MiniNormalizedBar.data,
            [0, 10],
            'normalizedBarTooltip'
        );
    }
}
