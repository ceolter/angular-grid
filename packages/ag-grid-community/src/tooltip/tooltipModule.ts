import type { _ModuleWithoutApi } from '../interfaces/iModule';
import { VERSION } from '../version';
import { PopupModule } from '../widgets/popupModule';
import { tooltipCSS } from './tooltip.css-GENERATED';
import { TooltipComponent } from './tooltipComponent';
import { TooltipFeature } from './tooltipFeature';
import { TooltipService } from './tooltipService';

/**
 * @feature Tooltips
 * @colDef tooltipField, tooltipValueGetter, headerTooltip
 */
export const TooltipModule: _ModuleWithoutApi = {
    moduleName: 'Tooltip',
    version: VERSION,
    beans: [TooltipService],
    dynamicBeans: {
        tooltipFeature: TooltipFeature as any,
    },
    userComponents: {
        agTooltipComponent: TooltipComponent,
    },
    dependsOn: [PopupModule],
    css: [tooltipCSS],
};
