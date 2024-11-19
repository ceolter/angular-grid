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
        const { eCheckbox, beans } = this;
        const inputEl = eCheckbox.getInputElement();
        inputEl.setAttribute('tabindex', '-1');
        _setAriaLive(inputEl, 'polite');

        this.addManagedListeners(inputEl, {
            click: (event: Event) => {
                _stopPropagationForAgGrid(event);

                if (eCheckbox.isDisabled()) {
                    return;
                }

                const isSelected = eCheckbox.getValue();

                this.onCheckboxChanged(isSelected);
            },
            dblclick: (event: Event) => {
                _stopPropagationForAgGrid(event);
            },
        });

        this.addManagedElementListeners(params.eGridCell, {
            keydown: (event: KeyboardEvent) => {
                if (event.key === KeyCode.SPACE && !eCheckbox.isDisabled()) {
                    if (params.eGridCell === _getActiveDomElement(beans)) {
                        eCheckbox.toggle();
                    }
                    const isSelected = eCheckbox.getValue();
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
        const { value, column, node } = params;
        if (node.group && column) {
            if (typeof value === 'boolean') {
                isSelected = value;
            } else {
                const colId = column.getColId();
                if (colId.startsWith(GROUP_AUTO_COLUMN_ID)) {
                    // if we're grouping by this column then the value is a string and we need to parse it
                    isSelected = value == null || (value as any) === '' ? undefined : (value as any) === 'true';
                } else if (node.aggData && node.aggData[colId] !== undefined) {
                    isSelected = value ?? undefined;
                } else {
                    displayed = false;
                }
            }
        } else {
            isSelected = value ?? undefined;
        }
        const { eCheckbox } = this;
        if (!displayed) {
            eCheckbox.setDisplayed(false);
            return;
        }
        eCheckbox.setValue(isSelected);
        const disabled = params.disabled ?? !column?.isCellEditable(node);
        eCheckbox.setDisabled(disabled);

        const translate = this.getLocaleTextFunc();
        const stateName = _getAriaCheckboxStateName(translate, isSelected);
        const ariaLabel = disabled
            ? stateName
            : `${translate('ariaToggleCellValue', 'Press SPACE to toggle cell value')} (${stateName})`;
        eCheckbox.setInputAriaLabel(ariaLabel);
    }

    private onCheckboxChanged(isSelected?: boolean): void {
        const { eventSvc, params } = this;
        const { column, node, value } = params;
        const sharedEventParams = {
            column: column!,
            colDef: column!.getColDef(),
            data: node.data,
            node,
            rowIndex: node.rowIndex,
            rowPinned: node.rowPinned,
            value,
        };
        eventSvc.dispatchEvent({
            type: 'cellEditingStarted',
            ...sharedEventParams,
        });

        const valueChanged = node.setDataValue(column!, isSelected, 'edit');

        eventSvc.dispatchEvent({
            type: 'cellEditingStopped',
            ...sharedEventParams,
            oldValue: value,
            newValue: isSelected,
            valueChanged,
        });

        if (!valueChanged) {
            // need to reset to original
            this.updateCheckbox(params);
        }
    }
}
