import type { ColDef, GridApi, GridOptions } from 'ag-grid-community';
import {
    AllCommunityModule,
    ClientSideRowModelModule,
    ModuleRegistry,
    createGrid,
    iconOverrides,
    themeQuartz,
} from 'ag-grid-community';
import {
    ColumnMenuModule,
    ColumnsToolPanelModule,
    ContextMenuModule,
    FiltersToolPanelModule,
    RowGroupingModule,
    SetFilterModule,
} from 'ag-grid-enterprise';

ModuleRegistry.registerModules([
    AllCommunityModule,
    ClientSideRowModelModule,
    ColumnsToolPanelModule,
    FiltersToolPanelModule,
    ColumnMenuModule,
    ContextMenuModule,
    RowGroupingModule,
    SetFilterModule,
]);

const myTheme = themeQuartz
    .withPart(
        iconOverrides({
            type: 'image',
            icons: {
                filter: { url: 'https://www.ag-grid.com/example-assets/svg-icons/filter.svg' },
            },
        })
    )
    .withPart(
        iconOverrides({
            type: 'image',
            mask: true,
            icons: {
                'menu-alt': { url: 'https://www.ag-grid.com/example-assets/svg-icons/menu-alt.svg' },
            },
        })
    )
    .withPart(
        iconOverrides({
            type: 'font',
            icons: {
                columns: '🏛️',
            },
        })
    )
    .withPart(
        iconOverrides({
            cssImports: ['https://use.fontawesome.com/releases/v5.6.3/css/all.css'],
            type: 'font',
            weight: 'bold',
            family: 'Font Awesome 5 Free',
            color: 'green',
            icons: {
                asc: '\u{f062}',
                desc: '\u{f063}',
                'tree-closed': '\u{f105}',
                'tree-indeterminate': '\u{f068}',
                'tree-open': '\u{f107}',
            },
        })
    )
    .withPart(
        iconOverrides({
            cssImports: ['https://cdn.jsdelivr.net/npm/@mdi/font/css/materialdesignicons.css'],
            type: 'font',
            family: 'Material Design Icons',
            color: 'red',
            icons: {
                group: '\u{F0328}',
                aggregation: '\u{F02C3}',
            },
        })
    );

const columnDefs: ColDef[] = [
    { field: 'country', sort: 'asc', rowGroup: true, hide: true },
    { field: 'athlete', minWidth: 170 },
    { field: 'age' },
    { field: 'year' },
    { field: 'date' },
    { field: 'sport' },
    { field: 'gold' },
    { field: 'silver' },
    { field: 'bronze' },
    { field: 'total' },
];

let gridApi: GridApi<IOlympicData>;

const gridOptions: GridOptions<IOlympicData> = {
    theme: myTheme,
    rowData: null,
    columnDefs: columnDefs,
    defaultColDef: {
        editable: true,
        filter: true,
    },
    autoGroupColumnDef: {
        headerName: 'Country',
    },
    sideBar: true,
};

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function () {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;
    gridApi = createGrid(gridDiv, gridOptions);

    fetch('https://www.ag-grid.com/example-assets/olympic-winners.json')
        .then((response) => response.json())
        .then((data: IOlympicData[]) => gridApi!.setGridOption('rowData', data));
});
