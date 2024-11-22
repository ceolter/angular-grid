import type { GridOptions } from 'ag-grid-community';
import { ClientSideRowModelModule } from 'ag-grid-community';
import { RowGroupingModule } from 'ag-grid-enterprise';

import type { GridRowsOptions } from '../test-utils';
import { GridRows, TestGridsManager, executeTransactionsAsync } from '../test-utils';

describe('ag-grid grouping with transactions', () => {
    const gridsManager = new TestGridsManager({
        modules: [ClientSideRowModelModule, RowGroupingModule],
    });

    beforeEach(() => {
        gridsManager.reset();
    });

    afterEach(() => {
        gridsManager.reset();
    });

    test('grouping with transactions', async () => {
        const gridOptions: GridOptions = {
            columnDefs: [
                { field: 'name' },
                { field: 'country', rowGroup: true, hide: true },
                { field: 'year', rowGroup: true, hide: true },
            ],
            groupDefaultExpanded: -1,
            getRowId: ({ data }) => data.id,
        };

        const api = gridsManager.createGrid('myGrid', gridOptions);

        api.applyTransaction({
            add: [
                { id: '0', country: 'Ireland', year: 2000, name: 'John Von Neumann' },
                { id: '1', country: 'Ireland', year: 2000, name: 'Ada Lovelace' },
                { id: '2', country: 'Ireland', year: 2001, name: 'Alan Turing' },
                { id: '3', country: 'Italy', year: 2000, name: 'Donald Knuth' },
                { id: '4', country: 'Italy', year: 2001, name: 'Marvin Minsky' },
            ],
        });

        const gridRowsOptions: GridRowsOptions = {
            columns: ['country', 'year', 'name'],
            printHiddenRows: true,
            checkDom: true,
        };

        let gridRows = new GridRows(api, 'first', gridRowsOptions);

        await gridRows.check(`
            ROOT id:ROOT_NODE_ID
            ├─┬ filler id:row-group-country-Ireland
            │ ├─┬ filler id:row-group-country-Ireland-year-2000
            │ │ ├── LEAF id:0 name:"John Von Neumann" country:"Ireland" year:2000
            │ │ └── LEAF id:1 name:"Ada Lovelace" country:"Ireland" year:2000
            │ └─┬ filler id:row-group-country-Ireland-year-2001
            │ · └── LEAF id:2 name:"Alan Turing" country:"Ireland" year:2001
            └─┬ filler id:row-group-country-Italy
            · ├─┬ filler id:row-group-country-Italy-year-2000
            · │ └── LEAF id:3 name:"Donald Knuth" country:"Italy" year:2000
            · └─┬ filler id:row-group-country-Italy-year-2001
            · · └── LEAF id:4 name:"Marvin Minsky" country:"Italy" year:2001
        `);

        api.applyTransaction({ add: [{ id: '5', country: 'Ireland', year: 2001, name: 'Grace Hopper' }] });

        gridRows = new GridRows(api, 'add', gridRowsOptions);

        await gridRows.check(`
            ROOT id:ROOT_NODE_ID
            ├─┬ filler id:row-group-country-Ireland
            │ ├─┬ filler id:row-group-country-Ireland-year-2000
            │ │ ├── LEAF id:0 name:"John Von Neumann" country:"Ireland" year:2000
            │ │ └── LEAF id:1 name:"Ada Lovelace" country:"Ireland" year:2000
            │ └─┬ filler id:row-group-country-Ireland-year-2001
            │ · ├── LEAF id:2 name:"Alan Turing" country:"Ireland" year:2001
            │ · └── LEAF id:5 name:"Grace Hopper" country:"Ireland" year:2001
            └─┬ filler id:row-group-country-Italy
            · ├─┬ filler id:row-group-country-Italy-year-2000
            · │ └── LEAF id:3 name:"Donald Knuth" country:"Italy" year:2000
            · └─┬ filler id:row-group-country-Italy-year-2001
            · · └── LEAF id:4 name:"Marvin Minsky" country:"Italy" year:2001
        `);

        api.applyTransaction({
            remove: [{ id: '3' }],
            update: [
                { id: '2', country: 'Italy', year: 1940, name: 'Alan M. Turing' },
                { id: '5', country: 'Italy', year: 1940, name: 'Grace Brewster Murray Hopper' },
            ],
            add: [{ id: '6', country: 'Italy', year: 1940, name: 'unknown' }],
        });

        gridRows = new GridRows(api, 'remove, update, add', gridRowsOptions);
        await gridRows.check(`
            ROOT id:ROOT_NODE_ID
            ├─┬ filler id:row-group-country-Ireland
            │ └─┬ filler id:row-group-country-Ireland-year-2000
            │ · ├── LEAF id:0 name:"John Von Neumann" country:"Ireland" year:2000
            │ · └── LEAF id:1 name:"Ada Lovelace" country:"Ireland" year:2000
            └─┬ filler id:row-group-country-Italy
            · ├─┬ filler id:row-group-country-Italy-year-2001
            · │ └── LEAF id:4 name:"Marvin Minsky" country:"Italy" year:2001
            · └─┬ filler id:row-group-country-Italy-year-1940
            · · ├── LEAF id:2 name:"Alan M. Turing" country:"Italy" year:1940
            · · ├── LEAF id:5 name:"Grace Brewster Murray Hopper" country:"Italy" year:1940
            · · └── LEAF id:6 name:"unknown" country:"Italy" year:1940
        `);

        await executeTransactionsAsync(
            [
                {
                    remove: [{ id: '6' }],
                    add: [{ id: '6', country: 'Italy', year: 1900, name: 'unknown 2' }],
                },
                {
                    update: [{ id: '6', country: 'Italy', year: 1901, name: 'unknown 3' }],
                },
            ],
            api
        );

        gridRows = new GridRows(api, 'async transaction 1', gridRowsOptions);
        await gridRows.check(`
            ROOT id:ROOT_NODE_ID
            ├─┬ filler id:row-group-country-Ireland
            │ └─┬ filler id:row-group-country-Ireland-year-2000
            │ · ├── LEAF id:0 name:"John Von Neumann" country:"Ireland" year:2000
            │ · └── LEAF id:1 name:"Ada Lovelace" country:"Ireland" year:2000
            └─┬ filler id:row-group-country-Italy
            · ├─┬ filler id:row-group-country-Italy-year-2001
            · │ └── LEAF id:4 name:"Marvin Minsky" country:"Italy" year:2001
            · ├─┬ filler id:row-group-country-Italy-year-1940
            · │ ├── LEAF id:2 name:"Alan M. Turing" country:"Italy" year:1940
            · │ └── LEAF id:5 name:"Grace Brewster Murray Hopper" country:"Italy" year:1940
            · └─┬ filler id:row-group-country-Italy-year-1901
            · · └── LEAF id:6 name:"unknown 3" country:"Italy" year:1901
        `);

        await executeTransactionsAsync(
            [
                {
                    remove: [{ id: '6' }],
                    add: [{ id: '6', country: 'Italy', year: 1900, name: 'unknown 4' }],
                },
                {
                    remove: [{ id: '6' }],
                    update: [{ id: '2', country: 'Italy', year: 1950, name: 'unknown 5' }],
                    add: [{ id: '6', country: 'Italy', year: 1901, name: 'unknown 5' }],
                },
                {
                    remove: [{ id: '6' }],
                    add: [{ id: '6', country: 'Germany', year: 1902, name: 'unknown 6' }],
                },
            ],
            api
        );

        gridRows = new GridRows(api, 'async transaction 2', gridRowsOptions);
        await gridRows.check(`
            ROOT id:ROOT_NODE_ID
            ├─┬ filler id:row-group-country-Ireland
            │ └─┬ filler id:row-group-country-Ireland-year-2000
            │ · ├── LEAF id:0 name:"John Von Neumann" country:"Ireland" year:2000
            │ · └── LEAF id:1 name:"Ada Lovelace" country:"Ireland" year:2000
            ├─┬ filler id:row-group-country-Italy
            │ ├─┬ filler id:row-group-country-Italy-year-2001
            │ │ └── LEAF id:4 name:"Marvin Minsky" country:"Italy" year:2001
            │ ├─┬ filler id:row-group-country-Italy-year-1940
            │ │ └── LEAF id:5 name:"Grace Brewster Murray Hopper" country:"Italy" year:1940
            │ └─┬ filler id:row-group-country-Italy-year-1950
            │ · └── LEAF id:2 name:"unknown 5" country:"Italy" year:1950
            └─┬ filler id:row-group-country-Germany
            · └─┬ filler id:row-group-country-Germany-year-1902
            · · └── LEAF id:6 name:"unknown 6" country:"Germany" year:1902
        `);
    });

    test('can change an entire group with async transactions', async () => {
        const gridOptions: GridOptions = {
            columnDefs: [
                { field: 'name' },
                { field: 'country', rowGroup: true, hide: true },
                { field: 'year', rowGroup: true, hide: true },
            ],
            groupDefaultExpanded: -1,
            getRowId: ({ data }) => data.id,
        };

        const api = gridsManager.createGrid('myGrid', gridOptions);

        await executeTransactionsAsync(
            [
                {
                    add: [
                        { id: '0', country: 'Ireland', year: 2000, name: 'John Von Neumann' },
                        { id: '1', country: 'Ireland', year: 2000, name: 'Ada Lovelace' },
                    ],
                },
                {
                    add: [
                        { id: '2', country: 'Ireland', year: 2001, name: 'Alan Turing' },
                        { id: '3', country: 'Italy', year: 2000, name: 'Donald Knuth' },
                        { id: '4', country: 'Italy', year: 2001, name: 'Marvin Minsky' },
                    ],
                },
            ],
            api
        );

        const gridRowsOptions: GridRowsOptions = {
            columns: ['country', 'year', 'name'],
            printHiddenRows: true,
            checkDom: true,
        };

        let gridRows = new GridRows(api, 'first', gridRowsOptions);

        await gridRows.check(`
            ROOT id:ROOT_NODE_ID
            ├─┬ filler id:row-group-country-Ireland
            │ ├─┬ filler id:row-group-country-Ireland-year-2000
            │ │ ├── LEAF id:0 name:"John Von Neumann" country:"Ireland" year:2000
            │ │ └── LEAF id:1 name:"Ada Lovelace" country:"Ireland" year:2000
            │ └─┬ filler id:row-group-country-Ireland-year-2001
            │ · └── LEAF id:2 name:"Alan Turing" country:"Ireland" year:2001
            └─┬ filler id:row-group-country-Italy
            · ├─┬ filler id:row-group-country-Italy-year-2000
            · │ └── LEAF id:3 name:"Donald Knuth" country:"Italy" year:2000
            · └─┬ filler id:row-group-country-Italy-year-2001
            · · └── LEAF id:4 name:"Marvin Minsky" country:"Italy" year:2001
        `);

        await executeTransactionsAsync(
            [
                {
                    update: [{ id: '0', country: 'Germany', year: 2000, name: 'John Von Neumann' }],
                },
                {
                    update: [
                        { id: '2', country: 'Germany', year: 2001, name: 'Alan Turing' },
                        { id: '1', country: 'Germany', year: 2000, name: 'Ada Lovelace' },
                    ],
                },
            ],
            api
        );

        gridRows = new GridRows(api, 'update 1', gridRowsOptions);
        await gridRows.check(`
            ROOT id:ROOT_NODE_ID
            ├─┬ filler id:row-group-country-Italy
            │ ├─┬ filler id:row-group-country-Italy-year-2000
            │ │ └── LEAF id:3 name:"Donald Knuth" country:"Italy" year:2000
            │ └─┬ filler id:row-group-country-Italy-year-2001
            │ · └── LEAF id:4 name:"Marvin Minsky" country:"Italy" year:2001
            └─┬ filler id:row-group-country-Germany
            · ├─┬ filler id:row-group-country-Germany-year-2000
            · │ ├── LEAF id:0 name:"John Von Neumann" country:"Germany" year:2000
            · │ └── LEAF id:1 name:"Ada Lovelace" country:"Germany" year:2000
            · └─┬ filler id:row-group-country-Germany-year-2001
            · · └── LEAF id:2 name:"Alan Turing" country:"Germany" year:2001
        `);
    });

    test('grouping data with complex batch transactions', async () => {
        const gridOptions: GridOptions = {
            columnDefs: [
                { field: 'name' },
                { field: 'country', rowGroup: true, hide: true },
                { field: 'year', rowGroup: true, hide: true },
            ],
            groupDefaultExpanded: -1,
            getRowId: ({ data }) => data.id,
        };

        const api = gridsManager.createGrid('myGrid', gridOptions);

        await executeTransactionsAsync(
            [
                {
                    add: [
                        { id: '0', country: 'Ireland', year: 2000, name: 'John Von Neumann' },
                        { id: '1', country: 'Ireland', year: 2000, name: 'Ada Lovelace' },
                        { id: '2', country: 'Ireland', year: 2001, name: 'Alan Turing' },
                    ],
                },
                {
                    add: [
                        { id: '3', country: 'Italy', year: 2000, name: 'Donald Knuth' },
                        { id: '4', country: 'Italy', year: 2001, name: 'Marvin Minsky' },
                    ],
                },
            ],
            api
        );

        const gridRowsOptions: GridRowsOptions = {
            columns: ['country', 'year', 'name'],
            printHiddenRows: true,
            checkDom: true,
        };
        let gridRows = new GridRows(api, 'first', gridRowsOptions);
        await gridRows.check(`
            ROOT id:ROOT_NODE_ID
            ├─┬ filler id:row-group-country-Ireland
            │ ├─┬ filler id:row-group-country-Ireland-year-2000
            │ │ ├── LEAF id:0 name:"John Von Neumann" country:"Ireland" year:2000
            │ │ └── LEAF id:1 name:"Ada Lovelace" country:"Ireland" year:2000
            │ └─┬ filler id:row-group-country-Ireland-year-2001
            │ · └── LEAF id:2 name:"Alan Turing" country:"Ireland" year:2001
            └─┬ filler id:row-group-country-Italy
            · ├─┬ filler id:row-group-country-Italy-year-2000
            · │ └── LEAF id:3 name:"Donald Knuth" country:"Italy" year:2000
            · └─┬ filler id:row-group-country-Italy-year-2001
            · · └── LEAF id:4 name:"Marvin Minsky" country:"Italy" year:2001
        `);

        await executeTransactionsAsync(
            [
                { add: [{ id: '5', country: 'Germany', year: 2001, name: 'Grace Hopper' }] },
                { update: [{ id: '5', country: 'Germany', year: 2002, name: 'Grace Hopper 2' }] },
                { remove: [{ id: '5' }] },
                { add: [{ id: '5', country: 'Germany', year: 2001, name: 'Grace Hopper 3' }] },
                { update: [{ id: '5', country: 'Italy', year: 1980, name: 'Grace Hopper 4' }] },
                { remove: [{ id: '5' }] },
                { update: [{ id: '0', country: 'Switzerland', year: 2000, name: 'John Von Neumann' }] },
                { add: [{ id: '5', country: 'Italy', year: 2001, name: 'Grace Hopper 5' }] },
                { update: [{ id: '5', country: 'Italy', year: 2000, name: 'Grace Hopper 6' }] },
            ],
            api
        );

        gridRows = new GridRows(api, 'transaction 1', gridRowsOptions);
        await gridRows.check(`
            ROOT id:ROOT_NODE_ID
            ├─┬ filler id:row-group-country-Ireland
            │ ├─┬ filler id:row-group-country-Ireland-year-2000
            │ │ └── LEAF id:1 name:"Ada Lovelace" country:"Ireland" year:2000
            │ └─┬ filler id:row-group-country-Ireland-year-2001
            │ · └── LEAF id:2 name:"Alan Turing" country:"Ireland" year:2001
            ├─┬ filler id:row-group-country-Italy
            │ ├─┬ filler id:row-group-country-Italy-year-2000
            │ │ ├── LEAF id:3 name:"Donald Knuth" country:"Italy" year:2000
            │ │ └── LEAF id:5 name:"Grace Hopper 6" country:"Italy" year:2000
            │ └─┬ filler id:row-group-country-Italy-year-2001
            │ · └── LEAF id:4 name:"Marvin Minsky" country:"Italy" year:2001
            └─┬ filler id:row-group-country-Switzerland
            · └─┬ filler id:row-group-country-Switzerland-year-2000
            · · └── LEAF id:0 name:"John Von Neumann" country:"Switzerland" year:2000
        `);

        await executeTransactionsAsync(
            [
                {
                    update: [
                        { id: '0', country: 'Germany', year: 3000, name: 'John Von Neumann' },
                        { id: '1', country: 'Germany', year: 3000, name: 'Ada Lovelace' },
                    ],
                },
                { update: [{ id: '5', country: 'Switzerland', year: 1999, name: 'to remove' }] },
                { remove: [{ id: '5' }] },
                { update: [{ id: '2', country: 'Germany', year: 3000, name: 'Alan Turing' }] },
                {
                    add: [
                        { id: '6', country: 'Germany', year: 3000, name: 'Albert Einstein' },
                        { id: '5', country: 'Germany', year: 3000, name: 'added' },
                    ],
                },
            ],
            api
        );

        gridRows = new GridRows(api, 'transaction 2', gridRowsOptions);
        await gridRows.check(`
            ROOT id:ROOT_NODE_ID
            ├─┬ filler id:row-group-country-Italy
            │ ├─┬ filler id:row-group-country-Italy-year-2000
            │ │ └── LEAF id:3 name:"Donald Knuth" country:"Italy" year:2000
            │ └─┬ filler id:row-group-country-Italy-year-2001
            │ · └── LEAF id:4 name:"Marvin Minsky" country:"Italy" year:2001
            └─┬ filler id:row-group-country-Germany
            · └─┬ filler id:row-group-country-Germany-year-3000
            · · ├── LEAF id:0 name:"John Von Neumann" country:"Germany" year:3000
            · · ├── LEAF id:1 name:"Ada Lovelace" country:"Germany" year:3000
            · · ├── LEAF id:2 name:"Alan Turing" country:"Germany" year:3000
            · · ├── LEAF id:6 name:"Albert Einstein" country:"Germany" year:3000
            · · └── LEAF id:5 name:"added" country:"Germany" year:3000
        `);

        await executeTransactionsAsync(
            [
                {
                    update: [
                        { id: '4', country: 'Germany', year: 2001, name: 'Marvin Minsky' },
                        { id: '1', country: 'Germany', year: 2000, name: 'Ada Lovelace' },
                        { id: '3', country: 'Germany', year: 2000, name: 'Donald Knuth' },
                    ],
                },
                {
                    remove: [{ id: '0' }],
                    update: [{ id: '2', country: 'Germany', year: 2001, name: 'Alan Turing' }],
                },
            ],
            api
        );

        gridRows = new GridRows(api, 'transaction 2', gridRowsOptions);
        await gridRows.check(`
            ROOT id:ROOT_NODE_ID
            └─┬ filler id:row-group-country-Germany
            · ├─┬ filler id:row-group-country-Germany-year-3000
            · │ ├── LEAF id:6 name:"Albert Einstein" country:"Germany" year:3000
            · │ └── LEAF id:5 name:"added" country:"Germany" year:3000
            · ├─┬ filler id:row-group-country-Germany-year-2001
            · │ ├── LEAF id:4 name:"Marvin Minsky" country:"Germany" year:2001
            · │ └── LEAF id:2 name:"Alan Turing" country:"Germany" year:2001
            · └─┬ filler id:row-group-country-Germany-year-2000
            · · ├── LEAF id:1 name:"Ada Lovelace" country:"Germany" year:2000
            · · └── LEAF id:3 name:"Donald Knuth" country:"Germany" year:2000
        `);
    });
});
