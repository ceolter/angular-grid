import type { GridApi, GridOptions, IsFullWidthRowParams, SuppressKeyboardEventParams } from 'ag-grid-community';
import {
    ClientSideRowModelModule,
    ModuleRegistry,
    TextFilterModule,
    ValidationModule,
    createGrid,
} from 'ag-grid-community';

import { getData } from './data';
import { FullWidthCellRenderer } from './fullWidthCellRenderer_typescript';

ModuleRegistry.registerModules([TextFilterModule, ClientSideRowModelModule, ValidationModule /* Development Only */]);

const GRID_CELL_CLASSNAME = 'ag-full-width-row';

function getAllFocusableElementsOf(el: HTMLElement) {
    return Array.from<HTMLElement>(
        el.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
    ).filter((focusableEl) => {
        return focusableEl.tabIndex !== -1;
    });
}

function getEventPath(event: Event): HTMLElement[] {
    const path: HTMLElement[] = [];
    let currentTarget: any = event.target;

    while (currentTarget) {
        path.push(currentTarget);
        currentTarget = currentTarget.parentElement;
    }

    return path;
}

/**
 * Capture whether the user is tabbing forwards or backwards and suppress keyboard event if tabbing
 * outside of the children
 */
function suppressKeyboardEvent({ event }: SuppressKeyboardEventParams<any>) {
    const { key, shiftKey } = event;
    const path = getEventPath(event);
    const isTabForward = key === 'Tab' && shiftKey === false;
    const isTabBackward = key === 'Tab' && shiftKey === true;

    let suppressEvent = false;

    // Handle cell children tabbing
    if (isTabForward || isTabBackward) {
        const eGridCell = path.find((el) => {
            if (el.classList === undefined) return false;
            return el.classList.contains(GRID_CELL_CLASSNAME);
        });

        if (!eGridCell) {
            return suppressEvent;
        }

        const focusableChildrenElements = getAllFocusableElementsOf(eGridCell);
        const lastCellChildEl = focusableChildrenElements[focusableChildrenElements.length - 1];
        const firstCellChildEl = focusableChildrenElements[0];

        // Suppress keyboard event if tabbing forward within the cell and the current focused element is not the last child
        if (isTabForward && focusableChildrenElements.length > 0) {
            const isLastChildFocused = lastCellChildEl && document.activeElement === lastCellChildEl;
            if (!isLastChildFocused) {
                suppressEvent = true;
            }
        }
        // Suppress keyboard event if tabbing backwards within the cell, and the current focused element is not the first child
        else if (isTabBackward && focusableChildrenElements.length > 0) {
            const cellHasFocusedChildren =
                eGridCell.contains(document.activeElement) && eGridCell !== document.activeElement;

            // Manually set focus to the last child element if cell doesn't have focused children
            if (!cellHasFocusedChildren) {
                lastCellChildEl.focus();
                // Cancel keyboard press, so that it doesn't focus on the last child and then pass through the keyboard press to
                // move to the 2nd last child element
                event.preventDefault();
            }

            const isFirstChildFocused = firstCellChildEl && document.activeElement === firstCellChildEl;
            if (!isFirstChildFocused) {
                suppressEvent = true;
            }
        }
    }

    return suppressEvent;
}

let gridApi: GridApi;

const gridOptions: GridOptions = {
    columnDefs: [{ field: 'name' }, { field: 'continent' }, { field: 'language' }],
    defaultColDef: {
        flex: 1,
        filter: true,
        suppressKeyboardEvent,
    },
    rowData: getData(),
    isFullWidthRow: (params: IsFullWidthRowParams) => {
        return isFullWidth(params.rowNode.data);
    },
    // see AG Grid docs cellRenderer for details on how to build cellRenderers
    fullWidthCellRenderer: FullWidthCellRenderer,
};

function isFullWidth(data: any) {
    // return true when country is Peru, France or Italy
    return ['Peru', 'France', 'Italy'].includes(data.name);
}

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);
});
