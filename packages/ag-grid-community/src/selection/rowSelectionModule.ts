import type { _RowSelectionGridApi } from '../api/gridApi';
import { SelectionColService } from '../columns/selectionColService';
import { baseCommunityModule } from '../interfaces/iModule';
import type { _ModuleWithApi, _ModuleWithoutApi } from '../interfaces/iModule';
import {
    deselectAll,
    deselectAllFiltered,
    deselectAllOnCurrentPage,
    getSelectedNodes,
    getSelectedRows,
    selectAll,
    selectAllFiltered,
    selectAllOnCurrentPage,
    setNodesSelected,
} from './rowSelectionApi';
import { SelectionService } from './selectionService';

/**
 * @feature Selection -> Row Selection
 * @gridOption rowSelection
 */
export const RowSelectionCoreModule: _ModuleWithoutApi = {
    ...baseCommunityModule('RowSelectionCoreModule'),
    rowModels: ['clientSide', 'infinite', 'viewport'],
    beans: [SelectionService],
};

/**
 * @feature Selection -> Row Selection
 */
export const RowSelectionApiModule: _ModuleWithApi<_RowSelectionGridApi> = {
    ...baseCommunityModule('RowSelectionApiModule'),
    apiFunctions: {
        setNodesSelected,
        selectAll,
        deselectAll,
        selectAllFiltered,
        deselectAllFiltered,
        selectAllOnCurrentPage,
        deselectAllOnCurrentPage,
        getSelectedNodes,
        getSelectedRows,
    },
};

/**
 * @feature Selection -> Row Selection
 * @gridOption rowSelection
 */
export const SelectionColumnModule: _ModuleWithoutApi = {
    ...baseCommunityModule('SelectionColumnModule'),
    beans: [SelectionColService],
};

/**
 * @feature Selection -> Row Selection
 */
export const RowSelectionModule: _ModuleWithoutApi = {
    ...baseCommunityModule('RowSelectionModule'),
    dependsOn: [RowSelectionCoreModule, RowSelectionApiModule, SelectionColumnModule],
};
