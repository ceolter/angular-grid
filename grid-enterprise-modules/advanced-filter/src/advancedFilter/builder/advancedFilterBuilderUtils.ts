import { AutocompleteEntry } from "@ag-grid-community/core";
import { ADVANCED_FILTER_LOCALE_TEXT } from '../advancedFilterLocaleText';
import { AddDropdownCompParams } from "./addDropdownComp";

export function getAdvancedFilterBuilderAddButtonParams(translate: (key: keyof typeof ADVANCED_FILTER_LOCALE_TEXT) => string, maxPickerWidth?: number): AddDropdownCompParams {
    return {
        pickerAriaLabelKey: 'ariaLabelAdvancedFilterBuilderAddField',
        pickerAriaLabelValue: 'Advanced Filter Builder Add Field',
        pickerType: 'ag-list',
        valueList: [{
            key: 'condition',
            displayValue: translate('advancedFilterBuilderAddCondition')
        }, {
            key: 'join',
            displayValue: translate('advancedFilterBuilderAddJoin')
        }],
        valueFormatter: (value: AutocompleteEntry) => value == null ? null : value.displayValue ?? value.key,
        pickerIcon: 'advancedFilterBuilderAdd',
        maxPickerWidth: `${maxPickerWidth ?? 120}px`,
        wrapperClassName: 'ag-advanced-filter-builder-item-button'
    };
}
