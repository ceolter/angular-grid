import type { Tuple } from '../iSimpleFilter';
import type { OptionsFactory } from '../optionsFactory';
import type { SimpleFilterHelper } from '../simpleFilterHelper';
import { getNumberOfInputs } from '../simpleFilterUtils';
import type { TextFilterModel } from './iTextFilter';
import { DEFAULT_TEXT_FILTER_OPTIONS } from './textFilterConstants';

export class TextFilterHelper implements SimpleFilterHelper<TextFilterModel, string> {
    public readonly defaultOptions = DEFAULT_TEXT_FILTER_OPTIONS;

    public mapValuesFromModel(filterModel: TextFilterModel | null, optionsFactory: OptionsFactory): Tuple<string> {
        const { filter, filterTo, type } = filterModel || {};
        return [filter || null, filterTo || null].slice(0, getNumberOfInputs(type, optionsFactory));
    }
}
