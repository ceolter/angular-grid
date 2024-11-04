import type { RowDataTransaction } from 'ag-grid-community';
import { ClientSideRowModelModule } from 'ag-grid-community';
import { TreeDataModule } from 'ag-grid-enterprise';

import { GridRows, TestGridsManager, executeTransactionsAsync } from '../../test-utils';
import type { GridRowsOptions } from '../../test-utils';

const gridRowsOptions: GridRowsOptions = {
    checkDom: true,
};

describe('ag-grid tree transactions', () => {
    const gridsManager = new TestGridsManager({
        modules: [ClientSideRowModelModule, TreeDataModule],
    });

    beforeEach(() => {
        gridsManager.reset();
    });

    afterEach(() => {
        gridsManager.reset();
    });

    test('ag-grid tree sync complex transaction', async () => {
        const row0 = { id: '0', x: '0', path: ['A'] };
        const row1a = { id: '1', x: '1a', path: ['X', 'Y', 'Z'] };
        const row2 = { id: '2', x: '2', path: ['X', 'Y', 'Z', 'W'] };
        const row3 = { id: '3', x: '3', path: ['A', 'B'] };
        const row4 = { id: '4', x: '4', path: ['C', 'D'] };
        const row5a = { id: '5', x: '5a', path: ['X', 'Y', 'Z', 'H'] };

        const row1b = { id: '1', x: '1b', path: ['A', 'Y', 'Z'] };
        const row5b = { id: '5', x: '5b', path: ['C', 'E'] };

        const rowData = [row0, row1a];
        const transactions: RowDataTransaction[] = [
            { add: [row2] },
            { update: [row1b], add: [row3, row4] },
            { remove: [row1b], add: [row5a] },
            { remove: [row2], update: [row5b] },
        ];

        const api = gridsManager.createGrid('myGrid', {
            columnDefs: [{ field: 'x' }],
            autoGroupColumnDef: {
                headerName: 'Organisation Hierarchy',
                cellRendererParams: { suppressCount: true },
            },
            treeData: true,
            animateRows: false,
            groupDefaultExpanded: -1,
            rowData: rowData,
            getRowId: (params) => params.data.id,
            getDataPath: (data) => data.path,
        });

        let gridRows = new GridRows(api, 'rowData', gridRowsOptions);
        await gridRows.check(`
            ROOT id:ROOT_NODE_ID
            ├── A LEAF id:0
            └─┬ X filler id:row-group-0-X
            · └─┬ Y filler id:row-group-0-X-1-Y
            · · └── Z LEAF id:1
        `);
        expect(gridRows.rootAllLeafChildren.map((row) => row.data)).toEqual([row0, row1a]);

        api.applyTransaction(transactions[0]);

        gridRows = new GridRows(api, 'Transaction 0', gridRowsOptions);
        await gridRows.check(`
            ROOT id:ROOT_NODE_ID
            ├── A LEAF id:0
            └─┬ X filler id:row-group-0-X
            · └─┬ Y filler id:row-group-0-X-1-Y
            · · └─┬ Z GROUP id:1
            · · · └── W LEAF id:2
        `);
        expect(gridRows.rootAllLeafChildren.map((row) => row.data)).toEqual([row0, row1a, row2]);

        api.applyTransaction(transactions[1]);

        gridRows = new GridRows(api, 'Transaction 1', gridRowsOptions);
        await gridRows.check(`
            ROOT id:ROOT_NODE_ID
            ├─┬ A GROUP id:0
            │ ├─┬ Y filler id:row-group-0-A-1-Y
            │ │ └── Z LEAF id:1
            │ └── B LEAF id:3
            ├─┬ X filler id:row-group-0-X
            │ └─┬ Y filler id:row-group-0-X-1-Y
            │ · └─┬ Z filler id:row-group-0-X-1-Y-2-Z
            │ · · └── W LEAF id:2
            └─┬ C filler id:row-group-0-C
            · └── D LEAF id:4
        `);
        expect(gridRows.rootAllLeafChildren.map((row) => row.data)).toEqual([row0, row1b, row2, row3, row4]);

        api.applyTransaction(transactions[2]);

        gridRows = new GridRows(api, 'Transaction 2', gridRowsOptions);
        await gridRows.check(`
            ROOT id:ROOT_NODE_ID
            ├─┬ A GROUP id:0
            │ └── B LEAF id:3
            ├─┬ X filler id:row-group-0-X
            │ └─┬ Y filler id:row-group-0-X-1-Y
            │ · └─┬ Z filler id:row-group-0-X-1-Y-2-Z
            │ · · ├── W LEAF id:2
            │ · · └── H LEAF id:5
            └─┬ C filler id:row-group-0-C
            · └── D LEAF id:4
        `);
        expect(gridRows.rootAllLeafChildren.map((row) => row.data)).toEqual([row0, row2, row3, row4, row5a]);

        api.applyTransaction(transactions[3]);

        gridRows = new GridRows(api, 'final', gridRowsOptions);
        await gridRows.check(`
            ROOT id:ROOT_NODE_ID
            ├─┬ A GROUP id:0
            │ └── B LEAF id:3
            └─┬ C filler id:row-group-0-C
            · ├── D LEAF id:4
            · └── E LEAF id:5
        `);
        expect(gridRows.rootAllLeafChildren.map((row) => row.data)).toEqual([row0, row3, row4, row5b]);
    });

    test('ag-grid tree async complex transaction', async () => {
        const row0 = { id: '0', path: ['A'] };
        const row1a = { id: '1', path: ['X', 'Y', 'Z'] };
        const row2 = { id: '2', path: ['X', 'Y', 'Z', 'W'] };
        const row3 = { id: '3', path: ['A', 'B'] };
        const row4 = { id: '4', path: ['C', 'D'] };
        const row5a = { id: '5', path: ['X', 'Y', 'Z', 'H'] };

        const row1b = { id: '1', path: ['A', 'Y', 'Z'] };
        const row5b = { id: '5', path: ['C', 'E'] };

        const rowData = [row0, row1a];
        const transactions: RowDataTransaction[] = [
            { add: [row2] },
            { update: [row1b], add: [row3, row4] },
            { remove: [row1b], add: [row5a] },
            { remove: [row2], update: [row5b] },
        ];

        const api = gridsManager.createGrid('myGrid', {
            columnDefs: [],
            autoGroupColumnDef: {
                headerName: 'Organisation Hierarchy',
                cellRendererParams: { suppressCount: true },
            },
            treeData: true,
            animateRows: false,
            groupDefaultExpanded: -1,
            rowData: rowData,
            getRowId: (params) => params.data.id,
            getDataPath: (data) => data.path,
        });

        await new GridRows(api, 'rowData', gridRowsOptions).check(`
            ROOT id:ROOT_NODE_ID
            ├── A LEAF id:0
            └─┬ X filler id:row-group-0-X
            · └─┬ Y filler id:row-group-0-X-1-Y
            · · └── Z LEAF id:1
        `);

        await executeTransactionsAsync(transactions, api);

        const gridRows = new GridRows(api, 'final', gridRowsOptions);
        await gridRows.check(`
            ROOT id:ROOT_NODE_ID
            ├─┬ A GROUP id:0
            │ └── B LEAF id:3
            └─┬ C filler id:row-group-0-C
            · ├── D LEAF id:4
            · └── E LEAF id:5
        `);

        expect(gridRows.rowNodes.map((row) => row.data)).toEqual([row0, row3, undefined, row4, row5b]);
    });
});
