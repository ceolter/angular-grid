import type { IFilterOptionDef } from '../../../interfaces/iFilter';
import { SimpleFilterModelFormatter } from '../simpleFilterModelFormatter';
import type { TextFilterModel } from './iTextFilter';

export class TextFilterModelFormatter extends SimpleFilterModelFormatter {
    protected conditionToString(condition: TextFilterModel, options?: IFilterOptionDef): string {
        const { numberOfInputs } = options || {};
        const { filter, filterTo, type } = condition;

        const isRange = type == 'inRange' || numberOfInputs === 2;

        if (isRange) {
            return `${filter}-${filterTo}`;
        }

        // cater for when the type doesn't need a value
        if (filter != null) {
            return `${filter}`;
        }

        return `${type}`;
    }
}
