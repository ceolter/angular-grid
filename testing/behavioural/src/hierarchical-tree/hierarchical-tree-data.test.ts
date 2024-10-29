import type { MockInstance } from 'vitest';

import type { GridOptions } from 'ag-grid-community';
import { ClientSideRowModelModule } from 'ag-grid-community';
import { TreeDataModule } from 'ag-grid-enterprise';

import type { GridRowsOptions } from '../test-utils';
import { GridRows, TestGridsManager, asyncSetTimeout } from '../test-utils';

describe('ag-grid hierarchical tree data', () => {
    const gridsManager = new TestGridsManager({
        modules: [ClientSideRowModelModule, TreeDataModule],
    });

    let consoleWarnSpy: MockInstance;

    function hasLoadingOverlay() {
        return !!document.querySelector('.ag-overlay-loading-center');
    }

    function hasNoRowsOverlay() {
        return !!document.querySelector('.ag-overlay-no-rows-center');
    }

    beforeEach(() => {
        gridsManager.reset();
    });

    afterEach(() => {
        gridsManager.reset();
        consoleWarnSpy?.mockRestore();
    });

    test('ag-grid hierarchical tree data loading and no-show overlay', async () => {
        const rowData = [{ x: 1 }];

        const gridOptions: GridOptions = {
            columnDefs: [{ field: 'x' }],
            autoGroupColumnDef: {
                headerName: 'Organisation Hierarchy',
                cellRendererParams: { suppressCount: true },
            },
            treeData: true,
            animateRows: false,
            groupDefaultExpanded: -1,
            treeDataChildrenField: 'children',
        };

        const api = gridsManager.createGrid('myGrid', gridOptions);

        expect(hasLoadingOverlay()).toBe(true);
        expect(hasNoRowsOverlay()).toBe(false);

        api.setGridOption('rowData', []);

        expect(hasLoadingOverlay()).toBe(false);
        expect(hasNoRowsOverlay()).toBe(true);

        api.setGridOption('rowData', rowData);

        expect(hasLoadingOverlay()).toBe(false);
        expect(hasNoRowsOverlay()).toBe(false);

        api.setGridOption('rowData', []);

        await asyncSetTimeout(10);

        expect(hasLoadingOverlay()).toBe(false);
        expect(hasNoRowsOverlay()).toBe(true);
    });

    test('ag-grid hierarchical tree data (without id)', async () => {
        const rowData = [
            {
                x: 'A',
                children: [
                    {
                        x: 'B',
                        children: [
                            {
                                x: 'C',
                                children: [
                                    {
                                        x: 'D',
                                    },
                                ],
                            },
                        ],
                    },
                ],
            },
            {
                x: 'E',
                children: [
                    {
                        x: 'F',
                        children: [
                            {
                                x: 'G',
                                children: [
                                    {
                                        x: 'H',
                                    },
                                ],
                            },
                        ],
                    },
                ],
            },
        ];

        const gridOptions: GridOptions = {
            columnDefs: [{ field: 'x' }],
            treeData: true,
            treeDataChildrenField: 'children',
            animateRows: false,
            groupDefaultExpanded: -1,
            rowData,
        };

        const api = gridsManager.createGrid('myGrid', gridOptions);

        const gridRowsOptions: GridRowsOptions = {
            checkDom: true,
            columns: true,
        };

        const gridRows = new GridRows(api, 'data', gridRowsOptions);
        await gridRows.check(`
            ROOT id:ROOT_NODE_ID
            ├─┬ 0 GROUP id:0 ag-Grid-AutoColumn:"0" x:"A"
            │ └─┬ 1 GROUP id:1 ag-Grid-AutoColumn:"1" x:"B"
            │ · └─┬ 2 GROUP id:2 ag-Grid-AutoColumn:"2" x:"C"
            │ · · └── 3 LEAF id:3 ag-Grid-AutoColumn:"3" x:"D"
            └─┬ 4 GROUP id:4 ag-Grid-AutoColumn:"4" x:"E"
            · └─┬ 5 GROUP id:5 ag-Grid-AutoColumn:"5" x:"F"
            · · └─┬ 6 GROUP id:6 ag-Grid-AutoColumn:"6" x:"G"
            · · · └── 7 LEAF id:7 ag-Grid-AutoColumn:"7" x:"H"
        `);

        api.setGridOption('treeData', false);

        await gridRows.check(`
            ROOT id:ROOT_NODE_ID
            ├── 0 LEAF id:0 x:"A"
            ├── 1 LEAF id:1 x:"B"
            ├── 2 LEAF id:2 x:"C"
            ├── 3 LEAF id:3 x:"D"
            ├── 4 LEAF id:4 x:"E"
            ├── 5 LEAF id:5 x:"F"
            ├── 6 LEAF id:6 x:"G"
            └── 7 LEAF id:7 x:"H"
        `);

        api.setGridOption('treeData', true);

        await gridRows.check(`
            ROOT id:ROOT_NODE_ID
            ├─┬ 0 GROUP id:0 ag-Grid-AutoColumn:"0" x:"A"
            │ └─┬ 1 GROUP id:1 ag-Grid-AutoColumn:"1" x:"B"
            │ · └─┬ 2 GROUP id:2 ag-Grid-AutoColumn:"2" x:"C"
            │ · · └── 3 LEAF id:3 ag-Grid-AutoColumn:"3" x:"D"
            └─┬ 4 GROUP id:4 ag-Grid-AutoColumn:"4" x:"E"
            · └─┬ 5 GROUP id:5 ag-Grid-AutoColumn:"5" x:"F"
            · · └─┬ 6 GROUP id:6 ag-Grid-AutoColumn:"6" x:"G"
            · · · └── 7 LEAF id:7 ag-Grid-AutoColumn:"7" x:"H"
        `);
    });

    test('ag-grid hierarchical override tree data (without id)', async () => {
        const rowData0 = [
            { x: 'A', children: [{ x: 'B' }] },
            { x: 'C', children: [{ x: 'D' }] },
        ];

        const rowData1 = [
            { x: 'E', children: [{ x: 'F' }, { x: 'G' }] },
            { x: 'H', children: [{ x: 'I' }, { x: 'J' }] },
        ];

        const api = gridsManager.createGrid('myGrid', {
            columnDefs: [{ field: 'x' }],
            treeData: false,
            treeDataChildrenField: 'children',
            animateRows: false,
            groupDefaultExpanded: -1,
            rowData: rowData0,
        });

        const gridRowsOptions: GridRowsOptions = {
            checkDom: true,
            columns: true,
        };

        let gridRows = new GridRows(api, 'data', gridRowsOptions);
        await gridRows.check(`
            ROOT id:ROOT_NODE_ID
            ├── LEAF id:0 x:"A"
            ├── LEAF id:1 x:"B"
            ├── LEAF id:2 x:"C"
            └── LEAF id:3 x:"D"
        `);

        api.setGridOption('treeData', false);
        gridRows = new GridRows(api, 'data', gridRowsOptions);
        await gridRows.check(`
            ROOT id:ROOT_NODE_ID
            ├── LEAF id:0 x:"A"
            ├── LEAF id:1 x:"B"
            ├── LEAF id:2 x:"C"
            └── LEAF id:3 x:"D"
        `);

        api.setGridOption('rowData', rowData1);

        api.updateGridOptions({
            treeData: true,
            rowData: rowData1,
        });

        gridRows = new GridRows(api, 'update 1', gridRowsOptions);
        await gridRows.check(`
            ROOT id:ROOT_NODE_ID
            ├─┬ 0 GROUP id:0 ag-Grid-AutoColumn:"0" x:"E"
            │ ├── 1 LEAF id:1 ag-Grid-AutoColumn:"1" x:"F"
            │ └── 2 LEAF id:2 ag-Grid-AutoColumn:"2" x:"G"
            └─┬ 3 GROUP id:3 ag-Grid-AutoColumn:"3" x:"H"
            · ├── 4 LEAF id:4 ag-Grid-AutoColumn:"4" x:"I"
            · └── 5 LEAF id:5 ag-Grid-AutoColumn:"5" x:"J"
        `);

        api.updateGridOptions({ rowData: rowData0, treeData: false });

        gridRows = new GridRows(api, 'update 2', gridRowsOptions);
        await gridRows.check(`
                ROOT id:ROOT_NODE_ID
                ├── LEAF id:0 x:"A"
                ├── LEAF id:1 x:"B"
                ├── LEAF id:2 x:"C"
                └── LEAF id:3 x:"D"
            `);

        api.updateGridOptions({ rowData: rowData1 });

        gridRows = new GridRows(api, 'update 3', gridRowsOptions);
        await gridRows.check(`
                ROOT id:ROOT_NODE_ID
                ├── LEAF id:0 x:"E"
                ├── LEAF id:1 x:"F"
                ├── LEAF id:2 x:"G"
                ├── LEAF id:3 x:"H"
                ├── LEAF id:4 x:"I"
                └── LEAF id:5 x:"J"
            `);

        api.updateGridOptions({ treeData: true });

        gridRows = new GridRows(api, 'update 4', gridRowsOptions);
        await gridRows.check(`
                ROOT id:ROOT_NODE_ID
                ├─┬ 0 GROUP id:0 ag-Grid-AutoColumn:"0" x:"E"
                │ ├── 1 LEAF id:1 ag-Grid-AutoColumn:"1" x:"F"
                │ └── 2 LEAF id:2 ag-Grid-AutoColumn:"2" x:"G"
                └─┬ 3 GROUP id:3 ag-Grid-AutoColumn:"3" x:"H"
                · ├── 4 LEAF id:4 ag-Grid-AutoColumn:"4" x:"I"
                · └── 5 LEAF id:5 ag-Grid-AutoColumn:"5" x:"J"
            `);
    });

    // TODO: this test is skipped because https://ag-grid.atlassian.net/browse/AG-13089 - Order of grouped property listener changed is not deterministic
    test.skip('ag-grid hierarchical override tree data is insensitive to updateGridOptions object order', async () => {
        const rowData0 = [
            { x: 'A', children: [{ x: 'B' }] },
            { x: 'C', children: [{ x: 'D' }] },
        ];

        const rowData1 = [
            { x: 'E', children: [{ x: 'F' }, { x: 'G' }] },
            { x: 'H', children: [{ x: 'I' }, { x: 'J' }] },
        ];

        const api = gridsManager.createGrid('myGrid', {
            columnDefs: [{ field: 'x' }],
            treeData: false,
            treeDataChildrenField: 'children',
            animateRows: false,
            groupDefaultExpanded: -1,
            rowData: rowData0,
        });

        api.updateGridOptions({
            rowData: rowData1,
            treeData: true,
        });

        const gridRowsOptions: GridRowsOptions = {
            checkDom: true,
            columns: true,
        };

        const gridRows = new GridRows(api, 'update 1', gridRowsOptions);
        await gridRows.check(`
            ROOT id:ROOT_NODE_ID
            ├─┬ 0 GROUP id:0 ag-Grid-AutoColumn:"0" x:"E"
            │ ├── 1 LEAF id:1 ag-Grid-AutoColumn:"1" x:"F"
            │ └── 2 LEAF id:2 ag-Grid-AutoColumn:"2" x:"G"
            └─┬ 3 GROUP id:3 ag-Grid-AutoColumn:"3" x:"H"
            · ├── 4 LEAF id:4 ag-Grid-AutoColumn:"4" x:"I"
            · └── 5 LEAF id:5 ag-Grid-AutoColumn:"5" x:"J"
        `);
    });

    test('ag-grid initial hierarchical tree data (with id)', async () => {
        const rowData = [
            {
                id: 'idA',
                x: 'A',
                children: [
                    {
                        id: 'idB',
                        x: 'B',
                        children: [
                            {
                                id: 'idC',
                                x: 'C',
                                children: [
                                    {
                                        id: 'idD',
                                        x: 'D',
                                    },
                                ],
                            },
                            {
                                id: 'idE',
                                x: 'E',
                                children: [
                                    {
                                        id: 'idF',
                                        x: 'F',
                                    },
                                ],
                            },
                        ],
                    },
                ],
            },
            {
                id: 'idG',
                x: 'G',
                children: [
                    {
                        id: 'idH',
                        x: 'H',
                    },
                    {
                        id: 'idI',
                        x: 'I',
                    },
                ],
            },
        ];

        const gridOptions: GridOptions = {
            columnDefs: [{ field: 'x' }],
            treeData: true,
            treeDataChildrenField: 'children',
            animateRows: false,
            groupDefaultExpanded: -1,
            rowData,
            getRowId: ({ data }) => data.id,
        };

        const api = gridsManager.createGrid('myGrid', gridOptions);

        const gridRowsOptions: GridRowsOptions = {
            checkDom: true,
            columns: true,
        };

        const gridRows = new GridRows(api, 'data', gridRowsOptions);
        await gridRows.check(`
            ROOT id:ROOT_NODE_ID
            ├─┬ idA GROUP id:idA ag-Grid-AutoColumn:"idA" x:"A"
            │ └─┬ idB GROUP id:idB ag-Grid-AutoColumn:"idB" x:"B"
            │ · ├─┬ idC GROUP id:idC ag-Grid-AutoColumn:"idC" x:"C"
            │ · │ └── idD LEAF id:idD ag-Grid-AutoColumn:"idD" x:"D"
            │ · └─┬ idE GROUP id:idE ag-Grid-AutoColumn:"idE" x:"E"
            │ · · └── idF LEAF id:idF ag-Grid-AutoColumn:"idF" x:"F"
            └─┬ idG GROUP id:idG ag-Grid-AutoColumn:"idG" x:"G"
            · ├── idH LEAF id:idH ag-Grid-AutoColumn:"idH" x:"H"
            · └── idI LEAF id:idI ag-Grid-AutoColumn:"idI" x:"I"
        `);

        api.setGridOption('treeData', false);

        await gridRows.check(`
            ROOT id:ROOT_NODE_ID
            ├── idA LEAF id:idA x:"A"
            ├── idB LEAF id:idB x:"B"
            ├── idC LEAF id:idC x:"C"
            ├── idD LEAF id:idD x:"D"
            ├── idE LEAF id:idE x:"E"
            ├── idF LEAF id:idF x:"F"
            ├── idG LEAF id:idG x:"G"
            ├── idH LEAF id:idH x:"H"
            └── idI LEAF id:idI x:"I"
        `);

        api.setGridOption('treeData', true);

        await gridRows.check(`
            ROOT id:ROOT_NODE_ID
            ├─┬ idA GROUP id:idA ag-Grid-AutoColumn:"idA" x:"A"
            │ └─┬ idB GROUP id:idB ag-Grid-AutoColumn:"idB" x:"B"
            │ · ├─┬ idC GROUP id:idC ag-Grid-AutoColumn:"idC" x:"C"
            │ · │ └── idD LEAF id:idD ag-Grid-AutoColumn:"idD" x:"D"
            │ · └─┬ idE GROUP id:idE ag-Grid-AutoColumn:"idE" x:"E"
            │ · · └── idF LEAF id:idF ag-Grid-AutoColumn:"idF" x:"F"
            └─┬ idG GROUP id:idG ag-Grid-AutoColumn:"idG" x:"G"
            · ├── idH LEAF id:idH ag-Grid-AutoColumn:"idH" x:"H"
            · └── idI LEAF id:idI ag-Grid-AutoColumn:"idI" x:"I"
        `);
    });
});
