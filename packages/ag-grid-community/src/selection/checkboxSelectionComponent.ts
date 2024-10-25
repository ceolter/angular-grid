import type { AgColumn } from '../entities/agColumn';
import type { CheckboxSelectionCallback } from '../entities/colDef';
import type { RowNode } from '../entities/rowNode';
import {
    _getCheckboxes,
    _getGroupSelection,
    _getHideDisabledCheckboxes,
    _getIsRowSelectable,
    _isClientSideRowModel,
} from '../gridOptionsUtils';
import type { GroupCheckboxSelectionCallback } from '../interfaces/groupCellRenderer';
import { _getAriaCheckboxStateName } from '../utils/aria';
import { _stopPropagationForAgGrid } from '../utils/event';
import type { AgCheckbox } from '../widgets/agCheckbox';
import { AgCheckboxSelector } from '../widgets/agCheckbox';
import { Component, RefPlaceholder } from '../widgets/component';

export class CheckboxSelectionComponent extends Component {
    private readonly eCheckbox: AgCheckbox = RefPlaceholder;

    private rowNode: RowNode;
    private column: AgColumn | undefined;
    private overrides?: {
        isVisible: boolean | CheckboxSelectionCallback | GroupCheckboxSelectionCallback | undefined;
        callbackParams: any;
        removeHidden: boolean;
    };

    constructor() {
        super(
            /* html*/ `
            <div class="ag-selection-checkbox" role="presentation">
                <ag-checkbox role="presentation" data-ref="eCheckbox"></ag-checkbox>
            </div>`,
            [AgCheckboxSelector]
        );
    }

    public postConstruct(): void {
        this.eCheckbox.setPassive(true);
    }

    public getCheckboxId(): string {
        return this.eCheckbox.getInputElement().id;
    }

    private onDataChanged(): void {
        // when rows are loaded for the second time, this can impact the selection, as a row
        // could be loaded as already selected (if user scrolls down, and then up again).
        this.onSelectionChanged();
    }

    private onSelectableChanged(): void {
        this.showOrHideSelect();
    }

    private onSelectionChanged(): void {
        const translate = this.getLocaleTextFunc();
        const state = this.rowNode.isSelected();
        const stateName = _getAriaCheckboxStateName(translate, state);
        const [ariaKey, ariaLabel] = this.rowNode.selectable
            ? ['ariaRowToggleSelection', 'Press Space to toggle row selection']
            : ['ariaRowSelectionDisabled', 'Row Selection is disabled for this row'];
        const translatedLabel = translate(ariaKey, ariaLabel);

        this.eCheckbox.setValue(state, true);
        this.eCheckbox.setInputAriaLabel(`${translatedLabel} (${stateName})`);
    }

    private onClicked(newValue: boolean, groupSelectsFiltered: boolean | undefined, event: MouseEvent): number {
        return (
            this.beans.selectionSvc?.setSelectedParams({
                rowNode: this.rowNode,
                newValue,
                rangeSelect: event.shiftKey,
                groupSelectsFiltered,
                event,
                source: 'checkboxSelected',
            }) ?? 0
        );
    }

    public init(params: {
        rowNode: RowNode;
        column?: AgColumn;
        overrides?: {
            isVisible: boolean | CheckboxSelectionCallback | GroupCheckboxSelectionCallback | undefined;
            callbackParams: any;
            removeHidden: boolean;
        };
    }): void {
        this.rowNode = params.rowNode;
        this.column = params.column;
        this.overrides = params.overrides;

        this.onSelectionChanged();

        this.addManagedListeners(this.eCheckbox.getInputElement(), {
            // we don't want double click on this icon to open a group
            dblclick: (event) => _stopPropagationForAgGrid(event),
            click: (event) => {
                // we don't want the row clicked event to fire when selecting the checkbox, otherwise the row
                // would possibly get selected twice
                _stopPropagationForAgGrid(event);

                const groupSelectsFiltered = _getGroupSelection(this.gos) === 'filteredDescendants';
                const isSelected = this.eCheckbox.getValue();

                if (this.shouldHandleIndeterminateState(isSelected, groupSelectsFiltered)) {
                    // try toggling children to determine action.
                    const result = this.onClicked(true, groupSelectsFiltered, event || {});
                    if (result === 0) {
                        this.onClicked(false, groupSelectsFiltered, event);
                    }
                } else if (isSelected) {
                    this.onClicked(false, groupSelectsFiltered, event);
                } else {
                    this.onClicked(true, groupSelectsFiltered, event || {});
                }
            },
        });

        this.addManagedListeners(this.rowNode, {
            rowSelected: this.onSelectionChanged.bind(this),
            dataChanged: this.onDataChanged.bind(this),
            selectableChanged: this.onSelectableChanged.bind(this),
        });

        const isRowSelectableFunc = _getIsRowSelectable(this.gos);
        const checkboxVisibleIsDynamic = isRowSelectableFunc || typeof this.getIsVisible() === 'function';

        if (checkboxVisibleIsDynamic) {
            const showOrHideSelectListener = this.showOrHideSelect.bind(this);
            this.addManagedEventListeners({ displayedColumnsChanged: showOrHideSelectListener });

            this.addManagedListeners(this.rowNode, {
                dataChanged: showOrHideSelectListener,
                cellChanged: showOrHideSelectListener,
            });

            this.showOrHideSelect();
        }

        this.eCheckbox.getInputElement().setAttribute('tabindex', '-1');
    }

    private shouldHandleIndeterminateState(isSelected: boolean | undefined, groupSelectsFiltered: boolean): boolean {
        // for CSRM groupSelectsFiltered, we can get an indeterminate state where all filtered children are selected,
        // and we would expect clicking to deselect all rather than select all
        return (
            groupSelectsFiltered &&
            (this.eCheckbox.getPreviousValue() === undefined || isSelected === undefined) &&
            _isClientSideRowModel(this.gos)
        );
    }

    private showOrHideSelect(): void {
        // if the isRowSelectable() is not provided the row node is selectable by default
        let selectable = this.rowNode.selectable;

        // checkboxSelection callback is deemed a legacy solution however we will still consider it's result.
        // If selectable, then also check the colDef callback. if not selectable, this it short circuits - no need
        // to call the colDef callback.
        const isVisible = this.getIsVisible();
        if (selectable) {
            if (typeof isVisible === 'function') {
                const extraParams = this.overrides?.callbackParams;

                if (!this.column) {
                    // full width row
                    selectable = isVisible({ ...extraParams, node: this.rowNode, data: this.rowNode.data });
                } else {
                    const params = this.column.createColumnFunctionCallbackParams(this.rowNode);
                    selectable = isVisible({ ...extraParams, ...params });
                }
            } else {
                selectable = isVisible ?? false;
            }
        }

        const so = this.gos.get('rowSelection');
        const disableInsteadOfHide =
            so && typeof so !== 'string'
                ? !_getHideDisabledCheckboxes(so)
                : this.column?.getColDef().showDisabledCheckboxes;
        if (disableInsteadOfHide) {
            this.eCheckbox.setDisabled(!selectable);
            this.setVisible(true);
            this.setDisplayed(true);
            return;
        }

        if (this.overrides?.removeHidden) {
            this.setDisplayed(selectable);
            return;
        }

        this.setVisible(selectable);
    }

    private getIsVisible(): boolean | CheckboxSelectionCallback<any> | undefined {
        if (this.overrides) {
            return this.overrides.isVisible;
        }

        const so = this.gos.get('rowSelection');
        if (so && typeof so !== 'string') {
            return _getCheckboxes(so);
        }

        // column will be missing if groupDisplayType = 'groupRows'
        return this.column?.getColDef()?.checkboxSelection;
    }
}
