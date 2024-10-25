import type { MockInstance } from 'vitest';

import type { GridApi, GridOptions } from 'ag-grid-community';
import { ClientSideRowModelModule } from 'ag-grid-community';

import { TestGridsManager } from '../test-utils';
import { assertSelectedRowNodes, assertSelectedRowsByIndex } from './utils';

describe('Row Selection Grid API', () => {
    let consoleErrorSpy: MockInstance;
    let consoleWarnSpy: MockInstance;

    const gridMgr = new TestGridsManager({
        modules: [ClientSideRowModelModule],
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
        { sport: 'football' },
        { sport: 'rugby' },
        { sport: 'tennis' },
        { sport: 'cricket' },
        { sport: 'golf' },
        { sport: 'swimming' },
        { sport: 'rowing' },
    ];

    describe('Selection API', () => {
        describe('setNodesSelected', () => {
            test('Select single row in single selection mode', () => {
                const api = createGrid({ columnDefs, rowData, rowSelection: 'single' });

                const nodes = api.getRenderedNodes();
                const toSelect = [nodes[3]];
                api.setNodesSelected({ nodes: toSelect, newValue: true });

                assertSelectedRowNodes(toSelect, api);
            });

            test('Select single row in multiple selection mode', () => {
                const api = createGrid({ columnDefs, rowData, rowSelection: 'multiple' });

                const nodes = api.getRenderedNodes();
                const toSelect = [nodes[3]];
                api.setNodesSelected({ nodes: toSelect, newValue: true });

                assertSelectedRowNodes(toSelect, api);
            });

            test('Cannot select multiple rows in single selection mode', () => {
                const api = createGrid({ columnDefs, rowData, rowSelection: 'single' });

                const nodes = api.getRenderedNodes();
                const toSelect = [nodes[0], nodes[3], nodes[1]];
                api.setNodesSelected({ nodes: toSelect, newValue: true });

                assertSelectedRowNodes([], api);
            });

            test('Can select multiple rows in multiple selection mode', () => {
                const api = createGrid({ columnDefs, rowData, rowSelection: 'multiple' });

                const nodes = api.getRenderedNodes();
                const toSelect = [nodes[5], nodes[4], nodes[2]];
                api.setNodesSelected({ nodes: toSelect, newValue: true });

                assertSelectedRowNodes(toSelect, api);
            });
        });

        describe('selectAll', () => {
            test('Can select all rows in single selection mode', () => {
                const api = createGrid({ columnDefs, rowData, rowSelection: 'single' });

                api.selectAll();

                expect(api.getSelectedNodes().length).toBe(rowData.length);

                api.deselectAll();
                assertSelectedRowNodes([], api);
            });

            test('Can select all rows in multiple selection mode', () => {
                const api = createGrid({ columnDefs, rowData, rowSelection: 'multiple' });

                api.selectAll();

                expect(api.getSelectedNodes().length).toBe(rowData.length);

                api.deselectAll();
                assertSelectedRowNodes([], api);
            });
        });

        describe('selectAllOnCurrentPage', () => {
            test('Can select all rows on current page in single selection mode', () => {
                const api = createGrid({
                    columnDefs,
                    rowData,
                    rowSelection: 'single',
                    pagination: true,
                    paginationPageSize: 5,
                    paginationPageSizeSelector: false,
                });

                api.selectAllOnCurrentPage();

                assertSelectedRowsByIndex([0, 1, 2, 3, 4], api);
            });

            test('Can deselect only rows on current page in single selection mode', () => {
                const api = createGrid({
                    columnDefs,
                    rowData,
                    rowSelection: 'single',
                    pagination: true,
                    paginationPageSize: 5,
                    paginationPageSizeSelector: false,
                });

                api.selectAll();
                api.deselectAllOnCurrentPage();

                assertSelectedRowsByIndex([5, 6], api);
            });
        });

        describe('selectAll("filtered")', () => {
            test('Can select all filtered rows in single selection mode', () => {
                const api = createGrid({ columnDefs, rowData, rowSelection: 'single' });

                api.setGridOption('quickFilterText', 'ing');

                api.selectAll('filtered');
                const selectedNodes = api.getSelectedNodes();

                expect(selectedNodes.length).toBe(2);
            });

            test('Can deselect filtered rows only in single selection mode', () => {
                const api = createGrid({ columnDefs, rowData, rowSelection: 'single' });

                api.selectAll();

                api.setGridOption('quickFilterText', 'ing');

                api.deselectAll('filtered');

                api.setGridOption('quickFilterText', '');

                assertSelectedRowsByIndex([0, 1, 2, 3, 4], api);
            });
        });
    });
});
