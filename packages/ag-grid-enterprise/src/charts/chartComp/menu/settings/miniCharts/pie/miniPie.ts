import type { ChartType } from 'ag-grid-community';

import type { AgChartsExports } from '../../../../../agChartsExports';
import type { ThemeTemplateParameters } from '../../miniChartsContainer';
import { MiniDonut } from './miniDonut';

export class MiniPie extends MiniDonut {
    static override chartType: ChartType = 'pie';

    constructor(
        container: HTMLElement,
        agChartsExports: AgChartsExports,
        fills: string[],
        strokes: string[],
        themeTemplateParameters: ThemeTemplateParameters,
        isCustomTheme: boolean
    ) {
        super(container, agChartsExports, fills, strokes, themeTemplateParameters, isCustomTheme, 0, 'pieTooltip');
    }
}
