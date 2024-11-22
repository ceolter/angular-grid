import type { MockInstance } from 'vitest';

import type { GetRowIdParams, GridApi, GridOptions } from 'ag-grid-community';
import { ClientSideRowModelModule } from 'ag-grid-community';
import { RowGroupingModule, ServerSideRowModelModule } from 'ag-grid-enterprise';

import { TestGridsManager } from '../test-utils';
import { GROUP_ROW_DATA, fakeFetch } from './data';
import {
    assertSelectedRowElementsById,
    assertSelectedRowNodes,
    assertSelectedRowsByIndex,
    expandGroupRowByIndex,
    selectRowsByIndex,
    toggleCheckboxByIndex,
    waitForEvent,
} from './utils';

describe('Row Selection Grid API', () => {
    let consoleErrorSpy: MockInstance;
    let consoleWarnSpy: MockInstance;

    const gridMgr = new TestGridsManager({
        modules: [ClientSideRowModelModule, ServerSideRowModelModule, RowGroupingModule],
    });

    function createGrid(go: GridOptions): GridApi {
        return gridMgr.createGrid('myGrid', go);
    }

    beforeEach(() => {
        gridMgr.reset();

        consoleErrorSpy = vitest.spyOn(console, 'error').mockImplementation(() => {});
        consoleWarnSpy = vitest.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
        gridMgr.reset();

        consoleErrorSpy.mockRestore();
        consoleWarnSpy.mockRestore();
    });

    const columnDefs = [{ field: 'sport' }];
    const rowData = [
        { id: '1', sport: 'football' },
        { id: '2', sport: 'rugby' },
        { id: '3', sport: 'tennis' },
        { id: '4', sport: 'cricket' },
        { id: '5', sport: 'golf' },
        { id: '6', sport: 'swimming' },
        { id: '7', sport: 'rowing' },
    ];

    describe('Single Row Selection', () => {
        describe('CSRM', () => {
            describe('selectAll', () => {
                test('Prevented from selecting all rows via the API', () => {
                    const api = createGrid({
                        columnDefs,
                        rowData,
                        rowSelection: {
                            mode: 'singleRow',
                        },
                    });

                    assertSelectedRowsByIndex([], api);

                    api.selectAll();

                    assertSelectedRowsByIndex([], api);
                });
            });

            describe('selectAll("currentPage")', () => {
                test('Cannot select all rows on current page', () => {
                    const api = createGrid({
                        columnDefs,
                        rowData,
                        rowSelection: { mode: 'singleRow' },
                        pagination: true,
                        paginationPageSize: 5,
                        paginationPageSizeSelector: false,
                    });

                    api.selectAll('currentPage');

                    assertSelectedRowsByIndex([], api);
                });
            });

            describe('selectAll("filtered")', () => {
                test('Cannot select all filtered rows', () => {
                    const api = createGrid({
                        columnDefs,
                        rowData,
                        rowSelection: { mode: 'singleRow' },
                    });

                    api.setGridOption('quickFilterText', 'ing');

                    api.selectAll('filtered');

                    assertSelectedRowNodes([], api);
                });
            });

            describe('setNodesSelected', () => {
                test('Select single row', () => {
                    const api = createGrid({
                        columnDefs,
                        rowData,
                        rowSelection: { mode: 'singleRow' },
                    });

                    const nodes = api.getRenderedNodes();
                    const toSelect = [nodes[3]];
                    api.setNodesSelected({ nodes: toSelect, newValue: true });

                    assertSelectedRowNodes(toSelect, api);
                });

                test('Cannot select multiple rows', () => {
                    const api = createGrid({
                        columnDefs,
                        rowData,
                        rowSelection: { mode: 'singleRow' },
                    });

                    const nodes = api.getRenderedNodes();
                    const toSelect = [nodes[0], nodes[3], nodes[1]];
                    api.setNodesSelected({ nodes: toSelect, newValue: true });

                    assertSelectedRowNodes([], api);
                });
            });
        });

        describe('SSRM', () => {
            describe('selectAll', () => {
                test('Prevented from selecting all rows via the API', async () => {
                    const api = createGrid({
                        columnDefs,
                        rowSelection: {
                            mode: 'singleRow',
                        },
                        getRowId(params) {
                            return params.data.sport;
                        },
                        rowModelType: 'serverSide',
                        serverSideDatasource: {
                            getRows(params) {
                                params.success({ rowData });
                            },
                        },
                    });

                    await waitForEvent('firstDataRendered', api);
                    assertSelectedRowNodes([], api);

                    api.selectAll();

                    assertSelectedRowNodes([], api);
                });
            });

            describe('setNodesSelected', () => {
                test('Select single row', async () => {
                    const api = createGrid({
                        columnDefs,
                        rowModelType: 'serverSide',
                        serverSideDatasource: {
                            getRows(params) {
                                params.success({ rowData });
                            },
                        },
                        getRowId(params) {
                            return params.data.sport;
                        },
                        rowSelection: { mode: 'singleRow' },
                    });

                    await waitForEvent('firstDataRendered', api);
                    const nodes = api.getRenderedNodes();
                    const toSelect = [nodes[3]];
                    api.setNodesSelected({ nodes: toSelect, newValue: true });

                    assertSelectedRowNodes(toSelect, api);
                });

                test('Cannot select multiple rows', async () => {
                    const api = createGrid({
                        columnDefs,
                        rowModelType: 'serverSide',
                        serverSideDatasource: {
                            getRows(params) {
                                params.success({ rowData });
                            },
                        },
                        getRowId(params) {
                            return params.data.sport;
                        },
                        rowSelection: { mode: 'singleRow' },
                    });

                    await waitForEvent('firstDataRendered', api);
                    const nodes = api.getRenderedNodes();
                    const toSelect = [nodes[0], nodes[3], nodes[1]];
                    api.setNodesSelected({ nodes: toSelect, newValue: true });

                    assertSelectedRowNodes([], api);
                });
            });
        });
    });

    describe('Multi Row Selection', () => {
        describe('CSRM', () => {
            describe('setNodesSelected', () => {
                test('Select single row', () => {
                    const api = createGrid({ columnDefs, rowData, rowSelection: { mode: 'multiRow' } });

                    const nodes = api.getRenderedNodes();
                    const toSelect = [nodes[3]];
                    api.setNodesSelected({ nodes: toSelect, newValue: true });

                    assertSelectedRowNodes(toSelect, api);
                });

                test('Can select multiple rows', () => {
                    const api = createGrid({ columnDefs, rowData, rowSelection: { mode: 'multiRow' } });

                    const nodes = api.getRenderedNodes();
                    const toSelect = [nodes[5], nodes[4], nodes[2]];
                    api.setNodesSelected({ nodes: toSelect, newValue: true });

                    assertSelectedRowNodes(toSelect, api);
                });
            });

            describe('selectAll', () => {
                test('Can select all rows', () => {
                    const api = createGrid({ columnDefs, rowData, rowSelection: { mode: 'multiRow' } });

                    api.selectAll();

                    expect(api.getSelectedNodes().length).toBe(rowData.length);

                    api.deselectAll();
                    assertSelectedRowNodes([], api);
                });
            });
        });

        describe('SSRM', () => {
            describe('setNodesSelected', () => {
                test('Select single row', async () => {
                    const api = createGrid({
                        columnDefs,
                        rowModelType: 'serverSide',
                        serverSideDatasource: {
                            getRows(params) {
                                params.success({ rowData });
                            },
                        },
                        getRowId(params) {
                            return params.data.sport;
                        },
                        rowSelection: { mode: 'multiRow' },
                    });

                    await waitForEvent('firstDataRendered', api);
                    const nodes = api.getRenderedNodes();
                    const toSelect = [nodes[3]];
                    api.setNodesSelected({ nodes: toSelect, newValue: true });

                    assertSelectedRowNodes(toSelect, api);
                });

                test('Can select multiple rows', async () => {
                    const api = createGrid({
                        columnDefs,
                        rowModelType: 'serverSide',
                        serverSideDatasource: {
                            getRows(params) {
                                params.success({ rowData });
                            },
                        },
                        getRowId(params) {
                            return params.data.sport;
                        },
                        rowSelection: { mode: 'multiRow' },
                    });

                    await waitForEvent('firstDataRendered', api);
                    const nodes = api.getRenderedNodes();
                    const toSelect = [nodes[5], nodes[4], nodes[2]];
                    api.setNodesSelected({ nodes: toSelect, newValue: true });

                    assertSelectedRowNodes(toSelect, api);
                });
            });
        });
    });

    describe('Transactions', () => {
        describe('CSRM', () => {
            test('selection state maintained after add transaction', () => {
                const api = createGrid({ columnDefs, rowData, rowSelection: { mode: 'multiRow' } });

                selectRowsByIndex([2, 4, 6], false, api);

                api.applyTransaction({ add: [{ sport: 'lacrosse' }] });

                assertSelectedRowsByIndex([2, 4, 6], api);
            });

            test('selection state maintained after update transaction', () => {
                const api = createGrid({
                    columnDefs,
                    rowData,
                    rowSelection: { mode: 'multiRow' },
                    getRowId(params) {
                        return params.data.id;
                    },
                });

                selectRowsByIndex([2, 4, 6], false, api);

                api.applyTransaction({ update: [{ id: '7', sport: 'lacrosse' }] });

                assertSelectedRowsByIndex([2, 4, 6], api);
            });

            test('selection state updated after remove transaction', () => {
                const api = createGrid({
                    columnDefs,
                    rowData,
                    rowSelection: { mode: 'multiRow' },
                    getRowId(params) {
                        return params.data.id;
                    },
                });

                selectRowsByIndex([2, 4, 6], false, api);

                api.applyTransaction({ remove: rowData.slice(-1) });

                assertSelectedRowsByIndex([2, 4], api);
            });

            test('group selection state updated after add and remove transaction', async () => {
                const groupGridOptions: Partial<GridOptions> = {
                    columnDefs: [
                        { field: 'country', rowGroup: true, hide: true },
                        { field: 'sport', rowGroup: true, hide: true },
                        { field: 'age' },
                        { field: 'year' },
                        { field: 'date' },
                    ],
                    autoGroupColumnDef: {
                        headerName: 'Athlete',
                        field: 'athlete',
                        cellRenderer: 'agGroupCellRenderer',
                    },
                    rowData: GROUP_ROW_DATA,
                    groupDefaultExpanded: -1,
                };

                const api = createGrid({
                    ...groupGridOptions,
                    rowSelection: { mode: 'multiRow', groupSelects: 'descendants' },
                });

                await waitForEvent('firstDataRendered', api);

                toggleCheckboxByIndex(1); // select swimming group
                const expectedRowIds = [
                    'row-group-country-United States-sport-Swimming',
                    '0',
                    '1',
                    '2',
                    '3',
                    '6',
                    '7',
                    '8',
                    '9',
                    '11',
                    '18',
                ];
                assertSelectedRowElementsById(expectedRowIds, api);

                const newRowData = {
                    athlete: 'Foo',
                    age: 99,
                    country: 'United States',
                    year: 1982,
                    date: '11/11/1982',
                    sport: 'Swimming',
                    gold: 99,
                    silver: 0,
                    bronze: 0,
                    total: 99,
                };

                // add new row to swimming group
                api.applyTransaction({ add: [newRowData], addIndex: 2 });

                // expect swimming group row to no longer be selected
                assertSelectedRowElementsById(expectedRowIds.slice(1), api);

                // remove new row
                api.applyTransaction({ remove: [newRowData] });

                // expect swimming group to be selected again
                assertSelectedRowElementsById(expectedRowIds, api);
            });
        });

        describe('SSRM', () => {
            test('selection state maintained after add transaction', async () => {
                const api = createGrid({
                    columnDefs,
                    rowSelection: { mode: 'multiRow' },
                    rowModelType: 'serverSide',
                    getRowId(params) {
                        return params.data.id;
                    },
                    serverSideDatasource: {
                        getRows(params) {
                            return params.success({ rowData, rowCount: rowData.length });
                        },
                    },
                });

                await waitForEvent('firstDataRendered', api);

                selectRowsByIndex([2, 4, 6], false, api);

                api.applyServerSideTransaction({ add: [{ id: '8', sport: 'lacrosse' }] });

                assertSelectedRowsByIndex([2, 4, 6], api);
            });

            test('selection state maintained after update transaction', async () => {
                const api = createGrid({
                    columnDefs,
                    rowSelection: { mode: 'multiRow' },
                    rowModelType: 'serverSide',
                    getRowId(params) {
                        return params.data.id;
                    },
                    serverSideDatasource: {
                        getRows(params) {
                            return params.success({ rowData, rowCount: rowData.length });
                        },
                    },
                });

                await waitForEvent('firstDataRendered', api);

                selectRowsByIndex([2, 4, 6], false, api);

                api.applyTransaction({ update: [{ id: '7', sport: 'lacrosse' }] });

                assertSelectedRowsByIndex([2, 4, 6], api);
            });

            test('selection state updated after remove transaction', async () => {
                const api = createGrid({
                    columnDefs,
                    rowSelection: { mode: 'multiRow' },
                    rowModelType: 'serverSide',
                    getRowId(params) {
                        return params.data.id;
                    },
                    serverSideDatasource: {
                        getRows(params) {
                            return params.success({ rowData, rowCount: rowData.length });
                        },
                    },
                });

                await waitForEvent('firstDataRendered', api);

                selectRowsByIndex([2, 4, 6], false, api);

                api.applyServerSideTransaction({ remove: rowData.slice(-1) });

                assertSelectedRowsByIndex([2, 4], api);
            });

            test('group selection state updated after add and remove transaction', async () => {
                function getRowIdRaw(params: Pick<GetRowIdParams, 'api' | 'data' | 'parentKeys'>) {
                    return getRowId({ ...params, level: -1, context: {} });
                }
                function getRowId(params: GetRowIdParams): string {
                    return (params.parentKeys ?? []).join('-') + ':' + JSON.stringify(params.data);
                }
                const groupGridOptions: Partial<GridOptions> = {
                    columnDefs: [
                        { field: 'country', rowGroup: true, hide: true },
                        { field: 'sport' },
                        { field: 'age' },
                        { field: 'year' },
                        { field: 'date' },
                    ],
                    autoGroupColumnDef: {
                        headerName: 'Athlete',
                        field: 'athlete',
                        cellRenderer: 'agGroupCellRenderer',
                    },
                    getRowId,
                    rowModelType: 'serverSide',
                    serverSideDatasource: {
                        getRows(params) {
                            const data = fakeFetch(params.request);
                            return params.success({ rowData: data, rowCount: data.length });
                        },
                    },
                };

                const api = createGrid({
                    ...groupGridOptions,
                    rowSelection: { mode: 'multiRow', groupSelects: 'descendants' },
                });

                await waitForEvent('firstDataRendered', api);

                await expandGroupRowByIndex(api, 0);

                toggleCheckboxByIndex(0); // select USA group

                const expectedRowIds = [
                    { data: { country: 'United States' } },
                    ...GROUP_ROW_DATA.filter((d) => d.country === 'United States').map((d) => ({
                        parentKeys: ['United States'],
                        data: d,
                    })),
                ].map((d) => getRowIdRaw({ ...d, api }));
                assertSelectedRowElementsById(expectedRowIds, api);

                const newRowData = {
                    athlete: 'Foo',
                    age: 99,
                    country: 'United States',
                    year: 1982,
                    date: '11/11/1982',
                    sport: 'Swimming',
                    gold: 99,
                    silver: 0,
                    bronze: 0,
                    total: 99,
                };

                // add new row to USA group
                api.applyServerSideTransaction({ route: ['United States'], add: [newRowData] });

                // expect swimming group row to no longer be selected
                assertSelectedRowElementsById(
                    expectedRowIds
                        .slice(0, 3)
                        .concat(getRowIdRaw({ parentKeys: ['United States'], data: newRowData, api }))
                        .concat(expectedRowIds.slice(3)),
                    api
                );

                // remove new row
                api.applyServerSideTransaction({ route: ['United States'], remove: [newRowData] });

                // NOTE: This test encodes the current behaviour but it's possibly a bug:
                // in CSRM one would expect swimming group to be selected again.
                // This could just be a limitation of SSRM?
                assertSelectedRowElementsById(expectedRowIds.slice(1), api);
            });
        });
    });
});
