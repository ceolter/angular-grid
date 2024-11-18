import type { ChartType } from 'ag-grid-community';

import type { AgChartsExports } from '../../../../../agChartsExports';
import type { ChartTranslationKey } from '../../../../services/chartTranslationService';
import type { ThemeTemplateParameters } from '../../miniChartsContainer';
import { normalizeStackData } from '../miniChartHelpers';
import { MiniStackedArea } from './miniStackedArea';

export class MiniNormalizedArea extends MiniStackedArea {
    static override chartType: ChartType = 'normalizedArea';

    static override readonly data = normalizeStackData(MiniStackedArea.data);

    constructor(
        container: HTMLElement,
        agChartsExports: AgChartsExports,
        fills: string[],
        strokes: string[],
        themeTemplateParameters: ThemeTemplateParameters,
        isCustomTheme: boolean,
        data: number[][] = MiniNormalizedArea.data,
        tooltipName: ChartTranslationKey = 'normalizedAreaTooltip'
    ) {
        super(container, agChartsExports, fills, strokes, themeTemplateParameters, isCustomTheme, data, tooltipName);
    }
}
