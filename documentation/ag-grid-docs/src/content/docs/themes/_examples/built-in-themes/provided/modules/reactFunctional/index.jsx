import React, { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';

import { AllCommunityModule, ModuleRegistry, themeAlpine, themeBalham, themeQuartz } from 'ag-grid-community';
import { AllEnterpriseModule } from 'ag-grid-enterprise';
import { AgGridReact } from 'ag-grid-react';

ModuleRegistry.registerModules([AllCommunityModule, AllEnterpriseModule]);

const themes = [
    { id: 'themeQuartz', theme: themeQuartz },
    { id: 'themeBalham', theme: themeBalham },
    { id: 'themeAlpine', theme: themeAlpine },
];

const GridExample = () => {
    const [theme, setBaseTheme] = useState(themes[0]);

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <p style={{ flex: 0 }}>
                Theme: <PartSelector options={themes} value={theme} setValue={setBaseTheme} />
            </p>
            <div style={{ flex: 1 }}>
                <AgGridReact
                    theme={theme.theme}
                    columnDefs={columnDefs}
                    rowData={rowData}
                    defaultColDef={defaultColDef}
                    sideBar
                />
            </div>
        </div>
    );
};

const PartSelector = ({ options, value, setValue }) => (
    <select
        onChange={(e) => setValue(options.find((t) => t?.id === e.currentTarget.value) || null)}
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

const rowData = (() => {
    const rowData = [];
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

const root = createRoot(document.getElementById('root'));
root.render(
    <StrictMode>
        <GridExample />
    </StrictMode>
);
