import React, { StrictMode, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';

import { ClientSideRowModelModule } from 'ag-grid-community';
import type { ColDef, RowSelectionOptions } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';

ModuleRegistry.registerModules([AllCommunityModule, ClientSideRowModelModule]);

const gridDiv = document.querySelector('#myGrid');

const rowSelection: RowSelectionOptions = {
    mode: 'multiRow',
    headerCheckbox: false,
};

const GridExample = () => {
    const [rowData, setRowData] = useState([
        { make: 'Tesla', model: 'Model Y', price: 64950, electric: true, month: 'June' },
        { make: 'Ford', model: 'F-Series', price: 33850, electric: false, month: 'October' },
        { make: 'Toyota', model: 'Corolla', price: 29600, electric: false, month: 'August' },
        { make: 'Mercedes', model: 'EQA', price: 48890, electric: true, month: 'February' },
        { make: 'Fiat', model: '500', price: 15774, electric: false, month: 'January' },
        { make: 'Nissan', model: 'Juke', price: 20675, electric: false, month: 'March' },
        { make: 'Vauxhall', model: 'Corsa', price: 18460, electric: false, month: 'July' },
        { make: 'Volvo', model: 'EX30', price: 33795, electric: true, month: 'September' },
        { make: 'Mercedes', model: 'Maybach', price: 175720, electric: false, month: 'December' },
        { make: 'Vauxhall', model: 'Astra', price: 25795, electric: false, month: 'April' },
        { make: 'Fiat', model: 'Panda', price: 13724, electric: false, month: 'November' },
        { make: 'Jaguar', model: 'I-PACE', price: 69425, electric: true, month: 'May' },
        { make: 'Tesla', model: 'Model Y', price: 64950, electric: true, month: 'June' },
        { make: 'Ford', model: 'F-Series', price: 33850, electric: false, month: 'October' },
        { make: 'Toyota', model: 'Corolla', price: 29600, electric: false, month: 'August' },
        { make: 'Mercedes', model: 'EQA', price: 48890, electric: true, month: 'February' },
        { make: 'Fiat', model: '500', price: 15774, electric: false, month: 'January' },
        { make: 'Nissan', model: 'Juke', price: 20675, electric: false, month: 'March' },
        { make: 'Vauxhall', model: 'Corsa', price: 18460, electric: false, month: 'July' },
        { make: 'Volvo', model: 'EX30', price: 33795, electric: true, month: 'September' },
        { make: 'Mercedes', model: 'Maybach', price: 175720, electric: false, month: 'December' },
        { make: 'Vauxhall', model: 'Astra', price: 25795, electric: false, month: 'April' },
        { make: 'Fiat', model: 'Panda', price: 13724, electric: false, month: 'November' },
        { make: 'Jaguar', model: 'I-PACE', price: 69425, electric: true, month: 'May' },
        { make: 'Tesla', model: 'Model Y', price: 64950, electric: true, month: 'June' },
        { make: 'Ford', model: 'F-Series', price: 33850, electric: false, month: 'October' },
        { make: 'Toyota', model: 'Corolla', price: 29600, electric: false, month: 'August' },
        { make: 'Mercedes', model: 'EQA', price: 48890, electric: true, month: 'February' },
        { make: 'Fiat', model: '500', price: 15774, electric: false, month: 'January' },
        { make: 'Nissan', model: 'Juke', price: 20675, electric: false, month: 'March' },
        { make: 'Vauxhall', model: 'Corsa', price: 18460, electric: false, month: 'July' },
        { make: 'Volvo', model: 'EX30', price: 33795, electric: true, month: 'September' },
        { make: 'Mercedes', model: 'Maybach', price: 175720, electric: false, month: 'December' },
        { make: 'Vauxhall', model: 'Astra', price: 25795, electric: false, month: 'April' },
        { make: 'Fiat', model: 'Panda', price: 13724, electric: false, month: 'November' },
        { make: 'Jaguar', model: 'I-PACE', price: 69425, electric: true, month: 'May' },
    ]);

    const [columnDefs, setColumnDefs] = useState<ColDef[]>([
        {
            field: 'make',
            editable: true,
            cellEditor: 'agSelectCellEditor',
            cellEditorParams: {
                values: ['Tesla', 'Ford', 'Toyota', 'Mercedes', 'Fiat', 'Nissan', 'Vauxhall', 'Volvo', 'Jaguar'],
            },
        },
        { field: 'model' },
        { field: 'price', filter: 'agNumberColumnFilter' },
        { field: 'electric' },
        {
            field: 'month',
            comparator: (valueA: string, valueB: string) => {
                const months = [
                    'January',
                    'February',
                    'March',
                    'April',
                    'May',
                    'June',
                    'July',
                    'August',
                    'September',
                    'October',
                    'November',
                    'December',
                ];
                const idxA = months.indexOf(valueA);
                const idxB = months.indexOf(valueB);
                return idxA - idxB;
            },
        },
    ]);

    const defaultColDef = useMemo(() => {
        return {
            filter: 'agTextColumnFilter',
            floatingFilter: true,
        };
    }, []);

    return (
        <div style={{ height: 500 }}>
            <AgGridReact
                rowData={rowData}
                columnDefs={columnDefs}
                defaultColDef={defaultColDef}
                rowSelection={rowSelection}
                pagination={true}
                paginationPageSize={10}
                paginationPageSizeSelector={[10, 25, 50]}
            />
        </div>
    );
};

const root = createRoot(document.getElementById('root')!);
root.render(
    <StrictMode>
        <GridExample />
    </StrictMode>
);
