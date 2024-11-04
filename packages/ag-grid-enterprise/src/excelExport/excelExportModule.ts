import type { _ExcelExportGridApi, _ModuleWithApi, _ModuleWithoutApi } from 'ag-grid-community';
import { CsvExportCoreModule } from 'ag-grid-community';

import { EnterpriseCoreModule } from '../agGridEnterpriseModule';
import { baseEnterpriseModule } from '../moduleUtils';
import { ExcelCreator } from './excelCreator';
import {
    exportDataAsExcel,
    exportMultipleSheetsAsExcel,
    getDataAsExcel,
    getMultipleSheetsAsExcel,
    getSheetDataForExcel,
} from './excelExportApi';

/**
 * @feature Import & Export -> Excel
 */
export const ExcelExportCoreModule: _ModuleWithoutApi = {
    ...baseEnterpriseModule('ExcelExportCoreModule'),
    beans: [ExcelCreator],
    dependsOn: [CsvExportCoreModule, EnterpriseCoreModule],
};

/**
 * @feature Import & Export -> Excel
 */
export const ExcelExportApiModule: _ModuleWithApi<_ExcelExportGridApi> = {
    ...baseEnterpriseModule('ExcelExportApiModule'),
    apiFunctions: {
        getDataAsExcel,
        exportDataAsExcel,
        getSheetDataForExcel,
        getMultipleSheetsAsExcel,
        exportMultipleSheetsAsExcel,
    },
    dependsOn: [ExcelExportCoreModule],
};

/**
 * @feature Import & Export -> Excel
 */
export const ExcelExportModule: _ModuleWithoutApi = {
    ...baseEnterpriseModule('ExcelExportModule'),
    dependsOn: [ExcelExportCoreModule, ExcelExportApiModule],
};
