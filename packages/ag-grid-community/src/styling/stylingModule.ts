import type { _ModuleWithoutApi } from '../interfaces/iModule';
import { VERSION } from '../version';
import { CellStyleService } from './cellStyleService';
import { RowStyleService } from './rowStyleService';

/**
 * @feature Cells -> Styling Cells
 * @colDef cellStyle, cellClass, cellClassRules
 */
export const CellStyleModule: _ModuleWithoutApi = {
    moduleName: 'CellStyle',
    version: VERSION,
    beans: [CellStyleService],
};

/**
 * @feature Rows -> Styling Rows
 * @gridOption rowStyle, getRowStyle, rowClass, getRowClass, rowClassRules
 */
export const RowStyleModule: _ModuleWithoutApi = {
    moduleName: 'RowStyle',
    version: VERSION,
    beans: [RowStyleService],
};
