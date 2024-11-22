import { baseCommunityModule } from '../interfaces/iModule';
import type { _ModuleWithoutApi } from '../interfaces/iModule';
import { AlignedGridsService } from './alignedGridsService';

/**
 * @feature Other -> Aligned Grids
 * @gridOption alignedGrids
 */
export const AlignedGridsModule: _ModuleWithoutApi = {
    ...baseCommunityModule('AlignedGrids'),
    beans: [AlignedGridsService],
};
