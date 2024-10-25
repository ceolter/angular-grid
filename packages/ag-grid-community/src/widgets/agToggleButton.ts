import type { AgCheckboxParams } from '../interfaces/agFieldParams';
import { AgCheckbox } from './agCheckbox';
import { agToggleButtonCSS } from './agToggleButton.css-GENERATED';
import type { ComponentSelector } from './component';

export interface AgToggleButtonParams extends AgCheckboxParams {}

export class AgToggleButton extends AgCheckbox<AgToggleButtonParams> {
    constructor(config?: AgToggleButtonParams) {
        super(config, 'ag-toggle-button');
        this.registerCSS(agToggleButtonCSS);
    }

    public override setValue(value: boolean, silent?: boolean): this {
        super.setValue(value, silent);

        this.addOrRemoveCssClass('ag-selected', this.getValue()!);

        return this;
    }
}
export const AgToggleButtonSelector: ComponentSelector = {
    selector: 'AG-TOGGLE-BUTTON',
    component: AgToggleButton,
};
