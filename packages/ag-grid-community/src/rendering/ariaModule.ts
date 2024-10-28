import type { _ModuleWithoutApi } from '../interfaces/iModule';
import { baseCommunityModule } from '../interfaces/iModule';
import { AriaAnnouncementService } from './ariaAnnouncementService';

export const AriaModule: _ModuleWithoutApi = {
    ...baseCommunityModule('AriaModule'),
    beans: [AriaAnnouncementService],
};
