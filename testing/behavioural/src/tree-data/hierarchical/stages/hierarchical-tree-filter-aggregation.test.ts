import { ClientSideRowModelModule } from 'ag-grid-community';
import { TreeDataModule } from 'ag-grid-enterprise';

import type { GridRowsOptions } from '../../../test-utils';
import { GridRows, TestGridsManager, cachedJSONObjects } from '../../../test-utils';

describe('ag-grid hierarchical tree aggregation and filter', () => {
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

    test('aggregation and filter immutable', async () => {
        const rowData = cachedJSONObjects.array([
            {
                id: '0',
                y: 1,
                n: 'A',
                children: [
                    {
                        id: '1',
                        y: 2,
                        n: 'B',
                        children: [
                            { id: '3', x: 14, y: 4, n: 'D' },
                            { id: '4', x: 15, y: 5, n: 'E' },
                        ],
                    },
                ],
            },
            {
                id: '2',
                x: 13,
                y: 3,
                n: 'C',
                children: [
                    { id: '5', x: 16, y: 1, n: 'F' },
                    { id: '6', x: 17, y: 2, n: 'G' },
                    {
                        id: 'h',
                        n: 'H',
                        y: 0,
                        children: [{ id: '7', x: 18, y: 3, n: 'I' }],
                    },
                ],
            },
            {
                id: '8',
                n: 'J',
                y: 4,
                children: [{ id: '9', x: 20, y: 5, n: 'K' }],
            },
        ]);

        const api = gridsManager.createGrid('myGrid', {
            columnDefs: [
                { field: 'n' },
                { field: 'x', aggFunc: 'sum', filter: 'agNumberColumnFilter' },
                { field: 'y', filter: 'agNumberColumnFilter' },
            ],
            autoGroupColumnDef: { headerName: 'Path' },
            treeData: true,
            treeDataChildrenField: 'children',
            animateRows: false,
            rowSelection: { mode: 'multiRow' },
            grandTotalRow: 'top',
            alwaysAggregateAtRootLevel: true,
            groupDefaultExpanded: -1,
            rowData,
            getRowId: (params) => params.data.id,
            groupSuppressBlankHeader: true,
        });

        const gridRowsOptions: GridRowsOptions = {
            columns: ['n', 'x', 'y'],
            checkDom: true,
        };

        await new GridRows(api, 'initial', gridRowsOptions).check(`
            ROOT id:ROOT_NODE_ID x:100
            ├─ footer id:rowGroupFooter_ROOT_NODE_ID x:100
            ├─┬ 0 GROUP id:0 n:"A" x:29 y:1
            │ └─┬ 1 GROUP id:1 n:"B" x:29 y:2
            │ · ├── 3 LEAF id:3 n:"D" x:14 y:4
            │ · └── 4 LEAF id:4 n:"E" x:15 y:5
            ├─┬ 2 GROUP id:2 n:"C" x:51 y:3
            │ ├── 5 LEAF id:5 n:"F" x:16 y:1
            │ ├── 6 LEAF id:6 n:"G" x:17 y:2
            │ └─┬ h GROUP id:h n:"H" x:18 y:0
            │ · └── 7 LEAF id:7 n:"I" x:18 y:3
            └─┬ 8 GROUP id:8 n:"J" x:20 y:4
            · └── 9 LEAF id:9 n:"K" x:20 y:5
        `);

        api.setFilterModel({
            y: { filterType: 'number', type: 'greaterThan', filter: 4 },
        });

        await new GridRows(api, 'filter greater than', gridRowsOptions).check(`
            ROOT id:ROOT_NODE_ID x:35
            ├─ footer id:rowGroupFooter_ROOT_NODE_ID x:35
            ├─┬ 0 GROUP id:0 n:"A" x:15 y:1
            │ └─┬ 1 GROUP id:1 n:"B" x:15 y:2
            │ · └── 4 LEAF id:4 n:"E" x:15 y:5
            └─┬ 8 GROUP id:8 n:"J" x:20 y:4
            · └── 9 LEAF id:9 n:"K" x:20 y:5
        `);

        api.setGridOption(
            'rowData',
            cachedJSONObjects.array([
                {
                    id: '0',
                    y: 1,
                    n: 'A',
                    children: [
                        {
                            id: '1',
                            y: 2,
                            n: 'B',
                            children: [
                                { id: '3', x: 14, y: 200, n: 'D' },
                                { id: '4', x: 15, y: 5, n: 'E' },
                            ],
                        },
                    ],
                },
                {
                    id: '2',
                    x: 13,
                    y: 3,
                    n: 'C',
                    children: [
                        { id: '5', x: 16, y: 1, n: 'F' },
                        { id: '6', x: 17, y: 2, n: 'G' },
                        {
                            id: 'h',
                            n: 'H',
                            y: 0,
                            children: [{ id: '7', x: 18, y: 3, n: 'I' }],
                        },
                    ],
                },
                {
                    id: '8',
                    n: 'J',
                    y: 4,
                    children: [{ id: '9', x: 20, y: 5, n: 'K' }],
                },
            ])
        );

        await new GridRows(api, 'filter greater than - update 1', gridRowsOptions).check(`
            ROOT id:ROOT_NODE_ID x:49
            ├─ footer id:rowGroupFooter_ROOT_NODE_ID x:49
            ├─┬ 0 GROUP id:0 n:"A" x:29 y:1
            │ └─┬ 1 GROUP id:1 n:"B" x:29 y:2
            │ · ├── 3 LEAF id:3 n:"D" x:14 y:200
            │ · └── 4 LEAF id:4 n:"E" x:15 y:5
            └─┬ 8 GROUP id:8 n:"J" x:20 y:4
            · └── 9 LEAF id:9 n:"K" x:20 y:5
        `);

        api.setGridOption(
            'rowData',
            cachedJSONObjects.array([
                {
                    id: '0',
                    y: 1,
                    n: 'A',
                    children: [
                        {
                            id: '1',
                            y: 2,
                            n: 'B',
                            children: [
                                { id: '3', x: 14, y: 200, n: 'D' },
                                { id: '4', x: 15, y: 5, n: 'E' },
                            ],
                        },
                    ],
                },
                {
                    id: '2',
                    x: 13,
                    y: 3,
                    n: 'C',
                    children: [
                        { id: '5', x: 16, y: 1, n: 'F' },
                        { id: '6', x: 17, y: 2, n: 'G' },
                        {
                            id: 'h',
                            n: 'H',
                            y: 0,
                            children: [{ id: '7', x: 18, y: 3, n: 'I' }],
                        },
                    ],
                },
                {
                    id: '8',
                    n: 'J',
                    y: 4,
                    children: [{ id: '9', x: 20, y: 0, n: 'K' }],
                },
            ])
        );

        await new GridRows(api, 'filter greater than - update 2', gridRowsOptions).check(`
            ROOT id:ROOT_NODE_ID x:29
            ├─ footer id:rowGroupFooter_ROOT_NODE_ID x:29
            └─┬ 0 GROUP id:0 n:"A" x:29 y:1
            · └─┬ 1 GROUP id:1 n:"B" x:29 y:2
            · · ├── 3 LEAF id:3 n:"D" x:14 y:200
            · · └── 4 LEAF id:4 n:"E" x:15 y:5
        `);

        api.setGridOption(
            'rowData',
            cachedJSONObjects.array([
                {
                    id: '0',
                    y: 1,
                    n: 'A',
                    children: [
                        {
                            id: '1',
                            y: 2,
                            n: 'B',
                            children: [{ id: '4', x: 15, y: 5, n: 'E' }],
                        },
                    ],
                },
                {
                    id: '2',
                    x: 13,
                    y: 3,
                    n: 'C',
                    children: [
                        { id: '5', x: 16, y: 1, n: 'F' },
                        { id: '6', x: 17, y: 2, n: 'G' },
                        {
                            id: 'h',
                            n: 'H',
                            y: 0,
                            children: [{ id: '7', x: 18, y: 3, n: 'I' }],
                        },
                    ],
                },
                {
                    id: '8',
                    n: 'J',
                    y: 4,
                    children: [{ id: '9', x: 20, y: 0, n: 'K' }],
                },
            ])
        );

        await new GridRows(api, 'filter greater than - remove', gridRowsOptions).check(`
            ROOT id:ROOT_NODE_ID x:15
            ├─ footer id:rowGroupFooter_ROOT_NODE_ID x:15
            └─┬ 0 GROUP id:0 n:"A" x:15 y:1
            · └─┬ 1 GROUP id:1 n:"B" x:15 y:2
            · · └── 4 LEAF id:4 n:"E" x:15 y:5
        `);

        api.setFilterModel({
            y: { filterType: 'number', type: 'lessThan', filter: 2 },
        });

        await new GridRows(api, 'filter less than', gridRowsOptions).check(`
            ROOT id:ROOT_NODE_ID x:69
            ├─ footer id:rowGroupFooter_ROOT_NODE_ID x:69
            ├─┬ 0 GROUP id:0 n:"A" x:15 y:1
            │ └─┬ 1 GROUP id:1 n:"B" x:15 y:2
            │ · └── 4 LEAF id:4 n:"E" x:15 y:5
            ├─┬ 2 GROUP id:2 n:"C" x:34 y:3
            │ ├── 5 LEAF id:5 n:"F" x:16 y:1
            │ └─┬ h GROUP id:h n:"H" x:18 y:0
            │ · └── 7 LEAF id:7 n:"I" x:18 y:3
            └─┬ 8 GROUP id:8 n:"J" x:20 y:4
            · └── 9 LEAF id:9 n:"K" x:20 y:0
        `);

        api.setGridOption('excludeChildrenWhenTreeDataFiltering', true);

        await new GridRows(api, 'excludeChildrenWhenTreeDataFiltering=true', gridRowsOptions).check(`
            ROOT id:ROOT_NODE_ID x:36
            ├─ footer id:rowGroupFooter_ROOT_NODE_ID x:36
            ├── 0 GROUP id:0 n:"A" x:null y:1
            ├─┬ 2 GROUP id:2 n:"C" x:16 y:3
            │ ├── 5 LEAF id:5 n:"F" x:16 y:1
            │ └── h GROUP id:h n:"H" x:null y:0
            └─┬ 8 GROUP id:8 n:"J" x:20 y:4
            · └── 9 LEAF id:9 n:"K" x:20 y:0
        `);

        api.setGridOption('suppressAggFilteredOnly', true);

        await new GridRows(api, 'suppressAggFilteredOnly=true', gridRowsOptions).check(`
            ROOT id:ROOT_NODE_ID x:86
            ├─ footer id:rowGroupFooter_ROOT_NODE_ID x:86
            ├── 0 GROUP id:0 n:"A" x:15 y:1
            ├─┬ 2 GROUP id:2 n:"C" x:51 y:3
            │ ├── 5 LEAF id:5 n:"F" x:16 y:1
            │ └── h GROUP id:h n:"H" x:18 y:0
            └─┬ 8 GROUP id:8 n:"J" x:20 y:4
            · └── 9 LEAF id:9 n:"K" x:20 y:0
        `);

        api.setGridOption('suppressAggFilteredOnly', false);
        api.setGridOption('grandTotalRow', 'bottom');

        await new GridRows(api, 'suppressAggFilteredOnly=false grandTotalRow=bottom', gridRowsOptions).check(`
            ROOT id:ROOT_NODE_ID x:36
            ├── 0 GROUP id:0 n:"A" x:null y:1
            ├─┬ 2 GROUP id:2 n:"C" x:16 y:3
            │ ├── 5 LEAF id:5 n:"F" x:16 y:1
            │ └── h GROUP id:h n:"H" x:null y:0
            ├─┬ 8 GROUP id:8 n:"J" x:20 y:4
            │ └── 9 LEAF id:9 n:"K" x:20 y:0
            └─ footer id:rowGroupFooter_ROOT_NODE_ID x:36
        `);

        api.setGridOption('groupTotalRow', 'bottom');

        await new GridRows(api, 'groupTotalRow=top', gridRowsOptions).check(`
            ROOT id:ROOT_NODE_ID x:36
            ├─┬ 0 GROUP id:0 n:"A" x:null y:1
            │ └─ footer id:rowGroupFooter_0 n:"A" x:null y:1
            ├─┬ 2 GROUP id:2 n:"C" x:16 y:3
            │ ├── 5 LEAF id:5 n:"F" x:16 y:1
            │ ├─┬ h GROUP id:h n:"H" x:null y:0
            │ │ └─ footer id:rowGroupFooter_h n:"H" x:null y:0
            │ └─ footer id:rowGroupFooter_2 n:"C" x:16 y:3
            ├─┬ 8 GROUP id:8 n:"J" x:20 y:4
            │ ├── 9 LEAF id:9 n:"K" x:20 y:0
            │ └─ footer id:rowGroupFooter_8 n:"J" x:20 y:4
            └─ footer id:rowGroupFooter_ROOT_NODE_ID x:36
        `);
    });
});
