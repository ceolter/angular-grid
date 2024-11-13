import { ClientSideRowModelModule } from 'ag-grid-community';
import { TreeDataModule } from 'ag-grid-enterprise';

import { GridRows, TestGridsManager, getRowsSnapshot } from '../../test-utils';
import type { GridRowsOptions } from '../../test-utils';
import { simpleHierarchyRowsSnapshot } from './simpleHierarchyRowsSnapshot';

describe('ag-grid grouping tree data with groupRows', () => {
    const gridsManager = new TestGridsManager({
        modules: [ClientSideRowModelModule, TreeDataModule],
    });

    beforeEach(() => {
        gridsManager.reset();
    });

    afterEach(() => {
        gridsManager.reset();
    });

    test('tree grouping rows snapshot', async () => {
        const rowData = [
            { orgHierarchy: ['A'] },
            { orgHierarchy: ['A', 'B'] },
            { orgHierarchy: ['C', 'D'] },
            { orgHierarchy: ['E', 'F', 'G', 'H'] },
        ];

        const getDataPath = (data: any) => data.orgHierarchy;

        const api = gridsManager.createGrid('myGrid', {
            columnDefs: [
                {
                    field: 'type',
                    valueGetter: (params) => (params.data ? 'Provided' : params.node?.parent ? 'Filler' : 'Root'),
                },
            ],
            autoGroupColumnDef: { headerName: 'Organisation Hierarchy' },
            treeData: true,
            animateRows: false,
            groupDefaultExpanded: -1,
            rowData,
            getDataPath,
            groupDisplayType: 'groupRows',
        });

        const gridRowsOptions: GridRowsOptions = {
            checkDom: false,
            columns: ['type'],
        };

        const gridRows = new GridRows(api, '', gridRowsOptions);
        await gridRows.check(`
            ROOT id:ROOT_NODE_ID type:"Root"
            ├─┬ A GROUP id:0 type:"Provided"
            │ └── B LEAF id:1 type:"Provided"
            ├─┬ C filler id:row-group-0-C type:"Filler"
            │ └── D LEAF id:2 type:"Provided"
            └─┬ E filler id:row-group-0-E type:"Filler"
            · └─┬ F filler id:row-group-0-E-1-F type:"Filler"
            · · └─┬ G filler id:row-group-0-E-1-F-2-G type:"Filler"
            · · · └── H LEAF id:3 type:"Provided"
        `);

        const rows = gridRows.rowNodes;
        expect(rows.length).toBe(8);
        const rowsSnapshot = getRowsSnapshot(rows);

        expect(rows[0].data).toEqual(rowData[0]);
        expect(rows[1].data).toEqual(rowData[1]);
        expect(rows[2].data).toEqual(undefined);
        expect(rows[3].data).toEqual(rowData[2]);
        expect(rows[4].data).toEqual(undefined);
        expect(rows[5].data).toEqual(undefined);
        expect(rows[6].data).toEqual(undefined);
        expect(rows[7].data).toEqual(rowData[3]);

        expect(rowsSnapshot).toMatchObject(
            simpleHierarchyRowsSnapshot().map((row) => {
                return {
                    ...row,
                    groupData: {},
                };
            })
        );
    });
});
