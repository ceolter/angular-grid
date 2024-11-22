import { baseCommunityModule } from '../interfaces/iModule';
import type { _ModuleWithoutApi } from '../interfaces/iModule';
import { CellStyleService } from './cellStyleService';
import { RowStyleService } from './rowStyleService';

/**
 * @feature Cells -> Styling Cells
 * @colDef cellStyle, cellClass, cellClassRules
 */
export const CellStyleModule: _ModuleWithoutApi = {
    ...baseCommunityModule('CellStyle'),
    beans: [CellStyleService],
};

/**
 * @feature Rows -> Styling Rows
 * @gridOption rowStyle, getRowStyle, rowClass, getRowClass, rowClassRules
 */
export const RowStyleModule: _ModuleWithoutApi = {
    ...baseCommunityModule('RowStyle'),
    beans: [RowStyleService],
};
