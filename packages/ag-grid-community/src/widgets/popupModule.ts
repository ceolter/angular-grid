import type { _ModuleWithoutApi } from '../interfaces/iModule';
import { VERSION } from '../version';
import { PopupService } from './popupService';

/**
 * @internal
 */
export const PopupModule: _ModuleWithoutApi = {
    moduleName: 'Popup',
    version: VERSION,
    beans: [PopupService],
};
