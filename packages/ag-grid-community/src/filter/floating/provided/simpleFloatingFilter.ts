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
    // this method is on IFloatingFilterComp. because it's not implemented at this level, we have to
    // define it as an abstract method. it gets implemented in sub classes.
    public abstract onParentModelChanged(model: ProvidedFilterModel, event: FilterChangedEvent): void;

    protected abstract getDefaultOptions(): string[];
    protected abstract setEditable(editable: boolean): void;

    protected abstract filterModelFormatter: SimpleFilterModelFormatter;

    protected lastType: string | null | undefined;
    protected optionsFactory: OptionsFactory;
    protected readOnly: boolean;
    protected defaultDebounceMs: number = 0;

    protected setLastTypeFromModel(model: ProvidedFilterModel): void {
        // if no model provided by the parent filter use default
        if (!model) {
            this.lastType = this.optionsFactory.defaultOption;
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
        const optionsFactory = new OptionsFactory();
        this.optionsFactory = optionsFactory;
        optionsFactory.init(params.filterParams as ScalarFilterParams, this.getDefaultOptions());

        const defaultOption = optionsFactory.defaultOption;
        // Initial call
        if (!update) {
            this.lastType = defaultOption;
        }

        // readOnly is a property of ProvidedFilterParams - we need to find a better (type-safe)
        // way to support reading this in the future.
        this.readOnly = !!(params.filterParams as ProvidedFilterParams).readOnly;

        // we are editable if:
        // 1) there is a type (user has configured filter wrong if not type)
        //  AND
        // 2) the default type is not 'inRange'
        const editable = this.isTypeEditable(defaultOption);
        this.setEditable(editable);
    }

    public refresh(params: IFloatingFilterParams): void {
        this.setSimpleParams(params);
    }

    private hasSingleInput(filterType: string) {
        const numberOfInputs = this.optionsFactory.getCustomOption(filterType)?.numberOfInputs;
        return numberOfInputs == null || numberOfInputs == 1;
    }

    private isTypeEditable(type?: string | null): boolean {
        const uneditableTypes: ISimpleFilterModelType[] = ['inRange', 'empty', 'blank', 'notBlank'];
        return (
            !!type &&
            !this.readOnly &&
            this.hasSingleInput(type) &&
            uneditableTypes.indexOf(type as ISimpleFilterModelType) < 0
        );
    }

    protected getAriaLabel(params: IFloatingFilterParams): string {
        const displayName = this.beans.colNames.getDisplayNameForColumn(params.column as AgColumn, 'header', true);
        return `${displayName} ${this.getLocaleTextFunc()('ariaFilterInput', 'Filter Input')}`;
    }
}
