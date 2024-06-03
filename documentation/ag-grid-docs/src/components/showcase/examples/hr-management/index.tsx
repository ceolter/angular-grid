import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model';
import { ModuleRegistry } from '@ag-grid-community/core';
import '@ag-grid-community/styles/ag-grid.css';
import '@ag-grid-community/styles/ag-theme-quartz.css';
import { ExcelExportModule } from '@ag-grid-enterprise/excel-export';
import { MasterDetailModule } from '@ag-grid-enterprise/master-detail';
import { useDarkmode } from '@utils/hooks/useDarkmode';
import { type FunctionComponent } from 'react';

import { HRExample } from './components/hr-example/HRExample';
import './index.module.css';

ModuleRegistry.registerModules([ClientSideRowModelModule, ExcelExportModule, MasterDetailModule]);

export const HRManagementExample: FunctionComponent = () => {
    const [isDarkMode] = useDarkmode();

    return <HRExample isDarkMode={isDarkMode} />;
};
