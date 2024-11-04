import type { _ColumnGridApi, _GetColumnDefsApi } from '../api/gridApi';
import { baseCommunityModule } from '../interfaces/iModule';
import type { _ModuleWithApi, _ModuleWithoutApi } from '../interfaces/iModule';
import { CheckboxCellRendererModule } from '../rendering/cellRenderers/cellRendererModule';
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
import { SelectionColService } from './selectionColService';

export const DataTypeModule: _ModuleWithoutApi = {
    ...baseCommunityModule('DataTypeModule'),
    beans: [DataTypeService],
    dependsOn: [CheckboxCellRendererModule],
};

export const SelectionColumnModule: _ModuleWithoutApi = {
    ...baseCommunityModule('SelectionColumnModule'),
    beans: [SelectionColService],
};

export const GetColumnDefsApiModule: _ModuleWithApi<_GetColumnDefsApi<any>> = {
    ...baseCommunityModule('GetColumnDefsApiModule'),
    beans: [ColumnDefFactory],
    apiFunctions: {
        getColumnDefs,
    },
};

export const ColumnFlexModule: _ModuleWithoutApi = {
    ...baseCommunityModule('ColumnFlexModule'),
    beans: [ColumnFlexService],
};

export const ColumnApiModule: _ModuleWithApi<_ColumnGridApi<any>> = {
    ...baseCommunityModule('ColumnApiModule'),
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
    },
};
