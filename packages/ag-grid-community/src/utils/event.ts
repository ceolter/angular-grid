import type { GridOptionsService } from '../gridOptionsService';
import { _getDomData } from '../gridOptionsUtils';
import type { IFrameworkOverrides } from '../interfaces/iFrameworkOverrides';

const AG_GRID_STOP_PROPAGATION = '__ag_Grid_Stop_Propagation';
const PASSIVE_EVENTS = ['touchstart', 'touchend', 'touchmove', 'touchcancel', 'scroll'];
const NON_PASSIVE_EVENTS = ['wheel'];
const supports: { [key: string]: boolean } = {};

/**
 * a user once raised an issue - they said that when you opened a popup (eg context menu)
 * and then clicked on a selection checkbox, the popup wasn't closed. this is because the
 * popup listens for clicks on the body, however ag-grid WAS stopping propagation on the
 * checkbox clicks (so the rows didn't pick them up as row selection selection clicks).
 * to get around this, we have a pattern to stop propagation for the purposes of AG Grid,
 * but we still let the event pass back to the body.
 * @param {Event} event
 */
export function _stopPropagationForAgGrid(event: Event): void {
    (event as any)[AG_GRID_STOP_PROPAGATION] = true;
}

export function _isStopPropagationForAgGrid(event: Event): boolean {
    return (event as any)[AG_GRID_STOP_PROPAGATION] === true;
}

export const _isEventSupported = (() => {
    const tags = {
        select: 'input',
        change: 'input',
        submit: 'form',
        reset: 'form',
        error: 'img',
        load: 'img',
        abort: 'img',
    } as any;

    const eventChecker = (eventName: any) => {
        if (typeof supports[eventName] === 'boolean') {
            return supports[eventName];
        }

        const el = document.createElement(tags[eventName] || 'div');
        eventName = 'on' + eventName;

        return (supports[eventName] = eventName in el);
    };

    return eventChecker;
})();

export function _getCtrlForEventTarget<T>(
    gos: GridOptionsService,
    eventTarget: EventTarget | null,
    type: string
): T | null {
    let sourceElement = eventTarget as HTMLElement;

    while (sourceElement) {
        const renderedComp = _getDomData(gos, sourceElement, type);

        if (renderedComp) {
            return renderedComp as T;
        }

        sourceElement = sourceElement.parentElement!;
    }

    return null;
}

export function _isElementInEventPath(element: HTMLElement, event: Event): boolean {
    if (!event || !element) {
        return false;
    }

    return _getEventPath(event).indexOf(element) >= 0;
}

export function _createEventPath(event: { target: EventTarget }): EventTarget[] {
    const res: EventTarget[] = [];
    let pointer: any = event.target;

    while (pointer) {
        res.push(pointer);
        pointer = pointer.parentElement;
    }

    return res;
}

/**
 * Gets the path for a browser Event or from the target on an AG Grid Event
 * https://developer.mozilla.org/en-US/docs/Web/API/Event
 * @param {Event| { target: EventTarget }} event
 * @returns {EventTarget[]}
 */
export function _getEventPath(event: Event | { target: EventTarget }): EventTarget[] {
    // This can be called with either a browser event or an AG Grid Event that has a target property.
    const eventNoType = event as any;

    if (eventNoType.path) {
        return eventNoType.path;
    }

    if (eventNoType.composedPath) {
        return eventNoType.composedPath();
    }

    // If this is an AG Grid event build the path ourselves
    return _createEventPath(eventNoType);
}

export function _addSafePassiveEventListener(
    frameworkOverrides: IFrameworkOverrides,
    eElement: HTMLElement,
    event: string,
    listener: (event?: any) => void
) {
    const passive = getPassiveStateForEvent(event);

    let options: { passive: boolean } | undefined;

    if (passive != null) {
        options = { passive };
    }

    // this check is here for certain scenarios where I believe the user must be destroying
    // the grid somehow but continuing for it to be used
    if (frameworkOverrides && frameworkOverrides.addEventListener) {
        frameworkOverrides.addEventListener(eElement, event, listener, options);
    }
}

export const getPassiveStateForEvent = (event: string): boolean | undefined => {
    const isPassive = PASSIVE_EVENTS.includes(event);
    const isNonPassive = NON_PASSIVE_EVENTS.includes(event);

    if (isPassive) {
        return true;
    }

    if (isNonPassive) {
        return false;
    }
};
