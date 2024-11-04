import type { MockInstance } from 'vitest';

import { ClientSideRowModelModule } from 'ag-grid-community';
import type { GridOptions } from 'ag-grid-community';

import { GridRows, TestGridsManager } from '../../test-utils';

const getDataPath = (data: any) => data.orgHierarchy;

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
        const rowData = [
            { orgHierarchy: ['A'], x: 1 },
            { orgHierarchy: ['A', 'B'], x: 2 },
            { orgHierarchy: ['C', 'D'], x: 4 },
            { orgHierarchy: ['E', 'F', 'G', 'H'], x: 3 },
        ];

        const gridOptions: GridOptions = {
            columnDefs: [
                {
                    field: 'groupType',
                    valueGetter: (params) => (params.data ? 'Provided' : 'Filler'),
                },
                { field: 'x' },
            ],
            autoGroupColumnDef: {
                headerName: 'Organisation Hierarchy',
                cellRendererParams: { suppressCount: true },
            },
            treeData: true,
            animateRows: false,
            groupDefaultExpanded: -1,
            rowData,
            getDataPath,
        };

        consoleErrorSpy = vitest.spyOn(console, 'error').mockImplementation(() => {});
        consoleWarnSpy = vitest.spyOn(console, 'warn').mockImplementation(() => {});

        const api = gridsManager.createGrid('myGrid', gridOptions);

        expect(consoleWarnSpy).toHaveBeenCalledWith(
            'AG Grid: treeData is only available when TreeDataModule is loaded.'
        );

        expect(consoleErrorSpy).toHaveBeenCalled();

        consoleWarnSpy.mockRestore();
        consoleErrorSpy.mockRestore();

        const gridRowsOptions = {
            checkDom: true,
            columns: true,
            treeData: false,
        };

        const gridRows = new GridRows(api, 'data', gridRowsOptions);
        await gridRows.check(`
            ROOT id:ROOT_NODE_ID groupType:"Filler"
            ├── LEAF id:0 groupType:"Provided" x:1
            ├── LEAF id:1 groupType:"Provided" x:2
            ├── LEAF id:2 groupType:"Provided" x:4
            └── LEAF id:3 groupType:"Provided" x:3
        `);
    });
});
