import type { NamedBean } from '../context/bean';
import { BeanStub } from '../context/beanStub';
import { _getDocument } from '../gridOptionsUtils';
import { _setAriaAtomic, _setAriaLive, _setAriaRelevant } from '../utils/aria';
import { _clearElement } from '../utils/dom';
import { _debounce } from '../utils/function';

export class AriaAnnouncementService extends BeanStub implements NamedBean {
    beanName = 'ariaAnnounce' as const;

    private descriptionContainer: HTMLElement | null = null;

    private pendingAnnouncements: Map<string, string> = new Map();
    private lastAnnouncement: string = '';

    constructor() {
        super();

        this.updateAnnouncement = _debounce(this, this.updateAnnouncement.bind(this), 200);
    }

    public postConstruct(): void {
        const beans = this.beans;
        const eDocument = _getDocument(beans);
        const div = (this.descriptionContainer = eDocument.createElement('div'));
        div.classList.add('ag-aria-description-container');

        _setAriaLive(div, 'polite');
        _setAriaRelevant(div, 'additions text');
        _setAriaAtomic(div, true);

        beans.eGridDiv.appendChild(div);
    }

    /**
     * @param key used for debouncing calls
     */
    public announceValue(value: string, key: string): void {
        this.pendingAnnouncements.set(key, value);
        this.updateAnnouncement();
    }

    private updateAnnouncement(): void {
        if (!this.descriptionContainer) {
            return;
        }

        const value = Array.from(this.pendingAnnouncements.values()).join('. ');
        this.pendingAnnouncements.clear();
        // screen readers announce a change in content, so we set it to an empty value
        // and then use a setTimeout to force the Screen Reader announcement
        this.descriptionContainer.textContent = '';
        setTimeout(() => {
            if (this.isAlive() && this.descriptionContainer) {
                let valueToAnnounce = value;
                // if the announcement is the same (static announcement)
                // we add a period at the end to force screen readers to announce
                if (this.lastAnnouncement === valueToAnnounce) {
                    valueToAnnounce = `${valueToAnnounce}.`;
                }
                this.lastAnnouncement = valueToAnnounce;
                this.descriptionContainer.textContent = valueToAnnounce;
            }
        }, 50);
    }

    public override destroy(): void {
        super.destroy();

        const { descriptionContainer } = this;

        if (descriptionContainer) {
            _clearElement(descriptionContainer);
            descriptionContainer.parentElement?.removeChild(descriptionContainer);
        }
        this.descriptionContainer = null;
        this.pendingAnnouncements.clear();
    }
}
