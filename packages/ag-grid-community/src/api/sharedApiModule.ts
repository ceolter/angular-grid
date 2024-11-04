import type { _ModuleWithApi } from '../interfaces/iModule';
import { baseCommunityModule } from '../interfaces/iModule';
import { collapseAll, expandAll, onRowHeightChanged } from './csrmSsrmSharedApi';
import type { _CsrmSsrmSharedGridApi, _SsrmInfiniteSharedGridApi } from './gridApi';
import { getCacheBlockState, isLastRowIndexKnown, setRowCount } from './ssrmInfiniteSharedApi';

// these modules are not used in core, but are shared between multiple other modules

/**
 * @internal
 */
export const CsrmSsrmSharedApiModule: _ModuleWithApi<_CsrmSsrmSharedGridApi> = {
    ...baseCommunityModule('CsrmSsrmSharedApiModule'),
    apiFunctions: {
        expandAll,
        collapseAll,
        onRowHeightChanged,
    },
};

/**
 * @internal
 */
export const SsrmInfiniteSharedApiModule: _ModuleWithApi<_SsrmInfiniteSharedGridApi> = {
    ...baseCommunityModule('SsrmInfiniteSharedApiModule'),
    apiFunctions: {
        setRowCount,
        getCacheBlockState,
        isLastRowIndexKnown,
    },
};
