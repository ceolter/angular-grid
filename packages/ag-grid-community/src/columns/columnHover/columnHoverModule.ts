import type { _ColumnHoverApi } from '../../api/gridApi';
import type { _ModuleWithApi } from '../../interfaces/iModule';
import { baseCommunityModule } from '../../interfaces/iModule';
import { isColumnHovered } from './columnHoverApi';
import { ColumnHoverService } from './columnHoverService';

/**
 * @feature Rows -> Styling Rows
 * @gridOption columnHoverHighlight
 */
export const ColumnHoverModule: _ModuleWithApi<_ColumnHoverApi> = {
    ...baseCommunityModule('ColumnHover'),
    beans: [ColumnHoverService],
    apiFunctions: {
        isColumnHovered,
    },
};
