import type { MockInstance } from 'vitest';

import type { GridApi, GridOptions } from 'ag-grid-community';
import { ClientSideRowModelModule, InfiniteRowModelModule } from 'ag-grid-community';
import { RowGroupingModule, ServerSideRowModelModule, ViewportRowModelModule } from 'ag-grid-enterprise';

import { TestGridsManager } from '../test-utils';
import { GROUP_ROW_DATA } from './data';
import {
    assertSelectedRowsByIndex,
    clickRowByIndex,
    selectRowsByIndex,
    toggleCheckboxByIndex,
    toggleHeaderCheckboxByIndex,
} from './utils';

describe('Row Selection Legacy Grid Options', () => {
    const columnDefs = [{ field: 'sport' }];
    const rowData = [
        { sport: 'football' },
        { sport: 'rugby' },
        { sport: 'tennis' },
        { sport: 'cricket' },
        { sport: 'golf' },
        { sport: 'swimming' },
        { sport: 'rowing' },
    ];
    let consoleErrorSpy: MockInstance;
    let consoleWarnSpy: MockInstance;

    function createGrid(gridOptions: GridOptions): GridApi {
        return gridMgr.createGrid('myGrid', gridOptions);
    }

    async function createGridAndWait(gridOptions: GridOptions): Promise<GridApi> {
        const api = createGrid(gridOptions);

        return new Promise((resolve) => api.addEventListener('firstDataRendered', () => resolve(api)));
    }

    const gridMgr = new TestGridsManager({
        modules: [
            ClientSideRowModelModule,
            ServerSideRowModelModule,
            ViewportRowModelModule,
            InfiniteRowModelModule,
            RowGroupingModule,
        ],
    });

    beforeEach(() => {
        gridMgr.reset();

        consoleErrorSpy = vitest.spyOn(console, 'error').mockImplementation(() => {});
        consoleWarnSpy = vitest.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
        gridMgr.reset();

        consoleErrorSpy.mockRestore();
        consoleWarnSpy.mockRestore();
    });

    describe('User Interactions', () => {
        describe('Single Row Selection', () => {
            test('Select single row', () => {
                const api = createGrid({ columnDefs, rowData, rowSelection: 'single' });

                clickRowByIndex(2);

                assertSelectedRowsByIndex([2], api);
            });

            test('Clicking two rows selects only the last clicked row', () => {
                const api = createGrid({ columnDefs, rowData, rowSelection: 'single' });

                clickRowByIndex(2);
                clickRowByIndex(5);

                assertSelectedRowsByIndex([5], api);
            });

            test("SHIFT-click doesn't select multiple rows in single row selection mode", () => {
                const api = createGrid({ columnDefs, rowData, rowSelection: 'single' });

                clickRowByIndex(2);
                clickRowByIndex(5, { shiftKey: true });

                assertSelectedRowsByIndex([5], api);
            });

            test("CTRL-click doesn't select multiple rows in single row selection mode", () => {
                const api = createGrid({ columnDefs, rowData, rowSelection: 'single' });

                clickRowByIndex(2);
                clickRowByIndex(5, { metaKey: true });

                assertSelectedRowsByIndex([5], api);
            });

            test('suppressRowClickSelection prevents row from being selected when clicked', () => {
                const api = createGrid({
                    columnDefs,
                    rowData,
                    rowSelection: 'single',
                    suppressRowClickSelection: true,
                });

                clickRowByIndex(2);

                assertSelectedRowsByIndex([], api);
            });

            test('un-selectable row cannot be selected', () => {
                const api = createGrid({
                    columnDefs,
                    rowData,
                    rowSelection: 'single',
                    isRowSelectable: (node) => node.data?.sport !== 'football',
                });

                clickRowByIndex(0);
                assertSelectedRowsByIndex([], api);
            });
        });

        describe('Multiple Row Selection', () => {
            test('un-selectable row cannot be selected', () => {
                const api = createGrid({
                    columnDefs,
                    rowData,
                    rowSelection: 'multiple',
                    isRowSelectable: (node) => node.data?.sport !== 'football',
                });

                clickRowByIndex(0);
                assertSelectedRowsByIndex([], api);

                clickRowByIndex(0, { metaKey: true });
                assertSelectedRowsByIndex([], api);

                clickRowByIndex(0, { ctrlKey: true });
                assertSelectedRowsByIndex([], api);

                clickRowByIndex(0, { shiftKey: true });
                assertSelectedRowsByIndex([], api);
            });

            test('row-click interaction with multiple selected rows', () => {
                const api = createGrid({
                    columnDefs: columnDefs.map((c, i) => (i === 0 ? { ...c, checkboxSelection: true } : c)),
                    rowData,
                    rowSelection: 'multiple',
                    suppressRowClickSelection: true,
                });

                // Select two rows by toggling checkboxes
                selectRowsByIndex([2, 3], false, api);

                clickRowByIndex(3);

                // Both rows should still be selected
                assertSelectedRowsByIndex([2, 3], api);
            });

            describe('Range selection behaviour', () => {
                test('CTRL-click and CMD-click selects multiple rows', () => {
                    const api = createGrid({ columnDefs, rowData, rowSelection: 'multiple' });

                    clickRowByIndex(2);
                    clickRowByIndex(5, { metaKey: true });
                    clickRowByIndex(3, { ctrlKey: true });

                    assertSelectedRowsByIndex([2, 5, 3], api);
                });

                test('Single click after multiple selection clears previous selection', () => {
                    const api = createGrid({ columnDefs, rowData, rowSelection: 'multiple' });

                    selectRowsByIndex([1, 3, 5], true, api);

                    clickRowByIndex(2);

                    assertSelectedRowsByIndex([2], api);
                });

                test('SHIFT-click selects range of rows', () => {
                    const api = createGrid({ columnDefs, rowData, rowSelection: 'multiple' });

                    clickRowByIndex(2);
                    clickRowByIndex(5, { shiftKey: true });

                    assertSelectedRowsByIndex([2, 3, 4, 5], api);
                });

                test('SHIFT-click extends range downwards from from last selected row', () => {
                    const api = createGrid({ columnDefs, rowData, rowSelection: 'multiple' });

                    selectRowsByIndex([1, 3], true, api);

                    clickRowByIndex(5, { shiftKey: true });

                    assertSelectedRowsByIndex([1, 3, 4, 5], api);
                });

                test('SHIFT-click extends range upwards from from last selected row', () => {
                    const api = createGrid({ columnDefs, rowData, rowSelection: 'multiple' });

                    selectRowsByIndex([2, 4], true, api);

                    clickRowByIndex(1, { shiftKey: true });

                    assertSelectedRowsByIndex([2, 4, 1, 3], api);
                });

                test('SHIFT-click on un-selected table selects only clicked row', () => {
                    const api = createGrid({ columnDefs, rowData, rowSelection: 'multiple' });

                    clickRowByIndex(4, { shiftKey: true });
                    assertSelectedRowsByIndex([4], api);

                    clickRowByIndex(6, { shiftKey: true });
                    assertSelectedRowsByIndex([4, 5, 6], api);
                });

                test('Range selection is preserved on CTRL-click and CMD-click', () => {
                    const api = createGrid({ columnDefs, rowData, rowSelection: 'multiple' });

                    clickRowByIndex(1);
                    clickRowByIndex(3, { shiftKey: true });
                    assertSelectedRowsByIndex([1, 2, 3], api);

                    clickRowByIndex(5, { metaKey: true });
                    assertSelectedRowsByIndex([1, 2, 3, 5], api);
                });

                test('Range members can be un-selected with CTRL-click or CMD-click', () => {
                    const api = createGrid({ columnDefs, rowData, rowSelection: 'multiple' });

                    clickRowByIndex(1);
                    clickRowByIndex(4, { shiftKey: true });
                    assertSelectedRowsByIndex([1, 2, 3, 4], api);

                    clickRowByIndex(3, { metaKey: true });
                    assertSelectedRowsByIndex([1, 2, 4], api);

                    clickRowByIndex(2, { ctrlKey: true });
                    assertSelectedRowsByIndex([1, 4], api);
                });

                test('Range is extended downwards from selection root', () => {
                    const api = createGrid({ columnDefs, rowData, rowSelection: 'multiple' });

                    clickRowByIndex(2);
                    clickRowByIndex(4, { shiftKey: true });
                    assertSelectedRowsByIndex([2, 3, 4], api);

                    clickRowByIndex(6, { shiftKey: true });
                    assertSelectedRowsByIndex([2, 3, 4, 5, 6], api);
                });

                test('Range is extended upwards from selection root', () => {
                    const api = createGrid({ columnDefs, rowData, rowSelection: 'multiple' });

                    clickRowByIndex(6);
                    clickRowByIndex(4, { shiftKey: true });
                    assertSelectedRowsByIndex([6, 4, 5], api);

                    clickRowByIndex(2, { shiftKey: true });
                    assertSelectedRowsByIndex([6, 4, 5, 2, 3], api);
                });

                test('Range can be inverted', () => {
                    const api = createGrid({ columnDefs, rowData, rowSelection: 'multiple' });

                    clickRowByIndex(4);
                    clickRowByIndex(6, { shiftKey: true });
                    assertSelectedRowsByIndex([4, 5, 6], api);

                    clickRowByIndex(2, { shiftKey: true });
                    assertSelectedRowsByIndex([2, 3, 4], api);
                });

                test.skip('SHIFT-click within range after de-selection resets root and clears previous selection', () => {
                    const api = createGrid({ columnDefs, rowData, rowSelection: 'multiple' });

                    clickRowByIndex(2);
                    clickRowByIndex(6, { shiftKey: true });
                    assertSelectedRowsByIndex([2, 3, 4, 5, 6], api);

                    clickRowByIndex(3, { metaKey: true });
                    assertSelectedRowsByIndex([2, 4, 5, 6], api);

                    clickRowByIndex(5, { shiftKey: true });
                    assertSelectedRowsByIndex([3, 4, 5], api);
                });

                test.skip('SHIFT-click below range after de-selection resets root and clears previous selection', () => {
                    const api = createGrid({ columnDefs, rowData, rowSelection: 'multiple' });

                    clickRowByIndex(2);
                    clickRowByIndex(5, { shiftKey: true });
                    assertSelectedRowsByIndex([2, 3, 4, 5], api);

                    clickRowByIndex(3, { metaKey: true });
                    assertSelectedRowsByIndex([2, 4, 5], api);

                    clickRowByIndex(6, { shiftKey: true });
                    assertSelectedRowsByIndex([3, 4, 5, 6], api);
                });

                test.skip('SHIFT-click above range after de-selection resets root and clears previous selection', () => {
                    const api = createGrid({ columnDefs, rowData, rowSelection: 'multiple' });

                    clickRowByIndex(2);
                    clickRowByIndex(5, { shiftKey: true });
                    assertSelectedRowsByIndex([2, 3, 4, 5], api);

                    clickRowByIndex(3, { metaKey: true });
                    assertSelectedRowsByIndex([2, 4, 5], api);

                    clickRowByIndex(1, { shiftKey: true });
                    assertSelectedRowsByIndex([1, 2, 3], api);
                });
            });
        });

        describe('Multiple Row Selection with Click', () => {
            test('Select multiple rows without modifier keys', () => {
                const api = createGrid({
                    columnDefs,
                    rowData,
                    rowSelection: 'multiple',
                    rowMultiSelectWithClick: true,
                });

                clickRowByIndex(2);
                clickRowByIndex(5);
                clickRowByIndex(3);

                assertSelectedRowsByIndex([2, 5, 3], api);
            });

            test('De-select row with click', () => {
                const api = createGrid({
                    columnDefs,
                    rowData,
                    rowSelection: 'multiple',
                    rowMultiSelectWithClick: true,
                });

                selectRowsByIndex([1, 2, 3], true, api);

                clickRowByIndex(2);

                assertSelectedRowsByIndex([1, 3], api);
            });
        });

        describe('Checkbox selection', () => {
            test('Checkbox can be toggled on and off', () => {
                const api = createGrid({
                    columnDefs: columnDefs.map((d) => ({ ...d, checkboxSelection: true })),
                    rowData,
                    rowSelection: 'multiple',
                });

                toggleCheckboxByIndex(1);
                assertSelectedRowsByIndex([1], api);

                toggleCheckboxByIndex(1);
                assertSelectedRowsByIndex([], api);
            });

            test('Multiple rows can be selected without modifier keys nor rowMultiSelectWithClick', () => {
                const api = createGrid({
                    columnDefs: columnDefs.map((d) => ({ ...d, checkboxSelection: true })),
                    rowData,
                    rowSelection: 'multiple',
                });

                toggleCheckboxByIndex(1);
                assertSelectedRowsByIndex([1], api);

                toggleCheckboxByIndex(2);
                assertSelectedRowsByIndex([1, 2], api);
            });

            test('Clicking a row still selects it when `suppressRowClickSelection` is false', () => {
                const api = createGrid({
                    columnDefs: columnDefs.map((d) => ({
                        ...d,
                        checkboxSelection: true,
                        showDisabledCheckboxes: true,
                    })),
                    rowData,
                    rowSelection: 'multiple',
                });

                // click, not toggle
                clickRowByIndex(1);
                assertSelectedRowsByIndex([1], api);

                // toggle, not click, to assert inter-op
                toggleCheckboxByIndex(1);
                assertSelectedRowsByIndex([], api);
            });

            test('Clicking a row does nothing when `suppressRowClickSelection` is true', () => {
                const api = createGrid({
                    columnDefs: columnDefs.map((d) => ({
                        ...d,
                        checkboxSelection: true,
                        showDisabledCheckboxes: true,
                    })),
                    rowData,
                    rowSelection: 'multiple',
                    suppressRowClickSelection: true,
                });

                // click, not toggle
                clickRowByIndex(1);
                assertSelectedRowsByIndex([], api);
            });

            test('Un-selectable checkboxes cannot be toggled', () => {
                const api = createGrid({
                    columnDefs: columnDefs.map((d) => ({
                        ...d,
                        checkboxSelection: true,
                        showDisabledCheckboxes: true,
                    })),
                    rowData,
                    rowSelection: 'multiple',
                    isRowSelectable: (node) => node.data?.sport !== 'golf',
                });

                toggleCheckboxByIndex(4);

                assertSelectedRowsByIndex([], api);

                toggleCheckboxByIndex(5);
                assertSelectedRowsByIndex([5], api);
            });

            describe('Range selection behaviour', () => {
                test('CTRL-click and CMD-click does not affect ability to select multiple rows', () => {
                    const api = createGrid({
                        columnDefs: columnDefs.map((d) => ({ ...d, checkboxSelection: true })),
                        rowData,
                        rowSelection: 'multiple',
                    });

                    toggleCheckboxByIndex(2);
                    toggleCheckboxByIndex(5, { metaKey: true });
                    toggleCheckboxByIndex(3, { ctrlKey: true });

                    assertSelectedRowsByIndex([2, 5, 3], api);
                });

                test('SHIFT-click selects range of rows', () => {
                    const api = createGrid({
                        columnDefs: columnDefs.map((d) => ({ ...d, checkboxSelection: true })),
                        rowData,
                        rowSelection: 'multiple',
                    });

                    toggleCheckboxByIndex(2);
                    toggleCheckboxByIndex(5, { shiftKey: true });

                    assertSelectedRowsByIndex([2, 3, 4, 5], api);
                });

                test('SHIFT-click extends range downwards from from last selected row', () => {
                    const api = createGrid({
                        columnDefs: columnDefs.map((d) => ({ ...d, checkboxSelection: true })),
                        rowData,
                        rowSelection: 'multiple',
                    });

                    selectRowsByIndex([1, 3], true, api);

                    toggleCheckboxByIndex(5, { shiftKey: true });

                    assertSelectedRowsByIndex([1, 3, 4, 5], api);
                });

                test('SHIFT-click extends range upwards from from last selected row', () => {
                    const api = createGrid({
                        columnDefs: columnDefs.map((d) => ({ ...d, checkboxSelection: true })),
                        rowData,
                        rowSelection: 'multiple',
                    });

                    selectRowsByIndex([2, 4], true, api);

                    toggleCheckboxByIndex(1, { shiftKey: true });

                    assertSelectedRowsByIndex([2, 4, 1, 3], api);
                });

                test('SHIFT-click on un-selected table selects only clicked row', () => {
                    const api = createGrid({
                        columnDefs: columnDefs.map((d) => ({ ...d, checkboxSelection: true })),
                        rowData,
                        rowSelection: 'multiple',
                    });

                    toggleCheckboxByIndex(4, { shiftKey: true });
                    assertSelectedRowsByIndex([4], api);

                    toggleCheckboxByIndex(6, { shiftKey: true });
                    assertSelectedRowsByIndex([4, 5, 6], api);
                });

                test('Range selection is preserved on CTRL-click and CMD-click', () => {
                    const api = createGrid({
                        columnDefs: columnDefs.map((d) => ({ ...d, checkboxSelection: true })),
                        rowData,
                        rowSelection: 'multiple',
                    });

                    toggleCheckboxByIndex(1);
                    toggleCheckboxByIndex(3, { shiftKey: true });
                    assertSelectedRowsByIndex([1, 2, 3], api);

                    toggleCheckboxByIndex(5, { metaKey: true });
                    assertSelectedRowsByIndex([1, 2, 3, 5], api);
                });

                test('Range selection is preserved on checkbox toggle', () => {
                    const api = createGrid({
                        columnDefs: columnDefs.map((d) => ({ ...d, checkboxSelection: true })),
                        rowData,
                        rowSelection: 'multiple',
                    });

                    toggleCheckboxByIndex(1);
                    toggleCheckboxByIndex(3, { shiftKey: true });
                    assertSelectedRowsByIndex([1, 2, 3], api);

                    toggleCheckboxByIndex(5);
                    assertSelectedRowsByIndex([1, 2, 3, 5], api);
                });

                test('Range members can be un-selected with CTRL-click or CMD-click', () => {
                    const api = createGrid({
                        columnDefs: columnDefs.map((d) => ({ ...d, checkboxSelection: true })),
                        rowData,
                        rowSelection: 'multiple',
                    });

                    toggleCheckboxByIndex(1);
                    toggleCheckboxByIndex(4, { shiftKey: true });
                    assertSelectedRowsByIndex([1, 2, 3, 4], api);

                    toggleCheckboxByIndex(3, { metaKey: true });
                    assertSelectedRowsByIndex([1, 2, 4], api);

                    toggleCheckboxByIndex(2, { ctrlKey: true });
                    assertSelectedRowsByIndex([1, 4], api);
                });

                test('Range members can be un-selected with toggle', () => {
                    const api = createGrid({
                        columnDefs: columnDefs.map((d) => ({ ...d, checkboxSelection: true })),
                        rowData,
                        rowSelection: 'multiple',
                    });

                    toggleCheckboxByIndex(1);
                    toggleCheckboxByIndex(4, { shiftKey: true });
                    assertSelectedRowsByIndex([1, 2, 3, 4], api);

                    toggleCheckboxByIndex(3);
                    assertSelectedRowsByIndex([1, 2, 4], api);
                });

                test('Range is extended downwards from selection root', () => {
                    const api = createGrid({
                        columnDefs: columnDefs.map((d) => ({ ...d, checkboxSelection: true })),
                        rowData,
                        rowSelection: 'multiple',
                    });

                    toggleCheckboxByIndex(2);
                    toggleCheckboxByIndex(4, { shiftKey: true });
                    assertSelectedRowsByIndex([2, 3, 4], api);

                    toggleCheckboxByIndex(6, { shiftKey: true });
                    assertSelectedRowsByIndex([2, 3, 4, 5, 6], api);
                });

                test('Range is extended upwards from selection root', () => {
                    const api = createGrid({
                        columnDefs: columnDefs.map((d) => ({ ...d, checkboxSelection: true })),
                        rowData,
                        rowSelection: 'multiple',
                    });

                    toggleCheckboxByIndex(6);
                    toggleCheckboxByIndex(4, { shiftKey: true });
                    assertSelectedRowsByIndex([6, 4, 5], api);

                    toggleCheckboxByIndex(2, { shiftKey: true });
                    assertSelectedRowsByIndex([6, 4, 5, 2, 3], api);
                });

                test('Range can be inverted', () => {
                    const api = createGrid({
                        columnDefs: columnDefs.map((d) => ({ ...d, checkboxSelection: true })),
                        rowData,
                        rowSelection: 'multiple',
                    });

                    toggleCheckboxByIndex(4);
                    toggleCheckboxByIndex(6, { shiftKey: true });
                    assertSelectedRowsByIndex([4, 5, 6], api);

                    toggleCheckboxByIndex(2, { shiftKey: true });
                    assertSelectedRowsByIndex([2, 3, 4], api);
                });

                test('SHIFT can be used for range de-selection (Checkbox selection ONLY)', () => {
                    const api = createGrid({
                        columnDefs: columnDefs.map((d) => ({ ...d, checkboxSelection: true })),
                        rowData,
                        rowSelection: 'multiple',
                    });

                    toggleCheckboxByIndex(1);
                    toggleCheckboxByIndex(5, { shiftKey: true });
                    assertSelectedRowsByIndex([1, 2, 3, 4, 5], api);

                    toggleCheckboxByIndex(2);
                    assertSelectedRowsByIndex([1, 3, 4, 5], api);

                    toggleCheckboxByIndex(4, { shiftKey: true });
                    assertSelectedRowsByIndex([1, 5], api);
                });
            });
        });

        describe('Header checkbox selection', () => {
            test('can be used to select and deselect all rows', () => {
                const api = createGrid({
                    columnDefs: columnDefs.map((d) => ({ ...d, headerCheckboxSelection: true })),
                    rowData,
                    rowSelection: 'multiple',
                });

                toggleHeaderCheckboxByIndex(0);
                assertSelectedRowsByIndex([0, 1, 2, 3, 4, 5, 6], api);

                toggleHeaderCheckboxByIndex(0);
                assertSelectedRowsByIndex([], api);
            });

            test('can select multiple pages of data', () => {
                const api = createGrid({
                    columnDefs: columnDefs.map((d) => ({ ...d, headerCheckboxSelection: true })),
                    rowData,
                    rowSelection: 'multiple',
                    pagination: true,
                    paginationPageSize: 5,
                });

                toggleHeaderCheckboxByIndex(0);
                assertSelectedRowsByIndex([0, 1, 2, 3, 4, 5, 6], api);

                toggleHeaderCheckboxByIndex(0);
                assertSelectedRowsByIndex([], api);
            });

            test('can select only current page of data', () => {
                const api = createGrid({
                    columnDefs: columnDefs.map((d) => ({
                        ...d,
                        headerCheckboxSelection: true,
                        headerCheckboxSelectionCurrentPageOnly: true,
                    })),
                    rowData,
                    rowSelection: 'multiple',
                    pagination: true,
                    paginationPageSize: 5,
                });

                toggleHeaderCheckboxByIndex(0);
                assertSelectedRowsByIndex([0, 1, 2, 3, 4], api);

                toggleHeaderCheckboxByIndex(0);
                assertSelectedRowsByIndex([], api);
            });

            test('can select only filtered data', () => {
                const api = createGrid({
                    columnDefs: columnDefs.map((d) => ({
                        ...d,
                        headerCheckboxSelection: true,
                        headerCheckboxSelectionFilteredOnly: true,
                    })),
                    rowData,
                    rowSelection: 'multiple',
                    pagination: true,
                    paginationPageSize: 5,
                });

                api.setGridOption('quickFilterText', 'ing');

                toggleHeaderCheckboxByIndex(0);
                assertSelectedRowsByIndex([0, 1], api);

                api.setGridOption('quickFilterText', '');

                assertSelectedRowsByIndex([5, 6], api);
            });

            test('indeterminate selection state transitions to select all', () => {
                const api = createGrid({
                    columnDefs: columnDefs.map((d) => ({
                        ...d,
                        headerCheckboxSelection: true,
                    })),
                    rowData,
                    rowSelection: 'multiple',
                });

                selectRowsByIndex([3], true, api);

                toggleHeaderCheckboxByIndex(0);
                assertSelectedRowsByIndex([3, 0, 1, 2, 4, 5, 6], api);
            });

            test('un-selectable rows are not part of the selection', () => {
                const api = createGrid({
                    columnDefs: columnDefs.map((d) => ({
                        ...d,
                        headerCheckboxSelection: true,
                    })),
                    rowData,
                    rowSelection: 'multiple',
                    isRowSelectable: (node) => node.data?.sport !== 'football',
                });

                toggleHeaderCheckboxByIndex(0);
                assertSelectedRowsByIndex([1, 2, 3, 4, 5, 6], api);
            });
        });

        describe('Group checkbox selection', () => {
            const groupGridOptions: Partial<GridOptions> = {
                columnDefs: [
                    { field: 'country', rowGroup: true, hide: true },
                    { field: 'sport', rowGroup: true, hide: true },
                    { field: 'age' },
                    { field: 'year' },
                    { field: 'date' },
                ],
                autoGroupColumnDef: {
                    headerName: 'Athlete',
                    field: 'athlete',
                    cellRenderer: 'agGroupCellRenderer',
                    cellRendererParams: {
                        checkbox: true,
                    },
                },
                rowData: GROUP_ROW_DATA,
                groupDefaultExpanded: -1,
            };

            test('clicking group row selects only that row', async () => {
                const api = await createGridAndWait({
                    ...groupGridOptions,
                    rowSelection: 'multiple',
                });

                toggleCheckboxByIndex(0);
                assertSelectedRowsByIndex([0], api);
            });

            test('clicking group row with `groupSelectsChildren` enabled selects that row and all its children', async () => {
                const api = await createGridAndWait({
                    ...groupGridOptions,
                    rowSelection: 'multiple',
                    groupSelectsChildren: true,
                });

                // Group selects children
                toggleCheckboxByIndex(0);
                assertSelectedRowsByIndex([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 13], api);

                // Can un-select child row
                toggleCheckboxByIndex(4);
                assertSelectedRowsByIndex([2, 3, 5, 6, 7, 8, 9, 10, 11, 13], api);

                // Toggling group row from indeterminate state selects all children
                toggleCheckboxByIndex(0);
                assertSelectedRowsByIndex([2, 3, 5, 6, 7, 8, 9, 10, 11, 13, 4], api);

                // Toggle group row again de-selects all children
                toggleCheckboxByIndex(0);
                assertSelectedRowsByIndex([], api);
            });

            describe('Range selection behaviour', () => {
                test('CTRL-click and CMD-click does not affect ability to select multiple rows', async () => {
                    const api = await createGridAndWait({
                        ...groupGridOptions,
                        rowSelection: 'multiple',
                    });

                    toggleCheckboxByIndex(2);
                    toggleCheckboxByIndex(5, { metaKey: true });
                    toggleCheckboxByIndex(3, { ctrlKey: true });

                    assertSelectedRowsByIndex([2, 5, 3], api);
                });

                test('SHIFT-click selects range of rows', async () => {
                    const api = await createGridAndWait({
                        ...groupGridOptions,
                        rowSelection: 'multiple',
                    });

                    toggleCheckboxByIndex(2);
                    toggleCheckboxByIndex(5, { shiftKey: true });

                    assertSelectedRowsByIndex([2, 3, 4, 5], api);
                });

                test('SHIFT-click extends range downwards from from last selected row', async () => {
                    const api = await createGridAndWait({
                        ...groupGridOptions,
                        rowSelection: 'multiple',
                    });

                    selectRowsByIndex([1, 3], true, api);

                    toggleCheckboxByIndex(5, { shiftKey: true });

                    assertSelectedRowsByIndex([1, 3, 4, 5], api);
                });

                test('SHIFT-click extends range upwards from from last selected row', async () => {
                    const api = await createGridAndWait({
                        ...groupGridOptions,
                        rowSelection: 'multiple',
                    });

                    selectRowsByIndex([2, 4], true, api);

                    toggleCheckboxByIndex(1, { shiftKey: true });

                    assertSelectedRowsByIndex([2, 4, 1, 3], api);
                });

                test('SHIFT-click on un-selected table selects only clicked row', async () => {
                    const api = await createGridAndWait({
                        ...groupGridOptions,
                        rowSelection: 'multiple',
                    });

                    toggleCheckboxByIndex(4, { shiftKey: true });
                    assertSelectedRowsByIndex([4], api);

                    toggleCheckboxByIndex(6, { shiftKey: true });
                    assertSelectedRowsByIndex([4, 5, 6], api);
                });

                test('Range selection is preserved on CTRL-click and CMD-click', async () => {
                    const api = await createGridAndWait({
                        ...groupGridOptions,
                        rowSelection: 'multiple',
                    });

                    toggleCheckboxByIndex(1);
                    toggleCheckboxByIndex(3, { shiftKey: true });
                    assertSelectedRowsByIndex([1, 2, 3], api);

                    toggleCheckboxByIndex(5, { metaKey: true });
                    assertSelectedRowsByIndex([1, 2, 3, 5], api);
                });

                test('Range selection is preserved on checkbox toggle', async () => {
                    const api = await createGridAndWait({
                        ...groupGridOptions,
                        rowSelection: 'multiple',
                    });

                    toggleCheckboxByIndex(1);
                    toggleCheckboxByIndex(3, { shiftKey: true });
                    assertSelectedRowsByIndex([1, 2, 3], api);

                    toggleCheckboxByIndex(5);
                    assertSelectedRowsByIndex([1, 2, 3, 5], api);
                });

                test('Range members can be un-selected with CTRL-click or CMD-click', async () => {
                    const api = await createGridAndWait({
                        ...groupGridOptions,
                        rowSelection: 'multiple',
                    });

                    toggleCheckboxByIndex(1);
                    toggleCheckboxByIndex(4, { shiftKey: true });
                    assertSelectedRowsByIndex([1, 2, 3, 4], api);

                    toggleCheckboxByIndex(3, { metaKey: true });
                    assertSelectedRowsByIndex([1, 2, 4], api);

                    toggleCheckboxByIndex(2, { ctrlKey: true });
                    assertSelectedRowsByIndex([1, 4], api);
                });

                test('Range members can be un-selected with toggle', async () => {
                    const api = await createGridAndWait({
                        ...groupGridOptions,
                        rowSelection: 'multiple',
                    });

                    toggleCheckboxByIndex(1);
                    toggleCheckboxByIndex(4, { shiftKey: true });
                    assertSelectedRowsByIndex([1, 2, 3, 4], api);

                    toggleCheckboxByIndex(3);
                    assertSelectedRowsByIndex([1, 2, 4], api);
                });

                test('Range is extended downwards from selection root', async () => {
                    const api = await createGridAndWait({
                        ...groupGridOptions,
                        rowSelection: 'multiple',
                    });

                    toggleCheckboxByIndex(2);
                    toggleCheckboxByIndex(4, { shiftKey: true });
                    assertSelectedRowsByIndex([2, 3, 4], api);

                    toggleCheckboxByIndex(6, { shiftKey: true });
                    assertSelectedRowsByIndex([2, 3, 4, 5, 6], api);
                });

                test('Range is extended upwards from selection root', async () => {
                    const api = await createGridAndWait({
                        ...groupGridOptions,
                        rowSelection: 'multiple',
                    });

                    toggleCheckboxByIndex(6);
                    toggleCheckboxByIndex(4, { shiftKey: true });
                    assertSelectedRowsByIndex([6, 4, 5], api);

                    toggleCheckboxByIndex(2, { shiftKey: true });
                    assertSelectedRowsByIndex([6, 4, 5, 2, 3], api);
                });

                test('Range can be inverted', async () => {
                    const api = await createGridAndWait({
                        ...groupGridOptions,
                        rowSelection: 'multiple',
                    });

                    toggleCheckboxByIndex(4);
                    toggleCheckboxByIndex(6, { shiftKey: true });
                    assertSelectedRowsByIndex([4, 5, 6], api);

                    toggleCheckboxByIndex(2, { shiftKey: true });
                    assertSelectedRowsByIndex([2, 3, 4], api);
                });

                test('SHIFT can be used for range de-selection (Checkbox selection ONLY)', async () => {
                    const api = await createGridAndWait({
                        ...groupGridOptions,
                        rowSelection: 'multiple',
                    });

                    toggleCheckboxByIndex(1);
                    toggleCheckboxByIndex(5, { shiftKey: true });
                    assertSelectedRowsByIndex([1, 2, 3, 4, 5], api);

                    toggleCheckboxByIndex(2);
                    assertSelectedRowsByIndex([1, 3, 4, 5], api);

                    toggleCheckboxByIndex(4, { shiftKey: true });
                    assertSelectedRowsByIndex([1, 5], api);
                });
            });
        });
    });

    describe('Selection API', () => {
        describe('setNodesSelected', () => {
            test('Select single row in single selection mode', () => {
                const api = createGrid({ columnDefs, rowData, rowSelection: 'single' });

                const nodes = api.getRenderedNodes();
                const toSelect = [nodes[3]];
                api.setNodesSelected({ nodes: toSelect, newValue: true });

                const selectedNodes = api.getSelectedNodes();

                expect(selectedNodes).toHaveLength(1);
                expect(selectedNodes[0]).toBe(toSelect[0]);
            });

            test('Select single row in multiple selection mode', () => {
                const api = createGrid({ columnDefs, rowData, rowSelection: 'multiple' });

                const nodes = api.getRenderedNodes();
                const toSelect = [nodes[3]];
                api.setNodesSelected({ nodes: toSelect, newValue: true });

                const selectedNodes = api.getSelectedNodes();
                expect(selectedNodes).toHaveLength(1);
                expect(selectedNodes[0]).toBe(toSelect[0]);
            });

            test('Cannot select multiple rows in single selection mode', () => {
                const api = createGrid({ columnDefs, rowData, rowSelection: 'single' });

                const nodes = api.getRenderedNodes();
                const toSelect = [nodes[0], nodes[3], nodes[1]];
                api.setNodesSelected({ nodes: toSelect, newValue: true });

                const selectedNodes = api.getSelectedNodes();

                expect(selectedNodes).toHaveLength(0);
                expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
            });

            test('Can select multiple rows in multiple selection mode', () => {
                const api = createGrid({ columnDefs, rowData, rowSelection: 'multiple' });

                const nodes = api.getRenderedNodes();
                const toSelect = [nodes[5], nodes[4], nodes[2]];
                api.setNodesSelected({ nodes: toSelect, newValue: true });

                const selectedNodes = api.getSelectedNodes();
                expect(selectedNodes).toHaveLength(3);
            });
        });

        describe('selectAll', () => {
            test('Can select all rows in single selection mode', () => {
                const api = createGrid({ columnDefs, rowData, rowSelection: 'single' });

                api.selectAll();

                expect(api.getSelectedNodes().length).toBe(rowData.length);
                expect(consoleWarnSpy).not.toHaveBeenCalled();

                api.deselectAll();
                expect(api.getSelectedNodes().length).toBe(0);
            });

            test('Can select all rows in multiple selection mode', () => {
                const api = createGrid({ columnDefs, rowData, rowSelection: 'multiple' });

                api.selectAll();

                expect(api.getSelectedNodes().length).toBe(rowData.length);

                api.deselectAll();
                expect(api.getSelectedNodes().length).toBe(0);
            });
        });

        describe('selectAllOnCurrentPage', () => {
            test('Can select all rows on current page in single selection mode', () => {
                const api = createGrid({
                    columnDefs,
                    rowData,
                    rowSelection: 'single',
                    pagination: true,
                    paginationPageSize: 5,
                });

                api.selectAllOnCurrentPage();

                assertSelectedRowsByIndex([0, 1, 2, 3, 4], api);
                expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
            });

            test('Can deselect only rows on current page in single selection mode', () => {
                const api = createGrid({
                    columnDefs,
                    rowData,
                    rowSelection: 'single',
                    pagination: true,
                    paginationPageSize: 5,
                });

                api.selectAll();
                api.deselectAllOnCurrentPage();

                assertSelectedRowsByIndex([5, 6], api);
            });
        });

        describe('selectAllFiltered', () => {
            test('Can select all filtered rows in single selection mode', () => {
                const api = createGrid({ columnDefs, rowData, rowSelection: 'single' });

                api.setGridOption('quickFilterText', 'ing');

                api.selectAllFiltered();
                const selectedNodes = api.getSelectedNodes();

                expect(selectedNodes.length).toBe(2);
            });

            test('Can deselect filtered rows only in single selection mode', () => {
                const api = createGrid({ columnDefs, rowData, rowSelection: 'single' });

                api.selectAll();

                api.setGridOption('quickFilterText', 'ing');

                api.deselectAllFiltered();

                api.setGridOption('quickFilterText', '');

                assertSelectedRowsByIndex([0, 1, 2, 3, 4], api);
            });
        });
    });
});
