import type { _ModuleWithoutApi } from '../interfaces/iModule';
import { VERSION } from '../version';
import { AriaAnnouncementService } from './ariaAnnouncementService';

/**
 * @feature Interactivity -> Accessibility (ARIA)
 */
export const AriaModule: _ModuleWithoutApi = {
    moduleName: 'Aria',
    version: VERSION,
    beans: [AriaAnnouncementService],
};
