import { baseCommunityModule } from '../../interfaces/iModule';
import type { _ModuleWithoutApi } from '../../interfaces/iModule';
import { StickyRowService } from './stickyRowService';

/**
 * @feature Row Grouping, Master Detail, Tree Data
 * @gridOption suppressGroupRowsSticky
 */
export const StickyRowModule: _ModuleWithoutApi = {
    ...baseCommunityModule('StickyRowModule'),
    beans: [StickyRowService],
};
