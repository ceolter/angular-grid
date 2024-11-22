import type { _ModuleWithoutApi } from '../interfaces/iModule';
import { baseCommunityModule } from '../interfaces/iModule';
import { GridSerializer } from './gridSerializer';

// Shared CSV and Excel logic
/**
 * @internal
 */
export const SharedExportModule: _ModuleWithoutApi = {
    ...baseCommunityModule('SharedExport'),
    beans: [GridSerializer],
};
