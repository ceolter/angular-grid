import type { _ModuleWithoutApi } from 'ag-grid-community';
import { CommunityDefaultModule } from 'ag-grid-community';

import { ClipboardModule } from './clipboard/clipboardModule';
import { ExcelExportModule } from './excelExport/excelExportModule';
import { MenuModule } from './menu/menuModule';
import { baseEnterpriseModule } from './moduleUtils';

export const EnterpriseDefaultModule: _ModuleWithoutApi = {
    ...baseEnterpriseModule('EnterpriseDefaultModule'),
    dependsOn: [CommunityDefaultModule, MenuModule, ExcelExportModule, ClipboardModule],
};
