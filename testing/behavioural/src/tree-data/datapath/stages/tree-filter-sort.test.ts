import { ClientSideRowModelModule } from 'ag-grid-community';
import { TreeDataModule } from 'ag-grid-enterprise';

import type { GridRowsOptions } from '../../../test-utils';
import { GridRows, TestGridsManager, cachedJSONObjects } from '../../../test-utils';

describe('ag-grid tree filter sort', () => {
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

    test('tree with custom filter', async () => {
        const rowData = [
            { id: '1', name: 'John Von Neumann', orgHierarchy: ['A'] },
            { id: '2', name: 'Alan Turing', orgHierarchy: ['A', 'B'] },
            { id: '3', name: 'A. Church', orgHierarchy: ['A', 'C'] },
            { id: '4', name: 'Donald Knuth', orgHierarchy: ['A', 'B', 'D'] },
            { id: '5', name: 'Grace Hopper', orgHierarchy: ['A', 'B', 'E'] },
        ];

        const api = gridsManager.createGrid('myGrid', {
            columnDefs: [{ field: 'name', filter: 'agTextColumnFilter' }],
            autoGroupColumnDef: { headerName: 'Hierarchy' },
            treeData: true,
            animateRows: false,
            groupDefaultExpanded: -1,
            rowData,
            getRowId: (params) => params.data.id,
            getDataPath: (data: any) => data.orgHierarchy,
        });

        const gridRowsOptions: GridRowsOptions = {
            printIds: false,
            columns: ['name'],
            checkDom: true,
        };

        await new GridRows(api, 'initial', gridRowsOptions).check(`
            ROOT
            └─┬ A GROUP name:"John Von Neumann"
            · ├─┬ B GROUP name:"Alan Turing"
            · │ ├── D LEAF name:"Donald Knuth"
            · │ └── E LEAF name:"Grace Hopper"
            · └── C LEAF name:"A. Church"
        `);

        api.setFilterModel({ name: { type: 'equals', filter: 'A. Church' } });

        await new GridRows(api, 'filter 1', gridRowsOptions).check(`
            ROOT
            └─┬ A GROUP name:"John Von Neumann"
            · └── C LEAF name:"A. Church"
        `);

        api.setGridOption('rowData', [
            { id: '1', name: 'John Von Neumann', orgHierarchy: ['A'] },
            { id: '2', name: 'Alan Turing', orgHierarchy: ['A', 'B'] },
            { id: '5', name: 'A. Church', orgHierarchy: ['A', 'B', 'E'] },
            { id: '3', name: 'A. Church', orgHierarchy: ['A', 'C'] },
            { id: '4', name: 'Donald Knuth', orgHierarchy: ['A', 'B', 'D'] },
        ]);

        await new GridRows(api, 'filter 1 rowData 2', gridRowsOptions).check(`
            ROOT
            └─┬ A GROUP name:"John Von Neumann"
            · ├─┬ B GROUP name:"Alan Turing"
            · │ └── E LEAF name:"A. Church"
            · └── C LEAF name:"A. Church"
        `);

        api.setFilterModel({ name: { type: 'equals', filter: 'Grace Hopper' } });

        api.setGridOption('rowData', rowData);

        await new GridRows(api, 'filter 2', gridRowsOptions).check(`
            ROOT
            └─┬ A GROUP name:"John Von Neumann"
            · └─┬ B GROUP name:"Alan Turing"
            · · └── E LEAF name:"Grace Hopper"
        `);

        api.setGridOption('rowData', [
            { id: '1', name: 'John Von Neumann', orgHierarchy: ['A'] },
            { id: '2', name: 'Grace Hopper', orgHierarchy: ['A', 'B'] },
            { id: '3', name: 'A. Church', orgHierarchy: ['A', 'C', 'J'] },
            { id: '4', name: 'Donald Knuth', orgHierarchy: ['A', 'B', 'D'] },
            { id: '5', name: 'Grace Hopper', orgHierarchy: ['A', 'B', 'E', 'W'] },
            { id: '6', name: 'unknown', orgHierarchy: ['A', 'C', 'K'] },
        ]);

        await new GridRows(api, 'filter 2 rowData 2', gridRowsOptions).check(`
            ROOT
            └─┬ A GROUP name:"John Von Neumann"
            · └─┬ B GROUP name:"Grace Hopper"
            · · ├── D LEAF name:"Donald Knuth"
            · · └─┬ E filler
            · · · └── W LEAF name:"Grace Hopper"
        `);

        api.setFilterModel({ name: { type: 'equals', filter: 'Donald Knuth' } });

        await new GridRows(api, 'filter 3 rowData 2', gridRowsOptions).check(`
            ROOT
            └─┬ A GROUP name:"John Von Neumann"
            · └─┬ B GROUP name:"Grace Hopper"
            · · └── D LEAF name:"Donald Knuth"
        `);

        api.setGridOption('rowData', rowData);

        await new GridRows(api, 'filter 3', gridRowsOptions).check(`
            ROOT
            └─┬ A GROUP name:"John Von Neumann"
            · └─┬ B GROUP name:"Alan Turing"
            · · └── D LEAF name:"Donald Knuth"
        `);

        api.setFilterModel({ name: { type: 'equals', filter: 'Kurt Gödel' } });

        await new GridRows(api, 'filter 4', gridRowsOptions).check(`
            ROOT
        `);

        api.setGridOption('rowData', [
            { id: '1', name: 'Kurt Gödel', orgHierarchy: ['A'] },
            { id: '2', name: 'Alan Turing', orgHierarchy: ['A', 'B'] },
            { id: '3', name: 'A. Church', orgHierarchy: ['A', 'C'] },
            { id: '4', name: 'Donald Knuth', orgHierarchy: ['A', 'B', 'D'] },
            { id: '5', name: 'Grace Hopper', orgHierarchy: ['A', 'B', 'E'] },
        ]);

        await new GridRows(api, 'filter 4 rowData 3', gridRowsOptions).check(`
            ROOT
            └─┬ A GROUP name:"Kurt Gödel"
            · ├─┬ B GROUP name:"Alan Turing"
            · │ ├── D LEAF name:"Donald Knuth"
            · │ └── E LEAF name:"Grace Hopper"
            · └── C LEAF name:"A. Church"
        `);

        api.setFilterModel({});

        api.setGridOption('rowData', rowData);

        await new GridRows(api, 'no filter', gridRowsOptions).check(`
            ROOT
            └─┬ A GROUP name:"John Von Neumann"
            · ├─┬ B GROUP name:"Alan Turing"
            · │ ├── D LEAF name:"Donald Knuth"
            · │ └── E LEAF name:"Grace Hopper"
            · └── C LEAF name:"A. Church"
        `);
    });

    test('tree with sort', async () => {
        const rowData = cachedJSONObjects.array([
            { id: '1', value: 12, x: 1, orgHierarchy: ['A'] },
            { id: '2', value: 17, x: 1, orgHierarchy: ['A', 'B'] },
            { id: '3', value: 15, x: 1, orgHierarchy: ['A', 'C'] },
            { id: '4', value: 13, x: 1, orgHierarchy: ['A', 'B', 'D'] },
            { id: '5', value: 11, x: 0, orgHierarchy: ['A', 'B', 'E'] },
            { id: '6', value: 10, x: 0, orgHierarchy: ['A', 'F', 'G'] },
            { id: '7', value: 16, x: 1, orgHierarchy: ['A', 'F', 'H'] },
        ]);

        const api = gridsManager.createGrid('myGrid', {
            columnDefs: [
                { field: 'value', sortable: true, type: 'numericColumn', filter: 'agNumberColumnFilter' },
                { field: 'x', sortable: true, type: 'numericColumn', filter: 'agNumberColumnFilter' },
            ],
            autoGroupColumnDef: { headerName: 'Hierarchy' },
            treeData: true,
            animateRows: false,
            groupDefaultExpanded: -1,
            rowData,
            getRowId: (params) => params.data.id,
            getDataPath: (data: any) => data.orgHierarchy,
        });

        const gridRowsOptions: GridRowsOptions = {
            printIds: false,
            columns: ['value', 'x'],
            checkDom: true,
        };

        await new GridRows(api, 'initial', gridRowsOptions).check(`
            ROOT
            └─┬ A GROUP value:12 x:1
            · ├─┬ B GROUP value:17 x:1
            · │ ├── D LEAF value:13 x:1
            · │ └── E LEAF value:11 x:0
            · ├── C LEAF value:15 x:1
            · └─┬ F filler
            · · ├── G LEAF value:10 x:0
            · · └── H LEAF value:16 x:1
        `);

        api.applyColumnState({
            state: [{ colId: 'value', sort: 'asc' }],
        });

        await new GridRows(api, 'sort value asc', gridRowsOptions).check(`
            ROOT
            └─┬ A GROUP value:12 x:1
            · ├─┬ F filler
            · │ ├── G LEAF value:10 x:0
            · │ └── H LEAF value:16 x:1
            · ├── C LEAF value:15 x:1
            · └─┬ B GROUP value:17 x:1
            · · ├── E LEAF value:11 x:0
            · · └── D LEAF value:13 x:1
        `);

        api.setGridOption(
            'rowData',
            cachedJSONObjects.array([
                { id: '7', value: 16, x: 1, orgHierarchy: ['A', 'F', 'H'] },
                { id: '1', value: 12, x: 1, orgHierarchy: ['A'] },
                { id: '6', value: 10, x: 0, orgHierarchy: ['A', 'F', 'G'] },
                { id: '3', value: 15, x: 1, orgHierarchy: ['A', 'C'] },
                { id: '5', value: 11, x: 0, orgHierarchy: ['A', 'B', 'e'] },
                { id: '4', value: 13, x: 1, orgHierarchy: ['A', 'B', 'd'] },
                { id: '2', value: 17, x: 1, orgHierarchy: ['A', 'B'] },
            ])
        );

        await new GridRows(api, 'sort value asc rowData 2', gridRowsOptions).check(`
            ROOT
            └─┬ A GROUP value:12 x:1
            · ├─┬ F filler
            · │ ├── G LEAF value:10 x:0
            · │ └── H LEAF value:16 x:1
            · ├── C LEAF value:15 x:1
            · └─┬ B GROUP value:17 x:1
            · · ├── e LEAF value:11 x:0
            · · └── d LEAF value:13 x:1
        `);

        api.applyColumnState({
            state: [{ colId: 'value', sort: 'desc' }],
        });

        await new GridRows(api, 'sort value desc  rowData 2', gridRowsOptions).check(`
            ROOT
            └─┬ A GROUP value:12 x:1
            · ├─┬ B GROUP value:17 x:1
            · │ ├── d LEAF value:13 x:1
            · │ └── e LEAF value:11 x:0
            · ├── C LEAF value:15 x:1
            · └─┬ F filler
            · · ├── H LEAF value:16 x:1
            · · └── G LEAF value:10 x:0
        `);

        api.setGridOption('rowData', rowData);

        await new GridRows(api, 'sort value desc', gridRowsOptions).check(`
            ROOT
            └─┬ A GROUP value:12 x:1
            · ├─┬ B GROUP value:17 x:1
            · │ ├── D LEAF value:13 x:1
            · │ └── E LEAF value:11 x:0
            · ├── C LEAF value:15 x:1
            · └─┬ F filler
            · · ├── H LEAF value:16 x:1
            · · └── G LEAF value:10 x:0
        `);

        api.applyColumnState({
            state: [
                { colId: 'value', sort: null },
                { colId: 'x', sort: 'asc' },
            ],
        });

        await new GridRows(api, 'sort x asc', gridRowsOptions).check(`
            ROOT
            └─┬ A GROUP value:12 x:1
            · ├─┬ F filler
            · │ ├── G LEAF value:10 x:0
            · │ └── H LEAF value:16 x:1
            · ├─┬ B GROUP value:17 x:1
            · │ ├── E LEAF value:11 x:0
            · │ └── D LEAF value:13 x:1
            · └── C LEAF value:15 x:1
        `);

        api.applyColumnState({
            state: [{ colId: 'x', sort: 'desc' }],
        });

        await new GridRows(api, 'sort x desc', gridRowsOptions).check(`
            ROOT
            └─┬ A GROUP value:12 x:1
            · ├─┬ B GROUP value:17 x:1
            · │ ├── D LEAF value:13 x:1
            · │ └── E LEAF value:11 x:0
            · ├── C LEAF value:15 x:1
            · └─┬ F filler
            · · ├── H LEAF value:16 x:1
            · · └── G LEAF value:10 x:0
        `);

        api.setGridOption(
            'rowData',
            cachedJSONObjects.array([
                { id: '7', value: 16, x: 1, orgHierarchy: ['A', 'F', 'H'] },
                { id: '1', value: 12, x: 1, orgHierarchy: ['A'] },
                { id: '6', value: 10, x: 1, orgHierarchy: ['A', 'F', 'G'] },
                { id: '3', value: 15, x: 0, orgHierarchy: ['A', 'C'] },
                { id: '5', value: 11, x: 1, orgHierarchy: ['A', 'B', 'E'] },
                { id: '4', value: 13, x: 0, orgHierarchy: ['A', 'B', 'D'] },
                { id: '2', value: 17, x: 1, orgHierarchy: ['A', 'B'] },
            ])
        );

        await new GridRows(api, 'sort x desc rowData 3', gridRowsOptions).check(`
            ROOT
            └─┬ A GROUP value:12 x:1
            · ├─┬ B GROUP value:17 x:1
            · │ ├── E LEAF value:11 x:1
            · │ └── D LEAF value:13 x:0
            · ├── C LEAF value:15 x:0
            · └─┬ F filler
            · · ├── H LEAF value:16 x:1
            · · └── G LEAF value:10 x:1
        `);

        api.setFilterModel({ x: { type: 'equals', filter: 0 } });

        await new GridRows(api, 'sort x desc, filter x===0, rowData 3', gridRowsOptions).check(`
            ROOT
            └─┬ A GROUP value:12 x:1
            · ├─┬ B GROUP value:17 x:1
            · │ └── D LEAF value:13 x:0
            · └── C LEAF value:15 x:0
        `);

        api.setGridOption('rowData', rowData);

        await new GridRows(api, 'sort x desc, filter x===0, rowData 3', gridRowsOptions).check(`
            ROOT
            └─┬ A GROUP value:12 x:1
            · ├─┬ B GROUP value:17 x:1
            · │ └── E LEAF value:11 x:0
            · └─┬ F filler
            · · └── G LEAF value:10 x:0
        `);

        api.applyColumnState({
            state: [{ colId: 'x', sort: 'asc' }],
        });

        await new GridRows(api, 'sort x desc, filter x===0', gridRowsOptions).check(`
            ROOT
            └─┬ A GROUP value:12 x:1
            · ├─┬ F filler
            · │ └── G LEAF value:10 x:0
            · └─┬ B GROUP value:17 x:1
            · · └── E LEAF value:11 x:0
        `);
    });
});
