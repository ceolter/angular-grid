import type { ChartType } from 'ag-grid-community';

import type { AgChartsExports } from '../../../../../agChartsExports';
import type { ChartTranslationKey } from '../../../../services/chartTranslationService';
import type { ThemeTemplateParameters } from '../../miniChartsContainer';
import { normalizeStackData } from '../miniChartHelpers';
import { MiniLine } from './miniLine';
import { MiniStackedLine } from './miniStackedLine';

export class MiniNormalizedLine extends MiniLine {
    static override chartType: ChartType = 'normalizedLine';

    static override readonly data = normalizeStackData(MiniStackedLine.data);

    constructor(
        container: HTMLElement,
        agChartsExports: AgChartsExports,
        fills: string[],
        strokes: string[],
        themeTemplateParameters: ThemeTemplateParameters,
        isCustomTheme: boolean,
        data: number[][] = MiniNormalizedLine.data,
        tooltipName: ChartTranslationKey = 'normalizedLineTooltip'
    ) {
        super(container, agChartsExports, fills, strokes, themeTemplateParameters, isCustomTheme, data, tooltipName);
    }
}
