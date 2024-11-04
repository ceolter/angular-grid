import { ClientSideRowModelModule } from 'ag-grid-community';
import type { GridOptions } from 'ag-grid-community';
import { RowGroupingModule, TreeDataModule } from 'ag-grid-enterprise';

import type { GridRowsOptions, RowSnapshot } from '../../test-utils';
import { GridRows, TestGridsManager, getRowsSnapshot } from '../../test-utils';

describe('ag-grid grouping treeData is reactive', () => {
    const gridsManager = new TestGridsManager({
        modules: [ClientSideRowModelModule, RowGroupingModule, TreeDataModule],
    });

    beforeEach(() => {
        gridsManager.reset();
    });

    afterEach(() => {
        gridsManager.reset();
    });

    test('ag-grid grouping treeData is reactive', async () => {
        const rowData = [
            { orgHierarchy: ['A'], g: 0, v: 0 },
            { orgHierarchy: ['A', 'B', 'C'], g: 1, v: 1 },
            { orgHierarchy: ['D', 'E'], g: 0, v: 2 },
        ];

        const getDataPath = (data: any) => data.orgHierarchy;

        const gridOptions: GridOptions = {
            columnDefs: [
                {
                    field: 'groupType',
                    valueGetter: (params) => (params.data ? 'Provided' : 'Filler'),
                },
                { field: 'g', rowGroup: true },
                { field: 'v' },
            ],
            autoGroupColumnDef: {
                headerName: 'group column',
                valueGetter: (params) => {
                    return 'X-' + params.node?.id;
                },
            },
            treeData: false,
            animateRows: false,
            groupDefaultExpanded: -1,
            rowData,
            getDataPath,
        };

        const api = gridsManager.createGrid('myGrid', gridOptions);

        const gridRowsOptions: GridRowsOptions = {
            columns: true,
            checkDom: true,
        };

        for (let repeat = 0; repeat < 2; repeat++) {
            api.setGridOption('treeData', false);

            let gridRows = new GridRows(api, 'data 1 ' + repeat, gridRowsOptions);
            await gridRows.check(`
                ROOT id:ROOT_NODE_ID ag-Grid-AutoColumn:"X-ROOT_NODE_ID" groupType:"Filler"
                ├─┬ filler id:row-group-g-0 ag-Grid-AutoColumn:0 groupType:"Filler"
                │ ├── LEAF id:0 ag-Grid-AutoColumn:"X-0" groupType:"Provided" g:0 v:0
                │ └── LEAF id:2 ag-Grid-AutoColumn:"X-2" groupType:"Provided" g:0 v:2
                └─┬ filler id:row-group-g-1 ag-Grid-AutoColumn:1 groupType:"Filler"
                · └── LEAF id:1 ag-Grid-AutoColumn:"X-1" groupType:"Provided" g:1 v:1
            `);

            const groupRows = gridRows.rowNodes;
            const groupSnapshot = getRowsSnapshot(groupRows);
            expect(groupRows.length).toBe(5);

            expect(groupRows[0].data).toEqual(undefined);
            expect(groupRows[1].data).toEqual(rowData[0]);
            expect(groupRows[2].data).toEqual(rowData[2]);
            expect(groupRows[3].data).toEqual(undefined);
            expect(groupRows[4].data).toEqual(rowData[1]);

            const expectedGroupSnapshots: RowSnapshot[] = [
                {
                    allChildrenCount: 2,
                    allLeafChildren: [null, null],
                    childIndex: 0,
                    childrenAfterFilter: [null, null],
                    childrenAfterGroup: [null, null],
                    childrenAfterSort: [null, null],
                    detail: undefined,
                    displayed: true,
                    expanded: true,
                    firstChild: true,
                    footer: undefined,
                    group: true,
                    groupData: { 'ag-Grid-AutoColumn': 0 },
                    id: 'row-group-g-0',
                    key: '0',
                    lastChild: false,
                    leafGroup: true,
                    level: 0,
                    master: false,
                    parentKey: null,
                    rowGroupIndex: 0,
                    rowPinned: undefined,
                    selectable: true,
                    siblingKey: undefined,
                    uiLevel: 0,
                    rowIndex: 0,
                },
                {
                    allChildrenCount: undefined,
                    allLeafChildren: undefined,
                    childIndex: 0,
                    childrenAfterFilter: undefined,
                    childrenAfterGroup: undefined,
                    childrenAfterSort: undefined,
                    detail: undefined,
                    displayed: true,
                    expanded: false,
                    firstChild: true,
                    footer: undefined,
                    group: false,
                    groupData: undefined,
                    id: '0',
                    key: null,
                    lastChild: false,
                    leafGroup: undefined,
                    level: 1,
                    master: false,
                    parentKey: '0',
                    rowGroupIndex: undefined,
                    rowPinned: undefined,
                    selectable: true,
                    siblingKey: undefined,
                    uiLevel: 1,
                    rowIndex: 1,
                },
                {
                    allChildrenCount: undefined,
                    allLeafChildren: undefined,
                    childIndex: 1,
                    childrenAfterFilter: undefined,
                    childrenAfterGroup: undefined,
                    childrenAfterSort: undefined,
                    detail: undefined,
                    displayed: true,
                    expanded: false,
                    firstChild: false,
                    footer: undefined,
                    group: false,
                    groupData: undefined,
                    id: '2',
                    key: null,
                    lastChild: true,
                    leafGroup: undefined,
                    level: 1,
                    master: false,
                    parentKey: '0',
                    rowGroupIndex: undefined,
                    rowPinned: undefined,
                    selectable: true,
                    siblingKey: undefined,
                    uiLevel: 1,
                    rowIndex: 2,
                },
                {
                    allChildrenCount: 1,
                    allLeafChildren: [null],
                    childIndex: 1,
                    childrenAfterFilter: [null],
                    childrenAfterGroup: [null],
                    childrenAfterSort: [null],
                    detail: undefined,
                    displayed: true,
                    expanded: true,
                    firstChild: false,
                    footer: undefined,
                    group: true,
                    groupData: { 'ag-Grid-AutoColumn': 1 },
                    id: 'row-group-g-1',
                    key: '1',
                    lastChild: true,
                    leafGroup: true,
                    level: 0,
                    master: false,
                    parentKey: null,
                    rowGroupIndex: 0,
                    rowPinned: undefined,
                    selectable: true,
                    siblingKey: undefined,
                    uiLevel: 0,
                    rowIndex: 3,
                },
                {
                    allChildrenCount: undefined,
                    allLeafChildren: undefined,
                    childIndex: 0,
                    childrenAfterFilter: undefined,
                    childrenAfterGroup: undefined,
                    childrenAfterSort: undefined,
                    detail: undefined,
                    displayed: true,
                    expanded: false,
                    firstChild: true,
                    footer: undefined,
                    group: false,
                    groupData: undefined,
                    id: '1',
                    key: null,
                    lastChild: true,
                    leafGroup: undefined,
                    level: 1,
                    master: false,
                    parentKey: '1',
                    rowGroupIndex: undefined,
                    rowPinned: undefined,
                    selectable: true,
                    siblingKey: undefined,
                    uiLevel: 1,
                    rowIndex: 4,
                },
            ];

            expect(groupSnapshot).toMatchObject(expectedGroupSnapshots);

            // Switch to treeData

            api.setGridOption('treeData', true);

            gridRows = new GridRows(api, 'data 2 ' + repeat, gridRowsOptions);
            await gridRows.check(`
                ROOT id:ROOT_NODE_ID ag-Grid-AutoColumn:"X-ROOT_NODE_ID" groupType:"Filler"
                ├─┬ A GROUP id:0 ag-Grid-AutoColumn:"X-0" groupType:"Provided" g:0 v:0
                │ └─┬ B filler id:row-group-0-A-1-B ag-Grid-AutoColumn:"X-row-group-0-A-1-B" groupType:"Filler"
                │ · └── C LEAF id:1 ag-Grid-AutoColumn:"X-1" groupType:"Provided" g:1 v:1
                └─┬ D filler id:row-group-0-D ag-Grid-AutoColumn:"X-row-group-0-D" groupType:"Filler"
                · └── E LEAF id:2 ag-Grid-AutoColumn:"X-2" groupType:"Provided" g:0 v:2
            `);

            const treeRows = gridRows.rowNodes;
            const treeSnapshot = getRowsSnapshot(treeRows);
            expect(treeRows.length).toBe(5);

            expect(treeRows[0].data).toEqual(rowData[0]);
            expect(treeRows[1].data).toEqual(undefined);
            expect(treeRows[2].data).toEqual(rowData[1]);
            expect(treeRows[3].data).toEqual(undefined);
            expect(treeRows[4].data).toEqual(rowData[2]);

            const expectedTreeSnapshot = [
                {
                    allChildrenCount: 2,
                    allLeafChildren: ['C'],
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
                    id: '0',
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
                    allChildrenCount: 1,
                    allLeafChildren: ['C'],
                    childIndex: 0,
                    childrenAfterFilter: ['C'],
                    childrenAfterGroup: ['C'],
                    childrenAfterSort: ['C'],
                    detail: undefined,
                    displayed: true,
                    expanded: true,
                    firstChild: true,
                    footer: undefined,
                    group: true,
                    groupData: { 'ag-Grid-AutoColumn': 'B' },
                    id: 'row-group-0-A-1-B',
                    key: 'B',
                    lastChild: true,
                    leafGroup: false,
                    level: 1,
                    master: false,
                    parentKey: 'A',
                    rowGroupIndex: null,
                    rowPinned: undefined,
                    selectable: true,
                    siblingKey: undefined,
                    uiLevel: 1,
                    rowIndex: 1,
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
                    groupData: { 'ag-Grid-AutoColumn': 'C' },
                    id: '1',
                    key: 'C',
                    lastChild: true,
                    leafGroup: undefined,
                    level: 2,
                    master: false,
                    parentKey: 'B',
                    rowGroupIndex: undefined,
                    rowPinned: undefined,
                    selectable: true,
                    siblingKey: undefined,
                    uiLevel: 2,
                    rowIndex: 2,
                },
                {
                    allChildrenCount: 1,
                    allLeafChildren: ['E'],
                    childIndex: 1,
                    childrenAfterFilter: ['E'],
                    childrenAfterGroup: ['E'],
                    childrenAfterSort: ['E'],
                    detail: undefined,
                    displayed: true,
                    expanded: true,
                    firstChild: false,
                    footer: undefined,
                    group: true,
                    groupData: { 'ag-Grid-AutoColumn': 'D' },
                    id: 'row-group-0-D',
                    key: 'D',
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
                    id: '2',
                    key: 'E',
                    lastChild: true,
                    leafGroup: undefined,
                    level: 1,
                    master: false,
                    parentKey: 'D',
                    rowGroupIndex: undefined,
                    rowPinned: undefined,
                    selectable: true,
                    siblingKey: undefined,
                    uiLevel: 1,
                    rowIndex: 4,
                },
            ];

            expect(treeSnapshot).toMatchObject(expectedTreeSnapshot);
        }
    });
});
