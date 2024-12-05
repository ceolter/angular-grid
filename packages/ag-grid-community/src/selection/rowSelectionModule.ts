import type { _RowSelectionGridApi } from '../api/gridApi';
import { SelectionColService } from '../columns/selectionColService';
import type { _ModuleWithApi, _ModuleWithoutApi } from '../interfaces/iModule';
import { VERSION } from '../version';
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
    moduleName: 'SharedRowSelection',
    version: VERSION,
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
    moduleName: 'RowSelection',
    version: VERSION,
    rowModels: ['clientSide', 'infinite', 'viewport'],
    beans: [SelectionService],
    dependsOn: [SharedRowSelectionModule],
};
