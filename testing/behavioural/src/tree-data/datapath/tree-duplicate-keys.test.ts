import type { MockInstance } from 'vitest';

import { ClientSideRowModelModule } from 'ag-grid-community';
import { TreeDataModule } from 'ag-grid-enterprise';

import { GridRows, TestGridsManager } from '../../test-utils';

const getDataPath = (data: any) => data.orgHierarchy;

describe('ag-grid tree duplicate keys', () => {
    const gridsManager = new TestGridsManager({
        modules: [ClientSideRowModelModule, TreeDataModule],
    });

    const gridRowsOptions = {
        checkDom: true,
    };

    let consoleWarnSpy: MockInstance;

    beforeEach(() => {
        gridsManager.reset();
    });

    afterEach(() => {
        gridsManager.reset();
        consoleWarnSpy?.mockRestore();
    });

    test('preserves the first root child duplicate, and can recover when renamed', async () => {
        const rowData = [
            { id: 'KtTkR5g-0', orgHierarchy: ['A'] },
            { id: 'X80CJzw-1', orgHierarchy: ['A'] },
        ];

        consoleWarnSpy = vitest.spyOn(console, 'warn').mockImplementation(() => {});

        const api = gridsManager.createGrid('myGrid', {
            columnDefs: [],
            treeData: true,
            animateRows: false,
            groupDefaultExpanded: -1,
            rowData,
            getDataPath,
            getRowId: (params) => params.data.id,
        });

        expect(consoleWarnSpy).toHaveBeenCalledWith(
            'AG Grid: error #186',
            'duplicate group keys for row data, keys should be unique',
            rowData[0].id,
            rowData[0],
            rowData[1],
            expect.stringContaining('errors/186?')
        );
        consoleWarnSpy?.mockRestore();

        await new GridRows(api, '', gridRowsOptions).check(`
            ROOT id:ROOT_NODE_ID
            └── A LEAF id:KtTkR5g-0
        `);

        consoleWarnSpy = vitest.spyOn(console, 'warn').mockImplementation(() => {});

        api.setGridOption('rowData', [
            { id: 'KtTkR5g-0', orgHierarchy: ['A'] },
            { id: 'X80CJzw-1', orgHierarchy: ['B'] },
        ]);

        expect(consoleWarnSpy).not.toHaveBeenCalled();
        consoleWarnSpy?.mockRestore();

        await new GridRows(api, 'after update', gridRowsOptions).check(`
            ROOT id:ROOT_NODE_ID
            ├── A LEAF id:KtTkR5g-0
            └── B LEAF id:X80CJzw-1
        `);
    });

    test('can handle duplicate leafs of a group, and can recover when moved', async () => {
        const rowData = [
            { id: 'j4SDrJw-0', orgHierarchy: ['A', 'B'] },
            { id: 'BexVZIg-1', orgHierarchy: ['A', 'B'] },
        ];

        consoleWarnSpy = vitest.spyOn(console, 'warn').mockImplementation(() => {});

        const api = gridsManager.createGrid('myGrid', {
            columnDefs: [],
            treeData: true,
            animateRows: false,
            groupDefaultExpanded: -1,
            rowData,
            getDataPath,
            getRowId: (params) => params.data.id,
        });

        expect(consoleWarnSpy).toHaveBeenCalledWith(
            'AG Grid: error #186',
            'duplicate group keys for row data, keys should be unique',
            rowData[0].id,
            rowData[0],
            rowData[1],
            expect.stringContaining('errors/186?')
        );
        consoleWarnSpy?.mockRestore();

        await new GridRows(api, '', gridRowsOptions).check(`
            ROOT id:ROOT_NODE_ID
            └─┬ A filler id:row-group-0-A
            · └── B LEAF id:j4SDrJw-0
        `);

        consoleWarnSpy = vitest.spyOn(console, 'warn').mockImplementation(() => {});

        api.applyTransaction({
            update: [{ id: rowData[1].id, orgHierarchy: ['A', 'B', 'C'] }],
        });

        expect(consoleWarnSpy).not.toHaveBeenCalled();
        consoleWarnSpy?.mockRestore();

        await new GridRows(api, 'updated', gridRowsOptions).check(`
            ROOT id:ROOT_NODE_ID
            └─┬ A filler id:row-group-0-A
            · └─┬ B GROUP id:j4SDrJw-0
            · · └── C LEAF id:BexVZIg-1
        `);
    });

    test('preserves the first duplicate, but can recover renaming it, allowing swapping', async () => {
        const rowData = [
            { id: 'UzWrPgX-0', orgHierarchy: ['A', 'B'] },
            { id: 'q7lpQ9A-1', orgHierarchy: ['A', 'B', 'C'] },
            { id: 'zIJkvFA-2', orgHierarchy: ['A', 'B'] },
            { id: 'NXtKeUA-3', orgHierarchy: ['A', 'B', 'D'] },
        ];

        consoleWarnSpy = vitest.spyOn(console, 'warn').mockImplementation(() => {});

        const api = gridsManager.createGrid('myGrid', {
            columnDefs: [],
            treeData: true,
            animateRows: false,
            groupDefaultExpanded: -1,
            rowData,
            getDataPath,
            getRowId: (params) => params.data.id,
        });

        expect(consoleWarnSpy).toHaveBeenCalledWith(
            'AG Grid: error #186',
            'duplicate group keys for row data, keys should be unique',
            rowData[0].id,
            rowData[0],
            rowData[2],
            expect.stringContaining('errors/186?')
        );

        consoleWarnSpy?.mockRestore();

        await new GridRows(api, '', gridRowsOptions).check(`
            ROOT id:ROOT_NODE_ID
            └─┬ A filler id:row-group-0-A
            · └─┬ B GROUP id:UzWrPgX-0
            · · ├── C LEAF id:q7lpQ9A-1
            · · └── D LEAF id:NXtKeUA-3
        `);

        consoleWarnSpy = vitest.spyOn(console, 'warn').mockImplementation(() => {});

        api.setGridOption('rowData', [
            { id: 'UzWrPgX-0', orgHierarchy: ['A', 'X'] },
            { id: 'q7lpQ9A-1', orgHierarchy: ['A', 'B', 'C'] },
            { id: 'zIJkvFA-2', orgHierarchy: ['A', 'B'] },
            { id: 'NXtKeUA-3', orgHierarchy: ['A', 'B', 'D'] },
        ]);

        expect(consoleWarnSpy).not.toHaveBeenCalled();
        consoleWarnSpy?.mockRestore();

        await new GridRows(api, 'updated', gridRowsOptions).check(`
            ROOT id:ROOT_NODE_ID
            └─┬ A filler id:row-group-0-A
            · ├── X LEAF id:UzWrPgX-0
            · └─┬ B GROUP id:zIJkvFA-2
            · · ├── C LEAF id:q7lpQ9A-1
            · · └── D LEAF id:NXtKeUA-3
        `);
    });

    test('allow swapping two nodes, without warning', async () => {
        const rowData = [
            { id: 'B5XPAQx-0', orgHierarchy: ['A', 'B'] },
            { id: 'K7mRgOg-2', orgHierarchy: ['A', 'C'] },
        ];

        const api = gridsManager.createGrid('myGrid', {
            columnDefs: [],
            treeData: true,
            animateRows: false,
            groupDefaultExpanded: -1,
            rowData,
            getDataPath,
            getRowId: (params) => params.data.id,
        });

        await new GridRows(api, '', gridRowsOptions).check(`
            ROOT id:ROOT_NODE_ID
            └─┬ A filler id:row-group-0-A
            · ├── B LEAF id:B5XPAQx-0
            · └── C LEAF id:K7mRgOg-2
        `);

        consoleWarnSpy = vitest.spyOn(console, 'warn').mockImplementation(() => {});

        api.applyTransaction({
            update: [
                { id: rowData[0].id, orgHierarchy: ['A', 'C'] },
                { id: rowData[1].id, orgHierarchy: ['A', 'B'] },
            ],
        });

        expect(consoleWarnSpy).not.toHaveBeenCalled();
        consoleWarnSpy?.mockRestore();

        await new GridRows(api, '', gridRowsOptions).check(`
            ROOT id:ROOT_NODE_ID
            └─┬ A filler id:row-group-0-A
            · ├── C LEAF id:B5XPAQx-0
            · └── B LEAF id:K7mRgOg-2
        `);
    });

    test('sourceRowIndex of duplicates matters, and when a duplicate over many duplicates is moved the right one is used as main row', async () => {
        const rowData = [
            { id: 'xRow-0', orgHierarchy: ['A', 'B'] },
            { id: 'xRow-1', orgHierarchy: ['A', 'B'] },
            { id: 'xRow-2', orgHierarchy: ['A', 'B'] },
            { id: 'xRow-3', orgHierarchy: ['A', 'B'] },
            { id: 'xRow-4', orgHierarchy: ['A', 'B'] },
        ];

        consoleWarnSpy = vitest.spyOn(console, 'warn').mockImplementation(() => {});

        const api = gridsManager.createGrid('myGrid', {
            columnDefs: [],
            treeData: true,
            animateRows: false,
            groupDefaultExpanded: -1,
            rowData,
            getDataPath,
            getRowId: (params) => params.data.id,
        });

        await new GridRows(api, 'initial', gridRowsOptions).check(`
            ROOT id:ROOT_NODE_ID
            └─┬ A filler id:row-group-0-A
            · └── B LEAF id:xRow-0
        `);

        expect(consoleWarnSpy).toHaveBeenCalled();

        api.setGridOption('rowData', [
            { id: 'xRow-2', orgHierarchy: ['A', 'B'] },
            { id: 'xRow-1', orgHierarchy: ['A', 'B'] },
            { id: 'xRow-0', orgHierarchy: ['A', 'B'] },
            { id: 'xRow-3', orgHierarchy: ['A', 'B'] },
            { id: 'xRow-4', orgHierarchy: ['A', 'B'] },
        ]);

        await new GridRows(api, 'update 1', gridRowsOptions).check(`
            ROOT id:ROOT_NODE_ID
            └─┬ A filler id:row-group-0-A
            · └── B LEAF id:xRow-2
        `);

        api.setGridOption('rowData', [
            { id: 'xRow-3', orgHierarchy: ['A', 'B'] },
            { id: 'xRow-4', orgHierarchy: ['A', 'B'] },
            { id: 'xRow-0', orgHierarchy: ['A', 'B'] },
            { id: 'xRow-2', orgHierarchy: ['A', 'C'] },
            { id: 'xRow-1', orgHierarchy: ['A', 'C'] },
        ]);

        await new GridRows(api, 'update 2', gridRowsOptions).check(`
            ROOT id:ROOT_NODE_ID
            └─┬ A filler id:row-group-0-A
            · ├── B LEAF id:xRow-3
            · └── C LEAF id:xRow-2
        `);

        api.setGridOption('rowData', [
            { id: 'xRow-2', orgHierarchy: ['A', 'C'] },
            { id: 'xRow-1', orgHierarchy: ['A', 'C'] },
            { id: 'xRow-3', orgHierarchy: ['A', 'C'] },
            { id: 'xRow-0', orgHierarchy: ['A', 'B'] },
            { id: 'xRow-4', orgHierarchy: ['A', 'C'] },
            { id: 'xRow-5', orgHierarchy: ['A', 'B'] },
        ]);

        await new GridRows(api, 'update 3', gridRowsOptions).check(`
            ROOT id:ROOT_NODE_ID
            └─┬ A filler id:row-group-0-A
            · ├── C LEAF id:xRow-2
            · └── B LEAF id:xRow-0
        `);

        consoleWarnSpy?.mockRestore();
    });
});
