import type { _PaginationGridApi } from '../api/gridApi';
import type { _ModuleWithApi } from '../interfaces/iModule';
import { VERSION } from '../version';
import { PopupModule } from '../widgets/popupModule';
import {
    paginationGetCurrentPage,
    paginationGetPageSize,
    paginationGetRowCount,
    paginationGetTotalPages,
    paginationGoToFirstPage,
    paginationGoToLastPage,
    paginationGoToNextPage,
    paginationGoToPage,
    paginationGoToPreviousPage,
    paginationIsLastPageFound,
} from './paginationApi';
import { PaginationAutoPageSizeService } from './paginationAutoPageSizeService';
import { PaginationService } from './paginationService';

/**
 * @feature Rows -> Row Pagination
 * @gridOption pagination
 */
export const PaginationModule: _ModuleWithApi<_PaginationGridApi> = {
    moduleName: 'Pagination',
    version: VERSION,
    beans: [PaginationService, PaginationAutoPageSizeService],
    icons: {
        // "go to first" button in pagination controls
        first: 'first',
        // "go to previous" button in pagination controls
        previous: 'previous',
        // "go to next" button in pagination controls
        next: 'next',
        // "go to last" button in pagination controls
        last: 'last',
    },
    apiFunctions: {
        paginationIsLastPageFound,
        paginationGetPageSize,
        paginationGetCurrentPage,
        paginationGetTotalPages,
        paginationGetRowCount,
        paginationGoToNextPage,
        paginationGoToPreviousPage,
        paginationGoToFirstPage,
        paginationGoToLastPage,
        paginationGoToPage,
    },
    dependsOn: [PopupModule],
};
