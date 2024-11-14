import React, { StrictMode, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';

import { ClientSideRowModelModule } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { themeAlpine, themeBalham, themeQuartz } from 'ag-grid-community';
import { ColumnsToolPanelModule } from 'ag-grid-enterprise';
import { FiltersToolPanelModule } from 'ag-grid-enterprise';
import { SideBarModule } from 'ag-grid-enterprise';
import { AgGridReact } from 'ag-grid-react';

ModuleRegistry.registerModules([
    AllCommunityModule,
    ClientSideRowModelModule,

    SideBarModule,
    ColumnsToolPanelModule,
    FiltersToolPanelModule,
]);

const themes = [themeQuartz, themeBalham, themeAlpine];

const GridExample = () => {
    const [theme, setBaseTheme] = useState(themes[0]);

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <p style={{ flex: 0 }}>
                Theme: <PartSelector options={themes} value={theme} setValue={setBaseTheme} />
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

type PartSelectorProps<T extends { id: string } | null> = {
    options: T[];
    value: T;
    setValue: (value: T) => void;
};

const PartSelector = <T extends { id: string; variant?: string } | null>({
    options,
    value,
    setValue,
}: PartSelectorProps<T>) => (
    <select
        onChange={(e) => setValue(options.find((t) => t?.id === e.currentTarget.value)! || null)}
        style={{ marginRight: 16 }}
        value={value?.id}
    >
        {options.map((option, i) => (
            <option key={i} value={option?.id}>
                {option?.variant || option?.id || '(unchanged)'}
            </option>
        ))}
    </select>
);

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
    editable: true,
    flex: 1,
    minWidth: 100,
    filter: true,
};

const root = createRoot(document.getElementById('root')!);
root.render(
    <StrictMode>
        <GridExample />
    </StrictMode>
);
