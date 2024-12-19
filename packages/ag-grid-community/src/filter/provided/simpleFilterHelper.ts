import type { ISimpleFilterModel, Tuple } from './iSimpleFilter';
import type { OptionsFactory } from './optionsFactory';

export interface SimpleFilterHelper<TModel extends ISimpleFilterModel, TValue> {
    readonly defaultOptions: string[];

    mapValuesFromModel(filterModel: TModel | null, optionsFactory: OptionsFactory): Tuple<TValue>;
}
