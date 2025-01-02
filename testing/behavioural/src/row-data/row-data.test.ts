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

describe('ag-grid rows-ordering', () => {
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
        expect(modelUpdatedCount).toBe(4);
        expect(compareCalled).toBe(true);

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
        expect(modelUpdatedCount).toBe(5);
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
        expect(modelUpdatedCount).toBe(6);
        expect(compareCalled).toBe(true);
    });
});
