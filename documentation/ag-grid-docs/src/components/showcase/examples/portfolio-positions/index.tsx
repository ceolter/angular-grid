import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model';
import { ModuleRegistry } from '@ag-grid-community/core';
import '@ag-grid-community/styles/ag-grid.css';
import '@ag-grid-community/styles/ag-theme-quartz.css';
import { AdvancedFilterModule } from '@ag-grid-enterprise/advanced-filter';
import { GridChartsModule } from '@ag-grid-enterprise/charts-enterprise';
import { ColumnsToolPanelModule } from '@ag-grid-enterprise/column-tool-panel';
import { ExcelExportModule } from '@ag-grid-enterprise/excel-export';
import { FiltersToolPanelModule } from '@ag-grid-enterprise/filter-tool-panel';
import { MenuModule } from '@ag-grid-enterprise/menu';
import { RangeSelectionModule } from '@ag-grid-enterprise/range-selection';
import { RichSelectModule } from '@ag-grid-enterprise/rich-select';
import { RowGroupingModule } from '@ag-grid-enterprise/row-grouping';
import { SetFilterModule } from '@ag-grid-enterprise/set-filter';
import { SparklinesModule } from '@ag-grid-enterprise/sparklines';
import { StatusBarModule } from '@ag-grid-enterprise/status-bar';
import { useDarkmode } from '@utils/hooks/useDarkmode';
import { type FunctionComponent } from 'react';

import PortfolioExample from './components/portfolio-example/PortfolioExample';

ModuleRegistry.registerModules([
    ClientSideRowModelModule,
    AdvancedFilterModule,
    ColumnsToolPanelModule,
    ExcelExportModule,
    FiltersToolPanelModule,
    GridChartsModule,
    MenuModule,
    RangeSelectionModule,
    RowGroupingModule,
    SetFilterModule,
    RichSelectModule,
    StatusBarModule,
    SparklinesModule,
]);

export const PortfolioPositions: FunctionComponent = () => {
    const [isDarkMode] = useDarkmode();

    return <PortfolioExample isDarkMode={isDarkMode} />;
};
