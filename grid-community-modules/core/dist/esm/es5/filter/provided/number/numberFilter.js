var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
import { SimpleFilter, SimpleFilterModelFormatter } from '../simpleFilter';
import { ScalarFilter } from '../scalarFilter';
import { makeNull } from '../../../utils/generic';
import { AgInputTextField } from '../../../widgets/agInputTextField';
import { setAriaRole } from '../../../utils/aria';
import { AgInputNumberField } from '../../../widgets/agInputNumberField';
var NumberFilterModelFormatter = /** @class */ (function (_super) {
    __extends(NumberFilterModelFormatter, _super);
    function NumberFilterModelFormatter() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    NumberFilterModelFormatter.prototype.conditionToString = function (condition, options) {
        var numberOfInputs = (options || {}).numberOfInputs;
        var isRange = condition.type == SimpleFilter.IN_RANGE || numberOfInputs === 2;
        if (isRange) {
            return "".concat(this.formatValue(condition.filter), "-").concat(this.formatValue(condition.filterTo));
        }
        // cater for when the type doesn't need a value
        if (condition.filter != null) {
            return this.formatValue(condition.filter);
        }
        return "".concat(condition.type);
    };
    return NumberFilterModelFormatter;
}(SimpleFilterModelFormatter));
export { NumberFilterModelFormatter };
export function getAllowedCharPattern(filterParams) {
    var allowedCharPattern = (filterParams !== null && filterParams !== void 0 ? filterParams : {}).allowedCharPattern;
    return allowedCharPattern !== null && allowedCharPattern !== void 0 ? allowedCharPattern : null;
}
var NumberFilter = /** @class */ (function (_super) {
    __extends(NumberFilter, _super);
    function NumberFilter() {
        var _this = _super.call(this, 'numberFilter') || this;
        _this.eValuesFrom = [];
        _this.eValuesTo = [];
        return _this;
    }
    NumberFilter.prototype.refresh = function (params) {
        if (this.numberFilterParams.allowedCharPattern !== params.allowedCharPattern) {
            return false;
        }
        return _super.prototype.refresh.call(this, params);
    };
    NumberFilter.prototype.mapValuesFromModel = function (filterModel) {
        var _a = filterModel || {}, filter = _a.filter, filterTo = _a.filterTo, type = _a.type;
        return [
            this.processValue(filter),
            this.processValue(filterTo),
        ].slice(0, this.getNumberOfInputs(type));
    };
    NumberFilter.prototype.getDefaultDebounceMs = function () {
        return 500;
    };
    NumberFilter.prototype.comparator = function () {
        return function (left, right) {
            if (left === right) {
                return 0;
            }
            return left < right ? 1 : -1;
        };
    };
    NumberFilter.prototype.setParams = function (params) {
        this.numberFilterParams = params;
        _super.prototype.setParams.call(this, params);
        this.filterModelFormatter = new NumberFilterModelFormatter(this.localeService, this.optionsFactory, this.numberFilterParams.numberFormatter);
    };
    NumberFilter.prototype.getDefaultFilterOptions = function () {
        return NumberFilter.DEFAULT_FILTER_OPTIONS;
    };
    NumberFilter.prototype.setElementValue = function (element, value, fromFloatingFilter) {
        // values from floating filter are directly from the input, not from the model
        var valueToSet = !fromFloatingFilter && this.numberFilterParams.numberFormatter
            ? this.numberFilterParams.numberFormatter(value !== null && value !== void 0 ? value : null)
            : value;
        _super.prototype.setElementValue.call(this, element, valueToSet);
    };
    NumberFilter.prototype.createValueElement = function () {
        var allowedCharPattern = getAllowedCharPattern(this.numberFilterParams);
        var eCondition = document.createElement('div');
        eCondition.classList.add('ag-filter-body');
        setAriaRole(eCondition, 'presentation');
        this.createFromToElement(eCondition, this.eValuesFrom, 'from', allowedCharPattern);
        this.createFromToElement(eCondition, this.eValuesTo, 'to', allowedCharPattern);
        return eCondition;
    };
    NumberFilter.prototype.createFromToElement = function (eCondition, eValues, fromTo, allowedCharPattern) {
        var eValue = this.createManagedBean(allowedCharPattern ? new AgInputTextField({ allowedCharPattern: allowedCharPattern }) : new AgInputNumberField());
        eValue.addCssClass("ag-filter-".concat(fromTo));
        eValue.addCssClass('ag-filter-filter');
        eValues.push(eValue);
        eCondition.appendChild(eValue.getGui());
    };
    NumberFilter.prototype.removeValueElements = function (startPosition, deleteCount) {
        this.removeComponents(this.eValuesFrom, startPosition, deleteCount);
        this.removeComponents(this.eValuesTo, startPosition, deleteCount);
    };
    NumberFilter.prototype.getValues = function (position) {
        var _this = this;
        var result = [];
        this.forEachPositionInput(position, function (element, index, _elPosition, numberOfInputs) {
            if (index < numberOfInputs) {
                result.push(_this.processValue(_this.stringToFloat(element.getValue())));
            }
        });
        return result;
    };
    NumberFilter.prototype.areSimpleModelsEqual = function (aSimple, bSimple) {
        return aSimple.filter === bSimple.filter
            && aSimple.filterTo === bSimple.filterTo
            && aSimple.type === bSimple.type;
    };
    NumberFilter.prototype.getFilterType = function () {
        return 'number';
    };
    NumberFilter.prototype.processValue = function (value) {
        if (value == null) {
            return null;
        }
        return isNaN(value) ? null : value;
    };
    NumberFilter.prototype.stringToFloat = function (value) {
        if (typeof value === 'number') {
            return value;
        }
        var filterText = makeNull(value);
        if (filterText != null && filterText.trim() === '') {
            filterText = null;
        }
        if (this.numberFilterParams.numberParser) {
            return this.numberFilterParams.numberParser(filterText);
        }
        return filterText == null || filterText.trim() === '-' ? null : parseFloat(filterText);
    };
    NumberFilter.prototype.createCondition = function (position) {
        var type = this.getConditionType(position);
        var model = {
            filterType: this.getFilterType(),
            type: type
        };
        var values = this.getValues(position);
        if (values.length > 0) {
            model.filter = values[0];
        }
        if (values.length > 1) {
            model.filterTo = values[1];
        }
        return model;
    };
    NumberFilter.prototype.getInputs = function (position) {
        if (position >= this.eValuesFrom.length) {
            return [null, null];
        }
        return [this.eValuesFrom[position], this.eValuesTo[position]];
    };
    NumberFilter.prototype.getModelAsString = function (model) {
        var _a;
        return (_a = this.filterModelFormatter.getModelAsString(model)) !== null && _a !== void 0 ? _a : '';
    };
    NumberFilter.prototype.hasInvalidInputs = function () {
        var invalidInputs = false;
        this.forEachInput(function (element) {
            if (!element.getInputElement().validity.valid) {
                invalidInputs = true;
                return;
            }
        });
        return invalidInputs;
    };
    NumberFilter.DEFAULT_FILTER_OPTIONS = [
        ScalarFilter.EQUALS,
        ScalarFilter.NOT_EQUAL,
        ScalarFilter.GREATER_THAN,
        ScalarFilter.GREATER_THAN_OR_EQUAL,
        ScalarFilter.LESS_THAN,
        ScalarFilter.LESS_THAN_OR_EQUAL,
        ScalarFilter.IN_RANGE,
        ScalarFilter.BLANK,
        ScalarFilter.NOT_BLANK,
    ];
    return NumberFilter;
}(ScalarFilter));
export { NumberFilter };

//# sourceMappingURL=numberFilter.js.map
