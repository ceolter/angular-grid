import type { ListOption } from 'ag-grid-community';

import type { ChartTranslationService } from '../../../services/chartTranslationService';

export function getShapeSelectOptions(chartTranslation: ChartTranslationService): ListOption[] {
    return (['square', 'circle', 'cross', 'diamond', 'plus', 'triangle', 'heart'] as const).map((value) => ({
        value,
        text: chartTranslation.translate(value),
    }));
}
