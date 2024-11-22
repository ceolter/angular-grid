import type { NamedBean } from '../../context/bean';
import { BeanStub } from '../../context/beanStub';
import type { AgEventType } from '../../eventTypes';
import type { AgEventListener, AgGlobalEventListener } from '../../events';
import { ALWAYS_SYNC_GLOBAL_EVENTS } from '../../events';
import type { IFrameworkEventListenerService } from '../../interfaces/iFrameworkEventListenerService';

export class ApiEventService extends BeanStub<AgEventType> implements NamedBean {
    beanName = 'apiEventSvc' as const;

    private syncListeners: Map<AgEventType, Set<AgEventListener>> = new Map();
    private asyncListeners: Map<AgEventType, Set<AgEventListener>> = new Map();
    private syncGlobalListeners: Set<AgGlobalEventListener> = new Set();
    private globalListenerPairs = new Map<
        AgGlobalEventListener,
        { syncListener: AgGlobalEventListener; asyncListener: AgGlobalEventListener }
    >();
    /** wraps events for frameworks */
    private wrapSvc?: IFrameworkEventListenerService<AgEventListener, AgGlobalEventListener>;

    public postConstruct(): void {
        this.wrapSvc = this.beans.frameworkOverrides.createGlobalEventListenerWrapper?.();
    }

    public override addEventListener<T extends AgEventType>(eventType: T, userListener: AgEventListener): void {
        const listener = this.wrapSvc?.wrap(userListener) ?? userListener;

        const async = !ALWAYS_SYNC_GLOBAL_EVENTS.has(eventType);
        const listeners = async ? this.asyncListeners : this.syncListeners;
        if (!listeners.has(eventType)) {
            listeners.set(eventType, new Set());
        }
        listeners.get(eventType)!.add(listener);
        this.eventSvc.addEventListener(eventType, listener, async);
    }
    public override removeEventListener<T extends AgEventType>(eventType: T, userListener: AgEventListener): void {
        const listener = this.wrapSvc?.unwrap(userListener) ?? userListener;
        const asyncListeners = this.asyncListeners.get(eventType);
        const hasAsync = !!asyncListeners?.delete(listener);
        if (!hasAsync) {
            this.syncListeners.get(eventType)?.delete(listener);
        }
        this.eventSvc.removeEventListener(eventType, listener, hasAsync);
    }

    public addGlobalListener(userListener: AgGlobalEventListener): void {
        const listener = this.wrapSvc?.wrapGlobal(userListener) ?? userListener;

        // if async then need to setup the global listener for sync to handle alwaysSyncGlobalEvents
        const syncListener: AgGlobalEventListener = (eventType, event) => {
            if (ALWAYS_SYNC_GLOBAL_EVENTS.has(eventType)) {
                listener(eventType, event);
            }
        };
        const asyncListener: AgGlobalEventListener = (eventType, event) => {
            if (!ALWAYS_SYNC_GLOBAL_EVENTS.has(eventType)) {
                listener(eventType, event);
            }
        };
        this.globalListenerPairs.set(userListener, { syncListener, asyncListener });
        const eventSvc = this.eventSvc;
        eventSvc.addGlobalListener(syncListener, false);
        eventSvc.addGlobalListener(asyncListener, true);
    }

    public removeGlobalListener(userListener: AgGlobalEventListener): void {
        const { eventSvc, wrapSvc, globalListenerPairs } = this;
        const listener = wrapSvc?.unwrapGlobal(userListener) ?? userListener;

        const hasAsync = globalListenerPairs.has(listener);
        if (hasAsync) {
            // If it was async also remove the always sync listener we added
            const { syncListener, asyncListener } = globalListenerPairs.get(listener)!;
            eventSvc.removeGlobalListener(syncListener, false);
            eventSvc.removeGlobalListener(asyncListener, true);
            globalListenerPairs.delete(userListener);
        } else {
            this.syncGlobalListeners.delete(listener);
            eventSvc.removeGlobalListener(listener, false);
        }
    }

    private destroyEventListeners(map: Map<AgEventType, Set<AgEventListener>>, async: boolean): void {
        map.forEach((listeners, eventType) => {
            listeners.forEach((listener) => this.eventSvc.removeEventListener(eventType, listener, async));
            listeners.clear();
        });
        map.clear();
    }

    private destroyGlobalListeners(set: Set<AgGlobalEventListener>, async: boolean): void {
        set.forEach((listener) => this.eventSvc.removeGlobalListener(listener, async));
        set.clear();
    }

    public override destroy(): void {
        super.destroy();

        this.destroyEventListeners(this.syncListeners, false);
        this.destroyEventListeners(this.asyncListeners, true);
        this.destroyGlobalListeners(this.syncGlobalListeners, false);
        const { globalListenerPairs, eventSvc } = this;
        globalListenerPairs.forEach(({ syncListener, asyncListener }) => {
            eventSvc.removeGlobalListener(syncListener, false);
            eventSvc.removeGlobalListener(asyncListener, true);
        });
        globalListenerPairs.clear();
    }
}
