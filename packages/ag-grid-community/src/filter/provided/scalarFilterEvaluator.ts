import { _warn } from '../../validation/logging';
import type { Comparator, IScalarFilterParams } from './iScalarFilter';
import type { ISimpleFilterModel, ISimpleFilterModelType, Tuple } from './iSimpleFilter';
import { SimpleFilterEvaluator } from './simpleFilterEvaluator';
import { isBlank } from './simpleFilterUtils';

export abstract class ScalarFilterEvaluator<
    TModel extends ISimpleFilterModel,
    TValue,
    TParams extends IScalarFilterParams,
> extends SimpleFilterEvaluator<TModel, TValue, TParams> {
    protected abstract comparator(): Comparator<TValue>;

    protected abstract isValid(value: TValue): boolean;

    protected evaluateNullValue(filterType?: ISimpleFilterModelType | null) {
        const {
            includeBlanksInEquals,
            includeBlanksInNotEqual,
            includeBlanksInGreaterThan,
            includeBlanksInLessThan,
            includeBlanksInRange,
        } = this.params;
        switch (filterType) {
            case 'equals':
                if (includeBlanksInEquals) {
                    return true;
                }
                break;
            case 'notEqual':
                if (includeBlanksInNotEqual) {
                    return true;
                }
                break;
            case 'greaterThan':
            case 'greaterThanOrEqual':
                if (includeBlanksInGreaterThan) {
                    return true;
                }
                break;

            case 'lessThan':
            case 'lessThanOrEqual':
                if (includeBlanksInLessThan) {
                    return true;
                }
                break;
            case 'inRange':
                if (includeBlanksInRange) {
                    return true;
                }
                break;
            case 'blank':
                return true;
            case 'notBlank':
                return false;
        }

        return false;
    }

    protected evaluateNonNullValue(values: Tuple<TValue>, cellValue: TValue, filterModel: TModel): boolean {
        const type = filterModel.type;
        if (!this.isValid(cellValue)) {
            return type === 'notEqual' || type === 'notBlank';
        }

        const comparator = this.comparator();
        const compareResult = values[0] != null ? comparator(values[0]!, cellValue) : 0;

        switch (type) {
            case 'equals':
                return compareResult === 0;

            case 'notEqual':
                return compareResult !== 0;

            case 'greaterThan':
                return compareResult > 0;

            case 'greaterThanOrEqual':
                return compareResult >= 0;

            case 'lessThan':
                return compareResult < 0;

            case 'lessThanOrEqual':
                return compareResult <= 0;

            case 'inRange': {
                const compareToResult = comparator(values[1]!, cellValue);

                return this.params.inRangeInclusive
                    ? compareResult >= 0 && compareToResult <= 0
                    : compareResult > 0 && compareToResult < 0;
            }

            case 'blank':
                return isBlank(cellValue);

            case 'notBlank':
                return !isBlank(cellValue);

            default:
                _warn(76, { filterModelType: type });
                return true;
        }
    }
}
