import { KeyCode } from '../../constants/keyCode';
import { BeanStub } from '../../context/beanStub';
import type { BeanCollection } from '../../context/context';
import type { RowNode } from '../../entities/rowNode';
import { _getGroupSelection, _isCellSelectionEnabled, _isRowSelection } from '../../gridOptionsUtils';
import { _isMacOsUserAgent } from '../../utils/browser';
import type { RowCtrl } from '../row/rowCtrl';
import type { CellCtrl } from './cellCtrl';

function _isDeleteKey(key: string, alwaysReturnFalseOnBackspace = false) {
    if (key === KeyCode.DELETE) {
        return true;
    }
    if (!alwaysReturnFalseOnBackspace && key === KeyCode.BACKSPACE) {
        return _isMacOsUserAgent();
    }
    return false;
}

export class CellKeyboardListenerFeature extends BeanStub {
    private readonly cellCtrl: CellCtrl;
    private readonly rowNode: RowNode;
    private readonly rowCtrl: RowCtrl;

    private eGui: HTMLElement;

    constructor(ctrl: CellCtrl, beans: BeanCollection, rowNode: RowNode, rowCtrl: RowCtrl) {
        super();
        this.cellCtrl = ctrl;
        this.beans = beans;
        this.rowNode = rowNode;
        this.rowCtrl = rowCtrl;
    }

    public setComp(eGui: HTMLElement): void {
        this.eGui = eGui;
    }

    public onKeyDown(event: KeyboardEvent): void {
        const key = event.key;

        switch (key) {
            case KeyCode.ENTER:
                this.onEnterKeyDown(event);
                break;
            case KeyCode.F2:
                this.onF2KeyDown(event);
                break;
            case KeyCode.ESCAPE:
                this.onEscapeKeyDown(event);
                break;
            case KeyCode.TAB:
                this.onTabKeyDown(event);
                break;
            case KeyCode.BACKSPACE:
            case KeyCode.DELETE:
                this.onBackspaceOrDeleteKeyDown(key, event);
                break;
            case KeyCode.DOWN:
            case KeyCode.UP:
            case KeyCode.RIGHT:
            case KeyCode.LEFT:
                this.onNavigationKeyDown(event, key);
                break;
        }
    }

    private onNavigationKeyDown(event: KeyboardEvent, key: string): void {
        if (this.cellCtrl.isEditing()) {
            return;
        }

        if (event.shiftKey && this.cellCtrl.isRangeSelectionEnabled()) {
            this.onShiftRangeSelect(event);
        } else {
            this.beans.navigation?.navigateToNextCell(event, key, this.cellCtrl.getCellPosition(), true);
        }

        // if we don't prevent default, the grid will scroll with the navigation keys
        event.preventDefault();
    }

    private onShiftRangeSelect(event: KeyboardEvent): void {
        if (!this.beans.rangeSvc) {
            return;
        }

        const endCell = this.beans.rangeSvc.extendLatestRangeInDirection(event);

        if (endCell) {
            this.beans.navigation?.ensureCellVisible(endCell);
        }
    }

    private onTabKeyDown(event: KeyboardEvent): void {
        this.beans.navigation?.onTabKeyDown(this.cellCtrl, event);
    }

    private onBackspaceOrDeleteKeyDown(key: string, event: KeyboardEvent): void {
        const { cellCtrl, beans, rowNode } = this;
        const { gos, rangeSvc, eventSvc } = beans;

        if (cellCtrl.isEditing()) {
            return;
        }

        eventSvc.dispatchEvent({ type: 'keyShortcutChangedCellStart' });

        if (_isDeleteKey(key, gos.get('enableCellEditingOnBackspace'))) {
            if (rangeSvc && _isCellSelectionEnabled(gos)) {
                rangeSvc.clearCellRangeCellValues({ dispatchWrapperEvents: true, wrapperEventSource: 'deleteKey' });
            } else if (cellCtrl.isCellEditable()) {
                const column = cellCtrl.getColumn();
                const emptyValue = this.beans.valueSvc.getDeleteValue(column, rowNode);
                rowNode.setDataValue(column, emptyValue, 'cellClear');
            }
        } else {
            cellCtrl.startRowOrCellEdit(key, event);
        }

        eventSvc.dispatchEvent({ type: 'keyShortcutChangedCellEnd' });
    }

    private onEnterKeyDown(e: KeyboardEvent): void {
        if (this.cellCtrl.isEditing() || this.rowCtrl.isEditing()) {
            this.cellCtrl.stopEditingAndFocus(false, e.shiftKey);
        } else {
            if (this.beans.gos.get('enterNavigatesVertically')) {
                const key = e.shiftKey ? KeyCode.UP : KeyCode.DOWN;
                this.beans.navigation?.navigateToNextCell(null, key, this.cellCtrl.getCellPosition(), false);
            } else {
                this.cellCtrl.startRowOrCellEdit(KeyCode.ENTER, e);
                if (this.cellCtrl.isEditing()) {
                    // if we started editing, then we need to prevent default, otherwise the Enter action can get
                    // applied to the cell editor. this happened, for example, with largeTextCellEditor where not
                    // preventing default results in a 'new line' character getting inserted in the text area
                    // when the editing was started
                    e.preventDefault();
                }
            }
        }
    }

    private onF2KeyDown(event: KeyboardEvent): void {
        if (!this.cellCtrl.isEditing()) {
            this.cellCtrl.startRowOrCellEdit(KeyCode.F2, event);
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    private onEscapeKeyDown(event: KeyboardEvent): void {
        if (this.cellCtrl.isEditing()) {
            this.cellCtrl.stopRowOrCellEdit(true);
            this.cellCtrl.focusCell(true);
        }
    }

    public processCharacter(event: KeyboardEvent): void {
        // check this, in case focus is on a (for example) a text field inside the cell,
        // in which cse we should not be listening for these key pressed
        const eventTarget = event.target;
        const eventOnChildComponent = eventTarget !== this.eGui;

        if (eventOnChildComponent || this.cellCtrl.isEditing()) {
            return;
        }

        const key = event.key;
        if (key === ' ') {
            this.onSpaceKeyDown(event);
        } else {
            if (this.cellCtrl.startRowOrCellEdit(key, event)) {
                // if we don't prevent default, then the event also gets applied to the text field
                // (at least when doing the default editor), but we need to allow the editor to decide
                // what it wants to do. we only do this IF editing was started - otherwise it messes
                // up when the use is not doing editing, but using rendering with text fields in cellRenderer
                // (as it would block the the user from typing into text fields).
                event.preventDefault();
            }
        }
    }

    private onSpaceKeyDown(event: KeyboardEvent): void {
        const { gos } = this.beans;

        if (!this.cellCtrl.isEditing() && _isRowSelection(gos)) {
            const currentSelection = this.rowNode.isSelected();
            const newSelection = !currentSelection;
            const groupSelectsFiltered = _getGroupSelection(gos) === 'filteredDescendants';
            const updatedCount = this.beans.selectionSvc?.setSelectedParams({
                rowNode: this.rowNode,
                newValue: newSelection,
                rangeSelect: event.shiftKey,
                groupSelectsFiltered,
                event,
                source: 'spaceKey',
            });
            if (currentSelection === undefined && updatedCount === 0) {
                this.beans.selectionSvc?.setSelectedParams({
                    rowNode: this.rowNode,
                    newValue: false,
                    rangeSelect: event.shiftKey,
                    groupSelectsFiltered,
                    event,
                    source: 'spaceKey',
                });
            }
        }

        // prevent default as space key, by default, moves browser scroll down
        event.preventDefault();
    }

    public override destroy(): void {
        super.destroy();
    }
}
