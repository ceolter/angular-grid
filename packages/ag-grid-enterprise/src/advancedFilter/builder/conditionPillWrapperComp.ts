import type { AgColumn, BaseCellDataType, BeanCollection, ColumnAdvancedFilterModel } from 'ag-grid-community';
import { Component, _exists, _removeFromParent } from 'ag-grid-community';

import type { AdvancedFilterExpressionService } from '../advancedFilterExpressionService';
import type { AutocompleteEntry } from '../autocomplete/autocompleteParams';
import type {
    AdvancedFilterBuilderEvents,
    AdvancedFilterBuilderItem,
    CreatePillParams,
} from './iAdvancedFilterBuilder';
import type { InputPillComp } from './inputPillComp';
import type { SelectPillComp } from './selectPillComp';

export class ConditionPillWrapperComp extends Component<AdvancedFilterBuilderEvents> {
    private advFilterExpSvc: AdvancedFilterExpressionService;

    public wireBeans(beans: BeanCollection) {
        this.advFilterExpSvc = beans.advFilterExpSvc as AdvancedFilterExpressionService;
    }

    private item: AdvancedFilterBuilderItem;
    private createPill: (params: CreatePillParams) => SelectPillComp | InputPillComp;
    private filterModel: ColumnAdvancedFilterModel;
    private baseCellDataType: BaseCellDataType;
    private column: AgColumn | undefined;
    private numOperands: number;
    private eColumnPill: SelectPillComp | InputPillComp;
    private eOperatorPill: SelectPillComp | InputPillComp | undefined;
    private eOperandPill: SelectPillComp | InputPillComp | undefined;
    private validationMessage: string | null = null;

    constructor() {
        super(/* html */ `
            <div class="ag-advanced-filter-builder-item-condition" role="presentation"></div>
        `);
    }

    public init(params: {
        item: AdvancedFilterBuilderItem;
        createPill: (params: CreatePillParams) => SelectPillComp | InputPillComp;
    }): void {
        const { item, createPill } = params;
        this.item = item;
        this.createPill = createPill;
        this.filterModel = item.filterModel as ColumnAdvancedFilterModel;
        this.setupColumnCondition(this.filterModel);
        this.validate();

        this.addDestroyFunc(() => this.destroyBeans([this.eColumnPill, this.eOperatorPill, this.eOperandPill]));
    }

    public getDragName(): string {
        return this.filterModel.colId
            ? this.advFilterExpSvc.parseColumnFilterModel(this.filterModel)
            : this.getDefaultColumnDisplayValue();
    }

    public getAriaLabel(): string {
        return `${this.advFilterExpSvc.translate('ariaAdvancedFilterBuilderFilterItem')} ${this.getDragName()}`;
    }

    public getValidationMessage(): string | null {
        return this.validationMessage;
    }

    public override getFocusableElement(): HTMLElement {
        return this.eColumnPill.getFocusableElement();
    }

    private setupColumnCondition(filterModel: ColumnAdvancedFilterModel): void {
        const columnDetails = this.advFilterExpSvc.getColumnDetails(filterModel.colId);
        this.baseCellDataType = columnDetails.baseCellDataType;
        this.column = columnDetails.column;
        this.numOperands = this.getNumOperands(this.getOperatorKey());

        this.eColumnPill = this.createPill({
            key: this.getColumnKey(),
            displayValue: this.getColumnDisplayValue() ?? this.getDefaultColumnDisplayValue(),
            cssClass: 'ag-advanced-filter-builder-column-pill',
            isSelect: true,
            getEditorParams: () => ({ values: this.advFilterExpSvc.getColumnAutocompleteEntries() }),
            update: (key) => this.setColumnKey(key),
            pickerAriaLabelKey: 'ariaLabelAdvancedFilterBuilderColumnSelectField',
            pickerAriaLabelValue: 'Advanced Filter Builder Column Select Field',
            ariaLabel: this.advFilterExpSvc.translate('ariaAdvancedFilterBuilderColumn'),
        });
        this.getGui().appendChild(this.eColumnPill.getGui());

        if (_exists(this.getColumnKey())) {
            this.createOperatorPill();
            if (this.hasOperand()) {
                this.createOperandPill();
            }
        }
    }

    private createOperatorPill(): void {
        this.eOperatorPill = this.createPill({
            key: this.getOperatorKey(),
            displayValue: this.getOperatorDisplayValue() ?? this.getDefaultOptionSelectValue(),
            cssClass: 'ag-advanced-filter-builder-option-pill',
            isSelect: true,
            getEditorParams: () => ({ values: this.getOperatorAutocompleteEntries() }),
            update: (key) => this.setOperatorKey(key),
            pickerAriaLabelKey: 'ariaLabelAdvancedFilterBuilderOptionSelectField',
            pickerAriaLabelValue: 'Advanced Filter Builder Option Select Field',
            ariaLabel: this.advFilterExpSvc.translate('ariaAdvancedFilterBuilderOption'),
        });
        this.eColumnPill.getGui().insertAdjacentElement('afterend', this.eOperatorPill.getGui());
    }

    private createOperandPill(): void {
        const key = this.getOperandDisplayValue() ?? '';
        this.eOperandPill = this.createPill({
            key,
            displayValue: key,
            baseCellDataType: this.baseCellDataType,
            cssClass: 'ag-advanced-filter-builder-value-pill',
            isSelect: false,
            update: (key) => this.setOperand(key),
            ariaLabel: this.advFilterExpSvc.translate('ariaAdvancedFilterBuilderValue'),
        });
        this.getGui().appendChild(this.eOperandPill.getGui());
    }

    private getColumnKey(): string {
        return this.filterModel.colId;
    }

    private getColumnDisplayValue(): string | undefined {
        return this.advFilterExpSvc.getColumnDisplayValue(this.filterModel);
    }

    private getOperatorKey(): string {
        return this.filterModel.type;
    }

    private getOperatorDisplayValue(): string | undefined {
        return this.advFilterExpSvc.getOperatorDisplayValue(this.filterModel);
    }

    private getOperandDisplayValue(): string {
        return this.advFilterExpSvc.getOperandDisplayValue(this.filterModel, true);
    }

    private hasOperand(): boolean {
        return this.numOperands > 0;
    }

    private getOperatorAutocompleteEntries(): AutocompleteEntry[] {
        return this.column
            ? this.advFilterExpSvc.getOperatorAutocompleteEntries(this.column, this.baseCellDataType)
            : [];
    }

    private setColumnKey(colId: string): void {
        if (!this.eOperatorPill) {
            this.createOperatorPill();
        }

        const newColumnDetails = this.advFilterExpSvc.getColumnDetails(colId);
        this.column = newColumnDetails.column;
        const newBaseCellDataType = newColumnDetails.baseCellDataType;
        if (this.baseCellDataType !== newBaseCellDataType) {
            this.baseCellDataType = newBaseCellDataType;

            this.setOperatorKey(undefined as any);
            if (this.eOperatorPill) {
                _removeFromParent(this.eOperatorPill.getGui());
                this.destroyBean(this.eOperatorPill);
                this.createOperatorPill();
            }
            this.validate();
        }
        this.filterModel.colId = colId;
        this.filterModel.filterType = this.baseCellDataType;
    }

    private setOperatorKey(operator: string): void {
        const newNumOperands = this.getNumOperands(operator);
        if (newNumOperands !== this.numOperands) {
            this.numOperands = newNumOperands;
            if (newNumOperands === 0) {
                this.destroyOperandPill();
            } else {
                this.createOperandPill();
                if (this.baseCellDataType !== 'number') {
                    this.setOperand('');
                }
            }
        }
        this.filterModel.type = operator as any;
        this.validate();
    }

    private setOperand(operand: string): void {
        let parsedOperand: string | number = operand;
        if (this.column) {
            parsedOperand =
                this.advFilterExpSvc.getOperandModelValue(operand, this.baseCellDataType, this.column) ?? '';
        }
        (this.filterModel as any).filter = parsedOperand;
        this.validate();
    }

    private getNumOperands(operator: string): number {
        return this.advFilterExpSvc.getExpressionOperator(this.baseCellDataType, operator)?.numOperands ?? 0;
    }

    private destroyOperandPill(): void {
        delete (this.filterModel as any).filter;
        this.getGui().removeChild(this.eOperandPill!.getGui());
        this.destroyBean(this.eOperandPill);
        this.eOperandPill = undefined;
    }

    private validate(): void {
        let validationMessage = null;
        if (!_exists(this.getColumnKey())) {
            validationMessage = this.advFilterExpSvc.translate('advancedFilterBuilderValidationSelectColumn');
        } else if (!_exists(this.getOperatorKey())) {
            validationMessage = this.advFilterExpSvc.translate('advancedFilterBuilderValidationSelectOption');
        } else if (this.numOperands > 0 && !_exists(this.getOperandDisplayValue())) {
            validationMessage = this.advFilterExpSvc.translate('advancedFilterBuilderValidationEnterValue');
        }

        this.item.valid = !validationMessage;
        if (validationMessage !== this.validationMessage) {
            this.validationMessage = validationMessage;
            this.dispatchLocalEvent({
                type: 'advancedFilterBuilderValidChanged',
            });
        }
    }

    private getDefaultColumnDisplayValue(): string {
        return this.advFilterExpSvc.translate('advancedFilterBuilderSelectColumn');
    }

    private getDefaultOptionSelectValue(): string {
        return this.advFilterExpSvc.translate('advancedFilterBuilderSelectOption');
    }
}
