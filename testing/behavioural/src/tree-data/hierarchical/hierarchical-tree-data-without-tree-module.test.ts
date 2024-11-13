import type { MockInstance } from 'vitest';

import { ClientSideRowModelModule } from 'ag-grid-community';
import type { GridOptions } from 'ag-grid-community';

import { GridRows, TestGridsManager } from '../../test-utils';

describe('ag-grid tree data without tree module', () => {
    const gridsManager = new TestGridsManager({
        modules: [ClientSideRowModelModule],
    });

    let consoleWarnSpy: MockInstance;
    let consoleErrorSpy: MockInstance;

    beforeEach(() => {
        gridsManager.reset();
    });

    afterEach(() => {
        gridsManager.reset();
        consoleWarnSpy?.mockRestore();
        consoleErrorSpy?.mockRestore();
    });

    test('ag-grid tree data without tree module raises a warning but still works', async () => {
        const rowData = [{ x: 1, children: [{ x: 2 }] }, { x: 3 }, { x: 4 }, { x: 5 }];

        const gridOptions: GridOptions = {
            columnDefs: [{ field: 'x' }],
            autoGroupColumnDef: {
                headerName: 'Organisation Hierarchy',
                cellRendererParams: { suppressCount: true },
            },
            treeData: true,
            treeDataChildrenField: 'children',
            animateRows: false,
            groupDefaultExpanded: -1,
            rowData,
        };

        consoleErrorSpy = vitest.spyOn(console, 'error').mockImplementation(() => {});

        const api = gridsManager.createGrid('myGrid', gridOptions);

        expect(consoleErrorSpy).toHaveBeenCalled();

        consoleErrorSpy.mockRestore();

        const gridRowsOptions = {
            checkDom: true,
            columns: true,
            treeData: false,
        };

        const gridRows = new GridRows(api, 'data', gridRowsOptions);
        await gridRows.check(`
            ROOT id:ROOT_NODE_ID
            ├── LEAF id:0 x:1
            ├── LEAF id:1 x:3
            ├── LEAF id:2 x:4
            └── LEAF id:3 x:5
        `);
    });
});
