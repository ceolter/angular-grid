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
 * @internal
 */
export const SharedRowSelectionModule: _ModuleWithApi<_RowSelectionGridApi> = {
    ...baseCommunityModule('SharedRowSelectionModule'),
    beans: [SelectionColService],
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
 */
export const RowSelectionModule: _ModuleWithoutApi = {
    ...baseCommunityModule('RowSelectionModule'),
    rowModels: ['clientSide', 'infinite', 'viewport'],
    beans: [SelectionService],
    dependsOn: [SharedRowSelectionModule],
};
