import type { ChartType } from 'ag-grid-community';

import type { AgChartsContext } from '../../../../../agChartsContext';
import type { ThemeTemplateParameters } from '../../miniChartsContainer';
import { MiniStackedColumn } from './miniStackedColumn';

export class MiniNormalizedColumn extends MiniStackedColumn {
    static override chartType: ChartType = 'normalizedColumn';
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
            MiniNormalizedColumn.data,
            [0, 10],
            'normalizedColumnTooltip'
        );
    }
}
