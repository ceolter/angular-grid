import type { ChartType } from 'ag-grid-community';

import type { AgChartsExports } from '../../../../../agChartsExports';
import type { ChartTranslationKey } from '../../../../services/chartTranslationService';
import type { ThemeTemplateParameters } from '../../miniChartsContainer';
import { stackData } from '../miniChartHelpers';
import { MiniArea } from './miniArea';

export class MiniStackedArea extends MiniArea {
    static override chartType: ChartType = 'stackedArea';
    static override readonly data = stackData(MiniArea.data);

    constructor(
        container: HTMLElement,
        agChartsExports: AgChartsExports,
        fills: string[],
        strokes: string[],
        _themeTemplateParameters: ThemeTemplateParameters,
        _isCustomTheme: boolean,
        data: number[][] = MiniStackedArea.data,
        tooltipName: ChartTranslationKey = 'stackedAreaTooltip'
    ) {
        super(
            container,
            agChartsExports,
            fills,
            strokes,
            _themeTemplateParameters,
            _isCustomTheme,
            data,
            tooltipName,
            true
        );
    }

    override updateColors(fills: string[], strokes: string[]) {
        this.areas.forEach((area, i) => {
            area.fill = fills[i];
            area.stroke = strokes[i];
        });
    }
}
