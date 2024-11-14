import { ClientSideRowModelModule } from 'ag-grid-community';
import type { ColDef, ColGroupDef, GridApi, GridOptions, HeaderClassParams } from 'ag-grid-community';
import { createGrid } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';

ModuleRegistry.registerModules([AllCommunityModule, ClientSideRowModelModule]);

const columnDefs: (ColDef | ColGroupDef)[] = [
    {
        headerName: 'Group A',
        groupId: 'GroupA',
        children: [
            {
                headerName: 'Athlete 1',
                field: 'athlete',
                width: 150,
                filter: 'agTextColumnFilter',
            },
            {
                headerName: 'Group B',
                groupId: 'GroupB',
                children: [
                    { headerName: 'Country 1', field: 'country', width: 120 },
                    {
                        headerName: 'Group C',
                        groupId: 'GroupC',
                        children: [
                            { headerName: 'Sport 1', field: 'sport', width: 110 },
                            {
                                headerName: 'Group D',
                                groupId: 'GroupD',
                                children: [
                                    {
                                        headerName: 'Total 1',
                                        field: 'total',
                                        width: 100,
                                        filter: 'agNumberColumnFilter',
                                    },
                                    {
                                        headerName: 'Group E',
                                        groupId: 'GroupE',
                                        openByDefault: true,
                                        children: [
                                            {
                                                headerName: 'Gold 1',
                                                field: 'gold',
                                                width: 100,
                                                filter: 'agNumberColumnFilter',
                                            },
                                            {
                                                headerName: 'Group F',
                                                groupId: 'GroupF',
                                                openByDefault: true,
                                                children: [
                                                    {
                                                        headerName: 'Silver 1',
                                                        field: 'silver',
                                                        width: 100,
                                                        filter: 'agNumberColumnFilter',
                                                    },
                                                    {
                                                        headerName: 'Group G',
                                                        groupId: 'GroupG',
                                                        children: [
                                                            {
                                                                headerName: 'Bronze',
                                                                field: 'bronze',
                                                                width: 100,
                                                                filter: 'agNumberColumnFilter',
                                                            },
                                                        ],
                                                    },
                                                    {
                                                        headerName: 'Silver 2',
                                                        columnGroupShow: 'open',
                                                        field: 'silver',
                                                        width: 100,
                                                        filter: 'agNumberColumnFilter',
                                                    },
                                                ],
                                            },
                                            {
                                                headerName: 'Gold 2',
                                                columnGroupShow: 'open',
                                                field: 'gold',
                                                width: 100,
                                                filter: 'agNumberColumnFilter',
                                            },
                                        ],
                                    },
                                    {
                                        headerName: 'Total 2',
                                        columnGroupShow: 'open',
                                        field: 'total',
                                        width: 100,
                                        filter: 'agNumberColumnFilter',
                                    },
                                ],
                            },
                            {
                                headerName: 'Sport 2',
                                columnGroupShow: 'open',
                                field: 'sport',
                                width: 110,
                            },
                        ],
                    },
                    {
                        headerName: 'Country 2',
                        columnGroupShow: 'open',
                        field: 'country',
                        width: 120,
                    },
                ],
            },
            {
                headerName: 'Age 2',
                columnGroupShow: 'open',
                field: 'age',
                width: 90,
                filter: 'agNumberColumnFilter',
            },
        ],
    },
    {
        headerName: 'Athlete 2',
        columnGroupShow: 'open',
        field: 'athlete',
        width: 150,
        filter: 'agTextColumnFilter',
    },
];

let gridApi: GridApi<IOlympicData>;

const gridOptions: GridOptions<IOlympicData> = {
    // debug: true,
    columnDefs: columnDefs,
    rowData: null,
    defaultColGroupDef: { headerClass: headerClassFunc },
    defaultColDef: {
        headerClass: headerClassFunc,
        filter: true,
    },
    icons: {
        columnGroupOpened: '<i class="far fa-minus-square"/>',
        columnGroupClosed: '<i class="far fa-plus-square"/>',
    },
};

function headerClassFunc(params: HeaderClassParams) {
    let foundC = false;
    let foundG = false;

    // for the bottom row of headers, column is present,
    // otherwise columnGroup is present. we are guaranteed
    // at least one is always present.
    let item = params.column ? params.column : params.columnGroup;

    // walk up the tree, see if we are in C or F groups
    while (item) {
        // if groupId is set then this must be a group.
        const colDef = item.getDefinition() as ColGroupDef;
        if (colDef.groupId === 'GroupC') {
            foundC = true;
        } else if (colDef.groupId === 'GroupG') {
            foundG = true;
        }
        item = item.getParent();
    }

    if (foundG) {
        return 'column-group-g';
    } else if (foundC) {
        return 'column-group-c';
    }
}

function expandAll(expand: boolean) {
    const groupNames = ['GroupA', 'GroupB', 'GroupC', 'GroupD', 'GroupE', 'GroupF', 'GroupG'];

    groupNames.forEach((groupId) => {
        gridApi!.setColumnGroupOpened(groupId, expand);
    });
}

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', () => {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);

    fetch('https://www.ag-grid.com/example-assets/olympic-winners.json')
        .then((response) => response.json())
        .then((data: IOlympicData[]) => gridApi!.setGridOption('rowData', data));
});
