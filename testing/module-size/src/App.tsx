import { useMemo, useRef, useState } from 'react';

import {
    ColDef,
    ModuleRegistry,
    themeQuartz
} from 'ag-grid-community';

/** __CHARTS_PLACEHOLDER__START__ */  /** __CHARTS_PLACEHOLDER__END__ */

import {
    /** __PLACEHOLDER__START__ */  /** __PLACEHOLDER__END__ */
} from 'ag-grid-community';
import {
    /** __ENTERPRISE_PLACEHOLDER__START__ */  /** __ENTERPRISE_PLACEHOLDER__END__ */
} from 'ag-grid-enterprise';
import { AgGridReact } from 'ag-grid-react';

ModuleRegistry.registerModules([
    /** __PLACEHOLDER__START__ */  /** __PLACEHOLDER__END__ */
]);

ModuleRegistry.registerModules([
    /** __ENTERPRISE_PLACEHOLDER__START__ */  /** __ENTERPRISE_PLACEHOLDER__END__ */
]);

export const App = () => {
    const gridRef = useRef<AgGridReact>(null);
    const containerStyle = useMemo(() => ({ width: '100%', height: '100%' }), []);
    const gridStyle = useMemo(() => ({ height: '100%', width: '100%' }), []);
    const [rowData, setRowData] = useState<any[]>();
    const [columnDefs] = useState<ColDef[]>([
        {
            field: 'athlete',
            minWidth: 150,
        },
        { field: 'age', maxWidth: 90 },
        { field: 'country', minWidth: 150 },
        { field: 'year', maxWidth: 90 },
        { field: 'date', minWidth: 150 },
        { field: 'sport', minWidth: 150 },
        { field: 'gold' },
        { field: 'silver' },
        { field: 'bronze' },
        { field: 'total' },
    ]);
    const defaultColDef = useMemo<ColDef>(() => {
        return {
            flex: 1,
            minWidth: 100,
            filter: true,
        };
    }, []);

    const onGridReady = () => {
        fetch('https://www.ag-grid.com/example-assets/olympic-winners.json')
            .then((resp) => resp.json())
            .then((data) => setRowData(data));
    };

    return (
        <div style={containerStyle}>
            <div className="example-wrapper">
                <div style={gridStyle} className={'ag-theme-quartz-dark'}>
                    <AgGridReact
                        ref={gridRef}
                        theme={themeQuartz}
                        rowData={rowData}
                        columnDefs={columnDefs}
                        defaultColDef={defaultColDef}
                        enableCharts
                        cellSelection={true}
                        onGridReady={onGridReady}
                    />
                </div>
            </div>
        </div>
    );
};
