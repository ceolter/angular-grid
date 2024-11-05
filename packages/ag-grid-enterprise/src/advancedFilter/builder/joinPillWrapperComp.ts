import type { BeanCollection, JoinAdvancedFilterModel } from 'ag-grid-community';
import { Component } from 'ag-grid-community';

import type { AdvancedFilterExpressionService } from '../advancedFilterExpressionService';
import type {
    AdvancedFilterBuilderEvents,
    AdvancedFilterBuilderItem,
    CreatePillParams,
} from './iAdvancedFilterBuilder';
import type { InputPillComp } from './inputPillComp';
import type { SelectPillComp } from './selectPillComp';

export class JoinPillWrapperComp extends Component<AdvancedFilterBuilderEvents> {
    private advFilterExpSvc: AdvancedFilterExpressionService;

    public wireBeans(beans: BeanCollection): void {
        this.advFilterExpSvc = beans.advFilterExpSvc as AdvancedFilterExpressionService;
    }

    private filterModel: JoinAdvancedFilterModel;
    private ePill: SelectPillComp | InputPillComp;

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
        const filterModel = item.filterModel as JoinAdvancedFilterModel;
        this.filterModel = filterModel;

        this.ePill = createPill({
            key: filterModel.type,
            displayValue: this.advFilterExpSvc.parseJoinOperator(filterModel),
            cssClass: 'ag-advanced-filter-builder-join-pill',
            isSelect: true,
            getEditorParams: () => ({
                values: this.advFilterExpSvc.getJoinOperatorAutocompleteEntries(),
            }),
            update: (key) => (filterModel.type = key as any),
            pickerAriaLabelKey: 'ariaLabelAdvancedFilterBuilderJoinSelectField',
            pickerAriaLabelValue: 'Advanced Filter Builder Join Operator Select Field',
            ariaLabel: this.advFilterExpSvc.translate('ariaAdvancedFilterBuilderJoinOperator'),
        });
        this.getGui().appendChild(this.ePill.getGui());
        this.addDestroyFunc(() => this.destroyBean(this.ePill));
    }

    public getDragName(): string {
        return this.advFilterExpSvc.parseJoinOperator(this.filterModel);
    }

    public getAriaLabel(): string {
        return `${this.advFilterExpSvc.translate('ariaAdvancedFilterBuilderGroupItem')} ${this.getDragName()}`;
    }

    public getValidationMessage(): string | null {
        return null;
    }

    public override getFocusableElement(): HTMLElement {
        return this.ePill.getFocusableElement();
    }
}
