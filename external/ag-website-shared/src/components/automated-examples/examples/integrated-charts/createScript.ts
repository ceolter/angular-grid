import type { Group } from '@tweenjs/tween.js';

import type { GridApi } from 'ag-grid-community';

import { createAgElementFinder } from '../../lib/agElements';
import type { Mouse } from '../../lib/createMouse';
import { getBottomMidPos, getOffset, getScrollOffset } from '../../lib/dom';
import { addPoints, scalePoint } from '../../lib/geometry';
import { clearAllRowHighlights } from '../../lib/scriptActions/clearAllRowHighlights';
import { dragRange } from '../../lib/scriptActions/dragRange';
import { moveTarget } from '../../lib/scriptActions/move';
import type { ScriptDebugger } from '../../lib/scriptDebugger';
import type { ScriptAction } from '../../lib/scriptRunner';

interface Params {
    containerEl: HTMLElement;
    /**
     * Whether the container element is scaled or not, and by how much
     */
    getContainerScale?: () => number;
    mouse: Mouse;
    getOverlay: () => HTMLElement;
    tweenGroup: Group;
    gridApi: GridApi;
    scriptDebugger?: ScriptDebugger;
}

export const createScript = ({
    containerEl,
    getContainerScale = () => 1,
    mouse,
    tweenGroup,
    gridApi,
    scriptDebugger,
}: Params): ScriptAction[] => {
    const START_CELL_COL_INDEX = 0;
    const START_CELL_ROW_INDEX = 0;
    const END_CELL_COL_INDEX = 4; // Till `Mar` column
    const END_CELL_ROW_INDEX = 9;

    const agElementFinder = createAgElementFinder({ containerEl });
    const getOffscreenPos = () => getBottomMidPos(containerEl);

    return [
        {
            type: 'custom',
            action: () => {
                // Move mouse to starting position
                moveTarget({
                    target: mouse.getTarget(),
                    coords: scalePoint(getOffscreenPos(), getContainerScale()),
                    offset: addPoints(
                        getOffset(containerEl),
                        getScrollOffset(),
                        scalePoint(
                            {
                                x: 0,
                                y: -120,
                            },
                            getContainerScale()
                        )
                    ),
                    scriptDebugger,
                });

                mouse.show();
            },
        },
        {
            type: 'agAction',
            actionType: 'reset',
            actionParams: {
                scrollRow: 0,
                scrollColumn: 0,
            },
        },

        { type: 'wait', duration: 700 },

        // Select start cell
        {
            type: 'moveTo',
            toPos: () =>
                agElementFinder
                    .get('cell', {
                        colIndex: START_CELL_COL_INDEX,
                        rowIndex: START_CELL_ROW_INDEX,
                    })
                    ?.getPos(),
            speed: 2,
        },
        { type: 'mouseDown' },
        {
            type: 'custom',
            action: () => {
                clearAllRowHighlights();
            },
        },

        // Range selection
        {
            type: 'custom',
            action() {
                return dragRange({
                    agElementFinder,
                    mouse,
                    startCol: START_CELL_COL_INDEX,
                    startRow: START_CELL_ROW_INDEX,
                    endCol: END_CELL_COL_INDEX,
                    endRow: END_CELL_ROW_INDEX,
                    tweenGroup,
                    scriptDebugger,
                    duration: 400,
                });
            },
        },
        { type: 'mouseUp' },
        { type: 'wait', duration: 600 },

        {
            type: 'agAction',
            actionType: 'clickOnContextMenuItem',
            actionParams: {
                mouse,
                rightClickOnCell: {
                    colIndex: END_CELL_COL_INDEX,
                    rowIndex: END_CELL_ROW_INDEX,
                },
                menuItemPath: ['Chart Range', 'Line'],
                tweenGroup,
                scriptDebugger,
                speed: 0.5,
            },
        },
        {
            name: 'Create range chart',
            type: 'custom',
            action: () => {
                const chartModels = gridApi.getChartModels() || [];

                if (chartModels.length) {
                    return; // Chart created, no need for fallback
                }

                const allColumns = gridApi.getColumns() || [];
                const colStartIndex = START_CELL_COL_INDEX;
                const colEndIndex = END_CELL_COL_INDEX;
                const columnStart = allColumns[colStartIndex];
                const columnEnd = allColumns[colEndIndex];

                if (!columnStart) {
                    scriptDebugger?.errorLog('Column start not found for index', colStartIndex);
                    return;
                }
                if (!columnEnd) {
                    scriptDebugger?.errorLog('Column end not found for index', colEndIndex);
                    return;
                }

                gridApi.createRangeChart({
                    chartType: 'line',
                    cellRange: {
                        rowStartIndex: START_CELL_ROW_INDEX,
                        rowEndIndex: END_CELL_ROW_INDEX,
                        columnStart,
                        columnEnd,
                    },
                });
            },
        },

        // Wait for chart toolbar pop up to show
        { type: 'wait', duration: 1000 },

        // Select Stacked Bar Chart
        {
            type: 'agAction',
            actionType: 'moveToElementAndClick',
            actionParams: {
                target: 'chartSeriesButton',
                targetParams: {
                    groupTitle: 'Bar',
                    seriesTitle: 'Stacked',
                },
                scrollOffsetY: -35,
            },
        },
        { type: 'wait', duration: 1000 },

        // Click on `Set Up` tab
        {
            type: 'agAction',
            actionType: 'moveToElementAndClick',
            actionParams: {
                target: 'chartToolPanelTab',
                targetParams: {
                    text: 'Set Up',
                },
            },
        },
        { type: 'wait', duration: 600 },

        // Change category to `Country`
        {
            type: 'agAction',
            actionType: 'moveToElementAndClick',
            actionParams: {
                target: 'chartToolPanelPickerField',
                targetParams: {
                    groupTitle: 'Categories',
                    // NOTE: Categories label is hidden
                    selectLabel: '',
                    index: 0,
                },
            },
        },
        { type: 'wait', duration: 400 },
        {
            type: 'agAction',
            actionType: 'moveToElementAndClick',
            actionParams: {
                target: 'chartToolPanelSelectListItem',
                targetParams: {
                    text: 'Country',
                },
            },
        },
        { type: 'wait', duration: 600 },

        // Toggle `Aggregate`
        {
            type: 'agAction',
            actionType: 'moveToElementAndClick',
            actionParams: {
                target: 'chartToolPanelToggle',
                targetParams: {
                    groupTitle: 'Categories',
                    toggleLabel: 'Aggregate',
                },
            },
        },
        { type: 'wait', duration: 600 },

        // Toggle `Switch Category / Series`
        {
            type: 'agAction',
            actionType: 'moveToElementAndClick',
            actionParams: {
                target: 'chartToolPanelToggle',
                targetParams: {
                    groupTitle: 'Series',
                    toggleLabel: 'Switch Category / Series',
                },
            },
        },
        { type: 'wait', duration: 600 },

        // Click on `Customize` tab
        {
            type: 'agAction',
            actionType: 'moveToElementAndClick',
            actionParams: {
                target: 'chartToolPanelTab',
                targetParams: {
                    text: 'Customize',
                },
            },
        },
        { type: 'wait', duration: 600 },

        // Open `Titles` group
        {
            type: 'agAction',
            actionType: 'moveToElementAndClick',
            actionParams: {
                target: 'chartToolPanelGroupTitle',
                targetParams: {
                    text: 'Titles',
                },
            },
        },
        { type: 'wait', duration: 600 },

        // Toggle `Chart Title`
        {
            type: 'agAction',
            actionType: 'moveToElementAndClick',
            actionParams: {
                target: 'chartToolPanelToggle',
                targetParams: {
                    groupTitle: 'Titles',
                    toggleLabel: 'Chart Title',
                },
            },
        },
        { type: 'wait', duration: 600 },

        // Change title to `Average Monthly Earning`
        {
            type: 'agAction',
            actionType: 'moveToElementAndClick',
            actionParams: {
                target: 'chartToolPanelTextInput',
                targetParams: {
                    groupTitle: 'Titles',
                    inputLabel: 'Title',
                    index: 0,
                },
            },
        },
        { type: 'wait', duration: 600 },
        {
            type: 'agAction',
            actionType: 'typeInTextInput',
            actionParams: {
                text: 'Total Monthly Earning by Country',
                groupTitle: 'Titles',
                inputLabel: 'Title',
                index: 0,
            },
        },
        { type: 'wait', duration: 1000 },

        // Toggle legend items
        {
            type: 'agAction',
            actionType: 'moveToElementAndClick',
            actionParams: {
                target: 'chartsLegendItem',
                targetParams: {
                    index: 3,
                },
            },
        },
        { type: 'wait', duration: 600 },
        {
            type: 'agAction',
            actionType: 'moveToElementAndClick',
            actionParams: {
                target: 'chartsLegendItem',
                targetParams: {
                    index: 1,
                },
            },
        },
        { type: 'wait', duration: 600 },
        {
            type: 'agAction',
            actionType: 'moveToElementAndClick',
            actionParams: {
                target: 'chartsLegendItem',
                targetParams: {
                    index: 3,
                },
            },
        },
        { type: 'wait', duration: 600 },
        {
            type: 'agAction',
            actionType: 'moveToElementAndClick',
            actionParams: {
                target: 'chartsLegendItem',
                targetParams: {
                    index: 1,
                },
            },
        },
        { type: 'wait', duration: 600 },

        // Click on `Chart` tab
        {
            type: 'agAction',
            actionType: 'moveToElementAndClick',
            actionParams: {
                target: 'chartToolPanelTab',
                targetParams: {
                    text: 'Chart',
                },
            },
        },
        { type: 'wait', duration: 600 },

        // Change to 4th chart theme
        {
            type: 'agAction',
            actionType: 'moveToElementAndClick',
            actionParams: {
                target: 'chartThemeItem',
                targetParams: {
                    index: 3, // 4th theme
                },
            },
        },
        { type: 'wait', duration: 1000 },

        // Close chart tool panel
        {
            type: 'agAction',
            actionType: 'moveToElementAndClick',
            actionParams: {
                target: 'chartMenuToolPanelCloseButton',
            },
        },
        { type: 'wait', duration: 500 },

        // Move off screen
        {
            type: 'moveTo',
            toPos: () => {
                const offset = containerEl ? getOffset(containerEl) : undefined;
                return addPoints(getOffscreenPos(), offset)!;
            },
            speed: 2,
        },
        {
            type: 'custom',
            action: () => {
                mouse.hide();
            },
        },
        {
            type: 'agAction',
            actionType: 'clearAllSingleCellSelections',
        },
        { type: 'wait', duration: 3000 },
        {
            type: 'agAction',
            actionType: 'reset',
            actionParams: {
                scrollRow: 0,
                scrollColumn: 0,
            },
        },
        {
            type: 'custom',
            action: () => {
                scriptDebugger?.clear();
            },
        },
    ];
};
