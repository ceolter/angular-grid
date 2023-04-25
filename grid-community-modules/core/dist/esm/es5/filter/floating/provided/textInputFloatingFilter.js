/**
 * @ag-grid-community/core - Advanced Data Grid / Data Table supporting Javascript / Typescript / React / Angular / Vue
 * @version v29.3.3
 * @link https://www.ag-grid.com/
 * @license MIT
 */
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { RefSelector } from '../../../widgets/componentAnnotations';
import { debounce } from '../../../utils/function';
import { ProvidedFilter } from '../../provided/providedFilter';
import { PostConstruct, Autowired } from '../../../context/context';
import { SimpleFloatingFilter } from './simpleFloatingFilter';
import { AgInputTextField } from '../../../widgets/agInputTextField';
import { KeyCode } from '../../../constants/keyCode';
import { TextFilter } from '../../provided/text/textFilter';
import { BeanStub } from '../../../context/beanStub';
var FloatingFilterTextInputService = /** @class */ (function (_super) {
    __extends(FloatingFilterTextInputService, _super);
    function FloatingFilterTextInputService(params) {
        var _this = _super.call(this) || this;
        _this.params = params;
        return _this;
    }
    FloatingFilterTextInputService.prototype.setupGui = function (parentElement) {
        this.eFloatingFilterTextInput = this.createManagedBean(new AgInputTextField(this.params.config));
        this.eFloatingFilterTextInput.setInputAriaLabel(this.params.ariaLabel);
        parentElement.appendChild(this.eFloatingFilterTextInput.getGui());
    };
    FloatingFilterTextInputService.prototype.setEditable = function (editable) {
        this.eFloatingFilterTextInput.setDisabled(!editable);
    };
    FloatingFilterTextInputService.prototype.getValue = function () {
        return this.eFloatingFilterTextInput.getValue();
    };
    FloatingFilterTextInputService.prototype.setValue = function (value, silent) {
        this.eFloatingFilterTextInput.setValue(value, silent);
    };
    FloatingFilterTextInputService.prototype.addValueChangedListener = function (listener) {
        var inputGui = this.eFloatingFilterTextInput.getGui();
        this.addManagedListener(inputGui, 'input', listener);
        this.addManagedListener(inputGui, 'keypress', listener);
        this.addManagedListener(inputGui, 'keydown', listener);
    };
    return FloatingFilterTextInputService;
}(BeanStub));
export { FloatingFilterTextInputService };
var TextInputFloatingFilter = /** @class */ (function (_super) {
    __extends(TextInputFloatingFilter, _super);
    function TextInputFloatingFilter() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    TextInputFloatingFilter.prototype.postConstruct = function () {
        this.setTemplate(/* html */ "\n            <div class=\"ag-floating-filter-input\" role=\"presentation\" ref=\"eFloatingFilterInputContainer\"></div>\n        ");
    };
    TextInputFloatingFilter.prototype.getDefaultDebounceMs = function () {
        return 500;
    };
    TextInputFloatingFilter.prototype.onParentModelChanged = function (model, event) {
        if (this.isEventFromFloatingFilter(event) || this.isEventFromDataChange(event)) {
            // if the floating filter triggered the change, it is already in sync.
            // Data changes also do not affect provided text floating filters
            return;
        }
        this.setLastTypeFromModel(model);
        this.setEditable(this.canWeEditAfterModelFromParentFilter(model));
        this.floatingFilterInputService.setValue(this.getFilterModelFormatter().getModelAsString(model));
    };
    TextInputFloatingFilter.prototype.init = function (params) {
        this.params = params;
        var displayName = this.columnModel.getDisplayNameForColumn(params.column, 'header', true);
        var translate = this.localeService.getLocaleTextFunc();
        var ariaLabel = displayName + " " + translate('ariaFilterInput', 'Filter Input');
        this.floatingFilterInputService = this.createFloatingFilterInputService(ariaLabel);
        this.floatingFilterInputService.setupGui(this.eFloatingFilterInputContainer);
        _super.prototype.init.call(this, params);
        this.applyActive = ProvidedFilter.isUseApplyButton(this.params.filterParams);
        if (!this.isReadOnly()) {
            var debounceMs = ProvidedFilter.getDebounceMs(this.params.filterParams, this.getDefaultDebounceMs());
            var toDebounce = debounce(this.syncUpWithParentFilter.bind(this), debounceMs);
            this.floatingFilterInputService.addValueChangedListener(toDebounce);
        }
    };
    TextInputFloatingFilter.prototype.syncUpWithParentFilter = function (e) {
        var _this = this;
        var enterKeyPressed = e.key === KeyCode.ENTER;
        if (this.applyActive && !enterKeyPressed) {
            return;
        }
        var value = this.floatingFilterInputService.getValue();
        if (this.params.filterParams.trimInput) {
            value = TextFilter.trimInput(value);
            this.floatingFilterInputService.setValue(value, true); // ensure visible value is trimmed
        }
        this.params.parentFilterInstance(function (filterInstance) {
            if (filterInstance) {
                // NumberFilter is typed as number, but actually receives string values
                filterInstance.onFloatingFilterChanged(_this.getLastType() || null, value || null);
            }
        });
    };
    TextInputFloatingFilter.prototype.setEditable = function (editable) {
        this.floatingFilterInputService.setEditable(editable);
    };
    __decorate([
        Autowired('columnModel')
    ], TextInputFloatingFilter.prototype, "columnModel", void 0);
    __decorate([
        RefSelector('eFloatingFilterInputContainer')
    ], TextInputFloatingFilter.prototype, "eFloatingFilterInputContainer", void 0);
    __decorate([
        PostConstruct
    ], TextInputFloatingFilter.prototype, "postConstruct", null);
    return TextInputFloatingFilter;
}(SimpleFloatingFilter));
export { TextInputFloatingFilter };
