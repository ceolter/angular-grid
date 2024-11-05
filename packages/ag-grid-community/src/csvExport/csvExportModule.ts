import type { _CsvExportGridApi } from '../api/gridApi';
import { baseCommunityModule } from '../interfaces/iModule';
import type { _ModuleWithApi, _ModuleWithoutApi } from '../interfaces/iModule';
import { CsvCreator } from './csvCreator';
import { exportDataAsCsv, getDataAsCsv } from './csvExportApi';
import { GridSerializer } from './gridSerializer';

/**
 * @feature Import & Export -> CSV Export
 */
export const CsvExportCoreModule: _ModuleWithoutApi = {
    ...baseCommunityModule('CsvExportCoreModule'),
    beans: [CsvCreator, GridSerializer],
};

/**
 * @feature Import & Export -> CSV Export
 */
export const CsvExportApiModule: _ModuleWithApi<_CsvExportGridApi> = {
    ...baseCommunityModule('CsvExportApiModule'),
    apiFunctions: {
        getDataAsCsv,
        exportDataAsCsv,
    },
    dependsOn: [CsvExportCoreModule],
};

/**
 * @feature Import & Export -> CSV Export
 */
export const CsvExportModule: _ModuleWithoutApi = {
    ...baseCommunityModule('CsvExportModule'),
    dependsOn: [CsvExportCoreModule, CsvExportApiModule],
};
