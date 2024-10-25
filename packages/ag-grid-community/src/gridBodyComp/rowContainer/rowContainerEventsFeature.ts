import type { VisibleColsService } from '../../columns/visibleColsService';
import { KeyCode } from '../../constants/keyCode';
import { BeanStub } from '../../context/beanStub';
import type { BeanCollection } from '../../context/context';
import type { AgColumn } from '../../entities/agColumn';
import type { FocusService } from '../../focusService';
import { _getSelectAll, _isCellSelectionEnabled } from '../../gridOptionsUtils';
import type { IRangeService } from '../../interfaces/IRangeService';
import type { IClipboardService } from '../../interfaces/iClipboardService';
import type { IContextMenuService } from '../../interfaces/iContextMenu';
import type { IRowModel } from '../../interfaces/iRowModel';
import type { RowPinnedType } from '../../interfaces/iRowNode';
import type { ISelectionService } from '../../interfaces/iSelectionService';
import type { NavigationService } from '../../navigation/navigationService';
import type { PinnedRowModel } from '../../pinnedRowModel/pinnedRowModel';
import type { CellCtrl } from '../../rendering/cell/cellCtrl';
import { _getCellCtrlForEventTarget } from '../../rendering/cell/cellCtrl';
import type { RowCtrl } from '../../rendering/row/rowCtrl';
import { DOM_DATA_KEY_ROW_CTRL } from '../../rendering/row/rowCtrl';
import type { UndoRedoService } from '../../undoRedo/undoRedoService';
import { _last } from '../../utils/array';
import { _isIOSUserAgent } from '../../utils/browser';
import { _getCtrlForEventTarget, _isEventSupported, _isStopPropagationForAgGrid } from '../../utils/event';
import { _isEventFromPrintableCharacter, _isUserSuppressingKeyboardEvent } from '../../utils/keyboard';
import type { LongTapEvent } from '../../widgets/touchListener';
import { TouchListener } from '../../widgets/touchListener';
import type { MouseEventService } from './../mouseEventService';

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
    private mouseEventSvc: MouseEventService;
    private contextMenuSvc?: IContextMenuService;
    private navigation?: NavigationService;
    private focusSvc: FocusService;
    private undoRedo?: UndoRedoService;
    private visibleCols: VisibleColsService;
    private rowModel: IRowModel;
    private pinnedRowModel?: PinnedRowModel;
    private rangeSvc?: IRangeService;
    private clipboardSvc?: IClipboardService;
    private selectionSvc?: ISelectionService;

    public wireBeans(beans: BeanCollection) {
        this.mouseEventSvc = beans.mouseEventSvc;
        this.contextMenuSvc = beans.contextMenuSvc;
        this.navigation = beans.navigation;
        this.focusSvc = beans.focusSvc;
        this.undoRedo = beans.undoRedo;
        this.visibleCols = beans.visibleCols;
        this.rowModel = beans.rowModel;
        this.pinnedRowModel = beans.pinnedRowModel;
        this.rangeSvc = beans.rangeSvc;
        this.clipboardSvc = beans.clipboardSvc;
        this.selectionSvc = beans.selectionSvc;
    }

    private element: HTMLElement;

    constructor(element: HTMLElement) {
        super();
        this.element = element;
    }

    public postConstruct(): void {
        this.addKeyboardListeners();
        this.addMouseListeners();
        this.mockContextMenuForIPad();
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
        if (!this.mouseEventSvc.isEventFromThisGrid(mouseEvent) || _isStopPropagationForAgGrid(mouseEvent)) {
            return;
        }

        const rowComp = this.getRowForEvent(mouseEvent.target);
        const cellCtrl = this.mouseEventSvc.getRenderedCellForEvent(mouseEvent)!;

        if (eventName === 'contextmenu') {
            this.contextMenuSvc?.handleContextMenuMouseEvent(mouseEvent, undefined, rowComp, cellCtrl);
        } else {
            if (cellCtrl) {
                cellCtrl.onMouseEvent(eventName, mouseEvent);
            }
            if (rowComp) {
                rowComp.onMouseEvent(eventName, mouseEvent);
            }
        }
    }

    private mockContextMenuForIPad(): void {
        // we do NOT want this when not in iPad, otherwise we will be doing
        if (!_isIOSUserAgent()) {
            return;
        }

        const touchListener = new TouchListener(this.element);
        const longTapListener = (event: LongTapEvent) => {
            const rowComp = this.getRowForEvent(event.touchEvent.target);
            const cellComp = this.mouseEventSvc.getRenderedCellForEvent(event.touchEvent)!;

            this.contextMenuSvc?.handleContextMenuMouseEvent(undefined, event.touchEvent, rowComp, cellComp);
        };

        this.addManagedListeners(touchListener, { longTap: longTapListener });
        this.addDestroyFunc(() => touchListener.destroy());
    }

    private getRowForEvent(eventTarget: EventTarget | null): RowCtrl | null {
        return _getCtrlForEventTarget(this.gos, eventTarget, DOM_DATA_KEY_ROW_CTRL);
    }

    private getControlsForEventTarget(target: EventTarget | null): {
        cellCtrl: CellCtrl | null;
        rowCtrl: RowCtrl | null;
    } {
        return {
            cellCtrl: _getCellCtrlForEventTarget(this.gos, target),
            rowCtrl: this.getRowForEvent(target),
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
        const rowNode = cellCtrl.getRowNode();
        const column = cellCtrl.getColumn();
        const editing = cellCtrl.isEditing();

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
                const wasScrollKey = !editing && this.navigation?.handlePageScrollingKey(keyboardEvent);

                // if not a scroll key, then we pass onto cell
                if (!wasScrollKey) {
                    cellCtrl.onKeyDown(keyboardEvent);
                }

                // perform clipboard and undo / redo operations
                this.doGridOperations(keyboardEvent, cellCtrl.isEditing());

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
        const rowNode = rowComp.getRowNode();
        const focusedCell = this.focusSvc.getFocusedCell();
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
                        this.navigation?.handlePageScrollingKey(keyboardEvent, true);
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
        if (!this.mouseEventSvc.isEventFromThisGrid(keyboardEvent)) {
            return;
        }

        const keyCode = _normaliseQwertyAzerty(keyboardEvent);

        if (keyCode === KeyCode.A) {
            return this.onCtrlAndA(keyboardEvent);
        }
        if (keyCode === KeyCode.C) {
            return this.onCtrlAndC(keyboardEvent);
        }
        if (keyCode === KeyCode.D) {
            return this.onCtrlAndD(keyboardEvent);
        }
        if (keyCode === KeyCode.V) {
            return this.onCtrlAndV(keyboardEvent);
        }
        if (keyCode === KeyCode.X) {
            return this.onCtrlAndX(keyboardEvent);
        }
        if (keyCode === KeyCode.Y) {
            return this.onCtrlAndY();
        }
        if (keyCode === KeyCode.Z) {
            return this.onCtrlAndZ(keyboardEvent);
        }
    }

    private onCtrlAndA(event: KeyboardEvent): void {
        const { pinnedRowModel, rowModel, rangeSvc, selectionSvc, gos } = this;

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

            const allDisplayedColumns = this.visibleCols.allCols;
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

    private onCtrlAndC(event: KeyboardEvent): void {
        if (!this.clipboardSvc || this.gos.get('enableCellTextSelection')) {
            return;
        }

        const { cellCtrl, rowCtrl } = this.getControlsForEventTarget(event.target);

        if (cellCtrl?.isEditing() || rowCtrl?.isEditing()) {
            return;
        }

        event.preventDefault();
        this.clipboardSvc.copyToClipboard();
    }

    private onCtrlAndX(event: KeyboardEvent): void {
        if (!this.clipboardSvc || this.gos.get('enableCellTextSelection') || this.gos.get('suppressCutToClipboard')) {
            return;
        }

        const { cellCtrl, rowCtrl } = this.getControlsForEventTarget(event.target);

        if (cellCtrl?.isEditing() || rowCtrl?.isEditing()) {
            return;
        }

        event.preventDefault();
        this.clipboardSvc.cutToClipboard(undefined, 'ui');
    }

    private onCtrlAndV(event: KeyboardEvent): void {
        const { cellCtrl, rowCtrl } = this.getControlsForEventTarget(event.target);

        if (cellCtrl?.isEditing() || rowCtrl?.isEditing()) {
            return;
        }
        if (this.clipboardSvc && !this.gos.get('suppressClipboardPaste')) {
            this.clipboardSvc.pasteFromClipboard();
        }
    }

    private onCtrlAndD(event: KeyboardEvent): void {
        if (this.clipboardSvc && !this.gos.get('suppressClipboardPaste')) {
            this.clipboardSvc.copyRangeDown();
        }
        event.preventDefault();
    }

    private onCtrlAndZ(event: KeyboardEvent): void {
        if (!this.gos.get('undoRedoCellEditing') || !this.undoRedo) {
            return;
        }
        event.preventDefault();

        if (event.shiftKey) {
            this.undoRedo.redo('ui');
        } else {
            this.undoRedo.undo('ui');
        }
    }

    private onCtrlAndY(): void {
        this.undoRedo?.redo('ui');
    }
}
