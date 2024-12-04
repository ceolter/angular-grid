import type { UserComponentName } from '../../context/context';
import type { AbstractColDef, ColDef, ColGroupDef, ColumnMenuTab } from '../../entities/colDef';
import { DEFAULT_SORTING_ORDER } from '../../sort/sortService';
import { toStringWithNullUndefined } from '../logging';
import type { Deprecations, OptionsValidator, Validations } from '../validationTypes';
import { USER_COMP_MODULES } from './userCompValidations';

const COLUMN_DEFINITION_DEPRECATIONS: Deprecations<ColDef | ColGroupDef> = {
    checkboxSelection: { version: '32.2', message: 'Use `rowSelection.checkboxes` in `GridOptions` instead.' },
    headerCheckboxSelection: {
        version: '32.2',
        message: 'Use `rowSelection.headerCheckbox = true` in `GridOptions` instead.',
    },
    headerCheckboxSelectionFilteredOnly: {
        version: '32.2',
        message: 'Use `rowSelection.selectAll = "filtered"` in `GridOptions` instead.',
    },
    headerCheckboxSelectionCurrentPageOnly: {
        version: '32.2',
        message: 'Use `rowSelection.selectAll = "currentPage"` in `GridOptions` instead.',
    },
    showDisabledCheckboxes: {
        version: '32.2',
        message: 'Use `rowSelection.hideDisabledCheckboxes = true` in `GridOptions` instead.',
    },
};

const COLUMN_DEFINITION_VALIDATIONS: Validations<ColDef | ColGroupDef> = {
    aggFunc: { module: 'SharedAggregation' },
    autoHeight: {
        supportedRowModels: ['clientSide', 'serverSide'],
        module: 'RowAutoHeight',
    },
    cellClass: { module: 'CellStyle' },
    cellClassRules: { module: 'CellStyle' },
    cellEditor: ({ cellEditor, editable }) => {
        if (!editable) {
            return null;
        }
        if (typeof cellEditor === 'string') {
            const module = USER_COMP_MODULES[cellEditor as UserComponentName];
            if (module) {
                return { module };
            }
        }
        return { module: 'CustomEditor' };
    },
    cellRenderer: ({ cellRenderer }) => {
        if (typeof cellRenderer !== 'string') {
            return null;
        }
        const module = USER_COMP_MODULES[cellRenderer as UserComponentName];
        if (module) {
            return { module };
        }
        return null;
    },
    cellRendererParams: {
        validate: (colDef) => {
            const groupColumn =
                colDef.rowGroup != null ||
                colDef.rowGroupIndex != null ||
                colDef.cellRenderer === 'agGroupCellRenderer';

            if (groupColumn && 'checkbox' in colDef.cellRendererParams) {
                return 'Since v33.0, `cellRendererParams.checkbox` has been deprecated. Use `rowSelection.checkboxLocation = "autoGroupColumn"` instead.';
            }
            return null;
        },
    },
    cellStyle: { module: 'CellStyle' },
    children: () => COL_DEF_VALIDATORS,
    columnChooserParams: {
        module: 'ColumnMenu',
    },
    contextMenuItems: { module: 'ContextMenu' },
    dndSource: { module: 'DragAndDrop' },
    dndSourceOnRowDrag: { module: 'DragAndDrop' },
    editable: ({ editable, cellEditor }) => {
        if (editable && !cellEditor) {
            return {
                module: 'TextEditor',
            };
        }
        return null;
    },
    enableCellChangeFlash: { module: 'HighlightChanges' },
    enablePivot: { module: 'SharedPivot' },
    enableRowGroup: { module: 'SharedRowGrouping' },
    enableValue: { module: 'SharedAggregation' },
    filter: ({ filter }) => {
        if (filter && typeof filter !== 'string' && typeof filter !== 'boolean') {
            return { module: 'CustomFilter' };
        }
        if (typeof filter === 'string') {
            const module = USER_COMP_MODULES[filter as UserComponentName];
            if (module) {
                return { module };
            }
        }
        return { module: 'ColumnFilter' };
    },
    floatingFilter: { module: 'ColumnFilter' },
    headerCheckboxSelection: {
        supportedRowModels: ['clientSide', 'serverSide'],
        validate: (_options, { rowSelection }) =>
            rowSelection === 'multiple' ? null : 'headerCheckboxSelection is only supported with rowSelection=multiple',
    },
    headerCheckboxSelectionCurrentPageOnly: {
        supportedRowModels: ['clientSide'],
        validate: (_options, { rowSelection }) =>
            rowSelection === 'multiple'
                ? null
                : 'headerCheckboxSelectionCurrentPageOnly is only supported with rowSelection=multiple',
    },
    headerCheckboxSelectionFilteredOnly: {
        supportedRowModels: ['clientSide'],
        validate: (_options, { rowSelection }) =>
            rowSelection === 'multiple'
                ? null
                : 'headerCheckboxSelectionFilteredOnly is only supported with rowSelection=multiple',
    },
    headerTooltip: { module: 'Tooltip' },
    headerValueGetter: {
        validate: (_options: AbstractColDef) => {
            const headerValueGetter = _options.headerValueGetter;
            if (typeof headerValueGetter === 'function' || typeof headerValueGetter === 'string') {
                return null;
            }
            return 'headerValueGetter must be a function or a valid string expression';
        },
    },
    mainMenuItems: { module: 'ColumnMenu' },
    menuTabs: (options) => {
        const enterpriseMenuTabs: ColumnMenuTab[] = ['columnsMenuTab', 'generalMenuTab'];
        if (options.menuTabs?.some((tab) => enterpriseMenuTabs.includes(tab))) {
            return {
                module: 'ColumnMenu',
            };
        }
        return null;
    },
    pivot: { module: 'SharedPivot' },
    pivotIndex: { module: 'SharedPivot' },
    rowDrag: { module: 'RowDrag' },
    rowGroup: { module: 'SharedRowGrouping' },
    rowGroupIndex: { module: 'SharedRowGrouping' },
    sortingOrder: {
        validate: (_options) => {
            const sortingOrder = _options.sortingOrder;

            if (Array.isArray(sortingOrder) && sortingOrder.length > 0) {
                const invalidItems = sortingOrder.filter((a) => !DEFAULT_SORTING_ORDER.includes(a));
                if (invalidItems.length > 0) {
                    return `sortingOrder must be an array with elements from [${DEFAULT_SORTING_ORDER.map(toStringWithNullUndefined).join()}], currently it includes [${invalidItems.map(toStringWithNullUndefined).join()}]`;
                }
            } else if (!Array.isArray(sortingOrder) || sortingOrder.length <= 0) {
                return `sortingOrder must be an array with at least one element, currently it's ${sortingOrder}`;
            }
            return null;
        },
    },
    tooltipField: { module: 'Tooltip' },
    tooltipValueGetter: { module: 'Tooltip' },
    type: {
        validate: (_options) => {
            const type = _options.type;

            if (type instanceof Array) {
                const invalidArray = type.some((a) => typeof a !== 'string');
                if (invalidArray) {
                    return "if colDef.type is supplied an array it should be of type 'string[]'";
                }
                return null;
            }

            if (typeof type === 'string') {
                return null;
            }
            return "colDef.type should be of type 'string' | 'string[]'";
        },
    },
};

type ColKey = keyof ColDef | keyof ColGroupDef;
const colDefPropertyMap: Record<ColKey, undefined> = {
    headerName: undefined,
    columnGroupShow: undefined,
    headerClass: undefined,
    toolPanelClass: undefined,
    headerValueGetter: undefined,
    pivotKeys: undefined,
    groupId: undefined,
    colId: undefined,
    sort: undefined,
    initialSort: undefined,
    field: undefined,
    type: undefined,
    cellDataType: undefined,
    tooltipComponent: undefined,
    tooltipField: undefined,
    headerTooltip: undefined,
    cellClass: undefined,
    showRowGroup: undefined,
    filter: undefined,
    initialAggFunc: undefined,
    defaultAggFunc: undefined,
    aggFunc: undefined,
    pinned: undefined,
    initialPinned: undefined,
    chartDataType: undefined,
    cellAriaRole: undefined,
    cellEditorPopupPosition: undefined,
    headerGroupComponent: undefined,
    headerGroupComponentParams: undefined,
    cellStyle: undefined,
    cellRenderer: undefined,
    cellRendererParams: undefined,
    cellEditor: undefined,
    cellEditorParams: undefined,
    filterParams: undefined,
    pivotValueColumn: undefined,
    headerComponent: undefined,
    headerComponentParams: undefined,
    floatingFilterComponent: undefined,
    floatingFilterComponentParams: undefined,
    tooltipComponentParams: undefined,
    refData: undefined,
    columnChooserParams: undefined,
    children: undefined,
    sortingOrder: undefined,
    allowedAggFuncs: undefined,
    menuTabs: undefined,
    pivotTotalColumnIds: undefined,
    cellClassRules: undefined,
    icons: undefined,
    sortIndex: undefined,
    initialSortIndex: undefined,
    flex: undefined,
    initialFlex: undefined,
    width: undefined,
    initialWidth: undefined,
    minWidth: undefined,
    maxWidth: undefined,
    rowGroupIndex: undefined,
    initialRowGroupIndex: undefined,
    pivotIndex: undefined,
    initialPivotIndex: undefined,
    suppressColumnsToolPanel: undefined,
    suppressFiltersToolPanel: undefined,
    openByDefault: undefined,
    marryChildren: undefined,
    suppressStickyLabel: undefined,
    hide: undefined,
    initialHide: undefined,
    rowGroup: undefined,
    initialRowGroup: undefined,
    pivot: undefined,
    initialPivot: undefined,
    checkboxSelection: undefined,
    showDisabledCheckboxes: undefined,
    headerCheckboxSelection: undefined,
    headerCheckboxSelectionFilteredOnly: undefined,
    headerCheckboxSelectionCurrentPageOnly: undefined,
    suppressHeaderMenuButton: undefined,
    suppressMovable: undefined,
    lockPosition: undefined,
    lockVisible: undefined,
    lockPinned: undefined,
    unSortIcon: undefined,
    suppressSizeToFit: undefined,
    suppressAutoSize: undefined,
    enableRowGroup: undefined,
    enablePivot: undefined,
    enableValue: undefined,
    editable: undefined,
    suppressPaste: undefined,
    suppressNavigable: undefined,
    enableCellChangeFlash: undefined,
    rowDrag: undefined,
    dndSource: undefined,
    autoHeight: undefined,
    wrapText: undefined,
    sortable: undefined,
    resizable: undefined,
    singleClickEdit: undefined,
    floatingFilter: undefined,
    cellEditorPopup: undefined,
    suppressFillHandle: undefined,
    wrapHeaderText: undefined,
    autoHeaderHeight: undefined,
    dndSourceOnRowDrag: undefined,
    valueGetter: undefined,
    valueSetter: undefined,
    filterValueGetter: undefined,
    keyCreator: undefined,
    valueFormatter: undefined,
    valueParser: undefined,
    comparator: undefined,
    equals: undefined,
    pivotComparator: undefined,
    suppressKeyboardEvent: undefined,
    suppressHeaderKeyboardEvent: undefined,
    colSpan: undefined,
    rowSpan: undefined,
    getQuickFilterText: undefined,
    onCellValueChanged: undefined,
    onCellClicked: undefined,
    onCellDoubleClicked: undefined,
    onCellContextMenu: undefined,
    rowDragText: undefined,
    tooltipValueGetter: undefined,
    cellRendererSelector: undefined,
    cellEditorSelector: undefined,
    suppressSpanHeaderHeight: undefined,
    useValueFormatterForExport: undefined,
    useValueParserForImport: undefined,
    mainMenuItems: undefined,
    contextMenuItems: undefined,
    suppressFloatingFilterButton: undefined,
    suppressHeaderFilterButton: undefined,
    suppressHeaderContextMenu: undefined,
    loadingCellRenderer: undefined,
    loadingCellRendererParams: undefined,
    loadingCellRendererSelector: undefined,
    context: undefined,
};
const ALL_PROPERTIES: ColKey[] = Object.keys(colDefPropertyMap) as ColKey[];

export const COL_DEF_VALIDATORS: OptionsValidator<ColDef | ColGroupDef> = {
    objectName: 'colDef',
    allProperties: ALL_PROPERTIES,
    docsUrl: 'column-properties/',
    deprecations: COLUMN_DEFINITION_DEPRECATIONS,
    validations: COLUMN_DEFINITION_VALIDATIONS,
};
