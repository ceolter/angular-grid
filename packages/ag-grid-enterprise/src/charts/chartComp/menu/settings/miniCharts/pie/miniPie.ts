import type { ChartType } from 'ag-grid-community';

import type { AgChartsContext } from '../../../../../gridChartsModule';
import type { ThemeTemplateParameters } from '../../miniChartsContainer';
import { MiniDonut } from './miniDonut';

export class MiniPie extends MiniDonut {
    static override chartType: ChartType = 'pie';

    constructor(
        container: HTMLElement,
        agChartsContext: AgChartsContext,
        fills: string[],
        strokes: string[],
        themeTemplateParameters: ThemeTemplateParameters,
        isCustomTheme: boolean
    ) {
        super(container, agChartsContext, fills, strokes, themeTemplateParameters, isCustomTheme, 0, 'pieTooltip');
    }
}
