import type { IFilterOptionDef } from '../../../interfaces/iFilter';
import { SimpleFilterModelFormatter } from '../simpleFilterModelFormatter';
import type { NumberFilterModel } from './iNumberFilter';

export class NumberFilterModelFormatter extends SimpleFilterModelFormatter<number> {
    protected conditionToString(condition: NumberFilterModel, options?: IFilterOptionDef): string {
        const { numberOfInputs } = options || {};
        const { filter, filterTo, type } = condition;

        const isRange = type == 'inRange' || numberOfInputs === 2;
        const formatValue = this.formatValue.bind(this);

        if (isRange) {
            return `${formatValue(filter)}-${formatValue(filterTo)}`;
        }

        // cater for when the type doesn't need a value
        if (filter != null) {
            return formatValue(filter);
        }

        return `${type}`;
    }
}
