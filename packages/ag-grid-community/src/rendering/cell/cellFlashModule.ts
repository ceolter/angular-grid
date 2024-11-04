import type { _ModuleWithoutApi } from '../../interfaces/iModule';
import { baseCommunityModule } from '../../interfaces/iModule';
import { CellFlashService } from './cellFlashService';

/**
 * @feature Cells -> Highlighting Changes
 * @colDef enableCellChangeFlash
 */
export const CellFlashModule: _ModuleWithoutApi = {
    ...baseCommunityModule('CellFlashModule'),
    beans: [CellFlashService],
};
