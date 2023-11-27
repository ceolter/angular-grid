"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SelectCellEditor = void 0;
const agSelect_1 = require("../../widgets/agSelect");
const context_1 = require("../../context/context");
const popupComponent_1 = require("../../widgets/popupComponent");
const componentAnnotations_1 = require("../../widgets/componentAnnotations");
const generic_1 = require("../../utils/generic");
const keyCode_1 = require("../../constants/keyCode");
class SelectCellEditor extends popupComponent_1.PopupComponent {
    constructor() {
        super(/* html */ `<div class="ag-cell-edit-wrapper">
                <ag-select class="ag-cell-editor" ref="eSelect"></ag-select>
            </div>`);
        this.startedByEnter = false;
    }
    init(params) {
        this.focusAfterAttached = params.cellStartedEdit;
        const { eSelect, valueFormatterService, gridOptionsService } = this;
        const { values, value, eventKey } = params;
        if ((0, generic_1.missing)(values)) {
            console.warn('AG Grid: no values found for select cellEditor');
            return;
        }
        this.startedByEnter = eventKey != null ? eventKey === keyCode_1.KeyCode.ENTER : false;
        let hasValue = false;
        values.forEach((currentValue) => {
            const option = { value: currentValue };
            const valueFormatted = valueFormatterService.formatValue(params.column, null, currentValue);
            const valueFormattedExits = valueFormatted !== null && valueFormatted !== undefined;
            option.text = valueFormattedExits ? valueFormatted : currentValue;
            eSelect.addOption(option);
            hasValue = hasValue || value === currentValue;
        });
        if (hasValue) {
            eSelect.setValue(params.value, true);
        }
        else if (params.values.length) {
            eSelect.setValue(params.values[0], true);
        }
        const { valueListGap, valueListMaxWidth, valueListMaxHeight } = params;
        if (valueListGap != null) {
            eSelect.setPickerGap(valueListGap);
        }
        if (valueListMaxHeight != null) {
            eSelect.setPickerMaxHeight(valueListMaxHeight);
        }
        if (valueListMaxWidth != null) {
            eSelect.setPickerMaxWidth(valueListMaxWidth);
        }
        // we don't want to add this if full row editing, otherwise selecting will stop the
        // full row editing.
        if (gridOptionsService.get('editType') !== 'fullRow') {
            this.addManagedListener(this.eSelect, agSelect_1.AgSelect.EVENT_ITEM_SELECTED, () => params.stopEditing());
        }
    }
    afterGuiAttached() {
        if (this.focusAfterAttached) {
            this.eSelect.getFocusableElement().focus();
        }
        if (this.startedByEnter) {
            setTimeout(() => {
                if (this.isAlive()) {
                    this.eSelect.showPicker();
                }
            });
        }
    }
    focusIn() {
        this.eSelect.getFocusableElement().focus();
    }
    getValue() {
        return this.eSelect.getValue();
    }
    isPopup() {
        return false;
    }
}
__decorate([
    (0, context_1.Autowired)('valueFormatterService')
], SelectCellEditor.prototype, "valueFormatterService", void 0);
__decorate([
    (0, componentAnnotations_1.RefSelector)('eSelect')
], SelectCellEditor.prototype, "eSelect", void 0);
exports.SelectCellEditor = SelectCellEditor;

//# sourceMappingURL=selectCellEditor.js.map
