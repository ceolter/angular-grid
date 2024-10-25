import { GROUP_AUTO_COLUMN_ID } from '../../columns/columnUtils';
import { KeyCode } from '../../constants/keyCode';
import { _getActiveDomElement } from '../../gridOptionsUtils';
import { _getAriaCheckboxStateName, _setAriaLive } from '../../utils/aria';
import { _stopPropagationForAgGrid } from '../../utils/event';
import type { AgCheckbox } from '../../widgets/agCheckbox';
import { AgCheckboxSelector } from '../../widgets/agCheckbox';
import { Component, RefPlaceholder } from '../../widgets/component';
import { checkboxCellRendererCSS } from './checkboxCellRenderer.css-GENERATED';
import type { ICellRenderer, ICellRendererParams } from './iCellRenderer';

export interface ICheckboxCellRendererParams<TData = any, TContext = any>
    extends ICellRendererParams<TData, boolean, TContext> {
    /** Set to `true` for the input to be disabled. */
    disabled?: boolean;
}

export class CheckboxCellRenderer extends Component implements ICellRenderer {
    private readonly eCheckbox: AgCheckbox = RefPlaceholder;
    private params: ICheckboxCellRendererParams;

    constructor() {
        super(
            /* html*/ `
            <div class="ag-cell-wrapper ag-checkbox-cell" role="presentation">
                <ag-checkbox role="presentation" data-ref="eCheckbox"></ag-checkbox>
            </div>`,
            [AgCheckboxSelector]
        );
        this.registerCSS(checkboxCellRendererCSS);
    }

    public init(params: ICheckboxCellRendererParams): void {
        this.refresh(params);
        const inputEl = this.eCheckbox.getInputElement();
        inputEl.setAttribute('tabindex', '-1');
        _setAriaLive(inputEl, 'polite');

        this.addManagedListeners(inputEl, {
            click: (event: Event) => {
                _stopPropagationForAgGrid(event);

                if (this.eCheckbox.isDisabled()) {
                    return;
                }

                const isSelected = this.eCheckbox.getValue();

                this.onCheckboxChanged(isSelected);
            },
            dblclick: (event: Event) => {
                _stopPropagationForAgGrid(event);
            },
        });

        this.addManagedElementListeners(this.params.eGridCell, {
            keydown: (event: KeyboardEvent) => {
                if (event.key === KeyCode.SPACE && !this.eCheckbox.isDisabled()) {
                    if (this.params.eGridCell === _getActiveDomElement(this.gos)) {
                        this.eCheckbox.toggle();
                    }
                    const isSelected = this.eCheckbox.getValue();
                    this.onCheckboxChanged(isSelected);
                    event.preventDefault();
                }
            },
        });
    }

    public refresh(params: ICheckboxCellRendererParams): boolean {
        this.params = params;
        this.updateCheckbox(params);
        return true;
    }

    private updateCheckbox(params: ICheckboxCellRendererParams): void {
        let isSelected: boolean | undefined;
        let displayed = true;
        if (params.node.group && params.column) {
            if (typeof params.value === 'boolean') {
                isSelected = params.value;
            } else {
                const colId = params.column.getColId();
                if (colId.startsWith(GROUP_AUTO_COLUMN_ID)) {
                    // if we're grouping by this column then the value is a string and we need to parse it
                    isSelected =
                        params.value == null || (params.value as any) === ''
                            ? undefined
                            : (params.value as any) === 'true';
                } else if (params.node.aggData && params.node.aggData[colId] !== undefined) {
                    isSelected = params.value ?? undefined;
                } else {
                    displayed = false;
                }
            }
        } else {
            isSelected = params.value ?? undefined;
        }
        if (!displayed) {
            this.eCheckbox.setDisplayed(false);
            return;
        }
        this.eCheckbox.setValue(isSelected);
        const disabled = params.disabled != null ? params.disabled : !params.column?.isCellEditable(params.node);
        this.eCheckbox.setDisabled(disabled);

        const translate = this.getLocaleTextFunc();
        const stateName = _getAriaCheckboxStateName(translate, isSelected);
        const ariaLabel = disabled
            ? stateName
            : `${translate('ariaToggleCellValue', 'Press SPACE to toggle cell value')} (${stateName})`;
        this.eCheckbox.setInputAriaLabel(ariaLabel);
    }

    private onCheckboxChanged(isSelected?: boolean): void {
        const { column, node, value } = this.params;
        this.eventSvc.dispatchEvent({
            type: 'cellEditingStarted',
            column: column!,
            colDef: column!.getColDef(),
            data: node.data,
            node,
            rowIndex: node.rowIndex,
            rowPinned: node.rowPinned,
            value,
        });

        const valueChanged = this.params.node.setDataValue(this.params.column!, isSelected, 'edit');

        this.eventSvc.dispatchEvent({
            type: 'cellEditingStopped',
            column: column!,
            colDef: column!.getColDef(),
            data: node.data,
            node,
            rowIndex: node.rowIndex,
            rowPinned: node.rowPinned,
            value,
            oldValue: value,
            newValue: isSelected,
            valueChanged,
        });

        if (!valueChanged) {
            // need to reset to original
            this.updateCheckbox(this.params);
        }
    }
}
