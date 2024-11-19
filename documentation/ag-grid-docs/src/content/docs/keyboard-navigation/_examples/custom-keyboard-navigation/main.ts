import { ClientSideRowModelModule } from 'ag-grid-community';
import type {
    CellPosition,
    ColDef,
    ColGroupDef,
    Column,
    ColumnGroup,
    GridApi,
    GridOptions,
    HeaderPosition,
    NavigateToNextCellParams,
    NavigateToNextHeaderParams,
    TabToNextCellParams,
    TabToNextHeaderParams,
} from 'ag-grid-community';
import { createGrid } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';

ModuleRegistry.registerModules([AllCommunityModule, ClientSideRowModelModule]);

const columnDefs: (ColDef | ColGroupDef)[] = [
    {
        headerName: 'Athlete',
        children: [{ field: 'athlete', headerName: 'Name', minWidth: 170 }, { field: 'age' }, { field: 'country' }],
    },

    { field: 'year' },
    { field: 'sport' },
    {
        headerName: 'Medals',
        children: [{ field: 'gold' }, { field: 'silver' }, { field: 'bronze' }, { field: 'total' }],
    },
];

// define some handy keycode constants
const KEY_LEFT = 'ArrowLeft';
const KEY_UP = 'ArrowUp';
const KEY_RIGHT = 'ArrowRight';
const KEY_DOWN = 'ArrowDown';

let gridApi: GridApi<IOlympicData>;

const gridOptions: GridOptions<IOlympicData> = {
    // make all cols editable
    defaultColDef: {
        editable: true,
        flex: 1,
        minWidth: 100,
        filter: true,
    },

    navigateToNextCell: navigateToNextCell,
    tabToNextCell: tabToNextCell,

    navigateToNextHeader: navigateToNextHeader,
    tabToNextHeader: tabToNextHeader,

    columnDefs: columnDefs,
};

function navigateToNextHeader(params: NavigateToNextHeaderParams): HeaderPosition | null {
    const nextHeader = params.nextHeaderPosition;

    if (params.key !== 'ArrowDown' && params.key !== 'ArrowUp') {
        return nextHeader;
    }

    const processedNextHeader = moveHeaderFocusUpDown(
        params.previousHeaderPosition!,
        params.headerRowCount,
        params.key === 'ArrowDown'
    );

    return processedNextHeader;
}

function tabToNextHeader(params: TabToNextHeaderParams): HeaderPosition | null {
    return moveHeaderFocusUpDown(params.previousHeaderPosition!, params.headerRowCount, params.backwards);
}

function moveHeaderFocusUpDown(previousHeader: HeaderPosition, headerRowCount: number, isUp: boolean): HeaderPosition {
    const previousColumn = previousHeader.column;
    const isSpanHeaderHeight =
        !!(previousColumn as Column).isSpanHeaderHeight && (previousColumn as Column).isSpanHeaderHeight();

    const lastRowIndex = previousHeader.headerRowIndex;
    let nextRowIndex = isUp ? lastRowIndex - 1 : lastRowIndex + 1;
    let nextColumn;

    if (nextRowIndex === -1) {
        return previousHeader;
    }

    if (nextRowIndex === headerRowCount) {
        nextRowIndex = -1;
    }

    let parentColumn = previousColumn.getParent();
    if (isUp) {
        if (isSpanHeaderHeight) {
            while (parentColumn && parentColumn.isPadding()) {
                parentColumn = parentColumn.getParent();
            }
        }

        if (!parentColumn) {
            return previousHeader;
        }

        nextColumn = parentColumn;
    } else {
        const children =
            ((previousColumn as ColumnGroup).getChildren && (previousColumn as ColumnGroup).getChildren()) || [];
        nextColumn = children.length > 0 ? children[0] : previousColumn;
    }

    return {
        headerRowIndex: nextRowIndex,
        column: nextColumn as Column,
    };
}

function tabToNextCell(params: TabToNextCellParams): CellPosition | null {
    const previousCell = params.previousCellPosition;
    const renderedRowCount = params.api!.getDisplayedRowCount();
    const lastRowIndex = previousCell.rowIndex;

    let nextRowIndex = params.backwards ? lastRowIndex - 1 : lastRowIndex + 1;

    if (nextRowIndex < 0) {
        nextRowIndex = -1;
    }

    if (nextRowIndex >= renderedRowCount) {
        nextRowIndex = renderedRowCount - 1;
    }

    const result = {
        rowIndex: nextRowIndex,
        column: previousCell.column,
        rowPinned: previousCell.rowPinned,
    };

    return result;
}

function navigateToNextCell(params: NavigateToNextCellParams): CellPosition | null {
    const previousCell = params.previousCellPosition,
        suggestedNextCell = params.nextCellPosition;
    let nextRowIndex, renderedRowCount;

    switch (params.key) {
        case KEY_DOWN:
            // return the cell above
            nextRowIndex = previousCell.rowIndex - 1;
            if (nextRowIndex < -1) {
                return null;
            } // returning null means don't navigate

            return {
                rowIndex: nextRowIndex,
                column: previousCell.column,
                rowPinned: previousCell.rowPinned,
            };
        case KEY_UP:
            // return the cell below
            nextRowIndex = previousCell.rowIndex + 1;
            renderedRowCount = params.api!.getDisplayedRowCount();
            if (nextRowIndex >= renderedRowCount) {
                return null;
            } // returning null means don't navigate

            return {
                rowIndex: nextRowIndex,
                column: previousCell.column,
                rowPinned: previousCell.rowPinned,
            };
        case KEY_LEFT:
        case KEY_RIGHT:
            return suggestedNextCell;
        default:
            throw Error('this will never happen, navigation is always one of the 4 keys above');
    }
}

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);

    fetch('https://www.ag-grid.com/example-assets/olympic-winners.json')
        .then((response) => response.json())
        .then((data: IOlympicData[]) => gridApi!.setGridOption('rowData', data));
});
