import type { ColDef, SizeColumnsToContentStrategy } from '@ag-grid-community/core';
import { AgGridReact } from '@ag-grid-community/react';
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
    const themeClass = isDarkMode ? `${gridTheme}-dark` : gridTheme;

    return (
        <div className={styles.wrapper}>
            <div className={styles.container}>
                <div className={`${themeClass} ${styles.grid}`}>
                    <AgGridReact
                        ref={gridRef}
                        columnDefs={colDefs}
                        rowData={rowData}
                        defaultColDef={defaultColDef}
                        rowSelection="multiple"
                        autoSizeStrategy={autoSizeStrategy}
                        columnMenu="new"
                    />
                </div>
            </div>
        </div>
    );
};
