import type { _PaginationGridApi } from '../api/gridApi';
import type { _ModuleWithApi, _ModuleWithoutApi } from '../interfaces/iModule';
import { baseCommunityModule } from '../interfaces/iModule';
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
export const PaginationCoreModule: _ModuleWithoutApi = {
    ...baseCommunityModule('PaginationCoreModule'),
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
};

/**
 * @feature Rows -> Row Pagination
 */
export const PaginationApiModule: _ModuleWithApi<_PaginationGridApi> = {
    ...baseCommunityModule('PaginationApiModule'),
    dependsOn: [PaginationCoreModule],
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
};

/**
 * @feature Rows -> Row Pagination
 */
export const PaginationModule: _ModuleWithoutApi = {
    ...baseCommunityModule('PaginationModule'),
    dependsOn: [PaginationCoreModule, PaginationApiModule],
};
