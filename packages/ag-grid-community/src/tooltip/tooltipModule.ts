import { baseCommunityModule } from '../interfaces/iModule';
import type { _ModuleWithoutApi } from '../interfaces/iModule';
import { PopupModule } from '../widgets/popupModule';
import { tooltipCSS } from './tooltip.css-GENERATED';
import { TooltipComponent } from './tooltipComponent';
import { TooltipFeature } from './tooltipFeature';
import { TooltipService } from './tooltipService';

/**
 * @feature Tooltips
 * @colDef tooltipField, tooltipValueGetter, headerTooltip
 */
export const TooltipCoreModule: _ModuleWithoutApi = {
    ...baseCommunityModule('TooltipCoreModule'),
    beans: [TooltipService],
    dynamicBeans: {
        tooltipFeature: TooltipFeature as any,
    },
    dependsOn: [PopupModule],
    css: [tooltipCSS],
};

/**
 * @feature Tooltips
 */
export const TooltipCompModule: _ModuleWithoutApi = {
    ...baseCommunityModule('TooltipCompModule'),
    userComponents: {
        agTooltipComponent: TooltipComponent,
    },
};

/**
 * @feature Tooltips
 */
export const TooltipModule: _ModuleWithoutApi = {
    ...baseCommunityModule('TooltipModule'),
    dependsOn: [TooltipCoreModule, TooltipCompModule],
};
