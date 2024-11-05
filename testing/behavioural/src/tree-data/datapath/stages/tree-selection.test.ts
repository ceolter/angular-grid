import { ClientSideRowModelModule } from 'ag-grid-community';
import { TreeDataModule } from 'ag-grid-enterprise';

import type { GridRowsOptions } from '../../../test-utils';
import { GridRows, TestGridsManager, cachedJSONObjects } from '../../../test-utils';

describe('ag-grid tree selection', () => {
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
            { id: '1', name: 'John Von Neumann', orgHierarchy: ['A'] },
            { id: '2', name: 'Alan Turing', orgHierarchy: ['A', 'B'] },
            { id: '3', name: 'A. Church', orgHierarchy: ['A', 'C'] },
            { id: '4', name: 'Donald Knuth', orgHierarchy: ['A', 'B', 'D'] },
            { id: '5', name: 'Grace Hopper', orgHierarchy: ['A', 'B', 'E'] },
            { id: '6', name: 'Linus Torvalds', orgHierarchy: ['A', 'C', 'F'] },
            { id: '7', name: 'Brian Kernighan', orgHierarchy: ['A', 'C', 'G'] },
            { id: '8', name: 'Claude Elwood Shannon', orgHierarchy: ['A', 'C', 'H', 'I'] },
            { id: '9', name: 'E. Dijkstra', orgHierarchy: ['J'] },
        ]);

        const api = gridsManager.createGrid('myGrid', {
            columnDefs: [{ field: 'name', filter: 'agTextColumnFilter' }],
            autoGroupColumnDef: { headerName: 'Hierarchy' },
            treeData: true,
            animateRows: false,
            rowSelection: { mode: 'multiRow' },
            groupDefaultExpanded: -1,
            rowData,
            getRowId: (params) => params.data.id,
            getDataPath: (data: any) => data.orgHierarchy,
        });

        const gridRowsOptions: GridRowsOptions = {
            columns: ['name'],
            checkDom: true,
            checkSelectedNodes: true,
        };

        api.setNodesSelected({
            nodes: [
                api.getRowNode('1')!,
                api.getRowNode('3')!,
                api.getRowNode('4')!,
                api.getRowNode('row-group-0-A-1-C-2-H')!,
                api.getRowNode('9')!,
            ],
            newValue: true,
        });

        await new GridRows(api, 'initial', gridRowsOptions).check(`
            ROOT id:ROOT_NODE_ID
            ├─┬ A GROUP selected id:1 name:"John Von Neumann"
            │ ├─┬ B GROUP id:2 name:"Alan Turing"
            │ │ ├── D LEAF selected id:4 name:"Donald Knuth"
            │ │ └── E LEAF id:5 name:"Grace Hopper"
            │ └─┬ C GROUP selected id:3 name:"A. Church"
            │ · ├── F LEAF id:6 name:"Linus Torvalds"
            │ · ├── G LEAF id:7 name:"Brian Kernighan"
            │ · └─┬ H filler selected id:row-group-0-A-1-C-2-H
            │ · · └── I LEAF id:8 name:"Claude Elwood Shannon"
            └── J LEAF selected id:9 name:"E. Dijkstra"
        `);

        api.setNodesSelected({
            nodes: [api.getRowNode('8')!],
            newValue: true,
        });

        await new GridRows(api, 'select 8', gridRowsOptions).check(`
            ROOT id:ROOT_NODE_ID
            ├─┬ A GROUP selected id:1 name:"John Von Neumann"
            │ ├─┬ B GROUP id:2 name:"Alan Turing"
            │ │ ├── D LEAF selected id:4 name:"Donald Knuth"
            │ │ └── E LEAF id:5 name:"Grace Hopper"
            │ └─┬ C GROUP selected id:3 name:"A. Church"
            │ · ├── F LEAF id:6 name:"Linus Torvalds"
            │ · ├── G LEAF id:7 name:"Brian Kernighan"
            │ · └─┬ H filler selected id:row-group-0-A-1-C-2-H
            │ · · └── I LEAF selected id:8 name:"Claude Elwood Shannon"
            └── J LEAF selected id:9 name:"E. Dijkstra"
        `);

        api.setGridOption(
            'rowData',
            cachedJSONObjects.array([
                { id: '6', name: 'Linus Torvalds', orgHierarchy: ['A', 'Y', 'F'] },
                { id: '7', name: 'Brian Kernighan', orgHierarchy: ['A', 'X', 'G'] },
                { id: '2', name: 'Alan Turing', orgHierarchy: ['A', 'B'] },
                { id: '3', name: 'A. Church', orgHierarchy: ['A', 'X'] },
                { id: '1', name: 'John Von Neumann', orgHierarchy: ['A'] },
                { id: '5', name: 'Grace Hopper', orgHierarchy: ['A', 'Y', 'E'] },
                { id: '9', name: 'E. Dijkstra', orgHierarchy: ['J'] },
            ])
        );

        await new GridRows(api, 'rowData 2', gridRowsOptions).check(`
            ROOT id:ROOT_NODE_ID
            ├─┬ A GROUP selected id:1 name:"John Von Neumann"
            │ ├─┬ Y filler id:row-group-0-A-1-Y
            │ │ ├── F LEAF id:6 name:"Linus Torvalds"
            │ │ └── E LEAF id:5 name:"Grace Hopper"
            │ ├── B LEAF id:2 name:"Alan Turing"
            │ └─┬ X GROUP selected id:3 name:"A. Church"
            │ · └── G LEAF id:7 name:"Brian Kernighan"
            └── J LEAF selected id:9 name:"E. Dijkstra"
        `);

        api.setFilterModel({ name: { type: 'equals', filter: 'A. Church' } });

        await new GridRows(api, 'filtered', gridRowsOptions).check(`
            ROOT id:ROOT_NODE_ID
            └─┬ A GROUP selected id:1 name:"John Von Neumann"
            · └─┬ X GROUP selected id:3 name:"A. Church"
            · · └── G LEAF id:7 name:"Brian Kernighan"
        `);
    });
});
