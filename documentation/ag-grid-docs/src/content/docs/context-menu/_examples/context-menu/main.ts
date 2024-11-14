import type { GetContextMenuItemsParams, GridApi, GridOptions, MenuItemDef } from 'ag-grid-community';
import { AllCommunityModule, ClientSideRowModelModule, ModuleRegistry, createGrid } from 'ag-grid-community';
import { CellSelectionModule, ClipboardModule, ExcelExportModule, MenuModule } from 'ag-grid-enterprise';

ModuleRegistry.registerModules([
    AllCommunityModule,
    ClientSideRowModelModule,
    ClipboardModule,
    ExcelExportModule,
    MenuModule,
    CellSelectionModule,
]);

let gridApi: GridApi<IOlympicData>;

const gridOptions: GridOptions<IOlympicData> = {
    columnDefs: [
        { field: 'athlete', minWidth: 200 },
        { field: 'age' },
        { field: 'country', minWidth: 200 },
        { field: 'year' },
        { field: 'date', minWidth: 180 },
        { field: 'sport', minWidth: 200 },
        { field: 'gold' },
        { field: 'silver' },
        { field: 'bronze' },
        { field: 'total' },
    ],
    defaultColDef: {
        flex: 1,
        minWidth: 100,
    },
    cellSelection: true,
    allowContextMenuWithControlKey: true,
    getContextMenuItems: getContextMenuItems,
};

function createFlagImg(flag: string) {
    return '<img border="0" width="15" height="10" src="https://flags.fmcdn.net/data/flags/mini/' + flag + '.png"/>';
}

function getContextMenuItems(
    params: GetContextMenuItemsParams
): (string | MenuItemDef)[] | Promise<(string | MenuItemDef)[]> {
    const result: (string | MenuItemDef)[] = [
        {
            // custom item
            name: 'Alert ' + params.value,
            action: () => {
                window.alert('Alerting about ' + params.value);
            },
            cssClasses: ['red', 'bold'],
        },
        {
            // custom item
            name: 'Always Disabled',
            disabled: true,
            tooltip: 'Very long tooltip, did I mention that I am very long, well I am! Long!  Very Long!',
        },
        {
            name: 'Country',
            subMenu: [
                {
                    name: 'Ireland',
                    action: () => {
                        console.log('Ireland was pressed');
                    },
                    icon: createFlagImg('ie'),
                },
                {
                    name: 'UK',
                    action: () => {
                        console.log('UK was pressed');
                    },
                    icon: createFlagImg('gb'),
                },
                {
                    name: 'France',
                    action: () => {
                        console.log('France was pressed');
                    },
                    icon: createFlagImg('fr'),
                },
            ],
        },
        {
            name: 'Person',
            subMenu: [
                {
                    name: 'Niall',
                    action: () => {
                        console.log('Niall was pressed');
                    },
                },
                {
                    name: 'Sean',
                    action: () => {
                        console.log('Sean was pressed');
                    },
                },
                {
                    name: 'John',
                    action: () => {
                        console.log('John was pressed');
                    },
                },
                {
                    name: 'Alberto',
                    action: () => {
                        console.log('Alberto was pressed');
                    },
                },
                {
                    name: 'Tony',
                    action: () => {
                        console.log('Tony was pressed');
                    },
                },
                {
                    name: 'Andrew',
                    action: () => {
                        console.log('Andrew was pressed');
                    },
                },
                {
                    name: 'Kev',
                    action: () => {
                        console.log('Kev was pressed');
                    },
                },
                {
                    name: 'Will',
                    action: () => {
                        console.log('Will was pressed');
                    },
                },
                {
                    name: 'Armaan',
                    action: () => {
                        console.log('Armaan was pressed');
                    },
                },
            ],
        }, // built in separator
        'separator',
        {
            // custom item
            name: 'Windows',
            shortcut: 'Alt + W',
            action: () => {
                console.log('Windows Item Selected');
            },
            icon: '<img src="https://www.ag-grid.com/example-assets/skills/windows.png" />',
        },
        {
            // custom item
            name: 'Mac',
            shortcut: 'Alt + M',
            action: () => {
                console.log('Mac Item Selected');
            },
            icon: '<img src="https://www.ag-grid.com/example-assets/skills/mac.png"/>',
        }, // built in separator
        'separator',
        {
            // custom item
            name: 'Checked',
            checked: true,
            action: () => {
                console.log('Checked Selected');
            },
            icon: '<img src="https://www.ag-grid.com/example-assets/skills/mac.png"/>',
        }, // built in copy item
        'copy',
        'separator',
        'chartRange',
    ];

    if (params.column?.getColId() === 'country') {
        return new Promise((res) => setTimeout(() => res(result), 150));
    }
    return result;
}

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);

    fetch('https://www.ag-grid.com/example-assets/olympic-winners.json')
        .then((response) => response.json())
        .then((data: IOlympicData[]) => gridApi!.setGridOption('rowData', data));
});
