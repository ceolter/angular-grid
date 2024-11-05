import { baseCommunityModule } from '../../interfaces/iModule';
import type { _ModuleWithoutApi } from '../../interfaces/iModule';
import { RowAutoHeightService } from './rowAutoHeightService';

/**
 * @feature Rows -> Row Height
 * @colDef autoHeight
 */
export const RowAutoHeightModule: _ModuleWithoutApi = {
    ...baseCommunityModule('RowAutoHeightModule'),
    beans: [RowAutoHeightService],
};
