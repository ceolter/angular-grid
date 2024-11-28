import type { MockInstance } from 'vitest';

import { ClientSideRowModelModule } from 'ag-grid-community';
import type { GridOptions } from 'ag-grid-community';
import { TreeDataModule } from 'ag-grid-enterprise';

import { GridRows, TestGridsManager, asyncSetTimeout, getRowsSnapshot } from '../../test-utils';
import type { GridRowsOptions, RowSnapshot } from '../../test-utils';
import { simpleHierarchyRowsSnapshot } from './simpleHierarchyRowsSnapshot';

const getDataPath = (data: any) => data.orgHierarchy;

describe('ag-grid tree data', () => {
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

    test('ag-grid tree data loading and no-show overlay', async () => {
        const rowData = [
            { orgHierarchy: ['A'] },
            { orgHierarchy: ['A', 'B'] },
            { orgHierarchy: ['C', 'D'] },
            { orgHierarchy: ['E', 'F', 'G', 'H'] },
        ];

        const gridOptions: GridOptions = {
            columnDefs: [
                {
                    field: 'groupType',
                    valueGetter: (params) => (params.data ? 'Provided' : 'Filler'),
                },
            ],
            autoGroupColumnDef: {
                headerName: 'Organisation Hierarchy',
                cellRendererParams: { suppressCount: true },
            },
            treeData: true,
            animateRows: false,
            groupDefaultExpanded: -1,
            getDataPath,
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

    test('ag-grid tree data', async () => {
        const rowData = [
            { orgHierarchy: ['A'] },
            { orgHierarchy: ['A', 'B'] },
            { orgHierarchy: ['C', 'D'] },
            { orgHierarchy: ['E', 'F', 'G', 'H'] },
        ];

        const gridOptions: GridOptions = {
            columnDefs: [
                {
                    field: 'groupType',
                    valueGetter: (params) => (params.data ? 'Provided' : 'Filler'),
                },
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

        const api = gridsManager.createGrid('myGrid', gridOptions);

        const gridRowsOptions: GridRowsOptions = {
            checkDom: true,
        };

        const gridRows = new GridRows(api, 'data', gridRowsOptions);
        await gridRows.check(`
            ROOT id:ROOT_NODE_ID
            ├─┬ A GROUP id:0
            │ └── B LEAF id:1
            ├─┬ C filler id:row-group-0-C
            │ └── D LEAF id:2
            └─┬ E filler id:row-group-0-E
            · └─┬ F filler id:row-group-0-E-1-F
            · · └─┬ G filler id:row-group-0-E-1-F-2-G
            · · · └── H LEAF id:3
        `);

        const rows = gridRows.rowNodes;
        expect(rows[0].data).toEqual(rowData[0]);
        expect(rows[1].data).toEqual(rowData[1]);
        expect(rows[2].data).toEqual(undefined);
        expect(rows[3].data).toEqual(rowData[2]);
        expect(rows[4].data).toEqual(undefined);
        expect(rows[5].data).toEqual(undefined);
        expect(rows[6].data).toEqual(undefined);
        expect(rows[7].data).toEqual(rowData[3]);

        const rowsSnapshot = getRowsSnapshot(rows);
        expect(rowsSnapshot).toMatchObject(simpleHierarchyRowsSnapshot());
    });

    test('ag-grid tree data with inverted order', async () => {
        const rowData = [
            { orgHierarchy: ['A', 'B'] },
            { orgHierarchy: ['C', 'D', 'E'] },
            { orgHierarchy: ['A'] },
            { orgHierarchy: ['C', 'D'] },
        ];

        const gridOptions: GridOptions = {
            columnDefs: [
                {
                    field: 'groupType',
                    valueGetter: (params) => (params.data ? 'Provided' : 'Filler'),
                },
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

        const api = gridsManager.createGrid('myGrid', gridOptions);

        const gridRowsOptions: GridRowsOptions = {
            checkDom: true,
        };

        const gridRows = new GridRows(api, 'data', gridRowsOptions);
        await gridRows.check(`
            ROOT id:ROOT_NODE_ID
            ├─┬ A GROUP id:2
            │ └── B LEAF id:0
            └─┬ C filler id:row-group-0-C
            · └─┬ D GROUP id:3
            · · └── E LEAF id:1
        `);

        const rows = gridRows.rowNodes;
        const rowsSnapshot = getRowsSnapshot(rows);

        expect(rows[0].data).toEqual(rowData[2]);
        expect(rows[1].data).toEqual(rowData[0]);
        expect(rows[2].data).toEqual(undefined);
        expect(rows[3].data).toEqual(rowData[3]);
        expect(rows[4].data).toEqual(rowData[1]);

        const expectedSnapshot: RowSnapshot[] = hierarchyWithInvertedOrderRowSnapshot();

        expect(rowsSnapshot).toMatchObject(expectedSnapshot);
    });

    test('ag-grid override tree data is insensitive to updateGridOptions object order', async () => {
        // see https://ag-grid.atlassian.net/browse/AG-13089 - Order of grouped property listener changed is not deterministic
        const rowData0 = [
            { orgHierarchy: ['A', 'B'], x: 'B' },
            { orgHierarchy: ['C', 'D', 'E'], x: 'E' },
            { orgHierarchy: ['A'], x: 'A' },
            { orgHierarchy: ['C', 'D'], x: 'D' },
        ];

        const rowData1 = [
            { orgHierarchy: ['A', 'B'], x: 'b' },
            { orgHierarchy: ['C', 'D', 'E'], x: 'e' },
            { orgHierarchy: ['A'], x: 'a' },
            { orgHierarchy: ['C', 'D'], x: 'd' },
        ];

        const api = gridsManager.createGrid('myGrid', {
            columnDefs: [{ field: 'x' }],
            treeData: false,
            getDataPath: (data) => data.orgHierarchy,
            animateRows: false,
            groupDefaultExpanded: -1,
            rowData: rowData0,
        });

        console.log('\nUPDATE rowData and treeData together\n');

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
            ├─┬ A GROUP id:2 ag-Grid-AutoColumn:"A" x:"a"
            │ └── B LEAF id:0 ag-Grid-AutoColumn:"B" x:"b"
            └─┬ C filler id:row-group-0-C ag-Grid-AutoColumn:"C"
            · └─┬ D GROUP id:3 ag-Grid-AutoColumn:"D" x:"d"
            · · └── E LEAF id:1 ag-Grid-AutoColumn:"E" x:"e"
        `);
    });
});

function hierarchyWithInvertedOrderRowSnapshot(): RowSnapshot[] {
    return [
        {
            allChildrenCount: 1,
            allLeafChildren: ['B'],
            childIndex: 0,
            childrenAfterFilter: ['B'],
            childrenAfterGroup: ['B'],
            childrenAfterSort: ['B'],
            detail: undefined,
            displayed: true,
            expanded: true,
            firstChild: true,
            footer: undefined,
            group: true,
            groupData: { 'ag-Grid-AutoColumn': 'A' },
            id: '2',
            key: 'A',
            lastChild: false,
            leafGroup: undefined,
            level: 0,
            master: false,
            parentKey: null,
            rowGroupIndex: undefined,
            rowPinned: undefined,
            selectable: true,
            siblingKey: undefined,
            uiLevel: 0,
            rowIndex: 0,
        },
        {
            allChildrenCount: null,
            allLeafChildren: [],
            childIndex: 0,
            childrenAfterFilter: [],
            childrenAfterGroup: [],
            childrenAfterSort: [],
            detail: undefined,
            displayed: true,
            expanded: false,
            firstChild: true,
            footer: undefined,
            group: false,
            groupData: { 'ag-Grid-AutoColumn': 'B' },
            id: '0',
            key: 'B',
            lastChild: true,
            leafGroup: undefined,
            level: 1,
            master: false,
            parentKey: 'A',
            rowGroupIndex: undefined,
            rowPinned: undefined,
            selectable: true,
            siblingKey: undefined,
            uiLevel: 1,
            rowIndex: 1,
        },
        {
            allChildrenCount: 2,
            allLeafChildren: ['E'],
            childIndex: 1,
            childrenAfterFilter: ['D'],
            childrenAfterGroup: ['D'],
            childrenAfterSort: ['D'],
            detail: undefined,
            displayed: true,
            expanded: true,
            firstChild: false,
            footer: undefined,
            group: true,
            groupData: { 'ag-Grid-AutoColumn': 'C' },
            id: 'row-group-0-C',
            key: 'C',
            lastChild: true,
            leafGroup: false,
            level: 0,
            master: false,
            parentKey: null,
            rowGroupIndex: null,
            rowPinned: undefined,
            selectable: true,
            siblingKey: undefined,
            uiLevel: 0,
            rowIndex: 2,
        },
        {
            allChildrenCount: 1,
            allLeafChildren: ['E'],
            childIndex: 0,
            childrenAfterFilter: ['E'],
            childrenAfterGroup: ['E'],
            childrenAfterSort: ['E'],
            detail: undefined,
            displayed: true,
            expanded: true,
            firstChild: true,
            footer: undefined,
            group: true,
            groupData: { 'ag-Grid-AutoColumn': 'D' },
            id: '3',
            key: 'D',
            lastChild: true,
            leafGroup: undefined,
            level: 1,
            master: false,
            parentKey: 'C',
            rowGroupIndex: undefined,
            rowPinned: undefined,
            selectable: true,
            siblingKey: undefined,
            uiLevel: 1,
            rowIndex: 3,
        },
        {
            allChildrenCount: null,
            allLeafChildren: [],
            childIndex: 0,
            childrenAfterFilter: [],
            childrenAfterGroup: [],
            childrenAfterSort: [],
            detail: undefined,
            displayed: true,
            expanded: false,
            firstChild: true,
            footer: undefined,
            group: false,
            groupData: { 'ag-Grid-AutoColumn': 'E' },
            id: '1',
            key: 'E',
            lastChild: true,
            leafGroup: undefined,
            level: 2,
            master: false,
            parentKey: 'D',
            rowGroupIndex: undefined,
            rowPinned: undefined,
            selectable: true,
            siblingKey: undefined,
            uiLevel: 2,
            rowIndex: 4,
        },
    ];
}
