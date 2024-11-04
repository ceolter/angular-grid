// False positive lint error, ElementRef and co can't be type imports
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import {
    AfterViewInit,
    Component,
    ElementRef,
    EventEmitter,
    Input,
    OnChanges,
    OnDestroy,
    Output,
    ViewContainerRef,
    ViewEncapsulation,
    booleanAttribute,
} from '@angular/core';
import type { AgChartTheme, AgChartThemeOverrides } from 'ag-charts-types';

// @START_IMPORTS@
import type {
    AdvancedFilterBuilderVisibleChangedEvent,
    AlignedGrid,
    AsyncTransactionsFlushedEvent,
    BodyScrollEndEvent,
    BodyScrollEvent,
    CellClickedEvent,
    CellContextMenuEvent,
    CellDoubleClickedEvent,
    CellEditRequestEvent,
    CellEditingStartedEvent,
    CellEditingStoppedEvent,
    CellFocusedEvent,
    CellKeyDownEvent,
    CellMouseDownEvent,
    CellMouseOutEvent,
    CellMouseOverEvent,
    CellPosition,
    CellSelectionChangedEvent,
    CellSelectionDeleteEndEvent,
    CellSelectionDeleteStartEvent,
    CellSelectionOptions,
    CellValueChangedEvent,
    ChartCreatedEvent,
    ChartDestroyedEvent,
    ChartOptionsChangedEvent,
    ChartRangeSelectionChangedEvent,
    ChartRefParams,
    ChartToolPanelsDef,
    ColDef,
    ColGroupDef,
    ColTypeDef,
    Column,
    ColumnEverythingChangedEvent,
    ColumnGroupOpenedEvent,
    ColumnHeaderClickedEvent,
    ColumnHeaderContextMenuEvent,
    ColumnHeaderMouseLeaveEvent,
    ColumnHeaderMouseOverEvent,
    ColumnMenuVisibleChangedEvent,
    ColumnMovedEvent,
    ColumnPinnedEvent,
    ColumnPivotChangedEvent,
    ColumnPivotModeChangedEvent,
    ColumnResizedEvent,
    ColumnRowGroupChangedEvent,
    ColumnValueChangedEvent,
    ColumnVisibleEvent,
    ComponentStateChangedEvent,
    ContextMenuVisibleChangedEvent,
    CsvExportParams,
    CutEndEvent,
    CutStartEvent,
    DataTypeDefinition,
    DisplayedColumnsChangedEvent,
    DomLayoutType,
    DragCancelledEvent,
    DragStartedEvent,
    DragStoppedEvent,
    ExcelExportParams,
    ExcelStyle,
    ExpandOrCollapseAllEvent,
    FillEndEvent,
    FillOperationParams,
    FillStartEvent,
    FilterChangedEvent,
    FilterModifiedEvent,
    FilterOpenedEvent,
    FirstDataRenderedEvent,
    FocusGridInnerElementParams,
    FullWidthCellKeyDownEvent,
    GetChartMenuItems,
    GetChartToolbarItems,
    GetContextMenuItems,
    GetDataPath,
    GetGroupRowAggParams,
    GetLocaleTextParams,
    GetMainMenuItems,
    GetRowIdFunc,
    GetServerSideGroupKey,
    GetServerSideGroupLevelParamsParams,
    GridColumnsChangedEvent,
    GridReadyEvent,
    GridSizeChangedEvent,
    GridState,
    GridTheme,
    HeaderFocusedEvent,
    HeaderPosition,
    IAdvancedFilterBuilderParams,
    IAggFunc,
    IDatasource,
    IRowDragItem,
    IRowNode,
    IServerSideDatasource,
    IViewportDatasource,
    InitialGroupOrderComparatorParams,
    IsApplyServerSideTransaction,
    IsExternalFilterPresentParams,
    IsFullWidthRowParams,
    IsGroupOpenByDefaultParams,
    IsRowFilterable,
    IsRowMaster,
    IsRowSelectable,
    IsServerSideGroup,
    IsServerSideGroupOpenByDefaultParams,
    LoadingCellRendererSelectorFunc,
    MenuItemDef,
    ModelUpdatedEvent,
    NavigateToNextCellParams,
    NavigateToNextHeaderParams,
    NewColumnsLoadedEvent,
    PaginationChangedEvent,
    PaginationNumberFormatterParams,
    PasteEndEvent,
    PasteStartEvent,
    PinnedRowDataChangedEvent,
    PivotMaxColumnsExceededEvent,
    PostProcessPopupParams,
    PostSortRowsParams,
    ProcessCellForExportParams,
    ProcessDataFromClipboardParams,
    ProcessGroupHeaderForExportParams,
    ProcessHeaderForExportParams,
    ProcessRowParams,
    ProcessUnpinnedColumnsParams,
    RangeDeleteEndEvent,
    RangeDeleteStartEvent,
    RangeSelectionChangedEvent,
    RedoEndedEvent,
    RedoStartedEvent,
    RowClassParams,
    RowClassRules,
    RowClickedEvent,
    RowDataUpdatedEvent,
    RowDoubleClickedEvent,
    RowDragCancelEvent,
    RowDragEndEvent,
    RowDragEnterEvent,
    RowDragLeaveEvent,
    RowDragMoveEvent,
    RowEditingStartedEvent,
    RowEditingStoppedEvent,
    RowGroupOpenedEvent,
    RowGroupingDisplayType,
    RowHeightParams,
    RowModelType,
    RowSelectedEvent,
    RowSelectionOptions,
    RowStyle,
    RowValueChangedEvent,
    SelectionChangedEvent,
    SelectionColumnDef,
    SendToClipboardParams,
    ServerSideGroupLevelParams,
    SideBarDef,
    SizeColumnsToContentStrategy,
    SizeColumnsToFitGridStrategy,
    SizeColumnsToFitProvidedWidthStrategy,
    SortChangedEvent,
    SortDirection,
    StateUpdatedEvent,
    StatusPanelDef,
    StoreRefreshedEvent,
    TabToNextCellParams,
    TabToNextHeaderParams,
    ToolPanelSizeChangedEvent,
    ToolPanelVisibleChangedEvent,
    TooltipHideEvent,
    TooltipShowEvent,
    TreeDataDisplayType,
    UndoEndedEvent,
    UndoStartedEvent,
    UseGroupTotalRow,
    ViewportChangedEvent,
    VirtualColumnsChangedEvent,
    VirtualRowRemovedEvent,
} from 'ag-grid-community';
// @END_IMPORTS@
import type { GridApi, GridOptions, GridParams, Module } from 'ag-grid-community';
import { _combineAttributesAndGridOptions, _processOnChange, createGrid } from 'ag-grid-community';

import { AngularFrameworkComponentWrapper } from './angularFrameworkComponentWrapper';
import { AngularFrameworkOverrides } from './angularFrameworkOverrides';

@Component({
    selector: 'ag-grid-angular',
    standalone: true,
    template: '',
    providers: [AngularFrameworkOverrides, AngularFrameworkComponentWrapper],
    // tell angular we don't want view encapsulation, we don't want a shadow root
    encapsulation: ViewEncapsulation.None,
})
export class AgGridAngular<TData = any, TColDef extends ColDef<TData> = ColDef<any>>
    implements AfterViewInit, OnChanges, OnDestroy
{
    // not intended for user to interact with. so putting _ in so if user gets reference
    // to this object, they kind'a know it's not part of the agreed interface
    private _nativeElement: any;
    private _initialised = false;
    private _destroyed = false;

    // in order to ensure firing of gridReady is deterministic
    private _holdEvents = true;
    private _resolveFullyReady: () => void;
    private _fullyReady: Promise<void> = new Promise((resolve) => {
        this._resolveFullyReady = resolve;
    });

    /** Grid Api available after onGridReady event has fired. */
    public api: GridApi<TData>;

    constructor(
        elementDef: ElementRef,
        private _viewContainerRef: ViewContainerRef,
        private _angularFrameworkOverrides: AngularFrameworkOverrides,
        private _frameworkCompWrapper: AngularFrameworkComponentWrapper
    ) {
        this._nativeElement = elementDef.nativeElement;
        this._fullyReady.then(() => {
            // Register the status flag reset before any events are fired
            // so that we can swap to synchronous event firing as soon as the grid is ready
            this._holdEvents = false;
        });
    }

    ngAfterViewInit(): void {
        // Run the setup outside of angular so all the event handlers that are created do not trigger change detection
        this._angularFrameworkOverrides.runOutsideAngular(() => {
            this._frameworkCompWrapper.setViewContainerRef(this._viewContainerRef, this._angularFrameworkOverrides);

            // Get all the inputs that are valid GridOptions
            const gridOptionKeys = Object.entries(this)
                .filter(
                    ([key, value]) =>
                        !(
                            key.startsWith('_') ||
                            key == 'gridOptions' ||
                            key == 'modules' ||
                            value instanceof EventEmitter
                        )
                )
                .map(([key]) => key);

            const mergedGridOps = _combineAttributesAndGridOptions(this.gridOptions, this, gridOptionKeys);

            const gridParams: GridParams = {
                globalListener: this.globalListener.bind(this),
                frameworkOverrides: this._angularFrameworkOverrides,
                providedBeanInstances: {
                    frameworkCompWrapper: this._frameworkCompWrapper,
                },
                modules: (this.modules || []) as any,
                setThemeOnGridDiv: true,
            };

            const api = createGrid(this._nativeElement, mergedGridOps, gridParams);
            if (api) {
                this.api = api;
            }

            this._initialised = true;

            // sometimes, especially in large client apps gridReady can fire before ngAfterViewInit
            // this ties these together so that gridReady will always fire after agGridAngular's ngAfterViewInit
            // the actual containing component's ngAfterViewInit will fire just after agGridAngular's
            this._resolveFullyReady();
        });
    }

    public ngOnChanges(changes: any): void {
        if (this._initialised) {
            // Run the changes outside of angular so any event handlers that are created do not trigger change detection
            this._angularFrameworkOverrides.runOutsideAngular(() => {
                const gridOptions: GridOptions = {};
                Object.entries(changes).forEach(([key, value]: [string, any]) => {
                    gridOptions[key as keyof GridOptions] = value.currentValue;
                });
                _processOnChange(gridOptions, this.api);
            });
        }
    }

    public ngOnDestroy(): void {
        if (this._initialised) {
            // need to do this before the destroy, so we know not to emit any events
            // while tearing down the grid.
            this._destroyed = true;
            // could be null if grid failed to initialise
            this.api?.destroy();
        }
    }

    // we'll emit the emit if a user is listening for a given event either on the component via normal angular binding
    // or via gridOptions
    protected isEmitterUsed(eventType: string): boolean {
        const emitter = <EventEmitter<any>>(<any>this)[eventType];
        // For RxJs compatibility we need to check for observed v7+ or observers v6
        const emitterAny = emitter as any;
        const hasEmitter = emitterAny?.observed ?? emitterAny?.observers?.length > 0;

        // gridReady => onGridReady
        const asEventName = `on${eventType.charAt(0).toUpperCase()}${eventType.substring(1)}`;
        const hasGridOptionListener = !!this.gridOptions && !!(this.gridOptions as any)[asEventName];

        return hasEmitter || hasGridOptionListener;
    }

    private globalListener(eventType: string, event: any): void {
        // if we are tearing down, don't emit angular events, as this causes
        // problems with the angular router
        if (this._destroyed) {
            return;
        }

        // generically look up the eventType
        const emitter = <EventEmitter<any>>(<any>this)[eventType];
        if (emitter && this.isEmitterUsed(eventType)) {
            // Make sure we emit within the angular zone, so change detection works properly
            const fireEmitter = () => this._angularFrameworkOverrides.runInsideAngular(() => emitter.emit(event));

            if (this._holdEvents) {
                // if the user is listening to events, wait for ngAfterViewInit to fire first, then emit the grid events
                this._fullyReady.then(() => fireEmitter());
            } else {
                fireEmitter();
            }
        }
    }

    /** Provided an initial gridOptions configuration to the component. If a property is specified in both gridOptions and via component binding the component binding takes precedence.  */
    @Input() public gridOptions: GridOptions<TData> | undefined;
    /**
     * Used to register AG Grid Modules directly with this instance of the grid.
     * See [Providing Modules To Individual Grids](https://www.ag-grid.com/angular-data-grid/modules/#providing-modules-to-individual-grids) for more information.
     */
    @Input() public modules: Module[] | undefined;

    // @START@
    /** Specifies the status bar components to use in the status bar.
     */
    @Input() public statusBar: { statusPanels: StatusPanelDef[] } | undefined = undefined;
    /** Specifies the side bar components.
     */
    @Input() public sideBar: SideBarDef | string | string[] | boolean | null | undefined = undefined;
    /** Set to `true` to not show the context menu. Use if you don't want to use the default 'right click' context menu.
     * @default false
     */
    @Input({ transform: booleanAttribute }) public suppressContextMenu: boolean | undefined = undefined;
    /** When using `suppressContextMenu`, you can use the `onCellContextMenu` function to provide your own code to handle cell `contextmenu` events.
     * This flag is useful to prevent the browser from showing its default context menu.
     * @default false
     */
    @Input({ transform: booleanAttribute }) public preventDefaultOnContextMenu: boolean | undefined = undefined;
    /** Allows context menu to show, even when `Ctrl` key is held down.
     * @default false
     */
    @Input({ transform: booleanAttribute }) public allowContextMenuWithControlKey: boolean | undefined = undefined;
    /** Changes the display type of the column menu.
     * `'new'` just displays the main list of menu items. `'legacy'` displays a tabbed menu.
     * @default 'new'
     * @initial
     */
    @Input() public columnMenu: 'legacy' | 'new' | undefined = undefined;
    /** When `true`, the column menu button will always be shown.
     * When `false`, the column menu button will only show when the mouse is over the column header.
     * If `columnMenu = 'legacy'`, this will default to `false` instead of `true`.
     * @default true
     */
    @Input({ transform: booleanAttribute }) public suppressMenuHide: boolean | undefined = undefined;
    /** Set to `true` to use the browser's default tooltip instead of using the grid's Tooltip Component.
     * @default false
     * @initial
     */
    @Input({ transform: booleanAttribute }) public enableBrowserTooltips: boolean | undefined = undefined;
    /** The trigger that will cause tooltips to show and hide.
     *  - `hover` - The tooltip will show/hide when a cell/header is hovered.
     *  - `focus` - The tooltip will show/hide when a cell/header is focused.
     * @default 'hover'
     * @initial
     */
    @Input() public tooltipTrigger: 'hover' | 'focus' | undefined = undefined;
    /** The delay in milliseconds that it takes for tooltips to show up once an element is hovered over.
     *     **Note:** This property does not work if `enableBrowserTooltips` is `true`.
     * @default 2000
     */
    @Input() public tooltipShowDelay: number | undefined = undefined;
    /** The delay in milliseconds that it takes for tooltips to hide once they have been displayed.
     *     **Note:** This property does not work if `enableBrowserTooltips` is `true` and `tooltipHideTriggers` includes `timeout`.
     * @default 10000
     */
    @Input() public tooltipHideDelay: number | undefined = undefined;
    /** Set to `true` to have tooltips follow the cursor once they are displayed.
     * @default false
     * @initial
     */
    @Input({ transform: booleanAttribute }) public tooltipMouseTrack: boolean | undefined = undefined;
    /** This defines when tooltip will show up for Cells, Headers and SetFilter Items.
     *  - `standard` - The tooltip always shows up when the items configured with Tooltips are hovered.
     * - `whenTruncated` - The tooltip will only be displayed when the items hovered have truncated (showing ellipsis) values. This property does not work when `enableBrowserTooltips={true}`.
     * @default `standard`
     */
    @Input() public tooltipShowMode: 'standard' | 'whenTruncated' | undefined = undefined;
    /** Set to `true` to enable tooltip interaction. When this option is enabled, the tooltip will not hide while the
     * tooltip itself it being hovered or has focus.
     * @default false
     * @initial
     */
    @Input({ transform: booleanAttribute }) public tooltipInteraction: boolean | undefined = undefined;
    /** DOM element to use as the popup parent for grid popups (context menu, column menu etc).
     */
    @Input() public popupParent: HTMLElement | null | undefined = undefined;
    /** Set to `true` to also include headers when copying to clipboard using `Ctrl + C` clipboard.
     * @default false
     */
    @Input({ transform: booleanAttribute }) public copyHeadersToClipboard: boolean | undefined = undefined;
    /** Set to `true` to also include group headers when copying to clipboard using `Ctrl + C` clipboard.
     * @default false
     */
    @Input({ transform: booleanAttribute }) public copyGroupHeadersToClipboard: boolean | undefined = undefined;
    /** Specify the delimiter to use when copying to clipboard.
     * @default '\t'
     */
    @Input() public clipboardDelimiter: string | undefined = undefined;
    /** Set to `true` to copy the cell range or focused cell to the clipboard and never the selected rows.
     * @default false
     * @deprecated v32.2 Use `rowSelection.copySelectedRows` instead.
     */
    @Input({ transform: booleanAttribute }) public suppressCopyRowsToClipboard: boolean | undefined = undefined;
    /** Set to `true` to copy rows instead of ranges when a range with only a single cell is selected.
     * @default false
     * @deprecated v32.2 Use `rowSelection.copySelectedRows` instead.
     */
    @Input({ transform: booleanAttribute }) public suppressCopySingleCellRanges: boolean | undefined = undefined;
    /** Set to `true` to work around a bug with Excel (Windows) that adds an extra empty line at the end of ranges copied to the clipboard.
     * @default false
     */
    @Input({ transform: booleanAttribute }) public suppressLastEmptyLineOnPaste: boolean | undefined = undefined;
    /** Set to `true` to turn off paste operations within the grid.
     * @default false
     */
    @Input({ transform: booleanAttribute }) public suppressClipboardPaste: boolean | undefined = undefined;
    /** Set to `true` to stop the grid trying to use the Clipboard API, if it is blocked, and immediately fallback to the workaround.
     * @default false
     */
    @Input({ transform: booleanAttribute }) public suppressClipboardApi: boolean | undefined = undefined;
    /** Set to `true` to block     **cut** operations within the grid.
     * @default false
     */
    @Input({ transform: booleanAttribute }) public suppressCutToClipboard: boolean | undefined = undefined;
    /** Array of Column / Column Group definitions.
     */
    @Input() public columnDefs: (TColDef | ColGroupDef<TData>)[] | null | undefined = undefined;
    /** A default column definition. Items defined in the actual column definitions get precedence.
     */
    @Input() public defaultColDef: ColDef<TData> | undefined = undefined;
    /** A default column group definition. All column group definitions will use these properties. Items defined in the actual column group definition get precedence.
     * @initial
     */
    @Input() public defaultColGroupDef: Partial<ColGroupDef<TData>> | undefined = undefined;
    /** An object map of custom column types which contain groups of properties that column definitions can reuse by referencing in their `type` property.
     */
    @Input() public columnTypes: { [key: string]: ColTypeDef<TData> } | undefined = undefined;
    /** An object map of cell data types to their definitions.
     * Cell data types can either override/update the pre-defined data types
     * (`'text'`, `'number'`,  `'boolean'`,  `'date'`,  `'dateString'` or  `'object'`),
     * or can be custom data types.
     */
    @Input() public dataTypeDefinitions:
        | {
              [cellDataType: string]: DataTypeDefinition<TData>;
          }
        | undefined = undefined;
    /** Keeps the order of Columns maintained after new Column Definitions are updated.
     *
     * @default false
     */
    @Input({ transform: booleanAttribute }) public maintainColumnOrder: boolean | undefined = undefined;
    /** Resets pivot column order when impacted by filters, data or configuration changes
     *
     * @default false
     */
    @Input({ transform: booleanAttribute }) public enableStrictPivotColumnOrder: boolean | undefined = undefined;
    /** If `true`, then dots in field names (e.g. `'address.firstLine'`) are not treated as deep references. Allows you to use dots in your field name if you prefer.
     * @default false
     */
    @Input({ transform: booleanAttribute }) public suppressFieldDotNotation: boolean | undefined = undefined;
    /** The height in pixels for the row containing the column label header. If not specified, it uses the theme value of `header-height`.
     */
    @Input() public headerHeight: number | undefined = undefined;
    /** The height in pixels for the rows containing header column groups. If not specified, it uses `headerHeight`.
     */
    @Input() public groupHeaderHeight: number | undefined = undefined;
    /** The height in pixels for the row containing the floating filters. If not specified, it uses the theme value of `header-height`.
     */
    @Input() public floatingFiltersHeight: number | undefined = undefined;
    /** The height in pixels for the row containing the columns when in pivot mode. If not specified, it uses `headerHeight`.
     */
    @Input() public pivotHeaderHeight: number | undefined = undefined;
    /** The height in pixels for the row containing header column groups when in pivot mode. If not specified, it uses `groupHeaderHeight`.
     */
    @Input() public pivotGroupHeaderHeight: number | undefined = undefined;
    /** Allow reordering and pinning columns by dragging columns from the Columns Tool Panel to the grid.
     * @default false
     */
    @Input({ transform: booleanAttribute }) public allowDragFromColumnsToolPanel: boolean | undefined = undefined;
    /** Set to `true` to suppress column moving, i.e. to make the columns fixed position.
     * @default false
     */
    @Input({ transform: booleanAttribute }) public suppressMovableColumns: boolean | undefined = undefined;
    /** If `true`, the `ag-column-moving` class is not added to the grid while columns are moving. In the default themes, this results in no animation when moving columns.
     * @default false
     */
    @Input({ transform: booleanAttribute }) public suppressColumnMoveAnimation: boolean | undefined = undefined;
    /** Set to `true` to suppress moving columns while dragging the Column Header. This option highlights the position where the column will be placed and it will only move it on mouse up.
     * @default false
     */
    @Input({ transform: booleanAttribute }) public suppressMoveWhenColumnDragging: boolean | undefined = undefined;
    /** If `true`, when you drag a column out of the grid (e.g. to the group zone) the column is not hidden.
     * @default false
     */
    @Input({ transform: booleanAttribute }) public suppressDragLeaveHidesColumns: boolean | undefined = undefined;
    /** Enable to prevent column visibility changing when grouped columns are changed.
     * @default false
     */
    @Input() public suppressGroupChangesColumnVisibility:
        | boolean
        | 'suppressHideOnGroup'
        | 'suppressShowOnUngroup'
        | undefined = undefined;
    /** By default, when a column is un-grouped, i.e. using the Row Group Panel, it is made visible in the grid. This property stops the column becoming visible again when un-grouping.
     * @default false
     * @deprecated v32.3.0 - Use `suppressGroupChangesColumnVisibility: 'suppressShowOnUngroup'` instead.
     */
    @Input({ transform: booleanAttribute }) public suppressMakeColumnVisibleAfterUnGroup: boolean | undefined =
        undefined;
    /** If `true`, when you drag a column into a row group panel the column is not hidden.
     * @default false
     * @deprecated v32.3.0 - Use `suppressGroupChangesColumnVisibility: 'suppressHideOnGroup'` instead.
     */
    @Input({ transform: booleanAttribute }) public suppressRowGroupHidesColumns: boolean | undefined = undefined;
    /** Set to `'shift'` to have shift-resize as the default resize operation (same as user holding down `Shift` while resizing).
     */
    @Input() public colResizeDefault: 'shift' | undefined = undefined;
    /** Suppresses auto-sizing columns for columns. In other words, double clicking a column's header's edge will not auto-size.
     * @default false
     * @initial
     */
    @Input({ transform: booleanAttribute }) public suppressAutoSize: boolean | undefined = undefined;
    /** Number of pixels to add to a column width after the [auto-sizing](./column-sizing/#auto-size-columns-to-fit-cell-contents) calculation.
     * Set this if you want to add extra room to accommodate (for example) sort icons, or some other dynamic nature of the header.
     * @default 20
     */
    @Input() public autoSizePadding: number | undefined = undefined;
    /** Set this to `true` to skip the `headerName` when `autoSize` is called by default.
     * @default false
     * @initial
     */
    @Input({ transform: booleanAttribute }) public skipHeaderOnAutoSize: boolean | undefined = undefined;
    /** Auto-size the columns when the grid is loaded. Can size to fit the grid width, fit a provided width, or fit the cell contents.
     * @initial
     */
    @Input() public autoSizeStrategy:
        | SizeColumnsToFitGridStrategy
        | SizeColumnsToFitProvidedWidthStrategy
        | SizeColumnsToContentStrategy
        | undefined = undefined;
    /** A map of component names to components.
     * @initial
     */
    @Input() public components: { [p: string]: any } | undefined = undefined;
    /** Set to `'fullRow'` to enable Full Row Editing. Otherwise leave blank to edit one cell at a time.
     */
    @Input() public editType: 'fullRow' | undefined = undefined;
    /** Set to `true` to enable Single Click Editing for cells, to start editing with a single click.
     * @default false
     */
    @Input({ transform: booleanAttribute }) public singleClickEdit: boolean | undefined = undefined;
    /** Set to `true` so that neither single nor double click starts editing.
     * @default false
     */
    @Input({ transform: booleanAttribute }) public suppressClickEdit: boolean | undefined = undefined;
    /** Set to `true` to stop the grid updating data after `Edit`, `Clipboard` and `Fill Handle` operations. When this is set, it is intended the application will update the data, eg in an external immutable store, and then pass the new dataset to the grid. <br />**Note:** `rowNode.setDataValue()` does not update the value of the cell when this is `True`, it fires `onCellEditRequest` instead.
     * @default false
     */
    @Input({ transform: booleanAttribute }) public readOnlyEdit: boolean | undefined = undefined;
    /** Set this to `true` to stop cell editing when grid loses focus.
     * The default is that the grid stays editing until focus goes onto another cell.
     * @default false
     * @initial
     */
    @Input({ transform: booleanAttribute }) public stopEditingWhenCellsLoseFocus: boolean | undefined = undefined;
    /** Set to `true` along with `enterNavigatesVerticallyAfterEdit` to have Excel-style behaviour for the `Enter` key.
     * i.e. pressing the `Enter` key will move down to the cell beneath and `Shift+Enter` will move up to the cell above.
     * @default false
     */
    @Input({ transform: booleanAttribute }) public enterNavigatesVertically: boolean | undefined = undefined;
    /** Set to `true` along with `enterNavigatesVertically` to have Excel-style behaviour for the 'Enter' key.
     * i.e. pressing the Enter key will move down to the cell beneath and Shift+Enter key will move up to the cell above.
     * @default false
     */
    @Input({ transform: booleanAttribute }) public enterNavigatesVerticallyAfterEdit: boolean | undefined = undefined;
    /** Forces Cell Editing to start when backspace is pressed. This is only relevant for MacOS users.
     */
    @Input({ transform: booleanAttribute }) public enableCellEditingOnBackspace: boolean | undefined = undefined;
    /** Set to `true` to enable Undo / Redo while editing.
     * @initial
     */
    @Input({ transform: booleanAttribute }) public undoRedoCellEditing: boolean | undefined = undefined;
    /** Set the size of the undo / redo stack.
     * @default 10
     * @initial
     */
    @Input() public undoRedoCellEditingLimit: number | undefined = undefined;
    /** A default configuration object used to export to CSV.
     */
    @Input() public defaultCsvExportParams: CsvExportParams | undefined = undefined;
    /** Prevents the user from exporting the grid to CSV.
     * @default false
     */
    @Input({ transform: booleanAttribute }) public suppressCsvExport: boolean | undefined = undefined;
    /** A default configuration object used to export to Excel.
     */
    @Input() public defaultExcelExportParams: ExcelExportParams | undefined = undefined;
    /** Prevents the user from exporting the grid to Excel.
     * @default false
     */
    @Input({ transform: booleanAttribute }) public suppressExcelExport: boolean | undefined = undefined;
    /** A list (array) of Excel styles to be used when exporting to Excel with styles.
     * @initial
     */
    @Input() public excelStyles: ExcelStyle[] | undefined = undefined;
    /** Rows are filtered using this text as a Quick Filter.
     */
    @Input() public quickFilterText: string | undefined = undefined;
    /** Set to `true` to turn on the Quick Filter cache, used to improve performance when using the Quick Filter.
     * @default false
     * @initial
     */
    @Input({ transform: booleanAttribute }) public cacheQuickFilter: boolean | undefined = undefined;
    /** Hidden columns are excluded from the Quick Filter by default.
     * To include hidden columns, set to `true`.
     * @default false
     */
    @Input({ transform: booleanAttribute }) public includeHiddenColumnsInQuickFilter: boolean | undefined = undefined;
    /** Changes how the Quick Filter splits the Quick Filter text into search terms.
     */
    @Input() public quickFilterParser: ((quickFilter: string) => string[]) | undefined = undefined;
    /** Changes the matching logic for whether a row passes the Quick Filter.
     */
    @Input() public quickFilterMatcher:
        | ((quickFilterParts: string[], rowQuickFilterAggregateText: string) => boolean)
        | undefined = undefined;
    /** When pivoting, Quick Filter is only applied on the pivoted data
     * (or aggregated data if `groupAggFiltering = true`).
     * Set to `true` to apply Quick Filter before pivoting (/aggregating) instead.
     * @default false
     */
    @Input({ transform: booleanAttribute }) public applyQuickFilterBeforePivotOrAgg: boolean | undefined = undefined;
    /** Set to `true` to override the default tree data filtering behaviour to instead exclude child nodes from filter results.
     * @default false
     */
    @Input({ transform: booleanAttribute }) public excludeChildrenWhenTreeDataFiltering: boolean | undefined =
        undefined;
    /** Set to true to enable the Advanced Filter.
     * @default false
     */
    @Input({ transform: booleanAttribute }) public enableAdvancedFilter: boolean | undefined = undefined;
    /** Hidden columns are excluded from the Advanced Filter by default.
     * To include hidden columns, set to `true`.
     * @default false
     */
    @Input({ transform: booleanAttribute }) public includeHiddenColumnsInAdvancedFilter: boolean | undefined =
        undefined;
    /** DOM element to use as the parent for the Advanced Filter to allow it to appear outside of the grid.
     * Set to `null` or `undefined` to appear inside the grid.
     */
    @Input() public advancedFilterParent: HTMLElement | null | undefined = undefined;
    /** Customise the parameters passed to the Advanced Filter Builder.
     */
    @Input() public advancedFilterBuilderParams: IAdvancedFilterBuilderParams | undefined = undefined;
    /** By default, Advanced Filter sanitises user input and passes it to `new Function()` to provide the best performance.
     * Set to `true` to prevent this and use defined functions instead.
     * This will result in slower filtering, but it enables Advanced Filter to work when `unsafe-eval` is disabled.
     * @default false
     */
    @Input({ transform: booleanAttribute }) public suppressAdvancedFilterEval: boolean | undefined = undefined;
    /** When using AG Grid Enterprise, the Set Filter is used by default when `filter: true` is set on column definitions.
     * Set to `true` to prevent this and instead use the Text Filter, Number Filter or Date Filter based on the cell data type,
     * the same as when using AG Grid Community.
     * @default false
     * @initial
     */
    @Input({ transform: booleanAttribute }) public suppressSetFilterByDefault: boolean | undefined = undefined;
    /** Set to `true` to Enable Charts.
     * @default false
     */
    @Input({ transform: booleanAttribute }) public enableCharts: boolean | undefined = undefined;
    /** The list of chart themes that a user can choose from in the chart panel.
     * @default ['ag-default', 'ag-material', 'ag-sheets', 'ag-polychroma', 'ag-vivid'];
     * @initial
     */
    @Input() public chartThemes: string[] | undefined = undefined;
    /** A map containing custom chart themes.
     * @initial
     */
    @Input() public customChartThemes: { [name: string]: AgChartTheme } | undefined = undefined;
    /** Chart theme overrides applied to all themes.
     * @initial
     */
    @Input() public chartThemeOverrides: AgChartThemeOverrides | undefined = undefined;
    /** Allows customisation of the Chart Tool Panels, such as changing the tool panels visibility and order, as well as choosing which charts should be displayed in the chart panel.
     * @initial
     */
    @Input() public chartToolPanelsDef: ChartToolPanelsDef | undefined = undefined;
    /** Get chart menu items. Only applies when using AG Charts Enterprise.
     */
    @Input() public chartMenuItems: (string | MenuItemDef)[] | GetChartMenuItems<TData> | undefined = undefined;
    /** Provide your own loading cell renderer to use when data is loading via a DataSource.
     * See [Loading Cell Renderer](https://www.ag-grid.com/javascript-data-grid/component-loading-cell-renderer/) for framework specific implementation details.
     */
    @Input() public loadingCellRenderer: any = undefined;
    /** Params to be passed to the `loadingCellRenderer` component.
     */
    @Input() public loadingCellRendererParams: any = undefined;
    /** Callback to select which loading cell renderer to be used when data is loading via a DataSource.
     * @initial
     */
    @Input() public loadingCellRendererSelector: LoadingCellRendererSelectorFunc<TData> | undefined = undefined;
    /** A map of key->value pairs for localising text within the grid.
     * @initial
     */
    @Input() public localeText: { [key: string]: string } | undefined = undefined;
    /** Set to `true` to enable Master Detail.
     * @default false
     */
    @Input({ transform: booleanAttribute }) public masterDetail: boolean | undefined = undefined;
    /** Set to `true` to keep detail rows for when they are displayed again.
     * @default false
     * @initial
     */
    @Input({ transform: booleanAttribute }) public keepDetailRows: boolean | undefined = undefined;
    /** Sets the number of details rows to keep.
     * @default 10
     * @initial
     */
    @Input() public keepDetailRowsCount: number | undefined = undefined;
    /** Provide a custom `detailCellRenderer` to use when a master row is expanded.
     * See [Detail Cell Renderer](https://www.ag-grid.com/javascript-data-grid/master-detail-custom-detail/) for framework specific implementation details.
     */
    @Input() public detailCellRenderer: any = undefined;
    /** Specifies the params to be used by the Detail Cell Renderer. Can also be a function that provides the params to enable dynamic definitions of the params.
     */
    @Input() public detailCellRendererParams: any = undefined;
    /** Set fixed height in pixels for each detail row.
     * @initial
     */
    @Input() public detailRowHeight: number | undefined = undefined;
    /** Set to `true` to have the detail grid dynamically change it's height to fit it's rows.
     * @initial
     */
    @Input({ transform: booleanAttribute }) public detailRowAutoHeight: boolean | undefined = undefined;
    /** Provides a context object that is provided to different callbacks the grid uses. Used for passing additional information to the callbacks used by your application.
     * @initial
     */
    @Input() public context: any = undefined;
    /** Provide a custom drag and drop image component.
     * @initial
     */
    @Input() public dragAndDropImageComponent: any = undefined;
    /** Customise the parameters provided to the Drag and Drop Image Component.
     */
    @Input() public dragAndDropImageComponentParams: any = undefined;
    /**
     * A list of grids to treat as Aligned Grids.
     * Provide a list if the grids / apis already exist or return via a callback to allow the aligned grids to be retrieved asynchronously.
     * If grids are aligned then the columns and horizontal scrolling will be kept in sync.
     */
    @Input() public alignedGrids: (AlignedGrid[] | (() => AlignedGrid[])) | undefined = undefined;
    /** Change this value to set the tabIndex order of the Grid within your application.
     * @default 0
     * @initial
     */
    @Input() public tabIndex: number | undefined = undefined;
    /** The number of rows rendered outside the viewable area the grid renders.
     * Having a buffer means the grid will have rows ready to show as the user slowly scrolls vertically.
     * @default 10
     */
    @Input() public rowBuffer: number | undefined = undefined;
    /** Set to `true` to turn on the value cache.
     * @default false
     * @initial
     */
    @Input({ transform: booleanAttribute }) public valueCache: boolean | undefined = undefined;
    /** Set to `true` to configure the value cache to not expire after data updates.
     * @default false
     * @initial
     */
    @Input({ transform: booleanAttribute }) public valueCacheNeverExpires: boolean | undefined = undefined;
    /** Set to `true` to allow cell expressions.
     * @default false
     * @initial
     */
    @Input({ transform: booleanAttribute }) public enableCellExpressions: boolean | undefined = undefined;
    /** Disables touch support (but does not remove the browser's efforts to simulate mouse events on touch).
     * @default false
     * @initial
     */
    @Input({ transform: booleanAttribute }) public suppressTouch: boolean | undefined = undefined;
    /** Set to `true` to not set focus back on the grid after a refresh. This can avoid issues where you want to keep the focus on another part of the browser.
     * @default false
     */
    @Input({ transform: booleanAttribute }) public suppressFocusAfterRefresh: boolean | undefined = undefined;
    /** @deprecated As of v32.2 the grid always uses the browser's ResizeObserver, this grid option has no effect
     * @default false
     * @initial
     */
    @Input({ transform: booleanAttribute }) public suppressBrowserResizeObserver: boolean | undefined = undefined;
    /** Disables showing a warning message in the console if using a `gridOptions` or `colDef` property that doesn't exist.
     * @default false
     * @initial
     */
    @Input({ transform: booleanAttribute }) public suppressPropertyNamesCheck: boolean | undefined = undefined;
    /** Disables change detection.
     * @default false
     */
    @Input({ transform: booleanAttribute }) public suppressChangeDetection: boolean | undefined = undefined;
    /** Set this to `true` to enable debug information from the grid and related components. Will result in additional logging being output, but very useful when investigating problems.
     * @default false
     * @initial
     */
    @Input({ transform: booleanAttribute }) public debug: boolean | undefined = undefined;
    /** Show or hide the loading overlay.
     */
    @Input({ transform: booleanAttribute }) public loading: boolean | undefined = undefined;
    /** Provide a HTML string to override the default loading overlay. Supports non-empty plain text or HTML with a single root element.
     */
    @Input() public overlayLoadingTemplate: string | undefined = undefined;
    /** Provide a custom loading overlay component.
     * @initial
     */
    @Input() public loadingOverlayComponent: any = undefined;
    /** Customise the parameters provided to the loading overlay component.
     */
    @Input() public loadingOverlayComponentParams: any = undefined;
    /** Disables the 'loading' overlay.
     * @deprecated v32 - Deprecated. Use `loading=false` instead.
     * @default false
     * @initial
     */
    @Input({ transform: booleanAttribute }) public suppressLoadingOverlay: boolean | undefined = undefined;
    /** Provide a HTML string to override the default no-rows overlay. Supports non-empty plain text or HTML with a single root element.
     */
    @Input() public overlayNoRowsTemplate: string | undefined = undefined;
    /** Provide a custom no-rows overlay component.
     * @initial
     */
    @Input() public noRowsOverlayComponent: any = undefined;
    /** Customise the parameters provided to the no-rows overlay component.
     */
    @Input() public noRowsOverlayComponentParams: any = undefined;
    /** Set to `true` to prevent the no-rows overlay being shown when there is no row data.
     * @default false
     * @initial
     */
    @Input({ transform: booleanAttribute }) public suppressNoRowsOverlay: boolean | undefined = undefined;
    /** Set whether pagination is enabled.
     * @default false
     */
    @Input({ transform: booleanAttribute }) public pagination: boolean | undefined = undefined;
    /** How many rows to load per page. If `paginationAutoPageSize` is specified, this property is ignored.
     * @default 100
     */
    @Input() public paginationPageSize: number | undefined = undefined;
    /** Determines if the page size selector is shown in the pagination panel or not.
     * Set to an array of values to show the page size selector with custom list of possible page sizes.
     * Set to `true` to show the page size selector with the default page sizes `[20, 50, 100]`.
     * Set to `false` to hide the page size selector.
     * @default true
     * @initial
     */
    @Input() public paginationPageSizeSelector: number[] | boolean | undefined = undefined;
    /** Set to `true` so that the number of rows to load per page is automatically adjusted by the grid so each page shows enough rows to just fill the area designated for the grid. If `false`, `paginationPageSize` is used.
     * @default false
     */
    @Input({ transform: booleanAttribute }) public paginationAutoPageSize: boolean | undefined = undefined;
    /** Set to `true` to have pages split children of groups when using Row Grouping or detail rows with Master Detail.
     * @default false
     * @initial
     */
    @Input({ transform: booleanAttribute }) public paginateChildRows: boolean | undefined = undefined;
    /** If `true`, the default grid controls for navigation are hidden.
     * This is useful if `pagination=true` and you want to provide your own pagination controls.
     * Otherwise, when `pagination=true` the grid automatically shows the necessary controls at the bottom so that the user can navigate through the different pages.
     * @default false
     */
    @Input({ transform: booleanAttribute }) public suppressPaginationPanel: boolean | undefined = undefined;
    /** Set to `true` to enable pivot mode.
     * @default false
     */
    @Input({ transform: booleanAttribute }) public pivotMode: boolean | undefined = undefined;
    /** When to show the 'pivot panel' (where you drag rows to pivot) at the top. Note that the pivot panel will never show if `pivotMode` is off.
     * @default 'never'
     * @initial
     */
    @Input() public pivotPanelShow: 'always' | 'onlyWhenPivoting' | 'never' | undefined = undefined;
    /** The maximum number of generated columns before the grid halts execution. Upon reaching this number, the grid halts generation of columns
     * and triggers a `pivotMaxColumnsExceeded` event. `-1` for no limit.
     * @default -1
     */
    @Input() public pivotMaxGeneratedColumns: number | undefined = undefined;
    /** If pivoting, set to the number of column group levels to expand by default, e.g. `0` for none, `1` for first level only, etc. Set to `-1` to expand everything.
     * @default 0
     */
    @Input() public pivotDefaultExpanded: number | undefined = undefined;
    /** When set and the grid is in pivot mode, automatically calculated totals will appear within the Pivot Column Groups, in the position specified.
     */
    @Input() public pivotColumnGroupTotals: 'before' | 'after' | undefined = undefined;
    /** When set and the grid is in pivot mode, automatically calculated totals will appear for each value column in the position specified.
     */
    @Input() public pivotRowTotals: 'before' | 'after' | undefined = undefined;
    /** If `true`, the grid will not swap in the grouping column when pivoting. Useful if pivoting using Server Side Row Model or Viewport Row Model and you want full control of all columns including the group column.
     * @default false
     * @initial
     */
    @Input({ transform: booleanAttribute }) public pivotSuppressAutoColumn: boolean | undefined = undefined;
    /** When enabled, pivot column groups will appear 'fixed', without the ability to expand and collapse the column groups.
     * @default false
     * @initial
     */
    @Input({ transform: booleanAttribute }) public suppressExpandablePivotGroups: boolean | undefined = undefined;
    /** If `true`, then row group, pivot and value aggregation will be read-only from the GUI. The grid will display what values are used for each, but will not allow the user to change the selection.
     * @default false
     */
    @Input({ transform: booleanAttribute }) public functionsReadOnly: boolean | undefined = undefined;
    /** A map of 'function name' to 'function' for custom aggregation functions.
     * @initial
     */
    @Input() public aggFuncs: { [key: string]: IAggFunc<TData> } | undefined = undefined;
    /** When `true`, column headers won't include the `aggFunc` name, e.g. `'sum(Bank Balance)`' will just be `'Bank Balance'`.
     * @default false
     */
    @Input({ transform: booleanAttribute }) public suppressAggFuncInHeader: boolean | undefined = undefined;
    /** When using aggregations, the grid will always calculate the root level aggregation value.
     * @default false
     */
    @Input({ transform: booleanAttribute }) public alwaysAggregateAtRootLevel: boolean | undefined = undefined;
    /** When using change detection, only the updated column will be re-aggregated.
     * @default false
     */
    @Input({ transform: booleanAttribute }) public aggregateOnlyChangedColumns: boolean | undefined = undefined;
    /** Set to `true` so that aggregations are not impacted by filtering.
     * @default false
     */
    @Input({ transform: booleanAttribute }) public suppressAggFilteredOnly: boolean | undefined = undefined;
    /** Set to `true` to omit the value Column header when there is only a single value column.
     * @default false
     */
    @Input({ transform: booleanAttribute }) public removePivotHeaderRowWhenSingleValueColumn: boolean | undefined =
        undefined;
    /** Set to `false` to disable Row Animation which is enabled by default.
     * @default true
     */
    @Input({ transform: booleanAttribute }) public animateRows: boolean | undefined = undefined;
    /** Sets the duration in milliseconds of how long a cell should remain in its "flashed" state.
     * If `0`, the cell will not flash.
     * @default 500
     */
    @Input() public cellFlashDuration: number | undefined = undefined;
    /** Sets the duration in milliseconds of how long the "flashed" state animation takes to fade away after the timer set by `cellFlashDuration` has completed.
     * @default 1000
     */
    @Input() public cellFadeDuration: number | undefined = undefined;
    /** Set to `true` to have cells flash after data changes even when the change is due to filtering.
     * @default false
     * @initial
     */
    @Input({ transform: booleanAttribute }) public allowShowChangeAfterFilter: boolean | undefined = undefined;
    /** Switch between layout options: `normal`, `autoHeight`, `print`.
     * @default 'normal'
     */
    @Input() public domLayout: DomLayoutType | undefined = undefined;
    /** When `true`, the order of rows and columns in the DOM are consistent with what is on screen.
     * Disables row animations.
     * @default false
     * @initial
     */
    @Input({ transform: booleanAttribute }) public ensureDomOrder: boolean | undefined = undefined;
    /** Set to `true` to operate the grid in RTL (Right to Left) mode.
     * @default false
     * @initial
     */
    @Input({ transform: booleanAttribute }) public enableRtl: boolean | undefined = undefined;
    /** Set to `true` so that the grid doesn't virtualise the columns. For example, if you have 100 columns, but only 10 visible due to scrolling, all 100 will always be rendered.
     * @default false
     * @initial
     */
    @Input({ transform: booleanAttribute }) public suppressColumnVirtualisation: boolean | undefined = undefined;
    /** By default the grid has a limit of rendering a maximum of 500 rows at once (remember the grid only renders rows you can see, so unless your display shows more than 500 rows without vertically scrolling this will never be an issue).
     * <br />**This is only relevant if you are manually setting `rowBuffer` to a high value (rendering more rows than can be seen), or `suppressRowVirtualisation` is true, or if your grid height is able to display more than 500 rows at once.**
     * @default false
     * @initial
     */
    @Input({ transform: booleanAttribute }) public suppressMaxRenderedRowRestriction: boolean | undefined = undefined;
    /** Set to `true` so that the grid doesn't virtualise the rows. For example, if you have 100 rows, but only 10 visible due to scrolling, all 100 will always be rendered.
     * @default false
     * @initial
     */
    @Input({ transform: booleanAttribute }) public suppressRowVirtualisation: boolean | undefined = undefined;
    /** Set to `true` to enable Managed Row Dragging.
     * @default false
     */
    @Input({ transform: booleanAttribute }) public rowDragManaged: boolean | undefined = undefined;
    /** Set to `true` to suppress row dragging.
     * @default false
     */
    @Input({ transform: booleanAttribute }) public suppressRowDrag: boolean | undefined = undefined;
    /** Set to `true` to suppress moving rows while dragging the `rowDrag` waffle. This option highlights the position where the row will be placed and it will only move the row on mouse up.
     * @default false
     */
    @Input({ transform: booleanAttribute }) public suppressMoveWhenRowDragging: boolean | undefined = undefined;
    /** Set to `true` to enable clicking and dragging anywhere on the row without the need for a drag handle.
     * @default false
     */
    @Input({ transform: booleanAttribute }) public rowDragEntireRow: boolean | undefined = undefined;
    /** Set to `true` to enable dragging multiple rows at the same time.
     * @default false
     */
    @Input({ transform: booleanAttribute }) public rowDragMultiRow: boolean | undefined = undefined;
    /** A callback that should return a string to be displayed by the `rowDragComp` while dragging a row.
     * If this callback is not set, the current cell value will be used.
     * If the `rowDragText` callback is set in the ColDef it will take precedence over this, except when
     * `rowDragEntireRow=true`.
     * @initial
     */
    @Input() public rowDragText: ((params: IRowDragItem, dragItemCount: number) => string) | undefined = undefined;
    /** Provide your own cell renderer component to use for full width rows.
     * See [Full Width Rows](https://www.ag-grid.com/javascript-data-grid/full-width-rows/) for framework specific implementation details.
     */
    @Input() public fullWidthCellRenderer: any = undefined;
    /** Customise the parameters provided to the `fullWidthCellRenderer` component.
     */
    @Input() public fullWidthCellRendererParams: any = undefined;
    /** Set to `true` to have the Full Width Rows embedded in grid's main container so they can be scrolled horizontally.
     */
    @Input({ transform: booleanAttribute }) public embedFullWidthRows: boolean | undefined = undefined;
    /** Specifies how the results of row grouping should be displayed.
     *
     *  The options are:
     *
     * - `'singleColumn'`: single group column automatically added by the grid.
     * - `'multipleColumns'`: a group column per row group is added automatically.
     * - `'groupRows'`: group rows are automatically added instead of group columns.
     * - `'custom'`: informs the grid that group columns will be provided.
     */
    @Input() public groupDisplayType: RowGroupingDisplayType | undefined = undefined;
    /** If grouping, set to the number of levels to expand by default, e.g. `0` for none, `1` for first level only, etc. Set to `-1` to expand everything.
     * @default 0
     */
    @Input() public groupDefaultExpanded: number | undefined = undefined;
    /** Allows specifying the group 'auto column' if you are not happy with the default. If grouping, this column definition is included as the first column in the grid. If not grouping, this column is not included.
     */
    @Input() public autoGroupColumnDef: ColDef<TData> | undefined = undefined;
    /** When `true`, preserves the current group order when sorting on non-group columns.
     * @default false
     */
    @Input({ transform: booleanAttribute }) public groupMaintainOrder: boolean | undefined = undefined;
    /** When `true`, if you select a group, the children of the group will also be selected.
     * @default false
     * @deprecated v32.2 Use `rowSelection.groupSelects` instead
     */
    @Input({ transform: booleanAttribute }) public groupSelectsChildren: boolean | undefined = undefined;
    /** If grouping, locks the group settings of a number of columns, e.g. `0` for no group locking. `1` for first group column locked, `-1` for all group columns locked.
     * @default 0
     * @initial
     */
    @Input() public groupLockGroupColumns: number | undefined = undefined;
    /** Set to determine whether filters should be applied on aggregated group values.
     * @default false
     */
    @Input() public groupAggFiltering: boolean | IsRowFilterable<TData> | undefined = undefined;
    /** When provided, an extra row group total row will be inserted into row groups at the specified position, to display
     * when the group is expanded. This row will contain the aggregate values for the group. If a callback function is
     * provided, it can be used to selectively determine which groups will have a total row added.
     */
    @Input() public groupTotalRow: 'top' | 'bottom' | UseGroupTotalRow<TData> | undefined = undefined;
    /** When provided, an extra grand total row will be inserted into the grid at the specified position.
     * This row displays the aggregate totals of all rows in the grid.
     */
    @Input() public grandTotalRow: 'top' | 'bottom' | undefined = undefined;
    /** Suppress the sticky behaviour of the total rows, can be suppressed individually by passing `'grand'` or `'group'`.
     */
    @Input() public suppressStickyTotalRow: boolean | 'grand' | 'group' | undefined = undefined;
    /** If `true`, and showing footer, aggregate data will always be displayed at both the header and footer levels. This stops the possibly undesirable behaviour of the header details 'jumping' to the footer on expand.
     * @default false
     */
    @Input({ transform: booleanAttribute }) public groupSuppressBlankHeader: boolean | undefined = undefined;
    /** If using `groupSelectsChildren`, then only the children that pass the current filter will get selected.
     * @default false
     * @deprecated v32.2 Use `rowSelection.groupSelects` instead
     */
    @Input({ transform: booleanAttribute }) public groupSelectsFiltered: boolean | undefined = undefined;
    /** Shows the open group in the group column for non-group rows.
     * @default false
     */
    @Input({ transform: booleanAttribute }) public showOpenedGroup: boolean | undefined = undefined;
    /** Enable to display the child row in place of the group row when the group only has a single child.
     * @default false
     */
    @Input() public groupHideParentOfSingleChild: boolean | 'leafGroupsOnly' | undefined = undefined;
    /** Set to `true` to collapse groups that only have one child.
     * @default false
     * @deprecated v32.3.0 - use `groupHideParentOfSingleChild` instead.
     */
    @Input({ transform: booleanAttribute }) public groupRemoveSingleChildren: boolean | undefined = undefined;
    /** Set to `true` to collapse lowest level groups that only have one child.
     * @default false
     * @deprecated v32.3.0 - use `groupHideParentOfSingleChild: 'leafGroupsOnly'` instead.
     */
    @Input({ transform: booleanAttribute }) public groupRemoveLowestSingleChildren: boolean | undefined = undefined;
    /** Set to `true` to hide parents that are open. When used with multiple columns for showing groups, it can give a more pleasing user experience.
     * @default false
     */
    @Input({ transform: booleanAttribute }) public groupHideOpenParents: boolean | undefined = undefined;
    /** Set to `true` to prevent the grid from creating a '(Blanks)' group for nodes which do not belong to a group, and display the unbalanced nodes alongside group nodes.
     * @default false
     */
    @Input({ transform: booleanAttribute }) public groupAllowUnbalanced: boolean | undefined = undefined;
    /** When to show the 'row group panel' (where you drag rows to group) at the top.
     * @default 'never'
     */
    @Input() public rowGroupPanelShow: 'always' | 'onlyWhenGrouping' | 'never' | undefined = undefined;
    /** Provide the Cell Renderer to use when `groupDisplayType = 'groupRows'`.
     * See [Group Row Cell Renderer](https://www.ag-grid.com/javascript-data-grid/grouping-group-rows/#providing-cell-renderer) for framework specific implementation details.
     */
    @Input() public groupRowRenderer: any = undefined;
    /** Customise the parameters provided to the `groupRowRenderer` component.
     */
    @Input() public groupRowRendererParams: any = undefined;
    /** Set to `true` to enable the Grid to work with Tree Data.
     * You must also provide 'treeDataChildrenField' or implement the `getDataPath(data)` callback.
     * @default false
     */
    @Input({ transform: booleanAttribute }) public treeData: boolean | undefined = undefined;
    /** The path to the field that contains the array of children in the input row data.
     * For example if your data is like this: `[{account: {children: [childNode1, childNode2]}}]`
     * then this property should be: `account.children`.
     *
     * If left empty or undefined (default), the grid will not look for tree children.
     *
     * When this is specified, all the children nodes will be processed when the row data is loaded or updated.
     * If `treeData` is false (default) the children will be shown in a flattened list.
     * If `treeData` is true, the children will be shown in a tree structure.
     *
     * @default undefined
     */
    @Input() public treeDataChildrenField: string | undefined = undefined;
    /** Set to `true` to suppress sort indicators and actions from the row group panel.
     * @default false
     */
    @Input({ transform: booleanAttribute }) public rowGroupPanelSuppressSort: boolean | undefined = undefined;
    /** Set to `true` prevent Group Rows from sticking to the top of the grid.
     * @default false
     * @initial
     */
    @Input({ transform: booleanAttribute }) public suppressGroupRowsSticky: boolean | undefined = undefined;
    /** Data to be displayed as pinned top rows in the grid.
     */
    @Input() public pinnedTopRowData: any[] | undefined = undefined;
    /** Data to be displayed as pinned bottom rows in the grid.
     */
    @Input() public pinnedBottomRowData: any[] | undefined = undefined;
    /** Sets the row model type.
     * @default 'clientSide'
     * @initial
     */
    @Input() public rowModelType: RowModelType | undefined = undefined;
    /** Set the data to be displayed as rows in the grid.
     */
    @Input() public rowData: TData[] | null | undefined = undefined;
    /** How many milliseconds to wait before executing a batch of async transactions.
     */
    @Input() public asyncTransactionWaitMillis: number | undefined = undefined;
    /** Prevents Transactions changing sort, filter, group or pivot state when transaction only contains updates.
     * @default false
     */
    @Input({ transform: booleanAttribute }) public suppressModelUpdateAfterUpdateTransaction: boolean | undefined =
        undefined;
    /** Provide the datasource for infinite scrolling.
     */
    @Input() public datasource: IDatasource | undefined = undefined;
    /** How many extra blank rows to display to the user at the end of the dataset, which sets the vertical scroll and then allows the grid to request viewing more rows of data.
     * @default 1
     * @initial
     */
    @Input() public cacheOverflowSize: number | undefined = undefined;
    /** How many extra blank rows to display to the user at the end of the dataset, which sets the vertical scroll and then allows the grid to request viewing more rows of data.
     * @default 1
     * @initial
     */
    @Input() public infiniteInitialRowCount: number | undefined = undefined;
    /** Set how many loading rows to display to the user for the root level group.
     * @default 1
     * @initial
     */
    @Input() public serverSideInitialRowCount: number | undefined = undefined;
    /** When `true`, the Server-side Row Model will not use a full width loading renderer, instead using the colDef `loadingCellRenderer` if present.
     */
    @Input({ transform: booleanAttribute }) public suppressServerSideFullWidthLoadingRow: boolean | undefined =
        undefined;
    /** How many rows for each block in the store, i.e. how many rows returned from the server at a time.
     * @default 100
     */
    @Input() public cacheBlockSize: number | undefined = undefined;
    /** How many blocks to keep in the store. Default is no limit, so every requested block is kept. Use this if you have memory concerns, and blocks that were least recently viewed will be purged when the limit is hit. The grid will additionally make sure it has all the blocks needed to display what is currently visible, in case this property is set to a low value.
     * @initial
     */
    @Input() public maxBlocksInCache: number | undefined = undefined;
    /** How many requests to hit the server with concurrently. If the max is reached, requests are queued.
     * Set to `-1` for no maximum restriction on requests.
     * @default 2
     * @initial
     */
    @Input() public maxConcurrentDatasourceRequests: number | undefined = undefined;
    /** How many milliseconds to wait before loading a block. Useful when scrolling over many blocks, as it prevents blocks loading until scrolling has settled.
     * @initial
     */
    @Input() public blockLoadDebounceMillis: number | undefined = undefined;
    /** When enabled, closing group rows will remove children of that row. Next time the row is opened, child rows will be read from the datasource again. This property only applies when there is Row Grouping or Tree Data.
     * @default false
     */
    @Input({ transform: booleanAttribute }) public purgeClosedRowNodes: boolean | undefined = undefined;
    /** Provide the `serverSideDatasource` for server side row model.
     */
    @Input() public serverSideDatasource: IServerSideDatasource | undefined = undefined;
    /** When enabled, always refreshes top level groups regardless of which column was sorted. This property only applies when there is Row Grouping & sorting is handled on the server.
     * @default false
     */
    @Input({ transform: booleanAttribute }) public serverSideSortAllLevels: boolean | undefined = undefined;
    /** When enabled, sorts fully loaded groups in the browser instead of requesting from the server.
     * @default false
     */
    @Input({ transform: booleanAttribute }) public serverSideEnableClientSideSort: boolean | undefined = undefined;
    /** When enabled, only refresh groups directly impacted by a filter. This property only applies when there is Row Grouping & filtering is handled on the server.
     * @default false
     * @initial
     */
    @Input({ transform: booleanAttribute }) public serverSideOnlyRefreshFilteredGroups: boolean | undefined = undefined;
    /** Used to split pivot field strings for generating pivot result columns when `pivotResultFields` is provided as part of a `getRows` success.
     * @default '_'
     * @initial
     */
    @Input() public serverSidePivotResultFieldSeparator: string | undefined = undefined;
    /** To use the viewport row model you need to provide the grid with a `viewportDatasource`.
     */
    @Input() public viewportDatasource: IViewportDatasource | undefined = undefined;
    /** When using viewport row model, sets the page size for the viewport.
     * @initial
     */
    @Input() public viewportRowModelPageSize: number | undefined = undefined;
    /** When using viewport row model, sets the buffer size for the viewport.
     * @initial
     */
    @Input() public viewportRowModelBufferSize: number | undefined = undefined;
    /** Set to `true` to always show the horizontal scrollbar.
     * @default false
     */
    @Input({ transform: booleanAttribute }) public alwaysShowHorizontalScroll: boolean | undefined = undefined;
    /** Set to `true` to always show the vertical scrollbar.
     * @default false
     */
    @Input({ transform: booleanAttribute }) public alwaysShowVerticalScroll: boolean | undefined = undefined;
    /** Set to `true` to debounce the vertical scrollbar. Can provide smoother scrolling on slow machines.
     * @default false
     * @initial
     */
    @Input({ transform: booleanAttribute }) public debounceVerticalScrollbar: boolean | undefined = undefined;
    /** Set to `true` to never show the horizontal scroll. This is useful if the grid is aligned with another grid and will scroll when the other grid scrolls. (Should not be used in combination with `alwaysShowHorizontalScroll`.)
     * @default false
     */
    @Input({ transform: booleanAttribute }) public suppressHorizontalScroll: boolean | undefined = undefined;
    /** When `true`, the grid will not scroll to the top when new row data is provided. Use this if you don't want the default behaviour of scrolling to the top every time you load new data.
     * @default false
     */
    @Input({ transform: booleanAttribute }) public suppressScrollOnNewData: boolean | undefined = undefined;
    /** When `true`, the grid will not allow mousewheel / touchpad scroll when popup elements are present.
     * @default false
     */
    @Input({ transform: booleanAttribute }) public suppressScrollWhenPopupsAreOpen: boolean | undefined = undefined;
    /** When `true`, the grid will not use animation frames when drawing rows while scrolling. Use this if the grid is working fast enough that you don't need animation frames and you don't want the grid to flicker.
     * @default false
     * @initial
     */
    @Input({ transform: booleanAttribute }) public suppressAnimationFrame: boolean | undefined = undefined;
    /** If `true`, middle clicks will result in `click` events for cells and rows. Otherwise the browser will use middle click to scroll the grid.<br />**Note:** Not all browsers fire `click` events with the middle button. Most will fire only `mousedown` and `mouseup` events, which can be used to focus a cell, but will not work to call the `onCellClicked` function.
     * @default false
     */
    @Input({ transform: booleanAttribute }) public suppressMiddleClickScrolls: boolean | undefined = undefined;
    /** If `true`, mouse wheel events will be passed to the browser. Useful if your grid has no vertical scrolls and you want the mouse to scroll the browser page.
     * @default false
     * @initial
     */
    @Input({ transform: booleanAttribute }) public suppressPreventDefaultOnMouseWheel: boolean | undefined = undefined;
    /** Tell the grid how wide in pixels the scrollbar is, which is used in grid width calculations. Set only if using non-standard browser-provided scrollbars, so the grid can use the non-standard size in its calculations.
     * @initial
     */
    @Input() public scrollbarWidth: number | undefined = undefined;
    /** Use the `RowSelectionOptions` object to configure row selection. The string values `'single'` and `'multiple'` are deprecated.
     */
    @Input() public rowSelection: RowSelectionOptions<TData> | 'single' | 'multiple' | undefined = undefined;
    /** Configure cell selection
     */
    @Input() public cellSelection: boolean | CellSelectionOptions<TData> | undefined = undefined;
    /** Set to `true` to allow multiple rows to be selected using single click.
     * @default false
     * @deprecated v32.2 Use `rowSelection.enableSelectionWithoutKeys` instead
     */
    @Input({ transform: booleanAttribute }) public rowMultiSelectWithClick: boolean | undefined = undefined;
    /** If `true`, rows will not be deselected if you hold down `Ctrl` and click the row or press `Space`.
     * @default false
     * @deprecated v32.2 Use `rowSelection.enableClickSelection` instead
     */
    @Input({ transform: booleanAttribute }) public suppressRowDeselection: boolean | undefined = undefined;
    /** If `true`, row selection won't happen when rows are clicked. Use when you only want checkbox selection.
     * @default false
     * @deprecated v32.2 Use `rowSelection.enableClickSelection` instead
     */
    @Input({ transform: booleanAttribute }) public suppressRowClickSelection: boolean | undefined = undefined;
    /** If `true`, cells won't be focusable. This means keyboard navigation will be disabled for grid cells, but remain enabled in other elements of the grid such as column headers, floating filters, tool panels.
     * @default false
     */
    @Input({ transform: booleanAttribute }) public suppressCellFocus: boolean | undefined = undefined;
    /** If `true`, header cells won't be focusable. This means keyboard navigation will be disabled for grid header cells, but remain enabled in other elements of the grid such as grid cells and tool panels.
     * @default false
     */
    @Input({ transform: booleanAttribute }) public suppressHeaderFocus: boolean | undefined = undefined;
    /** Configure the selection column, used for displaying checkboxes.
     *
     * Note that due to the nature of this column, this type is a subset of `ColDef`, which does not support several normal column features such as editing, pivoting and grouping.
     */
    @Input() public selectionColumnDef: SelectionColumnDef | undefined = undefined;
    /** If `true`, only a single range can be selected.
     * @default false
     * @deprecated v32.2 Use `cellSelection.suppressMultiRanges` instead
     */
    @Input({ transform: booleanAttribute }) public suppressMultiRangeSelection: boolean | undefined = undefined;
    /** Set to `true` to be able to select the text within cells.
     *
     *     **Note:** When this is set to `true`, the clipboard service is disabled and only selected text is copied.
     * @default false
     */
    @Input({ transform: booleanAttribute }) public enableCellTextSelection: boolean | undefined = undefined;
    /** Set to `true` to enable Range Selection.
     * @default false
     * @deprecated v32.2 Use `cellSelection = true` instead
     */
    @Input({ transform: booleanAttribute }) public enableRangeSelection: boolean | undefined = undefined;
    /** Set to `true` to enable the Range Handle.
     * @default false
     * @deprecated v32.2 Use `cellSelection.handle` instead
     */
    @Input({ transform: booleanAttribute }) public enableRangeHandle: boolean | undefined = undefined;
    /** Set to `true` to enable the Fill Handle.
     * @default false
     * @deprecated v32.2 Use `cellSelection.handle` instead
     */
    @Input({ transform: booleanAttribute }) public enableFillHandle: boolean | undefined = undefined;
    /** Set to `'x'` to force the fill handle direction to horizontal, or set to `'y'` to force the fill handle direction to vertical.
     * @default 'xy'
     * @deprecated v32.2 Use `cellSelection.handle.direction` instead
     */
    @Input() public fillHandleDirection: 'x' | 'y' | 'xy' | undefined = undefined;
    /** Set this to `true` to prevent cell values from being cleared when the Range Selection is reduced by the Fill Handle.
     * @default false
     * @deprecated v32.2 Use `cellSelection.suppressClearOnFillReduction` instead
     */
    @Input({ transform: booleanAttribute }) public suppressClearOnFillReduction: boolean | undefined = undefined;
    /** Array defining the order in which sorting occurs (if sorting is enabled). Values can be `'asc'`, `'desc'` or `null`. For example: `sortingOrder: ['asc', 'desc']`.
     * @default [null, 'asc', 'desc']
     */
    @Input() public sortingOrder: SortDirection[] | undefined = undefined;
    /** Set to `true` to specify that the sort should take accented characters into account. If this feature is turned on the sort will be slower.
     * @default false
     */
    @Input({ transform: booleanAttribute }) public accentedSort: boolean | undefined = undefined;
    /** Set to `true` to show the 'no sort' icon.
     * @default false
     */
    @Input({ transform: booleanAttribute }) public unSortIcon: boolean | undefined = undefined;
    /** Set to `true` to suppress multi-sort when the user shift-clicks a column header.
     * @default false
     */
    @Input({ transform: booleanAttribute }) public suppressMultiSort: boolean | undefined = undefined;
    /** Set to `true` to always multi-sort when the user clicks a column header, regardless of key presses.
     * @default false
     */
    @Input({ transform: booleanAttribute }) public alwaysMultiSort: boolean | undefined = undefined;
    /** Set to `'ctrl'` to have multi sorting by clicking work using the `Ctrl` (or `Command ⌘` for Mac) key.
     */
    @Input() public multiSortKey: 'ctrl' | undefined = undefined;
    /** Set to `true` to suppress sorting of un-sorted data to match original row data.
     * @default false
     */
    @Input({ transform: booleanAttribute }) public suppressMaintainUnsortedOrder: boolean | undefined = undefined;
    /** Icons to use inside the grid instead of the grid's default icons.
     * @initial
     */
    @Input() public icons: { [key: string]: ((...args: any[]) => any) | string } | undefined = undefined;
    /** Default row height in pixels.
     * @default 25
     */
    @Input() public rowHeight: number | undefined = undefined;
    /** The style properties to apply to all rows. Set to an object of key (style names) and values (style values).
     */
    @Input() public rowStyle: RowStyle | undefined = undefined;
    /** CSS class(es) for all rows. Provide either a string (class name) or array of strings (array of class names).
     */
    @Input() public rowClass: string | string[] | undefined = undefined;
    /** Rules which can be applied to include certain CSS classes.
     */
    @Input() public rowClassRules: RowClassRules<TData> | undefined = undefined;
    /** Set to `true` to not highlight rows by adding the `ag-row-hover` CSS class.
     * @default false
     */
    @Input({ transform: booleanAttribute }) public suppressRowHoverHighlight: boolean | undefined = undefined;
    /** Uses CSS `top` instead of CSS `transform` for positioning rows. Useful if the transform function is causing issues such as used in row spanning.
     * @default false
     * @initial
     */
    @Input({ transform: booleanAttribute }) public suppressRowTransform: boolean | undefined = undefined;
    /** Set to `true` to highlight columns by adding the `ag-column-hover` CSS class.
     * @default false
     */
    @Input({ transform: booleanAttribute }) public columnHoverHighlight: boolean | undefined = undefined;
    /** Provide a custom `gridId` for this instance of the grid. Value will be set on the root DOM node using the attribute `grid-id` as well as being accessible via the `gridApi.getGridId()` method.
     * @initial
     */
    @Input() public gridId: string | undefined = undefined;
    /** When enabled, sorts only the rows added/updated by a transaction.
     * @default false
     */
    @Input({ transform: booleanAttribute }) public deltaSort: boolean | undefined = undefined;
    /**/
    @Input() public treeDataDisplayType: TreeDataDisplayType | undefined = undefined;
    /** @initial
     */
    @Input({ transform: booleanAttribute }) public enableGroupEdit: boolean | undefined = undefined;
    /** Initial state for the grid. Only read once on initialization. Can be used in conjunction with `api.getState()` to save and restore grid state.
     * @initial
     */
    @Input() public initialState: GridState | undefined = undefined;
    /** Theme to apply to the grid. In no value is provided, the default theme
     * will be applied.
     *
     * In AG Grid v23 and earlier, themes were applied by setting a class name
     * on the parent element of the grid. To opt back in to this behaviour, pass
     * the string "legacy"
     */
    @Input() public theme: GridTheme | 'legacy' | undefined = undefined;
    /** Whether to load supported theme fonts from the Google Fonts server.
     *
     * - `true` -> load fonts automatically if your theme uses them
     * - `false` -> do not load fonts. You must load them from Google Fonts yourself or download
     *              them and serve them from your app, otherwise a fallback font will be used.
     */
    @Input({ transform: booleanAttribute }) public loadThemeGoogleFonts: boolean | undefined = undefined;
    /** For customising the context menu.
     */
    @Input() public getContextMenuItems: GetContextMenuItems<TData> | undefined = undefined;
    /** For customising the main 'column header' menu.
     * @initial
     */
    @Input() public getMainMenuItems: GetMainMenuItems<TData> | undefined = undefined;
    /** Allows user to process popups after they are created. Applications can use this if they want to, for example, reposition the popup.
     */
    @Input() public postProcessPopup: ((params: PostProcessPopupParams<TData>) => void) | undefined = undefined;
    /** Allows the user to process the columns being removed from the pinned section because the viewport is too small to accommodate them.
     * Returns an array of columns to be removed from the pinned areas.
     * @initial
     */
    @Input() public processUnpinnedColumns: ((params: ProcessUnpinnedColumnsParams<TData>) => Column[]) | undefined =
        undefined;
    /** Allows you to process cells for the clipboard. Handy if for example you have `Date` objects that need to have a particular format if importing into Excel.
     */
    @Input() public processCellForClipboard: ((params: ProcessCellForExportParams<TData>) => any) | undefined =
        undefined;
    /** Allows you to process header values for the clipboard.
     */
    @Input() public processHeaderForClipboard: ((params: ProcessHeaderForExportParams<TData>) => any) | undefined =
        undefined;
    /** Allows you to process group header values for the clipboard.
     */
    @Input() public processGroupHeaderForClipboard:
        | ((params: ProcessGroupHeaderForExportParams<TData>) => any)
        | undefined = undefined;
    /** Allows you to process cells from the clipboard. Handy if for example you have number fields and want to block non-numbers from getting into the grid.
     */
    @Input() public processCellFromClipboard: ((params: ProcessCellForExportParams<TData>) => any) | undefined =
        undefined;
    /** Allows you to get the data that would otherwise go to the clipboard. To be used when you want to control the 'copy to clipboard' operation yourself.
     */
    @Input() public sendToClipboard: ((params: SendToClipboardParams<TData>) => void) | undefined = undefined;
    /** Allows complete control of the paste operation, including cancelling the operation (so nothing happens) or replacing the data with other data.
     */
    @Input() public processDataFromClipboard:
        | ((params: ProcessDataFromClipboardParams<TData>) => string[][] | null)
        | undefined = undefined;
    /** Grid calls this method to know if an external filter is present.
     */
    @Input() public isExternalFilterPresent: ((params: IsExternalFilterPresentParams<TData>) => boolean) | undefined =
        undefined;
    /** Should return `true` if external filter passes, otherwise `false`.
     */
    @Input() public doesExternalFilterPass: ((node: IRowNode<TData>) => boolean) | undefined = undefined;
    /** Callback to be used to customise the chart toolbar items.
     * @initial
     */
    @Input() public getChartToolbarItems: GetChartToolbarItems | undefined = undefined;
    /** Callback to enable displaying the chart in an alternative chart container.
     * @initial
     */
    @Input() public createChartContainer: ((params: ChartRefParams<TData>) => void) | undefined = undefined;
    /** Allows overriding the element that will be focused when the grid receives focus from outside elements (tabbing into the grid).
     * @returns `True` if this function should override the grid's default behavior, `False` to allow the grid's default behavior.
     */
    @Input() public focusGridInnerElement: ((params: FocusGridInnerElementParams<TData>) => boolean) | undefined =
        undefined;
    /** Allows overriding the default behaviour for when user hits navigation (arrow) key when a header is focused. Return the next Header position to navigate to or `null` to stay on current header.
     */
    @Input() public navigateToNextHeader:
        | ((params: NavigateToNextHeaderParams<TData>) => HeaderPosition | null)
        | undefined = undefined;
    /** Allows overriding the default behaviour for when user hits `Tab` key when a header is focused.
     * Return the next header position to navigate to, `true` to stay on the current header,
     * or `false` to let the browser handle the tab behaviour.
     */
    @Input() public tabToNextHeader: ((params: TabToNextHeaderParams<TData>) => HeaderPosition | boolean) | undefined =
        undefined;
    /** Allows overriding the default behaviour for when user hits navigation (arrow) key when a cell is focused. Return the next Cell position to navigate to or `null` to stay on current cell.
     */
    @Input() public navigateToNextCell: ((params: NavigateToNextCellParams<TData>) => CellPosition | null) | undefined =
        undefined;
    /** Allows overriding the default behaviour for when user hits `Tab` key when a cell is focused.
     * Return the next cell position to navigate to, `true` to stay on the current cell,
     * or `false` to let the browser handle the tab behaviour.
     */
    @Input() public tabToNextCell: ((params: TabToNextCellParams<TData>) => CellPosition | boolean) | undefined =
        undefined;
    /** A callback for localising text within the grid.
     * @initial
     */
    @Input() public getLocaleText: ((params: GetLocaleTextParams<TData>) => string) | undefined = undefined;
    /** Allows overriding what `document` is used. Currently used by Drag and Drop (may extend to other places in the future). Use this when you want the grid to use a different `document` than the one available on the global scope. This can happen if docking out components (something which Electron supports)
     */
    @Input() public getDocument: (() => Document) | undefined = undefined;
    /** Allows user to format the numbers in the pagination panel, i.e. 'row count' and 'page number' labels. This is for pagination panel only, to format numbers inside the grid's cells (i.e. your data), then use `valueFormatter` in the column definitions.
     * @initial
     */
    @Input() public paginationNumberFormatter:
        | ((params: PaginationNumberFormatterParams<TData>) => string)
        | undefined = undefined;
    /** Callback to use when you need access to more then the current column for aggregation.
     */
    @Input() public getGroupRowAgg: ((params: GetGroupRowAggParams<TData>) => any) | undefined = undefined;
    /** (Client-side Row Model only) Allows groups to be open by default.
     */
    @Input() public isGroupOpenByDefault: ((params: IsGroupOpenByDefaultParams<TData>) => boolean) | undefined =
        undefined;
    /** Allows default sorting of groups.
     */
    @Input() public initialGroupOrderComparator:
        | ((params: InitialGroupOrderComparatorParams<TData>) => number)
        | undefined = undefined;
    /** Callback for the mutation of the generated pivot result column definitions
     */
    @Input() public processPivotResultColDef: ((colDef: ColDef<TData>) => void) | undefined = undefined;
    /** Callback for the mutation of the generated pivot result column group definitions
     */
    @Input() public processPivotResultColGroupDef: ((colGroupDef: ColGroupDef<TData>) => void) | undefined = undefined;
    /** Callback to be used when working with Tree Data when `treeData = true`.
     */
    @Input() public getDataPath: GetDataPath<TData> | undefined = undefined;
    /** Allows setting the child count for a group row.
     * @initial
     */
    @Input() public getChildCount: ((dataItem: any) => number) | undefined = undefined;
    /** Allows providing different params for different levels of grouping.
     * @initial
     */
    @Input() public getServerSideGroupLevelParams:
        | ((params: GetServerSideGroupLevelParamsParams) => ServerSideGroupLevelParams)
        | undefined = undefined;
    /** Allows groups to be open by default.
     */
    @Input() public isServerSideGroupOpenByDefault:
        | ((params: IsServerSideGroupOpenByDefaultParams) => boolean)
        | undefined = undefined;
    /** Allows cancelling transactions.
     */
    @Input() public isApplyServerSideTransaction: IsApplyServerSideTransaction | undefined = undefined;
    /** SSRM Tree Data: Allows specifying which rows are expandable.
     */
    @Input() public isServerSideGroup: IsServerSideGroup | undefined = undefined;
    /** SSRM Tree Data: Allows specifying group keys.
     */
    @Input() public getServerSideGroupKey: GetServerSideGroupKey | undefined = undefined;
    /** Return a business key for the node. If implemented, each row in the DOM will have an attribute `row-business-key='abc'` where `abc` is what you return as the business key.
     * This is useful for automated testing, as it provides a way for your tool to identify rows based on unique business keys.
     */
    @Input() public getBusinessKeyForNode: ((node: IRowNode<TData>) => string) | undefined = undefined;
    /** Provide a pure function that returns a string ID to uniquely identify a given row. This enables the grid to work optimally with data changes and updates.
     * @initial
     */
    @Input() public getRowId: GetRowIdFunc<TData> | undefined = undefined;
    /** When enabled, getRowId() callback is implemented and new Row Data is set, the grid will disregard all previous rows and treat the new Row Data as new data. As a consequence, all Row State (eg selection, rendered rows) will be reset.
     * @default false
     */
    @Input({ transform: booleanAttribute }) public resetRowDataOnUpdate: boolean | undefined = undefined;
    /** Callback fired after the row is rendered into the DOM. Should not be used to initiate side effects.
     */
    @Input() public processRowPostCreate: ((params: ProcessRowParams<TData>) => void) | undefined = undefined;
    /** Callback to be used to determine which rows are selectable. By default rows are selectable, so return `false` to make a row un-selectable.
     * @deprecated v32.2 Use `rowSelection.isRowSelectable` instead
     */
    @Input() public isRowSelectable: IsRowSelectable<TData> | undefined = undefined;
    /** Callback to be used with Master Detail to determine if a row should be a master row. If `false` is returned no detail row will exist for this row.
     */
    @Input() public isRowMaster: IsRowMaster<TData> | undefined = undefined;
    /** Callback to fill values instead of simply copying values or increasing number values using linear progression.
     * @deprecated v32.2 Use `cellSelection.handle.setFillValue` instead
     */
    @Input() public fillOperation: ((params: FillOperationParams<TData>) => any) | undefined = undefined;
    /** Callback to perform additional sorting after the grid has sorted the rows.
     */
    @Input() public postSortRows: ((params: PostSortRowsParams<TData>) => void) | undefined = undefined;
    /** Callback version of property `rowStyle` to set style for each row individually. Function should return an object of CSS values or undefined for no styles.
     */
    @Input() public getRowStyle: ((params: RowClassParams<TData>) => RowStyle | undefined) | undefined = undefined;
    /** Callback version of property `rowClass` to set class(es) for each row individually. Function should return either a string (class name), array of strings (array of class names) or undefined for no class.
     */
    @Input() public getRowClass: ((params: RowClassParams<TData>) => string | string[] | undefined) | undefined =
        undefined;
    /** Callback version of property `rowHeight` to set height for each row individually. Function should return a positive number of pixels, or return `null`/`undefined` to use the default row height.
     */
    @Input() public getRowHeight: ((params: RowHeightParams<TData>) => number | undefined | null) | undefined =
        undefined;
    /** Tells the grid if this row should be rendered as full width.
     */
    @Input() public isFullWidthRow: ((params: IsFullWidthRowParams<TData>) => boolean) | undefined = undefined;

    /** The tool panel visibility has changed. Fires twice if switching between panels - once with the old panel and once with the new panel.
     */
    @Output() public toolPanelVisibleChanged: EventEmitter<ToolPanelVisibleChangedEvent<TData>> = new EventEmitter<
        ToolPanelVisibleChangedEvent<TData>
    >();
    /** The tool panel size has been changed.
     */
    @Output() public toolPanelSizeChanged: EventEmitter<ToolPanelSizeChangedEvent<TData>> = new EventEmitter<
        ToolPanelSizeChangedEvent<TData>
    >();
    /** The column menu visibility has changed. Fires twice if switching between tabs - once with the old tab and once with the new tab.
     */
    @Output() public columnMenuVisibleChanged: EventEmitter<ColumnMenuVisibleChangedEvent<TData>> = new EventEmitter<
        ColumnMenuVisibleChangedEvent<TData>
    >();
    /** The context menu visibility has changed (opened or closed).
     */
    @Output() public contextMenuVisibleChanged: EventEmitter<ContextMenuVisibleChangedEvent<TData>> = new EventEmitter<
        ContextMenuVisibleChangedEvent<TData>
    >();
    /** Cut operation has started.
     */
    @Output() public cutStart: EventEmitter<CutStartEvent<TData>> = new EventEmitter<CutStartEvent<TData>>();
    /** Cut operation has ended.
     */
    @Output() public cutEnd: EventEmitter<CutEndEvent<TData>> = new EventEmitter<CutEndEvent<TData>>();
    /** Paste operation has started.
     */
    @Output() public pasteStart: EventEmitter<PasteStartEvent<TData>> = new EventEmitter<PasteStartEvent<TData>>();
    /** Paste operation has ended.
     */
    @Output() public pasteEnd: EventEmitter<PasteEndEvent<TData>> = new EventEmitter<PasteEndEvent<TData>>();
    /** A column, or group of columns, was hidden / shown.
     */
    @Output() public columnVisible: EventEmitter<ColumnVisibleEvent<TData>> = new EventEmitter<
        ColumnVisibleEvent<TData>
    >();
    /** A column, or group of columns, was pinned / unpinned.
     */
    @Output() public columnPinned: EventEmitter<ColumnPinnedEvent<TData>> = new EventEmitter<
        ColumnPinnedEvent<TData>
    >();
    /** A column was resized.
     */
    @Output() public columnResized: EventEmitter<ColumnResizedEvent<TData>> = new EventEmitter<
        ColumnResizedEvent<TData>
    >();
    /** A column was moved.
     */
    @Output() public columnMoved: EventEmitter<ColumnMovedEvent<TData>> = new EventEmitter<ColumnMovedEvent<TData>>();
    /** A value column was added or removed.
     */
    @Output() public columnValueChanged: EventEmitter<ColumnValueChangedEvent<TData>> = new EventEmitter<
        ColumnValueChangedEvent<TData>
    >();
    /** The pivot mode flag was changed.
     */
    @Output() public columnPivotModeChanged: EventEmitter<ColumnPivotModeChangedEvent<TData>> = new EventEmitter<
        ColumnPivotModeChangedEvent<TData>
    >();
    /** A pivot column was added, removed or order changed.
     */
    @Output() public columnPivotChanged: EventEmitter<ColumnPivotChangedEvent<TData>> = new EventEmitter<
        ColumnPivotChangedEvent<TData>
    >();
    /** A column group was opened / closed.
     */
    @Output() public columnGroupOpened: EventEmitter<ColumnGroupOpenedEvent<TData>> = new EventEmitter<
        ColumnGroupOpenedEvent<TData>
    >();
    /** User set new columns.
     */
    @Output() public newColumnsLoaded: EventEmitter<NewColumnsLoadedEvent<TData>> = new EventEmitter<
        NewColumnsLoadedEvent<TData>
    >();
    /** The list of grid columns changed.
     */
    @Output() public gridColumnsChanged: EventEmitter<GridColumnsChangedEvent<TData>> = new EventEmitter<
        GridColumnsChangedEvent<TData>
    >();
    /** The list of displayed columns changed. This can result from columns open / close, column move, pivot, group, etc.
     */
    @Output() public displayedColumnsChanged: EventEmitter<DisplayedColumnsChangedEvent<TData>> = new EventEmitter<
        DisplayedColumnsChangedEvent<TData>
    >();
    /** The list of rendered columns changed (only columns in the visible scrolled viewport are rendered by default).
     */
    @Output() public virtualColumnsChanged: EventEmitter<VirtualColumnsChangedEvent<TData>> = new EventEmitter<
        VirtualColumnsChangedEvent<TData>
    >();
    /** @deprecated v32.2 Either use `onDisplayedColumnsChanged` which is fired at the same time,
     * or use one of the more specific column events.
     */
    @Output() public columnEverythingChanged: EventEmitter<ColumnEverythingChangedEvent<TData>> = new EventEmitter<
        ColumnEverythingChangedEvent<TData>
    >();
    /** A mouse cursor is initially moved over a column header.
     */
    @Output() public columnHeaderMouseOver: EventEmitter<ColumnHeaderMouseOverEvent<TData>> = new EventEmitter<
        ColumnHeaderMouseOverEvent<TData>
    >();
    /** A mouse cursor is moved out of a column header.
     */
    @Output() public columnHeaderMouseLeave: EventEmitter<ColumnHeaderMouseLeaveEvent<TData>> = new EventEmitter<
        ColumnHeaderMouseLeaveEvent<TData>
    >();
    /** A click is performed on a column header.
     */
    @Output() public columnHeaderClicked: EventEmitter<ColumnHeaderClickedEvent<TData>> = new EventEmitter<
        ColumnHeaderClickedEvent<TData>
    >();
    /** A context menu action, such as right-click or context menu key press, is performed on a column header.
     */
    @Output() public columnHeaderContextMenu: EventEmitter<ColumnHeaderContextMenuEvent<TData>> = new EventEmitter<
        ColumnHeaderContextMenuEvent<TData>
    >();
    /** Only used by Angular, React and VueJS AG Grid components (not used if doing plain JavaScript).
     * If the grid receives changes due to bound properties, this event fires after the grid has finished processing the change.
     */
    @Output() public componentStateChanged: EventEmitter<ComponentStateChangedEvent<TData>> = new EventEmitter<
        ComponentStateChangedEvent<TData>
    >();
    /** Value has changed after editing (this event will not fire if editing was cancelled, eg ESC was pressed) or
     *  if cell value has changed as a result of cut, paste, cell clear (pressing Delete key),
     * fill handle, copy range down, undo and redo.
     */
    @Output() public cellValueChanged: EventEmitter<CellValueChangedEvent<TData>> = new EventEmitter<
        CellValueChangedEvent<TData>
    >();
    /** Value has changed after editing. Only fires when `readOnlyEdit=true`.
     */
    @Output() public cellEditRequest: EventEmitter<CellEditRequestEvent<TData>> = new EventEmitter<
        CellEditRequestEvent<TData>
    >();
    /** A cell's value within a row has changed. This event corresponds to Full Row Editing only.
     */
    @Output() public rowValueChanged: EventEmitter<RowValueChangedEvent<TData>> = new EventEmitter<
        RowValueChangedEvent<TData>
    >();
    /** Editing a cell has started.
     */
    @Output() public cellEditingStarted: EventEmitter<CellEditingStartedEvent<TData>> = new EventEmitter<
        CellEditingStartedEvent<TData>
    >();
    /** Editing a cell has stopped.
     */
    @Output() public cellEditingStopped: EventEmitter<CellEditingStoppedEvent<TData>> = new EventEmitter<
        CellEditingStoppedEvent<TData>
    >();
    /** Editing a row has started (when row editing is enabled). When row editing, this event will be fired once and `cellEditingStarted` will be fired for each individual cell. Only fires when doing Full Row Editing.
     */
    @Output() public rowEditingStarted: EventEmitter<RowEditingStartedEvent<TData>> = new EventEmitter<
        RowEditingStartedEvent<TData>
    >();
    /** Editing a row has stopped (when row editing is enabled). When row editing, this event will be fired once and `cellEditingStopped` will be fired for each individual cell. Only fires when doing Full Row Editing.
     */
    @Output() public rowEditingStopped: EventEmitter<RowEditingStoppedEvent<TData>> = new EventEmitter<
        RowEditingStoppedEvent<TData>
    >();
    /** Undo operation has started.
     */
    @Output() public undoStarted: EventEmitter<UndoStartedEvent<TData>> = new EventEmitter<UndoStartedEvent<TData>>();
    /** Undo operation has ended.
     */
    @Output() public undoEnded: EventEmitter<UndoEndedEvent<TData>> = new EventEmitter<UndoEndedEvent<TData>>();
    /** Redo operation has started.
     */
    @Output() public redoStarted: EventEmitter<RedoStartedEvent<TData>> = new EventEmitter<RedoStartedEvent<TData>>();
    /** Redo operation has ended.
     */
    @Output() public redoEnded: EventEmitter<RedoEndedEvent<TData>> = new EventEmitter<RedoEndedEvent<TData>>();
    /** Cell selection delete operation (cell clear) has started.
     */
    @Output() public cellSelectionDeleteStart: EventEmitter<CellSelectionDeleteStartEvent<TData>> = new EventEmitter<
        CellSelectionDeleteStartEvent<TData>
    >();
    /** Cell selection delete operation (cell clear) has ended.
     */
    @Output() public cellSelectionDeleteEnd: EventEmitter<CellSelectionDeleteEndEvent<TData>> = new EventEmitter<
        CellSelectionDeleteEndEvent<TData>
    >();
    /** Range delete operation (cell clear) has started.
     *
     * @deprecated v32.2 Use `onCellSelectionDeleteStart` instead
     */
    @Output() public rangeDeleteStart: EventEmitter<RangeDeleteStartEvent<TData>> = new EventEmitter<
        RangeDeleteStartEvent<TData>
    >();
    /** Range delete operation (cell clear) has ended.
     *
     * @deprecated v32.2 Use `onCellSelectionDeleteEnd` instead
     */
    @Output() public rangeDeleteEnd: EventEmitter<RangeDeleteEndEvent<TData>> = new EventEmitter<
        RangeDeleteEndEvent<TData>
    >();
    /** Fill operation has started.
     */
    @Output() public fillStart: EventEmitter<FillStartEvent<TData>> = new EventEmitter<FillStartEvent<TData>>();
    /** Fill operation has ended.
     */
    @Output() public fillEnd: EventEmitter<FillEndEvent<TData>> = new EventEmitter<FillEndEvent<TData>>();
    /** Filter has been opened.
     */
    @Output() public filterOpened: EventEmitter<FilterOpenedEvent<TData>> = new EventEmitter<
        FilterOpenedEvent<TData>
    >();
    /** Filter has been modified and applied.
     */
    @Output() public filterChanged: EventEmitter<FilterChangedEvent<TData>> = new EventEmitter<
        FilterChangedEvent<TData>
    >();
    /** Filter was modified but not applied. Used when filters have 'Apply' buttons.
     */
    @Output() public filterModified: EventEmitter<FilterModifiedEvent<TData>> = new EventEmitter<
        FilterModifiedEvent<TData>
    >();
    /** Advanced Filter Builder visibility has changed (opened or closed).
     */
    @Output() public advancedFilterBuilderVisibleChanged: EventEmitter<
        AdvancedFilterBuilderVisibleChangedEvent<TData>
    > = new EventEmitter<AdvancedFilterBuilderVisibleChangedEvent<TData>>();
    /** A chart has been created.
     */
    @Output() public chartCreated: EventEmitter<ChartCreatedEvent<TData>> = new EventEmitter<
        ChartCreatedEvent<TData>
    >();
    /** The data range for the chart has been changed.
     */
    @Output() public chartRangeSelectionChanged: EventEmitter<ChartRangeSelectionChangedEvent<TData>> =
        new EventEmitter<ChartRangeSelectionChangedEvent<TData>>();
    /** Formatting changes have been made by users through the Customize Panel.
     */
    @Output() public chartOptionsChanged: EventEmitter<ChartOptionsChangedEvent<TData>> = new EventEmitter<
        ChartOptionsChangedEvent<TData>
    >();
    /** A chart has been destroyed.
     */
    @Output() public chartDestroyed: EventEmitter<ChartDestroyedEvent<TData>> = new EventEmitter<
        ChartDestroyedEvent<TData>
    >();
    /** DOM event `keyDown` happened on a cell.
     */
    @Output() public cellKeyDown: EventEmitter<CellKeyDownEvent<TData> | FullWidthCellKeyDownEvent<TData>> =
        new EventEmitter<CellKeyDownEvent<TData> | FullWidthCellKeyDownEvent<TData>>();
    /** The grid has initialised and is ready for most api calls, but may not be fully rendered yet      */
    @Output() public gridReady: EventEmitter<GridReadyEvent<TData>> = new EventEmitter<GridReadyEvent<TData>>();
    /** Fired the first time data is rendered into the grid. Use this event if you want to auto resize columns based on their contents     */
    @Output() public firstDataRendered: EventEmitter<FirstDataRenderedEvent<TData>> = new EventEmitter<
        FirstDataRenderedEvent<TData>
    >();
    /** The size of the grid `div` has changed. In other words, the grid was resized.
     */
    @Output() public gridSizeChanged: EventEmitter<GridSizeChangedEvent<TData>> = new EventEmitter<
        GridSizeChangedEvent<TData>
    >();
    /** Displayed rows have changed. Triggered after sort, filter or tree expand / collapse events.
     */
    @Output() public modelUpdated: EventEmitter<ModelUpdatedEvent<TData>> = new EventEmitter<
        ModelUpdatedEvent<TData>
    >();
    /** A row was removed from the DOM, for any reason. Use to clean up resources (if any) used by the row.
     */
    @Output() public virtualRowRemoved: EventEmitter<VirtualRowRemovedEvent<TData>> = new EventEmitter<
        VirtualRowRemovedEvent<TData>
    >();
    /** Which rows are rendered in the DOM has changed.
     */
    @Output() public viewportChanged: EventEmitter<ViewportChangedEvent<TData>> = new EventEmitter<
        ViewportChangedEvent<TData>
    >();
    /** The body was scrolled horizontally or vertically.
     */
    @Output() public bodyScroll: EventEmitter<BodyScrollEvent<TData>> = new EventEmitter<BodyScrollEvent<TData>>();
    /** Main body of the grid has stopped scrolling, either horizontally or vertically.
     */
    @Output() public bodyScrollEnd: EventEmitter<BodyScrollEndEvent<TData>> = new EventEmitter<
        BodyScrollEndEvent<TData>
    >();
    /** When dragging starts. This could be any action that uses the grid's Drag and Drop service, e.g. Column Moving, Column Resizing, Range Selection, Fill Handle, etc.
     */
    @Output() public dragStarted: EventEmitter<DragStartedEvent<TData>> = new EventEmitter<DragStartedEvent<TData>>();
    /** When dragging stops. This could be any action that uses the grid's Drag and Drop service, e.g. Column Moving, Column Resizing, Range Selection, Fill Handle, etc.
     */
    @Output() public dragStopped: EventEmitter<DragStoppedEvent<TData>> = new EventEmitter<DragStoppedEvent<TData>>();
    /** When dragging is cancelled stops. This is caused by pressing `Escape` while dragging elements within the grid that uses the grid's Drag and Drop service, e.g. Column Moving, Column Resizing, Range Selection, Fill Handle, etc.
     */
    @Output() public dragCancelled: EventEmitter<DragCancelledEvent<TData>> = new EventEmitter<
        DragCancelledEvent<TData>
    >();
    /** Grid state has been updated.
     */
    @Output() public stateUpdated: EventEmitter<StateUpdatedEvent<TData>> = new EventEmitter<
        StateUpdatedEvent<TData>
    >();
    /** Triggered every time the paging state changes. Some of the most common scenarios for this event to be triggered are:
     *
     *  - The page size changes.
     *  - The current shown page is changed.
     *  - New data is loaded onto the grid.
     */
    @Output() public paginationChanged: EventEmitter<PaginationChangedEvent<TData>> = new EventEmitter<
        PaginationChangedEvent<TData>
    >();
    /** A drag has started, or dragging was already started and the mouse has re-entered the grid having previously left the grid.
     */
    @Output() public rowDragEnter: EventEmitter<RowDragEnterEvent<TData>> = new EventEmitter<
        RowDragEnterEvent<TData>
    >();
    /** The mouse has moved while dragging.
     */
    @Output() public rowDragMove: EventEmitter<RowDragMoveEvent<TData>> = new EventEmitter<RowDragMoveEvent<TData>>();
    /** The mouse has left the grid while dragging.
     */
    @Output() public rowDragLeave: EventEmitter<RowDragLeaveEvent<TData>> = new EventEmitter<
        RowDragLeaveEvent<TData>
    >();
    /** The drag has finished over the grid.
     */
    @Output() public rowDragEnd: EventEmitter<RowDragEndEvent<TData>> = new EventEmitter<RowDragEndEvent<TData>>();
    /** The drag has been cancelled over the grid.
     */
    @Output() public rowDragCancel: EventEmitter<RowDragCancelEvent<TData>> = new EventEmitter<
        RowDragCancelEvent<TData>
    >();
    /** A row group column was added, removed or reordered.
     */
    @Output() public columnRowGroupChanged: EventEmitter<ColumnRowGroupChangedEvent<TData>> = new EventEmitter<
        ColumnRowGroupChangedEvent<TData>
    >();
    /** A row group was opened or closed.
     */
    @Output() public rowGroupOpened: EventEmitter<RowGroupOpenedEvent<TData>> = new EventEmitter<
        RowGroupOpenedEvent<TData>
    >();
    /** Fired when calling either of the API methods `expandAll()` or `collapseAll()`.
     */
    @Output() public expandOrCollapseAll: EventEmitter<ExpandOrCollapseAllEvent<TData>> = new EventEmitter<
        ExpandOrCollapseAllEvent<TData>
    >();
    /** Exceeded the `pivotMaxGeneratedColumns` limit when generating columns.
     */
    @Output() public pivotMaxColumnsExceeded: EventEmitter<PivotMaxColumnsExceededEvent<TData>> = new EventEmitter<
        PivotMaxColumnsExceededEvent<TData>
    >();
    /** The client has set new pinned row data into the grid.
     */
    @Output() public pinnedRowDataChanged: EventEmitter<PinnedRowDataChangedEvent<TData>> = new EventEmitter<
        PinnedRowDataChangedEvent<TData>
    >();
    /** Client-Side Row Model only. The client has updated data for the grid by either a) setting new Row Data or b) Applying a Row Transaction.
     */
    @Output() public rowDataUpdated: EventEmitter<RowDataUpdatedEvent<TData>> = new EventEmitter<
        RowDataUpdatedEvent<TData>
    >();
    /** Async transactions have been applied. Contains a list of all transaction results.
     */
    @Output() public asyncTransactionsFlushed: EventEmitter<AsyncTransactionsFlushedEvent<TData>> = new EventEmitter<
        AsyncTransactionsFlushedEvent<TData>
    >();
    /** A server side store has finished refreshing.
     */
    @Output() public storeRefreshed: EventEmitter<StoreRefreshedEvent<TData>> = new EventEmitter<
        StoreRefreshedEvent<TData>
    >();
    /** Header is focused.
     */
    @Output() public headerFocused: EventEmitter<HeaderFocusedEvent<TData>> = new EventEmitter<
        HeaderFocusedEvent<TData>
    >();
    /** Cell is clicked.
     */
    @Output() public cellClicked: EventEmitter<CellClickedEvent<TData>> = new EventEmitter<CellClickedEvent<TData>>();
    /** Cell is double clicked.
     */
    @Output() public cellDoubleClicked: EventEmitter<CellDoubleClickedEvent<TData>> = new EventEmitter<
        CellDoubleClickedEvent<TData>
    >();
    /** Cell is focused.
     */
    @Output() public cellFocused: EventEmitter<CellFocusedEvent<TData>> = new EventEmitter<CellFocusedEvent<TData>>();
    /** Mouse entered cell.
     */
    @Output() public cellMouseOver: EventEmitter<CellMouseOverEvent<TData>> = new EventEmitter<
        CellMouseOverEvent<TData>
    >();
    /** Mouse left cell.
     */
    @Output() public cellMouseOut: EventEmitter<CellMouseOutEvent<TData>> = new EventEmitter<
        CellMouseOutEvent<TData>
    >();
    /** Mouse down on cell.
     */
    @Output() public cellMouseDown: EventEmitter<CellMouseDownEvent<TData>> = new EventEmitter<
        CellMouseDownEvent<TData>
    >();
    /** Row is clicked.
     */
    @Output() public rowClicked: EventEmitter<RowClickedEvent<TData>> = new EventEmitter<RowClickedEvent<TData>>();
    /** Row is double clicked.
     */
    @Output() public rowDoubleClicked: EventEmitter<RowDoubleClickedEvent<TData>> = new EventEmitter<
        RowDoubleClickedEvent<TData>
    >();
    /** Row is selected or deselected. The event contains the node in question, so call the node's `isSelected()` method to see if it was just selected or deselected.
     */
    @Output() public rowSelected: EventEmitter<RowSelectedEvent<TData>> = new EventEmitter<RowSelectedEvent<TData>>();
    /** Row selection is changed. Use the grid API `getSelectedNodes()` or `getSelectedRows()` to get the new list of selected nodes / row data.
     */
    @Output() public selectionChanged: EventEmitter<SelectionChangedEvent<TData>> = new EventEmitter<
        SelectionChangedEvent<TData>
    >();
    /** Cell is right clicked.
     */
    @Output() public cellContextMenu: EventEmitter<CellContextMenuEvent<TData>> = new EventEmitter<
        CellContextMenuEvent<TData>
    >();
    /** A change to range selection has occurred.
     *
     * @deprecated v32.2 Use `onCellSelectionChanged` instead
     */
    @Output() public rangeSelectionChanged: EventEmitter<RangeSelectionChangedEvent<TData>> = new EventEmitter<
        RangeSelectionChangedEvent<TData>
    >();
    /** A change to cell selection has occurred.
     */
    @Output() public cellSelectionChanged: EventEmitter<CellSelectionChangedEvent<TData>> = new EventEmitter<
        CellSelectionChangedEvent<TData>
    >();
    /** A tooltip has been displayed     */
    @Output() public tooltipShow: EventEmitter<TooltipShowEvent<TData>> = new EventEmitter<TooltipShowEvent<TData>>();
    /** A tooltip was hidden     */
    @Output() public tooltipHide: EventEmitter<TooltipHideEvent<TData>> = new EventEmitter<TooltipHideEvent<TData>>();
    /** Sort has changed. The grid also listens for this and updates the model.
     */
    @Output() public sortChanged: EventEmitter<SortChangedEvent<TData>> = new EventEmitter<SortChangedEvent<TData>>();

    // @END@
}
