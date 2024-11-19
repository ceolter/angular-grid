import type { IFilterOptionDef } from '../../interfaces/iFilter';
import { _warn } from '../../validation/logging';
import type { ScalarFilterParams } from './iScalarFilter';
import type { SimpleFilterParams } from './iSimpleFilter';

/* Common logic for options, used by both filters and floating filters. */
export class OptionsFactory {
    protected customFilterOptions: { [name: string]: IFilterOptionDef } = {};
    public filterOptions: (IFilterOptionDef | string)[];
    public defaultOption: string;

    public init(params: ScalarFilterParams, defaultOptions: string[]): void {
        this.filterOptions = params.filterOptions || defaultOptions;
        this.mapCustomOptions();
        this.selectDefaultItem(params);
    }

    private mapCustomOptions(): void {
        const { filterOptions } = this;
        if (!filterOptions) {
            return;
        }

        filterOptions.forEach((filterOption) => {
            if (typeof filterOption === 'string') {
                return;
            }

            const requiredProperties = [['displayKey'], ['displayName'], ['predicate', 'test']];
            const propertyCheck = (keys: [keyof IFilterOptionDef]) => {
                if (!keys.some((key) => filterOption[key] != null)) {
                    _warn(72, { keys });
                    return false;
                }

                return true;
            };

            if (!requiredProperties.every(propertyCheck)) {
                this.filterOptions = filterOptions.filter((v) => v === filterOption) || [];
                return;
            }

            this.customFilterOptions[filterOption.displayKey] = filterOption;
        });
    }

    private selectDefaultItem(params: SimpleFilterParams): void {
        const { filterOptions } = this;
        if (params.defaultOption) {
            this.defaultOption = params.defaultOption;
        } else if (filterOptions.length >= 1) {
            const firstFilterOption = filterOptions[0];

            if (typeof firstFilterOption === 'string') {
                this.defaultOption = firstFilterOption;
            } else if (firstFilterOption.displayKey) {
                this.defaultOption = firstFilterOption.displayKey;
            } else {
                // invalid FilterOptionDef supplied as it doesn't contain a 'displayKey
                _warn(73);
            }
        } else {
            //no filter options for filter
            _warn(74);
        }
    }

    public getCustomOption(name?: string | null): IFilterOptionDef | undefined {
        return this.customFilterOptions[name!];
    }
}
