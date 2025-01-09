import type { MockInstance } from 'vitest';

import type { AgEvent, GridApi, GridOptions } from 'ag-grid-community';
import { ClientSideRowModelModule } from 'ag-grid-community';

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
        modules: [ClientSideRowModelModule],
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

    test('Selection column is updated when `selectionColDef` changes', () => {
        const api = createGrid({
            columnDefs,
            rowData,
            rowSelection: { mode: 'multiRow' },
            selectionColumnDef: {},
        });

        expect(api.getColumnState()[0]).toEqual(
            expect.objectContaining({
                pinned: null,
                width: 50,
            })
        );

        const col = api.getColumn('ag-Grid-SelectionColumn');

        const events: AgEvent<'columnStateUpdated'>[] = [];
        col?.addEventListener('columnStateUpdated', (e) => events.push(e));

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

        expect(events.map((e) => (e as any).key).sort()).toEqual(['pinned', 'width']);
    });
});
