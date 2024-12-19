import type { Comparator } from '../iScalarFilter';
import { ScalarFilterEvaluator } from '../scalarFilterEvaluator';
import type { INumberFilterParams, NumberFilterModel } from './iNumberFilter';
import { NumberFilterHelper } from './numberFilterHelper';

export class NumberFilterEvaluator extends ScalarFilterEvaluator<NumberFilterModel, number, INumberFilterParams> {
    constructor() {
        super(new NumberFilterHelper());
    }

    protected override comparator(): Comparator<number> {
        return (left: number, right: number): number => {
            if (left === right) {
                return 0;
            }

            return left < right ? 1 : -1;
        };
    }

    protected override isValid(value: number): boolean {
        return !isNaN(value);
    }
}
