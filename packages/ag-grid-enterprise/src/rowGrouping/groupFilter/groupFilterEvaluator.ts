import type { FilterEvaluator, FilterEvaluatorParams, FilterModelValidation, IFilterParams } from 'ag-grid-community';
import { BeanStub } from 'ag-grid-community';

export class GroupFilterEvaluator extends BeanStub implements FilterEvaluator<any, any, any, null, IFilterParams> {
    public init(
        params: FilterEvaluatorParams<any, any, any, null> & IFilterParams<any, any>
    ): FilterModelValidation<null> {
        return this.validateModel(params);
    }

    public refresh?(
        params: FilterEvaluatorParams<any, any, any, null> & IFilterParams<any, any>
    ): FilterModelValidation<null> {
        return this.validateModel(params);
    }

    public doesFilterPass(): boolean {
        // filters should only be evaluated on the child columns
        return true;
    }

    private validateModel(
        params: FilterEvaluatorParams<any, any, any, null> & IFilterParams<any, any>
    ): FilterModelValidation<null> {
        // model should always be null
        if (params.model != null) {
            return {
                valid: false,
                model: null,
            };
        }
        return { valid: true };
    }
}
