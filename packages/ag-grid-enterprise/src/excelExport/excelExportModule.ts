import type { _ExcelExportGridApi, _ModuleWithApi } from 'ag-grid-community';
import { SharedExportModule } from 'ag-grid-community';

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
export const ExcelExportModule: _ModuleWithApi<_ExcelExportGridApi> = {
    ...baseEnterpriseModule('ExcelExportModule'),
    beans: [ExcelCreator],
    apiFunctions: {
        getDataAsExcel,
        exportDataAsExcel,
        getSheetDataForExcel,
        getMultipleSheetsAsExcel,
        exportMultipleSheetsAsExcel,
    },
    dependsOn: [SharedExportModule, EnterpriseCoreModule],
};
