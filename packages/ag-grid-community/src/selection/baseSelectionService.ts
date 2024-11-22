import { isColumnSelectionCol } from '../columns/columnUtils';
import { BeanStub } from '../context/beanStub';
import type { AgColumn } from '../entities/agColumn';
import type { IsRowSelectable } from '../entities/gridOptions';
import type { RowNode } from '../entities/rowNode';
import { _createGlobalRowEvent } from '../entities/rowNodeUtils';
import type { SelectionEventSourceType } from '../events';
import {
    _getActiveDomElement,
    _getCheckboxes,
    _getEnableDeselection,
    _getEnableSelection,
    _getEnableSelectionWithoutKeys,
    _getGroupSelection,
    _getGroupSelectsDescendants,
    _getIsRowSelectable,
    _isClientSideRowModel,
    _isMultiRowSelection,
    _isRowSelection,
} from '../gridOptionsUtils';
import type { IRowNode } from '../interfaces/iRowNode';
import type { ISetNodesSelectedParams } from '../interfaces/iSelectionService';
import type { RowCtrl, RowGui } from '../rendering/row/rowCtrl';
import { _setAriaSelected } from '../utils/aria';
import type { ChangedPath } from '../utils/changedPath';
import { _warn } from '../validation/logging';
import { CheckboxSelectionComponent } from './checkboxSelectionComponent';
import { RowRangeSelectionContext } from './rowRangeSelectionContext';
import { SelectAllFeature } from './selectAllFeature';

export abstract class BaseSelectionService extends BeanStub {
    protected isRowSelectable?: IsRowSelectable;
    protected selectionCtx: RowRangeSelectionContext;

    public postConstruct(): void {
        const { gos, beans } = this;
        this.selectionCtx = new RowRangeSelectionContext(beans.rowModel);

        this.addManagedPropertyListeners(['isRowSelectable', 'rowSelection'], () => {
            const callback = _getIsRowSelectable(gos);
            if (callback !== this.isRowSelectable) {
                this.isRowSelectable = callback;
                this.updateSelectable();
            }
        });

        this.isRowSelectable = _getIsRowSelectable(gos);
    }

    public override destroy(): void {
        super.destroy();
        this.selectionCtx.reset();
    }

    public createCheckboxSelectionComponent(): CheckboxSelectionComponent {
        return new CheckboxSelectionComponent();
    }

    public createSelectAllFeature(column: AgColumn): SelectAllFeature {
        return new SelectAllFeature(column);
    }

    protected isMultiSelect(): boolean {
        return _isMultiRowSelection(this.gos);
    }

    public onRowCtrlSelected(rowCtrl: RowCtrl, hasFocusFunc: (gui: RowGui) => void, gui?: RowGui): void {
        // Treat undefined as false, if we pass undefined down it gets treated as toggle class, rather than explicitly
        // setting the required value
        const selected = !!rowCtrl.rowNode.isSelected();
        rowCtrl.forEachGui(gui, (gui) => {
            gui.rowComp.addOrRemoveCssClass('ag-row-selected', selected);
            const element = gui.element;
            _setAriaSelected(element, selected);

            const hasFocus = element.contains(_getActiveDomElement(this.beans));
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

        this.beans.ariaAnnounce?.announceValue(label, 'rowSelection');
    }

    protected dispatchSelectionChanged(source: SelectionEventSourceType): void {
        this.eventSvc.dispatchEvent({
            type: 'selectionChanged',
            source,
        });
    }

    public updateGroupsFromChildrenSelections?(source: SelectionEventSourceType, changedPath?: ChangedPath): boolean;

    public abstract setNodesSelected(params: ISetNodesSelectedParams): number;

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
                this.setNodesSelected({ nodes: [rowNode], newValue: selected ?? false, source: 'selectableChanged' });
                return;
            }

            // if row is selected but shouldn't be selectable, then deselect.
            if (rowNode.isSelected() && !rowNode.selectable) {
                this.setNodesSelected({ nodes: [rowNode], newValue: false, source: 'selectableChanged' });
            }
        }
    }

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

    public isCellCheckboxSelection(column: AgColumn, rowNode: IRowNode): boolean {
        const so = this.gos.get('rowSelection');

        if (so && typeof so !== 'string') {
            const checkbox = isColumnSelectionCol(column) && _getCheckboxes(so);
            return column.isColumnFunc(rowNode, checkbox);
        } else {
            return column.isColumnFunc(rowNode, column.colDef.checkboxSelection);
        }
    }

    protected inferNodeSelections(
        node: RowNode,
        shiftKey: boolean,
        metaKey: boolean,
        source: SelectionEventSourceType
    ): null | NodeSelection {
        const { gos, selectionCtx } = this;
        const currentSelection = node.isSelected();
        const groupSelectsDescendants = _getGroupSelectsDescendants(gos);
        const enableClickSelection = _getEnableSelection(gos);
        const enableDeselection = _getEnableDeselection(gos);
        const isRowClicked = source === 'rowClicked';

        // we do not allow selecting the group by clicking, when groupSelectChildren, as the logic to
        // handle this is broken. to observe, change the logic below and allow groups to be selected.
        // you will see the group gets selected, then all children get selected, then the grid unselects
        // the children (as the default behaviour when clicking is to unselect other rows) which results
        // in the group getting unselected (as all children are unselected). the correct thing would be
        // to change this, so that children of the selected group are not then subsequently un-selected.
        if (isRowClicked && groupSelectsDescendants && node.group) return null;

        if (isRowClicked && !(enableClickSelection || enableDeselection)) return null;

        if (shiftKey && metaKey && this.isMultiSelect()) {
            // SHIFT+CTRL or SHIFT+CMD is used for bulk deselection, except where the selection root
            // is still selected, in which case we default to normal bulk selection behaviour
            const root = selectionCtx.getRoot();
            if (root && !root.isSelected()) {
                // range deselection mode
                const partition = selectionCtx.extend(node, groupSelectsDescendants);
                return {
                    select: [],
                    deselect: partition.keep,
                    reset: false,
                };
            } else {
                // default to range selection
                const partition = selectionCtx.isInRange(node)
                    ? selectionCtx.truncate(node)
                    : selectionCtx.extend(node, groupSelectsDescendants);
                return {
                    deselect: partition.discard,
                    select: partition.keep,
                    reset: false,
                };
            }
        } else if (shiftKey && this.isMultiSelect()) {
            // SHIFT is used for bulk selection
            const root = selectionCtx.getRoot();
            const partition = selectionCtx.isInRange(node)
                ? selectionCtx.truncate(node)
                : selectionCtx.extend(node, groupSelectsDescendants);
            return {
                select: partition.keep,
                deselect: partition.discard,
                reset: !!(root && !root.isSelected()),
            };
        } else if (metaKey) {
            // CTRL is used for deselection of a single node
            selectionCtx.setRoot(node);

            if (isRowClicked && currentSelection && !enableDeselection) {
                return null;
            }

            return {
                node,
                newValue: currentSelection ? false : true,
                clearSelection: !this.isMultiSelect(),
            };
        } else {
            // Otherwise we just do normal selection of a single node
            selectionCtx.setRoot(node);
            const enableSelectionWithoutKeys = _getEnableSelectionWithoutKeys(gos);
            const groupSelectsFiltered = _getGroupSelection(gos) === 'filteredDescendants';
            const shouldClear = isRowClicked && (!enableSelectionWithoutKeys || !enableClickSelection);

            // Indeterminate states need to be handled differently if `groupSelects: 'filteredDescendants'` in CSRM.
            // Specifically, clicking should toggle them _off_ instead of _on_
            if (groupSelectsFiltered && currentSelection === undefined && _isClientSideRowModel(gos)) {
                return {
                    node,
                    newValue: false,
                    clearSelection: !this.isMultiSelect() || shouldClear,
                };
            }

            if (isRowClicked) {
                const newValue = currentSelection ? !enableSelectionWithoutKeys : enableClickSelection;
                if (newValue === currentSelection) return null;

                return {
                    node,
                    newValue,
                    clearSelection: !this.isMultiSelect() || shouldClear,
                };
            }

            return {
                node,
                newValue: !currentSelection,
                clearSelection: !this.isMultiSelect() || shouldClear,
            };
        }
    }
}

interface SingleNodeSelection {
    node: RowNode;
    newValue: boolean;
    clearSelection: boolean;
}

interface MultiNodeSelection {
    select: readonly RowNode[];
    deselect: readonly RowNode[];
    reset: boolean;
}
type NodeSelection = SingleNodeSelection | MultiNodeSelection;
