import { AgGridReact } from '@ag-grid-community/react';
import { getResourceUrl } from '@components/showcase/examples/portfolio-positions/utils/getResourceUrl';
import { type FunctionComponent, useCallback, useMemo, useRef, useState } from 'react';

import type { ColDef } from 'ag-grid-community';

import { currencyFormatter } from '../../utils/valueFormatters';
import { EmployeeCellRenderer } from '../employee-cell-renderer/EmployeeCellRenderer';
import { EmployeeDetailsRenderer } from '../employee-details-renderer/EmployeeDetailsRenderer';
import { FlagRenderer } from '../flag-renderer/FlagRenderer';
import { TagCellRenderer } from '../tag-cell-renderer/TagCellRenderer';
import styles from './HRExample.module.css';
import { getData } from './data';

interface Props {
    gridTheme?: string;
    isDarkMode?: boolean;
}

export const HRExample: FunctionComponent<Props> = ({ gridTheme = 'ag-theme-quartz', isDarkMode }) => {
    const gridRef = useRef<AgGridReact>(null);

    const [colDefs] = useState<ColDef[]>([
        {
            headerName: 'Employee',
            field: 'name',
            cellDataType: 'text',
            width: 220,
            cellRenderer: 'agGroupCellRenderer',
            cellRendererParams: {
                innerRenderer: EmployeeCellRenderer,
            },
        },
        {
            headerName: 'Location',
            field: 'location',
            cellDataType: 'text',
            width: 200,
            cellRenderer: FlagRenderer,
        },
        {
            headerName: 'Title',
            field: 'department',
            cellDataType: 'text',
            width: 200,
            cellRenderer: TagCellRenderer,
        },
        { field: 'employmentType' },
        { field: 'basicMonthlySalary', cellDataType: 'number', valueFormatter: currencyFormatter },
        { field: 'employeeId', cellDataType: 'number' },
        { field: 'paymentMethod', cellDataType: 'text' },
        { field: 'paymentStatus', cellDataType: 'text' },
    ]);
    const rowData = getData();
    const getDataPath = useCallback((data) => {
        return data.orgHierarchy;
    }, []);
    const detailCellRendererParams = useMemo(() => {
        return {
            detailGridOptions: {
                columnDefs: [
                    { field: 'value', headerName: 'Type', width: 150, cellRenderer: EmployeeDetailsRenderer },
                    { field: 'value', headerName: 'Description', width: 150 },
                    { field: 'value', headerName: 'Gross Amount', width: 150 },
                ],
                defaultColDef: {
                    flex: 1,
                    minWidth: 100,
                },
            },
            getDetailRowData: function (params) {
                // Here you can provide the detail data for each row
                params.successCallback([{ attribute: 'Type' }, { attribute: 'Type' }]);
            },
        };
    }, []);

    const themeClass = isDarkMode ? `${gridTheme}-dark` : gridTheme;

    return (
        <div className={styles.wrapper}>
            <div className={styles.container}>
                <div className={styles.toolbar}>
                    <button
                        id="export-to-excel"
                        className="button-secondary"
                        onClick={() => {
                            gridRef.current?.api.exportDataAsExcel();
                        }}
                    >
                        <img
                            className={styles.buttonIcon}
                            src={getResourceUrl(`/example/finance/icons/download.svg`)}
                        />
                        Export to Excel
                    </button>
                </div>
                <div className={`${themeClass} ${styles.grid}`}>
                    <AgGridReact
                        ref={gridRef}
                        columnDefs={colDefs}
                        rowData={rowData}
                        groupDefaultExpanded={0}
                        getDataPath={getDataPath}
                        masterDetail={true}
                        detailCellRendererParams={detailCellRendererParams}
                        columnMenu="new"
                    />
                </div>
            </div>
        </div>
    );
};
