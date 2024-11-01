import type { MockInstance } from 'vitest';

import type { GridOptions } from 'ag-grid-community';
import { ClientSideRowModelModule } from 'ag-grid-community';
import { TreeDataModule } from 'ag-grid-enterprise';

import type { GridRowsOptions } from '../test-utils';
import { GridRows, TestGridsManager, cachedJSONObjects } from '../test-utils';

describe('ag-grid hierarchical immutable tree data', () => {
    const gridsManager = new TestGridsManager({
        modules: [ClientSideRowModelModule, TreeDataModule],
    });

    let consoleWarnSpy: MockInstance;

    beforeEach(() => {
        gridsManager.reset();
    });

    afterEach(() => {
        gridsManager.reset();
        consoleWarnSpy?.mockRestore();
    });

    test('ag-grid hierarchical immutable tree data', async () => {
        const rowData1 = cachedJSONObjects.array([
            {
                id: 'A',
                v: 1,
                children: [{ id: 'B', v: 2, children: [] }],
            },
            {
                id: 'C',
                v: 3,
                children: [{ id: 'D', v: 4 }],
            },

            {
                id: 'E',
                v: 5,
                children: [
                    {
                        id: 'F',
                        v: 6,
                        children: [
                            { id: 'G', v: 7 },
                            { id: 'H', v: 8 },
                            { id: 'I', v: 9 },
                        ],
                    },
                    { id: 'J', v: 10, children: [{ id: 'K', v: 11 }] },
                ],
            },
        ]);

        const gridOptions: GridOptions = {
            columnDefs: [{ field: 'v' }],
            treeData: true,
            treeDataChildrenField: 'children',
            animateRows: false,
            groupDefaultExpanded: -1,
            rowData: rowData1,
            getRowId: ({ data }) => data.id,
        };

        const api = gridsManager.createGrid('myGrid', gridOptions);

        const gridRowsOptions: GridRowsOptions = {
            checkDom: true,
            columns: true,
        };

        let gridRows = new GridRows(api, 'data', gridRowsOptions);

        await gridRows.check(`
            ROOT id:ROOT_NODE_ID
            ├─┬ A GROUP id:A ag-Grid-AutoColumn:"A" v:1
            │ └── B LEAF id:B ag-Grid-AutoColumn:"B" v:2
            ├─┬ C GROUP id:C ag-Grid-AutoColumn:"C" v:3
            │ └── D LEAF id:D ag-Grid-AutoColumn:"D" v:4
            └─┬ E GROUP id:E ag-Grid-AutoColumn:"E" v:5
            · ├─┬ F GROUP id:F ag-Grid-AutoColumn:"F" v:6
            · │ ├── G LEAF id:G ag-Grid-AutoColumn:"G" v:7
            · │ ├── H LEAF id:H ag-Grid-AutoColumn:"H" v:8
            · │ └── I LEAF id:I ag-Grid-AutoColumn:"I" v:9
            · └─┬ J GROUP id:J ag-Grid-AutoColumn:"J" v:10
            · · └── K LEAF id:K ag-Grid-AutoColumn:"K" v:11
        `);

        // update some values

        const rowData2 = cachedJSONObjects.array([
            {
                id: 'A',
                v: 1,
                children: [{ id: 'B', v: 20, children: [] }],
            },
            {
                id: 'C',
                v: 3,
                children: [{ id: 'D', v: 4 }],
            },

            {
                id: 'E',
                v: 5,
                children: [
                    {
                        id: 'F',
                        v: 6,
                        children: [
                            { id: 'G', v: 7 },
                            { id: 'H', v: 80 },
                            { id: 'I', v: 9 },
                        ],
                    },
                    { id: 'J', v: 10, children: [{ id: 'K', v: 110 }] },
                ],
            },
        ]);

        const rows1 = gridRows.displayedRows;

        api.setGridOption('rowData', rowData2);

        gridRows = new GridRows(api, 'update some values', gridRowsOptions);
        await gridRows.check(`
            ROOT id:ROOT_NODE_ID
            ├─┬ A GROUP id:A ag-Grid-AutoColumn:"A" v:1
            │ └── B LEAF id:B ag-Grid-AutoColumn:"B" v:20
            ├─┬ C GROUP id:C ag-Grid-AutoColumn:"C" v:3
            │ └── D LEAF id:D ag-Grid-AutoColumn:"D" v:4
            └─┬ E GROUP id:E ag-Grid-AutoColumn:"E" v:5
            · ├─┬ F GROUP id:F ag-Grid-AutoColumn:"F" v:6
            · │ ├── G LEAF id:G ag-Grid-AutoColumn:"G" v:7
            · │ ├── H LEAF id:H ag-Grid-AutoColumn:"H" v:80
            · │ └── I LEAF id:I ag-Grid-AutoColumn:"I" v:9
            · └─┬ J GROUP id:J ag-Grid-AutoColumn:"J" v:10
            · · └── K LEAF id:K ag-Grid-AutoColumn:"K" v:110
        `);

        const rows2 = gridRows.displayedRows;

        // Rows should be the same instances
        for (let i = 0; i < rows1.length; i++) {
            expect(rows1[i] === rows2[i]).toBe(true);
        }

        // add, remove, update nodes

        const rowData3 = cachedJSONObjects.array([
            {
                id: 'A',
                v: 1000,
                children: [{ id: 'B', v: 20, children: [] }],
            },
            {
                id: 'C',
                v: 3,
                children: [{ id: 'D', v: 4 }],
            },

            {
                id: 'E',
                v: 5,
                children: [
                    {
                        id: 'F',
                        v: 6,
                        children: [
                            { id: 'G', v: 7 },
                            { id: 'I', v: 9 },
                        ],
                    },
                    {
                        id: 'J',
                        v: 10,
                        children: [
                            { id: 'K', v: 110 },
                            { id: 'L', v: 666 },
                            { id: 'M', v: 777, children: [{ id: 'N', v: 888 }] },
                        ],
                    },
                ],
            },
        ]);

        api.setGridOption('rowData', rowData3);

        gridRows = new GridRows(api, 'add, update nodes', gridRowsOptions);
        await gridRows.check(`
            ROOT id:ROOT_NODE_ID
            ├─┬ A GROUP id:A ag-Grid-AutoColumn:"A" v:1000
            │ └── B LEAF id:B ag-Grid-AutoColumn:"B" v:20
            ├─┬ C GROUP id:C ag-Grid-AutoColumn:"C" v:3
            │ └── D LEAF id:D ag-Grid-AutoColumn:"D" v:4
            └─┬ E GROUP id:E ag-Grid-AutoColumn:"E" v:5
            · ├─┬ F GROUP id:F ag-Grid-AutoColumn:"F" v:6
            · │ ├── G LEAF id:G ag-Grid-AutoColumn:"G" v:7
            · │ └── I LEAF id:I ag-Grid-AutoColumn:"I" v:9
            · └─┬ J GROUP id:J ag-Grid-AutoColumn:"J" v:10
            · · ├── K LEAF id:K ag-Grid-AutoColumn:"K" v:110
            · · ├── L LEAF id:L ag-Grid-AutoColumn:"L" v:666
            · · └─┬ M GROUP id:M ag-Grid-AutoColumn:"M" v:777
            · · · └── N LEAF id:N ag-Grid-AutoColumn:"N" v:888
        `);

        const rows3 = gridRows.displayedRows;

        expect(rows2[0] === rows3[0]).toBe(true);
        expect(rows2[1] === rows3[1]).toBe(true);
        expect(rows2[2] === rows3[2]).toBe(true);
        expect(rows2[3] === rows3[3]).toBe(true);
        expect(rows2[4] === rows3[4]).toBe(true);
        expect(rows2[5] === rows3[5]).toBe(true);
        expect(rows2[6] === rows3[6]).toBe(true);
        expect(rows2[8] === rows3[7]).toBe(true); // removed row
        expect(rows2[9] === rows3[8]).toBe(true);
        expect(rows2[10] === rows3[9]).toBe(true);
        expect(rows3[10].data.v).toBe(666); // added row
        expect(rows3[11].data.v).toBe(777); // added row
        expect(rows3[12].data.v).toBe(888); // added row
        expect(rows2[11] === rows3[13]).toBe(true);

        // add, remove, reorder, move some nodes

        const rowData4 = cachedJSONObjects.array([
            {
                id: 'C',
                v: 3,
                children: [{ id: 'D', v: 4 }],
            },
            {
                id: 'A',
                v: 1000,
                children: [{ id: 'B', v: 20, children: [{ id: 'Q', v: -100 }] }],
            },
            {
                id: 'E',
                v: 5,
                children: [
                    {
                        id: 'F',
                        v: 6,
                        children: [
                            { id: 'G', v: 7, children: [{ id: 'N', v: 888 }] },
                            { id: 'I', v: 9 },
                        ],
                    },
                    {
                        id: 'J',
                        v: 10,
                        children: [
                            { id: 'M', v: 777 },
                            { id: 'L', v: 666 },
                            { id: 'K', v: 110 },
                        ],
                    },
                ],
            },
        ]);

        api.setGridOption('rowData', rowData4);

        gridRows = new GridRows(api, 'add, reorder, move some nodes', gridRowsOptions);
        await gridRows.check(`
            ROOT id:ROOT_NODE_ID
            ├─┬ C GROUP id:C ag-Grid-AutoColumn:"C" v:3
            │ └── D LEAF id:D ag-Grid-AutoColumn:"D" v:4
            ├─┬ A GROUP id:A ag-Grid-AutoColumn:"A" v:1000
            │ └─┬ B GROUP id:B ag-Grid-AutoColumn:"B" v:20
            │ · └── Q LEAF id:Q ag-Grid-AutoColumn:"Q" v:-100
            └─┬ E GROUP id:E ag-Grid-AutoColumn:"E" v:5
            · ├─┬ F GROUP id:F ag-Grid-AutoColumn:"F" v:6
            · │ ├─┬ G GROUP id:G ag-Grid-AutoColumn:"G" v:7
            · │ │ └── N LEAF id:N ag-Grid-AutoColumn:"N" v:888
            · │ └── I LEAF id:I ag-Grid-AutoColumn:"I" v:9
            · └─┬ J GROUP id:J ag-Grid-AutoColumn:"J" v:10
            · · ├── M LEAF id:M ag-Grid-AutoColumn:"M" v:777
            · · ├── L LEAF id:L ag-Grid-AutoColumn:"L" v:666
            · · └── K LEAF id:K ag-Grid-AutoColumn:"K" v:110
        `);

        const rows4 = gridRows.displayedRows;

        expect(rows3[0] === rows4[2]).toBe(true); // C swapped with A
        expect(rows3[1] === rows4[3]).toBe(true);
        expect(rows3[2] === rows4[0]).toBe(true);
        expect(rows3[3] === rows4[1]).toBe(true);
        expect(rows4[4].data.v).toBe(-100); // Q added
        expect(rows3[4] === rows4[5]).toBe(true);
        expect(rows3[5] === rows4[6]).toBe(true);
        expect(rows3[6] === rows4[7]).toBe(true);
        expect(rows3[7] === rows4[9]).toBe(true);
        expect(rows3[8] === rows4[10]).toBe(true);
        expect(rows3[9] === rows4[13]).toBe(true); // K moved
        expect(rows3[10] === rows4[12]).toBe(true); // L moved
        expect(rows3[11] === rows4[11]).toBe(true); // M moved
        expect(rows3[12] === rows4[8]).toBe(true); // N moved parent

        // remove groups

        const rowData5 = cachedJSONObjects.array([
            {
                id: 'C',
                v: 3,
                children: [{ id: 'D', v: 4 }],
            },
            {
                id: 'E',
                v: 5,
                children: [
                    {
                        id: 'F',
                        v: 6,
                        children: [
                            { id: 'G', v: 7, children: [{ id: 'N', v: 888 }] },
                            { id: 'I', v: 9 },
                        ],
                    },
                ],
            },
        ]);

        api.setGridOption('rowData', rowData5);

        gridRows = new GridRows(api, 'remove groups', gridRowsOptions);

        const rows5 = gridRows.displayedRows;

        await gridRows.check(`
            ROOT id:ROOT_NODE_ID
            ├─┬ C GROUP id:C ag-Grid-AutoColumn:"C" v:3
            │ └── D LEAF id:D ag-Grid-AutoColumn:"D" v:4
            └─┬ E GROUP id:E ag-Grid-AutoColumn:"E" v:5
            · └─┬ F GROUP id:F ag-Grid-AutoColumn:"F" v:6
            · · ├─┬ G GROUP id:G ag-Grid-AutoColumn:"G" v:7
            · · │ └── N LEAF id:N ag-Grid-AutoColumn:"N" v:888
            · · └── I LEAF id:I ag-Grid-AutoColumn:"I" v:9
        `);

        // swap groups children

        const rowData6 = cachedJSONObjects.array([
            {
                id: 'E',
                v: 5,
                children: [{ id: 'D', v: 4 }],
            },
            {
                id: 'C',
                v: 3,
                children: [
                    {
                        id: 'F',
                        v: 6,
                        children: [
                            { id: 'N', v: 888, children: [{ id: 'G', v: 7 }] },
                            { id: 'I', v: 9 },
                        ],
                    },
                ],
            },
        ]);

        api.setGridOption('rowData', rowData6);

        gridRows = new GridRows(api, 'swap groups children', gridRowsOptions);

        await gridRows.check(`
            ROOT id:ROOT_NODE_ID
            ├─┬ E GROUP id:E ag-Grid-AutoColumn:"E" v:5
            │ └── D LEAF id:D ag-Grid-AutoColumn:"D" v:4
            └─┬ C GROUP id:C ag-Grid-AutoColumn:"C" v:3
            · └─┬ F GROUP id:F ag-Grid-AutoColumn:"F" v:6
            · · ├─┬ N GROUP id:N ag-Grid-AutoColumn:"N" v:888
            · · │ └── G LEAF id:G ag-Grid-AutoColumn:"G" v:7
            · · └── I LEAF id:I ag-Grid-AutoColumn:"I" v:9
        `);

        const rows6 = gridRows.displayedRows;

        expect(rows5[2] === rows6[0]).toBe(true);
        expect(rows5[1] === rows6[1]).toBe(true);
        expect(rows5[0] === rows6[2]).toBe(true);
        expect(rows5[3] === rows6[3]).toBe(true);
        expect(rows5[5] === rows6[4]).toBe(true);
        expect(rows5[4] === rows6[5]).toBe(true);
        expect(rows5[6] === rows6[6]).toBe(true);

        // disable treeData

        api.setGridOption('treeData', false);

        gridRows = new GridRows(api, 'disable treeData', gridRowsOptions);

        await gridRows.check(`
            ROOT id:ROOT_NODE_ID
            ├── LEAF id:E v:5
            ├── LEAF id:D v:4
            ├── LEAF id:C v:3
            ├── LEAF id:F v:6
            ├── LEAF id:N v:888
            ├── LEAF id:G v:7
            └── LEAF id:I v:9
        `);

        const rows7 = gridRows.displayedRows;
        for (let i = 0; i < rows6.length; i++) {
            expect(rows6[i] === rows7[i]).toBe(true);
        }

        // change a group and add a new node while treeData is false

        const rowData8 = cachedJSONObjects.array([
            {
                id: 'E',
                v: 5,
                children: [{ id: 'D', v: 4 }],
            },
            {
                id: 'C',
                v: 3,
                children: [
                    {
                        id: 'F',
                        v: 6,
                        children: [
                            { id: 'N', v: 888, children: [{ id: 'G', v: 7 }] },
                            { id: 'I', v: 9 },
                        ],
                    },
                ],
            },
            { id: 'X', v: 100 },
        ]);

        api.setGridOption('rowData', rowData8);

        gridRows = new GridRows(api, 'change a group and add a new node while treeData is false', gridRowsOptions);

        await gridRows.check(`
            ROOT id:ROOT_NODE_ID
            ├── LEAF id:E v:5
            ├── LEAF id:D v:4
            ├── LEAF id:C v:3
            ├── LEAF id:F v:6
            ├── LEAF id:N v:888
            ├── LEAF id:G v:7
            ├── LEAF id:I v:9
            └── LEAF id:X v:100
        `);

        const rows8 = gridRows.displayedRows;

        // re-enable treeData

        api.setGridOption('treeData', true);

        gridRows = new GridRows(api, 're-enable treeData', gridRowsOptions);

        await gridRows.check(`
            ROOT id:ROOT_NODE_ID
            ├─┬ E GROUP id:E ag-Grid-AutoColumn:"E" v:5
            │ └── D LEAF id:D ag-Grid-AutoColumn:"D" v:4
            ├─┬ C GROUP id:C ag-Grid-AutoColumn:"C" v:3
            │ └─┬ F GROUP id:F ag-Grid-AutoColumn:"F" v:6
            │ · ├─┬ N GROUP id:N ag-Grid-AutoColumn:"N" v:888
            │ · │ └── G LEAF id:G ag-Grid-AutoColumn:"G" v:7
            │ · └── I LEAF id:I ag-Grid-AutoColumn:"I" v:9
            └── X LEAF id:X ag-Grid-AutoColumn:"X" v:100
        `);

        const rows9 = gridRows.displayedRows;

        for (let i = 0; i < rows8.length; i++) {
            expect(rows8[i] === rows9[i]).toBe(true);
        }
    });

    test('suppressMaintainUnsortedOrder is respected', async () => {
        const rowData1 = cachedJSONObjects.array([
            {
                id: 'A',
                v: 0,
                children: [
                    { id: 'B', v: 1 },
                    { id: 'C', v: 2 },
                    { id: 'D', v: 3 },
                ],
            },
            {
                id: 'E',
                v: 4,
                children: [
                    {
                        id: 'F',
                        v: 5,
                        children: [
                            {
                                id: 'G',
                                v: 6,
                                children: [
                                    { id: 'H', v: 7 },
                                    { id: 'I', v: 8 },
                                ],
                            },
                            { id: 'J', v: 9 },
                        ],
                    },
                ],
            },
            { id: 'K', v: 10 },
            { id: 'L', v: 11 },
            { id: 'M', v: 12 },
        ]);

        const gridOptions: GridOptions = {
            columnDefs: [{ field: 'v' }],
            treeData: true,
            treeDataChildrenField: 'children',
            suppressMaintainUnsortedOrder: true,
            animateRows: false,
            groupDefaultExpanded: -1,
            rowData: rowData1,
            getRowId: ({ data }) => data.id,
        };

        const api = gridsManager.createGrid('myGrid', gridOptions);

        const gridRowsOptions: GridRowsOptions = {
            checkDom: true,
            columns: true,
        };

        const gridRows1 = new GridRows(api, 'data', gridRowsOptions);

        await gridRows1.check(`
            ROOT id:ROOT_NODE_ID
            ├─┬ A GROUP id:A ag-Grid-AutoColumn:"A" v:0
            │ ├── B LEAF id:B ag-Grid-AutoColumn:"B" v:1
            │ ├── C LEAF id:C ag-Grid-AutoColumn:"C" v:2
            │ └── D LEAF id:D ag-Grid-AutoColumn:"D" v:3
            ├─┬ E GROUP id:E ag-Grid-AutoColumn:"E" v:4
            │ └─┬ F GROUP id:F ag-Grid-AutoColumn:"F" v:5
            │ · ├─┬ G GROUP id:G ag-Grid-AutoColumn:"G" v:6
            │ · │ ├── H LEAF id:H ag-Grid-AutoColumn:"H" v:7
            │ · │ └── I LEAF id:I ag-Grid-AutoColumn:"I" v:8
            │ · └── J LEAF id:J ag-Grid-AutoColumn:"J" v:9
            ├── K LEAF id:K ag-Grid-AutoColumn:"K" v:10
            ├── L LEAF id:L ag-Grid-AutoColumn:"L" v:11
            └── M LEAF id:M ag-Grid-AutoColumn:"M" v:12
        `);

        // Change the order, insert some nodes, the order should not change and new nodes appended

        const rowData2 = cachedJSONObjects.array([
            { id: 'M', v: 12 },
            { id: 'L', v: 11 },
            {
                id: 'E',
                v: 4,
                children: [
                    {
                        id: 'F',
                        v: 5,
                        children: [
                            { id: 'X', v: 100 },
                            { id: 'J', v: 9 },
                            { id: 'Y', v: 101 },
                            {
                                id: 'G',
                                v: 6,
                                children: [
                                    { id: 'I', v: 8 },
                                    { id: 'H', v: 7 },
                                    { id: 'Z', v: 102 },
                                ],
                            },
                        ],
                    },
                ],
            },
            { id: 'K', v: 10 },
            { id: 'W', v: 103 },
            {
                id: 'A',
                v: 0,
                children: [
                    { id: 'D', v: 333 },
                    { id: 'B', v: 1 },
                ],
            },
        ]);

        api.setGridOption('rowData', rowData2);

        const gridRows2 = new GridRows(api, 'change the order, insert some nodes', gridRowsOptions);

        await gridRows2.check(`
            ROOT id:ROOT_NODE_ID
            ├─┬ A GROUP id:A ag-Grid-AutoColumn:"A" v:0
            │ ├── B LEAF id:B ag-Grid-AutoColumn:"B" v:1
            │ └── D LEAF id:D ag-Grid-AutoColumn:"D" v:333
            ├─┬ E GROUP id:E ag-Grid-AutoColumn:"E" v:4
            │ └─┬ F GROUP id:F ag-Grid-AutoColumn:"F" v:5
            │ · ├─┬ G GROUP id:G ag-Grid-AutoColumn:"G" v:6
            │ · │ ├── H LEAF id:H ag-Grid-AutoColumn:"H" v:7
            │ · │ ├── I LEAF id:I ag-Grid-AutoColumn:"I" v:8
            │ · │ └── Z LEAF id:Z ag-Grid-AutoColumn:"Z" v:102
            │ · ├── J LEAF id:J ag-Grid-AutoColumn:"J" v:9
            │ · ├── X LEAF id:X ag-Grid-AutoColumn:"X" v:100
            │ · └── Y LEAF id:Y ag-Grid-AutoColumn:"Y" v:101
            ├── K LEAF id:K ag-Grid-AutoColumn:"K" v:10
            ├── L LEAF id:L ag-Grid-AutoColumn:"L" v:11
            ├── M LEAF id:M ag-Grid-AutoColumn:"M" v:12
            └── W LEAF id:W ag-Grid-AutoColumn:"W" v:103
        `);

        expect(gridRows1.getById('A') === gridRows2.getById('A')).toBe(true);
        expect(gridRows1.getById('B') === gridRows2.getById('B')).toBe(true);
        expect(gridRows1.getById('D') === gridRows2.getById('D')).toBe(true);
        expect(gridRows1.getById('E') === gridRows2.getById('E')).toBe(true);
        expect(gridRows1.getById('F') === gridRows2.getById('F')).toBe(true);
        expect(gridRows1.getById('G') === gridRows2.getById('G')).toBe(true);
        expect(gridRows1.getById('H') === gridRows2.getById('H')).toBe(true);
        expect(gridRows1.getById('I') === gridRows2.getById('I')).toBe(true);
        expect(gridRows1.getById('J') === gridRows2.getById('J')).toBe(true);
        expect(gridRows1.getById('K') === gridRows2.getById('K')).toBe(true);
        expect(gridRows1.getById('L') === gridRows2.getById('L')).toBe(true);
        expect(gridRows1.getById('M') === gridRows2.getById('M')).toBe(true);
    });
});
