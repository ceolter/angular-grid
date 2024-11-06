import type { _CsvExportGridApi } from '../api/gridApi';
import { SharedExportModule } from '../export/exportModule';
import { baseCommunityModule } from '../interfaces/iModule';
import type { _ModuleWithApi } from '../interfaces/iModule';
import { CsvCreator } from './csvCreator';
import { exportDataAsCsv, getDataAsCsv } from './csvExportApi';

/**
 * @feature Import & Export -> CSV Export
 */
export const CsvExportModule: _ModuleWithApi<_CsvExportGridApi> = {
    ...baseCommunityModule('CsvExportModule'),
    beans: [CsvCreator],
    apiFunctions: {
        getDataAsCsv,
        exportDataAsCsv,
    },
    dependsOn: [SharedExportModule],
};
