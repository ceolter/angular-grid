import type { Tuple } from '../iSimpleFilter';
import type { OptionsFactory } from '../optionsFactory';
import type { SimpleFilterHelper } from '../simpleFilterHelper';
import { getNumberOfInputs } from '../simpleFilterUtils';
import type { NumberFilterModel } from './iNumberFilter';
import { DEFAULT_NUMBER_FILTER_OPTIONS } from './numberFilterConstants';
import { processNumberFilterValue } from './numberFilterUtils';

export class NumberFilterHelper implements SimpleFilterHelper<NumberFilterModel, number> {
    public readonly defaultOptions = DEFAULT_NUMBER_FILTER_OPTIONS;

    public mapValuesFromModel(filterModel: NumberFilterModel | null, optionsFactory: OptionsFactory): Tuple<number> {
        const { filter, filterTo, type } = filterModel || {};
        return [processNumberFilterValue(filter), processNumberFilterValue(filterTo)].slice(
            0,
            getNumberOfInputs(type, optionsFactory)
        );
    }
}
