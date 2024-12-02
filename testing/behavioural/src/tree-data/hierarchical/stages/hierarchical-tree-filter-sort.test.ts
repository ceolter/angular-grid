import { ClientSideRowModelModule } from 'ag-grid-community';
import { TreeDataModule } from 'ag-grid-enterprise';

import type { GridRowsOptions } from '../../../test-utils';
import { GridRows, TestGridsManager, cachedJSONObjects } from '../../../test-utils';

describe('ag-grid hierarchical tree filter sort', () => {
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

    test('tree with custom filter', async () => {
        const rowData = [
            {
                id: '1',
                k: 'A',
                name: 'John Von Neumann',
                children: [
                    {
                        id: '2',
                        k: 'B',
                        name: 'Alan Turing',
                        children: [
                            { id: '4', k: 'D', name: 'Donald Knuth' },
                            { id: '5', k: 'E', name: 'Grace Hopper' },
                        ],
                    },
                    { id: '3', k: 'C', name: 'A. Church' },
                ],
            },
        ];

        const api = gridsManager.createGrid('myGrid', {
            columnDefs: [{ field: 'k' }, { field: 'name', filter: 'agTextColumnFilter' }],
            autoGroupColumnDef: { headerName: 'Hierarchy' },
            treeData: true,
            ['treeDataChildrenField' as any]: 'children',
            animateRows: false,
            groupDefaultExpanded: -1,
            rowData,
            getRowId: (params) => params.data.id,
        });

        const gridRowsOptions: GridRowsOptions = {
            printIds: false,
            columns: ['k', 'name'],
            checkDom: true,
        };

        await new GridRows(api, 'initial', gridRowsOptions).check(`
            ROOT
            └─┬ 1 GROUP k:"A" name:"John Von Neumann"
            · ├─┬ 2 GROUP k:"B" name:"Alan Turing"
            · │ ├── 4 LEAF k:"D" name:"Donald Knuth"
            · │ └── 5 LEAF k:"E" name:"Grace Hopper"
            · └── 3 LEAF k:"C" name:"A. Church"
        `);

        api.setFilterModel({ name: { type: 'equals', filter: 'A. Church' } });

        await new GridRows(api, 'filter 1', gridRowsOptions).check(`
            ROOT
            └─┬ 1 GROUP k:"A" name:"John Von Neumann"
            · └── 3 LEAF k:"C" name:"A. Church"
        `);

        api.setGridOption('rowData', [
            {
                id: '1',
                k: 'A',
                name: 'John Von Neumann',
                children: [
                    {
                        id: '2',
                        k: 'B',
                        name: 'Alan Turing',
                        children: [{ id: '5', k: 'E', name: 'A. Church' }],
                    },
                    { id: '3', k: 'C', name: 'A. Church' },
                    { id: '4', k: 'D', name: 'Donald Knuth' },
                ],
            },
        ]);

        await new GridRows(api, 'filter 1 rowData 2', gridRowsOptions).check(`
            ROOT
            └─┬ 1 GROUP k:"A" name:"John Von Neumann"
            · ├─┬ 2 GROUP k:"B" name:"Alan Turing"
            · │ └── 5 LEAF k:"E" name:"A. Church"
            · └── 3 LEAF k:"C" name:"A. Church"
        `);

        api.setFilterModel({ name: { type: 'equals', filter: 'Grace Hopper' } });

        api.setGridOption('rowData', rowData);

        await new GridRows(api, 'filter 2', gridRowsOptions).check(`
            ROOT
            └─┬ 1 GROUP k:"A" name:"John Von Neumann"
            · └─┬ 2 GROUP k:"B" name:"Alan Turing"
            · · └── 5 LEAF k:"E" name:"Grace Hopper"
        `);

        api.setGridOption('rowData', [
            {
                id: '1',
                k: 'A',
                name: 'John Von Neumann',
                children: [
                    {
                        id: '2',
                        k: 'B',
                        name: 'Grace Hopper',
                        children: [
                            { id: '4', k: 'D', name: 'Donald Knuth' },
                            { id: '5', k: 'E', children: [{ id: 'W', k: 'W', name: 'Grace Hopper' }] },
                        ],
                    },
                    {
                        id: '3',
                        k: 'C',
                        name: 'A. Church',
                        children: [{ id: 'J', k: 'J', name: 'A. Church' }],
                    },
                    { id: '6', k: 'K', name: 'unknown' },
                ],
            },
        ]);

        await new GridRows(api, 'filter 2 rowData 2', gridRowsOptions).check(`
            ROOT
            └─┬ 1 GROUP k:"A" name:"John Von Neumann"
            · └─┬ 2 GROUP k:"B" name:"Grace Hopper"
            · · ├── 4 LEAF k:"D" name:"Donald Knuth"
            · · └─┬ 5 GROUP k:"E" name:undefined
            · · · └── W LEAF k:"W" name:"Grace Hopper"
        `);

        api.setFilterModel({ name: { type: 'equals', filter: 'Donald Knuth' } });

        await new GridRows(api, 'filter 3 rowData 2', gridRowsOptions).check(`
            ROOT
            └─┬ 1 GROUP k:"A" name:"John Von Neumann"
            · └─┬ 2 GROUP k:"B" name:"Grace Hopper"
            · · └── 4 LEAF k:"D" name:"Donald Knuth"
        `);

        api.setGridOption('rowData', rowData);

        await new GridRows(api, 'filter 3', gridRowsOptions).check(`
            ROOT
            └─┬ 1 GROUP k:"A" name:"John Von Neumann"
            · └─┬ 2 GROUP k:"B" name:"Alan Turing"
            · · └── 4 LEAF k:"D" name:"Donald Knuth"
        `);

        api.setFilterModel({ name: { type: 'equals', filter: 'Kurt Gödel' } });

        await new GridRows(api, 'filter 4', gridRowsOptions).check(`
            ROOT
        `);

        api.setGridOption('rowData', [
            {
                id: '1',
                k: 'A',
                name: 'Kurt Gödel',
                children: [
                    {
                        id: '2',
                        k: 'B',
                        name: 'Alan Turing',
                        children: [
                            { id: '4', k: 'D', name: 'Donald Knuth' },
                            { id: '5', k: 'E', name: 'Grace Hopper' },
                        ],
                    },
                    { id: '3', k: 'C', name: 'A. Church' },
                ],
            },
        ]);

        await new GridRows(api, 'filter 4 rowData 3', gridRowsOptions).check(`
            ROOT
            └─┬ 1 GROUP k:"A" name:"Kurt Gödel"
            · ├─┬ 2 GROUP k:"B" name:"Alan Turing"
            · │ ├── 4 LEAF k:"D" name:"Donald Knuth"
            · │ └── 5 LEAF k:"E" name:"Grace Hopper"
            · └── 3 LEAF k:"C" name:"A. Church"
        `);

        api.setFilterModel({});

        api.setGridOption('rowData', rowData);

        await new GridRows(api, 'no filter', gridRowsOptions).check(`
            ROOT
            └─┬ 1 GROUP k:"A" name:"John Von Neumann"
            · ├─┬ 2 GROUP k:"B" name:"Alan Turing"
            · │ ├── 4 LEAF k:"D" name:"Donald Knuth"
            · │ └── 5 LEAF k:"E" name:"Grace Hopper"
            · └── 3 LEAF k:"C" name:"A. Church"
        `);
    });

    test('tree with sort', async () => {
        const rowData = cachedJSONObjects.array([
            {
                id: '1',
                k: 'A',
                value: 12,
                x: 1,
                children: [
                    {
                        id: '2',
                        k: 'B',
                        value: 17,
                        x: 1,
                        children: [
                            { id: '4', k: 'D', value: 13, x: 1 },
                            { id: '5', k: 'E', value: 11, x: 0 },
                        ],
                    },
                    { id: '3', k: 'C', value: 15, x: 1 },
                    {
                        id: '6',
                        k: 'F',
                        children: [
                            { id: '8', k: 'G', value: 10, x: 0 },
                            { id: '7', k: 'H', value: 16, x: 1 },
                        ],
                    },
                ],
            },
        ]);

        const api = gridsManager.createGrid('myGrid', {
            columnDefs: [
                { field: 'k' },
                { field: 'value', sortable: true, type: 'numericColumn', filter: 'agNumberColumnFilter' },
                { field: 'x', sortable: true, type: 'numericColumn', filter: 'agNumberColumnFilter' },
            ],
            autoGroupColumnDef: { headerName: 'Hierarchy' },
            treeData: true,
            ['treeDataChildrenField' as any]: 'children',
            animateRows: false,
            groupDefaultExpanded: -1,
            rowData,
            getRowId: (params) => params.data.id,
        });

        const gridRowsOptions: GridRowsOptions = {
            printIds: false,
            columns: ['k', 'value', 'x'],
            checkDom: true,
        };

        await new GridRows(api, 'initial', gridRowsOptions).check(`
            ROOT
            └─┬ 1 GROUP k:"A" value:12 x:1
            · ├─┬ 2 GROUP k:"B" value:17 x:1
            · │ ├── 4 LEAF k:"D" value:13 x:1
            · │ └── 5 LEAF k:"E" value:11 x:0
            · ├── 3 LEAF k:"C" value:15 x:1
            · └─┬ 6 GROUP k:"F" value:undefined x:undefined
            · · ├── 8 LEAF k:"G" value:10 x:0
            · · └── 7 LEAF k:"H" value:16 x:1
        `);

        api.applyColumnState({
            state: [{ colId: 'value', sort: 'asc' }],
        });

        await new GridRows(api, 'sort value asc', gridRowsOptions).check(`
            ROOT
            └─┬ 1 GROUP k:"A" value:12 x:1
            · ├─┬ 6 GROUP k:"F" value:undefined x:undefined
            · │ ├── 8 LEAF k:"G" value:10 x:0
            · │ └── 7 LEAF k:"H" value:16 x:1
            · ├── 3 LEAF k:"C" value:15 x:1
            · └─┬ 2 GROUP k:"B" value:17 x:1
            · · ├── 5 LEAF k:"E" value:11 x:0
            · · └── 4 LEAF k:"D" value:13 x:1
        `);

        api.setGridOption(
            'rowData',
            cachedJSONObjects.array([
                {
                    id: '1',
                    k: 'A',
                    value: 12,
                    x: 1,
                    children: [
                        {
                            id: '6',
                            k: 'F',
                            value: 10,
                            x: 0,
                            children: [
                                { id: '8', k: 'G', value: 10, x: 0 },
                                { id: '7', k: 'H', value: 16, x: 1 },
                            ],
                        },
                        { id: '3', k: 'C', value: 15, x: 1 },
                        {
                            id: '2',
                            k: 'B',
                            value: 17,
                            x: 1,
                            children: [
                                { id: '5', k: 'e', value: 11, x: 0 },
                                { id: '4', k: 'd', value: 13, x: 1 },
                            ],
                        },
                    ],
                },
            ])
        );

        await new GridRows(api, 'sort value asc rowData 2', gridRowsOptions).check(`
            ROOT
            └─┬ 1 GROUP k:"A" value:12 x:1
            · ├─┬ 6 GROUP k:"F" value:10 x:0
            · │ ├── 8 LEAF k:"G" value:10 x:0
            · │ └── 7 LEAF k:"H" value:16 x:1
            · ├── 3 LEAF k:"C" value:15 x:1
            · └─┬ 2 GROUP k:"B" value:17 x:1
            · · ├── 5 LEAF k:"e" value:11 x:0
            · · └── 4 LEAF k:"d" value:13 x:1
        `);

        api.applyColumnState({
            state: [{ colId: 'value', sort: 'desc' }],
        });

        await new GridRows(api, 'sort value desc  rowData 2', gridRowsOptions).check(`
            ROOT
            └─┬ 1 GROUP k:"A" value:12 x:1
            · ├─┬ 2 GROUP k:"B" value:17 x:1
            · │ ├── 4 LEAF k:"d" value:13 x:1
            · │ └── 5 LEAF k:"e" value:11 x:0
            · ├── 3 LEAF k:"C" value:15 x:1
            · └─┬ 6 GROUP k:"F" value:10 x:0
            · · ├── 7 LEAF k:"H" value:16 x:1
            · · └── 8 LEAF k:"G" value:10 x:0
        `);

        api.setGridOption('rowData', rowData);

        await new GridRows(api, 'sort value desc', gridRowsOptions).check(`
            ROOT
            └─┬ 1 GROUP k:"A" value:12 x:1
            · ├─┬ 2 GROUP k:"B" value:17 x:1
            · │ ├── 4 LEAF k:"D" value:13 x:1
            · │ └── 5 LEAF k:"E" value:11 x:0
            · ├── 3 LEAF k:"C" value:15 x:1
            · └─┬ 6 GROUP k:"F" value:undefined x:undefined
            · · ├── 7 LEAF k:"H" value:16 x:1
            · · └── 8 LEAF k:"G" value:10 x:0
        `);

        api.applyColumnState({
            state: [
                { colId: 'value', sort: null },
                { colId: 'x', sort: 'asc' },
            ],
        });

        await new GridRows(api, 'sort x asc', gridRowsOptions).check(`
            ROOT
            └─┬ 1 GROUP k:"A" value:12 x:1
            · ├─┬ 6 GROUP k:"F" value:undefined x:undefined
            · │ ├── 8 LEAF k:"G" value:10 x:0
            · │ └── 7 LEAF k:"H" value:16 x:1
            · ├─┬ 2 GROUP k:"B" value:17 x:1
            · │ ├── 5 LEAF k:"E" value:11 x:0
            · │ └── 4 LEAF k:"D" value:13 x:1
            · └── 3 LEAF k:"C" value:15 x:1
        `);

        api.applyColumnState({
            state: [{ colId: 'x', sort: 'desc' }],
        });

        await new GridRows(api, 'sort x desc', gridRowsOptions).check(`
            ROOT
            └─┬ 1 GROUP k:"A" value:12 x:1
            · ├─┬ 2 GROUP k:"B" value:17 x:1
            · │ ├── 4 LEAF k:"D" value:13 x:1
            · │ └── 5 LEAF k:"E" value:11 x:0
            · ├── 3 LEAF k:"C" value:15 x:1
            · └─┬ 6 GROUP k:"F" value:undefined x:undefined
            · · ├── 7 LEAF k:"H" value:16 x:1
            · · └── 8 LEAF k:"G" value:10 x:0
        `);

        api.setGridOption(
            'rowData',
            cachedJSONObjects.array([
                {
                    id: '1',
                    k: 'A',
                    value: 12,
                    x: 1,
                    children: [
                        {
                            id: '6',
                            k: 'F',
                            children: [
                                { id: '7', k: 'H', value: 16, x: 1 },
                                { id: '8', k: 'G', value: 10, x: 1 },
                            ],
                        },
                        { id: '3', k: 'C', value: 15, x: 0 },
                        {
                            id: '2',
                            k: 'B',
                            value: 17,
                            x: 1,
                            children: [
                                { id: '5', k: 'E', value: 11, x: 1 },
                                { id: '4', k: 'D', value: 13, x: 0 },
                            ],
                        },
                    ],
                },
            ])
        );

        await new GridRows(api, 'sort x desc rowData 3', gridRowsOptions).check(`
            ROOT
            └─┬ 1 GROUP k:"A" value:12 x:1
            · ├─┬ 2 GROUP k:"B" value:17 x:1
            · │ ├── 5 LEAF k:"E" value:11 x:1
            · │ └── 4 LEAF k:"D" value:13 x:0
            · ├── 3 LEAF k:"C" value:15 x:0
            · └─┬ 6 GROUP k:"F" value:undefined x:undefined
            · · ├── 7 LEAF k:"H" value:16 x:1
            · · └── 8 LEAF k:"G" value:10 x:1
        `);

        api.setFilterModel({ x: { type: 'equals', filter: 0 } });

        await new GridRows(api, 'sort x desc, filter x===0, rowData 3', gridRowsOptions).check(`
            ROOT
            └─┬ 1 GROUP k:"A" value:12 x:1
            · ├─┬ 2 GROUP k:"B" value:17 x:1
            · │ └── 4 LEAF k:"D" value:13 x:0
            · └── 3 LEAF k:"C" value:15 x:0
        `);

        api.setGridOption('rowData', rowData);

        await new GridRows(api, 'sort x desc, filter x===0, rowData 3', gridRowsOptions).check(`
            ROOT
            └─┬ 1 GROUP k:"A" value:12 x:1
            · ├─┬ 2 GROUP k:"B" value:17 x:1
            · │ └── 5 LEAF k:"E" value:11 x:0
            · └─┬ 6 GROUP k:"F" value:undefined x:undefined
            · · └── 8 LEAF k:"G" value:10 x:0
        `);

        api.applyColumnState({
            state: [{ colId: 'x', sort: 'asc' }],
        });

        await new GridRows(api, 'sort x desc, filter x===0', gridRowsOptions).check(`
            ROOT
            └─┬ 1 GROUP k:"A" value:12 x:1
            · ├─┬ 6 GROUP k:"F" value:undefined x:undefined
            · │ └── 8 LEAF k:"G" value:10 x:0
            · └─┬ 2 GROUP k:"B" value:17 x:1
            · · └── 5 LEAF k:"E" value:11 x:0
        `);
    });
});
