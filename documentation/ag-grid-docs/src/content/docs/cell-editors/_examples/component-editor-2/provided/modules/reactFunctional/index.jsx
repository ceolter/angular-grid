import React, { StrictMode, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';

import { ClientSideRowModelModule } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { RichSelectModule } from 'ag-grid-enterprise';
import { AgGridReact } from 'ag-grid-react';

import { getData } from './data.jsx';
import GenderRenderer from './genderRenderer.jsx';
import MoodEditor from './moodEditor.jsx';
import MoodRenderer from './moodRenderer.jsx';
import SimpleTextEditor from './simpleTextEditor.jsx';
import './styles.css';

ModuleRegistry.registerModules([AllCommunityModule, ClientSideRowModelModule, RichSelectModule]);

const GridExample = () => {
    const containerStyle = useMemo(() => ({ width: '100%', height: '100%' }), []);
    const gridStyle = useMemo(() => ({ height: '100%', width: '100%' }), []);
    const [rowData, setRowData] = useState(getData());
    const [columnDefs, setColumnDefs] = useState([
        { field: 'first_name', headerName: 'Provided Text' },
        {
            field: 'last_name',
            headerName: 'Custom Text',
            cellEditor: SimpleTextEditor,
        },
        {
            field: 'age',
            headerName: 'Provided Number',
            cellEditor: 'agNumberCellEditor',
        },
        {
            field: 'gender',
            headerName: 'Provided Rich Select',
            cellRenderer: GenderRenderer,
            cellEditor: 'agRichSelectCellEditor',
            cellEditorParams: {
                cellRenderer: GenderRenderer,
                values: ['Male', 'Female'],
            },
        },
        {
            field: 'mood',
            headerName: 'Custom Mood',
            cellRenderer: MoodRenderer,
            cellEditor: MoodEditor,
            cellEditorPopup: true,
        },
    ]);
    const defaultColDef = useMemo(() => {
        return {
            editable: true,
            flex: 1,
            minWidth: 100,
        };
    }, []);

    return (
        <div style={containerStyle}>
            <div style={gridStyle}>
                <AgGridReact rowData={rowData} columnDefs={columnDefs} defaultColDef={defaultColDef} />
            </div>
        </div>
    );
};

const root = createRoot(document.getElementById('root'));
root.render(
    <StrictMode>
        <GridExample />
    </StrictMode>
);
