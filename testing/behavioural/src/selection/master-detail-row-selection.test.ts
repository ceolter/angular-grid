import type { MockInstance } from 'vitest';

import { ClientSideRowModelModule } from 'ag-grid-community';
import type { GridApi, GridOptions, IDetailCellRendererParams } from 'ag-grid-community';
import { MasterDetailModule } from 'ag-grid-enterprise';

import { GridRows, TestGridsManager } from '../test-utils';
import { GridRowsDiagramTree } from '../test-utils/gridRows/gridRowsDiagramTree';
import { DETAIL_COLUMN_DEFS, MASTER_COLUMN_DEFS, MASTER_DETAIL_ROW_DATA } from './master-detail-data';
import { assertSelectedRowsByIndex, clickEvent, getRowByIndex, waitForEvent } from './utils';

describe('Master Detail', () => {
    let consoleErrorSpy: MockInstance;
    let consoleWarnSpy: MockInstance;

    function createGrid(gridOptions: GridOptions): GridApi {
        return gridMgr.createGrid('myGrid', gridOptions);
    }

    async function createGridAndWait(gridOptions: GridOptions): Promise<GridApi> {
        const api = createGrid(gridOptions);

        await waitForEvent('firstDataRendered', api);

        return api;
    }

    const gridMgr = new TestGridsManager({
        modules: [ClientSideRowModelModule, MasterDetailModule],
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

    test('master detail', async () => {
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
            rowSelection: { mode: 'multiRow', enableClickSelection: true },
        });

        api.forEachNode((node) => {
            node.master && node.setExpanded(true);
        });

        await waitForEvent('modelUpdated', api);

        getRowByIndex(0, '2')?.dispatchEvent(clickEvent());

        const detail = api.getDetailGridInfo('detail_0')!;

        assertSelectedRowsByIndex([0], detail.api!);
        const node = api.getRowNode('0');
        expect(node?.isSelected()).toBe(undefined);

        draw(api);
    });
});

function draw(api: any) {
    const gr = new GridRows(api);
    const tr = new GridRowsDiagramTree(gr);
    console.log(tr.diagramToString(false, null));
}
