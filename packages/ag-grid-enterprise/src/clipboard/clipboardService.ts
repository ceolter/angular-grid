import type {
    AgColumn,
    BeanCollection,
    CellNavigationService,
    CellPosition,
    CellRange,
    CsvExportParams,
    FocusService,
    GridCtrl,
    GridOptions,
    IClientSideRowModel,
    IClipboardCopyParams,
    IClipboardCopyRowsParams,
    IClipboardService,
    IRangeService,
    IRowModel,
    ISelectionService,
    NamedBean,
    ProcessCellForExportParams,
    ProcessRowGroupForExportParams,
    RowNode,
    RowPosition,
    ValueService,
    VisibleColsService,
    WithoutGridCommon,
} from 'ag-grid-community';
import {
    BeanStub,
    ChangedPath,
    _createCellId,
    _exists,
    _getActiveDomElement,
    _getDocument,
    _getRowNode,
    _isClientSideRowModel,
    _isSameRow,
    _last,
    _removeFromArray,
    _warn,
} from 'ag-grid-community';

interface RowCallback {
    (
        gridRow: RowPosition,
        rowNode: RowNode | undefined,
        columns: AgColumn[],
        rangeIndex: number,
        isLastRow?: boolean
    ): void;
}

interface ColumnCallback {
    (columns: AgColumn[]): void;
}

type CellsToFlashType = { [key: string]: boolean };
type DataForCellRangesType = { data: string; cellsToFlash: CellsToFlashType };

// Matches value in changeDetectionService
const SOURCE_PASTE = 'paste';
const EXPORT_TYPE_DRAG_COPY = 'dragCopy';
const EXPORT_TYPE_CLIPBOARD = 'clipboard';

enum CellClearType {
    CellRange,
    SelectedRows,
    FocusedCell,
}

// This will parse a delimited string into an array of arrays.
export function stringToArray(strData: string, delimiter = ','): string[][] {
    const data: any[][] = [];
    const isNewline = (char: string) => char === '\r' || char === '\n';

    let insideQuotedField = false;

    if (strData === '') {
        return [['']];
    }

    // iterate over each character, keep track of current row and column (of the returned array)
    for (let row = 0, column = 0, position = 0; position < strData.length; position++) {
        const previousChar = strData[position - 1];
        const currentChar = strData[position];
        const nextChar = strData[position + 1];
        const ensureDataExists = () => {
            if (!data[row]) {
                // create row if it doesn't exist
                data[row] = [];
            }

            if (!data[row][column]) {
                // create column if it doesn't exist
                data[row][column] = '';
            }
        };

        ensureDataExists();

        if (currentChar === '"') {
            if (insideQuotedField) {
                if (nextChar === '"') {
                    // unescape double quote
                    data[row][column] += '"';
                    position++;
                } else {
                    // exit quoted field
                    insideQuotedField = false;
                }

                // continue;
            } else if (previousChar === undefined || previousChar === delimiter || isNewline(previousChar)) {
                // enter quoted field
                insideQuotedField = true;
                // continue;
            }
        }

        if (!insideQuotedField && currentChar !== '"') {
            if (currentChar === delimiter) {
                // move to next column
                column++;
                ensureDataExists();

                continue;
            } else if (isNewline(currentChar)) {
                // move to next row
                column = 0;
                row++;
                ensureDataExists();

                if (currentChar === '\r' && nextChar === '\n') {
                    // skip over second newline character if it exists
                    position++;
                }

                continue;
            }
        }

        // add current character to current column
        data[row][column] += currentChar;
    }

    return data;
}

export class ClipboardService extends BeanStub implements NamedBean, IClipboardService {
    beanName = 'clipboardSvc' as const;

    private selectionSvc?: ISelectionService;
    private rowModel: IRowModel;
    private valueSvc: ValueService;
    private focusSvc: FocusService;
    private visibleCols: VisibleColsService;
    private cellNavigation: CellNavigationService;
    private rangeSvc?: IRangeService;

    public wireBeans(beans: BeanCollection): void {
        this.selectionSvc = beans.selectionSvc;
        this.rowModel = beans.rowModel;
        this.valueSvc = beans.valueSvc;
        this.focusSvc = beans.focusSvc;
        this.visibleCols = beans.visibleCols;
        this.cellNavigation = beans.cellNavigation!;
        this.rangeSvc = beans.rangeSvc;
    }

    private clientSideRowModel: IClientSideRowModel | null = null;
    private gridCtrl: GridCtrl | null = null;
    private lastPasteOperationTime: number = 0;

    private navigatorApiFailed = false;

    public postConstruct(): void {
        if (_isClientSideRowModel(this.gos, this.rowModel)) {
            this.clientSideRowModel = this.rowModel;
        }

        this.beans.ctrlsSvc.whenReady(this, (p) => {
            this.gridCtrl = p.gridCtrl;
        });
    }

    public override destroy(): void {
        super.destroy();

        this.clientSideRowModel = null;
        this.gridCtrl = null;
    }

    public pasteFromClipboard(): void {
        // Method 1 - native clipboard API, available in modern chrome browsers
        const allowNavigator = !this.gos.get('suppressClipboardApi');
        // Some browsers (Firefox) do not allow Web Applications to read from
        // the clipboard so verify if not only the ClipboardAPI is available,
        // but also if the `readText` method is public.
        if (allowNavigator && !this.navigatorApiFailed && navigator.clipboard && navigator.clipboard.readText) {
            navigator.clipboard
                .readText()
                .then(this.processClipboardData.bind(this))
                .catch((e) => {
                    _warn(40, { e, method: 'readText' });
                    this.navigatorApiFailed = true;
                    this.pasteFromClipboardLegacy();
                });
        } else {
            this.pasteFromClipboardLegacy();
        }
    }

    private pasteFromClipboardLegacy(): void {
        // Method 2 - if modern API fails, the old school hack
        let defaultPrevented = false;
        const handlePasteEvent = (e: ClipboardEvent) => {
            const currentPastOperationTime = new Date().getTime();
            if (currentPastOperationTime - this.lastPasteOperationTime < 50) {
                defaultPrevented = true;
                e.preventDefault();
            }
            this.lastPasteOperationTime = currentPastOperationTime;
        };

        this.executeOnTempElement(
            (textArea: HTMLTextAreaElement) => {
                textArea.addEventListener('paste', handlePasteEvent);
                textArea.focus({ preventScroll: true });
            },
            (element: HTMLTextAreaElement) => {
                const data = element.value;
                if (!defaultPrevented) {
                    this.processClipboardData(data);
                } else {
                    this.refocusLastFocusedCell();
                }
                element.removeEventListener('paste', handlePasteEvent);
            }
        );
    }

    private refocusLastFocusedCell(): void {
        const focusedCell = this.focusSvc.getFocusedCell();

        if (focusedCell) {
            this.focusSvc.setFocusedCell({
                rowIndex: focusedCell.rowIndex,
                column: focusedCell.column,
                rowPinned: focusedCell.rowPinned,
                forceBrowserFocus: true,
            });
        }
    }

    private getClipboardDelimiter() {
        const delimiter = this.gos.get('clipboardDelimiter');
        return _exists(delimiter) ? delimiter : '\t';
    }

    private processClipboardData(data: string): void {
        if (data == null) {
            return;
        }

        let parsedData: string[][] | null = stringToArray(data, this.getClipboardDelimiter());

        const userFunc = this.gos.getCallback('processDataFromClipboard');

        if (userFunc) {
            parsedData = userFunc({ data: parsedData });
        }

        if (parsedData == null) {
            return;
        }

        if (this.gos.get('suppressLastEmptyLineOnPaste')) {
            this.removeLastLineIfBlank(parsedData!);
        }

        const pasteOperation = (
            cellsToFlash: any,
            updatedRowNodes: RowNode[],
            focusedCell: CellPosition,
            changedPath: ChangedPath | undefined
        ) => {
            const rangeActive = this.rangeSvc?.isMoreThanOneCell();
            const pasteIntoRange = rangeActive && !this.hasOnlyOneValueToPaste(parsedData!);

            if (pasteIntoRange) {
                this.pasteIntoActiveRange(this.rangeSvc!, parsedData!, cellsToFlash, updatedRowNodes, changedPath);
            } else {
                this.pasteStartingFromFocusedCell(parsedData!, cellsToFlash, updatedRowNodes, focusedCell, changedPath);
            }
        };

        this.doPasteOperation(pasteOperation);
    }

    // common code to paste operations, e.g. paste to cell, paste to range, and copy range down
    private doPasteOperation(
        pasteOperationFunc: (
            cellsToFlash: any,
            updatedRowNodes: RowNode[],
            focusedCell: CellPosition | null,
            changedPath: ChangedPath | null | undefined
        ) => void
    ): void {
        const source = 'clipboard';

        this.eventSvc.dispatchEvent({
            type: 'pasteStart',
            source,
        });

        const clientSideRowModel = this.clientSideRowModel;
        const rootNode = clientSideRowModel?.rootNode;
        const changedPath = rootNode && new ChangedPath(this.gos.get('aggregateOnlyChangedColumns'), rootNode);

        const cellsToFlash = {} as any;
        const updatedRowNodes: RowNode[] = [];
        const focusedCell = this.focusSvc.getFocusedCell();

        pasteOperationFunc(cellsToFlash, updatedRowNodes, focusedCell, changedPath);

        const nodesToRefresh: RowNode[] = [...updatedRowNodes];
        if (changedPath) {
            clientSideRowModel.doAggregate(changedPath);

            // add all nodes impacted by aggregation, as they need refreshed also.
            changedPath.forEachChangedNodeDepthFirst((rowNode) => {
                nodesToRefresh.push(rowNode);
            });
        }

        // clipboardSvc has to do changeDetection itself, to prevent repeat logic in favour of batching.
        // changeDetectionService is disabled for this action.
        this.beans.rowRenderer.refreshCells({ rowNodes: nodesToRefresh });

        this.dispatchFlashCells(cellsToFlash);
        this.fireRowChanged(updatedRowNodes);

        // if using the clipboard hack with a temp element, then the focus has been lost,
        // so need to put it back. otherwise paste operation loosed focus on cell and keyboard
        // navigation stops.
        this.refocusLastFocusedCell();
        this.eventSvc.dispatchEvent({
            type: 'pasteEnd',
            source,
        });
    }

    private pasteIntoActiveRange(
        rangeSvc: IRangeService,
        clipboardData: string[][],
        cellsToFlash: any,
        updatedRowNodes: RowNode[],
        changedPath: ChangedPath | undefined
    ) {
        // true if clipboard data can be evenly pasted into range, otherwise false
        const abortRepeatingPasteIntoRows = this.getRangeSize(rangeSvc) % clipboardData.length != 0;

        let indexOffset = 0;
        let dataRowIndex = 0;

        const rowCallback: RowCallback = (
            currentRow: RowPosition,
            rowNode: RowNode,
            columns: AgColumn[],
            index: number
        ) => {
            const atEndOfClipboardData = index - indexOffset >= clipboardData.length;

            if (atEndOfClipboardData) {
                if (abortRepeatingPasteIntoRows) {
                    return;
                }

                // increment offset and reset data index to repeat paste of data
                indexOffset += dataRowIndex;
                dataRowIndex = 0;
            }

            const currentRowData = clipboardData[index - indexOffset];

            // otherwise we are not the first row, so copy
            updatedRowNodes.push(rowNode);

            const processCellFromClipboardFunc = this.gos.getCallback('processCellFromClipboard');

            columns.forEach((column, idx) => {
                if (!column.isCellEditable(rowNode) || column.isSuppressPaste(rowNode)) {
                    return;
                }

                // repeat data for columns we don't have data for - happens when to range is bigger than copied data range
                if (idx >= currentRowData.length) {
                    idx = idx % currentRowData.length;
                }

                const newValue = this.processCell(
                    rowNode,
                    column,
                    currentRowData[idx],
                    EXPORT_TYPE_DRAG_COPY,
                    processCellFromClipboardFunc,
                    true
                );

                rowNode.setDataValue(column, newValue, SOURCE_PASTE);

                if (changedPath) {
                    changedPath.addParentNode(rowNode.parent, [column]);
                }

                const { rowIndex, rowPinned } = currentRow;
                const cellId = _createCellId({ rowIndex, column, rowPinned });
                cellsToFlash[cellId] = true;
            });

            dataRowIndex++;
        };

        this.iterateActiveRanges(false, rowCallback);
    }

    private getDisplayedColumnsStartingAt(column: AgColumn): AgColumn[] {
        let currentColumn: AgColumn | null = column;
        const columns: AgColumn[] = [];

        while (currentColumn != null) {
            columns.push(currentColumn);
            currentColumn = this.visibleCols.getColAfter(currentColumn);
        }

        return columns;
    }

    private pasteStartingFromFocusedCell(
        parsedData: string[][],
        cellsToFlash: any,
        updatedRowNodes: RowNode[],
        focusedCell: CellPosition,
        changedPath: ChangedPath | undefined
    ) {
        if (!focusedCell) {
            return;
        }

        const currentRow: RowPosition = { rowIndex: focusedCell.rowIndex, rowPinned: focusedCell.rowPinned };
        const columnsToPasteInto = this.getDisplayedColumnsStartingAt(focusedCell.column as AgColumn);

        if (this.isPasteSingleValueIntoRange(parsedData)) {
            this.pasteSingleValueIntoRange(parsedData, updatedRowNodes, cellsToFlash, changedPath);
        } else {
            this.pasteMultipleValues(
                parsedData,
                currentRow,
                updatedRowNodes,
                columnsToPasteInto,
                cellsToFlash,
                EXPORT_TYPE_CLIPBOARD,
                changedPath
            );
        }
    }

    // if range is active, and only one cell, then we paste this cell into all cells in the active range.
    private isPasteSingleValueIntoRange(parsedData: string[][]): boolean {
        return this.hasOnlyOneValueToPaste(parsedData) && this.rangeSvc != null && !this.rangeSvc.isEmpty();
    }

    private pasteSingleValueIntoRange(
        parsedData: string[][],
        updatedRowNodes: RowNode[],
        cellsToFlash: any,
        changedPath: ChangedPath | undefined
    ) {
        const value = parsedData[0][0];

        const rowCallback: RowCallback = (currentRow: RowPosition, rowNode: RowNode, columns: AgColumn[]) => {
            updatedRowNodes.push(rowNode);
            columns.forEach((column) =>
                this.updateCellValue(rowNode, column, value, cellsToFlash, EXPORT_TYPE_CLIPBOARD, changedPath)
            );
        };

        this.iterateActiveRanges(false, rowCallback);
    }

    private hasOnlyOneValueToPaste(parsedData: string[][]) {
        return parsedData.length === 1 && parsedData[0].length === 1;
    }

    public copyRangeDown(): void {
        if (!this.rangeSvc || this.rangeSvc.isEmpty()) {
            return;
        }

        const firstRowValues: any[] = [];

        const pasteOperation = (
            cellsToFlash: any,
            updatedRowNodes: RowNode[],
            focusedCell: CellPosition,
            changedPath: ChangedPath | undefined
        ) => {
            const processCellForClipboardFunc = this.gos.getCallback('processCellForClipboard');
            const processCellFromClipboardFunc = this.gos.getCallback('processCellFromClipboard');

            const rowCallback: RowCallback = (currentRow: RowPosition, rowNode: RowNode, columns: AgColumn[]) => {
                // take reference of first row, this is the one we will be using to copy from
                if (!firstRowValues.length) {
                    // two reasons for looping through columns
                    columns.forEach((column) => {
                        // get the initial values to copy down
                        const value = this.processCell(
                            rowNode,
                            column,
                            this.valueSvc.getValue(column, rowNode),
                            EXPORT_TYPE_DRAG_COPY,
                            processCellForClipboardFunc,
                            false,
                            true
                        );

                        firstRowValues.push(value);
                    });
                } else {
                    // otherwise we are not the first row, so copy
                    updatedRowNodes.push(rowNode);
                    columns.forEach((column, index) => {
                        if (!column.isCellEditable(rowNode) || column.isSuppressPaste(rowNode)) {
                            return;
                        }

                        const firstRowValue = this.processCell(
                            rowNode,
                            column,
                            firstRowValues[index],
                            EXPORT_TYPE_DRAG_COPY,
                            processCellFromClipboardFunc,
                            true
                        );

                        rowNode.setDataValue(column, firstRowValue, SOURCE_PASTE);

                        if (changedPath) {
                            changedPath.addParentNode(rowNode.parent, [column]);
                        }

                        const { rowIndex, rowPinned } = currentRow;
                        const cellId = _createCellId({ rowIndex, column, rowPinned });
                        cellsToFlash[cellId] = true;
                    });
                }
            };

            this.iterateActiveRanges(true, rowCallback);
        };

        this.doPasteOperation(pasteOperation);
    }

    private removeLastLineIfBlank(parsedData: string[][]): void {
        // remove last row if empty, excel puts empty last row in
        const lastLine = _last(parsedData);
        const lastLineIsBlank = lastLine && lastLine.length === 1 && lastLine[0] === '';

        if (lastLineIsBlank) {
            // do not remove the last empty line when that is the only line pasted
            if (parsedData.length === 1) {
                return;
            }
            _removeFromArray(parsedData, lastLine);
        }
    }

    private fireRowChanged(rowNodes: RowNode[]): void {
        if (this.gos.get('editType') !== 'fullRow') {
            return;
        }

        rowNodes.forEach((rowNode) => {
            this.eventSvc.dispatchEvent({
                type: 'rowValueChanged',
                node: rowNode,
                data: rowNode.data,
                rowIndex: rowNode.rowIndex!,
                rowPinned: rowNode.rowPinned,
            });
        });
    }

    private pasteMultipleValues(
        clipboardGridData: string[][],
        currentRow: RowPosition | null,
        updatedRowNodes: RowNode[],
        columnsToPasteInto: AgColumn[],
        cellsToFlash: any,
        type: string,
        changedPath: ChangedPath | undefined
    ): void {
        let rowPointer = currentRow;

        // if doing CSRM and NOT tree data, then it means groups are aggregates, which are read only,
        // so we should skip them when doing paste operations.
        const skipGroupRows =
            this.clientSideRowModel != null && !this.gos.get('enableGroupEdit') && !this.gos.get('treeData');

        const getNextGoodRowNode = () => {
            while (true) {
                if (!rowPointer) {
                    return null;
                }
                const res = _getRowNode(this.beans, rowPointer);
                // move to next row down for next set of values
                rowPointer = this.cellNavigation.getRowBelow({
                    rowPinned: rowPointer.rowPinned,
                    rowIndex: rowPointer.rowIndex,
                });

                // if no more rows, return null
                if (res == null) {
                    return null;
                }

                // skip details rows and footer rows, never paste into them as they don't hold data
                const skipRow = res.detail || res.footer || (skipGroupRows && res.group);

                // skipping row means we go into the next iteration of the while loop
                if (!skipRow) {
                    return res;
                }
            }
        };

        clipboardGridData.forEach((clipboardRowData) => {
            const rowNode = getNextGoodRowNode();

            // if we have come to end of rows in grid, then skip
            if (!rowNode) {
                return;
            }

            clipboardRowData.forEach((value, index) =>
                this.updateCellValue(rowNode, columnsToPasteInto[index], value, cellsToFlash, type, changedPath)
            );

            updatedRowNodes.push(rowNode);
        });
    }

    private updateCellValue(
        rowNode: RowNode | null,
        column: AgColumn,
        value: string,
        cellsToFlash: any,
        type: string,
        changedPath: ChangedPath | undefined
    ) {
        if (!rowNode || !column || !column.isCellEditable(rowNode) || column.isSuppressPaste(rowNode)) {
            return;
        }

        const processedValue = this.processCell(
            rowNode,
            column,
            value,
            type,
            this.gos.getCallback('processCellFromClipboard'),
            true
        );
        rowNode.setDataValue(column, processedValue, SOURCE_PASTE);

        const { rowIndex, rowPinned } = rowNode;
        const cellId = _createCellId({ rowIndex: rowIndex!, column, rowPinned });
        cellsToFlash[cellId] = true;

        if (changedPath) {
            changedPath.addParentNode(rowNode.parent, [column]);
        }
    }

    public copyToClipboard(params: IClipboardCopyParams = {}): void {
        this.copyOrCutToClipboard(params);
    }

    public cutToClipboard(params: IClipboardCopyParams = {}, source: 'api' | 'ui' | 'contextMenu' = 'api'): void {
        if (this.gos.get('suppressCutToClipboard')) {
            return;
        }

        this.eventSvc.dispatchEvent({
            type: 'cutStart',
            source,
        });

        this.copyOrCutToClipboard(params, true);

        this.eventSvc.dispatchEvent({
            type: 'cutEnd',
            source,
        });
    }

    private copyOrCutToClipboard(params: IClipboardCopyParams, cut?: boolean): void {
        let { includeHeaders, includeGroupHeaders } = params;

        // don't override 'includeHeaders' if it has been explicitly set to 'false'
        if (includeHeaders == null) {
            includeHeaders = this.gos.get('copyHeadersToClipboard');
        }

        if (includeGroupHeaders == null) {
            includeGroupHeaders = this.gos.get('copyGroupHeadersToClipboard');
        }

        const copyParams = { includeHeaders, includeGroupHeaders };
        const rowSelection = this.gos.get('rowSelection');
        const cellSelection = this.gos.get('cellSelection');

        let cellClearType: CellClearType | null = null;
        // Copy priority is Range > Row > Focus
        if (this.shouldCopyCells(cellSelection, rowSelection)) {
            this.copySelectedRangeToClipboard(copyParams);
            cellClearType = CellClearType.CellRange;
        } else if (this.shouldCopyRows(rowSelection)) {
            this.copySelectedRowsToClipboard(copyParams);
            cellClearType = CellClearType.SelectedRows;
        } else if (this.focusSvc.isAnyCellFocused()) {
            this.copyFocusedCellToClipboard(copyParams);
            cellClearType = CellClearType.FocusedCell;
        }

        if (cut && cellClearType !== null) {
            this.clearCellsAfterCopy(cellClearType);
        }
    }

    private shouldCopyCells(cellSelection?: GridOptions['cellSelection'], rowSelection?: GridOptions['rowSelection']) {
        if (!this.rangeSvc || this.rangeSvc.isEmpty()) {
            return false;
        }

        if (cellSelection) {
            // If `cellSelection` is defined, user is using the new cell selection API, so we only copy
            // cells by default.
            const shouldCopyRowsInstead =
                typeof rowSelection === 'object' && rowSelection.copySelectedRows && !this.selectionSvc?.isEmpty();
            return !shouldCopyRowsInstead;
        } else {
            // If user is using the deprecated API, we preserve the previous behaviour
            const suppressCopySingleCellRanges = this.gos.get('suppressCopySingleCellRanges');
            const shouldSkip = !this.rangeSvc.isMoreThanOneCell() && suppressCopySingleCellRanges;
            return !shouldSkip;
        }
    }

    private shouldCopyRows(rowSelection?: GridOptions['rowSelection']) {
        if (this.selectionSvc?.isEmpty() ?? true) {
            return false;
        }

        if (rowSelection && typeof rowSelection !== 'string') {
            // If `rowSelection` is defined as an object, user is using the new selection API, so we determine
            // behaviour based on `copySelectedRows`
            return rowSelection.copySelectedRows ?? false;
        } else {
            // If user is using the deprecated API, we preserve the previous behaviour
            return !this.gos.get('suppressCopyRowsToClipboard');
        }
    }

    private clearCellsAfterCopy(type: CellClearType) {
        this.eventSvc.dispatchEvent({ type: 'keyShortcutChangedCellStart' });
        if (type === CellClearType.CellRange) {
            this.rangeSvc!.clearCellRangeCellValues({ cellEventSource: 'clipboardSvc' });
        } else if (type === CellClearType.SelectedRows) {
            this.clearSelectedRows();
        } else {
            const focusedCell = this.focusSvc.getFocusedCell();
            if (focusedCell == null) {
                return;
            }

            const rowNode = _getRowNode(this.beans, focusedCell);
            if (rowNode) {
                this.clearCellValue(rowNode, focusedCell.column as AgColumn);
            }
        }
        this.eventSvc.dispatchEvent({ type: 'keyShortcutChangedCellEnd' });
    }

    private clearSelectedRows(): void {
        const selected = this.selectionSvc?.getSelectedNodes() ?? [];
        const columns = this.visibleCols.allCols;

        for (const row of selected) {
            for (const col of columns) {
                this.clearCellValue(row, col);
            }
        }
    }

    private clearCellValue(rowNode: RowNode, column: AgColumn): void {
        if (!column.isCellEditable(rowNode)) {
            return;
        }
        const emptyValue = this.valueSvc.getDeleteValue(column, rowNode);
        rowNode.setDataValue(column, emptyValue, 'clipboardSvc');
    }

    private iterateActiveRanges(onlyFirst: boolean, rowCallback: RowCallback, columnCallback?: ColumnCallback): void {
        if (!this.rangeSvc || this.rangeSvc.isEmpty()) {
            return;
        }

        const cellRanges = this.rangeSvc.getCellRanges();

        if (onlyFirst) {
            this.iterateActiveRange(cellRanges[0], rowCallback, columnCallback, true);
        } else {
            cellRanges.forEach((range, idx) =>
                this.iterateActiveRange(range, rowCallback, columnCallback, idx === cellRanges.length - 1)
            );
        }
    }

    private iterateActiveRange(
        range: CellRange,
        rowCallback: RowCallback,
        columnCallback?: ColumnCallback,
        isLastRange?: boolean
    ): void {
        if (!this.rangeSvc) {
            return;
        }

        let currentRow: RowPosition | null = this.rangeSvc.getRangeStartRow(range);
        const lastRow = this.rangeSvc.getRangeEndRow(range);

        if (columnCallback && range.columns) {
            columnCallback(range.columns as AgColumn[]);
        }

        let rangeIndex = 0;
        let isLastRow = false;

        // the currentRow could be missing if the user sets the active range manually, and sets a range
        // that is outside of the grid (eg. sets range rows 0 to 100, but grid has only 20 rows).
        while (!isLastRow && currentRow != null) {
            const rowNode = _getRowNode(this.beans, currentRow);
            isLastRow = _isSameRow(currentRow, lastRow);

            rowCallback(currentRow, rowNode, range.columns as AgColumn[], rangeIndex++, isLastRow && isLastRange);

            currentRow = this.cellNavigation.getRowBelow(currentRow);
        }
    }

    public copySelectedRangeToClipboard(params: IClipboardCopyParams = {}): void {
        if (!this.rangeSvc || this.rangeSvc.isEmpty()) {
            return;
        }

        const allRangesMerge = this.rangeSvc.areAllRangesAbleToMerge();
        const { data, cellsToFlash } = allRangesMerge
            ? this.buildDataFromMergedRanges(this.rangeSvc, params)
            : this.buildDataFromRanges(this.rangeSvc, params);

        this.copyDataToClipboard(data);
        this.dispatchFlashCells(cellsToFlash);
    }

    private buildDataFromMergedRanges(rangeSvc: IRangeService, params: IClipboardCopyParams): DataForCellRangesType {
        const columnsSet: Set<AgColumn> = new Set();
        const ranges = rangeSvc.getCellRanges();
        const rowPositionsMap: Map<string, boolean> = new Map();
        const allRowPositions: RowPosition[] = [];
        const allCellsToFlash: CellsToFlashType = {};

        ranges.forEach((range) => {
            range.columns.forEach((col: AgColumn) => columnsSet.add(col));
            const { rowPositions, cellsToFlash } = this.getRangeRowPositionsAndCellsToFlash(rangeSvc, range);
            rowPositions.forEach((rowPosition) => {
                const rowPositionAsString = `${rowPosition.rowIndex}-${rowPosition.rowPinned || 'null'}`;
                if (!rowPositionsMap.get(rowPositionAsString)) {
                    rowPositionsMap.set(rowPositionAsString, true);
                    allRowPositions.push(rowPosition);
                }
            });
            Object.assign(allCellsToFlash, cellsToFlash);
        });

        const allColumns = this.visibleCols.allCols;
        const exportedColumns = Array.from(columnsSet) as AgColumn[];

        exportedColumns.sort((a, b) => {
            const posA = allColumns.indexOf(a);
            const posB = allColumns.indexOf(b);

            return posA - posB;
        });

        const data = this.buildExportParams({
            columns: exportedColumns,
            rowPositions: allRowPositions,
            includeHeaders: params.includeHeaders,
            includeGroupHeaders: params.includeGroupHeaders,
        });

        return { data, cellsToFlash: allCellsToFlash };
    }

    private buildDataFromRanges(rangeSvc: IRangeService, params: IClipboardCopyParams): DataForCellRangesType {
        const ranges = rangeSvc.getCellRanges();
        const data: string[] = [];
        const allCellsToFlash: CellsToFlashType = {};

        ranges.forEach((range) => {
            const { rowPositions, cellsToFlash } = this.getRangeRowPositionsAndCellsToFlash(rangeSvc, range);
            Object.assign(allCellsToFlash, cellsToFlash);
            data.push(
                this.buildExportParams({
                    columns: range.columns as AgColumn[],
                    rowPositions: rowPositions,
                    includeHeaders: params.includeHeaders,
                    includeGroupHeaders: params.includeGroupHeaders,
                })
            );
        });

        return { data: data.join('\n'), cellsToFlash: allCellsToFlash };
    }

    private getRangeRowPositionsAndCellsToFlash(
        rangeSvc: IRangeService,
        range: CellRange
    ): { rowPositions: RowPosition[]; cellsToFlash: CellsToFlashType } {
        const rowPositions: RowPosition[] = [];
        const cellsToFlash: CellsToFlashType = {};
        const startRow = rangeSvc.getRangeStartRow(range);
        const lastRow = rangeSvc.getRangeEndRow(range);

        let node: RowPosition | null = startRow;

        while (node) {
            rowPositions.push(node);
            range.columns.forEach((column) => {
                const { rowIndex, rowPinned } = node!;
                const cellId = _createCellId({ rowIndex, column, rowPinned });
                cellsToFlash[cellId] = true;
            });
            if (_isSameRow(node, lastRow)) {
                break;
            }
            node = this.cellNavigation.getRowBelow(node);
        }

        return { rowPositions, cellsToFlash };
    }

    private getCellsToFlashFromRowNodes(rowNodes: RowNode[]): CellsToFlashType {
        const allDisplayedColumns = this.visibleCols.allCols;
        const cellsToFlash: CellsToFlashType = {};
        for (let i = 0; i < rowNodes.length; i++) {
            const { rowIndex, rowPinned } = rowNodes[i];
            if (rowIndex == null) {
                continue;
            }
            for (let j = 0; j < allDisplayedColumns.length; j++) {
                const column = allDisplayedColumns[j];
                const cellId = _createCellId({ rowIndex, column, rowPinned });
                cellsToFlash[cellId] = true;
            }
        }

        return cellsToFlash;
    }

    private copyFocusedCellToClipboard(params: IClipboardCopyParams = {}): void {
        const focusedCell = this.focusSvc.getFocusedCell();

        if (focusedCell == null) {
            return;
        }

        const cellId = _createCellId(focusedCell);
        const currentRow: RowPosition = { rowPinned: focusedCell.rowPinned, rowIndex: focusedCell.rowIndex };
        const column = focusedCell.column as AgColumn;

        const data = this.buildExportParams({
            columns: [column],
            rowPositions: [currentRow],
            includeHeaders: params.includeHeaders,
            includeGroupHeaders: params.includeGroupHeaders,
        });

        this.copyDataToClipboard(data);
        this.dispatchFlashCells({ [cellId]: true });
    }

    public copySelectedRowsToClipboard(params: IClipboardCopyRowsParams = {}): void {
        const { columnKeys, includeHeaders, includeGroupHeaders } = params;

        const data = this.buildExportParams({
            columns: columnKeys as (string | AgColumn)[] | undefined,
            includeHeaders,
            includeGroupHeaders,
        });

        this.copyDataToClipboard(data);
        const rowNodes = this.selectionSvc?.getSelectedNodes() || [];
        this.dispatchFlashCells(this.getCellsToFlashFromRowNodes(rowNodes));
    }

    private buildExportParams(params: {
        columns?: (string | AgColumn)[];
        rowPositions?: RowPosition[];
        includeHeaders?: boolean;
        includeGroupHeaders?: boolean;
    }): string {
        const { columns, rowPositions, includeHeaders = false, includeGroupHeaders = false } = params;

        const exportParams: CsvExportParams = {
            columnKeys: columns,
            rowPositions,
            skipColumnHeaders: !includeHeaders,
            skipColumnGroupHeaders: !includeGroupHeaders,
            suppressQuotes: true,
            columnSeparator: this.getClipboardDelimiter(),
            onlySelected: !rowPositions,
            processCellCallback: this.gos.getCallback('processCellForClipboard'),
            processRowGroupCallback: (params) => this.processRowGroupCallback(params),
            processHeaderCallback: this.gos.getCallback('processHeaderForClipboard'),
            processGroupHeaderCallback: this.gos.getCallback('processGroupHeaderForClipboard'),
        };

        return this.beans.csvCreator!.getDataAsCsv(exportParams, true);
    }

    private processRowGroupCallback(params: ProcessRowGroupForExportParams) {
        const { node, column } = params;

        const isTreeData = this.gos.get('treeData');

        // if not tree datathen we get the value from the group data
        const getValueFromNode = () => {
            if (isTreeData || !column) {
                return node.key;
            }
            const value = node.groupData?.[column.getId()];
            if (
                !value ||
                !node.rowGroupColumn ||
                node.rowGroupColumn.getColDef().useValueFormatterForExport === false
            ) {
                return value;
            }
            return this.valueSvc.formatValue(node.rowGroupColumn as AgColumn, node, value) ?? value;
        };
        let value = getValueFromNode();

        if (params.node.footer) {
            let suffix = '';
            if (value && value.length) {
                suffix = ` ${value}`;
            }
            value = `Total${suffix}`;
        }
        const processCellForClipboard = this.gos.getCallback('processCellForClipboard');

        if (processCellForClipboard) {
            let column = node.rowGroupColumn as AgColumn;

            if (!column && node.footer && node.level === -1) {
                column = this.beans.funcColsSvc.rowGroupCols[0];
            }
            return processCellForClipboard({
                value,
                node,
                column,
                type: 'clipboard',
                formatValue: (valueToFormat: any) =>
                    this.valueSvc.formatValue(column, node, valueToFormat) ?? valueToFormat,
                parseValue: (valueToParse: string) =>
                    this.valueSvc.parseValue(column, node, valueToParse, this.valueSvc.getValue(column, node)),
            });
        }
        return value;
    }

    // eslint-disable-next-line @typescript-eslint/ban-types
    private dispatchFlashCells(cellsToFlash: {}): void {
        window.setTimeout(() => {
            this.eventSvc.dispatchEvent({
                type: 'flashCells',
                cells: cellsToFlash,
            });
        }, 0);
    }

    private processCell<T>(
        rowNode: RowNode | undefined,
        column: AgColumn,
        value: T,
        type: string,
        func?: (params: WithoutGridCommon<ProcessCellForExportParams>) => T,
        canParse?: boolean,
        canFormat?: boolean
    ): T {
        if (func) {
            const params: WithoutGridCommon<ProcessCellForExportParams> = {
                column,
                node: rowNode,
                value,
                type,
                formatValue: (valueToFormat: any) =>
                    this.valueSvc.formatValue(column, rowNode ?? null, valueToFormat) ?? valueToFormat,
                parseValue: (valueToParse: string) =>
                    this.valueSvc.parseValue(
                        column,
                        rowNode ?? null,
                        valueToParse,
                        this.valueSvc.getValue(column, rowNode)
                    ),
            };

            return func(params);
        }

        if (canParse && column.getColDef().useValueParserForImport !== false) {
            return this.valueSvc.parseValue(column, rowNode ?? null, value, this.valueSvc.getValue(column, rowNode));
        }

        if (canFormat && column.getColDef().useValueFormatterForExport !== false) {
            return this.valueSvc.formatValue(column, rowNode ?? null, value) ?? (value as any);
        }

        return value;
    }

    private copyDataToClipboard(data: string): void {
        const userProvidedFunc = this.gos.getCallback('sendToClipboard');

        // method 1 - user provided func
        if (userProvidedFunc) {
            userProvidedFunc({ data });
            return;
        }

        // method 2 - native clipboard API, available in modern chrome browsers
        const allowNavigator = !this.gos.get('suppressClipboardApi');
        if (allowNavigator && navigator.clipboard) {
            navigator.clipboard.writeText(data).catch((e) => {
                _warn(40, { e, method: 'writeText' });
                this.copyDataToClipboardLegacy(data);
            });
            return;
        }

        this.copyDataToClipboardLegacy(data);
    }

    private copyDataToClipboardLegacy(data: string): void {
        // method 3 - if all else fails, the old school hack
        this.executeOnTempElement((element) => {
            const eDocument = _getDocument(this.gos);
            const focusedElementBefore = _getActiveDomElement(this.gos) as HTMLElement;

            element.value = data || ' '; // has to be non-empty value or execCommand will not do anything
            element.select();
            element.focus({ preventScroll: true });

            const result = eDocument.execCommand('copy');

            if (!result) {
                _warn(41);
            }

            if (focusedElementBefore != null && focusedElementBefore.focus != null) {
                focusedElementBefore.focus({ preventScroll: true });
            }
        });
    }

    private executeOnTempElement(
        callbackNow: (element: HTMLTextAreaElement) => void,
        callbackAfter?: (element: HTMLTextAreaElement) => void
    ): void {
        if (!this.gridCtrl) {
            return;
        }

        const eDoc = _getDocument(this.gos);
        const eTempInput = eDoc.createElement('textarea');
        eTempInput.style.width = '1px';
        eTempInput.style.height = '1px';

        // removing items from the DOM causes the document element to scroll to the
        // position where the element was positioned. Here we set scrollTop / scrollLeft
        // to prevent the document element from scrolling when we remove it from the DOM.
        eTempInput.style.top = eDoc.documentElement.scrollTop + 'px';
        eTempInput.style.left = eDoc.documentElement.scrollLeft + 'px';

        eTempInput.style.position = 'absolute';
        eTempInput.style.opacity = '0';

        const guiRoot = this.gridCtrl.getGui();

        guiRoot.appendChild(eTempInput);

        try {
            callbackNow(eTempInput);
        } catch (err) {
            _warn(42);
        }

        //It needs 100 otherwise OS X seemed to not always be able to paste... Go figure...
        if (callbackAfter) {
            window.setTimeout(() => {
                callbackAfter(eTempInput);
                guiRoot.removeChild(eTempInput);
            }, 100);
        } else {
            guiRoot.removeChild(eTempInput);
        }
    }

    private getRangeSize(rangeSvc: IRangeService): number {
        const ranges = rangeSvc.getCellRanges();
        let startRangeIndex = 0;
        let endRangeIndex = 0;

        if (ranges.length > 0) {
            startRangeIndex = rangeSvc.getRangeStartRow(ranges[0]).rowIndex;
            endRangeIndex = rangeSvc.getRangeEndRow(ranges[0]).rowIndex;
        }

        return startRangeIndex - endRangeIndex + 1;
    }
}
