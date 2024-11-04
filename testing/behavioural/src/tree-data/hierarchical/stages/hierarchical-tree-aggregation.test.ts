import { ClientSideRowModelModule } from 'ag-grid-community';
import { TreeDataModule } from 'ag-grid-enterprise';

import type { GridRowsOptions } from '../../../test-utils';
import { GridRows, TestGridsManager, cachedJSONObjects } from '../../../test-utils';

describe('ag-grid hierarchical tree aggregation', () => {
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
            {
                name: 'John Von Neumann',
                x: 1,
                k: 'A',
                children: [
                    {
                        name: 'Alan Turing',
                        x: 1,
                        k: 'B',
                        children: [
                            { name: 'Donald Knuth', x: 1, k: 'C' },
                            { name: 'Grace Hopper', x: 2, k: 'D' },
                        ],
                    },
                    {
                        name: 'A. Church',
                        x: 1,
                        k: 'E',
                        children: [
                            { name: 'Linus Torvalds', x: 2, k: 'F' },
                            { name: 'Brian Kernighan', x: 2, k: 'G' },
                            {
                                name: 'Kurt Gödel',
                                x: 1,
                                k: 'H',
                                children: [{ name: 'Claude Elwood Shannon', x: 2, k: 'I' }],
                            },
                        ],
                    },
                ],
            },
            { name: 'E. Dijkstra', x: 2, k: 'J' },
        ]);

        const api = gridsManager.createGrid('myGrid', {
            columnDefs: [{ field: 'name' }, { field: 'x', aggFunc: 'sum' }],
            autoGroupColumnDef: { headerName: 'Path' },
            treeData: true,
            treeDataChildrenField: 'children',
            animateRows: false,
            rowSelection: { mode: 'multiRow' },
            groupDefaultExpanded: -1,
            rowData,
            getRowId: (params) => params.data.k,
        });

        const gridRowsOptions: GridRowsOptions = {
            columns: ['name', 'x'],
            checkDom: true,
        };

        await new GridRows(api, 'initial', gridRowsOptions).check(`
            ROOT id:ROOT_NODE_ID
            ├─┬ A GROUP id:A name:"John Von Neumann" x:9
            │ ├─┬ B GROUP id:B name:"Alan Turing" x:3
            │ │ ├── C LEAF id:C name:"Donald Knuth" x:1
            │ │ └── D LEAF id:D name:"Grace Hopper" x:2
            │ └─┬ E GROUP id:E name:"A. Church" x:6
            │ · ├── F LEAF id:F name:"Linus Torvalds" x:2
            │ · ├── G LEAF id:G name:"Brian Kernighan" x:2
            │ · └─┬ H GROUP id:H name:"Kurt Gödel" x:2
            │ · · └── I LEAF id:I name:"Claude Elwood Shannon" x:2
            └── J LEAF id:J name:"E. Dijkstra" x:2
        `);

        api.setGridOption(
            'rowData',
            cachedJSONObjects.array([
                {
                    name: 'John Von Neumann',
                    x: 1,
                    k: 'A',
                    children: [
                        {
                            name: 'Alan Turing',
                            x: 1,
                            k: 'B',
                            children: [
                                { name: 'Grace Hopper', x: 2, k: 'D' },
                                { name: 'Donald Knuth', x: 10, k: 'C' },
                            ],
                        },
                        {
                            name: 'A. Church',
                            x: 1,
                            k: 'E',
                            children: [
                                { name: 'Linus Torvalds', x: 2, k: 'F' },
                                { name: 'Brian Kernighan', x: 2, k: 'G' },
                                {
                                    name: 'Kurt Gödel',
                                    x: 1,
                                    k: 'H',
                                    children: [{ name: 'Claude Elwood Shannon', x: 10, k: 'I' }],
                                },
                            ],
                        },
                    ],
                },
                { name: 'E. Dijkstra', x: 2, k: 'J' },
            ])
        );

        await new GridRows(api, 'update x', gridRowsOptions).check(`
            ROOT id:ROOT_NODE_ID
            ├─┬ A GROUP id:A name:"John Von Neumann" x:26
            │ ├─┬ B GROUP id:B name:"Alan Turing" x:12
            │ │ ├── D LEAF id:D name:"Grace Hopper" x:2
            │ │ └── C LEAF id:C name:"Donald Knuth" x:10
            │ └─┬ E GROUP id:E name:"A. Church" x:14
            │ · ├── F LEAF id:F name:"Linus Torvalds" x:2
            │ · ├── G LEAF id:G name:"Brian Kernighan" x:2
            │ · └─┬ H GROUP id:H name:"Kurt Gödel" x:10
            │ · · └── I LEAF id:I name:"Claude Elwood Shannon" x:10
            └── J LEAF id:J name:"E. Dijkstra" x:2
        `);

        api.setGridOption(
            'rowData',
            cachedJSONObjects.array([
                {
                    name: 'John Von Neumann',
                    x: 1,
                    k: 'A',
                    children: [
                        {
                            name: 'Alan Turing',
                            x: 1,
                            k: 'B',
                            children: [
                                { name: 'Grace Hopper', x: 2, k: 'D' },
                                { name: 'Donald Knuth', x: 10, k: 'C' },
                            ],
                        },
                        {
                            name: 'A. Church',
                            x: 1,
                            k: 'E',
                            children: [
                                { name: 'Linus Torvalds', x: 2, k: 'F' },
                                {
                                    name: 'Kurt Gödel',
                                    x: 1,
                                    k: 'H',
                                    children: [{ name: 'Claude Elwood Shannon', x: 10, k: 'I' }],
                                },
                            ],
                        },
                    ],
                },
                { name: 'E. Dijkstra', x: 2, k: 'J' },
            ])
        );

        await new GridRows(api, 'delete', gridRowsOptions).check(`
            ROOT id:ROOT_NODE_ID
            ├─┬ A GROUP id:A name:"John Von Neumann" x:24
            │ ├─┬ B GROUP id:B name:"Alan Turing" x:12
            │ │ ├── D LEAF id:D name:"Grace Hopper" x:2
            │ │ └── C LEAF id:C name:"Donald Knuth" x:10
            │ └─┬ E GROUP id:E name:"A. Church" x:12
            │ · ├── F LEAF id:F name:"Linus Torvalds" x:2
            │ · └─┬ H GROUP id:H name:"Kurt Gödel" x:10
            │ · · └── I LEAF id:I name:"Claude Elwood Shannon" x:10
            └── J LEAF id:J name:"E. Dijkstra" x:2
        `);

        api.setGridOption(
            'rowData',
            cachedJSONObjects.array([
                {
                    name: 'John Von Neumann',
                    x: 1,
                    k: 'A',
                    children: [
                        {
                            name: 'Alan Turing',
                            x: 1,
                            k: 'B',
                            children: [
                                { name: 'Grace Hopper', x: 2, k: 'D' },
                                { name: 'Donald Knuth', x: 10, k: 'C' },
                                {
                                    name: 'unknown',
                                    x: 0,
                                    k: 'U',
                                    children: [{ name: 'Linus Torvalds', x: 2, k: 'F' }],
                                },
                                { name: 'Claude Elwood Shannon', x: 10, k: 'I' },
                            ],
                        },
                        {
                            name: 'A. Church',
                            x: 1,
                            k: 'E',
                        },
                    ],
                },
                { name: 'E. Dijkstra', x: 2, k: 'J' },
            ])
        );

        await new GridRows(api, 'move', gridRowsOptions).check(`
            ROOT id:ROOT_NODE_ID
            ├─┬ A GROUP id:A name:"John Von Neumann" x:25
            │ ├─┬ B GROUP id:B name:"Alan Turing" x:24
            │ │ ├── D LEAF id:D name:"Grace Hopper" x:2
            │ │ ├── C LEAF id:C name:"Donald Knuth" x:10
            │ │ ├─┬ U GROUP id:U name:"unknown" x:2
            │ │ │ └── F LEAF id:F name:"Linus Torvalds" x:2
            │ │ └── I LEAF id:I name:"Claude Elwood Shannon" x:10
            │ └── E LEAF id:E name:"A. Church" x:1
            └── J LEAF id:J name:"E. Dijkstra" x:2
        `);
    });

    test('tree aggregation, with aggregateOnlyChangedColumns=true and setImmutableRowData', async () => {
        const rowData = cachedJSONObjects.array([
            {
                k: 'A',
                list: [
                    {
                        k: 'B',
                        list: [
                            { x: 1, y: 1, k: 'D' },
                            { x: 1, y: 2, k: 'E' },
                        ],
                    },
                    {
                        k: 'C',
                        list: [
                            { x: 2, y: 3, k: 'F' },
                            { x: 2, y: 4, k: 'G' },
                            {
                                k: 'H',
                                list: [
                                    { x: 2, y: 5, k: 'I' },
                                    { x: 2, y: 6, k: 'J' },
                                    {
                                        k: 'K',
                                        list: [{ x: 2, y: 7, k: 'L' }],
                                    },
                                ],
                            },
                        ],
                    },
                ],
            },
        ]);

        const api = gridsManager.createGrid('myGrid', {
            columnDefs: [
                { field: 'x', aggFunc: 'sum' },
                { field: 'y', aggFunc: 'sum' },
            ],
            autoGroupColumnDef: { headerName: 'Path' },
            aggregateOnlyChangedColumns: true,
            treeData: true,
            treeDataChildrenField: 'list',
            animateRows: false,
            rowSelection: { mode: 'multiRow' },
            groupDefaultExpanded: -1,
            rowData,
            getRowId: (params) => params.data.k,
        });

        const gridRowsOptions: GridRowsOptions = {
            columns: ['x', 'y'],
            checkDom: true,
        };

        await new GridRows(api, 'initial', gridRowsOptions).check(`
            ROOT id:ROOT_NODE_ID
            └─┬ A GROUP id:A x:12 y:28
            · ├─┬ B GROUP id:B x:2 y:3
            · │ ├── D LEAF id:D x:1 y:1
            · │ └── E LEAF id:E x:1 y:2
            · └─┬ C GROUP id:C x:10 y:25
            · · ├── F LEAF id:F x:2 y:3
            · · ├── G LEAF id:G x:2 y:4
            · · └─┬ H GROUP id:H x:6 y:18
            · · · ├── I LEAF id:I x:2 y:5
            · · · ├── J LEAF id:J x:2 y:6
            · · · └─┬ K GROUP id:K x:2 y:7
            · · · · └── L LEAF id:L x:2 y:7
        `);

        api.setGridOption(
            'rowData',
            cachedJSONObjects.array([
                {
                    k: 'A',
                    list: [
                        {
                            k: 'B',
                            list: [{ x: 1, y: 1, k: 'D' }],
                        },
                        {
                            k: 'C',
                            list: [
                                { x: 2, y: 3, k: 'F' },
                                { x: 2, y: 4, k: 'G' },
                                {
                                    k: 'H',
                                    list: [
                                        { x: 2, y: 5, k: 'I' },
                                        { x: 2, y: 6, k: 'J' },
                                    ],
                                },
                            ],
                        },
                    ],
                },
            ])
        );

        await new GridRows(api, 'update 0 (remove)', gridRowsOptions).check(`
            ROOT id:ROOT_NODE_ID
            └─┬ A GROUP id:A x:9 y:19
            · ├─┬ B GROUP id:B x:1 y:1
            · │ └── D LEAF id:D x:1 y:1
            · └─┬ C GROUP id:C x:8 y:18
            · · ├── F LEAF id:F x:2 y:3
            · · ├── G LEAF id:G x:2 y:4
            · · └─┬ H GROUP id:H x:4 y:11
            · · · ├── I LEAF id:I x:2 y:5
            · · · └── J LEAF id:J x:2 y:6
        `);

        api.setGridOption(
            'rowData',
            cachedJSONObjects.array([
                {
                    k: 'A',
                    list: [
                        {
                            k: 'B',
                            list: [
                                { x: 1, y: 1, k: 'D' },
                                { x: 1, y: 2, k: 'E' },
                            ],
                        },
                        {
                            k: 'C',
                            list: [
                                { x: 2, y: 3, k: 'F' },
                                { x: 2, y: 4, k: 'G' },
                                {
                                    k: 'H',
                                    list: [
                                        { x: 100, y: 5, k: 'I' },
                                        { x: 2, y: 1000, k: 'J' },
                                        {
                                            k: 'K',
                                            list: [{ x: 2, y: 7, k: 'L' }],
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                },
            ])
        );

        await new GridRows(api, 'update 1 (re-add, update)', gridRowsOptions).check(`
            ROOT id:ROOT_NODE_ID
            └─┬ A GROUP id:A x:110 y:1022
            · ├─┬ B GROUP id:B x:2 y:3
            · │ ├── D LEAF id:D x:1 y:1
            · │ └── E LEAF id:E x:1 y:2
            · └─┬ C GROUP id:C x:108 y:1019
            · · ├── F LEAF id:F x:2 y:3
            · · ├── G LEAF id:G x:2 y:4
            · · └─┬ H GROUP id:H x:104 y:1012
            · · · ├── I LEAF id:I x:100 y:5
            · · · ├── J LEAF id:J x:2 y:1000
            · · · └─┬ K GROUP id:K x:2 y:7
            · · · · └── L LEAF id:L x:2 y:7
        `);

        api.setGridOption(
            'rowData',
            cachedJSONObjects.array([
                {
                    k: 'A',
                    list: [
                        {
                            k: 'B',
                            list: [
                                { x: 1, y: 1, k: 'D' },
                                { x: 1, y: 2, k: 'E' },
                            ],
                        },
                        {
                            k: 'C',
                            list: [
                                { x: 2, y: 3, k: 'F' },
                                {
                                    k: 'H',
                                    list: [
                                        {
                                            k: 'K',
                                            list: [{ x: 2, y: 7, k: 'L' }],
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                },
                {
                    k: 'X',
                    list: [
                        { x: 2, y: 5, k: 'I' },
                        { x: 2, y: 6, k: 'J' },
                        { x: 2, y: 4, k: 'G' },
                    ],
                },
            ])
        );

        await new GridRows(api, 'transaction 2 (change path)', gridRowsOptions).check(`
            ROOT id:ROOT_NODE_ID
            ├─┬ A GROUP id:A x:6 y:13
            │ ├─┬ B GROUP id:B x:2 y:3
            │ │ ├── D LEAF id:D x:1 y:1
            │ │ └── E LEAF id:E x:1 y:2
            │ └─┬ C GROUP id:C x:4 y:10
            │ · ├── F LEAF id:F x:2 y:3
            │ · └─┬ H GROUP id:H x:2 y:7
            │ · · └─┬ K GROUP id:K x:2 y:7
            │ · · · └── L LEAF id:L x:2 y:7
            └─┬ X GROUP id:X x:6 y:15
            · ├── I LEAF id:I x:2 y:5
            · ├── J LEAF id:J x:2 y:6
            · └── G LEAF id:G x:2 y:4
        `);

        api.setGridOption('columnDefs', [
            { field: 'x', aggFunc: 'sum' },
            { field: 'y', aggFunc: 'avg' },
        ]);

        await new GridRows(api, 'change aggFunc', gridRowsOptions).check(`
            ROOT id:ROOT_NODE_ID
            ├─┬ A GROUP id:A x:6 y:{"count":4,"value":3.25}
            │ ├─┬ B GROUP id:B x:2 y:{"count":2,"value":1.5}
            │ │ ├── D LEAF id:D x:1 y:1
            │ │ └── E LEAF id:E x:1 y:2
            │ └─┬ C GROUP id:C x:4 y:{"count":2,"value":5}
            │ · ├── F LEAF id:F x:2 y:3
            │ · └─┬ H GROUP id:H x:2 y:{"count":1,"value":7}
            │ · · └─┬ K GROUP id:K x:2 y:{"count":1,"value":7}
            │ · · · └── L LEAF id:L x:2 y:7
            └─┬ X GROUP id:X x:6 y:{"count":3,"value":5}
            · ├── I LEAF id:I x:2 y:5
            · ├── J LEAF id:J x:2 y:6
            · └── G LEAF id:G x:2 y:4
        `);

        api.setGridOption(
            'rowData',
            cachedJSONObjects.array([
                {
                    k: 'A',
                    list: [
                        {
                            k: 'B',
                            x: 2,
                            list: [{ x: 100, y: 100, k: 'D' }],
                        },
                        {
                            k: 'C',
                            list: [{ x: 2, y: 3, k: 'F' }],
                        },
                    ],
                },
                {
                    k: 'X',
                    list: [
                        { x: 100, y: 100, k: 'I' },
                        { x: 2, y: 6, k: 'J' },
                        {
                            k: 'W',
                            list: [{ x: 200, y: 200, k: 'G' }],
                        },
                    ],
                },
            ])
        );

        await new GridRows(api, 'transaction 4 (update and change path)', gridRowsOptions).check(`
            ROOT id:ROOT_NODE_ID
            ├─┬ A GROUP id:A x:102 y:{"count":2,"value":51.5}
            │ ├─┬ B GROUP id:B x:100 y:{"count":1,"value":100}
            │ │ └── D LEAF id:D x:100 y:100
            │ └─┬ C GROUP id:C x:2 y:{"count":1,"value":3}
            │ · └── F LEAF id:F x:2 y:3
            └─┬ X GROUP id:X x:302 y:{"count":3,"value":102}
            · ├── I LEAF id:I x:100 y:100
            · ├── J LEAF id:J x:2 y:6
            · └─┬ W GROUP id:W x:200 y:{"count":1,"value":200}
            · · └── G LEAF id:G x:200 y:200
        `);
    });

    test('tree aggregation with alwaysAggregateAtRootLevel=true', async () => {
        const rowData = cachedJSONObjects.array([
            {
                k: 'A',
                list: [
                    {
                        k: 'B',
                        list: [
                            { k: 'D', x: 1, y: 1 },
                            { k: 'E', x: 1, y: 2 },
                        ],
                    },
                    {
                        k: 'C',
                        list: [
                            { k: 'F', x: 2, y: 3 },
                            { k: 'G', x: 2, y: 4 },
                        ],
                    },
                ],
            },
        ]);

        const api = gridsManager.createGrid('myGrid', {
            columnDefs: [
                { field: 'x', aggFunc: 'sum' },
                { field: 'y', aggFunc: 'sum' },
            ],
            autoGroupColumnDef: { headerName: 'Path' },
            alwaysAggregateAtRootLevel: true,
            treeData: true,
            treeDataChildrenField: 'list',
            animateRows: false,
            rowSelection: { mode: 'multiRow' },
            groupDefaultExpanded: -1,
            rowData,
            getRowId: (params) => params.data.k,
        });

        const gridRowsOptions: GridRowsOptions = {
            columns: ['x', 'y'],
            checkDom: true,
        };

        await new GridRows(api, 'initial', gridRowsOptions).check(`
            ROOT id:ROOT_NODE_ID x:6 y:10
            └─┬ A GROUP id:A x:6 y:10
            · ├─┬ B GROUP id:B x:2 y:3
            · │ ├── D LEAF id:D x:1 y:1
            · │ └── E LEAF id:E x:1 y:2
            · └─┬ C GROUP id:C x:4 y:7
            · · ├── F LEAF id:F x:2 y:3
            · · └── G LEAF id:G x:2 y:4
        `);

        api.setGridOption(
            'rowData',
            cachedJSONObjects.array([
                {
                    k: 'A',
                    list: [
                        {
                            k: 'B',
                            list: [{ k: 'D', x: 1, y: 1 }],
                        },
                        {
                            k: 'C',
                            list: [
                                { k: 'F', x: 2, y: 3 },
                                { k: 'G', x: 2, y: 4 },
                            ],
                        },
                    ],
                },
            ])
        );

        await new GridRows(api, 'remove', gridRowsOptions).check(`
            ROOT id:ROOT_NODE_ID x:5 y:8
            └─┬ A GROUP id:A x:5 y:8
            · ├─┬ B GROUP id:B x:1 y:1
            · │ └── D LEAF id:D x:1 y:1
            · └─┬ C GROUP id:C x:4 y:7
            · · ├── F LEAF id:F x:2 y:3
            · · └── G LEAF id:G x:2 y:4
        `);

        api.setGridOption(
            'rowData',
            cachedJSONObjects.array([
                {
                    k: 'A',
                    list: [
                        {
                            k: 'B',
                            list: [{ k: 'D', x: 1, y: 1 }],
                        },
                        {
                            k: 'C',
                            list: [
                                { k: 'F', x: 100, y: 100 },
                                { k: 'G', x: 2, y: 4 },
                            ],
                        },
                    ],
                },
            ])
        );

        await new GridRows(api, 'update', gridRowsOptions).check(`
            ROOT id:ROOT_NODE_ID x:103 y:105
            └─┬ A GROUP id:A x:103 y:105
            · ├─┬ B GROUP id:B x:1 y:1
            · │ └── D LEAF id:D x:1 y:1
            · └─┬ C GROUP id:C x:102 y:104
            · · ├── F LEAF id:F x:100 y:100
            · · └── G LEAF id:G x:2 y:4
        `);

        api.setGridOption('alwaysAggregateAtRootLevel', false);

        await new GridRows(api, 'alwaysAggregateAtRootLevel=false', gridRowsOptions).check(`
            ROOT id:ROOT_NODE_ID
            └─┬ A GROUP id:A x:103 y:105
            · ├─┬ B GROUP id:B x:1 y:1
            · │ └── D LEAF id:D x:1 y:1
            · └─┬ C GROUP id:C x:102 y:104
            · · ├── F LEAF id:F x:100 y:100
            · · └── G LEAF id:G x:2 y:4
        `);

        api.setGridOption('alwaysAggregateAtRootLevel', true);

        await new GridRows(api, 'alwaysAggregateAtRootLevel=true', gridRowsOptions).check(`
            ROOT id:ROOT_NODE_ID x:103 y:105
            └─┬ A GROUP id:A x:103 y:105
            · ├─┬ B GROUP id:B x:1 y:1
            · │ └── D LEAF id:D x:1 y:1
            · └─┬ C GROUP id:C x:102 y:104
            · · ├── F LEAF id:F x:100 y:100
            · · └── G LEAF id:G x:2 y:4
        `);
    });
});
