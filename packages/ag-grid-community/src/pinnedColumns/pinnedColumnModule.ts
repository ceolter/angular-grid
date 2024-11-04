import type { _ModuleWithoutApi } from '../interfaces/iModule';
import { baseCommunityModule } from '../interfaces/iModule';
import { pinnedColumnModuleCSS } from './pinnedColumnModule.css-GENERATED';
import { PinnedColumnService } from './pinnedColumnService';

/**
 * @feature Columns -> Column Pinning
 * @colDef pinned
 */
export const PinnedColumnModule: _ModuleWithoutApi = {
    ...baseCommunityModule('PinnedColumnModule'),
    beans: [PinnedColumnService],
    css: [pinnedColumnModuleCSS],
};
