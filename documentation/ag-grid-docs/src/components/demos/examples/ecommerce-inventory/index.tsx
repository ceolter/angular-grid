import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model';
import { ModuleRegistry } from '@ag-grid-community/core';
import '@ag-grid-community/styles/ag-grid.css';
import '@ag-grid-community/styles/ag-theme-quartz.css';
import { ExcelExportModule } from '@ag-grid-enterprise/excel-export';
import { useDarkmode } from '@utils/hooks/useDarkmode';
import { type FunctionComponent } from 'react';

import { EcommerceExample } from './components/ecommerce-example/EcommerceExample';

ModuleRegistry.registerModules([ClientSideRowModelModule, ExcelExportModule]);

export const EcommerceInventoryExample: FunctionComponent = () => {
    const [isDarkMode] = useDarkmode();

    return <EcommerceExample isDarkMode={isDarkMode} />;
};
