import { setTimeout as asyncSetTimeout } from 'timers/promises';
import type { MockInstance } from 'vitest';

import { ClientSideRowModelModule } from 'ag-grid-community';
import { TreeDataModule } from 'ag-grid-enterprise';

import { GridRows, TestGridsManager, cachedJSONObjects } from '../../test-utils';
import type { GridRowsOptions } from '../../test-utils';

const defaultGridRowsOptions: GridRowsOptions = {
    checkDom: true,
};

describe('ag-grid hierarchical tree data reset', () => {
    const gridsManager = new TestGridsManager({
        modules: [ClientSideRowModelModule, TreeDataModule],
    });

    let consoleWarnSpy: MockInstance;

    beforeEach(() => {
        vitest.useRealTimers();
        cachedJSONObjects.clear();
        gridsManager.reset();
    });

    afterEach(() => {
        gridsManager.reset();
        consoleWarnSpy?.mockRestore();
    });

    // TODO: tree data with children bug: it seems the order is not maintained here, to investigate
    test.skip('tree data with id is created in the right order, and order can be changed also if data references do not change', async () => {
        const rowData = [
            { id: 'A', children: [{ id: 'B' }] },
            { id: 'C', children: [{ id: 'D' }, { id: 'E' }] },
        ];

        const api = gridsManager.createGrid('myGrid', {
            columnDefs: [],
            autoGroupColumnDef: { headerName: 'Organisation Hierarchy' },
            treeData: true,
            treeDataChildrenField: 'children',
            animateRows: false,
            groupDefaultExpanded: -1,
            rowData: rowData,
            getRowId: (params) => params.data.id,
        });

        await new GridRows(api, 'initial', defaultGridRowsOptions).check(`
            ROOT id:ROOT_NODE_ID
            ├─┬ A GROUP id:A
            │ └── B LEAF id:B
            └─┬ C GROUP id:C
            · ├── D LEAF id:D
            · └── E LEAF id:E
        `);

        api.setGridOption('rowData', rowData);

        await new GridRows(api, 'update 1', defaultGridRowsOptions).check(`
            ROOT id:ROOT_NODE_ID
            ├─┬ A GROUP id:A
            │ └── B LEAF id:B
            └─┬ C GROUP id:C
            · ├── D LEAF id:D
            · └── E LEAF id:E
        `);

        rowData.reverse();
        api.setGridOption('rowData', rowData);

        await new GridRows(api, 'update 2', defaultGridRowsOptions).check(`
            ROOT id:ROOT_NODE_ID
            ├─┬ C GROUP id:C
            │ ├── D LEAF id:D
            │ └── E LEAF id:E
            └─┬ A GROUP id:A
            · └── B LEAF id:B
        `);

        rowData[0].children.reverse();
        api.setGridOption('rowData', rowData);

        await new GridRows(api, 'update 3', defaultGridRowsOptions).check(`
            ROOT id:ROOT_NODE_ID
            ├─┬ C GROUP id:C
            │ ├── E LEAF id:E
            │ └── D LEAF id:D
            └─┬ A GROUP id:A
            · └── B LEAF id:B
        `);
    });

    test('tree data async loading', async () => {
        const rowData1 = [{ id: 'A', children: [{ id: 'B' }] }];
        const rowData2 = [{ id: 'C', children: [{ id: 'D' }] }];

        const api = gridsManager.createGrid('myGrid', {
            columnDefs: [],
            autoGroupColumnDef: { headerName: 'Organisation Hierarchy' },
            treeData: true,
            treeDataChildrenField: 'children',
            animateRows: false,
            groupDefaultExpanded: -1,
            getRowId: (params) => params.data.id,
        });

        await asyncSetTimeout(1); // Simulate async loading

        api.setGridOption('rowData', rowData1);

        await new GridRows(api, 'initial', defaultGridRowsOptions).check(`
            ROOT id:ROOT_NODE_ID
            └─┬ A GROUP id:A
            · └── B LEAF id:B
        `);

        await asyncSetTimeout(1); // Simulate async re-loading

        api.setGridOption('rowData', rowData2);

        await new GridRows(api, 'updated', defaultGridRowsOptions).check(`
            ROOT id:ROOT_NODE_ID
            └─┬ C GROUP id:C
            · └── D LEAF id:D
        `);
    });

    test('setting rowData without id keeps the tree data structure correct', async () => {
        const api = gridsManager.createGrid('myGrid', {
            columnDefs: [{ field: 'id' }, { field: 'x' }],
            treeData: true,
            treeDataChildrenField: 'children',
            animateRows: false,
            groupDefaultExpanded: -1,
        });

        const rowData1 = cachedJSONObjects.array([
            { id: 'A', children: [{ id: 'B', x: 0 }] },
            {
                id: 'P',
                children: [
                    { id: 'Q', x: 1 },
                    { id: 'R', x: 2 },
                ],
            },
            { id: 'C', children: [{ id: 'D', x: 3 }] },
            { id: 'X', children: [{ id: 'Y', x: 4 }] },
        ]);

        const rowData2 = cachedJSONObjects.array([
            { id: 'D', children: [{ id: 'E', x: 5, children: [{ id: 'F', x: 4 }] }] },
            {
                id: 'P',
                children: [
                    { id: 'R', x: 7 },
                    { id: 'Q', x: 1 },
                ],
            },
        ]);

        api.setGridOption('rowData', rowData1);

        const gridRowsOptions = {
            ...defaultGridRowsOptions,
            columns: ['id', 'x'],
        };

        await new GridRows(api, 'update 0', gridRowsOptions).check(`
            ROOT id:ROOT_NODE_ID
            ├─┬ 0 GROUP id:0 id:"A" x:undefined
            │ └── 1 LEAF id:1 id:"B" x:0
            ├─┬ 2 GROUP id:2 id:"P" x:undefined
            │ ├── 3 LEAF id:3 id:"Q" x:1
            │ └── 4 LEAF id:4 id:"R" x:2
            ├─┬ 5 GROUP id:5 id:"C" x:undefined
            │ └── 6 LEAF id:6 id:"D" x:3
            └─┬ 7 GROUP id:7 id:"X" x:undefined
            · └── 8 LEAF id:8 id:"Y" x:4
        `);

        api.setGridOption('rowData', rowData2);

        await new GridRows(api, 'update 1', gridRowsOptions).check(`
            ROOT id:ROOT_NODE_ID
            ├─┬ 0 GROUP id:0 id:"D" x:undefined
            │ └─┬ 1 GROUP id:1 id:"E" x:5
            │ · └── 2 LEAF id:2 id:"F" x:4
            └─┬ 3 GROUP id:3 id:"P" x:undefined
            · ├── 4 LEAF id:4 id:"R" x:7
            · └── 5 LEAF id:5 id:"Q" x:1
        `);

        api.setGridOption('rowData', []);

        await new GridRows(api, 'empty', defaultGridRowsOptions).check('empty');

        api.setGridOption('rowData', rowData2);

        await new GridRows(api, 'update 1', gridRowsOptions).check(`
            ROOT id:ROOT_NODE_ID
            ├─┬ 0 GROUP id:0 id:"D" x:undefined
            │ └─┬ 1 GROUP id:1 id:"E" x:5
            │ · └── 2 LEAF id:2 id:"F" x:4
            └─┬ 3 GROUP id:3 id:"P" x:undefined
            · ├── 4 LEAF id:4 id:"R" x:7
            · └── 5 LEAF id:5 id:"Q" x:1
        `);
    });

    test('tree data with id ordering is consistent', async () => {
        const rowData = cachedJSONObjects.array([{ id: 'b' }, { id: 'c', children: [{ id: 'd' }] }, { id: 'e' }]);
        const rowData2 = cachedJSONObjects.array([{ id: 'a' }, ...rowData, { id: 'f', children: [{ id: 'g' }] }]);

        const api = gridsManager.createGrid('myGrid', {
            columnDefs: [],
            autoGroupColumnDef: { headerName: 'Organisation Hierarchy' },
            treeData: true,
            treeDataChildrenField: 'children',
            animateRows: false,
            groupDefaultExpanded: -1,
            rowData: [],
            getRowId: (params) => params.data.id,
        });

        api.setGridOption('rowData', rowData);

        await new GridRows(api, 'update 0', defaultGridRowsOptions).check(`
            ROOT id:ROOT_NODE_ID
            ├── b LEAF id:b
            ├─┬ c GROUP id:c
            │ └── d LEAF id:d
            └── e LEAF id:e
        `);

        api.setGridOption('rowData', rowData2);

        await new GridRows(api, 'update1', defaultGridRowsOptions).check(`
            ROOT id:ROOT_NODE_ID
            ├── a LEAF id:a
            ├── b LEAF id:b
            ├─┬ c GROUP id:c
            │ └── d LEAF id:d
            ├── e LEAF id:e
            └─┬ f GROUP id:f
            · └── g LEAF id:g
        `);
    });

    test('tree data with id order matches', async () => {
        const rowData = [
            { id: 'p', children: [{ id: 'r' }, { id: 'q' }] },
            { id: 'a', children: [{ id: 'c' }, { id: 'b' }] },
            { id: 's', children: [{ id: 't' }] },
        ];

        const api = gridsManager.createGrid('myGrid', {
            columnDefs: [],
            autoGroupColumnDef: { headerName: 'Organisation Hierarchy' },
            treeData: true,
            treeDataChildrenField: 'children',
            animateRows: false,
            groupDefaultExpanded: -1,
            rowData: [],
            getRowId: (params) => params.data.id,
        });

        api.setGridOption('rowData', rowData);

        await new GridRows(api, 'update 0', defaultGridRowsOptions).check(`
            ROOT id:ROOT_NODE_ID
            ├─┬ p GROUP id:p
            │ ├── r LEAF id:r
            │ └── q LEAF id:q
            ├─┬ a GROUP id:a
            │ ├── c LEAF id:c
            │ └── b LEAF id:b
            └─┬ s GROUP id:s
            · └── t LEAF id:t
        `);
    });

    test('tree data with only leafs can be reordered (same references)', async () => {
        const rowData1 = cachedJSONObjects.array([
            { id: '0' },
            { id: '1' },
            { id: '2' },
            { id: '3' },
            { id: '4' },
            { id: '5' },
        ]);

        const rowData2 = cachedJSONObjects.array([
            { id: '1' },
            { id: '5' },
            { id: '2' },
            { id: '4' },
            { id: '0' },
            { id: '3' },
        ]);

        const api = gridsManager.createGrid('myGrid', {
            columnDefs: [],
            autoGroupColumnDef: { headerName: 'x' },
            treeData: true,
            treeDataChildrenField: 'children',
            animateRows: false,
            groupDefaultExpanded: -1,
            rowData: [],
            getRowId: (params) => params.data.id,
        });

        api.setGridOption('rowData', rowData1);

        let gridRows = new GridRows(api, 'update 0', defaultGridRowsOptions);
        await gridRows.check(`
            ROOT id:ROOT_NODE_ID
            ├── 0 LEAF id:0
            ├── 1 LEAF id:1
            ├── 2 LEAF id:2
            ├── 3 LEAF id:3
            ├── 4 LEAF id:4
            └── 5 LEAF id:5
        `);
        expect(gridRows.rootAllLeafChildren.map((n) => n.data)).toEqual(rowData1);

        api.setGridOption('rowData', rowData2);

        gridRows = new GridRows(api, 'update 1', defaultGridRowsOptions);
        await gridRows.check(`
            ROOT id:ROOT_NODE_ID
            ├── 1 LEAF id:1
            ├── 5 LEAF id:5
            ├── 2 LEAF id:2
            ├── 4 LEAF id:4
            ├── 0 LEAF id:0
            └── 3 LEAF id:3
        `);
        expect(gridRows.rootAllLeafChildren.map((n) => n.data)).toEqual(rowData2);
    });

    test('tree data with id can be reordered and updated', async () => {
        const rowData1 = [
            {
                id: 'A',
                label: 'a',
                children: [
                    { id: 'B', label: 'b1' },
                    { id: 'C', label: 'c1' },
                ],
            },
            {
                id: 'P',
                label: 'p1',
                children: [
                    { id: 'Q', label: 'q1' },
                    { id: 'R', label: 'r1' },
                ],
            },
            {
                id: 'S',
                label: 's1',
                children: [{ id: 'T', label: 't1' }],
            },
        ];

        const rowData2 = [
            {
                id: 'A',
                label: 'a',
                children: [
                    { id: 'C', label: 'c2' },
                    { id: 'D', label: 'b2' },
                ],
            },
            {
                id: 'S',
                label: 's2',
                children: [{ id: 't', label: 't2' }],
            },
            {
                id: 'P',
                label: 'p2',
                children: [
                    { id: 'R', label: 'r2' },
                    { id: 'Q', label: 'q2' },
                ],
            },
        ];

        const api = gridsManager.createGrid('myGrid', {
            columnDefs: [{ field: 'label' }],
            autoGroupColumnDef: { headerName: 'Organisation Hierarchy' },
            treeData: true,
            treeDataChildrenField: 'children',
            animateRows: false,
            groupDefaultExpanded: -1,
            rowData: [],
            getRowId: (params) => params.data.id,
        });

        api.setGridOption('rowData', rowData1);

        const gridRowsOptions = { ...defaultGridRowsOptions, columns: ['label'] };

        await new GridRows(api, 'update 0', gridRowsOptions).check(`
            ROOT id:ROOT_NODE_ID
            ├─┬ A GROUP id:A label:"a"
            │ ├── B LEAF id:B label:"b1"
            │ └── C LEAF id:C label:"c1"
            ├─┬ P GROUP id:P label:"p1"
            │ ├── Q LEAF id:Q label:"q1"
            │ └── R LEAF id:R label:"r1"
            └─┬ S GROUP id:S label:"s1"
            · └── T LEAF id:T label:"t1"
        `);

        api.setGridOption('rowData', rowData2);

        await new GridRows(api, 'update 1', gridRowsOptions).check(`
            ROOT id:ROOT_NODE_ID
            ├─┬ A GROUP id:A label:"a"
            │ ├── C LEAF id:C label:"c2"
            │ └── D LEAF id:D label:"b2"
            ├─┬ S GROUP id:S label:"s2"
            │ └── t LEAF id:t label:"t2"
            └─┬ P GROUP id:P label:"p2"
            · ├── R LEAF id:R label:"r2"
            · └── Q LEAF id:Q label:"q2"
        `);
    });

    // TODO: tree data with children bug: selection is not cleared with setImmutableData for deleted nodes yet
    test.skip('tree data setRowData with id maintains selection and expanded state, and follows order', async () => {
        const rowData1 = [
            {
                id: 'g0',
                x: 'A',
                label: 'g-A',
                children: [
                    {
                        id: '1',
                        x: 'B',
                        label: '1-v1',
                        children: [{ id: '8', x: 'C', label: '8-v1' }],
                    },
                ],
            },
            {
                id: 'g1',
                x: 'C',
                label: 'g-C',
                children: [{ id: '3', x: 'D', label: '3-v1' }],
            },
            {
                id: 'g2',
                x: 'P',
                label: 'g-P',
                children: [{ id: '4', x: 'Q', label: '4-v1' }],
            },
            {
                id: 'g3',
                x: 'R',
                label: 'g-R',
                children: [{ id: '5', x: 'S', label: '5-v1' }],
            },
            { id: '6', x: 'M', label: '6-v1' },
            { id: '7', x: 'N', label: '7-v1' },
        ];

        const rowData2 = [
            { id: '7', x: 'N', label: '7-v2' },
            {
                id: 'g0',
                x: 'R',
                label: 'g-R',
                children: [{ id: '5', x: 'S', label: '5-v2' }],
            },
            {
                id: 'g1',
                x: 'X',
                label: 'g-X',
                children: [
                    {
                        id: '2',
                        x: 'Y',
                        label: '2-v2',
                        children: [{ id: '1', x: 'Z', label: '1-v2' }],
                    },
                ],
            },
            {
                id: 'g2',
                x: 'P',
                label: 'g-P',
                children: [{ id: '4', x: 'Q', label: '4-v2' }],
            },
            { id: '6', x: 'M', label: '6-v2' },
        ];

        const rowData3 = [
            { id: '100', x: 'a', label: '100-v3' },
            {
                id: 'g0',
                x: 'C',
                label: 'g-C',
                children: [{ id: '3', x: 'D', label: '3-v3' }],
            },
        ];

        const api = gridsManager.createGrid('myGrid', {
            columnDefs: [{ field: 'label' }, { field: 'x' }],
            autoGroupColumnDef: { headerName: 'path' },
            treeData: true,
            treeDataChildrenField: 'children',
            animateRows: false,
            groupDefaultExpanded: -1,
            rowData: [],
            rowSelection: {
                mode: 'multiRow',
            },
            getRowId: (params) => params.data.id,
        });

        const gridRowsOptions = { ...defaultGridRowsOptions, columns: ['x', 'label'] };

        api.setGridOption('rowData', rowData1);

        // set B collapsed (a leaf)
        api.setRowNodeExpanded(api.getRowNode('1')!, false, undefined, true);

        // set P collapsed (a filler node group, that is going to be moved)
        api.setRowNodeExpanded(api.getRowNode('4')!.parent!, false, undefined, true);

        // set R collapsed (a filler node group, that is not going to be moved)
        api.setRowNodeExpanded(api.getRowNode('5')!.parent!, false, undefined, true);

        // Select all nodes
        api.selectAll();

        await new GridRows(api, 'update 0', gridRowsOptions).check(`
            ROOT id:ROOT_NODE_ID
            ├─┬ g0 GROUP selected id:g0 label:"g-A" x:"A"
            │ └─┬ 1 GROUP selected collapsed id:1 label:"1-v1" x:"B"
            │ · └── 8 LEAF selected hidden id:8 label:"8-v1" x:"C"
            ├─┬ g1 GROUP selected id:g1 label:"g-C" x:"C"
            │ └── 3 LEAF selected id:3 label:"3-v1" x:"D"
            ├─┬ g2 GROUP selected collapsed id:g2 label:"g-P" x:"P"
            │ └── 4 LEAF selected hidden id:4 label:"4-v1" x:"Q"
            ├─┬ g3 GROUP selected collapsed id:g3 label:"g-R" x:"R"
            │ └── 5 LEAF selected hidden id:5 label:"5-v1" x:"S"
            ├── 6 LEAF selected id:6 label:"6-v1" x:"M"
            └── 7 LEAF selected id:7 label:"7-v1" x:"N"
        `);

        api.setGridOption('rowData', rowData2);

        await new GridRows(api, 'update 1', gridRowsOptions).check(`
            ROOT id:ROOT_NODE_ID
            ├── N LEAF selected id:7 label:"7-v2"
            ├─┬ R filler selected collapsed id:row-group-0-R
            │ └── S LEAF selected hidden id:5 label:"5-v2"
            ├─┬ X filler id:row-group-0-X
            │ └─┬ Y GROUP id:2 label:"2-v2"
            │ · └── Z LEAF selected id:1 label:"1-v2"
            ├─┬ P filler selected collapsed id:row-group-0-P
            │ └── Q LEAF selected hidden id:4 label:"4-v2"
            └── M LEAF selected id:6 label:"6-v2"
        `);

        api.setGridOption('rowData', rowData3);

        await new GridRows(api, 'update 2', gridRowsOptions).check(`
            ROOT id:ROOT_NODE_ID
            ├── a LEAF id:100 label:"100-v3"
            └─┬ C filler id:row-group-0-C
            · └── D LEAF id:3 label:"3-v3"
        `);

        api.setGridOption('rowData', []);

        await new GridRows(api, 'cleared', gridRowsOptions).check('empty');
    });
});
