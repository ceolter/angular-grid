import { _clearElement } from '../../utils/dom';
import { _exists } from '../../utils/generic';
import { Component } from '../../widgets/component';
import type { ICellRenderer } from './iCellRenderer';

const ARROW_UP = '\u2191';
const ARROW_DOWN = '\u2193';

export class AnimateShowChangeCellRenderer extends Component implements ICellRenderer {
    private lastValue: number;

    private eValue: HTMLElement;
    private eDelta: HTMLElement;

    private refreshCount = 0;

    constructor() {
        super();

        const template = document.createElement('span');
        const delta = document.createElement('span');
        delta.setAttribute('class', 'ag-value-change-delta');

        const value = document.createElement('span');
        value.setAttribute('class', 'ag-value-change-value');

        template.appendChild(delta);
        template.appendChild(value);

        this.setTemplateFromElement(template);
    }

    public init(params: any): void {
        this.eValue = this.queryForHtmlElement('.ag-value-change-value');
        this.eDelta = this.queryForHtmlElement('.ag-value-change-delta');

        this.refresh(params, true);
    }

    private showDelta(params: any, delta: number): void {
        const absDelta = Math.abs(delta);
        const valueFormatted = params.formatValue(absDelta);

        const valueToUse = _exists(valueFormatted) ? valueFormatted : absDelta;

        const deltaUp = delta >= 0;

        const eDelta = this.eDelta;
        if (deltaUp) {
            eDelta.textContent = ARROW_UP + valueToUse;
        } else {
            // because negative, use ABS to remove sign
            eDelta.textContent = ARROW_DOWN + valueToUse;
        }

        eDelta.classList.toggle('ag-value-change-delta-up', deltaUp);
        eDelta.classList.toggle('ag-value-change-delta-down', !deltaUp);
    }

    private setTimerToRemoveDelta(): void {
        // the refreshCount makes sure that if the value updates again while
        // the below timer is waiting, then the below timer will realise it
        // is not the most recent and will not try to remove the delta value.
        this.refreshCount++;
        const refreshCountCopy = this.refreshCount;
        this.beans.frameworkOverrides.wrapIncoming(() => {
            window.setTimeout(() => {
                if (refreshCountCopy === this.refreshCount) {
                    this.hideDeltaValue();
                }
            }, 2000);
        });
    }

    private hideDeltaValue(): void {
        this.eValue.classList.remove('ag-value-change-value-highlight');
        _clearElement(this.eDelta);
    }

    public refresh(params: any, isInitialRender: boolean = false): boolean {
        const { value, valueFormatted } = params;

        const { eValue, lastValue, beans } = this;
        if (value === lastValue) {
            return false;
        }

        if (_exists(valueFormatted)) {
            eValue.textContent = valueFormatted;
        } else if (_exists(value)) {
            eValue.textContent = value;
        } else {
            _clearElement(eValue);
        }

        // we don't show the delta if we are in the middle of a filter. see comment on FilterManager
        // with regards processingFilterChange
        if (beans.filterManager?.isSuppressFlashingCellsBecauseFiltering()) {
            return false;
        }

        if (typeof value === 'number' && typeof lastValue === 'number') {
            const delta = value - lastValue;
            this.showDelta(params, delta);
        }

        // highlight the current value, but only if it's not new, otherwise it
        // would get highlighted first time the value is shown
        if (lastValue) {
            eValue.classList.add('ag-value-change-value-highlight');
        }

        if (!isInitialRender) {
            this.setTimerToRemoveDelta();
        }

        this.lastValue = value;

        return true;
    }
}
