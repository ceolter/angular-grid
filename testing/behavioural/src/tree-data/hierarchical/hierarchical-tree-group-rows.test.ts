import { ClientSideRowModelModule } from 'ag-grid-community';
import { TreeDataModule } from 'ag-grid-enterprise';

import { GridRows, TestGridsManager } from '../../test-utils';
import type { GridRowsOptions } from '../../test-utils';

describe('ag-grid grouping hierarchical tree data with groupRows', () => {
    const gridsManager = new TestGridsManager({
        modules: [ClientSideRowModelModule, TreeDataModule],
    });

    beforeEach(() => {
        gridsManager.reset();
    });

    afterEach(() => {
        gridsManager.reset();
    });

    test('tree grouping', async () => {
        const rowData = [
            { x: 'A', children: [{ x: 'B' }] },
            { x: 'C', children: [{ x: 'D' }] },
            { x: 'E', children: [{ x: 'F', children: [{ x: 'G', children: [{ x: 'H' }] }] }] },
        ];

        const api = gridsManager.createGrid('myGrid', {
            columnDefs: [{ field: 'x' }],
            treeData: true,
            ['treeDataChildrenField' as any]: 'children',
            autoGroupColumnDef: { headerName: 'tree' },
            animateRows: false,
            groupDefaultExpanded: -1,
            rowData,
            groupDisplayType: 'groupRows',
        });

        const gridRowsOptions: GridRowsOptions = {
            checkDom: false,
            columns: true,
        };

        const gridRows = new GridRows(api, '', gridRowsOptions);
        await gridRows.check(`
            ROOT id:ROOT_NODE_ID
            ├─┬ 0 GROUP id:0 x:"A"
            │ └── 1 LEAF id:1 x:"B"
            ├─┬ 2 GROUP id:2 x:"C"
            │ └── 3 LEAF id:3 x:"D"
            └─┬ 4 GROUP id:4 x:"E"
            · └─┬ 5 GROUP id:5 x:"F"
            · · └─┬ 6 GROUP id:6 x:"G"
            · · · └── 7 LEAF id:7 x:"H"
        `);
    });
});
