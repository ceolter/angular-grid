import type { MockInstance } from 'vitest';

import type { GridApi, GridOptions } from 'ag-grid-community';
import { ClientSideRowModelModule } from 'ag-grid-community';
import { RowGroupingModule } from 'ag-grid-enterprise';

import { GridRows, TestGridsManager } from '../test-utils';
import { selectRowsByIndex } from './utils';

describe('Row Selection Grid Options', () => {
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

    test('Multiple sorting works with selection column', async () => {
        const api = createGrid({
            columnDefs,
            rowData,
            rowSelection: {
                mode: 'multiRow',
            },
            selectionColumnDef: {
                sortable: true,
                pinned: 'left',
            },
        });

        selectRowsByIndex([3, 4, 5], false, api);

        api.applyColumnState({
            state: [
                { colId: 'ag-Grid-SelectionColumn', sort: 'asc', sortIndex: 0 },
                { colId: 'sport', sort: 'asc', sortIndex: 1 },
            ],
            defaultState: { sort: null },
        });

        await new GridRows(api).check(`
        ROOT id:ROOT_NODE_ID
        ├── LEAF id:0
        ├── LEAF id:6
        ├── LEAF id:1
        ├── LEAF id:2
        ├── LEAF selected id:3
        ├── LEAF selected id:4
        └── LEAF selected id:5
        `);
    });

    test('Selection column is updated when `selectionColDef` changes', async () => {
        const onGridColumnsChanged = vitest.fn();

        const api = createGrid({
            columnDefs,
            rowData,
            rowSelection: { mode: 'multiRow' },
            selectionColumnDef: {},
            onGridColumnsChanged,
        });

        expect(api.getColumnState()[0]).toEqual(
            expect.objectContaining({
                pinned: null,
                width: 50,
            })
        );

        // flush event queue
        await new Promise((resolve) => setTimeout(resolve, 0));
        onGridColumnsChanged.mockClear();

        api.setGridOption('selectionColumnDef', {
            pinned: 'right',
            width: 200,
        });

        expect(api.getColumnState()[0]).toEqual(
            expect.objectContaining({
                pinned: 'right',
                width: 200,
            })
        );

        // event is async so have to wait till next tick
        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(onGridColumnsChanged).toHaveBeenCalled();
    });

    test('No-op when `selectionColDef` changes to an identical value', async () => {
        const onGridColumnsChanged = vitest.fn();

        const api = createGrid({
            columnDefs,
            rowData,
            rowSelection: { mode: 'multiRow' },
            selectionColumnDef: {
                width: 200,
                pinned: 'left',
            },
            onGridColumnsChanged,
        });

        expect(api.getColumnState()[0]).toEqual(
            expect.objectContaining({
                width: 200,
                pinned: 'left',
            })
        );

        // flush event queue
        await new Promise((resolve) => setTimeout(resolve, 0));
        onGridColumnsChanged.mockClear();

        api.setGridOption('selectionColumnDef', {
            pinned: 'left',
            width: 200,
        });

        expect(api.getColumnState()[0]).toEqual(
            expect.objectContaining({
                pinned: 'left',
                width: 200,
            })
        );

        // event is async so have to wait till next tick
        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(onGridColumnsChanged).not.toHaveBeenCalled();
    });
});
