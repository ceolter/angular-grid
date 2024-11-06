import type { _RowSelectionGridApi } from '../api/gridApi';
import { baseCommunityModule } from '../interfaces/iModule';
import type { _ModuleWithApi } from '../interfaces/iModule';
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
export const RowSelectionModule: _ModuleWithApi<_RowSelectionGridApi> = {
    ...baseCommunityModule('RowSelectionModule'),
    rowModels: ['clientSide', 'infinite', 'viewport'],
    beans: [SelectionService],
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
