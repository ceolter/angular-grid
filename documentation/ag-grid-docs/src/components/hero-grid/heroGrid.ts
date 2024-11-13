/**
 * Hero Grid demo
 */
import { createGenerator } from '@utils/grid/generator-utils';
import { AgChartsCommunityModule } from 'ag-charts-community';

import type { GetRowIdParams, GridApi, GridOptions, GridSizeChangedEvent, ISetFilter } from 'ag-grid-community';
import { ClientSideRowModelModule, ModuleRegistry, createGrid } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import { ClipboardModule, MenuModule, SetFilterModule, SparklinesModule } from 'ag-grid-enterprise';

import { COLUMN_ID_PRIORITIES, FILTER_ROWS_BREAKPOINT, UPDATE_INTERVAL } from './constants';
import { columnDefs, generateStockUpdate, generateStocks } from './data';
import { fixtureData } from './rowDataFixture';

ModuleRegistry.registerModules([
    ClientSideRowModelModule,
    SparklinesModule.with(AgChartsCommunityModule),
    SetFilterModule,
    ClipboardModule,
    MenuModule,
]);

let api: GridApi;
const rowData = generateStocks();
const generator = createGenerator({
    interval: UPDATE_INTERVAL,
    callback: () => {
        if (!api) {
            return;
        }

        const randomIndex = Math.floor(Math.random() * rowData.length);
        const stockToUpdate = rowData[randomIndex];
        const newStock = generateStockUpdate(stockToUpdate);

        rowData[randomIndex] = newStock;
        api.applyTransactionAsync({
            update: [newStock],
        });
    },
});
const gridOptions: GridOptions = {
    theme: 'legacy',
    columnDefs,
    rowData,
    rowHeight: 48,
    headerHeight: 30,
    domLayout: 'autoHeight',
    animateRows: false,
    getRowId: ({ data }: GetRowIdParams) => String(data.stock),
    onGridSizeChanged(params: GridSizeChangedEvent) {
        const columnsToShow: string[] = [];
        const columnsToHide: string[] = [];
        let totalWidth: number = 0;
        let hasFilledColumns = false;
        COLUMN_ID_PRIORITIES.forEach((colId) => {
            const col = params.api.getColumn(colId);
            const minWidth = col?.getMinWidth() || 0;
            const newTotalWidth = totalWidth + minWidth;

            if (!hasFilledColumns && newTotalWidth <= params.clientWidth) {
                columnsToShow.push(colId);
                totalWidth = newTotalWidth;
            } else {
                hasFilledColumns = true;
                columnsToHide.push(colId);
            }
        });

        // show/hide columns based on current grid width
        params.api.setColumnsVisible(columnsToShow, true);
        params.api.setColumnsVisible(columnsToHide, false);

        params.api.getColumnFilterInstance<ISetFilter>('stock').then((stockFilter) => {
            const stocks = stockFilter!.getFilterValues();
            const values = innerWidth < FILTER_ROWS_BREAKPOINT ? stocks.slice(0, 6) : stocks;

            stockFilter!
                .setModel({
                    values,
                })
                .then(() => {
                    params.api.onFilterChanged();
                });
        })!;
    },
};

/*
 * Initialise the grid using plain JavaScript, so grid can be dynamically loaded.
 */
export function initGrid({
    selector,
    suppressUpdates,
    useStaticData,
}: {
    selector: string;
    suppressUpdates?: boolean;
    useStaticData?: boolean;
}) {
    const init = () => {
        const gridDiv = document.querySelector(selector) as HTMLElement;
        if (!gridDiv) {
            return;
        }

        if (useStaticData) {
            gridOptions.rowData = fixtureData;
        }
        gridOptions.popupParent = document.querySelector('body');
        gridOptions.onGridReady = () => {
            if (suppressUpdates) {
                return;
            }

            generator.start();
        };
        api = createGrid(gridDiv, gridOptions);

        gridDiv.classList.add('loaded');
    };

    const loadGrid = function () {
        if (document.querySelector(selector)) {
            init();
        } else {
            requestAnimationFrame(() => loadGrid());
        }
    };

    loadGrid();
}

export function cleanUp() {
    generator.stop();
    api?.destroy();

    // Clean up tooltip, if user mouse happens to be hovering over
    document.querySelector('.ag-sparkline-tooltip-wrapper')?.remove();
}

/**
 * Clean up between hot module replacement on dev server
 */
if (import.meta.hot) {
    import.meta.hot.dispose(() => {
        cleanUp();
    });
}
