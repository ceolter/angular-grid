import { _getDateCompDetails } from '../../../components/framework/userCompUtils';
import type { UserComponentFactory } from '../../../components/framework/userComponentFactory';
import type { Context } from '../../../context/context';
import type { IDateComp, IDateParams } from '../../../interfaces/dateComponent';
import type { IAfterGuiAttachedParams } from '../../../interfaces/iAfterGuiAttachedParams';
import type { WithoutGridCommon } from '../../../interfaces/iCommon';
import { _setDisplayed } from '../../../utils/dom';

/** Provides sync access to async component. Date component can be lazy created - this class encapsulates
 * this by keeping value locally until DateComp has loaded, then passing DateComp the value. */
export class DateCompWrapper {
    private dateComp: IDateComp | null | undefined;
    private tempValue: Date | null;
    private disabled: boolean | null;
    private alive = true;
    private context: Context;
    private eParent: HTMLElement;

    constructor(
        context: Context,
        userCompFactory: UserComponentFactory,
        dateComponentParams: WithoutGridCommon<IDateParams>,
        eParent: HTMLElement,
        onReady?: (comp: DateCompWrapper) => void
    ) {
        this.context = context;
        this.eParent = eParent;

        const compDetails = _getDateCompDetails(userCompFactory, dateComponentParams);
        if (!compDetails) {
            return;
        }
        compDetails.newAgStackInstance().then((dateComp) => {
            // because async, check the filter still exists after component comes back
            if (!this.alive) {
                context.destroyBean(dateComp);
                return;
            }

            this.dateComp = dateComp;

            if (!dateComp) {
                return;
            }

            eParent.appendChild(dateComp.getGui());

            dateComp?.afterGuiAttached?.();

            const { tempValue, disabled } = this;
            if (tempValue) {
                dateComp.setDate(tempValue);
            }
            if (disabled != null) {
                dateComp.setDisabled?.(disabled);
            }

            onReady?.(this);
        });
    }

    public destroy(): void {
        this.alive = false;
        this.dateComp = this.context.destroyBean(this.dateComp);
    }

    public getDate(): Date | null {
        return this.dateComp ? this.dateComp.getDate() : this.tempValue;
    }

    public setDate(value: Date | null): void {
        const dateComp = this.dateComp;
        if (dateComp) {
            dateComp.setDate(value);
        } else {
            this.tempValue = value;
        }
    }

    public setDisabled(disabled: boolean): void {
        const dateComp = this.dateComp;
        if (dateComp) {
            dateComp.setDisabled?.(disabled);
        } else {
            this.disabled = disabled;
        }
    }

    public setDisplayed(displayed: boolean) {
        _setDisplayed(this.eParent, displayed);
    }

    public setInputPlaceholder(placeholder: string): void {
        this.dateComp?.setInputPlaceholder?.(placeholder);
    }

    public setInputAriaLabel(label: string): void {
        this.dateComp?.setInputAriaLabel?.(label);
    }

    public afterGuiAttached(params?: IAfterGuiAttachedParams): void {
        this.dateComp?.afterGuiAttached?.(params);
    }

    public updateParams(params: IDateParams): void {
        this.dateComp?.refresh?.(params);
    }
}
