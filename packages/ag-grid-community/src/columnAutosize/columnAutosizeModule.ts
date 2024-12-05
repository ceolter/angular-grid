import type { _ColumnAutosizeApi } from '../api/gridApi';
import type { _ModuleWithApi } from '../interfaces/iModule';
import { AutoWidthModule } from '../rendering/autoWidthModule';
import { VERSION } from '../version';
import { autoSizeAllColumns, autoSizeColumns, sizeColumnsToFit } from './columnAutosizeApi';
import { ColumnAutosizeService } from './columnAutosizeService';

/**
 * @feature Columns -> Column Sizing
 * @gridOption autoSizeStrategy
 */
export const ColumnAutoSizeModule: _ModuleWithApi<_ColumnAutosizeApi> = {
    moduleName: 'ColumnAutoSize',
    version: VERSION,
    beans: [ColumnAutosizeService],
    apiFunctions: {
        sizeColumnsToFit,
        autoSizeColumns,
        autoSizeAllColumns,
    },
    dependsOn: [AutoWidthModule],
};
