import type { ChartType } from 'ag-grid-community';

import type { AgChartsContext } from '../../../../../gridChartsModule';
import type { ChartTranslationKey } from '../../../../services/chartTranslationService';
import type { ThemeTemplateParameters } from '../../miniChartsContainer';
import { MiniLine } from '../line/miniLine';
import { createAreaPaths } from '../miniChartHelpers';
import { MiniChartWithAxes } from '../miniChartWithAxes';

export class MiniArea extends MiniChartWithAxes {
    static chartType: ChartType = 'area';
    protected readonly areas: any[];

    static readonly data = MiniLine.data;

    constructor(
        container: HTMLElement,
        agChartsContext: AgChartsContext,
        fills: string[],
        strokes: string[],
        _themeTemplateParameters: ThemeTemplateParameters,
        _isCustomTheme: boolean,
        data: number[][] = MiniArea.data,
        tooltipName: ChartTranslationKey = 'groupedAreaTooltip',
        stacked: boolean = false
    ) {
        super(container, agChartsContext, tooltipName);

        this.areas = createAreaPaths(this.agChartsContext, this.root, data, this.size, this.padding, stacked);

        this.updateColors(fills, strokes);
    }

    updateColors(fills: string[], strokes: string[]) {
        this.areas.forEach((area, i) => {
            area.fill = fills[i];
            area.stroke = strokes[i];
            area.strokeWidth = 1;
            area.strokeOpacity = 0.75;
            area.fillOpacity = 0.7;
        });
    }
}
