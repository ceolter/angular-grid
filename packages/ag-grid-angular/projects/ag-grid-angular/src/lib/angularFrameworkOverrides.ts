import { Injectable, NgZone } from '@angular/core';

import type {
    FrameworkOverridesIncomingSource,
    IFrameworkEventListenerService,
    LocalEventService,
} from 'ag-grid-community';
import { VanillaFrameworkOverrides } from 'ag-grid-community';

import { AngularFrameworkEventListenerService } from './angularFrameworkEventListenerService';

@Injectable()
export class AngularFrameworkOverrides extends VanillaFrameworkOverrides {
    // Flag used to control Zone behaviour when running tests as many test features rely on Zone.
    private isRunningWithinTestZone: boolean = false;

    private runOutside: <T>(callback: () => T, source?: FrameworkOverridesIncomingSource) => T;

    constructor(private _ngZone: NgZone) {
        super('angular');

        this.isRunningWithinTestZone =
            (window as any)?.AG_GRID_UNDER_TEST ?? !!(window as any)?.Zone?.AsyncTestZoneSpec;

        if (!this._ngZone) {
            this.runOutside = (callback) => callback();
        } else if (this.isRunningWithinTestZone) {
            this.runOutside = (callback, source) => {
                if (source === 'resize-observer' || source === 'popupPositioning') {
                    // ensure resize observer callbacks are run outside of Angular even under test due to Jest not supporting ResizeObserver
                    // which means it just loops continuously with a setTimeout with no way to flush the queue or have fixture.whenStable() resolve.
                    return this._ngZone.runOutsideAngular(callback);
                }
                // When under test run inside Angular so that tests can use fixture.whenStable() to wait for async operations to complete.
                return callback();
            };
        } else {
            this.runOutside = (callback) => this._ngZone.runOutsideAngular(callback);
        }
    }

    // Make all events run outside Angular as they often trigger the setup of event listeners
    // By having the event listeners outside Angular we can avoid triggering change detection
    // This also means that if a user calls an AG Grid API method from within their component
    // the internal side effects will not trigger change detection. Without this the events would
    // run inside Angular and trigger change detection as the source of the event was within the angular zone.
    override wrapIncoming: <T>(callback: () => T, source?: FrameworkOverridesIncomingSource) => T = (
        callback,
        source
    ) => this.runOutside(callback, source);

    /**
     * The shouldWrapOutgoing property is used to determine if events should be run outside of Angular or not.
     * If an event handler is registered outside of Angular then we should not wrap the event handler
     * with runInsideAngular() as the user may not have wanted this.
     * This is also used to not wrap internal event listeners that are registered with RowNodes and Columns.
     */
    public get shouldWrapOutgoing() {
        return this._ngZone && NgZone.isInAngularZone();
    }

    /**
     * Make sure that any code that is executed outside of AG Grid is running within the Angular zone.
     * This means users can update templates and use binding without having to do anything extra.
     */
    override wrapOutgoing: <T>(callback: () => T) => T = (callback) => this.runInsideAngular(callback);

    public createLocalEventListenerWrapper(
        existingFrameworkEventListenerService: IFrameworkEventListenerService<any, any> | undefined,
        localEventService: LocalEventService<any>
    ): IFrameworkEventListenerService<any, any> | undefined {
        if (this.shouldWrapOutgoing) {
            return (
                existingFrameworkEventListenerService ??
                (() => {
                    localEventService.setFrameworkOverrides(this);
                    return new AngularFrameworkEventListenerService(this);
                })()
            );
        }

        return undefined;
    }

    public createGlobalEventListenerWrapper(): IFrameworkEventListenerService<any, any> {
        return new AngularFrameworkEventListenerService(this);
    }

    override isFrameworkComponent(comp: any): boolean {
        if (!comp) {
            return false;
        }
        const prototype = comp.prototype;
        const isAngularComp = prototype && 'agInit' in prototype;
        return isAngularComp;
    }

    runInsideAngular<T>(callback: () => T): T {
        // Check for _ngZone existence as it is not present when Zoneless
        return this._ngZone ? this._ngZone.run(callback) : callback();
    }

    runOutsideAngular<T>(callback: () => T, source?: FrameworkOverridesIncomingSource): T {
        return this.runOutside(callback, source);
    }
}
