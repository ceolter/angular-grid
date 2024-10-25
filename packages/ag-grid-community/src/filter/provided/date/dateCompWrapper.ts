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
        const promise = compDetails.newAgStackInstance();

        promise!.then((dateComp) => {
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

            if (dateComp.afterGuiAttached) {
                dateComp.afterGuiAttached();
            }

            if (this.tempValue) {
                dateComp.setDate(this.tempValue);
            }
            if (this.disabled != null) {
                this.setDateCompDisabled(this.disabled);
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
        if (this.dateComp) {
            this.dateComp.setDate(value);
        } else {
            this.tempValue = value;
        }
    }

    public setDisabled(disabled: boolean): void {
        if (this.dateComp) {
            this.setDateCompDisabled(disabled);
        } else {
            this.disabled = disabled;
        }
    }

    public setDisplayed(displayed: boolean) {
        _setDisplayed(this.eParent, displayed);
    }

    public setInputPlaceholder(placeholder: string): void {
        if (this.dateComp && this.dateComp.setInputPlaceholder) {
            this.dateComp.setInputPlaceholder(placeholder);
        }
    }

    public setInputAriaLabel(label: string): void {
        if (this.dateComp && this.dateComp.setInputAriaLabel) {
            this.dateComp.setInputAriaLabel(label);
        }
    }

    public afterGuiAttached(params?: IAfterGuiAttachedParams): void {
        if (this.dateComp && typeof this.dateComp.afterGuiAttached === 'function') {
            this.dateComp.afterGuiAttached(params);
        }
    }

    public updateParams(params: IDateParams): void {
        if (this.dateComp?.refresh && typeof this.dateComp.refresh === 'function') {
            this.dateComp.refresh(params);
        }
    }

    private setDateCompDisabled(disabled: boolean): void {
        if (this.dateComp == null) {
            return;
        }
        if (this.dateComp.setDisabled == null) {
            return;
        }

        this.dateComp.setDisabled(disabled);
    }
}
