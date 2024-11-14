import React, { StrictMode, useCallback, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';

import { ClientSideRowModelModule } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';

import CustomElements from './customElements.jsx';
import './styles.css';

ModuleRegistry.registerModules([AllCommunityModule, ClientSideRowModelModule]);

const GRID_CELL_CLASSNAME = 'ag-cell';

const getAllFocusableElementsOf = (el) => {
    return Array.from(
        el.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
    ).filter((focusableEl) => {
        return focusableEl.tabIndex !== -1;
    });
};

const getEventPath = (event) => {
    const path = [];
    let currentTarget = event.target;
    while (currentTarget) {
        path.push(currentTarget);
        currentTarget = currentTarget.parentElement;
    }
    return path;
};

/**
 * Capture whether the user is tabbing forwards or backwards and suppress keyboard event if tabbing
 * outside of the children
 */
const suppressKeyboardEvent = ({ event }) => {
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
        if (focusableChildrenElements.length === 0) {
            return false;
        }

        const currentIndex = focusableChildrenElements.indexOf(document.activeElement);

        if (isTabForward) {
            const isLastChildFocused = lastCellChildEl && document.activeElement === lastCellChildEl;

            if (!isLastChildFocused) {
                suppressEvent = true;
                if (currentIndex !== -1 || document.activeElement === eGridCell) {
                    event.preventDefault();
                    focusableChildrenElements[currentIndex + 1].focus();
                }
            }
        }
        // Suppress keyboard event if tabbing backwards within the cell, and the current focused element is not the first child
        else {
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
                if (currentIndex !== -1 || document.activeElement === eGridCell) {
                    event.preventDefault();
                    focusableChildrenElements[currentIndex - 1].focus();
                }
            }
        }
    }

    return suppressEvent;
};

const GridExample = () => {
    const containerStyle = useMemo(() => ({ width: '100%', height: '100%' }), []);
    const gridStyle = useMemo(() => ({ height: '100%', width: '100%' }), []);
    const [rowData, setRowData] = useState();
    const [columnDefs, setColumnDefs] = useState([
        {
            field: 'athlete',
        },
        {
            field: 'country',
            flex: 1,
            cellRenderer: CustomElements,
        },
    ]);
    const defaultColDef = useMemo(() => {
        return {
            minWidth: 130,
            suppressKeyboardEvent,
        };
    }, []);

    const onGridReady = useCallback((params) => {
        fetch('https://www.ag-grid.com/example-assets/small-olympic-winners.json')
            .then((resp) => resp.json())
            .then((data) => {
                setRowData(data);
            });
    }, []);

    return (
        <div style={containerStyle}>
            <div style={gridStyle}>
                <AgGridReact
                    rowData={rowData}
                    columnDefs={columnDefs}
                    defaultColDef={defaultColDef}
                    onGridReady={onGridReady}
                />
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
