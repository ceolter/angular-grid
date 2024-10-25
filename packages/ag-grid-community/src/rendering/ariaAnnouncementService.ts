import type { NamedBean } from '../context/bean';
import { BeanStub } from '../context/beanStub';
import type { BeanCollection } from '../context/context';
import { _getDocument } from '../gridOptionsUtils';
import { _setAriaAtomic, _setAriaLive, _setAriaRelevant } from '../utils/aria';
import { _clearElement } from '../utils/dom';
import { _debounce } from '../utils/function';

export class AriaAnnouncementService extends BeanStub implements NamedBean {
    beanName = 'ariaAnnounce' as const;

    private eGridDiv: HTMLElement;

    public wireBeans(beans: BeanCollection): void {
        this.eGridDiv = beans.eGridDiv;
    }

    private descriptionContainer: HTMLElement | null = null;

    private pendingAnnouncements: Map<string, string> = new Map();

    constructor() {
        super();

        this.updateAnnouncement = _debounce(this, this.updateAnnouncement.bind(this), 200);
    }

    public postConstruct(): void {
        const eDocument = _getDocument(this.gos);
        const div = (this.descriptionContainer = eDocument.createElement('div'));
        div.classList.add('ag-aria-description-container');

        _setAriaLive(div, 'polite');
        _setAriaRelevant(div, 'additions text');
        _setAriaAtomic(div, true);

        this.eGridDiv.appendChild(div);
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
                this.descriptionContainer.textContent = value;
            }
        }, 50);
    }

    public override destroy(): void {
        super.destroy();

        const { descriptionContainer } = this;

        if (descriptionContainer) {
            _clearElement(descriptionContainer);
            if (descriptionContainer.parentElement) {
                descriptionContainer.parentElement.removeChild(descriptionContainer);
            }
        }
        this.descriptionContainer = null;
        (this.eGridDiv as any) = null;
        this.pendingAnnouncements.clear();
    }
}
