import type { NamedBean } from '../context/bean';
import { BeanStub } from '../context/beanStub';
import type { BeanCollection } from '../context/context';
import type { AgColumn } from '../entities/agColumn';
import { _areCellsEqual, _getRowNode, _isSameRow } from '../entities/positionUtils';
import type { CellValueChangedEvent } from '../events';
import type { GridBodyCtrl } from '../gridBodyComp/gridBodyCtrl';
import { _isCellSelectionEnabled } from '../gridOptionsUtils';
import type { CellRange, CellRangeParams, IRangeService } from '../interfaces/IRangeService';
import type { CellPosition } from '../interfaces/iCellPosition';
import type { RowPosition } from '../interfaces/iRowPosition';
import type { CellValueChange, LastFocusedCell } from './iUndoRedo';
import { RangeUndoRedoAction, UndoRedoAction, UndoRedoStack } from './undoRedoStack';

export class UndoRedoService extends BeanStub implements NamedBean {
    beanName = 'undoRedo' as const;

    private rangeSvc?: IRangeService;

    public wireBeans(beans: BeanCollection): void {
        this.rangeSvc = beans.rangeSvc;
    }

    private gridBodyCtrl: GridBodyCtrl;

    private cellValueChanges: CellValueChange[] = [];

    private undoStack: UndoRedoStack;
    private redoStack: UndoRedoStack;

    private activeCellEdit: CellPosition | null = null;
    private activeRowEdit: RowPosition | null = null;

    private isPasting = false;
    private isRangeInAction = false;

    public postConstruct(): void {
        if (!this.gos.get('undoRedoCellEditing')) {
            return;
        }

        const undoRedoLimit = this.gos.get('undoRedoCellEditingLimit');

        if (undoRedoLimit <= 0) {
            return;
        }

        this.undoStack = new UndoRedoStack(undoRedoLimit);
        this.redoStack = new UndoRedoStack(undoRedoLimit);

        this.addListeners();

        const listener = this.clearStacks.bind(this);
        this.addManagedEventListeners({
            cellValueChanged: this.onCellValueChanged.bind(this),
            // undo / redo is restricted to actual editing so we clear the stacks when other operations are
            // performed that change the order of the row / cols.
            modelUpdated: (e) => {
                if (!e.keepUndoRedoStack) {
                    this.clearStacks();
                }
            },
            columnPivotModeChanged: listener,
            newColumnsLoaded: listener,
            columnGroupOpened: listener,
            columnRowGroupChanged: listener,
            columnMoved: listener,
            columnPinned: listener,
            columnVisible: listener,
            rowDragEnd: listener,
        });

        this.beans.ctrlsSvc.whenReady(this, (p) => {
            this.gridBodyCtrl = p.gridBodyCtrl;
        });
    }

    private onCellValueChanged = (event: CellValueChangedEvent): void => {
        const eventCell: CellPosition = { column: event.column, rowIndex: event.rowIndex!, rowPinned: event.rowPinned };
        const isCellEditing = this.activeCellEdit !== null && _areCellsEqual(this.activeCellEdit, eventCell);
        const isRowEditing = this.activeRowEdit !== null && _isSameRow(this.activeRowEdit, eventCell);

        const shouldCaptureAction = isCellEditing || isRowEditing || this.isPasting || this.isRangeInAction;

        if (!shouldCaptureAction) {
            return;
        }

        const { rowPinned, rowIndex, column, oldValue, value } = event;

        const cellValueChange: CellValueChange = {
            rowPinned,
            rowIndex: rowIndex!,
            columnId: column.getColId(),
            newValue: value,
            oldValue,
        };

        this.cellValueChanges.push(cellValueChange);
    };

    private clearStacks = () => {
        this.undoStack.clear();
        this.redoStack.clear();
    };

    public getCurrentUndoStackSize(): number {
        return this.undoStack ? this.undoStack.getCurrentStackSize() : 0;
    }

    public getCurrentRedoStackSize(): number {
        return this.redoStack ? this.redoStack.getCurrentStackSize() : 0;
    }

    public undo(source: 'api' | 'ui'): void {
        this.eventSvc.dispatchEvent({
            type: 'undoStarted',
            source,
        });

        const operationPerformed = this.undoRedo(this.undoStack, this.redoStack, 'initialRange', 'oldValue', 'undo');

        this.eventSvc.dispatchEvent({
            type: 'undoEnded',
            source,
            operationPerformed,
        });
    }

    public redo(source: 'api' | 'ui'): void {
        this.eventSvc.dispatchEvent({
            type: 'redoStarted',
            source,
        });

        const operationPerformed = this.undoRedo(this.redoStack, this.undoStack, 'finalRange', 'newValue', 'redo');

        this.eventSvc.dispatchEvent({
            type: 'redoEnded',
            source,
            operationPerformed,
        });
    }

    private undoRedo(
        undoRedoStack: UndoRedoStack,
        opposingUndoRedoStack: UndoRedoStack,
        rangeProperty: 'initialRange' | 'finalRange',
        cellValueChangeProperty: 'oldValue' | 'newValue',
        source: 'undo' | 'redo'
    ): boolean {
        if (!undoRedoStack) {
            return false;
        }

        const undoRedoAction: UndoRedoAction | undefined = undoRedoStack.pop();

        if (!undoRedoAction || !undoRedoAction.cellValueChanges) {
            return false;
        }

        this.processAction(
            undoRedoAction,
            (cellValueChange: CellValueChange) => cellValueChange[cellValueChangeProperty],
            source
        );

        if (undoRedoAction instanceof RangeUndoRedoAction) {
            this.processRange(this.rangeSvc!, undoRedoAction.ranges || [undoRedoAction[rangeProperty]]);
        } else {
            this.processCell(undoRedoAction.cellValueChanges);
        }

        opposingUndoRedoStack.push(undoRedoAction);

        return true;
    }

    private processAction(
        action: UndoRedoAction,
        valueExtractor: (cellValueChange: CellValueChange) => any,
        source: string
    ) {
        action.cellValueChanges.forEach((cellValueChange) => {
            const { rowIndex, rowPinned, columnId } = cellValueChange;
            const rowPosition: RowPosition = { rowIndex, rowPinned };
            const currentRow = _getRowNode(this.beans, rowPosition);

            // checks if the row has been filtered out
            if (!currentRow!.displayed) {
                return;
            }

            currentRow!.setDataValue(columnId, valueExtractor(cellValueChange), source);
        });
    }

    private processRange(rangeSvc: IRangeService, ranges: (CellRange | undefined)[]) {
        let lastFocusedCell: LastFocusedCell;

        rangeSvc.removeAllCellRanges(true);
        ranges.forEach((range, idx) => {
            if (!range) {
                return;
            }

            const startRow = range.startRow;
            const endRow = range.endRow;

            if (idx === ranges.length - 1) {
                lastFocusedCell = {
                    rowPinned: startRow!.rowPinned,
                    rowIndex: startRow!.rowIndex,
                    columnId: range.startColumn.getColId(),
                };

                this.setLastFocusedCell(lastFocusedCell);
            }

            const cellRangeParams: CellRangeParams = {
                rowStartIndex: startRow!.rowIndex,
                rowStartPinned: startRow!.rowPinned,
                rowEndIndex: endRow!.rowIndex,
                rowEndPinned: endRow!.rowPinned,
                columnStart: range.startColumn,
                columns: range.columns,
            };

            rangeSvc.addCellRange(cellRangeParams);
        });
    }

    private processCell(cellValueChanges: CellValueChange[]) {
        const cellValueChange = cellValueChanges[0];
        const { rowIndex, rowPinned } = cellValueChange;
        const rowPosition: RowPosition = { rowIndex, rowPinned };
        const row = _getRowNode(this.beans, rowPosition);

        const lastFocusedCell: LastFocusedCell = {
            rowPinned: cellValueChange.rowPinned,
            rowIndex: row!.rowIndex!,
            columnId: cellValueChange.columnId,
        };

        // when single cells are being processed, they should be considered
        // as ranges when the rangeSvc is present (singleCellRanges).
        // otherwise focus will be restore but the range will not.
        this.setLastFocusedCell(lastFocusedCell, this.rangeSvc);
    }

    private setLastFocusedCell(lastFocusedCell: LastFocusedCell, rangeSvc?: IRangeService) {
        const { rowIndex, columnId, rowPinned } = lastFocusedCell;
        const scrollFeature = this.gridBodyCtrl.getScrollFeature();

        const column: AgColumn | null = this.beans.colModel.getCol(columnId);

        if (!column) {
            return;
        }

        scrollFeature.ensureIndexVisible(rowIndex);
        scrollFeature.ensureColumnVisible(column);

        const cellPosition: CellPosition = { rowIndex, column, rowPinned };
        this.beans.focusSvc.setFocusedCell({ ...cellPosition, forceBrowserFocus: true });

        rangeSvc?.setRangeToCell(cellPosition);
    }

    private addListeners(): void {
        this.addManagedEventListeners({
            rowEditingStarted: (e) => {
                this.activeRowEdit = { rowIndex: e.rowIndex!, rowPinned: e.rowPinned };
            },
            rowEditingStopped: () => {
                const action = new UndoRedoAction(this.cellValueChanges);
                this.pushActionsToUndoStack(action);
                this.activeRowEdit = null;
            },
            cellEditingStarted: (e) => {
                this.activeCellEdit = { column: e.column, rowIndex: e.rowIndex!, rowPinned: e.rowPinned };
            },
            cellEditingStopped: (e) => {
                this.activeCellEdit = null;

                const shouldPushAction =
                    e.valueChanged && !this.activeRowEdit && !this.isPasting && !this.isRangeInAction;

                if (shouldPushAction) {
                    const action = new UndoRedoAction(this.cellValueChanges);
                    this.pushActionsToUndoStack(action);
                }
            },
            pasteStart: () => {
                this.isPasting = true;
            },
            pasteEnd: () => {
                const action = new UndoRedoAction(this.cellValueChanges);
                this.pushActionsToUndoStack(action);
                this.isPasting = false;
            },
            fillStart: () => {
                this.isRangeInAction = true;
            },
            fillEnd: (event) => {
                const action = new RangeUndoRedoAction(this.cellValueChanges, event.initialRange, event.finalRange);
                this.pushActionsToUndoStack(action);
                this.isRangeInAction = false;
            },
            keyShortcutChangedCellStart: () => {
                this.isRangeInAction = true;
            },
            keyShortcutChangedCellEnd: () => {
                let action: UndoRedoAction;
                if (this.rangeSvc && _isCellSelectionEnabled(this.gos)) {
                    action = new RangeUndoRedoAction(this.cellValueChanges, undefined, undefined, [
                        ...this.rangeSvc.getCellRanges(),
                    ]);
                } else {
                    action = new UndoRedoAction(this.cellValueChanges);
                }
                this.pushActionsToUndoStack(action);
                this.isRangeInAction = false;
            },
        });
    }

    private pushActionsToUndoStack(action: UndoRedoAction) {
        this.undoStack.push(action);

        this.cellValueChanges = [];
        this.redoStack.clear();
    }
}
