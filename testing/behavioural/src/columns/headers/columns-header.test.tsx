import '@testing-library/jest-dom';
import { cleanup, render, screen } from '@testing-library/react';
import React from 'react';

import { AllCommunityModule } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';

const data = [{ a: 1, b: 10, c: 100 }];
const columns = [
    {
        headerName: 'GroupName',
        children: [
            {
                field: 'a',
                headerName: 'ColumnA',
            },
        ],
    },
];

const App = () => <AgGridReact rowData={data} columnDefs={columns} modules={[AllCommunityModule]} />;

describe('React Jsdom Tests', () => {
    beforeEach(() => {
        cleanup();
    });

    it('Column Header and Cell content displayed in Jsdom', () => {
        render(<App />);
        // Test validates that we do not break JSDom rendering via the use of innerText
        expect(screen.getAllByRole('columnheader').map((x) => x.textContent?.trim())).toEqual(['GroupName', 'ColumnA']);
        expect(screen.getAllByRole('gridcell').map((x) => x.textContent)).toEqual(['1']);
    });
});
