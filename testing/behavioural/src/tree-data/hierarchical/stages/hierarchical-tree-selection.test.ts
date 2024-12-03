import { ClientSideRowModelModule } from 'ag-grid-community';
import { TreeDataModule } from 'ag-grid-enterprise';

import type { GridRowsOptions } from '../../../test-utils';
import { GridRows, TestGridsManager, cachedJSONObjects } from '../../../test-utils';

describe('ag-grid hierarchical tree selection', () => {
    const gridsManager = new TestGridsManager({
        modules: [ClientSideRowModelModule, TreeDataModule],
    });

    beforeEach(() => {
        vitest.useRealTimers();
        gridsManager.reset();
    });

    afterEach(() => {
        gridsManager.reset();
    });

    test('tree selection and update', async () => {
        const rowData = cachedJSONObjects.array([
            {
                id: '1',
                k: 'A',
                name: 'John Von Neumann',
                children: [
                    {
                        id: '2',
                        k: 'B',
                        name: 'Alan Turing',
                        children: [
                            { id: '4', k: 'D', name: 'Donald Knuth' },
                            { id: '5', k: 'E', name: 'Grace Hopper' },
                        ],
                    },
                    {
                        id: '3',
                        k: 'C',
                        name: 'A. Church',
                        children: [
                            { id: '6', k: 'F', name: 'Linus Torvalds' },
                            { id: '7', k: 'G', name: 'Brian Kernighan' },
                            {
                                id: 'h',
                                k: 'H',
                                children: [
                                    {
                                        id: '8',
                                        k: 'I',
                                        name: 'Claude Elwood Shannon',
                                    },
                                ],
                            },
                        ],
                    },
                ],
            },
            { id: '9', k: 'J', name: 'E. Dijkstra' },
        ]);

        const api = gridsManager.createGrid('myGrid', {
            columnDefs: [{ field: 'k' }, { field: 'name', filter: 'agTextColumnFilter' }],
            autoGroupColumnDef: { headerName: 'Hierarchy' },
            treeData: true,
            ['treeDataChildrenField' as any]: 'children',
            animateRows: false,
            rowSelection: { mode: 'multiRow' },
            groupDefaultExpanded: -1,
            rowData,
            getRowId: (params) => params.data.id,
        });

        const gridRowsOptions: GridRowsOptions = {
            columns: ['k', 'name'],
            checkDom: true,
            checkSelectedNodes: true,
        };

        api.setNodesSelected({
            nodes: [
                api.getRowNode('1')!,
                api.getRowNode('3')!,
                api.getRowNode('4')!,
                api.getRowNode('h')!,
                api.getRowNode('9')!,
            ],
            newValue: true,
        });

        await new GridRows(api, 'initial', gridRowsOptions).check(`
            ROOT id:ROOT_NODE_ID
            ├─┬ 1 GROUP selected id:1 k:"A" name:"John Von Neumann"
            │ ├─┬ 2 GROUP id:2 k:"B" name:"Alan Turing"
            │ │ ├── 4 LEAF selected id:4 k:"D" name:"Donald Knuth"
            │ │ └── 5 LEAF id:5 k:"E" name:"Grace Hopper"
            │ └─┬ 3 GROUP selected id:3 k:"C" name:"A. Church"
            │ · ├── 6 LEAF id:6 k:"F" name:"Linus Torvalds"
            │ · ├── 7 LEAF id:7 k:"G" name:"Brian Kernighan"
            │ · └─┬ h GROUP selected id:h k:"H" name:undefined
            │ · · └── 8 LEAF id:8 k:"I" name:"Claude Elwood Shannon"
            └── 9 LEAF selected id:9 k:"J" name:"E. Dijkstra"
        `);

        api.setNodesSelected({
            nodes: [api.getRowNode('8')!],
            newValue: true,
        });

        await new GridRows(api, 'select 8', gridRowsOptions).check(`
            ROOT id:ROOT_NODE_ID
            ├─┬ 1 GROUP selected id:1 k:"A" name:"John Von Neumann"
            │ ├─┬ 2 GROUP id:2 k:"B" name:"Alan Turing"
            │ │ ├── 4 LEAF selected id:4 k:"D" name:"Donald Knuth"
            │ │ └── 5 LEAF id:5 k:"E" name:"Grace Hopper"
            │ └─┬ 3 GROUP selected id:3 k:"C" name:"A. Church"
            │ · ├── 6 LEAF id:6 k:"F" name:"Linus Torvalds"
            │ · ├── 7 LEAF id:7 k:"G" name:"Brian Kernighan"
            │ · └─┬ h GROUP selected id:h k:"H" name:undefined
            │ · · └── 8 LEAF selected id:8 k:"I" name:"Claude Elwood Shannon"
            └── 9 LEAF selected id:9 k:"J" name:"E. Dijkstra"
        `);

        api.setGridOption(
            'rowData',
            cachedJSONObjects.array([
                {
                    id: '1',
                    k: 'A',
                    name: 'John Von Neumann',
                    children: [
                        {
                            id: 'y',
                            k: 'Y',
                            children: [
                                { id: '6', k: 'F', name: 'Linus Torvalds' },
                                { id: '5', k: 'E', name: 'Grace Hopper' },
                            ],
                        },
                        {
                            id: '2',
                            k: 'B',
                            name: 'Alan Turing',
                        },
                        {
                            id: '3',
                            k: 'X',
                            name: 'A. Church',
                            children: [{ id: '7', k: 'G', name: 'Brian Kernighan' }],
                        },
                    ],
                },
                { id: '9', k: 'J', name: 'E. Dijkstra' },
            ])
        );

        await new GridRows(api, 'rowData 2', gridRowsOptions).check(`
            ROOT id:ROOT_NODE_ID
            ├─┬ 1 GROUP selected id:1 k:"A" name:"John Von Neumann"
            │ ├─┬ y GROUP id:y k:"Y" name:undefined
            │ │ ├── 6 LEAF id:6 k:"F" name:"Linus Torvalds"
            │ │ └── 5 LEAF id:5 k:"E" name:"Grace Hopper"
            │ ├── 2 LEAF id:2 k:"B" name:"Alan Turing"
            │ └─┬ 3 GROUP selected id:3 k:"X" name:"A. Church"
            │ · └── 7 LEAF id:7 k:"G" name:"Brian Kernighan"
            └── 9 LEAF selected id:9 k:"J" name:"E. Dijkstra"
        `);

        api.setFilterModel({ name: { type: 'equals', filter: 'A. Church' } });

        await new GridRows(api, 'filtered', gridRowsOptions).check(`
            ROOT id:ROOT_NODE_ID
            └─┬ 1 GROUP selected id:1 k:"A" name:"John Von Neumann"
            · └─┬ 3 GROUP selected id:3 k:"X" name:"A. Church"
            · · └── 7 LEAF id:7 k:"G" name:"Brian Kernighan"
        `);
    });
});
