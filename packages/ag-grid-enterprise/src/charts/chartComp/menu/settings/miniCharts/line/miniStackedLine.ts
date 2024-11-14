import type { ChartType } from 'ag-grid-community';

import type { AgChartsExports } from '../../../../../agChartsExports';
import type { ChartTranslationKey } from '../../../../services/chartTranslationService';
import type { ThemeTemplateParameters } from '../../miniChartsContainer';
import { stackData } from '../miniChartHelpers';
import { MiniLine } from './miniLine';

export class MiniStackedLine extends MiniLine {
    static override chartType: ChartType = 'stackedLine';

    static override readonly data = stackData(MiniLine.data);

    constructor(
        container: HTMLElement,
        agChartsExports: AgChartsExports,
        fills: string[],
        strokes: string[],
        _themeTemplateParameters: ThemeTemplateParameters,
        _isCustomTheme: boolean,
        data: number[][] = MiniStackedLine.data,
        tooltipName: ChartTranslationKey = 'stackedLineTooltip'
    ) {
        super(container, agChartsExports, fills, strokes, _themeTemplateParameters, _isCustomTheme, data, tooltipName);
    }
}
