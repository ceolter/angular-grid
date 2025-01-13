import type { MockInstance } from 'vitest';

import { ClientSideRowModelModule } from 'ag-grid-community';
import type { GridOptions } from 'ag-grid-community';

import type { GridRowsOptions } from '../test-utils';
import {
    GridRows,
    TestGridsManager,
    asyncSetTimeout,
    cachedJSONObjects,
    executeTransactionsAsync,
} from '../test-utils';

describe('ag-grid row data', () => {
    const gridsManager = new TestGridsManager({
        modules: [ClientSideRowModelModule],
    });
    let consoleWarnSpy: MockInstance | undefined;
    let consoleErrorSpy: MockInstance | undefined;

    beforeEach(() => {
        cachedJSONObjects.clear();
        gridsManager.reset();
        consoleWarnSpy?.mockRestore();
        consoleErrorSpy?.mockRestore();
    });

    afterEach(() => {
        gridsManager.reset();
        consoleWarnSpy?.mockRestore();
        consoleErrorSpy?.mockRestore();
    });

    test('onRowDataUpdated, onModelUpdated, suppressModelUpdateAfterUpdateTransaction', async () => {
        const rowData1 = [
            { id: '1', value: 1 },
            { id: '2', value: 2 },
            { id: '3', value: 3 },
            { id: '4', value: 4 },
            { id: '5', value: 5 },
        ];
        const rowData2 = [
            { id: '1', value: 1 },
            { id: '2', value: 2 },
            { id: '3', value: 30 },
            { id: '4', value: 40 },
            { id: '5', value: 5 },
        ];
        const rowData3 = [
            { id: '1', value: 1 },
            { id: '2', value: 2 },
            { id: '4', value: 40 },
            { id: '5', value: 5 },
        ];
        const rowData4 = [
            { id: '1', value: 100 },
            { id: '2', value: 2 },
            { id: '4', value: 400 },
            { id: '5', value: 5 },
        ];

        let rowDataUpdatedCount = 0;
        let modelUpdatedCount = 0;
        let compareCalled = false;

        const gridOptions: GridOptions = {
            columnDefs: [
                {
                    field: 'value',
                    sort: 'asc',
                    comparator: (a, b) => {
                        compareCalled = true;
                        return a - b;
                    },
                },
            ],
            animateRows: false,
            rowData: rowData1,
            suppressModelUpdateAfterUpdateTransaction: true,
            getRowId: (params) => params.data.id,
            onRowDataUpdated: () => {
                ++rowDataUpdatedCount;
            },
            onModelUpdated: () => {
                ++modelUpdatedCount;
            },
        };

        const gridRowsOptions: GridRowsOptions = {
            checkDom: true,
            columns: ['value'],
        };

        const api = gridsManager.createGrid('myGrid', gridOptions);
        await asyncSetTimeout(1);

        expect(rowDataUpdatedCount).toBe(1);
        expect(modelUpdatedCount).toBe(1);
        expect(compareCalled).toBe(true);

        await new GridRows(api, 'data', gridRowsOptions).check(`
            ROOT id:ROOT_NODE_ID
            ├── LEAF id:1 value:1
            ├── LEAF id:2 value:2
            ├── LEAF id:3 value:3
            ├── LEAF id:4 value:4
            └── LEAF id:5 value:5
        `);

        compareCalled = false;
        api.setGridOption('rowData', rowData2);
        await asyncSetTimeout(1);

        await new GridRows(api, 'data', gridRowsOptions).check(`
            ROOT id:ROOT_NODE_ID
            ├── LEAF id:1 value:1
            ├── LEAF id:2 value:2
            ├── LEAF id:3 value:30
            ├── LEAF id:4 value:40
            └── LEAF id:5 value:5
        `);
        expect(rowDataUpdatedCount).toBe(2);
        expect(modelUpdatedCount).toBe(1);
        expect(compareCalled).toBe(false);

        compareCalled = false;
        await executeTransactionsAsync([{ update: [{ id: '3', value: 300 }] }], api);
        await asyncSetTimeout(1);

        await new GridRows(api, 'data', gridRowsOptions).check(`
            ROOT id:ROOT_NODE_ID
            ├── LEAF id:1 value:1
            ├── LEAF id:2 value:2
            ├── LEAF id:3 value:300
            ├── LEAF id:4 value:40
            └── LEAF id:5 value:5
        `);
        expect(rowDataUpdatedCount).toBe(3);
        expect(modelUpdatedCount).toBe(1);
        expect(compareCalled).toBe(false);

        api.refreshClientSideRowModel('everything');
        await asyncSetTimeout(1);
        await new GridRows(api, 'data', gridRowsOptions).check(`
            ROOT id:ROOT_NODE_ID
            ├── LEAF id:1 value:1
            ├── LEAF id:2 value:2
            ├── LEAF id:5 value:5
            ├── LEAF id:4 value:40
            └── LEAF id:3 value:300
        `);
        expect(rowDataUpdatedCount).toBe(3);
        expect(modelUpdatedCount).toBe(2);
        expect(compareCalled).toBe(true);

        compareCalled = false;
        await executeTransactionsAsync([{ add: [{ id: '7', value: 700 }] }, { remove: [{ id: '4' }] }], api);
        await asyncSetTimeout(1);

        await new GridRows(api, 'data', gridRowsOptions).check(`
            ROOT id:ROOT_NODE_ID
            ├── LEAF id:1 value:1
            ├── LEAF id:2 value:2
            ├── LEAF id:5 value:5
            ├── LEAF id:3 value:300
            └── LEAF id:7 value:700
        `);
        expect(rowDataUpdatedCount).toBe(4);
        expect(modelUpdatedCount).toBe(3);
        expect(compareCalled).toBe(true);

        compareCalled = false;
        await executeTransactionsAsync([{ add: [{ id: '8', value: 8 }] }, { remove: [{ id: '8' }] }], api);
        await asyncSetTimeout(1);

        await new GridRows(api, 'data', gridRowsOptions).check(`
            ROOT id:ROOT_NODE_ID
            ├── LEAF id:1 value:1
            ├── LEAF id:2 value:2
            ├── LEAF id:5 value:5
            ├── LEAF id:3 value:300
            └── LEAF id:7 value:700
        `);
        expect(rowDataUpdatedCount).toBe(5);
        expect(modelUpdatedCount).toBe(3);
        expect(compareCalled).toBe(false);

        compareCalled = false;
        api.updateGridOptions({ suppressModelUpdateAfterUpdateTransaction: false, rowData: rowData3 });
        await asyncSetTimeout(1);

        await new GridRows(api, 'data', gridRowsOptions).check(`
            ROOT id:ROOT_NODE_ID
            ├── LEAF id:1 value:1
            ├── LEAF id:2 value:2
            ├── LEAF id:5 value:5
            └── LEAF id:4 value:40
        `);
        expect(rowDataUpdatedCount).toBe(6);
        expect(modelUpdatedCount).toBe(4);
        expect(compareCalled).toBe(true);

        compareCalled = false;
        api.updateGridOptions({ suppressModelUpdateAfterUpdateTransaction: false, rowData: rowData4 });
        await asyncSetTimeout(1);

        await new GridRows(api, 'data', gridRowsOptions).check(`
            ROOT id:ROOT_NODE_ID
            ├── LEAF id:2 value:2
            ├── LEAF id:5 value:5
            ├── LEAF id:1 value:100
            └── LEAF id:4 value:400
        `);
        expect(rowDataUpdatedCount).toBe(7);
        expect(modelUpdatedCount).toBe(5);
        expect(compareCalled).toBe(true);
    });

    test('initializing columns after rowData', async () => {
        let rowDataUpdated = 0;
        let modelUpdated = 0;
        const gridOptions: GridOptions = {
            getRowId: (params) => params.data.id,
            onRowDataUpdated: () => ++rowDataUpdated,
            onModelUpdated: () => ++modelUpdated,
        };

        const gridRowsOptions: GridRowsOptions = {
            checkDom: true,
            columns: true,
        };

        const api = gridsManager.createGrid('myGrid', gridOptions);

        await asyncSetTimeout(1);
        expect(rowDataUpdated).toBe(0);
        expect(modelUpdated).toBe(0);

        api.setGridOption('rowData', [
            { id: '1', value: 1, x: 10 },
            { id: '2', value: 2, x: 20 },
            { id: '3', value: 3, x: 30 },
        ]);

        await asyncSetTimeout(1);
        expect(rowDataUpdated).toBe(0);
        expect(modelUpdated).toBe(0);

        await new GridRows(api, 'empty', gridRowsOptions).check('empty');

        api.setGridOption('columnDefs', [{ field: 'value' }]);

        await asyncSetTimeout(1);
        expect(rowDataUpdated).toBe(1);
        expect(modelUpdated).toBe(1);

        await new GridRows(api, 'data', gridRowsOptions).check(`
            ROOT id:ROOT_NODE_ID
            ├── LEAF id:1 value:1
            ├── LEAF id:2 value:2
            └── LEAF id:3 value:3
        `);

        api.setGridOption('columnDefs', [{ field: 'value' }, { field: 'x' }]);

        await asyncSetTimeout(1);
        expect(rowDataUpdated).toBe(1);
        expect(modelUpdated).toBe(2);

        await new GridRows(api, 'data', gridRowsOptions).check(`
            ROOT id:ROOT_NODE_ID
            ├── LEAF id:1 value:1 x:10
            ├── LEAF id:2 value:2 x:20
            └── LEAF id:3 value:3 x:30
        `);

        api.setGridOption('rowData', [
            { id: '1', value: 1, x: 10 },
            { id: '4', value: 4, x: 40 },
        ]);

        await asyncSetTimeout(1);
        expect(rowDataUpdated).toBe(2);
        expect(modelUpdated).toBe(3);

        api.setGridOption('columnDefs', [{ field: 'x' }, { field: 'value' }]);

        await asyncSetTimeout(1);
        expect(rowDataUpdated).toBe(2);
        expect(modelUpdated).toBe(4);

        await new GridRows(api, 'data', gridRowsOptions).check(`
            ROOT id:ROOT_NODE_ID
            ├── LEAF id:1 x:10 value:1
            └── LEAF id:4 x:40 value:4
        `);
    });

    test('initializing columns after changing rowData', async () => {
        let rowDataUpdated = 0;
        let modelUpdated = 0;
        const gridOptions: GridOptions = {
            rowData: [{ id: '1', value: 1, x: 10 }],
            getRowId: (params) => params.data.id,
            onRowDataUpdated: () => ++rowDataUpdated,
            onModelUpdated: () => ++modelUpdated,
        };

        const gridRowsOptions: GridRowsOptions = {
            checkDom: true,
            columns: true,
        };

        const api = gridsManager.createGrid('myGrid', gridOptions);

        await asyncSetTimeout(1);
        expect(rowDataUpdated).toBe(0);
        expect(modelUpdated).toBe(0);

        api.setGridOption('rowData', [
            { id: '1', value: 1, x: 10 },
            { id: '2', value: 2, x: 20 },
            { id: '3', value: 3, x: 30 },
        ]);

        await asyncSetTimeout(1);
        expect(rowDataUpdated).toBe(0);
        expect(modelUpdated).toBe(0);

        await new GridRows(api, 'empty', gridRowsOptions).check('empty');

        api.setGridOption('columnDefs', [{ field: 'value' }]);

        await asyncSetTimeout(1);
        expect(rowDataUpdated).toBe(1);
        expect(modelUpdated).toBe(1);

        await new GridRows(api, 'data', gridRowsOptions).check(`
            ROOT id:ROOT_NODE_ID
            ├── LEAF id:1 value:1
            ├── LEAF id:2 value:2
            └── LEAF id:3 value:3
        `);
    });

    test('initializing columns after initializing with a transaction', async () => {
        let rowDataUpdated = 0;
        let modelUpdated = 0;
        const gridOptions: GridOptions = {
            getRowId: (params) => params.data.id,
            onRowDataUpdated: () => ++rowDataUpdated,
            onModelUpdated: () => ++modelUpdated,
        };

        const gridRowsOptions: GridRowsOptions = {
            checkDom: true,
            columns: ['value'],
        };

        const api = gridsManager.createGrid('myGrid', gridOptions);

        api.applyTransaction({
            add: [
                { id: '1', value: 0 },
                { id: '2', value: 2 },
            ],
        });

        api.applyTransaction({
            update: [{ id: '1', value: 1 }],
            add: [{ id: '3', value: 3 }],
        });

        await asyncSetTimeout(1);
        expect(rowDataUpdated).toBe(0);
        expect(modelUpdated).toBe(0);

        await new GridRows(api, 'data', gridRowsOptions).check('empty');

        api.setGridOption('columnDefs', [{ field: 'value' }, { field: 'value' }]);

        await asyncSetTimeout(1);
        expect(rowDataUpdated).toBe(1);
        expect(modelUpdated).toBe(1);

        await new GridRows(api, 'data', gridRowsOptions).check(`
            ROOT id:ROOT_NODE_ID
            ├── LEAF id:1 value:1
            ├── LEAF id:2 value:2
            └── LEAF id:3 value:3
        `);
    });
});
