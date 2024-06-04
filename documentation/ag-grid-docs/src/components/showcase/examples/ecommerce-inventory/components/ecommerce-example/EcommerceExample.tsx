import type { ColDef, SizeColumnsToContentStrategy } from '@ag-grid-community/core';
import { AgGridReact } from '@ag-grid-community/react';
import { getResourceUrl } from '@components/showcase/examples/portfolio-positions/utils/getResourceUrl';
import { DownloadIcon } from 'lucide-react';
import { type FunctionComponent, useRef, useState } from 'react';

import { quantityCalculator } from '../../utils/valueGetters';
import { ActionsCellRenderer } from '../actions-cell-renderer/ActionsCellRenderer';
import { ImageCellRenderer } from '../image-cell-renderer/ImageCellRenderer';
import { ProductCellRenderer } from '../product-cell-renderer/ProductCellRenderer';
import { StatusCellRenderer } from '../status-cell-renderer/StatusCellRenderer';
import styles from './EcommerceExample.module.css';
import { getData } from './data';

interface Props {
    gridTheme?: string;
    isDarkMode?: boolean;
}

const whenSoldOut = ['Discontinued', 'Back order', 'Email when available'];

export const EcommerceExample: FunctionComponent<Props> = ({ gridTheme = 'ag-theme-quartz', isDarkMode }) => {
    const gridRef = useRef<AgGridReact>(null);

    const [colDefs] = useState<ColDef[]>([
        {
            headerCheckboxSelection: true,
            checkboxSelection: true,
            field: 'imageURL',
            headerName: 'Image',
            cellRenderer: ImageCellRenderer,
            autoHeight: true,
        },
        {
            field: 'product',
            headerName: 'Product',
            cellRenderer: ProductCellRenderer,
            wrapText: true,
            filter: true,
        },
        {
            field: 'status',
            headerName: 'Status',
            cellRenderer: StatusCellRenderer,
            filter: true,
        },
        { field: 'sku', headerName: 'SKU' },

        {
            field: 'whenSoldOut',
            cellEditor: 'agSelectCellEditor',
            cellEditorParams: {
                values: whenSoldOut,
            },
            editable: true,
        },
        {
            field: 'available',
            cellEditor: 'agNumberCellEditor',
            filter: 'agNumberColumnFilter',
            cellEditorParams: {
                precision: 0,
                step: 1,
                showStepperButtons: true,
            },
            editable: true,
        },
        {
            field: 'unavailable',
            cellEditor: 'agNumberCellEditor',
            filter: 'agNumberColumnFilter',
            cellEditorParams: {
                precision: 0,
                step: 1,
                showStepperButtons: true,
            },
            editable: true,
        },
        { field: 'onHand', valueGetter: quantityCalculator, filter: 'agNumberColumnFilter' },
        {
            field: 'incoming',
            cellEditor: 'agNumberCellEditor',
            filter: 'agNumberColumnFilter',
            cellEditorParams: {
                precision: 0,
                step: 1,
                showStepperButtons: true,
            },
            editable: true,
        },
        { field: 'actions', cellRenderer: ActionsCellRenderer, pinned: 'right' },
    ]);
    const [rowData] = useState(getData());
    const [defaultColDef] = useState({
        flex: 1,
    });
    const [autoSizeStrategy] = useState<SizeColumnsToContentStrategy>({
        type: 'fitCellContents',
    });
    const pagination = true;
    const paginationPageSize = 10;
    const paginationPageSizeSelector = [10, 20, 50];

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
                        <DownloadIcon className={styles.icon} />
                        Export to Excel
                    </button>
                </div>
                <div className={`${themeClass} ${styles.grid}`}>
                    <AgGridReact
                        ref={gridRef}
                        columnDefs={colDefs}
                        rowData={rowData}
                        defaultColDef={defaultColDef}
                        rowSelection="multiple"
                        autoSizeStrategy={autoSizeStrategy}
                        pagination={pagination}
                        paginationPageSize={paginationPageSize}
                        paginationPageSizeSelector={paginationPageSizeSelector}
                        columnMenu="new"
                    />
                </div>
            </div>
        </div>
    );
};
