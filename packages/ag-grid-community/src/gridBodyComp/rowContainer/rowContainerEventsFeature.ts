import { KeyCode } from '../../constants/keyCode';
import { BeanStub } from '../../context/beanStub';
import type { AgColumn } from '../../entities/agColumn';
import { _getSelectAll, _isCellSelectionEnabled } from '../../gridOptionsUtils';
import type { IClipboardService } from '../../interfaces/iClipboardService';
import type { RowPinnedType } from '../../interfaces/iRowNode';
import type { CellCtrl } from '../../rendering/cell/cellCtrl';
import { _getCellCtrlForEventTarget } from '../../rendering/cell/cellCtrl';
import type { RowCtrl } from '../../rendering/row/rowCtrl';
import { DOM_DATA_KEY_ROW_CTRL } from '../../rendering/row/rowCtrl';
import type { UndoRedoService } from '../../undoRedo/undoRedoService';
import { _last } from '../../utils/array';
import { _getCtrlForEventTarget, _isEventSupported, _isStopPropagationForAgGrid } from '../../utils/event';
import { _isEventFromPrintableCharacter, _isUserSuppressingKeyboardEvent } from '../../utils/keyboard';
import { _isEventFromThisGrid } from '../mouseEventUtils';

const A_KEYCODE = 65;
const C_KEYCODE = 67;
const V_KEYCODE = 86;
const D_KEYCODE = 68;
const Z_KEYCODE = 90;
const Y_KEYCODE = 89;

function _normaliseQwertyAzerty(keyboardEvent: KeyboardEvent): string {
    const { keyCode } = keyboardEvent;
    let code: string;

    switch (keyCode) {
        case A_KEYCODE:
            code = KeyCode.A;
            break;
        case C_KEYCODE:
            code = KeyCode.C;
            break;
        case V_KEYCODE:
            code = KeyCode.V;
            break;
        case D_KEYCODE:
            code = KeyCode.D;
            break;
        case Z_KEYCODE:
            code = KeyCode.Z;
            break;
        case Y_KEYCODE:
            code = KeyCode.Y;
            break;
        default:
            code = keyboardEvent.code;
    }

    return code;
}

export class RowContainerEventsFeature extends BeanStub {
    constructor(public readonly element: HTMLElement) {
        super();
    }

    public postConstruct(): void {
        this.addKeyboardListeners();
        this.addMouseListeners();
        this.beans.touchSvc?.mockRowContextMenuForIPad(this);
    }

    private addKeyboardListeners(): void {
        const eventName = 'keydown';
        const listener = this.processKeyboardEvent.bind(this, eventName);
        this.addManagedElementListeners(this.element, { [eventName]: listener });
    }

    private addMouseListeners(): void {
        const mouseDownEvent = _isEventSupported('touchstart') ? 'touchstart' : 'mousedown';
        const eventNames = ['dblclick', 'contextmenu', 'mouseover', 'mouseout', 'click', mouseDownEvent];

        eventNames.forEach((eventName) => {
            const listener = this.processMouseEvent.bind(this, eventName);
            this.addManagedElementListeners(this.element, { [eventName]: listener });
        });
    }

    private processMouseEvent(eventName: string, mouseEvent: MouseEvent): void {
        if (!_isEventFromThisGrid(this.gos, mouseEvent) || _isStopPropagationForAgGrid(mouseEvent)) {
            return;
        }

        const { cellCtrl, rowCtrl } = this.getControlsForEventTarget(mouseEvent.target);

        if (eventName === 'contextmenu') {
            this.beans.contextMenuSvc?.handleContextMenuMouseEvent(mouseEvent, undefined, rowCtrl, cellCtrl!);
        } else {
            if (cellCtrl) {
                cellCtrl.onMouseEvent(eventName, mouseEvent);
            }
            if (rowCtrl) {
                rowCtrl.onMouseEvent(eventName, mouseEvent);
            }
        }
    }

    public getControlsForEventTarget(target: EventTarget | null): {
        cellCtrl: CellCtrl | null;
        rowCtrl: RowCtrl | null;
    } {
        const { gos } = this;
        return {
            cellCtrl: _getCellCtrlForEventTarget(gos, target),
            rowCtrl: _getCtrlForEventTarget(gos, target, DOM_DATA_KEY_ROW_CTRL),
        };
    }

    private processKeyboardEvent(eventName: string, keyboardEvent: KeyboardEvent): void {
        const { cellCtrl, rowCtrl } = this.getControlsForEventTarget(keyboardEvent.target);

        if (keyboardEvent.defaultPrevented) {
            return;
        }
        if (cellCtrl) {
            this.processCellKeyboardEvent(cellCtrl, eventName, keyboardEvent);
        } else if (rowCtrl && rowCtrl.isFullWidth()) {
            this.processFullWidthRowKeyboardEvent(rowCtrl, eventName, keyboardEvent);
        }
    }

    private processCellKeyboardEvent(cellCtrl: CellCtrl, eventName: string, keyboardEvent: KeyboardEvent): void {
        const { rowNode, column, editing } = cellCtrl;

        const gridProcessingAllowed = !_isUserSuppressingKeyboardEvent(
            this.gos,
            keyboardEvent,
            rowNode,
            column,
            editing
        );

        if (gridProcessingAllowed) {
            if (eventName === 'keydown') {
                // first see if it's a scroll key, page up / down, home / end etc
                const wasScrollKey = !editing && this.beans.navigation?.handlePageScrollingKey(keyboardEvent);

                // if not a scroll key, then we pass onto cell
                if (!wasScrollKey) {
                    cellCtrl.onKeyDown(keyboardEvent);
                }

                // perform clipboard and undo / redo operations
                this.doGridOperations(keyboardEvent, cellCtrl.editing);

                if (_isEventFromPrintableCharacter(keyboardEvent)) {
                    cellCtrl.processCharacter(keyboardEvent);
                }
            }
        }

        if (eventName === 'keydown') {
            this.eventSvc.dispatchEvent(cellCtrl.createEvent(keyboardEvent, 'cellKeyDown'));
        }
    }

    private processFullWidthRowKeyboardEvent(rowComp: RowCtrl, eventName: string, keyboardEvent: KeyboardEvent) {
        const { rowNode } = rowComp;
        const { focusSvc, navigation } = this.beans;
        const focusedCell = focusSvc.getFocusedCell();
        const column = (focusedCell && focusedCell.column) as AgColumn;
        const gridProcessingAllowed = !_isUserSuppressingKeyboardEvent(this.gos, keyboardEvent, rowNode, column, false);

        if (gridProcessingAllowed) {
            const key = keyboardEvent.key;
            if (eventName === 'keydown') {
                switch (key) {
                    case KeyCode.PAGE_HOME:
                    case KeyCode.PAGE_END:
                    case KeyCode.PAGE_UP:
                    case KeyCode.PAGE_DOWN:
                        navigation?.handlePageScrollingKey(keyboardEvent, true);
                        break;

                    case KeyCode.UP:
                    case KeyCode.DOWN:
                        rowComp.onKeyboardNavigate(keyboardEvent);
                        break;
                    case KeyCode.TAB:
                        rowComp.onTabKeyDown(keyboardEvent);
                        break;
                    default:
                }
            }
        }

        if (eventName === 'keydown') {
            this.eventSvc.dispatchEvent(rowComp.createRowEvent('cellKeyDown', keyboardEvent));
        }
    }

    private doGridOperations(keyboardEvent: KeyboardEvent, editing: boolean): void {
        // check if ctrl or meta key pressed
        if (!keyboardEvent.ctrlKey && !keyboardEvent.metaKey) {
            return;
        }

        // if the cell the event came from is editing, then we do not
        // want to do the default shortcut keys, otherwise the editor
        // (eg a text field) would not be able to do the normal cut/copy/paste
        if (editing) {
            return;
        }

        // for copy / paste, we don't want to execute when the event
        // was from a child grid (happens in master detail)
        if (!_isEventFromThisGrid(this.gos, keyboardEvent)) {
            return;
        }

        const keyCode = _normaliseQwertyAzerty(keyboardEvent);

        const { clipboardSvc, undoRedo } = this.beans;

        if (keyCode === KeyCode.A) {
            return this.onCtrlAndA(keyboardEvent);
        }
        if (keyCode === KeyCode.C) {
            return this.onCtrlAndC(clipboardSvc, keyboardEvent);
        }
        if (keyCode === KeyCode.D) {
            return this.onCtrlAndD(clipboardSvc, keyboardEvent);
        }
        if (keyCode === KeyCode.V) {
            return this.onCtrlAndV(clipboardSvc, keyboardEvent);
        }
        if (keyCode === KeyCode.X) {
            return this.onCtrlAndX(clipboardSvc, keyboardEvent);
        }
        if (keyCode === KeyCode.Y) {
            return this.onCtrlAndY(undoRedo);
        }
        if (keyCode === KeyCode.Z) {
            return this.onCtrlAndZ(undoRedo, keyboardEvent);
        }
    }

    private onCtrlAndA(event: KeyboardEvent): void {
        const {
            beans: { pinnedRowModel, rowModel, visibleCols, rangeSvc, selectionSvc },
            gos,
        } = this;

        if (rangeSvc && _isCellSelectionEnabled(gos) && rowModel.isRowsToRender()) {
            const [isEmptyPinnedTop, isEmptyPinnedBottom] = [
                pinnedRowModel?.isEmpty('top') ?? true,
                pinnedRowModel?.isEmpty('bottom') ?? true,
            ];

            const floatingStart: RowPinnedType = isEmptyPinnedTop ? null : 'top';
            let floatingEnd: RowPinnedType;
            let rowEnd: number;

            if (isEmptyPinnedBottom) {
                floatingEnd = null;
                rowEnd = rowModel.getRowCount() - 1;
            } else {
                floatingEnd = 'bottom';
                rowEnd = pinnedRowModel?.getPinnedBottomRowCount() ?? 0 - 1;
            }

            const allDisplayedColumns = visibleCols.allCols;
            if (!allDisplayedColumns?.length) {
                return;
            }

            rangeSvc.setCellRange({
                rowStartIndex: 0,
                rowStartPinned: floatingStart,
                rowEndIndex: rowEnd,
                rowEndPinned: floatingEnd,
                columnStart: allDisplayedColumns[0],
                columnEnd: _last(allDisplayedColumns),
            });
        } else if (selectionSvc) {
            selectionSvc?.selectAllRowNodes({ source: 'keyboardSelectAll', selectAll: _getSelectAll(gos) });
        }

        event.preventDefault();
    }

    private onCtrlAndC(clipboardSvc: IClipboardService | undefined, event: KeyboardEvent): void {
        if (!clipboardSvc || this.gos.get('enableCellTextSelection')) {
            return;
        }

        const { cellCtrl, rowCtrl } = this.getControlsForEventTarget(event.target);

        if (cellCtrl?.editing || rowCtrl?.editing) {
            return;
        }

        event.preventDefault();
        clipboardSvc.copyToClipboard();
    }

    private onCtrlAndX(clipboardSvc: IClipboardService | undefined, event: KeyboardEvent): void {
        if (!clipboardSvc || this.gos.get('enableCellTextSelection') || this.gos.get('suppressCutToClipboard')) {
            return;
        }

        const { cellCtrl, rowCtrl } = this.getControlsForEventTarget(event.target);

        if (cellCtrl?.editing || rowCtrl?.editing) {
            return;
        }

        event.preventDefault();
        clipboardSvc.cutToClipboard(undefined, 'ui');
    }

    private onCtrlAndV(clipboardSvc: IClipboardService | undefined, event: KeyboardEvent): void {
        const { cellCtrl, rowCtrl } = this.getControlsForEventTarget(event.target);

        if (cellCtrl?.editing || rowCtrl?.editing) {
            return;
        }
        if (clipboardSvc && !this.gos.get('suppressClipboardPaste')) {
            clipboardSvc.pasteFromClipboard();
        }
    }

    private onCtrlAndD(clipboardSvc: IClipboardService | undefined, event: KeyboardEvent): void {
        if (clipboardSvc && !this.gos.get('suppressClipboardPaste')) {
            clipboardSvc.copyRangeDown();
        }
        event.preventDefault();
    }

    private onCtrlAndZ(undoRedo: UndoRedoService | undefined, event: KeyboardEvent): void {
        if (!this.gos.get('undoRedoCellEditing') || !undoRedo) {
            return;
        }
        event.preventDefault();

        if (event.shiftKey) {
            undoRedo.redo('ui');
        } else {
            undoRedo.undo('ui');
        }
    }

    private onCtrlAndY(undoRedo: UndoRedoService | undefined): void {
        undoRedo?.redo('ui');
    }
}
