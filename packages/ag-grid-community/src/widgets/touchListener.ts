import type { AgEvent } from '../events';
import type { IEventEmitter, IEventListener } from '../interfaces/iEventEmitter';
import { LocalEventService } from '../localEventService';
import { _areEventsNear } from '../utils/mouse';

export interface TapEvent extends AgEvent<'tap'> {
    touchStart: Touch;
}
export interface DoubleTapEvent extends AgEvent<'doubleTap'> {
    touchStart: Touch;
}

export interface LongTapEvent extends AgEvent<'longTap'> {
    touchStart: Touch;
    touchEvent: TouchEvent;
}

export type TouchListenerEvent = 'tap' | 'doubleTap' | 'longTap';
export class TouchListener implements IEventEmitter<TouchListenerEvent> {
    private DOUBLE_TAP_MILLIS = 500;

    private destroyFuncs: ((...args: any[]) => any)[] = [];

    private moved: boolean;

    private touching = false;
    private touchStart: Touch;

    private lastTapTime: number | null;

    private localEventService: LocalEventService<TouchListenerEvent> = new LocalEventService();

    private preventMouseClick: boolean;

    constructor(eElement: Element, preventMouseClick = false) {
        this.preventMouseClick = preventMouseClick;

        const startListener = this.onTouchStart.bind(this);
        const moveListener = this.onTouchMove.bind(this);
        const endListener = this.onTouchEnd.bind(this);

        eElement.addEventListener('touchstart', startListener, { passive: true } as any);
        eElement.addEventListener('touchmove', moveListener, { passive: true } as any);
        // we set passive=false, as we want to prevent default on this event
        eElement.addEventListener('touchend', endListener, { passive: false } as any);

        this.destroyFuncs.push(() => {
            eElement.removeEventListener('touchstart', startListener, { passive: true } as any);
            eElement.removeEventListener('touchmove', moveListener, { passive: true } as any);
            eElement.removeEventListener('touchend', endListener, { passive: false } as any);
        });
    }

    private getActiveTouch(touchList: TouchList): Touch | null {
        for (let i = 0; i < touchList.length; i++) {
            const matches = touchList[i].identifier === this.touchStart.identifier;
            if (matches) {
                return touchList[i];
            }
        }

        return null;
    }

    public addEventListener<T extends TouchListenerEvent>(eventType: T, listener: IEventListener<T>): void {
        this.localEventService.addEventListener(eventType, listener);
    }

    public removeEventListener<T extends TouchListenerEvent>(eventType: T, listener: IEventListener<T>): void {
        this.localEventService.removeEventListener(eventType, listener);
    }

    private onTouchStart(touchEvent: TouchEvent): void {
        // only looking at one touch point at any time
        if (this.touching) {
            return;
        }

        this.touchStart = touchEvent.touches[0];
        this.touching = true;

        this.moved = false;

        const touchStartCopy = this.touchStart;

        window.setTimeout(() => {
            const touchesMatch = this.touchStart === touchStartCopy;

            if (this.touching && touchesMatch && !this.moved) {
                this.moved = true;
                const event: LongTapEvent = {
                    type: 'longTap',
                    touchStart: this.touchStart,
                    touchEvent: touchEvent,
                };
                this.localEventService.dispatchEvent(event);
            }
        }, 500);
    }

    private onTouchMove(touchEvent: TouchEvent): void {
        if (!this.touching) {
            return;
        }

        const touch = this.getActiveTouch(touchEvent.touches);
        if (!touch) {
            return;
        }

        const eventIsFarAway = !_areEventsNear(touch, this.touchStart, 4);
        if (eventIsFarAway) {
            this.moved = true;
        }
    }

    private onTouchEnd(touchEvent: TouchEvent): void {
        if (!this.touching) {
            return;
        }

        if (!this.moved) {
            const event: TapEvent = {
                type: 'tap',
                touchStart: this.touchStart,
            };
            this.localEventService.dispatchEvent(event);
            this.checkForDoubleTap();
        }

        // stops the tap from also been processed as a mouse click
        if (this.preventMouseClick && touchEvent.cancelable) {
            touchEvent.preventDefault();
        }

        this.touching = false;
    }

    private checkForDoubleTap(): void {
        const now = new Date().getTime();

        if (this.lastTapTime && this.lastTapTime > 0) {
            // if previous tap, see if duration is short enough to be considered double tap
            const interval = now - this.lastTapTime;
            if (interval > this.DOUBLE_TAP_MILLIS) {
                // dispatch double tap event
                const event: DoubleTapEvent = {
                    type: 'doubleTap',
                    touchStart: this.touchStart,
                };
                this.localEventService.dispatchEvent(event);

                // this stops a tripple tap ending up as two double taps
                this.lastTapTime = null;
            } else {
                this.lastTapTime = now;
            }
        } else {
            this.lastTapTime = now;
        }
    }

    public destroy(): void {
        this.destroyFuncs.forEach((func) => func());
    }
}
