import { ClientSideRowModelModule } from 'ag-grid-community';
import { TreeDataModule } from 'ag-grid-enterprise';

import type { GridRowsOptions } from '../../../test-utils';
import { GridRows, TestGridsManager, cachedJSONObjects, executeTransactionsAsync } from '../../../test-utils';

describe('ag-grid tree aggregation', () => {
    const gridsManager = new TestGridsManager({
        modules: [ClientSideRowModelModule, TreeDataModule],
    });

    beforeEach(() => {
        vitest.useRealTimers();
        gridsManager.reset();
    });

    afterEach(() => {
        gridsManager.reset();
    });

    test('tree aggregation and update', async () => {
        const rowData = cachedJSONObjects.array([
            { id: '1', name: 'John Von Neumann', x: 1, path: ['A'] },
            { id: '2', name: 'Alan Turing', x: 1, path: ['A', 'B'] },
            { id: '3', name: 'A. Church', x: 1, path: ['A', 'C'] },
            { id: '4', name: 'Donald Knuth', x: 1, path: ['A', 'B', 'D'] },
            { id: '5', name: 'Grace Hopper', x: 2, path: ['A', 'B', 'E'] },
            { id: '6', name: 'Linus Torvalds', x: 2, path: ['A', 'C', 'F'] },
            { id: '7', name: 'Brian Kernighan', x: 2, path: ['A', 'C', 'G'] },
            { id: '8', name: 'Claude Elwood Shannon', x: 2, path: ['A', 'C', 'H', 'I'] },
            { id: '9', name: 'E. Dijkstra', x: 2, path: ['J'] },
        ]);

        const api = gridsManager.createGrid('myGrid', {
            columnDefs: [{ field: 'name' }, { field: 'x', aggFunc: 'sum' }],
            autoGroupColumnDef: { headerName: 'Path' },
            treeData: true,
            animateRows: false,
            rowSelection: { mode: 'multiRow' },
            groupDefaultExpanded: -1,
            rowData,
            getRowId: (params) => params.data.id,
            getDataPath: (data: any) => data.path,
        });

        const gridRowsOptions: GridRowsOptions = {
            columns: ['name', 'x'],
            checkDom: true,
        };

        await new GridRows(api, 'initial', gridRowsOptions).check(`
            ROOT id:ROOT_NODE_ID
            ├─┬ A GROUP id:1 name:"John Von Neumann" x:9
            │ ├─┬ B GROUP id:2 name:"Alan Turing" x:3
            │ │ ├── D LEAF id:4 name:"Donald Knuth" x:1
            │ │ └── E LEAF id:5 name:"Grace Hopper" x:2
            │ └─┬ C GROUP id:3 name:"A. Church" x:6
            │ · ├── F LEAF id:6 name:"Linus Torvalds" x:2
            │ · ├── G LEAF id:7 name:"Brian Kernighan" x:2
            │ · └─┬ H filler id:row-group-0-A-1-C-2-H x:2
            │ · · └── I LEAF id:8 name:"Claude Elwood Shannon" x:2
            └── J LEAF id:9 name:"E. Dijkstra" x:2
        `);

        api.setGridOption(
            'rowData',
            cachedJSONObjects.array([
                { id: '1', name: 'John Von Neumann', x: 1, path: ['A'] },
                { id: '2', name: 'Alan Turing', x: 1, path: ['A', 'B'] },
                { id: '3', name: 'A. Church', x: 1, path: ['A', 'C'] },
                { id: '5', name: 'Grace Hopper', x: 2, path: ['A', 'B', 'E'] },
                { id: '4', name: 'Donald Knuth', x: 10, path: ['A', 'B', 'D'] },
                { id: '6', name: 'Linus Torvalds', x: 2, path: ['A', 'C', 'F'] },
                { id: '7', name: 'Brian Kernighan', x: 2, path: ['A', 'C', 'G'] },
                { id: '8', name: 'Claude Elwood Shannon', x: 10, path: ['A', 'C', 'H', 'I'] },
                { id: '9', name: 'E. Dijkstra', x: 2, path: ['J'] },
            ])
        );

        await new GridRows(api, 'update x', gridRowsOptions).check(`
            ROOT id:ROOT_NODE_ID
            ├─┬ A GROUP id:1 name:"John Von Neumann" x:26
            │ ├─┬ B GROUP id:2 name:"Alan Turing" x:12
            │ │ ├── E LEAF id:5 name:"Grace Hopper" x:2
            │ │ └── D LEAF id:4 name:"Donald Knuth" x:10
            │ └─┬ C GROUP id:3 name:"A. Church" x:14
            │ · ├── F LEAF id:6 name:"Linus Torvalds" x:2
            │ · ├── G LEAF id:7 name:"Brian Kernighan" x:2
            │ · └─┬ H filler id:row-group-0-A-1-C-2-H x:10
            │ · · └── I LEAF id:8 name:"Claude Elwood Shannon" x:10
            └── J LEAF id:9 name:"E. Dijkstra" x:2
        `);

        api.setGridOption(
            'rowData',
            cachedJSONObjects.array([
                { id: '1', name: 'John Von Neumann', x: 1, path: ['A'] },
                { id: '2', name: 'Alan Turing', x: 1, path: ['A', 'B'] },
                { id: '3', name: 'A. Church', x: 1, path: ['A', 'C'] },
                { id: '5', name: 'Grace Hopper', x: 2, path: ['A', 'B', 'E'] },
                { id: '4', name: 'Donald Knuth', x: 10, path: ['A', 'B', 'D'] },
                { id: '6', name: 'Linus Torvalds', x: 2, path: ['A', 'C', 'F'] },
                { id: '8', name: 'Claude Elwood Shannon', x: 10, path: ['A', 'C', 'H', 'I'] },
                { id: '9', name: 'E. Dijkstra', x: 2, path: ['J'] },
            ])
        );

        await new GridRows(api, 'delete', gridRowsOptions).check(`
            ROOT id:ROOT_NODE_ID
            ├─┬ A GROUP id:1 name:"John Von Neumann" x:24
            │ ├─┬ B GROUP id:2 name:"Alan Turing" x:12
            │ │ ├── E LEAF id:5 name:"Grace Hopper" x:2
            │ │ └── D LEAF id:4 name:"Donald Knuth" x:10
            │ └─┬ C GROUP id:3 name:"A. Church" x:12
            │ · ├── F LEAF id:6 name:"Linus Torvalds" x:2
            │ · └─┬ H filler id:row-group-0-A-1-C-2-H x:10
            │ · · └── I LEAF id:8 name:"Claude Elwood Shannon" x:10
            └── J LEAF id:9 name:"E. Dijkstra" x:2
        `);

        const movedRowData = cachedJSONObjects.array([
            { id: '1', name: 'John Von Neumann', x: 1, path: ['A'] },
            { id: '2', name: 'Alan Turing', x: 1, path: ['A', 'B'] },
            { id: '3', name: 'A. Church', x: 1, path: ['A', 'C'] },
            { id: '5', name: 'Grace Hopper', x: 2, path: ['A', 'B', 'E'] },
            { id: '4', name: 'Donald Knuth', x: 10, path: ['A', 'B', 'D'] },
            { id: '6', name: 'Linus Torvalds', x: 2, path: ['A', 'B', 'F', 'G'] },
            { id: '8', name: 'Claude Elwood Shannon', x: 10, path: ['A', 'B', 'H'] },
            { id: '9', name: 'E. Dijkstra', x: 2, path: ['J'] },
        ]);

        api.setGridOption('rowData', movedRowData);

        await new GridRows(api, 'move', gridRowsOptions).check(`
            ROOT id:ROOT_NODE_ID
            ├─┬ A GROUP id:1 name:"John Von Neumann" x:25
            │ ├─┬ B GROUP id:2 name:"Alan Turing" x:24
            │ │ ├── E LEAF id:5 name:"Grace Hopper" x:2
            │ │ ├── D LEAF id:4 name:"Donald Knuth" x:10
            │ │ ├─┬ F filler id:row-group-0-A-1-B-2-F x:2
            │ │ │ └── G LEAF id:6 name:"Linus Torvalds" x:2
            │ │ └── H LEAF id:8 name:"Claude Elwood Shannon" x:10
            │ └── C LEAF id:3 name:"A. Church" x:1
            └── J LEAF id:9 name:"E. Dijkstra" x:2
        `);
    });

    test.each(['transactions', 'immutable'] as const)(
        'tree aggregation, with aggregateOnlyChangedColumns=true %s',
        async (mode) => {
            const rowData = cachedJSONObjects.array([
                { id: '0', path: ['A'] },
                { id: '1', path: ['A', 'B'] },
                { id: '2', x: 1, y: 1, path: ['A', 'B', 'D'] },
                { id: '3', x: 1, y: 2, path: ['A', 'B', 'E'] },
                { id: '4', x: 2, y: 3, path: ['A', 'C', 'F'] },
                { id: '5', x: 2, y: 4, path: ['A', 'C', 'G'] },
                { id: '6', x: 2, y: 5, path: ['A', 'C', 'H', 'I'] },
                { id: '7', x: 2, y: 6, path: ['A', 'C', 'H', 'J'] },
                { id: '8', x: 2, y: 7, path: ['A', 'C', 'H', 'K', 'L'] },
            ]);

            const api = gridsManager.createGrid('myGrid', {
                columnDefs: [
                    { field: 'x', aggFunc: 'sum' },
                    { field: 'y', aggFunc: 'sum' },
                ],
                autoGroupColumnDef: { headerName: 'Path' },
                aggregateOnlyChangedColumns: true,
                treeData: true,
                animateRows: false,
                rowSelection: { mode: 'multiRow' },
                groupDefaultExpanded: -1,
                rowData,
                getRowId: (params) => params.data.id,
                getDataPath: (data: any) => data.path,
            });

            const gridRowsOptions: GridRowsOptions = {
                columns: ['x', 'y'],
                checkDom: true,
            };

            await new GridRows(api, 'initial', gridRowsOptions).check(`
                ROOT id:ROOT_NODE_ID
                └─┬ A GROUP id:0 x:12 y:28
                · ├─┬ B GROUP id:1 x:2 y:3
                · │ ├── D LEAF id:2 x:1 y:1
                · │ └── E LEAF id:3 x:1 y:2
                · └─┬ C filler id:row-group-0-A-1-C x:10 y:25
                · · ├── F LEAF id:4 x:2 y:3
                · · ├── G LEAF id:5 x:2 y:4
                · · └─┬ H filler id:row-group-0-A-1-C-2-H x:6 y:18
                · · · ├── I LEAF id:6 x:2 y:5
                · · · ├── J LEAF id:7 x:2 y:6
                · · · └─┬ K filler id:row-group-0-A-1-C-2-H-3-K x:2 y:7
                · · · · └── L LEAF id:8 x:2 y:7
            `);

            if (mode === 'transactions') {
                api.applyTransaction({ remove: [rowData[3], rowData[8]] });
            } else {
                api.setGridOption(
                    'rowData',
                    cachedJSONObjects.array([
                        { id: '0', path: ['A'] },
                        { id: '1', path: ['A', 'B'] },
                        { id: '2', x: 1, y: 1, path: ['A', 'B', 'D'] },
                        { id: '4', x: 2, y: 3, path: ['A', 'C', 'F'] },
                        { id: '5', x: 2, y: 4, path: ['A', 'C', 'G'] },
                        { id: '6', x: 2, y: 5, path: ['A', 'C', 'H', 'I'] },
                        { id: '7', x: 2, y: 6, path: ['A', 'C', 'H', 'J'] },
                    ])
                );
            }

            await new GridRows(api, 'transaction 0 (remove)', gridRowsOptions).check(`
                ROOT id:ROOT_NODE_ID
                └─┬ A GROUP id:0 x:9 y:19
                · ├─┬ B GROUP id:1 x:1 y:1
                · │ └── D LEAF id:2 x:1 y:1
                · └─┬ C filler id:row-group-0-A-1-C x:8 y:18
                · · ├── F LEAF id:4 x:2 y:3
                · · ├── G LEAF id:5 x:2 y:4
                · · └─┬ H filler id:row-group-0-A-1-C-2-H x:4 y:11
                · · · ├── I LEAF id:6 x:2 y:5
                · · · └── J LEAF id:7 x:2 y:6
            `);

            if (mode === 'transactions') {
                await executeTransactionsAsync(
                    [
                        { update: [{ ...rowData[6], x: 99 }] },
                        { add: [rowData[3]] },
                        { update: [{ ...rowData[7], y: 1000 }] },
                        { add: [rowData[8]] },
                        { update: [{ ...rowData[6], x: 100 }] },
                    ],
                    api
                );
            } else {
                api.setGridOption(
                    'rowData',
                    cachedJSONObjects.array([
                        { id: '0', path: ['A'] },
                        { id: '1', path: ['A', 'B'] },
                        { id: '2', x: 1, y: 1, path: ['A', 'B', 'D'] },
                        { id: '3', x: 1, y: 2, path: ['A', 'B', 'E'] },
                        { id: '4', x: 2, y: 3, path: ['A', 'C', 'F'] },
                        { id: '5', x: 2, y: 4, path: ['A', 'C', 'G'] },
                        { id: '6', x: 100, y: 5, path: ['A', 'C', 'H', 'I'] },
                        { id: '7', x: 2, y: 1000, path: ['A', 'C', 'H', 'J'] },
                        { id: '8', x: 2, y: 7, path: ['A', 'C', 'H', 'K', 'L'] },
                    ])
                );
            }

            await new GridRows(api, 'transaction 1 (re-add, update)', gridRowsOptions).check(`
                ROOT id:ROOT_NODE_ID
                └─┬ A GROUP id:0 x:110 y:1022
                · ├─┬ B GROUP id:1 x:2 y:3
                · │ ├── D LEAF id:2 x:1 y:1
                · │ └── E LEAF id:3 x:1 y:2
                · └─┬ C filler id:row-group-0-A-1-C x:108 y:1019
                · · ├── F LEAF id:4 x:2 y:3
                · · ├── G LEAF id:5 x:2 y:4
                · · └─┬ H filler id:row-group-0-A-1-C-2-H x:104 y:1012
                · · · ├── I LEAF id:6 x:100 y:5
                · · · ├── J LEAF id:7 x:2 y:1000
                · · · └─┬ K filler id:row-group-0-A-1-C-2-H-3-K x:2 y:7
                · · · · └── L LEAF id:8 x:2 y:7
            `);

            if (mode === 'transactions') {
                api.applyTransaction({
                    update: [
                        { ...rowData[6], path: ['X', 'Y'] },
                        { ...rowData[7], path: ['X', 'Z'] },
                        { ...rowData[5], path: ['X', 'W'] },
                    ],
                });
            } else {
                api.setGridOption('rowData', [
                    { id: '0', path: ['A'] },
                    { id: '1', path: ['A', 'B'] },
                    { id: '2', x: 1, y: 1, path: ['A', 'B', 'D'] },
                    { id: '3', x: 1, y: 2, path: ['A', 'B', 'E'] },
                    { id: '4', x: 2, y: 3, path: ['A', 'C', 'F'] },
                    { id: '8', x: 2, y: 7, path: ['A', 'C', 'H', 'K', 'L'] },
                    { id: '5', x: 2, y: 4, path: ['X', 'W'] },
                    { id: '6', x: 2, y: 5, path: ['X', 'Y'] },
                    { id: '7', x: 2, y: 6, path: ['X', 'Z'] },
                ]);
            }

            await new GridRows(api, 'transaction 2 (change path)', gridRowsOptions).check(`
                ROOT id:ROOT_NODE_ID
                ├─┬ A GROUP id:0 x:6 y:13
                │ ├─┬ B GROUP id:1 x:2 y:3
                │ │ ├── D LEAF id:2 x:1 y:1
                │ │ └── E LEAF id:3 x:1 y:2
                │ └─┬ C filler id:row-group-0-A-1-C x:4 y:10
                │ · ├── F LEAF id:4 x:2 y:3
                │ · └─┬ H filler id:row-group-0-A-1-C-2-H x:2 y:7
                │ · · └─┬ K filler id:row-group-0-A-1-C-2-H-3-K x:2 y:7
                │ · · · └── L LEAF id:8 x:2 y:7
                └─┬ X filler id:row-group-0-X x:6 y:15
                · ├── W LEAF id:5 x:2 y:4
                · ├── Y LEAF id:6 x:2 y:5
                · └── Z LEAF id:7 x:2 y:6
            `);

            api.setGridOption('columnDefs', [
                { field: 'x', aggFunc: 'sum' },
                { field: 'y', aggFunc: 'avg' },
            ]);

            await new GridRows(api, 'change aggFunc', gridRowsOptions).check(`
                ROOT id:ROOT_NODE_ID
                ├─┬ A GROUP id:0 x:6 y:{"count":4,"value":3.25}
                │ ├─┬ B GROUP id:1 x:2 y:{"count":2,"value":1.5}
                │ │ ├── D LEAF id:2 x:1 y:1
                │ │ └── E LEAF id:3 x:1 y:2
                │ └─┬ C filler id:row-group-0-A-1-C x:4 y:{"count":2,"value":5}
                │ · ├── F LEAF id:4 x:2 y:3
                │ · └─┬ H filler id:row-group-0-A-1-C-2-H x:2 y:{"count":1,"value":7}
                │ · · └─┬ K filler id:row-group-0-A-1-C-2-H-3-K x:2 y:{"count":1,"value":7}
                │ · · · └── L LEAF id:8 x:2 y:7
                └─┬ X filler id:row-group-0-X x:6 y:{"count":3,"value":5}
                · ├── W LEAF id:5 x:2 y:4
                · ├── Y LEAF id:6 x:2 y:5
                · └── Z LEAF id:7 x:2 y:6
            `);

            if (mode === 'transactions') {
                api.applyTransaction({
                    remove: [rowData[2], rowData[3]],
                    update: [
                        { ...rowData[8], path: ['A', 'B', 'R'], x: 100, y: 100 },
                        { ...rowData[6], path: ['X', 'Y'], x: 100, y: 100 },
                        { ...rowData[7], path: ['X', 'W'], x: 100, y: 100 },
                        { ...rowData[5], path: ['X', 'W', 'W'], x: 200, y: 200 },
                    ],
                });
            } else {
                api.setGridOption(
                    'rowData',
                    cachedJSONObjects.array([
                        { id: '0', path: ['A'] },
                        { id: '1', path: ['A', 'B'] },
                        { id: '8', x: 100, y: 100, path: ['A', 'B', 'R'] },
                        { id: '4', x: 2, y: 3, path: ['A', 'C', 'F'] },
                        { id: '6', x: 100, y: 100, path: ['X', 'Y'] },
                        { id: '7', x: 100, y: 100, path: ['X', 'W'] },
                        { id: '5', x: 200, y: 200, path: ['X', 'W', 'W'] },
                    ])
                );
            }

            await new GridRows(api, 'transaction 4 (update and change path)', gridRowsOptions).check(`
                ROOT id:ROOT_NODE_ID
                ├─┬ A GROUP id:0 x:102 y:{"count":2,"value":51.5}
                │ ├─┬ B GROUP id:1 x:100 y:{"count":1,"value":100}
                │ │ └── R LEAF id:8 x:100 y:100
                │ └─┬ C filler id:row-group-0-A-1-C x:2 y:{"count":1,"value":3}
                │ · └── F LEAF id:4 x:2 y:3
                └─┬ X filler id:row-group-0-X x:300 y:{"count":2,"value":150}
                · ├── Y LEAF id:6 x:100 y:100
                · └─┬ W GROUP id:7 x:200 y:{"count":1,"value":200}
                · · └── W LEAF id:5 x:200 y:200
            `);
        }
    );

    test.each(['transactions', 'immutable'] as const)(
        'tree aggregation with alwaysAggregateAtRootLevel=true %s',
        async (mode) => {
            const rowData = cachedJSONObjects.array([
                { id: '0', path: ['A'] },
                { id: '1', path: ['A', 'B'] },
                { id: '2', x: 1, y: 1, path: ['A', 'B', 'D'] },
                { id: '3', x: 1, y: 2, path: ['A', 'B', 'E'] },
                { id: '4', x: 2, y: 3, path: ['A', 'C', 'F'] },
                { id: '5', x: 2, y: 4, path: ['A', 'C', 'G'] },
            ]);

            const api = gridsManager.createGrid('myGrid', {
                columnDefs: [
                    { field: 'x', aggFunc: 'sum' },
                    { field: 'y', aggFunc: 'sum' },
                ],
                autoGroupColumnDef: { headerName: 'Path' },
                alwaysAggregateAtRootLevel: true,
                treeData: true,
                animateRows: false,
                rowSelection: { mode: 'multiRow' },
                groupDefaultExpanded: -1,
                rowData,
                getRowId: (params) => params.data.id,
                getDataPath: (data: any) => data.path,
            });

            const gridRowsOptions: GridRowsOptions = {
                columns: ['x', 'y'],
                checkDom: true,
            };

            await new GridRows(api, 'initial', gridRowsOptions).check(`
                ROOT id:ROOT_NODE_ID x:6 y:10
                └─┬ A GROUP id:0 x:6 y:10
                · ├─┬ B GROUP id:1 x:2 y:3
                · │ ├── D LEAF id:2 x:1 y:1
                · │ └── E LEAF id:3 x:1 y:2
                · └─┬ C filler id:row-group-0-A-1-C x:4 y:7
                · · ├── F LEAF id:4 x:2 y:3
                · · └── G LEAF id:5 x:2 y:4
            `);

            if (mode === 'transactions') {
                api.applyTransaction({ remove: [rowData[3]] });
            } else {
                api.setGridOption(
                    'rowData',
                    cachedJSONObjects.array([
                        { id: '0', path: ['A'] },
                        { id: '1', path: ['A', 'B'] },
                        { id: '2', x: 1, y: 1, path: ['A', 'B', 'D'] },
                        { id: '4', x: 2, y: 3, path: ['A', 'C', 'F'] },
                        { id: '5', x: 2, y: 4, path: ['A', 'C', 'G'] },
                    ])
                );
            }

            await new GridRows(api, 'transaction 1', gridRowsOptions).check(`
                ROOT id:ROOT_NODE_ID x:5 y:8
                └─┬ A GROUP id:0 x:5 y:8
                · ├─┬ B GROUP id:1 x:1 y:1
                · │ └── D LEAF id:2 x:1 y:1
                · └─┬ C filler id:row-group-0-A-1-C x:4 y:7
                · · ├── F LEAF id:4 x:2 y:3
                · · └── G LEAF id:5 x:2 y:4
            `);

            if (mode === 'transactions') {
                api.applyTransaction({ update: [{ ...rowData[4], x: 100, y: 100 }] });
            } else {
                api.setGridOption(
                    'rowData',
                    cachedJSONObjects.array([
                        { id: '0', path: ['A'] },
                        { id: '1', path: ['A', 'B'] },
                        { id: '2', x: 1, y: 1, path: ['A', 'B', 'D'] },
                        { id: '4', x: 100, y: 100, path: ['A', 'C', 'F'] },
                        { id: '5', x: 2, y: 4, path: ['A', 'C', 'G'] },
                    ])
                );
            }

            await new GridRows(api, 'transaction 2', gridRowsOptions).check(`
                ROOT id:ROOT_NODE_ID x:103 y:105
                └─┬ A GROUP id:0 x:103 y:105
                · ├─┬ B GROUP id:1 x:1 y:1
                · │ └── D LEAF id:2 x:1 y:1
                · └─┬ C filler id:row-group-0-A-1-C x:102 y:104
                · · ├── F LEAF id:4 x:100 y:100
                · · └── G LEAF id:5 x:2 y:4
            `);

            api.setGridOption('alwaysAggregateAtRootLevel', false);

            await new GridRows(api, 'alwaysAggregateAtRootLevel=false', gridRowsOptions).check(`
                ROOT id:ROOT_NODE_ID
                └─┬ A GROUP id:0 x:103 y:105
                · ├─┬ B GROUP id:1 x:1 y:1
                · │ └── D LEAF id:2 x:1 y:1
                · └─┬ C filler id:row-group-0-A-1-C x:102 y:104
                · · ├── F LEAF id:4 x:100 y:100
                · · └── G LEAF id:5 x:2 y:4
            `);

            api.setGridOption('alwaysAggregateAtRootLevel', true);

            await new GridRows(api, 'alwaysAggregateAtRootLevel=true', gridRowsOptions).check(`
                ROOT id:ROOT_NODE_ID x:103 y:105
                └─┬ A GROUP id:0 x:103 y:105
                · ├─┬ B GROUP id:1 x:1 y:1
                · │ └── D LEAF id:2 x:1 y:1
                · └─┬ C filler id:row-group-0-A-1-C x:102 y:104
                · · ├── F LEAF id:4 x:100 y:100
                · · └── G LEAF id:5 x:2 y:4
            `);
        }
    );
});
