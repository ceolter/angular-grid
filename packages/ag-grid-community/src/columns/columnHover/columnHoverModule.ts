import type { _ColumnHoverApi } from '../../api/gridApi';
import type { _ModuleWithApi } from '../../interfaces/iModule';
import { VERSION } from '../../version';
import { isColumnHovered } from './columnHoverApi';
import { ColumnHoverService } from './columnHoverService';

/**
 * @feature Rows -> Styling Rows
 * @gridOption columnHoverHighlight
 */
export const ColumnHoverModule: _ModuleWithApi<_ColumnHoverApi> = {
    moduleName: 'ColumnHover',
    version: VERSION,
    beans: [ColumnHoverService],
    apiFunctions: {
        isColumnHovered,
    },
};
