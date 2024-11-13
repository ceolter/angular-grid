import type { _ColumnAutosizeApi } from '../api/gridApi';
import { baseCommunityModule } from '../interfaces/iModule';
import type { _ModuleWithApi } from '../interfaces/iModule';
import { AutoWidthModule } from '../rendering/autoWidthModule';
import { autoSizeAllColumns, autoSizeColumns, sizeColumnsToFit } from './columnAutosizeApi';
import { ColumnAutosizeService } from './columnAutosizeService';

/**
 * @feature Columns -> Column Sizing
 * @gridOption autoSizeStrategy
 */
export const ColumnAutoSizeModule: _ModuleWithApi<_ColumnAutosizeApi> = {
    ...baseCommunityModule('ColumnAutoSizeModule'),
    beans: [ColumnAutosizeService],
    apiFunctions: {
        sizeColumnsToFit,
        autoSizeColumns,
        autoSizeAllColumns,
    },
    dependsOn: [AutoWidthModule],
};
