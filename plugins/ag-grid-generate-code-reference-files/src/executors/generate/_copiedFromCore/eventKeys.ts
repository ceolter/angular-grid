// @ts-nocheck
// events that are available for use by users of AG Grid and so should be documented
/** EVENTS that should be exposed via code generation for the framework components.  */
export const PUBLIC_EVENTS = [
    'columnEverythingChanged',
    'newColumnsLoaded',
    'columnPivotModeChanged',
    'pivotMaxColumnsExceeded',
    'columnRowGroupChanged',
    'expandOrCollapseAll',
    'columnPivotChanged',
    'gridColumnsChanged',
    'columnValueChanged',
    'columnMoved',
    'columnVisible',
    'columnPinned',
    'columnGroupOpened',
    'columnResized',
    'displayedColumnsChanged',
    'virtualColumnsChanged',
    'columnHeaderMouseOver',
    'columnHeaderMouseLeave',
    'columnHeaderClicked',
    'columnHeaderContextMenu',
    'asyncTransactionsFlushed',
    'rowGroupOpened',
    'rowDataUpdated',
    'pinnedRowDataChanged',
    'rangeSelectionChanged',
    'chartCreated',
    'chartRangeSelectionChanged',
    'chartOptionsChanged',
    'chartDestroyed',
    'toolPanelVisibleChanged',
    'toolPanelSizeChanged',
    'modelUpdated',
    'cutStart',
    'cutEnd',
    'pasteStart',
    'pasteEnd',
    'fillStart',
    'fillEnd',
    'rangeDeleteStart',
    'rangeDeleteEnd',
    'undoStarted',
    'undoEnded',
    'redoStarted',
    'redoEnded',
    'cellClicked',
    'cellDoubleClicked',
    'cellMouseDown',
    'cellContextMenu',
    'cellValueChanged',
    'cellEditRequest',
    'rowValueChanged',
    'cellFocused',
    'rowSelected',
    'selectionChanged',
    'tooltipShow',
    'tooltipHide',
    'cellKeyDown',
    'cellMouseOver',
    'cellMouseOut',
    'filterChanged',
    'filterModified',
    'filterOpened',
    'advancedFilterBuilderVisibleChanged',
    'sortChanged',
    'virtualRowRemoved',
    'rowClicked',
    'rowDoubleClicked',
    'gridReady',
    'gridPreDestroyed',
    'gridSizeChanged',
    'viewportChanged',
    'firstDataRendered',
    'dragStarted',
    'dragStopped',
    'rowEditingStarted',
    'rowEditingStopped',
    'cellEditingStarted',
    'cellEditingStopped',
    'bodyScroll',
    'bodyScrollEnd',
    'paginationChanged',
    'componentStateChanged',
    'storeRefreshed',
    'stateUpdated',
    'columnMenuVisibleChanged',
    'contextMenuVisibleChanged',
    'rowDragEnter',
    'rowDragMove',
    'rowDragLeave',
    'rowDragEnd',
] as const;

// events that are internal to AG Grid and should not be exposed to users via documentation or generated framework components
// These events are still available to users via the API, but are not intended for general use
/** Exclude the following internal events from code generation to prevent exposing these events via framework components */
export const INTERNAL_EVENTS = [
    'scrollbarWidthChanged',
    'keyShortcutChangedCellStart',
    'keyShortcutChangedCellEnd',
    'pinnedHeightChanged',
    'cellFocusCleared',
    'fullWidthRowFocused',
    'checkboxChanged',
    'heightScaleChanged',
    'suppressMovableColumns',
    'suppressMenuHide',
    'suppressFieldDotNotation',
    'columnPanelItemDragStart',
    'columnPanelItemDragEnd',
    'bodyHeightChanged',
    'columnContainerWidthChanged',
    'displayedColumnsWidthChanged',
    'scrollVisibilityChanged',
    'columnHoverChanged',
    'flashCells',
    'paginationPixelOffsetChanged',
    'displayedRowsChanged',
    'leftPinnedWidthChanged',
    'rightPinnedWidthChanged',
    'rowContainerHeightChanged',
    'headerHeightChanged',
    'columnHeaderHeightChanged',
    'gridStylesChanged',
    'storeUpdated',
    'filterDestroyed',
    'rowDataUpdateStarted',
    'rowCountReady',
    'advancedFilterEnabledChanged',
    'dataTypesInferred',
    'fieldValueChanged',
    'fieldPickerValueSelected',
    'richSelectListRowSelected',
    'sideBarUpdated',
    'alignedGridScroll',
    'alignedGridColumn',
    'gridOptionsChanged',
    'gridStylesChanged',
    'chartTitleEdit',
    'recalculateRowBounds',
] as const;

export const ALL_EVENTS = [...PUBLIC_EVENTS, ...INTERNAL_EVENTS] as const;

export type PublicEvents = (typeof PUBLIC_EVENTS)[number];
export type InternalEvents = (typeof INTERNAL_EVENTS)[number];
export type AgEventType = PublicEvents | InternalEvents;
