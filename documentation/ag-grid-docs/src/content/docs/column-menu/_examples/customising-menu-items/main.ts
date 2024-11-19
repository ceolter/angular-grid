import { ClientSideRowModelModule } from 'ag-grid-community';
import type { ColDef, GetMainMenuItemsParams, GridApi, GridOptions, MenuItemDef } from 'ag-grid-community';
import { PostProcessPopupParams, createGrid } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { ColumnsToolPanelModule } from 'ag-grid-enterprise';
import { ColumnMenuModule, ContextMenuModule } from 'ag-grid-enterprise';

ModuleRegistry.registerModules([
    AllCommunityModule,
    ClientSideRowModelModule,
    ColumnsToolPanelModule,
    ColumnMenuModule,
    ContextMenuModule,
]);

const columnDefs: ColDef[] = [
    { field: 'athlete', minWidth: 200 },
    {
        field: 'age',
        mainMenuItems: (params: GetMainMenuItemsParams) => {
            const athleteMenuItems: (MenuItemDef | string)[] = params.defaultItems.slice(0);
            athleteMenuItems.push({
                name: 'A Custom Item',
                action: () => {
                    console.log('A Custom Item selected');
                },
            });
            athleteMenuItems.push({
                name: 'Another Custom Item',
                action: () => {
                    console.log('Another Custom Item selected');
                },
            });
            athleteMenuItems.push({
                name: 'Custom Sub Menu',
                subMenu: [
                    {
                        name: 'Black',
                        action: () => {
                            console.log('Black was pressed');
                        },
                    },
                    {
                        name: 'White',
                        action: () => {
                            console.log('White was pressed');
                        },
                    },
                    {
                        name: 'Grey',
                        action: () => {
                            console.log('Grey was pressed');
                        },
                    },
                ],
            });
            return athleteMenuItems;
        },
    },
    {
        field: 'country',
        minWidth: 200,
        mainMenuItems: [
            {
                // our own item with an icon
                name: 'A Custom Item',
                action: () => {
                    console.log('A Custom Item selected');
                },
                icon: '<img src="https://www.ag-grid.com/example-assets/lab.png" style="width: 14px;" />',
            },
            {
                // our own icon with a check box
                name: 'Another Custom Item',
                action: () => {
                    console.log('Another Custom Item selected');
                },
                checked: true,
            },
            'resetColumns', // a built in item
        ],
    },
    {
        field: 'year',
        mainMenuItems: (params: GetMainMenuItemsParams) => {
            const menuItems: (MenuItemDef | string)[] = [];
            const itemsToExclude = ['separator', 'pinSubMenu', 'valueAggSubMenu'];
            params.defaultItems.forEach((item) => {
                if (itemsToExclude.indexOf(item) < 0) {
                    menuItems.push(item);
                }
            });
            return menuItems;
        },
    },
    { field: 'sport', minWidth: 200 },
    { field: 'gold' },
    { field: 'silver' },
    { field: 'bronze' },
    { field: 'total' },
];

let gridApi: GridApi<IOlympicData>;

const gridOptions: GridOptions<IOlympicData> = {
    columnDefs: columnDefs,
    defaultColDef: {
        flex: 1,
        minWidth: 100,
    },
};

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', () => {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);

    fetch('https://www.ag-grid.com/example-assets/olympic-winners.json')
        .then((response) => response.json())
        .then((data: IOlympicData[]) => gridApi!.setGridOption('rowData', data));
});
