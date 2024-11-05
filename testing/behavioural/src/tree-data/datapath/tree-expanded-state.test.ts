import { ClientSideRowModelModule } from 'ag-grid-community';
import { TreeDataModule } from 'ag-grid-enterprise';

import { GridRows, TestGridsManager, asyncSetTimeout } from '../../test-utils';
import type { GridRowsOptions } from '../../test-utils';

const getDataPath = (data: any) => data.orgHierarchy;

describe('ag-grid tree expanded state', () => {
    const gridsManager = new TestGridsManager({
        modules: [ClientSideRowModelModule, TreeDataModule],
    });

    const gridRowsOptions: GridRowsOptions = {
        checkDom: true,
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
                headerName: 'Organisation Hierarchy',
                cellRendererParams: { suppressCount: true },
            },
            defaultColDef: { flex: 1 },
            treeData: true,
            animateRows: false,
            rowData: originalRowData,
            getRowId: ({ data }) => data.id,
            getDataPath,
            onRowGroupOpened: ({ data }) => {
                if (!data) return;
                const oldEntries = api.getGridOption('rowData') ?? [];
                const yoo = `yoo-${++yooCounter}`;
                const newEntries = [
                    ...(data.orgHierarchy.length < 3 ? oldEntries : oldEntries.filter((b) => b.id !== data.id)),
                    {
                        ...data,
                        id: yoo,
                        orgHierarchy: [...(data?.orgHierarchy ?? []), yoo],
                    },
                ];

                api.setGridOption('rowData', newEntries);
            },
        });

        await asyncSetTimeout(1);

        await new GridRows(api, '', gridRowsOptions).check(`
            ROOT id:ROOT_NODE_ID
            └─┬ "Erica Rogers" GROUP collapsed id:0
            · └─┬ "Malcolm Barrett" GROUP collapsed hidden id:1
            · · ├─┬ "Esther Baker" GROUP collapsed hidden id:2
            · · │ ├─┬ "Brittany Hanson" GROUP collapsed hidden id:3
            · · │ │ ├── "Leah Flowers" LEAF hidden id:4
            · · │ │ └── "Tammy Sutton" LEAF hidden id:5
            · · │ └── "Derek Paul" LEAF hidden id:6
            · · └─┬ "Francis Strickland" GROUP collapsed hidden id:7
            · · · ├── "Morris Hanson" LEAF hidden id:8
            · · · ├── "Todd Tyler" LEAF hidden id:9
            · · · ├── "Bennie Wise" LEAF hidden id:10
            · · · └── "Joel Cooper" LEAF hidden id:11
        `);

        api.getRowNode('0')!.setExpanded(true, undefined, true);
        api.getRowNode('1')!.setExpanded(true, undefined, true);

        await asyncSetTimeout(1);

        await new GridRows(api, '', gridRowsOptions).check(`
            ROOT id:ROOT_NODE_ID
            └─┬ "Erica Rogers" GROUP id:0
            · ├─┬ "Malcolm Barrett" GROUP id:1
            · │ ├─┬ "Esther Baker" GROUP collapsed id:2
            · │ │ ├─┬ "Brittany Hanson" GROUP collapsed hidden id:3
            · │ │ │ ├── "Leah Flowers" LEAF hidden id:4
            · │ │ │ └── "Tammy Sutton" LEAF hidden id:5
            · │ │ └── "Derek Paul" LEAF hidden id:6
            · │ ├─┬ "Francis Strickland" GROUP collapsed id:7
            · │ │ ├── "Morris Hanson" LEAF hidden id:8
            · │ │ ├── "Todd Tyler" LEAF hidden id:9
            · │ │ ├── "Bennie Wise" LEAF hidden id:10
            · │ │ └── "Joel Cooper" LEAF hidden id:11
            · │ └── yoo-2 LEAF id:yoo-2
            · └── yoo-1 LEAF id:yoo-1
        `);

        api.getRowNode('7')!.setExpanded(true, undefined, true);
        api.getRowNode('2')!.setExpanded(true, undefined, true);

        await asyncSetTimeout(1);

        await new GridRows(api, '', gridRowsOptions).check(`
            ROOT id:ROOT_NODE_ID
            └─┬ "Erica Rogers" GROUP id:0
            · ├─┬ "Malcolm Barrett" GROUP id:1
            · │ ├─┬ "Esther Baker" filler id:"row-group-0-Erica Rogers-1-Malcolm Barrett-2-Esther Baker"
            · │ │ ├─┬ "Brittany Hanson" GROUP collapsed id:3
            · │ │ │ ├── "Leah Flowers" LEAF hidden id:4
            · │ │ │ └── "Tammy Sutton" LEAF hidden id:5
            · │ │ ├── "Derek Paul" LEAF id:6
            · │ │ └── yoo-4 LEAF id:yoo-4
            · │ ├─┬ "Francis Strickland" filler id:"row-group-0-Erica Rogers-1-Malcolm Barrett-2-Francis Strickland"
            · │ │ ├── "Morris Hanson" LEAF id:8
            · │ │ ├── "Todd Tyler" LEAF id:9
            · │ │ ├── "Bennie Wise" LEAF id:10
            · │ │ ├── "Joel Cooper" LEAF id:11
            · │ │ └── yoo-3 LEAF id:yoo-3
            · │ └── yoo-2 LEAF id:yoo-2
            · └── yoo-1 LEAF id:yoo-1
        `);
    });
});

function getOrgHierarchyData() {
    return [
        {
            id: '0',
            orgHierarchy: ['Erica Rogers'],
            jobTitle: 'CEO',
            employmentType: 'Permanent',
        },
        {
            id: '1',
            orgHierarchy: ['Erica Rogers', 'Malcolm Barrett'],
            jobTitle: 'Exec. Vice President',
            employmentType: 'Permanent',
        },

        {
            id: '2',
            orgHierarchy: ['Erica Rogers', 'Malcolm Barrett', 'Esther Baker'],
            jobTitle: 'Director of Operations',
            employmentType: 'Permanent',
        },
        {
            id: '3',
            orgHierarchy: ['Erica Rogers', 'Malcolm Barrett', 'Esther Baker', 'Brittany Hanson'],
            jobTitle: 'Fleet Coordinator',
            employmentType: 'Permanent',
        },
        {
            id: '4',
            orgHierarchy: ['Erica Rogers', 'Malcolm Barrett', 'Esther Baker', 'Brittany Hanson', 'Leah Flowers'],
            jobTitle: 'Parts Technician',
            employmentType: 'Contract',
        },
        {
            id: '5',
            orgHierarchy: ['Erica Rogers', 'Malcolm Barrett', 'Esther Baker', 'Brittany Hanson', 'Tammy Sutton'],
            jobTitle: 'Service Technician',
            employmentType: 'Contract',
        },
        {
            id: '6',
            orgHierarchy: ['Erica Rogers', 'Malcolm Barrett', 'Esther Baker', 'Derek Paul'],
            jobTitle: 'Inventory Control',
            employmentType: 'Permanent',
        },

        {
            id: '7',
            orgHierarchy: ['Erica Rogers', 'Malcolm Barrett', 'Francis Strickland'],
            jobTitle: 'VP Sales',
            employmentType: 'Permanent',
        },
        {
            id: '8',
            orgHierarchy: ['Erica Rogers', 'Malcolm Barrett', 'Francis Strickland', 'Morris Hanson'],
            jobTitle: 'Sales Manager',
            employmentType: 'Permanent',
        },
        {
            id: '9',
            orgHierarchy: ['Erica Rogers', 'Malcolm Barrett', 'Francis Strickland', 'Todd Tyler'],
            jobTitle: 'Sales Executive',
            employmentType: 'Contract',
        },
        {
            id: '10',
            orgHierarchy: ['Erica Rogers', 'Malcolm Barrett', 'Francis Strickland', 'Bennie Wise'],
            jobTitle: 'Sales Executive',
            employmentType: 'Contract',
        },
        {
            id: '11',
            orgHierarchy: ['Erica Rogers', 'Malcolm Barrett', 'Francis Strickland', 'Joel Cooper'],
            jobTitle: 'Sales Executive',
            employmentType: 'Permanent',
        },
    ];
}
