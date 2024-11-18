import { type FunctionComponent, useCallback, useMemo, useRef, useState } from 'react';

import type { ColDef, GetDataPath, ValueFormatterFunc, ValueFormatterParams } from 'ag-grid-community';
import { AllCommunityModule, ClientSideRowModelModule, ModuleRegistry } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import {
    ExcelExportModule,
    MasterDetailModule,
    RichSelectModule,
    RowGroupingModule,
    SetFilterModule,
    StatusBarModule,
    TreeDataModule,
} from 'ag-grid-enterprise';
import { AgGridReact } from 'ag-grid-react';

import styles from './HRExample.module.css';
import { ContactCellRenderer } from './cell-renderers/ContactCellRenderer';
import { EmployeeCellRenderer } from './cell-renderers/EmployeeCellRenderer';
import { FlagCellRenderer } from './cell-renderers/FlagCellRenderer';
import { StatusCellRenderer } from './cell-renderers/StatusCellRenderer';
import { TagCellRenderer } from './cell-renderers/TagCellRenderer';
import { getData } from './data';

ModuleRegistry.registerModules([
    AllCommunityModule,
    ClientSideRowModelModule,
    ExcelExportModule,
    MasterDetailModule,
    RowGroupingModule,
    RichSelectModule,
    SetFilterModule,
    StatusBarModule,
    TreeDataModule,
]);

interface Props {
    gridTheme?: string;
    isDarkMode?: boolean;
}

const employmentType = ['Permanent', 'Contract'];
const paymentMethod = ['Cash', 'Check', 'Bank Transfer'];
const paymentStatus = ['Paid', 'Pending'];
const departments = {
    executiveManagement: 'Executive Management',
    legal: 'Legal',
    design: 'Design',
    engineering: 'Engineering',
    product: 'Product',
    customerSupport: 'Customer Support',
};
const departmentFormatter: ValueFormatterFunc = ({ value }) => departments[value as keyof typeof departments] ?? '';

export const HRExample: FunctionComponent<Props> = ({ gridTheme = 'ag-theme-quartz', isDarkMode }) => {
    const gridRef = useRef<AgGridReact>(null);

    const [colDefs] = useState<ColDef[]>([
        {
            headerName: 'ID',
            field: 'employeeId',
            width: 120,
        },
        {
            field: 'department',
            width: 250,
            minWidth: 250,
            flex: 1,
            valueFormatter: departmentFormatter,
            cellRenderer: TagCellRenderer,
        },
        {
            field: 'employmentType',
            editable: true,
            width: 180,
            minWidth: 180,
            flex: 1,
            cellEditor: 'agRichSelectCellEditor',
            cellEditorParams: {
                values: employmentType,
            },
        },
        {
            field: 'location',
            width: 200,
            minWidth: 200,
            flex: 1,
            cellRenderer: FlagCellRenderer,
            editable: true,
        },
        {
            field: 'joinDate',
            editable: true,
            width: 120,
        },
        {
            headerName: 'Salary',
            field: 'basicMonthlySalary',
            valueFormatter: ({ value }: ValueFormatterParams) =>
                value == null ? '' : `$${Math.round(value).toLocaleString()}`,
        },
        {
            field: 'paymentMethod',
            editable: true,
            width: 180,
            cellEditor: 'agRichSelectCellEditor',
            cellEditorParams: {
                values: paymentMethod,
            },
        },
        {
            headerName: 'Status',
            field: 'paymentStatus',
            editable: true,
            width: 100,
            cellRenderer: StatusCellRenderer,
            cellEditor: 'agRichSelectCellEditor',
            cellEditorParams: {
                values: paymentStatus,
            },
        },
        {
            field: 'contact',
            pinned: 'right',
            cellRenderer: ContactCellRenderer,
            width: 120,
        },
    ]);
    const [rowData] = useState(getData());
    const getDataPath = useCallback<GetDataPath>((data) => data.orgHierarchy, []);
    const themeClass = isDarkMode ? `${gridTheme}-dark` : gridTheme;
    const autoGroupColumnDef = useMemo<ColDef>(() => {
        return {
            headerName: 'Employee',
            width: 330,
            pinned: 'left',
            sort: 'asc',
            cellRenderer: 'agGroupCellRenderer',
            cellRendererParams: {
                suppressCount: true,
                innerRenderer: EmployeeCellRenderer,
            },
        };
    }, []);

    return (
        <div className={styles.wrapper}>
            <div className={styles.container}>
                <div className={`${themeClass} ${styles.grid}`}>
                    <AgGridReact
                        theme="legacy"
                        ref={gridRef}
                        columnDefs={colDefs}
                        rowData={rowData}
                        groupDefaultExpanded={-1}
                        getDataPath={getDataPath}
                        treeData
                        autoGroupColumnDef={autoGroupColumnDef}
                    />
                </div>
            </div>
        </div>
    );
};
