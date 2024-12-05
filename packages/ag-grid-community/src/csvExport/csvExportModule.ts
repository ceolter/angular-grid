import type { _CsvExportGridApi } from '../api/gridApi';
import { SharedExportModule } from '../export/exportModule';
import type { _ModuleWithApi } from '../interfaces/iModule';
import { VERSION } from '../version';
import { CsvCreator } from './csvCreator';
import { exportDataAsCsv, getDataAsCsv } from './csvExportApi';

/**
 * @feature Import & Export -> CSV Export
 */
export const CsvExportModule: _ModuleWithApi<_CsvExportGridApi> = {
    moduleName: 'CsvExport',
    version: VERSION,
    beans: [CsvCreator],
    apiFunctions: {
        getDataAsCsv,
        exportDataAsCsv,
    },
    dependsOn: [SharedExportModule],
};
