import type {
    FilterEvaluator,
    FilterEvaluatorFuncParams,
    FilterEvaluatorParams,
    IDoesFilterPassParams,
} from '../../interfaces/iFilter';
import type {
    ICombinedSimpleModel,
    ISimpleFilterModel,
    ISimpleFilterModelType,
    ISimpleFilterParams,
    Tuple,
} from './iSimpleFilter';
import { OptionsFactory } from './optionsFactory';
import type { SimpleFilterHelper } from './simpleFilterHelper';
import { evaluateCustomFilter } from './simpleFilterUtils';

export abstract class SimpleFilterEvaluator<
    TModel extends ISimpleFilterModel,
    TValue,
    TParams extends ISimpleFilterParams,
> implements FilterEvaluator<any, any, TValue, TModel | ICombinedSimpleModel<TModel>, TParams>
{
    protected params: FilterEvaluatorParams<any, any, TValue, TModel | ICombinedSimpleModel<TModel>> & TParams;
    private optionsFactory: OptionsFactory;

    constructor(private readonly helper: SimpleFilterHelper<TModel, TValue>) {}

    protected abstract evaluateNullValue(filterType?: ISimpleFilterModelType | null): boolean;

    protected abstract evaluateNonNullValue(
        range: Tuple<TValue>,
        cellValue: TValue,
        filterModel: TModel,
        params: IDoesFilterPassParams
    ): boolean;

    public init(
        params: FilterEvaluatorParams<any, any, TValue, TModel | ICombinedSimpleModel<TModel>> & TParams
    ): void {
        this.params = params;

        const optionsFactory = new OptionsFactory();
        this.optionsFactory = optionsFactory;
        optionsFactory.init(params, this.helper.defaultOptions);
    }

    public doesFilterPass(params: FilterEvaluatorFuncParams<any, TModel | ICombinedSimpleModel<TModel>>): boolean {
        const model = params.model;

        if (model == null) {
            return true;
        }

        const { operator } = model as ICombinedSimpleModel<TModel>;
        const models: TModel[] = [];

        if (operator) {
            const combinedModel = model as ICombinedSimpleModel<TModel>;

            models.push(...(combinedModel.conditions ?? []));
        } else {
            models.push(model as TModel);
        }

        const combineFunction = operator && operator === 'OR' ? 'some' : 'every';

        const cellValue = this.params.getValue(params.node);

        return models[combineFunction]((m) => this.individualConditionPasses(params, m, cellValue));
    }

    /** returns true if the row passes the said condition */
    private individualConditionPasses(params: IDoesFilterPassParams, filterModel: TModel, cellValue: any) {
        const optionsFactory = this.optionsFactory;
        const values = this.helper.mapValuesFromModel(filterModel, this.optionsFactory);
        const customFilterOption = optionsFactory.getCustomOption(filterModel.type);

        const customFilterResult = evaluateCustomFilter<TValue>(customFilterOption, values, cellValue);
        if (customFilterResult != null) {
            return customFilterResult;
        }

        if (cellValue == null) {
            return this.evaluateNullValue(filterModel.type);
        }

        return this.evaluateNonNullValue(values, cellValue, filterModel, params);
    }
}
