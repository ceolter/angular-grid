import type { MockInstance } from 'vitest';

import type { GridApi, GridOptions } from 'ag-grid-community';
import { ClientSideRowModelModule } from 'ag-grid-community';
import { RowGroupingModule } from 'ag-grid-enterprise';

import { TestGridsManager } from '../test-utils';
import { assertSelectedRowsByIndex, getCellByPosition, pressSpaceKey, selectRowsByIndex } from './utils';

describe('Row Selection with Keyboard', () => {
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

    const gridMgr = new TestGridsManager({
        modules: [ClientSideRowModelModule, RowGroupingModule],
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

    test('select row with keyboard only', () => {
        const api = createGrid({
            columnDefs,
            rowData,
            rowSelection: { mode: 'singleRow' },
        });

        pressSpaceKey(getCellByPosition(2, 'sport')!);
        assertSelectedRowsByIndex([2], api);

        pressSpaceKey(getCellByPosition(3, 'sport')!);
        assertSelectedRowsByIndex([3], api);

        pressSpaceKey(getCellByPosition(3, 'sport')!);
        assertSelectedRowsByIndex([], api);
    });

    test('select multiple rows with keyboard only', () => {
        const api = createGrid({
            columnDefs,
            rowData,
            rowSelection: { mode: 'multiRow' },
        });

        pressSpaceKey(getCellByPosition(2, 'sport')!);
        pressSpaceKey(getCellByPosition(3, 'sport')!);
        pressSpaceKey(getCellByPosition(5, 'sport')!);
        assertSelectedRowsByIndex([2, 3, 5], api);

        pressSpaceKey(getCellByPosition(3, 'sport')!);
        assertSelectedRowsByIndex([2, 5], api);
    });

    describe('Range selection behaviour', () => {
        test('Holding SHIFT while selecting row with SPACE selects range of rows', () => {
            const api = createGrid({
                columnDefs,
                rowData,
                rowSelection: { mode: 'multiRow' },
            });

            pressSpaceKey(getCellByPosition(2, 'sport')!);
            pressSpaceKey(getCellByPosition(5, 'sport')!, { shiftKey: true });

            assertSelectedRowsByIndex([2, 3, 4, 5], api);
        });

        test('Can extend range downwards from last selected row when holding SHIFT', () => {
            const api = createGrid({
                columnDefs,
                rowData,
                rowSelection: { mode: 'multiRow' },
            });

            pressSpaceKey(getCellByPosition(1, 'sport')!);
            pressSpaceKey(getCellByPosition(3, 'sport')!);
            pressSpaceKey(getCellByPosition(5, 'sport')!, { shiftKey: true });
            assertSelectedRowsByIndex([1, 3, 4, 5], api);
        });

        test('Can extend range upwards from last selected row when holding SHIFT', () => {
            const api = createGrid({
                columnDefs,
                rowData,
                rowSelection: { mode: 'multiRow' },
            });

            selectRowsByIndex([2, 4], false, api);

            pressSpaceKey(getCellByPosition(1, 'sport')!, { shiftKey: true });

            assertSelectedRowsByIndex([2, 4, 1, 3], api);
        });

        test('Using SHIFT+SPACE to select on un-selected table selects clicked row', () => {
            const api = createGrid({
                columnDefs,
                rowData,
                rowSelection: { mode: 'multiRow' },
            });

            pressSpaceKey(getCellByPosition(4, 'sport')!, { shiftKey: true });
            assertSelectedRowsByIndex([4], api);

            pressSpaceKey(getCellByPosition(6, 'sport')!, { shiftKey: true });
            assertSelectedRowsByIndex([4, 5, 6], api);
        });

        test('Range selection is preserved on new keyboard selection', () => {
            const api = createGrid({
                columnDefs,
                rowData,
                rowSelection: { mode: 'multiRow' },
            });

            pressSpaceKey(getCellByPosition(1, 'sport')!);
            pressSpaceKey(getCellByPosition(3, 'sport')!, { shiftKey: true });
            assertSelectedRowsByIndex([1, 2, 3], api);

            pressSpaceKey(getCellByPosition(5, 'sport')!);
            assertSelectedRowsByIndex([1, 2, 3, 5], api);
        });

        test('Range is extended downwards from selection root', () => {
            const api = createGrid({
                columnDefs,
                rowData,
                rowSelection: { mode: 'multiRow' },
            });

            pressSpaceKey(getCellByPosition(2, 'sport')!);
            pressSpaceKey(getCellByPosition(4, 'sport')!, { shiftKey: true });
            assertSelectedRowsByIndex([2, 3, 4], api);

            pressSpaceKey(getCellByPosition(6, 'sport')!, { shiftKey: true });
            assertSelectedRowsByIndex([2, 3, 4, 5, 6], api);
        });

        test('Range is extended upwards from selection root', () => {
            const api = createGrid({
                columnDefs,
                rowData,
                rowSelection: { mode: 'multiRow' },
            });

            pressSpaceKey(getCellByPosition(6, 'sport')!);
            pressSpaceKey(getCellByPosition(4, 'sport')!, { shiftKey: true });
            assertSelectedRowsByIndex([6, 4, 5], api);

            pressSpaceKey(getCellByPosition(2, 'sport')!, { shiftKey: true });
            assertSelectedRowsByIndex([6, 4, 5, 2, 3], api);
        });

        test('Range can be inverted', () => {
            const api = createGrid({
                columnDefs,
                rowData,
                rowSelection: { mode: 'multiRow' },
            });

            pressSpaceKey(getCellByPosition(4, 'sport')!);
            pressSpaceKey(getCellByPosition(6, 'sport')!, { shiftKey: true });
            assertSelectedRowsByIndex([4, 5, 6], api);

            pressSpaceKey(getCellByPosition(2, 'sport')!, { shiftKey: true });
            assertSelectedRowsByIndex([2, 3, 4], api);
        });

        test('SHIFT-SPACE within range after de-selection resets root and clears previous selection', () => {
            const api = createGrid({
                columnDefs,
                rowData,
                rowSelection: { mode: 'multiRow' },
            });

            pressSpaceKey(getCellByPosition(2, 'sport')!);
            pressSpaceKey(getCellByPosition(6, 'sport')!, { shiftKey: true });
            assertSelectedRowsByIndex([2, 3, 4, 5, 6], api);

            pressSpaceKey(getCellByPosition(3, 'sport')!);
            assertSelectedRowsByIndex([2, 4, 5, 6], api);

            pressSpaceKey(getCellByPosition(5, 'sport')!, { shiftKey: true });
            assertSelectedRowsByIndex([3, 4, 5], api);
        });

        test('SHIFT-SPACE below range after de-selection resets root and clears previous selection', () => {
            const api = createGrid({
                columnDefs,
                rowData,
                rowSelection: { mode: 'multiRow' },
            });

            pressSpaceKey(getCellByPosition(2, 'sport')!);
            pressSpaceKey(getCellByPosition(5, 'sport')!, { shiftKey: true });
            assertSelectedRowsByIndex([2, 3, 4, 5], api);

            pressSpaceKey(getCellByPosition(3, 'sport')!);
            assertSelectedRowsByIndex([2, 4, 5], api);

            pressSpaceKey(getCellByPosition(6, 'sport')!, { shiftKey: true });
            assertSelectedRowsByIndex([3, 4, 5, 6], api);
        });

        test('SHIFT-SPACE above range after de-selection resets root and clears previous selection', () => {
            const api = createGrid({
                columnDefs,
                rowData,
                rowSelection: { mode: 'multiRow' },
            });

            pressSpaceKey(getCellByPosition(2, 'sport')!);
            pressSpaceKey(getCellByPosition(5, 'sport')!, { shiftKey: true });
            assertSelectedRowsByIndex([2, 3, 4, 5], api);

            pressSpaceKey(getCellByPosition(3, 'sport')!);
            assertSelectedRowsByIndex([2, 4, 5], api);

            pressSpaceKey(getCellByPosition(1, 'sport')!, { shiftKey: true });
            assertSelectedRowsByIndex([1, 2, 3], api);
        });
    });
});
