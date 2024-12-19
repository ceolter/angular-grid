import { _warn } from '../../validation/logging';
import type { AgInputTextField } from '../../widgets/agInputTextField';
import type { Comparator, ScalarFilterParams } from './iScalarFilter';
import type { ISimpleFilterModel, ISimpleFilterModelType, Tuple } from './iSimpleFilter';
import { SimpleFilter } from './simpleFilter';
import { isBlank } from './simpleFilterUtils';

export abstract class ScalarFilter<M extends ISimpleFilterModel, V, E = AgInputTextField> extends SimpleFilter<
    M,
    V,
    E
> {
    private scalarFilterParams: ScalarFilterParams;

    protected abstract comparator(): Comparator<V>;

    protected abstract isValid(value: V): boolean;

    protected override setParams(params: ScalarFilterParams): void {
        super.setParams(params);
        this.scalarFilterParams = params;
    }

    protected evaluateNullValue(filterType?: ISimpleFilterModelType | null) {
        const {
            includeBlanksInEquals,
            includeBlanksInNotEqual,
            includeBlanksInGreaterThan,
            includeBlanksInLessThan,
            includeBlanksInRange,
        } = this.scalarFilterParams;
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

    protected evaluateNonNullValue(values: Tuple<V>, cellValue: V, filterModel: M): boolean {
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

                return this.scalarFilterParams.inRangeInclusive
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
