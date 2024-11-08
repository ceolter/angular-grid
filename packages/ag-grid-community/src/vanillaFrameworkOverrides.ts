import { BASE_URL } from './baseUrl';
import type { FrameworkOverridesIncomingSource, IFrameworkOverrides } from './interfaces/iFrameworkOverrides';
import { AgPromise } from './utils/promise';
import { setValidationDocLink } from './validation/logging';

const PASSIVE_EVENTS = ['touchstart', 'touchend', 'touchmove', 'touchcancel'];

/** The base frameworks, eg React & Angular, override this bean with implementations specific to their requirement. */
export class VanillaFrameworkOverrides implements IFrameworkOverrides {
    public renderingEngine: 'vanilla' | 'react' = 'vanilla';
    private baseDocLink: string;

    constructor(private frameworkName: 'javascript' | 'angular' | 'react' | 'vue' = 'javascript') {
        this.baseDocLink = `${BASE_URL}/${this.frameworkName}-data-grid`;
        setValidationDocLink(this.baseDocLink);
    }

    public setInterval(action: any, timeout?: any): AgPromise<number> {
        return new AgPromise((resolve) => {
            resolve(window.setInterval(action, timeout));
        });
    }

    // for Vanilla JS, we just add the event to the element
    public addEventListener(
        element: HTMLElement,
        type: string,
        listener: EventListenerOrEventListenerObject,
        options?: boolean | AddEventListenerOptions
    ): void {
        let eventListenerOptions: AddEventListenerOptions = {};

        if (typeof options === 'object') {
            eventListenerOptions = options;
        } else if (typeof options === 'boolean') {
            eventListenerOptions = { capture: options };
        }

        if (!eventListenerOptions.passive && PASSIVE_EVENTS.includes(type)) {
            eventListenerOptions.passive = true;
        }

        element.addEventListener(type, listener, eventListenerOptions);
    }

    wrapIncoming: <T>(callback: () => T, source?: FrameworkOverridesIncomingSource) => T = (callback) => callback();
    wrapOutgoing: <T>(callback: () => T) => T = (callback) => callback();

    frameworkComponent(_: string): any {
        return null;
    }

    isFrameworkComponent(_: any): boolean {
        return false;
    }

    getDocLink(path?: string): string {
        return `${this.baseDocLink}${path ? `/${path}` : ''}`;
    }
}
