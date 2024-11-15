import { AgChartsEnterpriseModule } from 'ag-charts-enterprise';

import type {
    CellClassParams,
    CellStyle,
    ColDef,
    ColGroupDef,
    GetContextMenuItemsParams,
    GridApi,
    GridOptions,
    ICellRendererParams,
    MenuItemDef,
    RowSelectedEvent,
    SelectionChangedEvent,
    ValueSetterParams,
} from 'ag-grid-community';
import {
    AllCommunityModule,
    ClientSideRowModelModule,
    CsvExportModule,
    ModuleRegistry,
    createGrid,
} from 'ag-grid-community';
import {
    CellSelectionModule,
    ClipboardModule,
    ColumnsToolPanelModule,
    ExcelExportModule,
    FiltersToolPanelModule,
    IntegratedChartsModule,
    MenuModule,
    MultiFilterModule,
    PivotModule,
    RichSelectModule,
    RowGroupingPanelModule,
    SetFilterModule,
    SideBarModule,
    StatusBarModule,
} from 'ag-grid-enterprise';

import { CountryCellRenderer } from './country-renderer_typescript';
import { PersonFilter } from './person-filter_typescript';
import { WinningsFilter } from './winnings-filter_typescript';

ModuleRegistry.registerModules([
    AllCommunityModule,
    ClientSideRowModelModule,
    ClipboardModule,
    ColumnsToolPanelModule,
    CsvExportModule,
    ExcelExportModule,
    FiltersToolPanelModule,
    IntegratedChartsModule.with(AgChartsEnterpriseModule),
    MenuModule,
    MultiFilterModule,
    CellSelectionModule,
    RichSelectModule,
    PivotModule,
    SetFilterModule,
    SideBarModule,
    StatusBarModule,
    RowGroupingPanelModule,
]);

const colNames = [
    'Station',
    'Railway',
    'Street',
    'Address',
    'Toy',
    'Soft Box',
    'Make and Model',
    'Longest Day',
    'Shortest Night',
];

const countries = [
    { country: 'Ireland', continent: 'Europe', language: 'English' },
    { country: 'Spain', continent: 'Europe', language: 'Spanish' },
    { country: 'United Kingdom', continent: 'Europe', language: 'English' },
    { country: 'France', continent: 'Europe', language: 'French' },
    { country: 'Germany', continent: 'Europe', language: 'German' },
    { country: 'Luxembourg', continent: 'Europe', language: 'French' },
    { country: 'Sweden', continent: 'Europe', language: 'Swedish' },
    { country: 'Norway', continent: 'Europe', language: 'Norwegian' },
    { country: 'Italy', continent: 'Europe', language: 'Italian' },
    { country: 'Greece', continent: 'Europe', language: 'Greek' },
    { country: 'Iceland', continent: 'Europe', language: 'Icelandic' },
    { country: 'Portugal', continent: 'Europe', language: 'Portuguese' },
    { country: 'Malta', continent: 'Europe', language: 'Maltese' },
    { country: 'Brazil', continent: 'South America', language: 'Portuguese' },
    { country: 'Argentina', continent: 'South America', language: 'Spanish' },
    { country: 'Colombia', continent: 'South America', language: 'Spanish' },
    { country: 'Peru', continent: 'South America', language: 'Spanish' },
    { country: 'Venezuela', continent: 'South America', language: 'Spanish' },
    { country: 'Uruguay', continent: 'South America', language: 'Spanish' },
    { country: 'Belgium', continent: 'Europe', language: 'French' },
];

const games = [
    'Chess',
    'Cross and Circle',
    'Daldøs',
    'Downfall',
    'DVONN',
    'Fanorona',
    'Game of the Generals',
    'Ghosts',
    'Abalone',
    'Agon',
    'Backgammon',
    'Battleship',
    'Blockade',
    'Blood Bowl',
    'Bul',
    'Camelot',
    'Checkers',
    'Go',
    'Gipf',
    'Guess Who?',
    'Hare and Hounds',
    'Hex',
    'Hijara',
    'Isola',
    'Janggi (Korean Chess)',
    'Le Jeu de la Guerre',
    'Patolli',
    'Plateau',
    'PÜNCT',
    'Rithmomachy',
    'Sáhkku',
    'Senet',
    'Shogi',
    'Space Hulk',
    'Stratego',
    'Sugoroku',
    'Tâb',
    'Tablut',
    'Tantrix',
    'Wari',
    'Xiangqi (Chinese chess)',
    'YINSH',
    'ZÈRTZ',
    'Kalah',
    'Kamisado',
    'Liu po',
    'Lost Cities',
    'Mad Gab',
    'Master Mind',
    "Nine Men's Morris",
    'Obsession',
    'Othello',
];
const booleanValues = [true, 'true', false, 'false'];

const firstNames = [
    'Sophie',
    'Isabelle',
    'Emily',
    'Olivia',
    'Lily',
    'Chloe',
    'Isabella',
    'Amelia',
    'Jessica',
    'Sophia',
    'Ava',
    'Charlotte',
    'Mia',
    'Lucy',
    'Grace',
    'Ruby',
    'Ella',
    'Evie',
    'Freya',
    'Isla',
    'Poppy',
    'Daisy',
    'Layla',
];

const lastNames = [
    'Beckham',
    'Black',
    'Braxton',
    'Brennan',
    'Brock',
    'Bryson',
    'Cadwell',
    'Cage',
    'Carson',
    'Chandler',
    'Cohen',
    'Cole',
    'Corbin',
    'Dallas',
    'Dalton',
    'Dane',
    'Donovan',
    'Easton',
    'Fisher',
    'Fletcher',
    'Grady',
    'Greyson',
    'Griffin',
    'Gunner',
    'Hayden',
    'Hudson',
    'Hunter',
    'Jacoby',
    'Jagger',
    'Jaxon',
    'Jett',
    'Kade',
    'Kane',
    'Keating',
    'Keegan',
    'Kingston',
    'Kobe',
];

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const dataSize: string = '.1x22';

const autoGroupColumnDef: ColDef = {
    headerName: 'Group',
    width: 200,
    field: 'name',
    valueGetter: (params) => {
        if (params.node && params.node.group) {
            return params.node.key;
        } else {
            return params.data[params.colDef.field!];
        }
    },
    cellRenderer: 'agGroupCellRenderer',
};

let gridApi: GridApi;

const gridOptions: GridOptions = {
    defaultColDef: {
        editable: true,
        minWidth: 100,
        filter: true,
        floatingFilter: true,
    },
    sideBar: true,
    rowGroupPanelShow: 'always', // on of ['always','onlyWhenGrouping']
    pivotPanelShow: 'always', // on of ['always','onlyWhenPivoting']
    enableRtl: true,
    statusBar: {
        statusPanels: [{ statusPanel: 'agAggregationComponent' }],
    },
    rowSelection: {
        mode: 'multiRow',
        groupSelects: 'descendants',
        selectAll: 'filtered',
    },
    quickFilterText: undefined,
    autoGroupColumnDef: autoGroupColumnDef,
    onRowSelected: rowSelected, //callback when row selected
    onSelectionChanged: selectionChanged, //callback when selection changed,
    getBusinessKeyForNode: (node) => {
        if (node.data) {
            return node.data.name;
        } else {
            return '';
        }
    },
    getContextMenuItems: getContextMenuItems,
};

function getContextMenuItems(params: GetContextMenuItemsParams): (string | MenuItemDef)[] {
    const result: (string | MenuItemDef)[] = params.defaultItems!.splice(0);
    result.push({
        name: 'Custom Menu Item',
        icon: '<img src="https://www.ag-grid.com/example-assets/lab.png" style="width: 14px;" />',
        //shortcut: 'Alt + M',
        action: () => {
            const value = params.value ? params.value : '<empty>';
            window.alert('You clicked a custom menu item on cell ' + value);
        },
    });

    return result;
}

const firstColumn: ColDef = {
    headerName: 'Name',
    field: 'name',
    width: 200,
    editable: true,
    enableRowGroup: true,
    filter: PersonFilter,
    icons: {
        sortAscending: '<i class="fa fa-sort-alpha-up"/>',
        sortDescending: '<i class="fa fa-sort-alpha-down"/>',
    },
};

const defaultCols: (ColDef | ColGroupDef)[] = [
    {
        // column group 'Participant
        headerName: 'Participant',
        children: [
            firstColumn,
            {
                field: 'language',
                width: 150,
                editable: true,
                filter: 'agSetColumnFilter',
                cellRenderer: languageCellRenderer,
                cellEditor: 'agSelectCellEditor',
                enableRowGroup: true,
                enablePivot: true,
                cellEditorParams: {
                    values: [
                        'English',
                        'Spanish',
                        'French',
                        'Portuguese',
                        'German',
                        'Swedish',
                        'Norwegian',
                        'Italian',
                        'Greek',
                        'Icelandic',
                        'Portuguese',
                        'Maltese',
                    ],
                },
                pinned: 'right',
                headerTooltip: 'Example tooltip for Language',
            },
            {
                field: 'country',
                width: 150,
                editable: true,
                cellRenderer: CountryCellRenderer,
                enableRowGroup: true,
                enablePivot: true,
                cellEditor: 'agRichSelectCellEditor',
                cellEditorParams: {
                    cellRenderer: CountryCellRenderer,
                    values: [
                        'Argentina',
                        'Brazil',
                        'Colombia',
                        'France',
                        'Germany',
                        'Greece',
                        'Iceland',
                        'Ireland',
                        'Italy',
                        'Malta',
                        'Portugal',
                        'Norway',
                        'Peru',
                        'Spain',
                        'Sweden',
                        'United Kingdom',
                        'Uruguay',
                        'Venezuela',
                        'Belgium',
                        'Luxembourg',
                    ],
                },
                filterParams: {
                    cellRenderer: CountryCellRenderer,
                },
            },
        ],
    },
    {
        // column group 'Game of Choice'
        headerName: 'Game of Choice',
        children: [
            {
                headerName: 'Game Name',
                field: 'game.name',
                width: 180,
                editable: true,
                filter: 'agSetColumnFilter',
                tooltipField: 'game.name',
                cellClass: () => {
                    return 'alphabet';
                },
                enableRowGroup: true,
                enablePivot: true,
                pinned: 'left',
                icons: {
                    sortAscending: '<i class="fa fa-sort-alpha-up"/>',
                    sortDescending: '<i class="fa fa-sort-alpha-down"/>',
                },
            },
            {
                headerName: 'Bought',
                field: 'game.bought',
                filter: 'agSetColumnFilter',
                editable: true,
                width: 100,
                enableRowGroup: true,
                enablePivot: true,
                enableValue: true,
                cellRenderer: booleanCellRenderer,
                cellStyle: { 'text-align': 'center' },
                comparator: booleanComparator,
                filterParams: { cellRenderer: booleanFilterCellRenderer },
            },
        ],
    },
    {
        // column group 'Performance'
        groupId: 'performance',
        children: [
            {
                field: 'bankBalance',
                width: 150,
                editable: true,
                filter: WinningsFilter,
                cellRenderer: currencyRenderer,
                cellStyle: currencyCssFunc,
                filterParams: { cellRenderer: currencyRenderer },
                enableValue: true,
                icons: {
                    sortAscending: '<i class="fa fa-sort-amount-up"/>',
                    sortDescending: '<i class="fa fa-sort-amount-down"/>',
                },
            },
            {
                headerName: 'Extra Info 1',
                columnGroupShow: 'open',
                width: 150,
                editable: false,
                sortable: false,
                suppressHeaderMenuButton: true,
                cellStyle: { 'text-align': 'right' },
                cellRenderer: () => {
                    return 'Abra...';
                },
            },
            {
                headerName: 'Extra Info 2',
                columnGroupShow: 'open',
                width: 150,
                editable: false,
                sortable: false,
                suppressHeaderMenuButton: true,
                cellStyle: { 'text-align': 'left' },
                cellRenderer: () => {
                    return '...cadabra!';
                },
            },
        ],
    },
    {
        field: 'rating',
        width: 100,
        editable: true,
        cellRenderer: ratingRenderer,
        enableRowGroup: true,
        enablePivot: true,
        enableValue: true,
        filterParams: { cellRenderer: ratingFilterRenderer },
    },
    {
        field: 'totalWinnings',
        filter: 'agNumberColumnFilter',
        editable: true,
        valueSetter: numberValueSetter,
        width: 150,
        enableValue: true,
        cellRenderer: currencyRenderer,
        cellStyle: currencyCssFunc,
        icons: {
            sortAscending: '<i class="fa fa-sort-amount-up"/>',
            sortDescending: '<i class="fa fa-sort-amount-down"/>',
        },
    },
];
//put in the month cols
const monthGroup: ColGroupDef = {
    headerName: 'Monthly Breakdown',
    children: [],
};
defaultCols.push(monthGroup);
months.forEach((month) => {
    const child: ColDef = {
        headerName: month,
        field: month.toLocaleLowerCase(),
        width: 100,
        filter: 'agNumberColumnFilter',
        editable: true,
        enableValue: true,
        cellClassRules: {
            'good-score': 'typeof x === "number" && x > 50000',
            'bad-score': 'typeof x === "number" && x < 10000',
        },
        valueSetter: numberValueSetter,
        cellRenderer: currencyRenderer,
        cellStyle: { 'text-align': 'right' },
    };
    monthGroup.children.push(child);
});

function getColCount() {
    switch (dataSize) {
        case '10x100':
            return 100;
        default:
            return 22;
    }
}

function getRowCount() {
    switch (dataSize) {
        case '.1x22':
            return 100;
        case '1x22':
            return 1000;
        case '10x100':
            return 10000;
        case '100x22':
            return 100000;
        default:
            return -1;
    }
}

function createCols() {
    const colCount = getColCount();
    // start with a copy of the default cols
    const columns = defaultCols.slice(0, colCount);

    // there are 22 cols by default
    for (let col = 22; col < colCount; col++) {
        const colName = colNames[col % colNames.length];
        const colDef = {
            headerName: colName,
            field: 'col' + col,
            width: 200,
            editable: true,
        };
        columns.push(colDef);
    }

    return columns;
}

let loadInstance = 0;

function createData() {
    loadInstance++;

    const loadInstanceCopy = loadInstance;
    gridApi!.setGridOption('loading', true);

    const colDefs = createCols();

    const rowCount = getRowCount();
    const colCount = getColCount();

    let row = 0;
    const data: any[] = [];

    const intervalId = setInterval(() => {
        if (loadInstanceCopy != loadInstance) {
            clearInterval(intervalId);
            return;
        }

        for (let i = 0; i < 1000; i++) {
            if (row < rowCount) {
                const rowItem = createRowItem(row, colCount);
                data.push(rowItem);
                row++;
            }
        }

        if (row >= rowCount) {
            clearInterval(intervalId);
            setTimeout(() => {
                gridApi!.setGridOption('columnDefs', colDefs);
                gridApi!.setGridOption('rowData', data);
                gridApi!.setGridOption('loading', false);
            }, 0);
        }
    }, 0);
}

function createRowItem(row: number, colCount: number) {
    const rowItem: any = {};

    //create data for the known columns
    const countriesToPickFrom = Math.floor(countries.length * (((row % 3) + 1) / 3));
    const countryData = countries[(row * 19) % countriesToPickFrom];
    rowItem.country = countryData.country;
    rowItem.continent = countryData.continent;
    rowItem.language = countryData.language;

    const firstName = firstNames[row % firstNames.length];
    const lastName = lastNames[row % lastNames.length];
    rowItem.name = firstName + ' ' + lastName;

    rowItem.game = {
        name: games[Math.floor(((row * 13) / 17) * 19) % games.length],
        bought: booleanValues[row % booleanValues.length],
    };

    rowItem.bankBalance = Math.round(pseudoRandom() * 10000000) / 100 - 3000;
    rowItem.rating = Math.round(pseudoRandom() * 5);

    let totalWinnings = 0;
    months.forEach((month) => {
        const value = Math.round(pseudoRandom() * 10000000) / 100 - 20;
        rowItem[month.toLocaleLowerCase()] = value;
        totalWinnings += value;
    });
    rowItem.totalWinnings = totalWinnings;

    //create dummy data for the additional columns
    for (let col = defaultCols.length; col < colCount; col++) {
        var value;
        const randomBit = pseudoRandom().toString().substring(2, 5);
        value = colNames[col % colNames.length] + '-' + randomBit + ' - (' + (row + 1) + ',' + col + ')';
        rowItem['col' + col] = value;
    }

    return rowItem;
}

let seed = 123456789;
const m = Math.pow(2, 32);
const a = 1103515245;
const c = 12345;

function pseudoRandom() {
    seed = (a * seed + c) % m;
    return seed / m;
}

function selectionChanged(event: SelectionChangedEvent) {
    console.log('Callback selectionChanged: selection count = ' + gridApi!.getSelectedNodes().length);
}

function rowSelected(event: RowSelectedEvent) {
    // the number of rows selected could be huge, if the user is grouping and selects a group, so
    // to stop the console from clogging up, we only print if in the first 10 (by chance we know
    // the node id's are assigned from 0 upwards)
    if (Number(event.node.id) < 10) {
        const valueToPrint = event.node.group ? 'group (' + event.node.key + ')' : event.node.data.name;
        console.log('Callback rowSelected: ' + valueToPrint);
    }
}

function numberValueSetter(params: ValueSetterParams) {
    const newValue = params.newValue;
    let valueAsNumber;
    if (newValue === null || newValue === undefined || newValue === '') {
        valueAsNumber = null;
    } else {
        valueAsNumber = parseFloat(params.newValue);
    }
    const field = params.colDef.field!;
    const data = params.data;
    data[field] = valueAsNumber;
    return true;
}

function currencyCssFunc(params: CellClassParams): CellStyle {
    if (params.value !== null && params.value !== undefined && params.value < 0) {
        return { color: 'red', 'text-align': 'right', 'font-weight': 'bold' };
    } else {
        return { 'text-align': 'right' };
    }
}

function ratingFilterRenderer(params: ICellRendererParams) {
    return ratingRendererGeneral(params.value, true);
}

function ratingRenderer(params: ICellRendererParams) {
    return ratingRendererGeneral(params.value, false);
}

function ratingRendererGeneral(value: any, forFilter: boolean) {
    if (value === '(Select All)') {
        return value;
    }

    let result = '<span>';

    for (let i = 0; i < 5; i++) {
        if (value > i) {
            result += '<img src="https://www.ag-grid.com/example-assets/gold-star.png" />';
        }
    }

    if (forFilter && Number(value) === 0) {
        result += '(No stars)';
    }

    return result;
}

function currencyRenderer(params: ICellRendererParams) {
    if (params.value === null || params.value === undefined) {
        return null;
    } else if (isNaN(params.value)) {
        return 'NaN';
    } else {
        // if we are doing 'count', then we do not show pound sign
        if (params.node.group && params.column!.getAggFunc() === 'count') {
            return params.value;
        } else {
            return (
                '&pound;' +
                Math.floor(params.value)
                    .toString()
                    .replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,')
            );
        }
    }
}

function booleanComparator(value1: any, value2: any) {
    const value1Cleaned = booleanCleaner(value1);
    const value2Cleaned = booleanCleaner(value2);
    const value1Ordinal = value1Cleaned === true ? 0 : value1Cleaned === false ? 1 : 2;
    const value2Ordinal = value2Cleaned === true ? 0 : value2Cleaned === false ? 1 : 2;
    return value1Ordinal - value2Ordinal;
}

let count = 0;

function booleanCellRenderer(params: ICellRendererParams) {
    count++;
    if (count <= 1) {
        // params.api.onRowHeightChanged();
    }

    const valueCleaned = booleanCleaner(params.value);
    if (valueCleaned === true) {
        //this is the unicode for tick character
        return "<span title='true'>&#10004;</span>";
    } else if (valueCleaned === false) {
        //this is the unicode for cross character
        return "<span title='false'>&#10006;</span>";
    } else if (params.value !== null && params.value !== undefined) {
        return params.value.toString();
    } else {
        return null;
    }
}

function booleanFilterCellRenderer(params: ICellRendererParams) {
    const valueCleaned = booleanCleaner(params.value);

    if (valueCleaned === true) {
        //this is the unicode for tick character
        return '&#10004;';
    } else if (valueCleaned === false) {
        //this is the unicode for cross character
        return '&#10006;';
    } else if (params.value === '(Select All)') {
        return params.value;
    } else {
        return '(empty)';
    }
}

function booleanCleaner(value: any) {
    if (value === 'true' || value === true || value === 1) {
        return true;
    } else if (value === 'false' || value === false || value === 0) {
        return false;
    } else {
        return null;
    }
}

function languageCellRenderer(params: ICellRendererParams) {
    if (params.value !== null && params.value !== undefined) {
        return params.value;
    } else {
        return null;
    }
}

document.addEventListener('DOMContentLoaded', function () {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')!;

    gridApi = createGrid(gridDiv, gridOptions);
    createData();
});
