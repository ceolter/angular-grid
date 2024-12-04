import type { _ModuleWithoutApi } from '../interfaces/iModule';
import { VERSION } from '../version';
import { pinnedColumnModuleCSS } from './pinnedColumnModule.css-GENERATED';
import { PinnedColumnService } from './pinnedColumnService';

/**
 * @feature Columns -> Column Pinning
 * @colDef pinned
 */
export const PinnedColumnModule: _ModuleWithoutApi = {
    moduleName: 'PinnedColumn',
    version: VERSION,
    beans: [PinnedColumnService],
    css: [pinnedColumnModuleCSS],
};
