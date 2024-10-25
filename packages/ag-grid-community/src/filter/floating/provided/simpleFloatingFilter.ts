import type { ColumnNameService } from '../../../columns/columnNameService';
import type { BeanCollection } from '../../../context/context';
import type { AgColumn } from '../../../entities/agColumn';
import type { FilterChangedEvent } from '../../../events';
import type { ProvidedFilterModel } from '../../../interfaces/iFilter';
import { Component } from '../../../widgets/component';
import type { ProvidedFilterParams } from '../../provided/iProvidedFilter';
import type { ScalarFilterParams } from '../../provided/iScalarFilter';
import type {
    ICombinedSimpleModel,
    ISimpleFilter,
    ISimpleFilterModel,
    ISimpleFilterModelType,
} from '../../provided/iSimpleFilter';
import { OptionsFactory } from '../../provided/optionsFactory';
import type { SimpleFilterModelFormatter } from '../../provided/simpleFilterModelFormatter';
import type { IFloatingFilterComp, IFloatingFilterParams } from '../floatingFilter';

export abstract class SimpleFloatingFilter extends Component implements IFloatingFilterComp<ISimpleFilter> {
    private colNames: ColumnNameService;

    public wireBeans(beans: BeanCollection): void {
        this.colNames = beans.colNames;
    }

    // this method is on IFloatingFilterComp. because it's not implemented at this level, we have to
    // define it as an abstract method. it gets implemented in sub classes.
    public abstract onParentModelChanged(model: ProvidedFilterModel, event: FilterChangedEvent): void;

    protected abstract getDefaultFilterOptions(): string[];
    protected abstract setEditable(editable: boolean): void;

    protected abstract getFilterModelFormatter(): SimpleFilterModelFormatter;

    private lastType: string | null | undefined;

    protected optionsFactory: OptionsFactory;

    private readOnly: boolean;

    protected getDefaultDebounceMs(): number {
        return 0;
    }

    // this is a user component, and IComponent has "public destroy()" as part of the interface.
    // so we need to override destroy() just to make the method public.
    public override destroy(): void {
        super.destroy();
    }

    protected isEventFromFloatingFilter(event: FilterChangedEvent): boolean | undefined {
        return event && event.afterFloatingFilter;
    }

    protected isEventFromDataChange(event: FilterChangedEvent): boolean | undefined {
        return event?.afterDataChange;
    }

    protected getLastType(): string | null | undefined {
        return this.lastType;
    }

    protected isReadOnly(): boolean {
        return this.readOnly;
    }

    protected setLastTypeFromModel(model: ProvidedFilterModel): void {
        // if no model provided by the parent filter use default
        if (!model) {
            this.lastType = this.optionsFactory.getDefaultOption();
            return;
        }

        const isCombined = (model as any).operator;

        let condition: ISimpleFilterModel;

        if (isCombined) {
            const combinedModel = model as ICombinedSimpleModel<ISimpleFilterModel>;
            condition = combinedModel.conditions![0];
        } else {
            condition = model as ISimpleFilterModel;
        }

        this.lastType = condition.type;
    }

    protected canWeEditAfterModelFromParentFilter(model: ProvidedFilterModel): boolean {
        if (!model) {
            // if no model, then we can edit as long as the lastType is something we can edit, as this
            // is the type we will provide to the parent filter if the user decides to use the floating filter.
            return this.isTypeEditable(this.lastType);
        }

        // never allow editing if the filter is combined (ie has two parts)
        const isCombined = (model as any).operator;

        if (isCombined) {
            return false;
        }

        const simpleModel = model as ISimpleFilterModel;

        return this.isTypeEditable(simpleModel.type);
    }

    public init(params: IFloatingFilterParams): void {
        this.setSimpleParams(params, false);
    }

    private setSimpleParams(params: IFloatingFilterParams, update: boolean = true): void {
        this.optionsFactory = new OptionsFactory();
        this.optionsFactory.init(params.filterParams as ScalarFilterParams, this.getDefaultFilterOptions());

        // Initial call
        if (!update) {
            this.lastType = this.optionsFactory.getDefaultOption();
        }

        // readOnly is a property of ProvidedFilterParams - we need to find a better (type-safe)
        // way to support reading this in the future.
        this.readOnly = !!(params.filterParams as ProvidedFilterParams).readOnly;

        // we are editable if:
        // 1) there is a type (user has configured filter wrong if not type)
        //  AND
        // 2) the default type is not 'inRange'
        const editable = this.isTypeEditable(this.optionsFactory.getDefaultOption());
        this.setEditable(editable);
    }

    public refresh(params: IFloatingFilterParams): void {
        this.setSimpleParams(params);
    }

    private doesFilterHaveSingleInput(filterType: string) {
        const customFilterOption = this.optionsFactory.getCustomOption(filterType);
        const { numberOfInputs } = customFilterOption || {};
        return numberOfInputs == null || numberOfInputs == 1;
    }

    private isTypeEditable(type?: string | null): boolean {
        const uneditableTypes: ISimpleFilterModelType[] = ['inRange', 'empty', 'blank', 'notBlank'];
        return (
            !!type &&
            !this.isReadOnly() &&
            this.doesFilterHaveSingleInput(type) &&
            uneditableTypes.indexOf(type as ISimpleFilterModelType) < 0
        );
    }

    protected getAriaLabel(params: IFloatingFilterParams): string {
        const displayName = this.colNames.getDisplayNameForColumn(params.column as AgColumn, 'header', true);
        const translate = this.getLocaleTextFunc();
        return `${displayName} ${translate('ariaFilterInput', 'Filter Input')}`;
    }
}
