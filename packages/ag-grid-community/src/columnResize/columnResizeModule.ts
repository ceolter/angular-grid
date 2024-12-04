import type { _ColumnResizeApi } from '../api/gridApi';
import { HorizontalResizeModule } from '../dragAndDrop/dragModule';
import type { _ModuleWithApi } from '../interfaces/iModule';
import { AutoWidthModule } from '../rendering/autoWidthModule';
import { VERSION } from '../version';
import { setColumnWidths } from './columnResizeApi';
import { ColumnResizeService } from './columnResizeService';

/**
 * @feature Columns -> Column Sizing
 */
export const ColumnResizeModule: _ModuleWithApi<_ColumnResizeApi> = {
    moduleName: 'ColumnResize',
    version: VERSION,
    beans: [ColumnResizeService],
    apiFunctions: {
        setColumnWidths,
    },
    dependsOn: [HorizontalResizeModule, AutoWidthModule],
};
