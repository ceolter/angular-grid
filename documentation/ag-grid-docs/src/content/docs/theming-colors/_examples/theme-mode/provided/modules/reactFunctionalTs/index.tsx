import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { AllCommunityModule, ClientSideRowModelModule, ModuleRegistry, themeQuartz } from 'ag-grid-community';
import { ColumnsToolPanelModule, FiltersToolPanelModule, SideBarModule } from 'ag-grid-enterprise';
import { AgGridReact } from 'ag-grid-react';

ModuleRegistry.registerModules([
    AllCommunityModule,
    ClientSideRowModelModule,

    SideBarModule,
    ColumnsToolPanelModule,
    FiltersToolPanelModule,
]);

const theme = themeQuartz
    .withParams(
        {
            backgroundColor: '#FFE8E0',
            foregroundColor: '#361008CC',
            browserColorScheme: 'light',
        },
        'light-red'
    )
    .withParams(
        {
            backgroundColor: '#201008',
            foregroundColor: '#FFFFFFCC',
            browserColorScheme: 'dark',
        },
        'dark-red'
    );

const GridExample = () => {
    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <p style={{ flex: 0 }}>
                <label>
                    Dark mode: <input type="checkbox" onChange={(e) => setDarkMode(e.target.checked)} />
                </label>
            </p>
            <div style={{ flex: 1 }}>
                <AgGridReact
                    theme={theme}
                    columnDefs={columnDefs}
                    rowData={rowData}
                    defaultColDef={defaultColDef}
                    sideBar
                />
            </div>
        </div>
    );
};

function setDarkMode(enabled: boolean) {
    document.body.dataset.agThemeMode = enabled ? 'dark-red' : 'light-red';
}
setDarkMode(false);

const rowData: any[] = (() => {
    const rowData: any[] = [];
    for (let i = 0; i < 10; i++) {
        rowData.push({ make: 'Toyota', model: 'Celica', price: 35000 + i * 1000 });
        rowData.push({ make: 'Ford', model: 'Mondeo', price: 32000 + i * 1000 });
        rowData.push({ make: 'Porsche', model: 'Boxster', price: 72000 + i * 1000 });
    }
    return rowData;
})();

const columnDefs = [{ field: 'make' }, { field: 'model' }, { field: 'price' }];

const defaultColDef = {
    flex: 1,
    minWidth: 100,
    filter: true,
    enableValue: true,
    enableRowGroup: true,
    enablePivot: true,
};

const root = createRoot(document.getElementById('root')!);
root.render(
    <StrictMode>
        <GridExample />
    </StrictMode>
);
