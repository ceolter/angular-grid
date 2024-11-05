import type { MockInstance } from 'vitest';

import type { GridOptions } from 'ag-grid-community';
import { ClientSideRowModelModule } from 'ag-grid-community';
import { TreeDataModule } from 'ag-grid-enterprise';

import type { GridRowsOptions } from '../test-utils';
import { GridRows, TestGridsManager } from '../test-utils';

describe('ag-grid tree data without hierarchical and without data path', () => {
    const gridsManager = new TestGridsManager({
        modules: [ClientSideRowModelModule, TreeDataModule],
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

    test('ag-grid tree data without getDataPath and without treeDataChildrenField still works properly and raises warnings', async () => {
        const rowData = [{ x: 1 }, { x: 2, children: [{ x: 3 }] }];

        const gridOptions: GridOptions = {
            columnDefs: [{ field: 'x' }],
            rowData,
            treeData: true,
            animateRows: false,
            groupDefaultExpanded: -1,
        };

        consoleWarnSpy = vitest.spyOn(console, 'warn').mockImplementation(() => {});
        consoleErrorSpy = vitest.spyOn(console, 'error').mockImplementation(() => {});

        const api = gridsManager.createGrid('myGrid', gridOptions);

        expect(consoleWarnSpy).toHaveBeenCalledWith(
            "AG Grid: treeData requires 'treeDataChildrenField' or 'getDataPath' in the clientSide row model."
        );

        expect(consoleErrorSpy).not.toHaveBeenCalled();

        consoleWarnSpy?.mockRestore();
        consoleErrorSpy?.mockRestore();

        const gridRowsOptions: GridRowsOptions = {
            checkDom: true,
            columns: true,
        };

        const gridRows = new GridRows(api, 'data', gridRowsOptions);
        await gridRows.check(`
            ROOT id:ROOT_NODE_ID
            ├── LEAF id:0 ag-Grid-AutoColumn:undefined x:1
            └── LEAF id:1 ag-Grid-AutoColumn:undefined x:2
        `);
    });
});
