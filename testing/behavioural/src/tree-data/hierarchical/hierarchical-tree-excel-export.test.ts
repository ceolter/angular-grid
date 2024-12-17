import XLSX from 'xlsx';

import { ClientSideRowModelModule } from 'ag-grid-community';
import { ExcelExportModule, TreeDataModule } from 'ag-grid-enterprise';

import { TestGridsManager, objectUrls } from '../../test-utils';

describe('ag-grid hierarchical tree excel export', () => {
    const gridsManager = new TestGridsManager({
        modules: [ClientSideRowModelModule, TreeDataModule, ExcelExportModule],
    });

    beforeEach(() => {
        objectUrls.init();
        gridsManager.reset();
    });

    afterEach(() => {
        vitest.restoreAllMocks();
        gridsManager.reset();
    });

    test('excel exports calls value getter for groups and leafs', async () => {
        const rowData = [
            {
                uiId: '1',
                value: 100,
                children: [
                    {
                        uiId: '2',
                        value: 200,
                        children: [
                            { uiId: '3', value: 300 },
                            { uiId: '4', value: 400 },
                        ],
                    },
                    { uiId: '5', value: 500 },
                ],
            },
        ];

        const api = gridsManager.createGrid('myGrid', {
            columnDefs: [
                {
                    headerName: 'value',
                    valueGetter: ({ data }) => (data ? 'value-' + data.value : 'filler'),
                },
            ],
            autoGroupColumnDef: {
                valueGetter: (params) => {
                    return 'grp-' + params.node?.rowIndex;
                },
            },
            rowData,
            treeData: true,
            groupDefaultExpanded: -1,
            ['treeDataChildrenField' as any]: 'children',
            getRowId: (params) => params.data.uiId,
        });

        api.exportDataAsExcel({ fileName: 'test.xlsx' });

        expect(await getExcelJsonData(await objectUrls.pullBlob())).toEqual([
            { Group: 'grp-0', value: 'value-100' },
            { Group: 'grp-1', value: 'value-200' },
            { Group: 'grp-2', value: 'value-300' },
            { Group: 'grp-3', value: 'value-400' },
            { Group: 'grp-4', value: 'value-500' },
        ]);

        // Try to disable tree data now
        api.setGridOption('treeData', false);

        api.exportDataAsExcel({ fileName: 'test.xlsx' });

        expect(await getExcelJsonData(await objectUrls.pullBlob())).toEqual([
            { value: 'value-100' },
            { value: 'value-200' },
            { value: 'value-300' },
            { value: 'value-400' },
            { value: 'value-500' },
        ]);
    });
});

async function getExcelJsonData(blob: Blob) {
    const workbook = XLSX.read(new Uint8Array(await blob.arrayBuffer()), { type: 'array' });
    return XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
}
