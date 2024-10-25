import { BeanStub } from '../context/beanStub';
import type { BeanCollection } from '../context/context';
import type { AgColumn } from '../entities/agColumn';
import type { IsRowSelectable } from '../entities/gridOptions';
import type { RowNode } from '../entities/rowNode';
import { _createGlobalRowEvent } from '../entities/rowNodeUtils';
import type { SelectionEventSourceType } from '../events';
import {
    _getActiveDomElement,
    _getEnableDeselection,
    _getEnableSelection,
    _getEnableSelectionWithoutKeys,
    _getGroupSelectsDescendants,
    _getIsRowSelectable,
    _isRowSelection,
} from '../gridOptionsUtils';
import type { IRowModel } from '../interfaces/iRowModel';
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
    private ariaAnnounce: AriaAnnouncementService;

    protected isRowSelectable?: IsRowSelectable;

    public wireBeans(beans: BeanCollection) {
        this.rowModel = beans.rowModel;
        this.ariaAnnounce = beans.ariaAnnounce;
    }

    public postConstruct(): void {
        this.addManagedPropertyListeners(['isRowSelectable', 'rowSelection'], () => {
            const callback = _getIsRowSelectable(this.gos);
            if (callback !== this.isRowSelectable) {
                this.isRowSelectable = callback;
                this.updateSelectable();
            }
        });

        this.isRowSelectable = _getIsRowSelectable(this.gos);
    }

    public createCheckboxSelectionComponent(): CheckboxSelectionComponent {
        return new CheckboxSelectionComponent();
    }

    public createSelectAllFeature(column: AgColumn): SelectAllFeature {
        return new SelectAllFeature(column);
    }

    public handleRowClick(rowNode: RowNode, mouseEvent: MouseEvent): void {
        const { gos } = this;

        // ctrlKey for windows, metaKey for Apple
        const isMultiKey = mouseEvent.ctrlKey || mouseEvent.metaKey;
        const isShiftKey = mouseEvent.shiftKey;

        const isSelected = rowNode.isSelected();

        // we do not allow selecting the group by clicking, when groupSelectChildren, as the logic to
        // handle this is broken. to observe, change the logic below and allow groups to be selected.
        // you will see the group gets selected, then all children get selected, then the grid unselects
        // the children (as the default behaviour when clicking is to unselect other rows) which results
        // in the group getting unselected (as all children are unselected). the correct thing would be
        // to change this, so that children of the selected group are not then subsequently un-selected.
        const groupSelectsChildren = _getGroupSelectsDescendants(gos);
        const rowDeselectionWithCtrl = _getEnableDeselection(gos);
        const rowClickSelection = _getEnableSelection(gos);
        if (
            // we do not allow selecting groups by clicking (as the click here expands the group), or if it's a detail row,
            // so return if it's a group row
            (groupSelectsChildren && rowNode.group) ||
            this.isRowSelectionBlocked(rowNode) ||
            // if selecting and click selection disabled, do nothing
            (!rowClickSelection && !isSelected) ||
            // if deselecting and click deselection disabled, do nothing
            (!rowDeselectionWithCtrl && isSelected)
        ) {
            return;
        }

        const multiSelectOnClick = _getEnableSelectionWithoutKeys(gos);
        const source = 'rowClicked';

        if (isSelected) {
            if (multiSelectOnClick) {
                this.setSelectedParams({ rowNode, newValue: false, event: mouseEvent, source });
            } else if (isMultiKey) {
                if (rowDeselectionWithCtrl) {
                    this.setSelectedParams({ rowNode, newValue: false, event: mouseEvent, source });
                }
            } else if (rowClickSelection) {
                // selected with no multi key, must make sure anything else is unselected
                this.setSelectedParams({
                    rowNode,
                    newValue: true,
                    clearSelection: !isShiftKey,
                    rangeSelect: isShiftKey,
                    event: mouseEvent,
                    source,
                });
            }
        } else {
            const clearSelection = multiSelectOnClick ? false : !isMultiKey;
            this.setSelectedParams({
                rowNode,
                newValue: true,
                clearSelection: clearSelection,
                rangeSelect: isShiftKey,
                event: mouseEvent,
                source,
            });
        }
    }

    public onRowCtrlSelected(rowCtrl: RowCtrl, hasFocusFunc: (gui: RowGui) => void, gui?: RowGui): void {
        // Treat undefined as false, if we pass undefined down it gets treated as toggle class, rather than explicitly
        // setting the required value
        const selected = !!rowCtrl.getRowNode().isSelected();
        rowCtrl.forEachGui(gui, (gui) => {
            gui.rowComp.addOrRemoveCssClass('ag-row-selected', selected);
            _setAriaSelected(gui.element, selected);

            const hasFocus = gui.element.contains(_getActiveDomElement(this.gos));
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

        this.ariaAnnounce.announceValue(label, 'rowSelection');
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

    private isRowSelectionBlocked(rowNode: RowNode): boolean {
        return !rowNode.selectable || !!rowNode.rowPinned || !_isRowSelection(this.gos);
    }

    public checkRowSelectable(rowNode: RowNode): void {
        const isRowSelectableFunc = _getIsRowSelectable(this.gos);
        this.setRowSelectable(rowNode, isRowSelectableFunc ? isRowSelectableFunc!(rowNode) : true);
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
}
