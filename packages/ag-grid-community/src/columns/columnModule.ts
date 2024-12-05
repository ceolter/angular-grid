import type { _ColumnGridApi } from '../api/gridApi';
import type { _ModuleWithApi, _ModuleWithoutApi } from '../interfaces/iModule';
import { CheckboxCellRendererModule } from '../rendering/cellRenderers/cellRendererModule';
import { VERSION } from '../version';
import {
    applyColumnState,
    getAllDisplayedColumns,
    getAllDisplayedVirtualColumns,
    getAllGridColumns,
    getColumn,
    getColumnDef,
    getColumnDefs,
    getColumnState,
    getColumns,
    getDisplayNameForColumn,
    getDisplayedCenterColumns,
    getDisplayedColAfter,
    getDisplayedColBefore,
    getDisplayedLeftColumns,
    getDisplayedRightColumns,
    isPinning,
    isPinningLeft,
    isPinningRight,
    resetColumnState,
    setColumnsPinned,
    setColumnsVisible,
} from './columnApi';
import { ColumnDefFactory } from './columnDefFactory';
import { ColumnFlexService } from './columnFlexService';
import { DataTypeService } from './dataTypeService';

/**
 * @internal
 */
export const DataTypeModule: _ModuleWithoutApi = {
    moduleName: 'DataType',
    version: VERSION,
    beans: [DataTypeService],
    dependsOn: [CheckboxCellRendererModule],
};

/**
 * @internal
 */
export const ColumnFlexModule: _ModuleWithoutApi = {
    moduleName: 'ColumnFlex',
    version: VERSION,
    beans: [ColumnFlexService],
};

/**
 * @feature Columns
 */
export const ColumnApiModule: _ModuleWithApi<_ColumnGridApi<any>> = {
    moduleName: 'ColumnApi',
    version: VERSION,
    beans: [ColumnDefFactory],
    apiFunctions: {
        getColumnDef,
        getDisplayNameForColumn,
        getColumn,
        getColumns,
        applyColumnState,
        getColumnState,
        resetColumnState,
        isPinning,
        isPinningLeft,
        isPinningRight,
        getDisplayedColAfter,
        getDisplayedColBefore,
        setColumnsVisible,
        setColumnsPinned,
        getAllGridColumns,
        getDisplayedLeftColumns,
        getDisplayedCenterColumns,
        getDisplayedRightColumns,
        getAllDisplayedColumns,
        getAllDisplayedVirtualColumns,
        getColumnDefs,
    },
};
