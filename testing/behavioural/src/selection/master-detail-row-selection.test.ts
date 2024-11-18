import type { MockInstance } from 'vitest';

import { ClientSideRowModelModule } from 'ag-grid-community';
import type { GridApi, GridOptions, IDetailCellRendererParams } from 'ag-grid-community';
import { MasterDetailModule, ServerSideRowModelModule } from 'ag-grid-enterprise';

import { TestGridsManager } from '../test-utils';
import { DETAIL_COLUMN_DEFS, MASTER_COLUMN_DEFS, MASTER_DETAIL_ROW_DATA } from './master-detail-data';
import {
    assertSelectedRowsByIndex,
    clickEvent,
    getCheckboxByIndex,
    toggleCheckboxByIndex,
    waitForEvent,
    waitForEventWhile,
} from './utils';

describe('Master Detail', () => {
    let consoleErrorSpy: MockInstance;
    let consoleWarnSpy: MockInstance;
    const GRID_DOM_ID = 'myGrid';

    function createGrid(gridOptions: GridOptions): GridApi {
        return gridMgr.createGrid(GRID_DOM_ID, gridOptions);
    }

    async function createGridAndWait(gridOptions: GridOptions): Promise<GridApi> {
        const api = createGrid(gridOptions);

        await waitForEvent('firstDataRendered', api);

        return api;
    }

    function getDetailNode(id: string): HTMLElement {
        return document.querySelector<HTMLElement>(`#${GRID_DOM_ID} [row-id="detail_${id}"]`)!;
    }

    const gridMgr = new TestGridsManager({
        modules: [ClientSideRowModelModule, MasterDetailModule, ServerSideRowModelModule],
    });

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

    describe('Client Side Row Model', () => {
        test('master row selection state synced from detail grid', async () => {
            const detailCellRendererParams: Partial<IDetailCellRendererParams> = {
                detailGridOptions: {
                    columnDefs: DETAIL_COLUMN_DEFS,
                    rowSelection: { mode: 'multiRow', enableClickSelection: true },
                },
                getDetailRowData(params) {
                    params.successCallback(params.data.callRecords);
                },
            };

            const api = await createGridAndWait({
                columnDefs: MASTER_COLUMN_DEFS,
                rowData: MASTER_DETAIL_ROW_DATA,
                masterDetail: true,
                detailCellRendererParams,
                rowSelection: { mode: 'multiRow' },
            });

            api.forEachNode((node) => {
                node.master && node.setExpanded(true);
            });
            await waitForEvent('modelUpdated', api);

            // Selecting row in detail grid should cause master row to become indeterminate
            const detail = api.getDetailGridInfo('detail_0')!;
            await waitForEventWhile('selectionChanged', detail.api!, () => {
                getCheckboxByIndex(0, getDetailNode('0'))?.dispatchEvent(clickEvent());
            });
            assertSelectedRowsByIndex([0], detail.api!);
            const node = api.getRowNode('0');
            expect(node!.isSelected()).toBe(undefined);

            // Deselecting same row in detail grid should cause master row to become deselected again
            await waitForEventWhile('selectionChanged', detail.api!, () => {
                getCheckboxByIndex(0, getDetailNode('0'))?.dispatchEvent(clickEvent());
            });
            assertSelectedRowsByIndex([], detail.api!);
            expect(node!.isSelected()).toBe(false);
        });

        test('detail grid selection state synced from master row', async () => {
            const detailCellRendererParams: Partial<IDetailCellRendererParams> = {
                detailGridOptions: {
                    columnDefs: DETAIL_COLUMN_DEFS,
                    rowSelection: { mode: 'multiRow', enableClickSelection: true },
                },
                getDetailRowData(params) {
                    params.successCallback(params.data.callRecords);
                },
            };

            const api = await createGridAndWait({
                columnDefs: MASTER_COLUMN_DEFS,
                rowData: MASTER_DETAIL_ROW_DATA,
                masterDetail: true,
                detailCellRendererParams,
                rowSelection: { mode: 'multiRow' },
            });

            api.forEachNode((node) => {
                node.master && node.setExpanded(true);
            });
            await waitForEvent('modelUpdated', api);
            const detail = api.getDetailGridInfo('detail_0')!;

            // Selecting master row (and then waiting for "rowSelected" to fire) results in
            // all detail grid rows being selected
            await waitForEventWhile('rowSelected', api, () => {
                toggleCheckboxByIndex(0);
            });
            assertSelectedRowsByIndex([0], api);
            expect(detail.api!.getSelectAllState()).toBe(true);

            // Deselecting row in detail grid (and then waiting for "selectionChanged" to fire) results in
            // master row having indeterminate state
            await waitForEventWhile('selectionChanged', api, () => {
                detail.api?.setNodesSelected({ nodes: [detail.api!.getRowNode('0')!], newValue: false });
            });
            assertSelectedRowsByIndex([], api);
            expect(api.getRowNode('0')!.isSelected()).toBe(undefined);
        });
    });

    describe('Server side row model', () => {
        test('master row selection state synced from detail grid', async () => {
            const detailCellRendererParams: Partial<IDetailCellRendererParams> = {
                detailGridOptions: {
                    columnDefs: DETAIL_COLUMN_DEFS,
                    rowSelection: { mode: 'multiRow', enableClickSelection: true },
                },
                getDetailRowData(params) {
                    params.successCallback(params.data.callRecords);
                },
            };

            const api = await createGridAndWait({
                columnDefs: MASTER_COLUMN_DEFS,
                masterDetail: true,
                detailCellRendererParams,
                rowSelection: { mode: 'multiRow' },
                rowModelType: 'serverSide',
                serverSideDatasource: {
                    getRows(params) {
                        params.success({ rowData: MASTER_DETAIL_ROW_DATA, rowCount: MASTER_DETAIL_ROW_DATA.length });
                    },
                },
            });

            api.forEachNode((node) => {
                node.master && node.setExpanded(true);
            });

            // Selecting row in detail grid should cause master row to become indeterminate
            const detail = api.getDetailGridInfo('detail_0')!;
            await waitForEventWhile('selectionChanged', detail.api!, () => {
                getCheckboxByIndex(0, getDetailNode('0'))?.dispatchEvent(clickEvent());
            });
            assertSelectedRowsByIndex([0], detail.api!);
            const node = api.getRowNode('0');
            expect(node!.isSelected()).toBe(undefined);

            // Deselecting same row in detail grid should cause master row to become deselected again
            await waitForEventWhile('selectionChanged', detail.api!, () => {
                getCheckboxByIndex(0, getDetailNode('0'))?.dispatchEvent(clickEvent());
            });
            assertSelectedRowsByIndex([], detail.api!);
            expect(node!.isSelected()).toBe(false);
        });

        test('detail grid selection state synced from master row', async () => {
            const detailCellRendererParams: Partial<IDetailCellRendererParams> = {
                detailGridOptions: {
                    columnDefs: DETAIL_COLUMN_DEFS,
                    rowSelection: { mode: 'multiRow', enableClickSelection: true },
                },
                getDetailRowData(params) {
                    params.successCallback(params.data.callRecords);
                },
            };

            const api = await createGridAndWait({
                columnDefs: MASTER_COLUMN_DEFS,
                masterDetail: true,
                detailCellRendererParams,
                rowSelection: { mode: 'multiRow' },
                rowModelType: 'serverSide',
                serverSideDatasource: {
                    getRows(params) {
                        params.success({ rowData: MASTER_DETAIL_ROW_DATA, rowCount: MASTER_DETAIL_ROW_DATA.length });
                    },
                },
            });

            api.forEachNode((node) => {
                node.master && node.setExpanded(true);
            });
            const detail = api.getDetailGridInfo('detail_0')!;

            // Selecting master row (and then waiting for "rowSelected" to fire) results in
            // all detail grid rows being selected
            await waitForEventWhile('rowSelected', api, () => {
                toggleCheckboxByIndex(0);
            });
            assertSelectedRowsByIndex([0], api);
            expect(detail.api!.getSelectAllState()).toBe(true);

            // Deselecting row in detail grid (and then waiting for "selectionChanged" to fire) results in
            // master row having indeterminate state
            await waitForEventWhile('selectionChanged', api, () => {
                detail.api?.setNodesSelected({ nodes: [detail.api!.getRowNode('0')!], newValue: false });
            });
            assertSelectedRowsByIndex([], api);
            expect(api.getRowNode('0')!.isSelected()).toBe(undefined);
        });
    });
});
