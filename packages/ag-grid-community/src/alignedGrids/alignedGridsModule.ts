import type { _ModuleWithoutApi } from '../interfaces/iModule';
import { VERSION } from '../version';
import { AlignedGridsService } from './alignedGridsService';

/**
 * @feature Other -> Aligned Grids
 * @gridOption alignedGrids
 */
export const AlignedGridsModule: _ModuleWithoutApi = {
    moduleName: 'AlignedGrids',
    version: VERSION,
    beans: [AlignedGridsService],
};
