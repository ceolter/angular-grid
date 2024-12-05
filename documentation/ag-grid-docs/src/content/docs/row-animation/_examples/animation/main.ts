import { ClientSideRowModelModule } from 'ag-grid-community';
import type { ColDef, GridApi, GridOptions } from 'ag-grid-community';
import { createGrid } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { ColumnMenuModule } from 'ag-grid-enterprise';
import { SetFilterModule } from 'ag-grid-enterprise';

ModuleRegistry.registerModules([AllCommunityModule, ClientSideRowModelModule, ColumnMenuModule, SetFilterModule]);

let countDownDirection = true;

const columnDefs: ColDef[] = [
    { field: 'athlete', minWidth: 150 },
    { field: 'country', minWidth: 150 },
    { field: 'year', minWidth: 120 },
    { field: 'gold' },
    { field: 'silver' },
    { field: 'bronze' },
];

let gridApi: GridApi<IOlympicData>;

const gridOptions: GridOptions<IOlympicData> = {
    defaultColDef: {
        flex: 1,
        filter: true,
    },
    columnDefs: columnDefs,
};

// the code below executes an action every 2,000 milliseconds.
// it's an interval, and each time it runs, it takes the next action
// from the 'actions' list below
function startInterval(api: GridApi) {
    let actionIndex = 0;

    resetCountdown();
    executeAfterXSeconds();

    function executeAfterXSeconds() {
        setTimeout(() => {
            const action = getActions()[actionIndex];
            action(api);
            actionIndex++;
            if (actionIndex >= getActions().length) {
                actionIndex = 0;
            }
            resetCountdown();
            executeAfterXSeconds();
        }, 3000);
    }

    setTitleFormatted(null);
}

function resetCountdown() {
    (document.querySelector('#animationCountdown') as any).style.width = countDownDirection ? '100%' : '0%';
    countDownDirection = !countDownDirection;
}

function setTitleFormatted(apiName: null | string, methodName?: string, paramsName?: string) {
    let html;
    if (apiName === null) {
        html = '<span class="code-highlight-yellow">command:> </span>';
    } else {
        html =
            '<span class="code-highlight-yellow">command:> </span> ' +
            '<span class="code-highlight-blue">' +
            apiName +
            '</span>' +
            '<span class="code-highlight-blue">.</span>' +
            '<span class="code-highlight-yellow">' +
            methodName +
            '</span>' +
            '<span class="code-highlight-blue"></span>' +
            '<span class="code-highlight-blue">(</span>' +
            '<span class="code-highlight-green">' +
            paramsName +
            '</span>' +
            '<span class="code-highlight-blue">)</span>';
    }
    document.querySelector('#animationAction')!.innerHTML = html;
}

function getActions() {
    return [
        function (api: GridApi) {
            api.applyColumnState({
                state: [{ colId: 'country', sort: 'asc' }],
                defaultState: { sort: null },
            });
            setTitleFormatted('api', 'applyColumnState', "country: 'asc'");
        },
        function (api: GridApi) {
            api.applyColumnState({
                state: [
                    { colId: 'year', sort: 'asc' },
                    { colId: 'country', sort: 'asc' },
                ],
                defaultState: { sort: null },
            });
            setTitleFormatted('api', 'applyColumnState', "year: 'asc', country 'asc'");
        },
        function (api: GridApi) {
            api.applyColumnState({
                state: [
                    { colId: 'year', sort: 'asc' },
                    { colId: 'country', sort: 'desc' },
                ],
                defaultState: { sort: null },
            });
            setTitleFormatted('api', 'applyColumnState', "year: 'asc', country: 'desc'");
        },
        function (api: GridApi) {
            api.applyColumnState({
                defaultState: { sort: null },
            });
            setTitleFormatted('api', 'applyColumnState', 'clear sort');
        },
    ];
}

// from actual demo page (/animation/)
document.addEventListener('DOMContentLoaded', function () {
    const gridDiv = document.querySelector<HTMLElement>('#myGrid')! || document.querySelector('#animationGrid');

    gridApi = createGrid(gridDiv, gridOptions);

    fetch('https://www.ag-grid.com/example-assets/olympic-winners.json')
        .then((response) => response.json())
        .then(function (data) {
            gridApi!.setGridOption('rowData', data.slice(0, 50));
            startInterval(gridApi!);
        });
});
