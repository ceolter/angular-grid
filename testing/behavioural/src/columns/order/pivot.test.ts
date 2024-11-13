import type { ColDef, ColGroupDef } from 'ag-grid-community';
import { ClientSideRowModelModule } from 'ag-grid-community';
import { PivotModule } from 'ag-grid-enterprise';

import { TestGridsManager } from '../../test-utils';
import { getAutoGroupColumnIds, getColumnOrder } from '../column-test-utils';

describe('pivotMode=true', () => {
    const gridsManager = new TestGridsManager({
        modules: [ClientSideRowModelModule, PivotModule],
    });

    afterEach(() => {
        gridsManager.reset();
    });

    describe('without a pivoted column', () => {
        test('hides primary cols that do not have aggregations', () => {
            const columnDefs: (ColDef | ColGroupDef)[] = [{ colId: 'a' }];

            const gridApi = gridsManager.createGrid('myGrid', { columnDefs, pivotMode: true });

            const expected = [];
            expect(getColumnOrder(gridApi, 'all')).toEqual(expected);
            expect(getColumnOrder(gridApi, 'center')).toEqual(expected);
        });

        test('displays aggFunc primary columns when no pivot columns', () => {
            const columnDefs: (ColDef | ColGroupDef)[] = [{ colId: 'a', aggFunc: 'sum' }];

            const gridApi = gridsManager.createGrid('myGrid', { columnDefs, pivotMode: true });

            const expected = ['a'];
            expect(getColumnOrder(gridApi, 'all')).toEqual(expected);
            expect(getColumnOrder(gridApi, 'center')).toEqual(expected);
        });

        test.each(['singleColumn', 'multipleColumns', 'groupRows'] as const)(
            'groupDisplayType=%s displays auto column(s)',
            (groupDisplayType) => {
                const columnDefs: (ColDef | ColGroupDef)[] = [
                    { colId: 'a', rowGroup: true },
                    { colId: 'b', rowGroup: true },
                ];

                const gridApi = gridsManager.createGrid('myGrid', { columnDefs, groupDisplayType, pivotMode: true });

                const expected = getAutoGroupColumnIds(columnDefs, groupDisplayType, true);
                expect(getColumnOrder(gridApi, 'all')).toEqual(expected);
                expect(getColumnOrder(gridApi, 'center')).toEqual(expected);
            }
        );
    });

    describe('with a pivoted column', () => {
        const rowData = [
            { a: '1', b: '1', c: 3 },
            { a: '1', b: '2', c: 3 },
            { a: '1', b: '3', c: 3 },
            { a: '2', b: '1', c: 3 },
            { a: '2', b: '2', c: 3 },
            { a: '2', b: '3', c: 3 },
        ];

        test('hides all primary columns', () => {
            const columnDefs: (ColDef | ColGroupDef)[] = [
                { colId: 'a', rowGroup: true },
                { colId: 'b', aggFunc: 'sum' },
                { colId: 'c', pivot: true, rowGroup: true },
            ];

            const gridApi = gridsManager.createGrid('myGrid', { columnDefs, rowData, pivotMode: true });

            const expected = ['ag-Grid-AutoColumn', 'pivot_c__b'];
            expect(getColumnOrder(gridApi, 'all')).toEqual(expected);
            expect(getColumnOrder(gridApi, 'center')).toEqual(expected);
        });

        test('displays pivot cols without row grouping', () => {
            const columnDefs: (ColDef | ColGroupDef)[] = [
                { field: 'b', pivot: true },
                { field: 'c', aggFunc: 'sum' },
            ];

            const gridApi = gridsManager.createGrid('myGrid', { columnDefs, rowData, pivotMode: true });

            const expected = ['pivot_b_1_c', 'pivot_b_2_c', 'pivot_b_3_c'];
            expect(getColumnOrder(gridApi, 'center')).toEqual(expected);
        });

        test('pivot cols are sorted alphabetically', () => {
            const columnDefs: (ColDef | ColGroupDef)[] = [
                { field: 'a', rowGroup: true },
                { field: 'b', pivot: true },
                { field: 'c', aggFunc: 'sum' },
            ];

            const rowData = [
                { a: 1, b: 'aa' },
                { a: 1, b: '5' },
                { a: 1, b: '51' },
                { a: 1, b: 'an' },
                { a: 1, b: '1' },
                { a: 1, b: 'd' },
                { a: 1, b: 'a' },
            ];
            const gridApi = gridsManager.createGrid('myGrid', { columnDefs, rowData, pivotMode: true });

            const expected = [
                'ag-Grid-AutoColumn',
                'pivot_b_1_c',
                'pivot_b_5_c',
                'pivot_b_51_c',
                'pivot_b_a_c',
                'pivot_b_aa_c',
                'pivot_b_an_c',
                'pivot_b_d_c',
            ];
            expect(getColumnOrder(gridApi, 'center')).toEqual(expected);
        });

        test('pivot cols are sorted by pivot comparator', () => {
            const columnDefs: (ColDef | ColGroupDef)[] = [
                { field: 'a', rowGroup: true },
                { field: 'b', pivot: true, pivotComparator: (a, b) => -a.localeCompare(b) },
                { field: 'c', aggFunc: 'sum' },
            ];

            const rowData = [
                { a: 1, b: 'aa' },
                { a: 1, b: '5' },
                { a: 1, b: '51' },
                { a: 1, b: 'an' },
                { a: 1, b: '1' },
                { a: 1, b: 'd' },
                { a: 1, b: 'a' },
            ];
            const gridApi = gridsManager.createGrid('myGrid', { columnDefs, rowData, pivotMode: true });

            const expected = [
                'ag-Grid-AutoColumn',
                'pivot_b_d_c',
                'pivot_b_an_c',
                'pivot_b_aa_c',
                'pivot_b_a_c',
                'pivot_b_51_c',
                'pivot_b_5_c',
                'pivot_b_1_c',
            ];
            expect(getColumnOrder(gridApi, 'center')).toEqual(expected);
        });

        test('displays pivot cols with row grouping', () => {
            const columnDefs: (ColDef | ColGroupDef)[] = [
                { field: 'a', rowGroup: true },
                { field: 'b', pivot: true },
                { field: 'c', aggFunc: 'sum' },
            ];

            const gridApi = gridsManager.createGrid('myGrid', { columnDefs, rowData, pivotMode: true });

            const groupColIds = getAutoGroupColumnIds(columnDefs, 'singleColumn', true);
            const expected = [...groupColIds, 'pivot_b_1_c', 'pivot_b_2_c', 'pivot_b_3_c'];
            expect(getColumnOrder(gridApi, 'center')).toEqual(expected);
        });

        test('pivot cols can be lockedPosition before the auto col', () => {
            const columnDefs: (ColDef | ColGroupDef)[] = [
                { field: 'a', rowGroup: true },
                { field: 'b', pivot: true },
                { field: 'c', aggFunc: 'sum' },
            ];

            const gridApi = gridsManager.createGrid('myGrid', {
                columnDefs,
                rowData,
                pivotMode: true,
                processPivotResultColDef: (colDef) => {
                    colDef.lockPosition = 'left';
                },
            });

            const groupColIds = getAutoGroupColumnIds(columnDefs, 'singleColumn', true);
            const expected = ['pivot_b_1_c', 'pivot_b_2_c', 'pivot_b_3_c', ...groupColIds];
            expect(getColumnOrder(gridApi, 'center')).toEqual(expected);
        });

        test.each(['left', 'right'] as const)('pivot cols can be pinned=%s', (pinned) => {
            const columnDefs: (ColDef | ColGroupDef)[] = [
                { field: 'a', rowGroup: true },
                { field: 'b', pivot: true },
                { field: 'c', aggFunc: 'sum' },
            ];

            const gridApi = gridsManager.createGrid('myGrid', {
                columnDefs,
                rowData,
                pivotMode: true,
                processPivotResultColDef: (colDef) => {
                    colDef.pinned = pinned;
                },
            });

            const groupColIds = getAutoGroupColumnIds(columnDefs, 'singleColumn', true);
            const expected = ['pivot_b_1_c', 'pivot_b_2_c', 'pivot_b_3_c'];
            expect(getColumnOrder(gridApi, 'center')).toEqual(groupColIds);
            expect(getColumnOrder(gridApi, pinned)).toEqual(expected);
        });

        describe.each([
            [true, true],
            [true, false],
            [false, true],
            [false, false],
        ] as const)(
            'with maintainColumnOrder=%s and enableStrictPivotColumnOrder=%s, when toggling pivot mode, the column order is preserved',
            (maintainColumnOrder, enableStrictPivotColumnOrder) => {
                // see AG-12671
                test.skip('auto column order is preserved when leaving and returning to pivot mode', () => {
                    const columnDefs: (ColDef | ColGroupDef)[] = [
                        { field: 'a', rowGroup: true },
                        { field: 'b', pivot: true },
                        { field: 'c', aggFunc: 'sum' },
                    ];

                    const gridApi = gridsManager.createGrid('myGrid', {
                        columnDefs,
                        rowData,
                        pivotMode: true,
                        maintainColumnOrder,
                        enableStrictPivotColumnOrder,
                    });

                    const groupColIds = getAutoGroupColumnIds(columnDefs, 'singleColumn', true);
                    const initialExpected = [...groupColIds, 'pivot_b_1_c', 'pivot_b_2_c', 'pivot_b_3_c'];
                    expect(getColumnOrder(gridApi, 'center')).toEqual(initialExpected);

                    gridApi.moveColumns(['pivot_b_1_c'], 0);
                    const modifiedExpected = ['pivot_b_1_c', ...groupColIds, 'pivot_b_2_c', 'pivot_b_3_c'];
                    expect(getColumnOrder(gridApi, 'center')).toEqual(modifiedExpected);

                    gridApi.setGridOption('pivotMode', false);
                    expect(getColumnOrder(gridApi, 'center')).toEqual([...groupColIds, 'a', 'b', 'c']);

                    gridApi.setGridOption('pivotMode', true);
                    expect(getColumnOrder(gridApi, 'center')).toEqual(modifiedExpected);
                });

                // see AG-12671
                test.skip('auto column order is preserved when entering and then leaving pivot mode', () => {
                    const columnDefs: (ColDef | ColGroupDef)[] = [
                        { field: 'a', rowGroup: true },
                        { field: 'b', pivot: true },
                        { field: 'c', aggFunc: 'sum' },
                    ];

                    const gridApi = gridsManager.createGrid('myGrid', {
                        columnDefs,
                        rowData,
                        pivotMode: false,
                        maintainColumnOrder,
                    });

                    const groupColIds = getAutoGroupColumnIds(columnDefs, 'singleColumn', true);
                    expect(getColumnOrder(gridApi, 'center')).toEqual([...groupColIds, 'a', 'b', 'c']);

                    gridApi.moveColumns(['a'], 0);
                    const modifiedExpected = ['a', ...groupColIds, 'b', 'c'];
                    expect(getColumnOrder(gridApi, 'center')).toEqual(modifiedExpected);

                    gridApi.setGridOption('pivotMode', true);

                    const initialExpected = [...groupColIds, 'pivot_b_1_c', 'pivot_b_2_c', 'pivot_b_3_c'];
                    expect(getColumnOrder(gridApi, 'center')).toEqual(initialExpected);

                    gridApi.setGridOption('pivotMode', false);
                    expect(getColumnOrder(gridApi, 'center')).toEqual(modifiedExpected);
                });

                test('pivot result column order is preserved when leaving and returning to pivot mode', () => {
                    const columnDefs: (ColDef | ColGroupDef)[] = [
                        { field: 'a', rowGroup: true },
                        { field: 'b', pivot: true },
                        { field: 'c', aggFunc: 'sum' },
                    ];

                    const gridApi = gridsManager.createGrid('myGrid', {
                        columnDefs,
                        rowData,
                        pivotMode: true,
                        maintainColumnOrder,
                    });

                    const groupColIds = getAutoGroupColumnIds(columnDefs, 'singleColumn', true);
                    const initialExpected = [...groupColIds, 'pivot_b_1_c', 'pivot_b_2_c', 'pivot_b_3_c'];
                    expect(getColumnOrder(gridApi, 'center')).toEqual(initialExpected);

                    gridApi.moveColumns(['pivot_b_1_c'], 2);
                    const modifiedExpected = [...groupColIds, 'pivot_b_2_c', 'pivot_b_1_c', 'pivot_b_3_c'];
                    expect(getColumnOrder(gridApi, 'center')).toEqual(modifiedExpected);

                    gridApi.setGridOption('pivotMode', false);
                    expect(getColumnOrder(gridApi, 'center')).toEqual([...groupColIds, 'a', 'b', 'c']);

                    gridApi.setGridOption('pivotMode', true);
                    expect(getColumnOrder(gridApi, 'center')).toEqual(modifiedExpected);
                });

                test('primary column order is preserved when entering and leaving pivot mode', () => {
                    const columnDefs: (ColDef | ColGroupDef)[] = [
                        { field: 'a', rowGroup: true },
                        { field: 'b', pivot: true },
                        { field: 'c', aggFunc: 'sum' },
                    ];

                    const gridApi = gridsManager.createGrid('myGrid', {
                        columnDefs,
                        rowData,
                        maintainColumnOrder,
                    });

                    const groupColIds = getAutoGroupColumnIds(columnDefs, 'singleColumn', true);
                    const initialExpected = [...groupColIds, 'a', 'b', 'c'];
                    expect(getColumnOrder(gridApi, 'center')).toEqual(initialExpected);

                    gridApi.moveColumns(['a'], 2);
                    const modifiedExpected = [...groupColIds, 'b', 'a', 'c'];
                    expect(getColumnOrder(gridApi, 'center')).toEqual(modifiedExpected);

                    gridApi.setGridOption('pivotMode', true);
                    expect(getColumnOrder(gridApi, 'center')).toEqual([
                        ...groupColIds,
                        'pivot_b_1_c',
                        'pivot_b_2_c',
                        'pivot_b_3_c',
                    ]);

                    gridApi.setGridOption('pivotMode', false);
                    expect(getColumnOrder(gridApi, 'center')).toEqual(modifiedExpected);
                });
            }
        );

        describe('with enableStrictPivotColumnOrder=false', () => {
            test('new pivot result columns are added at the end when a pivot column filter is removed', () => {
                const columnDefs: (ColDef | ColGroupDef)[] = [
                    { field: 'a', rowGroup: true },
                    { field: 'b', pivot: true },
                    { field: 'c', aggFunc: 'sum' },
                ];

                const gridApi = gridsManager.createGrid('myGrid', {
                    columnDefs,
                    defaultColDef: {
                        filter: true,
                    },
                    rowData,
                    pivotMode: true,
                    enableStrictPivotColumnOrder: false,
                });

                const groupColIds = getAutoGroupColumnIds(columnDefs, 'singleColumn', true);
                const initialExpected = [...groupColIds, 'pivot_b_1_c', 'pivot_b_2_c', 'pivot_b_3_c'];
                expect(getColumnOrder(gridApi, 'center')).toEqual(initialExpected);

                gridApi.setFilterModel({ b: { filter: 3, filterType: 'number', type: 'equals' } });

                const filteredExpected = [...groupColIds, 'pivot_b_3_c'];
                expect(getColumnOrder(gridApi, 'center')).toEqual(filteredExpected);

                gridApi.setFilterModel({});
                const reorderedExpected = [...groupColIds, 'pivot_b_3_c', 'pivot_b_1_c', 'pivot_b_2_c'];
                expect(getColumnOrder(gridApi, 'center')).toEqual(reorderedExpected);
            });

            test('new pivot result columns are added at the end when a transaction introduces a new column', () => {
                const columnDefs: (ColDef | ColGroupDef)[] = [
                    { field: 'a', rowGroup: true },
                    { field: 'b', pivot: true },
                    { field: 'c', aggFunc: 'sum' },
                ];

                const gridApi = gridsManager.createGrid('myGrid', {
                    columnDefs,
                    rowData,
                    pivotMode: true,
                    enableStrictPivotColumnOrder: false,
                });

                const groupColIds = getAutoGroupColumnIds(columnDefs, 'singleColumn', true);
                const initialExpected = [...groupColIds, 'pivot_b_1_c', 'pivot_b_2_c', 'pivot_b_3_c'];
                expect(getColumnOrder(gridApi, 'center')).toEqual(initialExpected);

                gridApi.applyTransaction({ add: [{ a: '3', b: '0', c: 3 }], addIndex: 0 });

                const reorderedExpected = [...groupColIds, 'pivot_b_1_c', 'pivot_b_2_c', 'pivot_b_3_c', 'pivot_b_0_c'];
                expect(getColumnOrder(gridApi, 'center')).toEqual(reorderedExpected);
            });
        });

        describe('with enableStrictPivotColumnOrder=true', () => {
            test('pivot result columns are reset when a pivot column filter is removed', () => {
                const columnDefs: (ColDef | ColGroupDef)[] = [
                    { field: 'a', rowGroup: true },
                    { field: 'b', pivot: true },
                    { field: 'c', aggFunc: 'sum' },
                ];

                const gridApi = gridsManager.createGrid('myGrid', {
                    columnDefs,
                    defaultColDef: {
                        filter: true,
                    },
                    rowData,
                    pivotMode: true,
                    enableStrictPivotColumnOrder: true,
                });

                const groupColIds = getAutoGroupColumnIds(columnDefs, 'singleColumn', true);
                const initialExpected = [...groupColIds, 'pivot_b_1_c', 'pivot_b_2_c', 'pivot_b_3_c'];
                expect(getColumnOrder(gridApi, 'center')).toEqual(initialExpected);

                gridApi.setFilterModel({ b: { filter: 3, filterType: 'number', type: 'equals' } });

                const filteredExpected = [...groupColIds, 'pivot_b_3_c'];
                expect(getColumnOrder(gridApi, 'center')).toEqual(filteredExpected);

                gridApi.setFilterModel({});
                expect(getColumnOrder(gridApi, 'center')).toEqual(initialExpected);
            });

            test('new pivot result columns are added at the ordered position when a transaction introduces a new column', () => {
                const columnDefs: (ColDef | ColGroupDef)[] = [
                    { field: 'a', rowGroup: true },
                    { field: 'b', pivot: true },
                    { field: 'c', aggFunc: 'sum' },
                ];

                const gridApi = gridsManager.createGrid('myGrid', {
                    columnDefs,
                    rowData,
                    pivotMode: true,
                    enableStrictPivotColumnOrder: true,
                });

                const groupColIds = getAutoGroupColumnIds(columnDefs, 'singleColumn', true);
                const initialExpected = [...groupColIds, 'pivot_b_1_c', 'pivot_b_2_c', 'pivot_b_3_c'];
                expect(getColumnOrder(gridApi, 'center')).toEqual(initialExpected);

                gridApi.applyTransaction({ add: [{ a: '3', b: '0', c: 3 }], addIndex: 0 });

                const reorderedExpected = [...groupColIds, 'pivot_b_0_c', 'pivot_b_1_c', 'pivot_b_2_c', 'pivot_b_3_c'];
                expect(getColumnOrder(gridApi, 'center')).toEqual(reorderedExpected);
            });
        });
    });
});
