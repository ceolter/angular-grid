import type { Comparator } from '../iScalarFilter';
import { ScalarFilterEvaluator } from '../scalarFilterEvaluator';
import { DateFilterHelper } from './dateFilterHelper';
import type { DateFilterModel, IDateFilterParams } from './iDateFilter';

function defaultDateComparator(filterDate: Date, cellValue: any): number {
    // The default comparator assumes that the cellValue is a date
    const cellAsDate = cellValue as Date;

    if (cellAsDate < filterDate) {
        return -1;
    }
    if (cellAsDate > filterDate) {
        return 1;
    }

    return 0;
}

export class DateFilterEvaluator extends ScalarFilterEvaluator<DateFilterModel, Date, IDateFilterParams> {
    constructor() {
        super(new DateFilterHelper());
    }

    protected override comparator(): Comparator<Date> {
        return this.params.comparator ?? defaultDateComparator;
    }

    protected override isValid(value: Date): boolean {
        return value instanceof Date && !isNaN(value.getTime());
    }
}
