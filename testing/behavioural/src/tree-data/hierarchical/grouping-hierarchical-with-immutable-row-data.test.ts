import type { GridOptions } from 'ag-grid-community';
import { ClientSideRowModelModule } from 'ag-grid-community';
import { RowGroupingModule, TreeDataModule } from 'ag-grid-enterprise';

import type { GridRowsOptions } from '../../test-utils';
import { GridRows, TestGridsManager, cachedJSONObjects } from '../../test-utils';

describe('ag-grid grouping treeDataChildrenField with set immutable data', () => {
    const gridsManager = new TestGridsManager({
        modules: [ClientSideRowModelModule, RowGroupingModule, TreeDataModule],
    });

    beforeEach(() => {
        gridsManager.reset();
    });

    afterEach(() => {
        gridsManager.reset();
    });

    // TODO: this test is skipped because we do not handle delta update correctly in grouping yet, see https://ag-grid.atlassian.net/browse/AG-13507
    test.skip('grouping treeDataChildrenField with set immutable data', async () => {
        const gridOptions: GridOptions = {
            columnDefs: [
                { field: 'name' },
                { field: 'country', rowGroup: true, hide: true },
                { field: 'year', rowGroup: true, hide: true },
            ],
            ['treeDataChildrenField' as any]: 'children',
            groupDefaultExpanded: -1,
            getRowId: ({ data }) => data.id,
        };

        const api = gridsManager.createGrid('myGrid', gridOptions);

        api.setGridOption(
            'rowData',
            cachedJSONObjects.array([
                {
                    id: '0',
                    country: 'Ireland',
                    year: 2000,
                    name: 'John Von Neumann',
                    children: [
                        { id: '1', country: 'Ireland', year: 2000, name: 'Ada Lovelace' },
                        { id: '2', country: 'Ireland', year: 2001, name: 'Alan Turing' },
                    ],
                },
                {
                    id: '3',
                    country: 'Italy',
                    year: 2000,
                    name: 'Donald Knuth',
                    children: [{ id: '4', country: 'Italy', year: 2001, name: 'Marvin Minsky' }],
                },
            ])
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

        api.setGridOption(
            'rowData',
            cachedJSONObjects.array([
                {
                    id: '0',
                    country: 'Ireland',
                    year: 2000,
                    name: 'John Von Neumann',
                    children: [
                        { id: '1', country: 'Ireland', year: 2000, name: 'Ada Lovelace' },
                        { id: '2', country: 'Ireland', year: 2001, name: 'Alan Turing' },
                    ],
                },
                {
                    id: '3',
                    country: 'Italy',
                    year: 2000,
                    name: 'Donald Knuth',
                    children: [{ id: '4', country: 'Italy', year: 2000, name: 'Marvin Minsky' }],
                },
            ])
        );

        gridRows = new GridRows(api, 'update 1', gridRowsOptions);
        await gridRows.check(`
            ROOT id:ROOT_NODE_ID
            ├─┬ filler id:row-group-country-Ireland
            │ ├─┬ filler id:row-group-country-Ireland-year-2000
            │ │ ├── LEAF id:0 name:"John Von Neumann" country:"Ireland" year:2000
            │ │ └── LEAF id:1 name:"Ada Lovelace" country:"Ireland" year:2000
            │ └─┬ filler id:row-group-country-Ireland-year-2001
            │ · └── LEAF id:2 name:"Alan Turing" country:"Ireland" year:2001
            └─┬ filler id:row-group-country-Italy
            · └─┬ filler id:row-group-country-Italy-year-2000
            · · ├── LEAF id:3 name:"Donald Knuth" country:"Italy" year:2000
            · · └── LEAF id:4 name:"Marvin Minsky" country:"Italy" year:2000
        `);

        api.setGridOption(
            'rowData',
            cachedJSONObjects.array([
                {
                    id: '0',
                    country: 'Ireland',
                    year: 2000,
                    name: 'John Von Neumann',
                    children: [
                        { id: '1', country: 'Ireland', year: 2000, name: 'Ada Lovelace' },
                        { id: '2', country: 'Ireland', year: 2001, name: 'Alan Turing' },
                    ],
                },
                {
                    id: '3',
                    country: 'Italy',
                    year: 2000,
                    name: 'Donald Knuth',
                    children: [{ id: '4', country: 'Italy', year: 2001, name: 'Marvin Minsky' }],
                },
            ])
        );

        gridRows = new GridRows(api, 'update 2', gridRowsOptions);
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

        api.setGridOption(
            'rowData',
            cachedJSONObjects.array([
                {
                    id: '0',
                    country: 'Ireland',
                    year: 2000,
                    name: 'John Von Neumann',
                    children: [
                        { id: '1', country: 'Ireland', year: 2000, name: 'Ada Lovelace' },
                        { id: '2', country: 'Ireland', year: 2001, name: 'Alan Turing' },
                    ],
                },
                {
                    id: '3',
                    country: 'Italy',
                    year: 2000,
                    name: 'Donald Knuth',
                    children: [{ id: '4', country: 'Italy', year: 2001, name: 'Marvin Minsky' }],
                },
                { id: '6', country: 'Ireland', year: 2001, name: 'xxx' },
                { id: '5', country: 'Ireland', year: 2001, name: 'Grace Hopper' },
            ])
        );

        gridRows = new GridRows(api, 'add', gridRowsOptions);
        await gridRows.check(`
            ROOT id:ROOT_NODE_ID
            ├─┬ filler id:row-group-country-Ireland
            │ ├─┬ filler id:row-group-country-Ireland-year-2000
            │ │ ├── LEAF id:0 name:"John Von Neumann" country:"Ireland" year:2000
            │ │ └── LEAF id:1 name:"Ada Lovelace" country:"Ireland" year:2000
            │ └─┬ filler id:row-group-country-Ireland-year-2001
            │ · ├── LEAF id:2 name:"Alan Turing" country:"Ireland" year:2001
            │ · ├── LEAF id:6 name:"xxx" country:"Ireland" year:2001
            │ · └── LEAF id:5 name:"Grace Hopper" country:"Ireland" year:2001
            └─┬ filler id:row-group-country-Italy
            · ├─┬ filler id:row-group-country-Italy-year-2000
            · │ └── LEAF id:3 name:"Donald Knuth" country:"Italy" year:2000
            · └─┬ filler id:row-group-country-Italy-year-2001
            · · └── LEAF id:4 name:"Marvin Minsky" country:"Italy" year:2001
        `);

        api.setGridOption(
            'rowData',
            cachedJSONObjects.array([
                {
                    id: '0',
                    country: 'Ireland',
                    year: 2000,
                    name: 'John Von Neumann',
                    children: [
                        { id: '1', country: 'Ireland', year: 2000, name: 'Ada Lovelace' },
                        { id: '2', country: 'Ireland', year: 2001, name: 'Alan Turing' },
                    ],
                },
                {
                    id: '3',
                    country: 'Italy',
                    year: 2000,
                    name: 'Donald Knuth',
                    children: [{ id: '4', country: 'Italy', year: 2001, name: 'Marvin Minsky' }],
                },
                { id: '5', country: 'Ireland', year: 2001, name: 'Grace Hopper' },
            ])
        );

        gridRows = new GridRows(api, 'remove', gridRowsOptions);
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

        api.setGridOption(
            'rowData',
            cachedJSONObjects.array([
                {
                    id: '0',
                    country: 'Ireland',
                    year: 2000,
                    name: 'John Von Neumann',
                    children: [
                        { id: '1', country: 'Ireland', year: 1940, name: 'Ada Lovelace' },
                        { id: '2', country: 'Ireland', year: 2000, name: 'Alan M. Turing' },
                    ],
                },
                {
                    id: '3',
                    country: 'Italy',
                    year: 1940,
                    name: 'Donald Knuth',
                    children: [
                        { id: '4', country: 'Italy', year: 2001, name: 'Marvin Minsky' },
                        { id: '7', country: 'Ireland', year: 2000, name: 'New' },
                    ],
                },
            ])
        );

        gridRows = new GridRows(api, 'remove, update, add', gridRowsOptions);
        await gridRows.check(`
            ROOT id:ROOT_NODE_ID
            ├─┬ filler id:row-group-country-Ireland
            │ ├─┬ filler id:row-group-country-Ireland-year-2000
            │ │ ├── LEAF id:0 name:"John Von Neumann" country:"Ireland" year:2000
            │ │ ├── LEAF id:2 name:"Alan M. Turing" country:"Ireland" year:2000
            │ │ └── LEAF id:7 name:"New" country:"Ireland" year:2000
            │ └─┬ filler id:row-group-country-Ireland-year-1940
            │ · └── LEAF id:1 name:"Ada Lovelace" country:"Ireland" year:1940
            └─┬ filler id:row-group-country-Italy
            · ├─┬ filler id:row-group-country-Italy-year-2001
            · │ └── LEAF id:4 name:"Marvin Minsky" country:"Italy" year:2001
            · └─┬ filler id:row-group-country-Italy-year-1940
            · · └── LEAF id:3 name:"Donald Knuth" country:"Italy" year:1940
        `);

        api.setGridOption(
            'rowData',
            cachedJSONObjects.array([
                { id: '7', country: 'Germany', year: 1900, name: 'unknown X' },
                {
                    id: '5',
                    country: 'Italy',
                    year: 1940,
                    name: 'Grace Brewster Murray Hopper',
                    children: [
                        { id: '2', country: 'Ireland', year: 1940, name: 'Alan M. Turing' },
                        { id: '8', country: 'Germany', year: 1900, name: 'unknown Y' },
                        { id: '4', country: 'Italy', year: 1940, name: 'Marvin Minsky' },
                        { id: '1', country: 'Ireland', year: 2000, name: 'Ada Lovelace' },
                    ],
                },
                { id: '0', country: 'Ireland', year: 2000, name: 'John Von Neumann' },
            ])
        );

        gridRows = new GridRows(api, 'update, reorder', gridRowsOptions);
        await gridRows.check(`
            ROOT id:ROOT_NODE_ID
            ├─┬ filler id:row-group-country-Ireland
            │ ├─┬ filler id:row-group-country-Ireland-year-2000
            │ │ ├── LEAF id:1 name:"Ada Lovelace" country:"Ireland" year:2000
            │ │ └── LEAF id:0 name:"John Von Neumann" country:"Ireland" year:2000
            │ └─┬ filler id:row-group-country-Ireland-year-1940
            │ · └── LEAF id:2 name:"Alan M. Turing" country:"Ireland" year:1940
            ├─┬ filler id:row-group-country-Italy
            │ └─┬ filler id:row-group-country-Italy-year-1940
            │ · ├── LEAF id:5 name:"Grace Brewster Murray Hopper" country:"Italy" year:1940
            │ · └── LEAF id:4 name:"Marvin Minsky" country:"Italy" year:1940
            └─┬ filler id:row-group-country-Germany
            · └─┬ filler id:row-group-country-Germany-year-1900
            · · ├── LEAF id:7 name:"unknown X" country:"Germany" year:1900
            · · └── LEAF id:8 name:"unknown Y" country:"Germany" year:1900
        `);

        api.setGridOption('rowData', []);

        gridRows = new GridRows(api, 'clear', gridRowsOptions);
        await gridRows.check('empty');
    });

    // TODO: this test is skipped because we do not handle delta update correctly in grouping yet, see https://ag-grid.atlassian.net/browse/AG-13507
    test.skip('expanded state is preserved correctly', async () => {
        const gridOptions: GridOptions = {
            columnDefs: [
                { field: 'name' },
                { field: 'country', rowGroup: true, hide: true },
                { field: 'year', rowGroup: true, hide: true },
            ],
            rowData: cachedJSONObjects.array([
                {
                    id: '0',
                    country: 'Ireland',
                    year: 2000,
                    name: 'John Von Neumann',
                    children: [{ id: '2', country: 'Ireland', year: 2001, name: 'Alan Turing' }],
                },
                {
                    id: '1',
                    country: 'Ireland',
                    year: 2000,
                    name: 'Ada Lovelace',
                    children: [{ id: '3', country: 'Italy', year: 2000, name: 'Donald Knuth' }],
                },
                { id: '4', country: 'Italy', year: 2001, name: 'Marvin Minsky' },
            ]),
            ['treeDataChildrenField' as any]: 'children',
            groupDefaultExpanded: 0,
            getRowId: ({ data }) => data.id,
        };

        const api = gridsManager.createGrid('myGrid', gridOptions);

        api.forEachNode((node) => {
            if (node.id !== 'row-group-country-Ireland') {
                api.setRowNodeExpanded(node, true, false, true);
            }
        });

        const gridRowsOptions: GridRowsOptions = {
            columns: ['country', 'year', 'name'],
            printHiddenRows: true,
            checkDom: true,
        };

        let gridRows = new GridRows(api, 'first', gridRowsOptions);

        await gridRows.check(`
            ROOT id:ROOT_NODE_ID
            ├─┬ filler collapsed id:row-group-country-Ireland
            │ ├─┬ filler hidden id:row-group-country-Ireland-year-2000
            │ │ ├── LEAF hidden id:0 name:"John Von Neumann" country:"Ireland" year:2000
            │ │ └── LEAF hidden id:1 name:"Ada Lovelace" country:"Ireland" year:2000
            │ └─┬ filler hidden id:row-group-country-Ireland-year-2001
            │ · └── LEAF hidden id:2 name:"Alan Turing" country:"Ireland" year:2001
            └─┬ filler id:row-group-country-Italy
            · ├─┬ filler id:row-group-country-Italy-year-2000
            · │ └── LEAF id:3 name:"Donald Knuth" country:"Italy" year:2000
            · └─┬ filler id:row-group-country-Italy-year-2001
            · · └── LEAF id:4 name:"Marvin Minsky" country:"Italy" year:2001
        `);

        api.setGridOption(
            'rowData',
            cachedJSONObjects.array([
                {
                    id: '0',
                    country: 'Ireland',
                    year: 2000,
                    name: 'John Von Neumann',
                    children: [{ id: '2', country: 'Ireland', year: 2001, name: 'Alan Turing' }],
                },
                {
                    id: '1',
                    country: 'Ireland',
                    year: 2000,
                    name: 'Ada Lovelace',
                    children: [{ id: '3', country: 'Italy', year: 2000, name: 'Donald Knuth' }],
                },
                { id: '4', country: 'Italy', year: 2001, name: 'Marvin Minsky the second' },
            ])
        );

        gridRows = new GridRows(api, 'first', gridRowsOptions);
        await gridRows.check(`
            ROOT id:ROOT_NODE_ID
            ├─┬ filler collapsed id:row-group-country-Ireland
            │ ├─┬ filler hidden id:row-group-country-Ireland-year-2000
            │ │ ├── LEAF hidden id:0 name:"John Von Neumann" country:"Ireland" year:2000
            │ │ └── LEAF hidden id:1 name:"Ada Lovelace" country:"Ireland" year:2000
            │ └─┬ filler hidden id:row-group-country-Ireland-year-2001
            │ · └── LEAF hidden id:2 name:"Alan Turing" country:"Ireland" year:2001
            └─┬ filler id:row-group-country-Italy
            · ├─┬ filler id:row-group-country-Italy-year-2000
            · │ └── LEAF id:3 name:"Donald Knuth" country:"Italy" year:2000
            · └─┬ filler id:row-group-country-Italy-year-2001
            · · └── LEAF id:4 name:"Marvin Minsky the second" country:"Italy" year:2001
        `);

        api.setGridOption(
            'rowData',
            cachedJSONObjects.array([
                {
                    id: '0',
                    country: 'Ireland',
                    year: 2000,
                    name: 'John Von Neumann',
                    children: [{ id: '2', country: 'Italy', year: 2001, name: 'Alan Turing' }],
                },
                {
                    id: '1',
                    country: 'Ireland',
                    year: 2000,
                    name: 'Ada Lovelace',
                    children: [{ id: '3', country: 'Italy', year: 2000, name: 'Donald Knuth' }],
                },
                { id: '4', country: 'Italy', year: 2001, name: 'Marvin Minsky the second' },
            ])
        );

        gridRows = new GridRows(api, 'first', gridRowsOptions);
        await gridRows.check(`
            ROOT id:ROOT_NODE_ID
            ├─┬ filler collapsed id:row-group-country-Ireland
            │ └─┬ filler hidden id:row-group-country-Ireland-year-2000
            │ · ├── LEAF hidden id:0 name:"John Von Neumann" country:"Ireland" year:2000
            │ · └── LEAF hidden id:1 name:"Ada Lovelace" country:"Ireland" year:2000
            └─┬ filler id:row-group-country-Italy
            · ├─┬ filler id:row-group-country-Italy-year-2000
            · │ └── LEAF id:3 name:"Donald Knuth" country:"Italy" year:2000
            · └─┬ filler id:row-group-country-Italy-year-2001
            · · ├── LEAF id:4 name:"Marvin Minsky the second" country:"Italy" year:2001
            · · └── LEAF id:2 name:"Alan Turing" country:"Italy" year:2001
        `);
    });
});
