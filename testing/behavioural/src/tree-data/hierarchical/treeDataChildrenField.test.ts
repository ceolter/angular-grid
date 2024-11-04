import { ClientSideRowModelModule } from 'ag-grid-community';
import type { GridOptions } from 'ag-grid-community';
import { TreeDataModule } from 'ag-grid-enterprise';

import { GridRows, TestGridsManager } from '../../test-utils';
import type { GridRowsOptions } from '../../test-utils';

describe('ag-grid treeDataChildrenField', () => {
    const gridsManager = new TestGridsManager({
        modules: [ClientSideRowModelModule, TreeDataModule],
    });

    beforeEach(() => {
        gridsManager.reset();
    });

    afterEach(() => {
        gridsManager.reset();
    });

    test('ag-grid treeDataChildrenField with plain row data can be switched on and off ', async () => {
        const rowData = [
            { id: '1', x: 'a' },
            { id: '2', x: 'b' },
            { id: '3', x: 'c' },
            { id: '4', x: 'd' },
        ];

        const gridOptions: GridOptions = {
            columnDefs: [{ field: 'x' }],
            autoGroupColumnDef: {
                headerName: 'Organisation Hierarchy',
                cellRendererParams: { suppressCount: true },
            },
            animateRows: false,
            groupDefaultExpanded: -1,
            rowData,
            getRowId: (params) => params.data.id,
        };

        const api = gridsManager.createGrid('myGrid', gridOptions);

        const gridRowsOptions: GridRowsOptions = {
            checkDom: true,
        };

        let gridRows = new GridRows(api, 'data', gridRowsOptions);
        await gridRows.check(`
            ROOT id:ROOT_NODE_ID
            ├── LEAF id:1
            ├── LEAF id:2
            ├── LEAF id:3
            └── LEAF id:4
        `);

        api.setGridOption('treeDataChildrenField', 'children');

        gridRows = new GridRows(api, 'data', gridRowsOptions);
        await gridRows.check(`
            ROOT id:ROOT_NODE_ID
            ├── LEAF id:1
            ├── LEAF id:2
            ├── LEAF id:3
            └── LEAF id:4
        `);

        api.setGridOption('treeDataChildrenField', undefined);

        gridRows = new GridRows(api, 'data', gridRowsOptions);
        await gridRows.check(`
            ROOT id:ROOT_NODE_ID
            ├── LEAF id:1
            ├── LEAF id:2
            ├── LEAF id:3
            └── LEAF id:4
        `);
    });

    test('ag-grid treeDataChildrenField is reactive', async () => {
        const rowData = [
            {
                id: '1',
                x: 'a',
                children1: [
                    { id: 'x1', x: 'x1' },
                    { id: 'x2', x: 'x2' },
                ],
                subObject: {
                    children2: [
                        { id: 'y1', x: 'y1' },
                        { id: 'y2', x: 'y2' },
                    ],
                },
            },
            { id: '2', x: 'b' },
            {
                id: '4',
                x: 'd',
                children1: [
                    { id: 'z1', x: 'z1' },
                    { id: 'z2', x: 'z2' },
                ],
                subObject: {
                    children2: [
                        { id: 'w1', x: 'w1' },
                        { id: 'w2', x: 'w2' },
                    ],
                },
            },
        ];

        const gridOptions: GridOptions = {
            columnDefs: [{ field: 'x' }],
            autoGroupColumnDef: {
                headerName: 'Organisation Hierarchy',
                cellRendererParams: { suppressCount: true },
            },
            animateRows: false,
            // treeData: true,
            groupDefaultExpanded: -1,
            rowData,
            getRowId: (params) => params.data.id,
        };

        const api = gridsManager.createGrid('myGrid', gridOptions);

        const gridRowsOptions: GridRowsOptions = {
            checkDom: true,
        };

        let gridRows = new GridRows(api, 'data', gridRowsOptions);
        await gridRows.check(`
            ROOT id:ROOT_NODE_ID
            ├── LEAF id:1
            ├── LEAF id:2
            └── LEAF id:4
        `);

        api.updateGridOptions({
            treeData: true,
            treeDataChildrenField: 'children1',
        });

        gridRows = new GridRows(api, 'data', gridRowsOptions);
        await gridRows.check(`
            ROOT id:ROOT_NODE_ID
            ├─┬ 1 GROUP id:1
            │ ├── x1 LEAF id:x1
            │ └── x2 LEAF id:x2
            ├── 2 LEAF id:2
            └─┬ 4 GROUP id:4
            · ├── z1 LEAF id:z1
            · └── z2 LEAF id:z2
        `);

        api.setGridOption('treeDataChildrenField', 'subObject.children2');

        gridRows = new GridRows(api, 'data', gridRowsOptions);
        await gridRows.check(`
            ROOT id:ROOT_NODE_ID
            ├─┬ 1 GROUP id:1
            │ ├── y1 LEAF id:y1
            │ └── y2 LEAF id:y2
            ├── 2 LEAF id:2
            └─┬ 4 GROUP id:4
            · ├── w1 LEAF id:w1
            · └── w2 LEAF id:w2
        `);

        api.setGridOption('treeDataChildrenField', 'xxx');

        gridRows = new GridRows(api, 'data', gridRowsOptions);
        await gridRows.check(`
            ROOT id:ROOT_NODE_ID
            ├── 1 LEAF id:1
            ├── 2 LEAF id:2
            └── 4 LEAF id:4
        `);
    });
});
