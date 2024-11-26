/**
 * Automated Integrated Charts demo
 */
import { Easing, Group } from '@tweenjs/tween.js';

import type {
    ColDef,
    GridApi,
    GridOptions,
    ICellRendererParams,
    MenuItemDef,
    ValueFormatterParams,
} from 'ag-grid-community';

import { createPeopleData } from '../../data/createPeopleData';
import { INTEGRATED_CHARTS_ID } from '../../lib/constants';
import { createMouse } from '../../lib/createMouse';
import { isInViewport } from '../../lib/dom';
import { getAdditionalContextMenuItems } from '../../lib/getAdditionalContextMenuItems';
import type { ScriptDebugger } from '../../lib/scriptDebugger';
import type { ScriptDebuggerManager } from '../../lib/scriptDebugger';
import type { ScriptRunner } from '../../lib/scriptRunner';
import type { RunScriptState } from '../../lib/scriptRunner';
import type { AutomatedExample } from '../../types.d';
import { createScriptRunner } from './createScriptRunner';

let scriptRunner: ScriptRunner;

export interface CreateAutomatedIntegratedChartsParams {
    gridClassname: string;
    mouseMaskClassname: string;
    getOverlay: () => HTMLElement;
    getContainerScale?: () => number;
    additionalContextMenuItems?: (string | MenuItemDef)[];
    onStateChange?: (state: RunScriptState) => void;
    onGridReady?: () => void;
    suppressUpdates?: boolean;
    useStaticData?: boolean;
    runOnce: boolean;
    scriptDebuggerManager: ScriptDebuggerManager;
    visibilityThreshold: number;
    darkMode: boolean;
}

type createAutomatedIntegratedChartsWithCreateGridParams = {
    createGrid: any;
} & CreateAutomatedIntegratedChartsParams;

function numberCellFormatter(params: ValueFormatterParams) {
    return Math.floor(params.value)
        .toString()
        .replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');
}

type CountryCodeKey = keyof typeof COUNTRY_CODES;
const COUNTRY_CODES = {
    Ireland: 'ie',
    Luxembourg: 'lu',
    Belgium: 'be',
    Spain: 'es',
    'United Kingdom': 'gb',
    France: 'fr',
    Germany: 'de',
    Sweden: 'se',
    Italy: 'it',
    Greece: 'gr',
    Iceland: 'is',
    Portugal: 'pt',
    Malta: 'mt',
    Norway: 'no',
    Brazil: 'br',
    Argentina: 'ar',
    Colombia: 'co',
    Peru: 'pe',
    Venezuela: 've',
    Uruguay: 'uy',
    Japan: 'jp',
    China: 'cn',
    'South Korea': 'kr',
    Philippines: 'ph',
    Malaysia: 'my',
    Vietnam: 'vn',
};

const columnDefs: ColDef[] = [
    {
        field: 'name',
        chartDataType: 'category',
        minWidth: 200,
        enableRowGroup: true,
    },
    {
        headerName: 'Country',
        field: 'country',
        chartDataType: 'category',
        enableRowGroup: true,
        minWidth: 200,
        cellRenderer: (params: ICellRendererParams) => {
            if (params.node.group) {
                return params.value;
            }

            // put the value in bold
            return `<div class='country'><span class='flag'><img border="0" width="24" height="16" alt="${params.value} flag"  src="https://flags.fmcdn.net/data/flags/mini/${COUNTRY_CODES[params.value as CountryCodeKey]}.png"></span><span>${params.value}</span></div>`;
        },
    },
    { field: 'jan', type: ['measure', 'numericColumn'], enableRowGroup: true, sort: 'desc' },
    { field: 'feb', type: ['measure', 'numericColumn'], enableRowGroup: true },
    { field: 'mar', type: ['measure', 'numericColumn'], enableRowGroup: true },
    { field: 'apr', type: ['measure', 'numericColumn'], enableRowGroup: true },
    { field: 'may', type: ['measure', 'numericColumn'], enableRowGroup: true },
    { field: 'jun', type: ['measure', 'numericColumn'], enableRowGroup: true },
    { field: 'jul', type: ['measure', 'numericColumn'], enableRowGroup: true },
    { field: 'aug', type: ['measure', 'numericColumn'], enableRowGroup: true },
    { field: 'sep', type: ['measure', 'numericColumn'], enableRowGroup: true },
    { field: 'oct', type: ['measure', 'numericColumn'], enableRowGroup: true },
    { field: 'nov', type: ['measure', 'numericColumn'], enableRowGroup: true },
    { field: 'dec', type: ['measure', 'numericColumn'], enableRowGroup: true },
    { field: 'totalWinnings', type: ['measure', 'numericColumn'], enableRowGroup: true },
];
let api: GridApi;
const gridOptions: GridOptions = {
    theme: 'legacy',
    columnDefs,
    defaultColDef: {
        flex: 1,
        minWidth: 150,
        filter: true,
    },
    autoGroupColumnDef: {
        minWidth: 280,
    },
    columnTypes: {
        measure: {
            aggFunc: 'sum',
            chartDataType: 'series',
            valueFormatter: numberCellFormatter,
            cellRenderer: 'agAnimateShowChangeCellRenderer',
        },
    },
    enableCharts: true,
    cellSelection: true,
    suppressAggFuncInHeader: true,
    rowGroupPanelShow: 'always',
    chartToolPanelsDef: {
        defaultToolPanel: 'settings',
    },
    rowSelection: {
        mode: 'multiRow',
    },
};

function getDarkModeChartThemes(darkMode: boolean) {
    return darkMode
        ? ['ag-default-dark', 'ag-material-dark', 'ag-sheets-dark', 'ag-polychroma-dark', 'ag-vivid-dark']
        : ['ag-default', 'ag-material', 'ag-sheets', 'ag-polychroma', 'ag-vivid'];
}

export function createAutomatedIntegratedChartsWithCreateGrid({
    createGrid,
    gridClassname,
    mouseMaskClassname,
    getContainerScale,
    getOverlay,
    additionalContextMenuItems,
    onStateChange,
    onGridReady,
    suppressUpdates,
    scriptDebuggerManager,
    runOnce,
    visibilityThreshold,
    darkMode,
}: createAutomatedIntegratedChartsWithCreateGridParams): AutomatedExample {
    const gridSelector = `.${gridClassname}`;
    let gridDiv: HTMLElement;
    let scriptDebugger: ScriptDebugger | undefined;

    const init = () => {
        gridDiv = document.querySelector(gridSelector) as HTMLElement;
        if (!gridDiv) {
            return;
        }

        gridOptions.rowData = createPeopleData({ randomize: !suppressUpdates });

        if (additionalContextMenuItems) {
            gridOptions.getContextMenuItems = () => getAdditionalContextMenuItems(additionalContextMenuItems);
        }

        gridOptions.chartThemes = getDarkModeChartThemes(darkMode);

        gridOptions.onGridReady = () => {
            onGridReady?.();
        };
        gridOptions.onFirstDataRendered = (e) => {
            if (suppressUpdates) {
                return;
            }

            scriptDebugger = scriptDebuggerManager.add({
                id: INTEGRATED_CHARTS_ID,
                containerEl: gridDiv,
            });

            const mouse = createMouse({ containerEl: document.body, mouseMaskClassname });
            const tweenGroup = new Group();

            if (scriptRunner) {
                scriptRunner.stop();
            }

            scriptRunner = createScriptRunner({
                id: INTEGRATED_CHARTS_ID,
                containerEl: gridDiv,
                getContainerScale,
                getOverlay,
                mouse,
                onStateChange,
                tweenGroup,
                gridApi: e.api,
                loop: !runOnce,
                scriptDebugger,
                defaultEasing: Easing.Quadratic.InOut,
            });
        };

        api = createGrid(gridDiv, gridOptions);
    };
    const updateDarkMode = (newDarkMode: boolean) => {
        api?.setGridOption('chartThemes', getDarkModeChartThemes(newDarkMode));
    };

    const loadGrid = function () {
        if (document.querySelector(gridSelector)) {
            init();
        } else {
            requestAnimationFrame(() => loadGrid());
        }
    };

    loadGrid();

    return {
        start: () => scriptRunner?.play(),
        stop: () => scriptRunner?.stop(),
        inactive: () => scriptRunner?.inactive(),
        currentState: () => scriptRunner?.currentState(),
        isInViewport: () => {
            return isInViewport({ element: gridDiv, threshold: visibilityThreshold });
        },
        getDebugger: () => scriptDebugger,
        updateDarkMode,
    };
}

export function cleanUp() {
    if (scriptRunner) {
        scriptRunner.stop();
    }

    api?.destroy();
}

/**
 * Clean up between hot module replacement on dev server
 */
if (import.meta.hot) {
    import.meta.hot.dispose(() => {
        cleanUp();
    });
}
