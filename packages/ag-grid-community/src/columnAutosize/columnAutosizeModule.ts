import type { _ColumnAutosizeApi } from '../api/gridApi';
import { baseCommunityModule } from '../interfaces/iModule';
import type { _ModuleWithApi, _ModuleWithoutApi } from '../interfaces/iModule';
import { AutoWidthModule } from '../rendering/autoWidthModule';
import { autoSizeAllColumns, autoSizeColumns, sizeColumnsToFit } from './columnAutosizeApi';
import { ColumnAutosizeService } from './columnAutosizeService';

/**
 * @feature Columns -> Column Sizing
 * @gridOption autoSizeStrategy
 */
export const ColumnAutosizeCoreModule: _ModuleWithoutApi = {
    ...baseCommunityModule('ColumnAutosizeCoreModule'),
    beans: [ColumnAutosizeService],
    dependsOn: [AutoWidthModule],
};

/**
 * @feature Columns -> Column Sizing
 */
export const ColumnAutosizeApiModule: _ModuleWithApi<_ColumnAutosizeApi> = {
    ...baseCommunityModule('ColumnAutosizeApiModule'),
    apiFunctions: {
        sizeColumnsToFit,
        autoSizeColumns,
        autoSizeAllColumns,
    },
    dependsOn: [ColumnAutosizeCoreModule],
};

/**
 * @feature Columns -> Column Sizing
 */
export const ColumnAutosizeModule: _ModuleWithoutApi = {
    ...baseCommunityModule('ColumnAutosizeModule'),
    dependsOn: [ColumnAutosizeApiModule],
};
