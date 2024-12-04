import type { _ModuleWithoutApi } from '../../interfaces/iModule';
import { VERSION } from '../../version';
import { RowAutoHeightService } from './rowAutoHeightService';

/**
 * @feature Rows -> Row Height
 * @colDef autoHeight
 */
export const RowAutoHeightModule: _ModuleWithoutApi = {
    moduleName: 'RowAutoHeight',
    version: VERSION,
    beans: [RowAutoHeightService],
};
