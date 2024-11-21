import { baseCommunityModule } from '../interfaces/iModule';
import type { _ModuleWithoutApi } from '../interfaces/iModule';
import { PopupService } from './popupService';

/**
 * @internal
 */
export const PopupModule: _ModuleWithoutApi = {
    ...baseCommunityModule('Popup'),
    beans: [PopupService],
};
