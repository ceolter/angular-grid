import { describe, expect, test } from '@jest/globals';

import { AllCommunityModule } from '../allCommunityModule';
import { ClientSideRowModelModule } from '../clientSideRowModel/clientSideRowModelModule';
import type { ColDef, ColGroupDef } from '../entities/colDef';
import type { GridOptions } from '../entities/gridOptions';
import type { GridReadyEvent } from '../events';
import { createGrid } from '../grid';

const getColNames = (cols: any[] | undefined) => cols?.map((c) => c.field ?? c.colId) ?? [];

const onlyFields = [{ field: 'field' }, { field: 'field2' }];
const withGroups: (ColDef | ColGroupDef)[] = [
    { field: 'field' },
    {
        children: [
            { field: 'child1' },
            {
                children: [{ field: 'grandchild' }],
            },
        ],
    },
    { field: 'field2' },
];

describe('getColumnDefs', () => {
    test('simple columns', (done) => {
        const options: GridOptions = {
            columnDefs: onlyFields,
            onGridReady: (params: GridReadyEvent) => {
                const defs1 = params.api.getColumnDefs();
                expect(getColNames(defs1)).toStrictEqual(getColNames(onlyFields));
                done();
            },
        };
        createGrid(document.createElement('div'), options, {
            modules: [ClientSideRowModelModule, AllCommunityModule],
        });
    });

    test('with column groups', (done) => {
        const options: GridOptions = {
            columnDefs: withGroups,
            onGridReady: (params: GridReadyEvent) => {
                const defs1 = params.api.getColumnDefs();
                expect(getColNames(defs1)).toStrictEqual(getColNames(withGroups));
                done();
            },
        };
        createGrid(document.createElement('div'), options, {
            modules: [ClientSideRowModelModule, AllCommunityModule],
        });
    });
});
