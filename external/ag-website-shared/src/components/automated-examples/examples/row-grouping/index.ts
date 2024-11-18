/**
 * Automated Row Grouping demo
 */
import { Easing, Group } from '@tweenjs/tween.js';
import { AgChartsEnterpriseModule } from 'ag-charts-enterprise';

import type { ColDef, GridApi, GridOptions, MenuItemDef } from 'ag-grid-community';
import { AllCommunityModule, ClientSideRowModelModule, ModuleRegistry, createGrid } from 'ag-grid-community';
import {
    CellSelectionModule,
    IntegratedChartsModule,
    MenuModule,
    RowGroupingModule,
    SideBarModule,
} from 'ag-grid-enterprise';

import { CATEGORIES, PORTFOLIOS } from '../../data/constants';
import { createDataWorker } from '../../data/createDataWorker';
import { ROW_GROUPING_ID } from '../../lib/constants';
import { createMouse } from '../../lib/createMouse';
import { isInViewport } from '../../lib/dom';
import { getAdditionalContextMenuItems } from '../../lib/getAdditionalContextMenuItems';
import type { ScriptDebugger, ScriptDebuggerManager } from '../../lib/scriptDebugger';
import type { RunScriptState, ScriptRunner } from '../../lib/scriptRunner';
import type { AutomatedExample } from '../../types.d';
import { createScriptRunner } from './createScriptRunner';
import { fixtureData } from './rowDataFixture';

const UPDATES_PER_MESSAGE_1X = 10;
const MESSAGE_FEQUENCY_1X = 200;

let dataWorker;
let scriptRunner: ScriptRunner;
let restartScriptTimeout;

ModuleRegistry.registerModules([
    AllCommunityModule,
    ClientSideRowModelModule,
    RowGroupingModule,
    CellSelectionModule,
    MenuModule,
    IntegratedChartsModule.with(AgChartsEnterpriseModule),
    SideBarModule,
]);

interface CreateAutomatedRowGroupingParams {
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

export type RowGroupingAutomatedExample = AutomatedExample & {
    setUpdateFrequency: (value: number) => void;
};

function numberCellFormatter(params) {
    return Math.floor(params.value)
        .toString()
        .replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');
}

const columnDefs: ColDef[] = [
    {
        field: 'category',
        chartDataType: 'category',
        minWidth: 280,
        enableRowGroup: true,
    },
    {
        field: 'product',
        chartDataType: 'category',
        enableRowGroup: true,
    },
    {
        field: 'previous',
        enableRowGroup: true,
        type: 'numericColumn',
    },
    {
        field: 'current',
        type: ['measure', 'numericColumn'],
        enableRowGroup: true,
    },
    {
        headerName: 'Gain-DX',
        field: 'gainDx',
        type: ['measure', 'numericColumn'],
        enableRowGroup: true,
    },
    { field: 'dealType', enableRowGroup: true },
    { field: 'portfolio', enableRowGroup: true },
];
let api: GridApi;
const gridOptions: GridOptions = {
    theme: 'legacy',
    columnDefs,
    loading: false,
    suppressNoRowsOverlay: true,
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
    getRowId: (params) => String(params.data.id),
    rowGroupPanelShow: 'always',
};

function getDarkModeChartThemes(darkMode: boolean) {
    return darkMode ? ['ag-default-dark'] : ['ag-default'];
}

function initWorker() {
    dataWorker = new Worker(
        URL.createObjectURL(new Blob(['(' + createDataWorker.toString() + ')()'], { type: 'text/javascript' }))
    );
    dataWorker.postMessage({
        type: 'init',
        data: {
            categories: CATEGORIES,
            portfolios: PORTFOLIOS,
            maxTradeCount: 5,
        },
    });
    dataWorker.onmessage = function (e) {
        if (!api) {
            return;
        }

        if (e.data.type === 'setRowData') {
            api.setGridOption('rowData', e.data.records);
        } else if (e.data.type === 'updateData') {
            api.applyTransactionAsync({ update: e.data.records });
        }
    };
}

function startWorkerMessages() {
    dataWorker?.postMessage({
        type: 'start',
    });
}

function stopWorkerMessages() {
    dataWorker?.postMessage({
        type: 'stop',
    });
}

export function createAutomatedRowGrouping({
    gridClassname,
    mouseMaskClassname,
    getContainerScale,
    getOverlay,
    additionalContextMenuItems,
    onStateChange,
    onDataReady,
    suppressUpdates,
    useStaticData,
    scriptDebuggerManager,
    runOnce,
    visibilityThreshold,
    darkMode,
}: CreateAutomatedRowGroupingParams): RowGroupingAutomatedExample {
    const gridSelector = `.${gridClassname}`;
    let gridDiv: HTMLElement;
    let scriptDebugger: ScriptDebugger | undefined;

    const init = () => {
        gridDiv = document.querySelector(gridSelector) as HTMLElement;
        if (!gridDiv) {
            return;
        }

        if (useStaticData) {
            gridOptions.rowData = fixtureData;
        }

        if (additionalContextMenuItems) {
            gridOptions.getContextMenuItems = () => getAdditionalContextMenuItems(additionalContextMenuItems);
        }
        gridOptions.chartThemes = getDarkModeChartThemes(darkMode);
        gridOptions.onGridReady = () => {
            if (suppressUpdates) {
                return;
            }

            initWorker();
            startWorkerMessages();
        };
        gridOptions.onFirstDataRendered = (params) => {
            onDataReady && onDataReady();
            scriptDebugger = scriptDebuggerManager.add({
                id: ROW_GROUPING_ID,
                containerEl: gridDiv,
            });

            // Add it to the body, so it can sit on top of drag and drop target
            const mouse = createMouse({ containerEl: document.body, mouseMaskClassname });
            const tweenGroup = new Group();

            if (scriptRunner) {
                scriptRunner.stop();
            }

            scriptRunner = createScriptRunner({
                id: ROW_GROUPING_ID,
                containerEl: gridDiv,
                getContainerScale,
                getOverlay,
                mouse,
                onStateChange(state) {
                    if (state === 'playing') {
                        startWorkerMessages();
                    } else if (state === 'inactive') {
                        stopWorkerMessages();
                    }

                    onStateChange && onStateChange(state);
                },
                tweenGroup,
                gridApi: params.api,
                loop: !runOnce,
                scriptDebugger,
                defaultEasing: Easing.Quadratic.InOut,
            });
        };

        api = createGrid(gridDiv, gridOptions);
    };
    const updateDarkMode = (newDarkMode: boolean) => {
        // NOTE: Invert dark mode
        api?.setGridOption('chartThemes', getDarkModeChartThemes(!newDarkMode));
    };

    const setUpdateFrequency = (value: number) => {
        dataWorker?.postMessage({
            type: 'updateConfig',
            data: {
                updatesPerMessage: UPDATES_PER_MESSAGE_1X * value,
                messageFrequency: MESSAGE_FEQUENCY_1X / value,
            },
        });
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
        setUpdateFrequency,
        getDebugger: () => scriptDebugger,
        updateDarkMode,
    };
}

export function cleanUp() {
    clearTimeout(restartScriptTimeout);
    if (scriptRunner) {
        scriptRunner.stop();
    }

    stopWorkerMessages();
    dataWorker?.terminate();
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
