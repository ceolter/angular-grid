import { setTimeout as asyncSetTimeout } from 'timers/promises';
import type { MockInstance } from 'vitest';

import { ClientSideRowModelModule } from 'ag-grid-community';
import { TreeDataModule } from 'ag-grid-enterprise';

import { GridRows, TestGridsManager, cachedJSONObjects } from '../../test-utils';
import type { GridRowsOptions } from '../../test-utils';

const defaultGridRowsOptions: GridRowsOptions = {
    checkDom: true,
};

const getDataPath = (data: any) => data.orgHierarchy;

describe('ag-grid tree data reset', () => {
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

    test('tree data with id is created in the right order, and order can be changed also if data references do not change', async () => {
        const rowData = [
            { id: '1', orgHierarchy: ['A', 'B'] },
            { id: '3', orgHierarchy: ['C', 'D'] },
        ];

        const api = gridsManager.createGrid('myGrid', {
            columnDefs: [],
            autoGroupColumnDef: { headerName: 'Organisation Hierarchy' },
            treeData: true,
            animateRows: false,
            groupDefaultExpanded: -1,
            rowData: rowData,
            getDataPath,
            getRowId: (params) => params.data.id,
        });

        await new GridRows(api, 'initial', defaultGridRowsOptions).check(`
            ROOT id:ROOT_NODE_ID
            ├─┬ A filler id:row-group-0-A
            │ └── B LEAF id:1
            └─┬ C filler id:row-group-0-C
            · └── D LEAF id:3
        `);

        api.setGridOption('rowData', rowData);

        await new GridRows(api, 'update 1', defaultGridRowsOptions).check(`
            ROOT id:ROOT_NODE_ID
            ├─┬ A filler id:row-group-0-A
            │ └── B LEAF id:1
            └─┬ C filler id:row-group-0-C
            · └── D LEAF id:3
        `);

        rowData.reverse();
        api.setGridOption('rowData', rowData);

        await new GridRows(api, 'update 2', defaultGridRowsOptions).check(`
            ROOT id:ROOT_NODE_ID
            ├─┬ C filler id:row-group-0-C
            │ └── D LEAF id:3
            └─┬ A filler id:row-group-0-A
            · └── B LEAF id:1
        `);
    });

    test('tree data async loading', async () => {
        const rowData1 = [{ id: '1', orgHierarchy: ['A', 'B'] }];
        const rowData2 = [{ id: '2', orgHierarchy: ['C', 'D'] }];

        const api = gridsManager.createGrid('myGrid', {
            columnDefs: [],
            autoGroupColumnDef: { headerName: 'Organisation Hierarchy' },
            treeData: true,
            animateRows: false,
            groupDefaultExpanded: -1,
            getDataPath,
            getRowId: (params) => params.data.id,
        });

        await asyncSetTimeout(1); // Simulate async loading

        api.setGridOption('rowData', rowData1);

        await new GridRows(api, 'initial', defaultGridRowsOptions).check(`
            ROOT id:ROOT_NODE_ID
            └─┬ A filler id:row-group-0-A
            · └── B LEAF id:1
        `);

        await asyncSetTimeout(1); // Simulate async re-loading

        api.setGridOption('rowData', rowData2);

        await new GridRows(api, 'updated', defaultGridRowsOptions).check(`
            ROOT id:ROOT_NODE_ID
            └─┬ C filler id:row-group-0-C
            · └── D LEAF id:2
        `);
    });

    test('setting rowData without id keeps the tree data structure correct', async () => {
        const api = gridsManager.createGrid('myGrid', {
            columnDefs: [],
            treeData: true,
            animateRows: false,
            groupDefaultExpanded: -1,
            getDataPath,
        });

        const rowData1 = cachedJSONObjects.array([
            { orgHierarchy: ['A', 'B'], x: 0 },
            { orgHierarchy: ['P', 'Q'], x: 1 },
            { orgHierarchy: ['C', 'D'], x: 2 },
            { orgHierarchy: ['P', 'R'], x: 3 },
            { orgHierarchy: ['X', 'Y'], x: 4 },
        ]);

        const rowData2 = cachedJSONObjects.array([
            { orgHierarchy: ['D', 'E', 'F'], x: 4 },
            { orgHierarchy: ['D', 'E'], x: 5 },
            { orgHierarchy: ['P', 'R'], x: 6 },
            { orgHierarchy: ['P', 'Q'], x: 7 },
        ]);

        api.setGridOption('rowData', rowData1);

        await new GridRows(api, 'update 0', defaultGridRowsOptions).check(`
            ROOT id:ROOT_NODE_ID
            ├─┬ A filler id:row-group-0-A
            │ └── B LEAF id:0
            ├─┬ P filler id:row-group-0-P
            │ ├── Q LEAF id:1
            │ └── R LEAF id:3
            ├─┬ C filler id:row-group-0-C
            │ └── D LEAF id:2
            └─┬ X filler id:row-group-0-X
            · └── Y LEAF id:4
        `);

        api.setGridOption('rowData', rowData2);

        await new GridRows(api, 'update 1', defaultGridRowsOptions).check(`
            ROOT id:ROOT_NODE_ID
            ├─┬ D filler id:row-group-0-D
            │ └─┬ E GROUP id:1
            │ · └── F LEAF id:0
            └─┬ P filler id:row-group-0-P
            · ├── R LEAF id:2
            · └── Q LEAF id:3
        `);

        api.setGridOption('rowData', []);

        await new GridRows(api, 'empty', defaultGridRowsOptions).check('empty');
    });

    test('tree data with id ordering of fillers is consistent', async () => {
        const rowData = cachedJSONObjects.array([
            { id: 'b', orgHierarchy: ['B'] },
            { id: 'd', orgHierarchy: ['C', 'D'] },
            { id: 'e', orgHierarchy: ['E'] },
        ]);

        const rowData2 = cachedJSONObjects.array([
            { id: 'a', orgHierarchy: ['A'] },
            ...rowData,
            { id: 'g', orgHierarchy: ['F', 'G'] },
            { id: 'f', orgHierarchy: ['F'] },
        ]);

        const api = gridsManager.createGrid('myGrid', {
            columnDefs: [],
            autoGroupColumnDef: { headerName: 'Organisation Hierarchy' },
            treeData: true,
            animateRows: false,
            groupDefaultExpanded: -1,
            rowData: [],
            getDataPath,
            getRowId: (params) => params.data.id,
        });

        api.setGridOption('rowData', rowData);

        await new GridRows(api, 'update 0', defaultGridRowsOptions).check(`
            ROOT id:ROOT_NODE_ID
            ├── B LEAF id:b
            ├─┬ C filler id:row-group-0-C
            │ └── D LEAF id:d
            └── E LEAF id:e
        `);

        api.setGridOption('rowData', rowData2);

        await new GridRows(api, 'update1', defaultGridRowsOptions).check(`
            ROOT id:ROOT_NODE_ID
            ├── A LEAF id:a
            ├── B LEAF id:b
            ├─┬ C filler id:row-group-0-C
            │ └── D LEAF id:d
            ├── E LEAF id:e
            └─┬ F GROUP id:f
            · └── G LEAF id:g
        `);
    });

    test('tree data with id order matches', async () => {
        const rowData = [
            { id: 'r', orgHierarchy: ['P', 'R'] },
            { id: 'q', orgHierarchy: ['P', 'Q'] },
            { id: 'c', orgHierarchy: ['A', 'C'] },
            { id: 'p', orgHierarchy: ['P'] },
            { id: 's', orgHierarchy: ['S'] },
            { id: 'b', orgHierarchy: ['A', 'B'] },
            { id: 't', orgHierarchy: ['S', 'T'] },
        ];

        const api = gridsManager.createGrid('myGrid', {
            columnDefs: [],
            autoGroupColumnDef: { headerName: 'Organisation Hierarchy' },
            treeData: true,
            animateRows: false,
            groupDefaultExpanded: -1,
            rowData: [],
            getDataPath,
            getRowId: (params) => params.data.id,
        });

        api.setGridOption('rowData', rowData);

        await new GridRows(api, 'update 0', defaultGridRowsOptions).check(`
            ROOT id:ROOT_NODE_ID
            ├─┬ A filler id:row-group-0-A
            │ ├── C LEAF id:c
            │ └── B LEAF id:b
            ├─┬ P GROUP id:p
            │ ├── R LEAF id:r
            │ └── Q LEAF id:q
            └─┬ S GROUP id:s
            · └── T LEAF id:t
        `);
    });

    test('tree data with only leafs can be reordered (same references)', async () => {
        const rowData1 = cachedJSONObjects.array([
            { id: '0', orgHierarchy: ['0'] },
            { id: '1', orgHierarchy: ['1'] },
            { id: '2', orgHierarchy: ['2'] },
            { id: '3', orgHierarchy: ['3'] },
            { id: '4', orgHierarchy: ['4'] },
            { id: '5', orgHierarchy: ['5'] },
        ]);

        const rowData2 = cachedJSONObjects.array([
            { id: '1', orgHierarchy: ['1'] },
            { id: '5', orgHierarchy: ['5'] },
            { id: '2', orgHierarchy: ['2'] },
            { id: '4', orgHierarchy: ['4'] },
            { id: '0', orgHierarchy: ['0'] },
            { id: '3', orgHierarchy: ['3'] },
        ]);

        const api = gridsManager.createGrid('myGrid', {
            columnDefs: [],
            autoGroupColumnDef: { headerName: 'x' },
            treeData: true,
            animateRows: false,
            groupDefaultExpanded: -1,
            rowData: [],
            getDataPath,
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

    test('tree data with id can be reordered (same references)', async () => {
        const rowData1 = cachedJSONObjects.array([
            { id: '0', orgHierarchy: ['0'] },
            { id: 'd', orgHierarchy: ['A', 'B', 'C', 'D'] },
            { id: 'f', orgHierarchy: ['A', 'B', 'F'] },
            { id: 'g', orgHierarchy: ['G'] },
            { id: 'e', orgHierarchy: ['A', 'B', 'C', 'E'] },
            { id: 'h', orgHierarchy: ['H'] },
        ]);

        const rowData2 = cachedJSONObjects.array([
            { id: '0', orgHierarchy: ['0'] },
            { id: 'f', orgHierarchy: ['A', 'B', 'F'] },
            { id: 'e', orgHierarchy: ['A', 'B', 'C', 'E'] },
            { id: 'g', orgHierarchy: ['G'] },
            { id: 'h', orgHierarchy: ['H'] },
            { id: 'd', orgHierarchy: ['A', 'B', 'C', 'D'] },
        ]);

        const rowData3 = cachedJSONObjects.array([
            { id: '0', orgHierarchy: ['0'] },
            { id: 'g', orgHierarchy: ['G'] },
            { id: 'e', orgHierarchy: ['A', 'B', 'C', 'E'] },
            { id: 'h', orgHierarchy: ['H'] },
            { id: 'f', orgHierarchy: ['A', 'B', 'F'] },
            { id: 'd', orgHierarchy: ['A', 'B', 'C', 'D'] },
        ]);

        const api = gridsManager.createGrid('myGrid', {
            columnDefs: [],
            autoGroupColumnDef: { headerName: 'Organisation Hierarchy' },
            treeData: true,
            animateRows: false,
            groupDefaultExpanded: -1,
            rowData: [],
            getDataPath,
            getRowId: (params) => params.data.id,
        });

        api.setGridOption('rowData', rowData1);
        api.setGridOption('rowData', rowData1);

        let gridRows = new GridRows(api, 'update 1', defaultGridRowsOptions);
        await gridRows.check(`
            ROOT id:ROOT_NODE_ID
            ├── 0 LEAF id:0
            ├─┬ A filler id:row-group-0-A
            │ └─┬ B filler id:row-group-0-A-1-B
            │ · ├─┬ C filler id:row-group-0-A-1-B-2-C
            │ · │ ├── D LEAF id:d
            │ · │ └── E LEAF id:e
            │ · └── F LEAF id:f
            ├── G LEAF id:g
            └── H LEAF id:h
        `);
        expect(gridRows.rootAllLeafChildren.map((row) => row.data)).toEqual(rowData1);

        api.setGridOption('rowData', rowData2);

        gridRows = new GridRows(api, 'update 2', defaultGridRowsOptions);
        await gridRows.check(`
            ROOT id:ROOT_NODE_ID
            ├── 0 LEAF id:0
            ├─┬ A filler id:row-group-0-A
            │ └─┬ B filler id:row-group-0-A-1-B
            │ · ├── F LEAF id:f
            │ · └─┬ C filler id:row-group-0-A-1-B-2-C
            │ · · ├── E LEAF id:e
            │ · · └── D LEAF id:d
            ├── G LEAF id:g
            └── H LEAF id:h
        `);
        expect(gridRows.rootAllLeafChildren.map((row) => row.data)).toEqual(rowData2);

        api.setGridOption('rowData', []);
        api.setGridOption('rowData', rowData3);

        gridRows = new GridRows(api, 'update 3', defaultGridRowsOptions);
        await gridRows.check(`
            ROOT id:ROOT_NODE_ID
            ├── 0 LEAF id:0
            ├── G LEAF id:g
            ├─┬ A filler id:row-group-0-A
            │ └─┬ B filler id:row-group-0-A-1-B
            │ · ├─┬ C filler id:row-group-0-A-1-B-2-C
            │ · │ ├── E LEAF id:e
            │ · │ └── D LEAF id:d
            │ · └── F LEAF id:f
            └── H LEAF id:h
        `);
        expect(gridRows.rootAllLeafChildren.map((row) => row.data)).toEqual(rowData3);
    });

    test('tree data with id can be reordered and updated', async () => {
        const rowData1 = [
            { id: 'b', orgHierarchy: ['A', 'B'], label: 'b1' },
            { id: 'c', orgHierarchy: ['A', 'C'], label: 'c1' },
            { id: 'p', orgHierarchy: ['P'], label: 'p1' },
            { id: 'q', orgHierarchy: ['P', 'Q'], label: 'q1' },
            { id: 'r', orgHierarchy: ['P', 'R'], label: 'r1' },
            { id: 's', orgHierarchy: ['S'], label: 's1' },
            { id: 't', orgHierarchy: ['S', 'T'], label: 't1' },
        ];

        const rowData2 = [
            { id: 'r', orgHierarchy: ['P', 'R'], label: 'r2' },
            { id: 'q', orgHierarchy: ['P', 'Q'], label: 'q2' },
            { id: 'c', orgHierarchy: ['A', 'C'], label: 'c2' },
            { id: 's', orgHierarchy: ['S'], label: 's2' },
            { id: 'p', orgHierarchy: ['P'], label: 'p2' },
            { id: 'b', orgHierarchy: ['A', 'B'], label: 'b2' },
            { id: 't', orgHierarchy: ['S', 'T'], label: 't2' },
        ];

        const api = gridsManager.createGrid('myGrid', {
            columnDefs: [{ field: 'label' }],
            autoGroupColumnDef: { headerName: 'Organisation Hierarchy' },
            treeData: true,
            animateRows: false,
            groupDefaultExpanded: -1,
            rowData: [],
            getDataPath,
            getRowId: (params) => params.data.id,
        });

        api.setGridOption('rowData', rowData1);

        const gridRowsOptions = { ...defaultGridRowsOptions, columns: ['label'] };

        await new GridRows(api, 'update 0', gridRowsOptions).check(`
            ROOT id:ROOT_NODE_ID
            ├─┬ A filler id:row-group-0-A
            │ ├── B LEAF id:b label:"b1"
            │ └── C LEAF id:c label:"c1"
            ├─┬ P GROUP id:p label:"p1"
            │ ├── Q LEAF id:q label:"q1"
            │ └── R LEAF id:r label:"r1"
            └─┬ S GROUP id:s label:"s1"
            · └── T LEAF id:t label:"t1"
        `);

        api.setGridOption('rowData', rowData2);

        await new GridRows(api, 'update 1', gridRowsOptions).check(`
            ROOT id:ROOT_NODE_ID
            ├─┬ A filler id:row-group-0-A
            │ ├── C LEAF id:c label:"c2"
            │ └── B LEAF id:b label:"b2"
            ├─┬ S GROUP id:s label:"s2"
            │ └── T LEAF id:t label:"t2"
            └─┬ P GROUP id:p label:"p2"
            · ├── R LEAF id:r label:"r2"
            · └── Q LEAF id:q label:"q2"
        `);
    });

    test('tree data setRowData with id maintains selection and expanded state, and conservative ordering', async () => {
        const rowData1 = [
            { id: '1', orgHierarchy: ['A', 'B'], label: '1-v1' },
            { id: '3', orgHierarchy: ['C', 'D'], label: '3-v1' },
            { id: '4', orgHierarchy: ['P', 'Q'], label: '4-v1' },
            { id: '5', orgHierarchy: ['R', 'S'], label: '5-v1' },
            { id: '6', orgHierarchy: ['M'], label: '6-v1' },
            { id: '7', orgHierarchy: ['N'], label: '7-v1' },
            { id: '8', orgHierarchy: ['A', 'B', 'C'], label: '8-v1' },
        ];

        const rowData2 = [
            { id: '7', orgHierarchy: ['N'], label: '7-v2' },
            { id: '5', orgHierarchy: ['R', 'S'], label: '5-v2' },
            { id: '1', orgHierarchy: ['X', 'Y', 'Z'], x: 2, label: '1-v2' },
            { id: '2', orgHierarchy: ['X', 'Y'], x: 3, label: '2-v2' },
            { id: '4', orgHierarchy: ['P', 'Q'], label: '4-v2' },
            { id: '6', orgHierarchy: ['M'], label: '6-v2' },
        ];

        const rowData3 = [
            { id: '100', orgHierarchy: ['a'], label: '100-v3' },
            { id: '3', orgHierarchy: ['C', 'D'], label: '3-v3' },
        ];

        const api = gridsManager.createGrid('myGrid', {
            columnDefs: [{ field: 'label' }],
            autoGroupColumnDef: { headerName: 'path' },
            treeData: true,
            animateRows: false,
            groupDefaultExpanded: -1,
            rowData: [],
            rowSelection: {
                mode: 'multiRow',
            },
            getDataPath,
            getRowId: (params) => params.data.id,
        });

        const gridRowsOptions = { ...defaultGridRowsOptions, columns: ['label'] };

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
            ├─┬ A filler selected id:row-group-0-A
            │ └─┬ B GROUP selected collapsed id:1 label:"1-v1"
            │ · └── C LEAF selected hidden id:8 label:"8-v1"
            ├─┬ C filler selected id:row-group-0-C
            │ └── D LEAF selected id:3 label:"3-v1"
            ├─┬ P filler selected collapsed id:row-group-0-P
            │ └── Q LEAF selected hidden id:4 label:"4-v1"
            ├─┬ R filler selected collapsed id:row-group-0-R
            │ └── S LEAF selected hidden id:5 label:"5-v1"
            ├── M LEAF selected id:6 label:"6-v1"
            └── N LEAF selected id:7 label:"7-v1"
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

    test('remove, update path and order, add', async () => {
        const rowData1 = cachedJSONObjects.array([
            { id: '0', orgHierarchy: ['A', 'B'] },
            { id: '1', orgHierarchy: ['A', 'B', 'C'] },
            { id: '2', orgHierarchy: ['A', 'B', 'D'] },
            { id: '3', orgHierarchy: ['A', 'B', 'E'] },
            { id: '4', orgHierarchy: ['A', 'B', 'F'] },
            { id: '5', orgHierarchy: ['A', 'B', 'G'] },
            { id: '6', orgHierarchy: ['C', 'B'] },
            { id: '7', orgHierarchy: ['C', 'B', 'C'] },
            { id: '8', orgHierarchy: ['C', 'B', 'D'] },
            { id: '9', orgHierarchy: ['D'] },
        ]);

        const api = gridsManager.createGrid('myGrid', {
            columnDefs: [],
            treeData: true,
            animateRows: false,
            groupDefaultExpanded: -1,
            rowData: rowData1,
            getDataPath,
            getRowId: (params) => params.data.id,
        });

        await new GridRows(api, 'update 0', defaultGridRowsOptions).check(`
            ROOT id:ROOT_NODE_ID
            ├─┬ A filler id:row-group-0-A
            │ └─┬ B GROUP id:0
            │ · ├── C LEAF id:1
            │ · ├── D LEAF id:2
            │ · ├── E LEAF id:3
            │ · ├── F LEAF id:4
            │ · └── G LEAF id:5
            ├─┬ C filler id:row-group-0-C
            │ └─┬ B GROUP id:6
            │ · ├── C LEAF id:7
            │ · └── D LEAF id:8
            └── D LEAF id:9
        `);

        api.setGridOption(
            'rowData',
            cachedJSONObjects.array([
                { id: '2', orgHierarchy: ['A', 'B', 'X'] },
                { id: '9', orgHierarchy: ['D'] },
                { id: '8', orgHierarchy: ['C', 'B', 'R'] },
                { id: '0', orgHierarchy: ['A', 'B'] },
                { id: '4', orgHierarchy: ['A', 'B', 'F'] },
                { id: '1', orgHierarchy: ['A', 'B', 'Y'] },
                { id: '5', orgHierarchy: ['A', 'B', 'Z'] },
                { id: '11', orgHierarchy: ['A', 'Q'] },
                { id: '7', orgHierarchy: ['C', 'B', 'W'] },
                { id: '6', orgHierarchy: ['C', 'B'] },
                { id: '12', orgHierarchy: ['C', 'U'] },
                { id: '10', orgHierarchy: ['C', 'N'] },
            ])
        );

        await new GridRows(api, 'update 1', defaultGridRowsOptions).check(`
            ROOT id:ROOT_NODE_ID
            ├── D LEAF id:9
            ├─┬ A filler id:row-group-0-A
            │ ├─┬ B GROUP id:0
            │ │ ├── X LEAF id:2
            │ │ ├── F LEAF id:4
            │ │ ├── Y LEAF id:1
            │ │ └── Z LEAF id:5
            │ └── Q LEAF id:11
            └─┬ C filler id:row-group-0-C
            · ├─┬ B GROUP id:6
            · │ ├── R LEAF id:8
            · │ └── W LEAF id:7
            · ├── U LEAF id:12
            · └── N LEAF id:10
        `);
    });
});
