import { isColumnSelectionCol } from '../columns/columnUtils';
import { BeanStub } from '../context/beanStub';
import type { BeanCollection } from '../context/context';
import type { AgColumn } from '../entities/agColumn';
import type { IsRowSelectable } from '../entities/gridOptions';
import type { RowNode } from '../entities/rowNode';
import { _createGlobalRowEvent } from '../entities/rowNodeUtils';
import type { SelectionEventSourceType } from '../events';
import {
    _getActiveDomElement,
    _getCheckboxes,
    _getEnableDeselection,
    _getGroupSelectsDescendants,
    _getIsRowSelectable,
    _isRowSelection,
} from '../gridOptionsUtils';
import type { IRowModel } from '../interfaces/iRowModel';
import type { IRowNode } from '../interfaces/iRowNode';
import type { ISetNodesSelectedParams, SetSelectedParams } from '../interfaces/iSelectionService';
import type { AriaAnnouncementService } from '../rendering/ariaAnnouncementService';
import type { RowCtrl, RowGui } from '../rendering/row/rowCtrl';
import { _setAriaSelected } from '../utils/aria';
import type { ChangedPath } from '../utils/changedPath';
import { _warn } from '../validation/logging';
import { CheckboxSelectionComponent } from './checkboxSelectionComponent';
import { SelectAllFeature } from './selectAllFeature';

export abstract class BaseSelectionService extends BeanStub {
    protected rowModel: IRowModel;
    private ariaAnnounce?: AriaAnnouncementService;

    protected isRowSelectable?: IsRowSelectable;

    public wireBeans(beans: BeanCollection) {
        this.rowModel = beans.rowModel;
        this.ariaAnnounce = beans.ariaAnnounce;
    }

    public postConstruct(): void {
        const { gos } = this;
        this.addManagedPropertyListeners(['isRowSelectable', 'rowSelection'], () => {
            const callback = _getIsRowSelectable(gos);
            if (callback !== this.isRowSelectable) {
                this.isRowSelectable = callback;
                this.updateSelectable();
            }
        });

        this.isRowSelectable = _getIsRowSelectable(gos);
    }

    public createCheckboxSelectionComponent(): CheckboxSelectionComponent {
        return new CheckboxSelectionComponent();
    }

    public createSelectAllFeature(column: AgColumn): SelectAllFeature {
        return new SelectAllFeature(column);
    }

    public abstract processSelectionAction(
        event: MouseEvent | KeyboardEvent,
        rowNode: RowNode,
        source: SelectionEventSourceType
    ): number;

    public onRowCtrlSelected(rowCtrl: RowCtrl, hasFocusFunc: (gui: RowGui) => void, gui?: RowGui): void {
        // Treat undefined as false, if we pass undefined down it gets treated as toggle class, rather than explicitly
        // setting the required value
        const selected = !!rowCtrl.rowNode.isSelected();
        rowCtrl.forEachGui(gui, (gui) => {
            gui.rowComp.addOrRemoveCssClass('ag-row-selected', selected);
            _setAriaSelected(gui.element, selected);

            const hasFocus = gui.element.contains(_getActiveDomElement(this.beans));
            if (hasFocus) {
                hasFocusFunc(gui);
            }
        });
    }

    public announceAriaRowSelection(rowNode: RowNode): void {
        if (this.isRowSelectionBlocked(rowNode)) {
            return;
        }

        const selected = rowNode.isSelected()!;
        if (selected && !_getEnableDeselection(this.gos)) {
            return;
        }

        const translate = this.getLocaleTextFunc();
        const label = translate(
            selected ? 'ariaRowDeselect' : 'ariaRowSelect',
            `Press SPACE to ${selected ? 'deselect' : 'select'} this row.`
        );

        this.ariaAnnounce?.announceValue(label, 'rowSelection');
    }

    protected dispatchSelectionChanged(source: SelectionEventSourceType): void {
        this.eventSvc.dispatchEvent({
            type: 'selectionChanged',
            source,
        });
    }

    // should only be called if groupSelectsChildren=true
    public updateGroupsFromChildrenSelections?(source: SelectionEventSourceType, changedPath?: ChangedPath): boolean;

    public abstract setNodesSelected(params: ISetNodesSelectedParams): number;

    public abstract updateSelectableAfterGrouping(changedPath?: ChangedPath): void;

    protected abstract updateSelectable(changedPath?: ChangedPath): void;

    protected isRowSelectionBlocked(rowNode: RowNode): boolean {
        if (!_isRowSelection(this.gos)) {
            _warn(132);
            return false;
        }
        return !rowNode.selectable || !!rowNode.rowPinned;
    }

    public updateRowSelectable(rowNode: RowNode, suppressSelectionUpdate?: boolean): boolean {
        const selectable = this.isRowSelectable?.(rowNode) ?? true;
        this.setRowSelectable(rowNode, selectable, suppressSelectionUpdate);
        return selectable;
    }

    protected setRowSelectable(rowNode: RowNode, newVal: boolean, suppressSelectionUpdate?: boolean): void {
        if (rowNode.selectable !== newVal) {
            rowNode.selectable = newVal;
            rowNode.dispatchRowEvent('selectableChanged');

            if (suppressSelectionUpdate) {
                return;
            }

            const isGroupSelectsChildren = _getGroupSelectsDescendants(this.gos);
            if (isGroupSelectsChildren) {
                const selected = this.calculateSelectedFromChildren(rowNode);
                this.setSelectedParams({ rowNode, newValue: selected ?? false, source: 'selectableChanged' });
                return;
            }

            // if row is selected but shouldn't be selectable, then deselect.
            if (rowNode.isSelected() && !rowNode.selectable) {
                this.setSelectedParams({ rowNode, newValue: false, source: 'selectableChanged' });
            }
        }
    }

    // + selectionController.calculatedSelectedForAllGroupNodes()
    protected calculateSelectedFromChildren(rowNode: RowNode): boolean | undefined | null {
        let atLeastOneSelected = false;
        let atLeastOneDeSelected = false;

        if (!rowNode.childrenAfterGroup?.length) {
            return rowNode.selectable ? rowNode.__selected : null;
        }

        for (let i = 0; i < rowNode.childrenAfterGroup.length; i++) {
            const child = rowNode.childrenAfterGroup[i];

            let childState = child.isSelected();
            // non-selectable nodes must be calculated from their children, or ignored if no value results.
            if (!child.selectable) {
                const selectable = this.calculateSelectedFromChildren(child);
                if (selectable === null) {
                    continue;
                }
                childState = selectable;
            }

            switch (childState) {
                case true:
                    atLeastOneSelected = true;
                    break;
                case false:
                    atLeastOneDeSelected = true;
                    break;
                default:
                    return undefined;
            }
        }

        if (atLeastOneSelected && atLeastOneDeSelected) {
            return undefined;
        }

        if (atLeastOneSelected) {
            return true;
        }

        if (atLeastOneDeSelected) {
            return false;
        }

        if (!rowNode.selectable) {
            return null;
        }

        return rowNode.__selected;
    }

    public selectRowNode(
        rowNode: RowNode,
        newValue?: boolean,
        e?: Event,
        source: SelectionEventSourceType = 'api'
    ): boolean {
        // we only check selectable when newValue=true (ie selecting) to allow unselecting values,
        // as selectable is dynamic, need a way to unselect rows when selectable becomes false.
        const selectionNotAllowed = !rowNode.selectable && newValue;
        const selectionNotChanged = rowNode.__selected === newValue;

        if (selectionNotAllowed || selectionNotChanged) {
            return false;
        }

        rowNode.__selected = newValue;

        rowNode.dispatchRowEvent('rowSelected');

        // in case of root node, sibling may have service while this row may not
        const sibling = rowNode.sibling;
        if (sibling && sibling.footer && sibling.__localEventService) {
            sibling.dispatchRowEvent('rowSelected');
        }

        this.eventSvc.dispatchEvent({
            ..._createGlobalRowEvent(rowNode, this.gos, 'rowSelected'),
            event: e || null,
            source,
        });

        return true;
    }

    public setSelectedParams(params: SetSelectedParams & { event?: Event }): number {
        const { rowNode } = params;
        if (rowNode.rowPinned) {
            _warn(59);
            return 0;
        }

        if (rowNode.id === undefined) {
            _warn(60);
            return 0;
        }

        return this.setNodesSelected({ ...params, nodes: [rowNode.footer ? rowNode.sibling : rowNode] });
    }

    public isCellCheckboxSelection(column: AgColumn, rowNode: IRowNode): boolean {
        const so = this.gos.get('rowSelection');

        if (so && typeof so !== 'string') {
            const checkbox = isColumnSelectionCol(column) && _getCheckboxes(so);
            return column.isColumnFunc(rowNode, checkbox);
        } else {
            return column.isColumnFunc(rowNode, column.colDef.checkboxSelection);
        }
    }
}
