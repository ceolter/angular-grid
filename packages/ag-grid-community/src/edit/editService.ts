import { _getCellEditorDetails } from '../components/framework/userCompUtils';
import type { UserComponentFactory } from '../components/framework/userComponentFactory';
import { KeyCode } from '../constants/keyCode';
import type { NamedBean } from '../context/bean';
import { BeanStub } from '../context/beanStub';
import type { BeanCollection } from '../context/context';
import type { AgColumn } from '../entities/agColumn';
import type { RowNode } from '../entities/rowNode';
import { _isElementInThisGrid } from '../gridBodyComp/mouseEventUtils';
import type { DefaultProvidedCellEditorParams, ICellEditorParams } from '../interfaces/iCellEditor';
import type { CellPosition } from '../interfaces/iCellPosition';
import type { IRowNode } from '../interfaces/iRowNode';
import type { UserCompDetails } from '../interfaces/iUserCompDetails';
import type { NavigationService } from '../navigation/navigationService';
import type { CellCtrl, ICellComp } from '../rendering/cell/cellCtrl';
import type { RowCtrl } from '../rendering/row/rowCtrl';
import type { RowRenderer } from '../rendering/rowRenderer';
import { _getTabIndex } from '../utils/browser';
import type { ValueService } from '../valueService/valueService';
import type { PopupService } from '../widgets/popupService';
import { PopupEditorWrapper } from './cellEditors/popupEditorWrapper';

export class EditService extends BeanStub implements NamedBean {
    beanName = 'editSvc' as const;

    private navigation?: NavigationService;
    private userCompFactory: UserComponentFactory;
    private valueSvc: ValueService;
    private rowRenderer: RowRenderer;
    private popupSvc?: PopupService;

    public wireBeans(beans: BeanCollection): void {
        this.navigation = beans.navigation;
        this.userCompFactory = beans.userCompFactory;
        this.valueSvc = beans.valueSvc;
        this.rowRenderer = beans.rowRenderer;
        this.popupSvc = beans.popupSvc;
    }

    public startEditing(
        cellCtrl: CellCtrl,
        key: string | null = null,
        cellStartedEdit = false,
        event: KeyboardEvent | MouseEvent | null = null
    ): boolean {
        if (!cellCtrl.isCellEditable() || cellCtrl.editing) {
            return true;
        }

        // because of async in React, the cellComp may not be set yet, if no cellComp then we are
        // yet to initialise the cell, so we re-schedule this operation for when celLComp is attached
        if (!cellCtrl.comp) {
            cellCtrl.onCompAttachedFuncs.push(() => {
                this.startEditing(cellCtrl, key, cellStartedEdit, event);
            });
            return true;
        }

        const editorParams = this.createCellEditorParams(cellCtrl, key, cellStartedEdit);
        const colDef = cellCtrl.column.getColDef();
        const compDetails = _getCellEditorDetails(this.userCompFactory, colDef, editorParams);

        // if cellEditorSelector was used, we give preference to popup and popupPosition from the selector
        const popup = compDetails?.popupFromSelector != null ? compDetails.popupFromSelector : !!colDef.cellEditorPopup;
        const position: 'over' | 'under' | undefined =
            compDetails?.popupPositionFromSelector != null
                ? compDetails.popupPositionFromSelector
                : colDef.cellEditorPopupPosition;

        this.setEditing(cellCtrl, true, compDetails);
        cellCtrl.comp.setEditDetails(compDetails, popup, position, this.gos.get('reactiveCustomComponents'));

        this.eventSvc.dispatchEvent(cellCtrl.createEvent(event, 'cellEditingStarted'));

        return !(compDetails?.params as DefaultProvidedCellEditorParams)?.suppressPreventDefault;
    }

    /**
     * Ends the Cell Editing
     * @param cancel `True` if the edit process is being canceled.
     * @returns `True` if the value of the `GridCell` has been updated, otherwise `False`.
     */
    public stopEditing(cellCtrl: CellCtrl, cancel: boolean = false): boolean {
        cellCtrl.onEditorAttachedFuncs = [];
        if (!cellCtrl.editing) {
            return false;
        }

        const { comp: cellComp, column, rowNode } = cellCtrl;
        const { newValue, newValueExists } = this.takeValueFromCellEditor(cancel, cellComp);
        const oldValue = this.valueSvc.getValueForDisplay(column, rowNode);
        let valueChanged = false;

        if (newValueExists) {
            valueChanged = this.saveNewValue(cellCtrl, oldValue, newValue, rowNode, column);
        }

        this.setEditing(cellCtrl, false, undefined);
        cellComp.setEditDetails(); // passing nothing stops editing

        cellCtrl.updateAndFormatValue(false);
        cellCtrl.refreshCell({ forceRefresh: true, suppressFlash: true });

        this.eventSvc.dispatchEvent({
            ...cellCtrl.createEvent(null, 'cellEditingStopped'),
            oldValue,
            newValue,
            valueChanged,
        });

        return valueChanged;
    }

    private setEditing(cellCtrl: CellCtrl, editing: boolean, compDetails: UserCompDetails | undefined): void {
        cellCtrl.editCompDetails = compDetails;
        if (cellCtrl.editing === editing) {
            return;
        }

        cellCtrl.editing = editing;
    }

    public handleColDefChanged(cellCtrl: CellCtrl): void {
        const cellEditor = cellCtrl.comp?.getCellEditor();
        if (cellEditor?.refresh) {
            const { eventKey, cellStartedEdit } = cellCtrl.editCompDetails!.params;
            const editorParams = this.createCellEditorParams(cellCtrl, eventKey, cellStartedEdit);
            const colDef = cellCtrl.column.getColDef();
            const compDetails = _getCellEditorDetails(this.userCompFactory, colDef, editorParams);
            cellEditor.refresh(compDetails!.params);
        }
    }

    public setFocusOutOnEditor(cellCtrl: CellCtrl): void {
        if (!cellCtrl.editing) {
            return;
        }
        const cellEditor = cellCtrl.comp.getCellEditor();

        if (cellEditor && cellEditor.focusOut) {
            cellEditor.focusOut();
        }
    }

    public setFocusInOnEditor(cellCtrl: CellCtrl): void {
        if (!cellCtrl.editing) {
            return;
        }
        const cellComp = cellCtrl.comp;
        const cellEditor = cellComp.getCellEditor();

        if (cellEditor?.focusIn) {
            // if the editor is present, then we just focus it
            cellEditor.focusIn();
        } else {
            // if the editor is not present, it means async cell editor (e.g. React)
            // and we are trying to set focus before the cell editor is present, so we
            // focus the cell instead
            cellCtrl.focusCell(true);
            cellCtrl.onEditorAttachedFuncs.push(() => cellComp.getCellEditor()?.focusIn?.());
        }
    }

    public stopEditingAndFocus(cellCtrl: CellCtrl, suppressNavigateAfterEdit = false, shiftKey: boolean = false): void {
        this.stopRowOrCellEdit(cellCtrl);
        cellCtrl.focusCell(true);

        if (!suppressNavigateAfterEdit) {
            this.navigateAfterEdit(shiftKey, cellCtrl.cellPosition);
        }
    }

    public createPopupEditorWrapper(params: ICellEditorParams): PopupEditorWrapper {
        return new PopupEditorWrapper(params);
    }

    public stopAllEditing(cancel: boolean = false): void {
        this.rowRenderer.getAllRowCtrls().forEach((rowCtrl) => this.stopRowEditing(rowCtrl, cancel));
    }

    public stopRowEditing(rowCtrl: RowCtrl, cancel: boolean = false): void {
        // if we are already stopping row edit, there is
        // no need to start this process again.
        if (rowCtrl.stoppingRowEdit) {
            return;
        }

        const cellControls = rowCtrl.getAllCellCtrls();
        const isRowEdit = rowCtrl.editing;

        rowCtrl.stoppingRowEdit = true;

        let fireRowEditEvent = false;
        for (const ctrl of cellControls) {
            const valueChanged = ctrl.stopEditing(cancel);
            if (isRowEdit && !cancel && !fireRowEditEvent && valueChanged) {
                fireRowEditEvent = true;
            }
        }

        if (fireRowEditEvent) {
            this.eventSvc.dispatchEvent(rowCtrl.createRowEvent('rowValueChanged'));
        }

        if (isRowEdit) {
            this.beans.rowEditSvc?.setEditing(rowCtrl, false);
        }

        rowCtrl.stoppingRowEdit = false;
    }

    public addStopEditingWhenGridLosesFocus(viewports: HTMLElement[]): void {
        if (!this.gos.get('stopEditingWhenCellsLoseFocus')) {
            return;
        }

        const focusOutListener = (event: FocusEvent): void => {
            // this is the element the focus is moving to
            const elementWithFocus = event.relatedTarget as HTMLElement;

            if (_getTabIndex(elementWithFocus) === null) {
                this.stopAllEditing();
                return;
            }

            let clickInsideGrid =
                // see if click came from inside the viewports
                viewports.some((viewport) => viewport.contains(elementWithFocus)) &&
                // and also that it's not from a detail grid
                _isElementInThisGrid(this.gos, elementWithFocus);

            if (!clickInsideGrid) {
                const popupSvc = this.popupSvc;

                clickInsideGrid =
                    !!popupSvc &&
                    (popupSvc.getActivePopups().some((popup) => popup.contains(elementWithFocus)) ||
                        popupSvc.isElementWithinCustomPopup(elementWithFocus));
            }

            if (!clickInsideGrid) {
                this.stopAllEditing();
            }
        };

        viewports.forEach((viewport) => this.addManagedElementListeners(viewport, { focusout: focusOutListener }));
    }

    public setInlineEditingCss(rowCtrl: RowCtrl): void {
        const editing = rowCtrl.editing || rowCtrl.getAllCellCtrls().some((cellCtrl) => cellCtrl.editing);
        rowCtrl.forEachGui(undefined, (gui) => {
            gui.rowComp.addOrRemoveCssClass('ag-row-inline-editing', editing);
            gui.rowComp.addOrRemoveCssClass('ag-row-not-inline-editing', !editing);
        });
    }

    public isCellEditable(column: AgColumn, rowNode: IRowNode): boolean {
        if (rowNode.group) {
            // This is a group - it could be a tree group or a grouping group...
            if (this.gos.get('treeData')) {
                // tree - allow editing of groups with data by default.
                // Allow editing filler nodes (node without data) only if enableGroupEdit is true.
                if (!rowNode.data && !this.gos.get('enableGroupEdit')) {
                    return false;
                }
            } else {
                // grouping - allow editing of groups if the user has enableGroupEdit option enabled
                if (!this.gos.get('enableGroupEdit')) {
                    return false;
                }
            }
        }

        return column.isColumnFunc(rowNode, column.colDef.editable);
    }

    // called by rowRenderer when user navigates via tab key
    public startRowOrCellEdit(
        cellCtrl: CellCtrl,
        key?: string | null,
        event: KeyboardEvent | MouseEvent | null = null
    ): boolean {
        // because of async in React, the cellComp may not be set yet, if no cellComp then we are
        // yet to initialise the cell, so we re-schedule this operation for when celLComp is attached
        if (!cellCtrl.comp) {
            cellCtrl.onCompAttachedFuncs.push(() => {
                this.startRowOrCellEdit(cellCtrl, key, event);
            });
            return true;
        }

        if (this.gos.get('editType') === 'fullRow') {
            return this.beans.rowEditSvc?.startEditing(cellCtrl.rowCtrl, key, cellCtrl) ?? true;
        } else {
            return this.startEditing(cellCtrl, key, true, event);
        }
    }

    // pass in 'true' to cancel the editing.
    public stopRowOrCellEdit(cellCtrl: CellCtrl, cancel: boolean = false) {
        if (this.gos.get('editType') === 'fullRow') {
            this.stopRowEditing(cellCtrl.rowCtrl, cancel);
        } else {
            this.stopEditing(cellCtrl, cancel);
        }
    }

    private takeValueFromCellEditor(cancel: boolean, cellComp: ICellComp): { newValue?: any; newValueExists: boolean } {
        const noValueResult = { newValueExists: false };

        if (cancel) {
            return noValueResult;
        }

        const cellEditor = cellComp.getCellEditor();

        if (!cellEditor) {
            return noValueResult;
        }

        const userWantsToCancel = cellEditor.isCancelAfterEnd && cellEditor.isCancelAfterEnd();

        if (userWantsToCancel) {
            return noValueResult;
        }

        const newValue = cellEditor.getValue();

        return {
            newValue: newValue,
            newValueExists: true,
        };
    }

    /**
     * @returns `True` if the value changes, otherwise `False`.
     */
    private saveNewValue(
        cellCtrl: CellCtrl,
        oldValue: any,
        newValue: any,
        rowNode: RowNode,
        column: AgColumn
    ): boolean {
        if (newValue === oldValue) {
            return false;
        }

        // we suppressRefreshCell because the call to rowNode.setDataValue() results in change detection
        // getting triggered, which results in all cells getting refreshed. we do not want this refresh
        // to happen on this call as we want to call it explicitly below. otherwise refresh gets called twice.
        // if we only did this refresh (and not the one below) then the cell would flash and not be forced.
        cellCtrl.suppressRefreshCell = true;
        const valueChanged = rowNode.setDataValue(column, newValue, 'edit');
        cellCtrl.suppressRefreshCell = false;

        return valueChanged;
    }

    private createCellEditorParams(
        cellCtrl: CellCtrl,
        key: string | null,
        cellStartedEdit: boolean
    ): ICellEditorParams {
        const {
            column,
            rowNode,
            eGui,
            cellPosition: { rowIndex },
        } = cellCtrl;
        return this.gos.addGridCommonParams({
            value: this.valueSvc.getValueForDisplay(column, rowNode),
            eventKey: key,
            column,
            colDef: column.getColDef(),
            rowIndex,
            node: rowNode,
            data: rowNode.data,
            cellStartedEdit: cellStartedEdit,
            onKeyDown: cellCtrl.onKeyDown.bind(cellCtrl),
            stopEditing: cellCtrl.stopEditingAndFocus.bind(cellCtrl),
            eGridCell: eGui,
            parseValue: (newValue: any) => this.valueSvc.parseValue(column, rowNode, newValue, cellCtrl.value),
            formatValue: cellCtrl.formatValue.bind(cellCtrl),
        });
    }

    private navigateAfterEdit(shiftKey: boolean, cellPosition: CellPosition): void {
        const enterNavigatesVerticallyAfterEdit = this.gos.get('enterNavigatesVerticallyAfterEdit');

        if (enterNavigatesVerticallyAfterEdit) {
            const key = shiftKey ? KeyCode.UP : KeyCode.DOWN;
            this.navigation?.navigateToNextCell(null, key, cellPosition, false);
        }
    }
}
