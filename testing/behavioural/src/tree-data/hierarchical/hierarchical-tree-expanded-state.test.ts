import { ClientSideRowModelModule } from 'ag-grid-community';
import { TreeDataModule } from 'ag-grid-enterprise';

import { GridRows, TestGridsManager, asyncSetTimeout } from '../../test-utils';
import type { GridRowsOptions } from '../../test-utils';

describe('ag-grid hierarchical tree expanded state', () => {
    const gridsManager = new TestGridsManager({
        modules: [ClientSideRowModelModule, TreeDataModule],
    });

    const gridRowsOptions: GridRowsOptions = {
        checkDom: true,
        columns: ['ag-Grid-AutoColumn'],
    };

    beforeEach(() => {
        gridsManager.reset();
    });

    afterEach(() => {
        vitest.clearAllTimers();
        vitest.useRealTimers();
        gridsManager.reset();
    });

    // Test for AG-12591
    test('When removing a group and so it gets replaced by a filler node, its expanded state is retained', async () => {
        const originalRowData = getOrgHierarchyData();
        let yooCounter = 0;

        const api = gridsManager.createGrid('myGrid', {
            columnDefs: [{ field: 'jobTitle' }, { field: 'employmentType' }],
            autoGroupColumnDef: {
                headerName: 'Name',
                valueGetter: (params) => params.data?.name ?? 'unknown',
            },
            treeData: true,
            treeDataChildrenField: 'children',
            animateRows: false,
            rowData: originalRowData,
            getRowId: ({ data }) => data.id,
            onRowGroupOpened: ({ data }) => {
                if (!data) return;
                const yoo = `yoo-${++yooCounter}`;

                data.children = [...data.children, { ...data, id: yoo }];

                api.setGridOption('rowData', api.getGridOption('rowData'));
            },
        });

        await asyncSetTimeout(1);

        await new GridRows(api, '', gridRowsOptions).check(`
            ROOT id:ROOT_NODE_ID ag-Grid-AutoColumn:"unknown"
            └─┬ 0 GROUP collapsed id:0 ag-Grid-AutoColumn:"Erica Rogers"
            · └─┬ 1 GROUP collapsed hidden id:1 ag-Grid-AutoColumn:"Malcolm Barrett"
            · · ├─┬ 2 GROUP collapsed hidden id:2 ag-Grid-AutoColumn:"Esther Baker"
            · · │ └─┬ 3 GROUP collapsed hidden id:3 ag-Grid-AutoColumn:"Brittany Hanson"
            · · │ · ├── 4 LEAF hidden id:4 ag-Grid-AutoColumn:"Leah Flowers"
            · · │ · └── 5 LEAF hidden id:5 ag-Grid-AutoColumn:"Tammy Sutton"
            · · ├── 6 LEAF hidden id:6 ag-Grid-AutoColumn:"Derek Paul"
            · · └─┬ 7 GROUP collapsed hidden id:7 ag-Grid-AutoColumn:"Francis Strickland"
            · · · ├── 8 LEAF hidden id:8 ag-Grid-AutoColumn:"Morris Hanson"
            · · · ├── 9 LEAF hidden id:9 ag-Grid-AutoColumn:"Todd Tyler"
            · · · ├── 10 LEAF hidden id:10 ag-Grid-AutoColumn:"Bennie Wise"
            · · · └── 11 LEAF hidden id:11 ag-Grid-AutoColumn:"Joel Cooper"
        `);

        api.getRowNode('0')!.setExpanded(true, undefined, true);
        api.getRowNode('1')!.setExpanded(true, undefined, true);

        await asyncSetTimeout(1);

        await new GridRows(api, '', gridRowsOptions).check(`
            ROOT id:ROOT_NODE_ID ag-Grid-AutoColumn:"unknown"
            └─┬ 0 GROUP id:0 ag-Grid-AutoColumn:"Erica Rogers"
            · ├─┬ 1 GROUP id:1 ag-Grid-AutoColumn:"Malcolm Barrett"
            · │ ├─┬ 2 GROUP collapsed id:2 ag-Grid-AutoColumn:"Esther Baker"
            · │ │ └─┬ 3 GROUP collapsed hidden id:3 ag-Grid-AutoColumn:"Brittany Hanson"
            · │ │ · ├── 4 LEAF hidden id:4 ag-Grid-AutoColumn:"Leah Flowers"
            · │ │ · └── 5 LEAF hidden id:5 ag-Grid-AutoColumn:"Tammy Sutton"
            · │ ├── 6 LEAF id:6 ag-Grid-AutoColumn:"Derek Paul"
            · │ ├─┬ 7 GROUP collapsed id:7 ag-Grid-AutoColumn:"Francis Strickland"
            · │ │ ├── 8 LEAF hidden id:8 ag-Grid-AutoColumn:"Morris Hanson"
            · │ │ ├── 9 LEAF hidden id:9 ag-Grid-AutoColumn:"Todd Tyler"
            · │ │ ├── 10 LEAF hidden id:10 ag-Grid-AutoColumn:"Bennie Wise"
            · │ │ └── 11 LEAF hidden id:11 ag-Grid-AutoColumn:"Joel Cooper"
            · │ └── yoo-2 LEAF id:yoo-2 ag-Grid-AutoColumn:"Malcolm Barrett"
            · └── yoo-1 LEAF id:yoo-1 ag-Grid-AutoColumn:"Erica Rogers"
        `);

        api.getRowNode('7')!.setExpanded(true, undefined, true);
        api.getRowNode('2')!.setExpanded(true, undefined, true);

        await asyncSetTimeout(1);

        await new GridRows(api, '', gridRowsOptions).check(`
            ROOT id:ROOT_NODE_ID ag-Grid-AutoColumn:"unknown"
            └─┬ 0 GROUP id:0 ag-Grid-AutoColumn:"Erica Rogers"
            · ├─┬ 1 GROUP id:1 ag-Grid-AutoColumn:"Malcolm Barrett"
            · │ ├─┬ 2 GROUP id:2 ag-Grid-AutoColumn:"Esther Baker"
            · │ │ ├─┬ 3 GROUP collapsed id:3 ag-Grid-AutoColumn:"Brittany Hanson"
            · │ │ │ ├── 4 LEAF hidden id:4 ag-Grid-AutoColumn:"Leah Flowers"
            · │ │ │ └── 5 LEAF hidden id:5 ag-Grid-AutoColumn:"Tammy Sutton"
            · │ │ └── yoo-4 LEAF id:yoo-4 ag-Grid-AutoColumn:"Esther Baker"
            · │ ├── 6 LEAF id:6 ag-Grid-AutoColumn:"Derek Paul"
            · │ ├─┬ 7 GROUP id:7 ag-Grid-AutoColumn:"Francis Strickland"
            · │ │ ├── 8 LEAF id:8 ag-Grid-AutoColumn:"Morris Hanson"
            · │ │ ├── 9 LEAF id:9 ag-Grid-AutoColumn:"Todd Tyler"
            · │ │ ├── 10 LEAF id:10 ag-Grid-AutoColumn:"Bennie Wise"
            · │ │ ├── 11 LEAF id:11 ag-Grid-AutoColumn:"Joel Cooper"
            · │ │ └── yoo-3 LEAF id:yoo-3 ag-Grid-AutoColumn:"Francis Strickland"
            · │ └── yoo-2 LEAF id:yoo-2 ag-Grid-AutoColumn:"Malcolm Barrett"
            · └── yoo-1 LEAF id:yoo-1 ag-Grid-AutoColumn:"Erica Rogers"
        `);
    });
});

function getOrgHierarchyData() {
    return [
        {
            id: '0',
            name: 'Erica Rogers',
            jobTitle: 'CEO',
            employmentType: 'Permanent',
            children: [
                {
                    id: '1',
                    name: 'Malcolm Barrett',
                    jobTitle: 'Exec. Vice President',
                    employmentType: 'Permanent',

                    children: [
                        {
                            id: '2',
                            name: 'Esther Baker',
                            jobTitle: 'Director of Operations',
                            employmentType: 'Permanent',

                            children: [
                                {
                                    id: '3',
                                    name: 'Brittany Hanson',
                                    jobTitle: 'Fleet Coordinator',
                                    employmentType: 'Permanent',

                                    children: [
                                        {
                                            id: '4',
                                            name: 'Leah Flowers',
                                            jobTitle: 'Parts Technician',
                                            employmentType: 'Contract',
                                        },

                                        {
                                            id: '5',
                                            name: 'Tammy Sutton',
                                            jobTitle: 'Service Technician',
                                            employmentType: 'Contract',
                                        },
                                    ],
                                },
                            ],
                        },

                        {
                            id: '6',
                            name: 'Derek Paul',
                            jobTitle: 'Inventory Control',
                            employmentType: 'Permanent',
                        },

                        {
                            id: '7',
                            name: 'Francis Strickland',
                            jobTitle: 'VP Sales',
                            employmentType: 'Permanent',

                            children: [
                                {
                                    id: '8',
                                    name: 'Morris Hanson',
                                    jobTitle: 'Sales Manager',
                                    employmentType: 'Permanent',
                                },
                                {
                                    id: '9',
                                    name: 'Todd Tyler',
                                    jobTitle: 'Sales Executive',
                                    employmentType: 'Contract',
                                },
                                {
                                    id: '10',
                                    name: 'Bennie Wise',
                                    jobTitle: 'Sales Executive',
                                    employmentType: 'Contract',
                                },
                                {
                                    id: '11',
                                    name: 'Joel Cooper',
                                    jobTitle: 'Sales Executive',
                                    employmentType: 'Permanent',
                                },
                            ],
                        },
                    ],
                },
            ],
        },
    ];
}
