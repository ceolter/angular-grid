import type { MockInstance } from 'vitest';

import { ClientSideRowModelModule } from 'ag-grid-community';
import type { GridOptions, RowDataTransaction } from 'ag-grid-community';

import type { GridRowsOptions } from '../test-utils';
import {
    GridRows,
    TestGridsManager,
    asyncSetTimeout,
    cachedJSONObjects,
    executeTransactionsAsync,
} from '../test-utils';
import { VERSION } from '../version';

const defaultGridRowsOptions: GridRowsOptions = {
    columns: ['x'],
    checkDom: true,
};

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

    test('row order is the same as row data (without id)', async () => {
        const rowData1 = [{ x: 1 }, { x: 2 }, { x: 3 }, { x: 4 }];
        const rowData2 = [{ x: 2 }, { x: 1 }, { x: 4 }];

        const gridOptions: GridOptions = {
            columnDefs: [{ field: 'x' }],
            animateRows: false,
            rowData: rowData1,
        };

        const api = gridsManager.createGrid('myGrid', gridOptions);

        await new GridRows(api, 'data', defaultGridRowsOptions).check(`
            ROOT id:ROOT_NODE_ID
            ├── LEAF id:0 x:1
            ├── LEAF id:1 x:2
            ├── LEAF id:2 x:3
            └── LEAF id:3 x:4
        `);

        api.setGridOption('rowData', rowData2);

        await new GridRows(api, 'data', defaultGridRowsOptions).check(`
            ROOT id:ROOT_NODE_ID
            ├── LEAF id:0 x:2
            ├── LEAF id:1 x:1
            └── LEAF id:2 x:4
        `);

        api.applyTransaction({ add: [{ x: 7 }, { x: 5 }] });

        await new GridRows(api, 'data', defaultGridRowsOptions).check(`
            ROOT id:ROOT_NODE_ID
            ├── LEAF id:0 x:2
            ├── LEAF id:1 x:1
            ├── LEAF id:2 x:4
            ├── LEAF id:3 x:7
            └── LEAF id:4 x:5
        `);

        api.applyTransaction({ addIndex: 1, add: [{ x: 6 }] });

        await new GridRows(api, 'data', defaultGridRowsOptions).check(`
            ROOT id:ROOT_NODE_ID
            ├── LEAF id:0 x:2
            ├── LEAF id:5 x:6
            ├── LEAF id:1 x:1
            ├── LEAF id:2 x:4
            ├── LEAF id:3 x:7
            └── LEAF id:4 x:5
        `);
    });

    test('row order is the same as row data (with id)', async () => {
        const rowData1 = [
            { id: '1', x: 1 },
            { id: '2', x: 2 },
            { id: '3', x: 3 },
            { id: '4', x: 4 },
        ];
        const rowData2 = [
            { id: '2', x: 2 },
            { id: '1', x: 1 },
            { id: '4', x: 4 },
        ];

        const api = gridsManager.createGrid('myGrid', {
            columnDefs: [{ field: 'x' }],
            animateRows: false,
            rowData: rowData1,
            getRowId: (params) => params.data.id,
        });

        await new GridRows(api, 'data', defaultGridRowsOptions).check(`
            ROOT id:ROOT_NODE_ID
            ├── LEAF id:1 x:1
            ├── LEAF id:2 x:2
            ├── LEAF id:3 x:3
            └── LEAF id:4 x:4
        `);

        api.setGridOption('rowData', rowData2);

        await new GridRows(api, 'data', defaultGridRowsOptions).check(`
            ROOT id:ROOT_NODE_ID
            ├── LEAF id:2 x:2
            ├── LEAF id:1 x:1
            └── LEAF id:4 x:4
        `);

        api.applyTransaction({
            add: [
                { id: '7', x: 7 },
                { id: '5', x: 5 },
            ],
        });

        await new GridRows(api, 'data', defaultGridRowsOptions).check(`
            ROOT id:ROOT_NODE_ID
            ├── LEAF id:2 x:2
            ├── LEAF id:1 x:1
            ├── LEAF id:4 x:4
            ├── LEAF id:7 x:7
            └── LEAF id:5 x:5
        `);

        api.applyTransaction({
            addIndex: 1,
            add: [{ id: '6', x: 6 }],
        });

        await new GridRows(api, 'data', defaultGridRowsOptions).check(`
            ROOT id:ROOT_NODE_ID
            ├── LEAF id:2 x:2
            ├── LEAF id:6 x:6
            ├── LEAF id:1 x:1
            ├── LEAF id:4 x:4
            ├── LEAF id:7 x:7
            └── LEAF id:5 x:5
        `);

        consoleWarnSpy = vitest.spyOn(console, 'warn').mockImplementation(() => {});

        await executeTransactionsAsync(
            [
                {
                    add: [
                        { id: '9', x: 9 },
                        { id: '8', x: 8 },
                    ],
                },
                {
                    addIndex: 5,
                    remove: [{ id: '6' }],
                    update: [{ id: '8', x: 80 }],
                    add: [
                        { id: '9', x: 91 },
                        { id: '10', x: 10 },
                    ],
                },
            ],
            api
        );

        expect(consoleWarnSpy).toHaveBeenCalledWith(
            'AG Grid: error #2',
            "Duplicate node id '9' detected from getRowId callback, this could cause issues in your grid.",
            expect.stringContaining(`/javascript-data-grid/errors/2?_version_=${VERSION}&nodeId=9`)
        );

        consoleWarnSpy.mockRestore();

        await new GridRows(api, 'data', { ...defaultGridRowsOptions, checkDom: false }).check(`
            ROOT id:ROOT_NODE_ID
            ├── LEAF id:2 x:2
            ├── LEAF id:1 x:1
            ├── LEAF id:4 x:4
            ├── LEAF id:7 x:7
            ├── LEAF id:5 x:5
            ├── LEAF id:9 x:91
            ├── LEAF id:10 x:10
            ├── LEAF id:9 x:9
            └── LEAF id:8 x:80
        `);
    });

    test('setRowData after a transaction overrides the order (with id)', async () => {
        const rowData1 = [{ id: '1', x: 1 }];

        const api = gridsManager.createGrid('myGrid', {
            columnDefs: [{ field: 'x' }],
            animateRows: false,
            rowData: rowData1,
            getRowId: (params) => params.data.id,
        });

        api.applyTransaction({
            add: [{ id: '2', x: 2 }],
        });

        api.setGridOption('rowData', [
            { id: '2', x: 2 },
            { id: '1', x: 1 },
        ]);

        await new GridRows(api, 'data', defaultGridRowsOptions).check(`
            ROOT id:ROOT_NODE_ID
            ├── LEAF id:2 x:2
            └── LEAF id:1 x:1
        `);

        api.setGridOption('suppressMaintainUnsortedOrder', true);

        api.applyTransaction({
            add: [{ id: '3', x: 3 }],
        });

        api.setGridOption('rowData', [
            { id: '3', x: 13 },
            { id: '2', x: 12 },
            { id: '1', x: 11 },
        ]);

        await new GridRows(api, 'data', defaultGridRowsOptions).check(`
            ROOT id:ROOT_NODE_ID
            ├── LEAF id:2 x:12
            ├── LEAF id:1 x:11
            └── LEAF id:3 x:13
        `);
    });

    test('suppressMaintainUnsortedOrder (with id)', async () => {
        const rowData1 = [
            { id: '1', x: 1 },
            { id: '2', x: 2 },
            { id: '3', x: 3 },
            { id: '4', x: 4 },
        ];
        const rowData2 = [
            { id: '4', x: 14 },
            { id: '1', x: 11 },
            { id: '3', x: 13 },
            { id: '5', x: 15 },
            { id: '6', x: 16 },
        ];

        const api = gridsManager.createGrid('myGrid', {
            columnDefs: [{ field: 'x' }],
            animateRows: false,
            rowData: rowData1,
            getRowId: (params) => params.data.id,
            suppressMaintainUnsortedOrder: true,
        });

        await new GridRows(api, 'data', defaultGridRowsOptions).check(`
            ROOT id:ROOT_NODE_ID
            ├── LEAF id:1 x:1
            ├── LEAF id:2 x:2
            ├── LEAF id:3 x:3
            └── LEAF id:4 x:4
        `);

        api.setGridOption('rowData', rowData2);

        await new GridRows(api, 'data', defaultGridRowsOptions).check(`
            ROOT id:ROOT_NODE_ID
            ├── LEAF id:1 x:11
            ├── LEAF id:3 x:13
            ├── LEAF id:4 x:14
            ├── LEAF id:5 x:15
            └── LEAF id:6 x:16
        `);
    });

    test('complex setRowData with remove, update, change order, add', async () => {
        const rowData1 = [
            { id: '1', x: 1 },
            { id: '2', x: 2 },
            { id: '3', x: 3 },
            { id: '4', x: 4 },
            { id: '5', x: 5 },
            { id: '6', x: 6 },
        ];

        const api = gridsManager.createGrid('myGrid', {
            columnDefs: [{ field: 'x' }],
            animateRows: false,
            rowData: rowData1,
            getRowId: (params) => params.data.id,
        });

        api.setGridOption('rowData', [
            { id: '5', x: 11 },
            { id: '2', x: 13 },
            { id: '6', x: 12 },
            { id: '3', x: 14 },
        ]);

        await new GridRows(api, 'data', defaultGridRowsOptions).check(`
            ROOT id:ROOT_NODE_ID
            ├── LEAF id:5 x:11
            ├── LEAF id:2 x:13
            ├── LEAF id:6 x:12
            └── LEAF id:3 x:14
        `);

        api.applyTransaction({
            remove: [{ id: '5' }],
            update: [
                { id: '6', x: 100 },
                { id: '3', x: 101 },
            ],
            addIndex: 1,
            add: [
                { id: '7', x: 102 },
                { id: '8', x: 103 },
                { id: '9', x: 104 },
            ],
        });

        await new GridRows(api, 'data', defaultGridRowsOptions).check(`
            ROOT id:ROOT_NODE_ID
            ├── LEAF id:2 x:13
            ├── LEAF id:7 x:102
            ├── LEAF id:8 x:103
            ├── LEAF id:9 x:104
            ├── LEAF id:6 x:100
            └── LEAF id:3 x:101
        `);
    });

    test('multiple interleaved addIndex with async transaction', async () => {
        const rowData1 = [
            { id: '1', x: 1 },
            { id: '2', x: 2 },
            { id: '3', x: 3 },
            { id: '4', x: 4 },
            { id: '5', x: 5 },
            { id: '6', x: 6 },
        ];

        const api = gridsManager.createGrid('myGrid', {
            columnDefs: [{ field: 'x' }],
            animateRows: false,
            rowData: rowData1,
            getRowId: (params) => params.data.id,
        });

        await executeTransactionsAsync(
            [
                {
                    remove: [{ id: '5' }],
                    addIndex: 1,
                    add: [
                        { id: '7', x: 7 },
                        { id: '8', x: 8 },
                    ],
                },
                {
                    remove: [{ id: '6' }],
                    update: [{ id: '7', x: 33 }],
                    addIndex: 3,
                    add: [{ id: '9', x: 9 }],
                },
                {
                    addIndex: 5,
                    update: [{ id: '9', x: 99 }],
                    add: [
                        { id: '10', x: 10 },
                        { id: '5', x: 105 },
                        { id: '11', x: 11 },
                    ],
                },
            ],
            api
        );

        await new GridRows(api, 'data', defaultGridRowsOptions).check(`
            ROOT id:ROOT_NODE_ID
            ├── LEAF id:1 x:1
            ├── LEAF id:7 x:33
            ├── LEAF id:8 x:8
            ├── LEAF id:9 x:99
            ├── LEAF id:2 x:2
            ├── LEAF id:10 x:10
            ├── LEAF id:5 x:105
            ├── LEAF id:11 x:11
            ├── LEAF id:3 x:3
            └── LEAF id:4 x:4
        `);
    });

    test('can swap rows by updating row data', async () => {
        const rowData1 = cachedJSONObjects.array([
            { id: '0', x: 1 },
            { id: '1', x: 1 },
            { id: '2', x: 1 },
            { id: '3', x: 1 },
            { id: '4', x: 1 },
            { id: '5', x: 1 },
        ]);

        const rowData2 = cachedJSONObjects.array([
            { id: '0', x: 1 },
            { id: '1', x: 1 },
            { id: '3', x: 1 },
            { id: '2', x: 1 },
            { id: '4', x: 1 },
            { id: '5', x: 1 },
        ]);

        const rowData3 = cachedJSONObjects.array([
            { id: '4', x: 1 },
            { id: '1', x: 1 },
            { id: '3', x: 1 },
            { id: '2', x: 1 },
            { id: '0', x: 1 },
            { id: '5', x: 1 },
        ]);

        const rowData4 = cachedJSONObjects.array([
            { id: '5', x: 1 },
            { id: '1', x: 1 },
            { id: '3', x: 1 },
            { id: '2', x: 1 },
            { id: '0', x: 1 },
            { id: '4', x: 1 },
        ]);

        const api = gridsManager.createGrid('myGrid', {
            columnDefs: [{ field: 'x' }],
            animateRows: false,
            rowData: rowData1,
            getRowId: (params) => params.data.id,
        });

        await new GridRows(api, 'data', defaultGridRowsOptions).check(`
            ROOT id:ROOT_NODE_ID
            ├── LEAF id:0 x:1
            ├── LEAF id:1 x:1
            ├── LEAF id:2 x:1
            ├── LEAF id:3 x:1
            ├── LEAF id:4 x:1
            └── LEAF id:5 x:1
        `);

        api.setGridOption('rowData', rowData2);
        await new GridRows(api, 'data', defaultGridRowsOptions).check(`
            ROOT id:ROOT_NODE_ID
            ├── LEAF id:0 x:1
            ├── LEAF id:1 x:1
            ├── LEAF id:3 x:1
            ├── LEAF id:2 x:1
            ├── LEAF id:4 x:1
            └── LEAF id:5 x:1
        `);

        api.setGridOption('rowData', rowData3);
        await new GridRows(api, 'data', defaultGridRowsOptions).check(`
            ROOT id:ROOT_NODE_ID
            ├── LEAF id:4 x:1
            ├── LEAF id:1 x:1
            ├── LEAF id:3 x:1
            ├── LEAF id:2 x:1
            ├── LEAF id:0 x:1
            └── LEAF id:5 x:1
        `);

        api.setGridOption('rowData', rowData4);
        await new GridRows(api, 'data', defaultGridRowsOptions).check(`
            ROOT id:ROOT_NODE_ID
            ├── LEAF id:5 x:1
            ├── LEAF id:1 x:1
            ├── LEAF id:3 x:1
            ├── LEAF id:2 x:1
            ├── LEAF id:0 x:1
            └── LEAF id:4 x:1
        `);
    });

    describe('complex transaction', () => {
        test('ag-grid sync complex transaction', async () => {
            const row0 = { id: '0', x: '0' };
            const row1a = { id: '1', x: '1a' };
            const row2 = { id: '2', x: '2' };
            const row3 = { id: '3', x: '3' };
            const row4 = { id: '4', x: '4' };
            const row5a = { id: '5', x: '5a' };
            const row6a = { id: '6', x: '6a' };

            const row1b = { id: '1', x: '1b' };
            const row5b = { id: '5', x: '5b' };
            const row6b = { id: '6', x: '6b' };

            const rowData = [row0, row1a];
            const transactions: RowDataTransaction[] = [
                { add: [row2] },
                { update: [row1b], add: [row3, row4] },
                { remove: [row1b], add: [row5a, row6a] },
                { remove: [row2], update: [row6b] },
                { update: [row5b] },
            ];

            const api = gridsManager.createGrid('myGrid', {
                columnDefs: [{ field: 'x' }],
                animateRows: false,
                rowData,
                getRowId: (params) => params.data.id,
            });

            await new GridRows(api, 'data', defaultGridRowsOptions).check(`
                ROOT id:ROOT_NODE_ID
                ├── LEAF id:0 x:"0"
                └── LEAF id:1 x:"1a"
            `);

            api.applyTransaction(transactions[0]);

            await new GridRows(api, 'data', defaultGridRowsOptions).check(`
                ROOT id:ROOT_NODE_ID
                ├── LEAF id:0 x:"0"
                ├── LEAF id:1 x:"1a"
                └── LEAF id:2 x:"2"
            `);

            api.applyTransaction(transactions[1]);

            await new GridRows(api, 'data', defaultGridRowsOptions).check(`
                ROOT id:ROOT_NODE_ID
                ├── LEAF id:0 x:"0"
                ├── LEAF id:1 x:"1b"
                ├── LEAF id:2 x:"2"
                ├── LEAF id:3 x:"3"
                └── LEAF id:4 x:"4"
            `);

            api.applyTransaction(transactions[2]);

            await new GridRows(api, 'data', defaultGridRowsOptions).check(`
                ROOT id:ROOT_NODE_ID
                ├── LEAF id:0 x:"0"
                ├── LEAF id:2 x:"2"
                ├── LEAF id:3 x:"3"
                ├── LEAF id:4 x:"4"
                ├── LEAF id:5 x:"5a"
                └── LEAF id:6 x:"6a"
            `);

            api.applyTransaction(transactions[3]);

            await new GridRows(api, 'data', defaultGridRowsOptions).check(`
                ROOT id:ROOT_NODE_ID
                ├── LEAF id:0 x:"0"
                ├── LEAF id:3 x:"3"
                ├── LEAF id:4 x:"4"
                ├── LEAF id:5 x:"5a"
                └── LEAF id:6 x:"6b"
            `);

            api.applyTransaction(transactions[4]);

            await new GridRows(api, 'data', defaultGridRowsOptions).check(`
                ROOT id:ROOT_NODE_ID
                ├── LEAF id:0 x:"0"
                ├── LEAF id:3 x:"3"
                ├── LEAF id:4 x:"4"
                ├── LEAF id:5 x:"5b"
                └── LEAF id:6 x:"6b"
            `);
        });

        test('ag-grid async complex transaction', async () => {
            const row0 = { id: '0', x: '0' };
            const row1a = { id: '1', x: '1a' };
            const row2 = { id: '2', x: '2' };
            const row3 = { id: '3', x: '3' };
            const row4 = { id: '4', x: '4' };
            const row5a = { id: '5', x: '5a' };
            const row6a = { id: '6', x: '6a' };

            const row1b = { id: '1', x: '1b' };
            const row5b = { id: '5', x: '5b' };
            const row6b = { id: '6', x: '6b' };

            const rowData = [row0, row1a];
            const transactions: RowDataTransaction[] = [
                { add: [row2] },
                { update: [row1b], add: [row3, row4] },
                { remove: [row1b], add: [row5a, row6a] },
                { remove: [row2], update: [row6b] },
                { update: [row5b] },
            ];

            const api = gridsManager.createGrid('myGrid', {
                columnDefs: [{ field: 'x' }],
                animateRows: false,
                rowData,
                getRowId: (params) => params.data.id,
            });

            await executeTransactionsAsync(transactions, api);

            await new GridRows(api, 'data', defaultGridRowsOptions).check(`
                ROOT id:ROOT_NODE_ID
                ├── LEAF id:0 x:"0"
                ├── LEAF id:3 x:"3"
                ├── LEAF id:4 x:"4"
                ├── LEAF id:5 x:"5b"
                └── LEAF id:6 x:"6b"
            `);
        });
    });

    describe('edge cases', () => {
        test('updating rows that do not exists do not add them', async () => {
            const rowData1 = [
                { id: '1', x: 1 },
                { id: '2', x: 2 },
            ];

            const api = gridsManager.createGrid('myGrid', {
                columnDefs: [{ field: 'x' }],
                animateRows: false,
                rowData: rowData1,
                getRowId: (params) => params.data.id,
            });

            consoleErrorSpy = vitest.spyOn(console, 'error').mockImplementation(() => {});

            api.applyTransaction({ update: [{ id: 'jhDjSi3Ec-3', x: 3 }] });

            expect(consoleErrorSpy).toHaveBeenCalledWith(
                'AG Grid: error #4',
                'Could not find row id=jhDjSi3Ec-3, data item was not found for this id',
                expect.stringContaining(`/javascript-data-grid/errors/4?_version_=${VERSION}&id=jhDjSi3Ec-3`)
            );

            await executeTransactionsAsync({ update: [{ id: 'jhDjSi3Ec-4', x: 4 }] }, api);

            expect(consoleErrorSpy).toHaveBeenCalledWith(
                'AG Grid: error #4',
                'Could not find row id=jhDjSi3Ec-4, data item was not found for this id',
                expect.stringContaining(`/javascript-data-grid/errors/4?_version_=${VERSION}&id=jhDjSi3Ec-4`)
            );

            consoleErrorSpy.mockRestore();

            await new GridRows(api, 'data', defaultGridRowsOptions).check(`
                ROOT id:ROOT_NODE_ID
                ├── LEAF id:1 x:1
                └── LEAF id:2 x:2
            `);
        });

        test('duplicate IDs do not cause sourceRowIndex to be invalid', async () => {
            const rowData1 = [
                { id: '1', x: 1 },
                { id: '2', x: 2 },
                { id: '3', x: 3 },
                { id: '4', x: 4 },
                { id: '3', x: 5 },
                { id: '3', x: 6 },
            ];

            const gridRowsOptions: GridRowsOptions = {
                ...defaultGridRowsOptions,
                checkDom: false,
            };

            consoleWarnSpy = vitest.spyOn(console, 'warn').mockImplementation(() => {});

            const api = gridsManager.createGrid('myGrid', {
                columnDefs: [{ field: 'x' }],
                animateRows: false,
                rowData: rowData1,
                getRowId: (params) => params.data.id,
            });

            expect(consoleWarnSpy).toHaveBeenCalled();
            consoleWarnSpy.mockReset();

            await new GridRows(api, 'data', gridRowsOptions).check(`
                ROOT id:ROOT_NODE_ID
                ├── LEAF id:1 x:1
                ├── LEAF id:2 x:2
                ├── LEAF id:3 x:3
                ├── LEAF id:4 x:4
                ├── LEAF id:3 x:5
                └── LEAF id:3 x:6
            `);

            await executeTransactionsAsync(
                [
                    {
                        addIndex: 1,
                        add: [
                            { id: '13', x: 131 },
                            { id: '13', x: 132 },
                        ],
                    },
                    { addIndex: 5, add: [{ id: '13', x: 133 }] },
                    { remove: [{ id: '4' }], update: [{ id: '2', x: 33 }] },
                    { addIndex: 3, add: [{ id: '13', x: 134 }] },
                ],
                api
            );

            expect(consoleWarnSpy).toHaveBeenCalled();
            consoleWarnSpy.mockReset();

            await new GridRows(api, 'data', gridRowsOptions).check(`
                ROOT id:ROOT_NODE_ID
                ├── LEAF id:1 x:1
                ├── LEAF id:13 x:131
                ├── LEAF id:13 x:132
                ├── LEAF id:13 x:134
                ├── LEAF id:2 x:33
                ├── LEAF id:3 x:3
                ├── LEAF id:13 x:133
                ├── LEAF id:3 x:5
                └── LEAF id:3 x:6
            `);
        });

        test('addIndex is tolerant to floating point numbers, negative values, and values bigger than the array', async () => {
            const rowData = [
                { id: '1', x: 1 },
                { id: '2', x: 2 },
                { id: '3', x: 3 },
                { id: '4', x: 4 },
                { id: '5', x: 5 },
            ];

            const api = gridsManager.createGrid('myGrid', {
                columnDefs: [{ field: 'x' }],
                animateRows: false,
                rowData: rowData,
                getRowId: (params) => params.data.id,
            });

            await executeTransactionsAsync(
                [
                    { addIndex: rowData.length / 2, add: [{ id: '7', x: 7 }] },
                    { addIndex: 1.5, add: [{ id: '6', x: 6 }] },
                    { addIndex: -1, add: [{ id: '8', x: 8 }] },
                    { addIndex: rowData.length + 3, add: [{ id: '9', x: 9 }] },
                    { addIndex: rowData.length + 10, add: [{ id: '10', x: 10 }] },
                    { addIndex: Number.NEGATIVE_INFINITY, add: [{ id: '11', x: 11 }] },
                    { addIndex: Number.POSITIVE_INFINITY, add: [{ id: '12', x: 12 }] },
                    { addIndex: Number.NaN, add: [{ id: '13', x: 13 }] },
                ],
                api
            );

            await new GridRows(api, 'data', defaultGridRowsOptions).check(`
                ROOT id:ROOT_NODE_ID
                ├── LEAF id:1 x:1
                ├── LEAF id:2 x:2
                ├── LEAF id:6 x:6
                ├── LEAF id:3 x:3
                ├── LEAF id:7 x:7
                ├── LEAF id:4 x:4
                ├── LEAF id:5 x:5
                ├── LEAF id:8 x:8
                ├── LEAF id:9 x:9
                ├── LEAF id:10 x:10
                ├── LEAF id:11 x:11
                ├── LEAF id:12 x:12
                └── LEAF id:13 x:13
            `);
        });
    });

    test('immutable update inside a rowDataUpdated event', async () => {
        const rowData1 = [
            { id: '1', x: 1 },
            { id: '2', x: 2 },
            { id: '3', x: 3 },
            { id: '4', x: 4 },
        ];
        const rowData2 = [
            { id: '1', x: 1 },
            { id: '4', x: 4 },
            { id: '5', x: 5 },
            { id: '3', x: 33 },
        ];
        const rowData3 = [
            { id: '4', x: 4 },
            { id: '1', x: 1 },
            { id: '5', x: 5 },
            { id: '7', x: 77 },
        ];

        let rowDataUpdatedCalls = 0;
        let modelUpdatedCalls = 0;

        const api = gridsManager.createGrid('myGrid', {
            columnDefs: [{ field: 'x' }],
            animateRows: false,
            rowData: rowData1,
            onRowDataUpdated: (event) => {
                expect(event.type).toBe('rowDataUpdated');
                expect(event.api).toBe(api);

                if (rowDataUpdatedCalls === 0) {
                    api.setGridOption('rowData', rowData2);
                }

                ++rowDataUpdatedCalls;
            },
            onModelUpdated: (event) => {
                expect(event.type).toBe('modelUpdated');

                if (modelUpdatedCalls === 1) {
                    api.setGridOption('rowData', rowData3);
                }

                ++modelUpdatedCalls;
            },
            getRowId: (params) => params.data.id,
        });

        // Await the async events are executed
        await asyncSetTimeout(0);
        await asyncSetTimeout(2);

        await new GridRows(api, 'data', defaultGridRowsOptions).check(`
            ROOT id:ROOT_NODE_ID
            ├── LEAF id:4 x:4
            ├── LEAF id:1 x:1
            ├── LEAF id:5 x:5
            └── LEAF id:7 x:77
        `);
    });
});
