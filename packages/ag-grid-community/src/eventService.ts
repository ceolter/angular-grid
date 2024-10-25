import type { NamedBean } from './context/bean';
import { BeanStub } from './context/beanStub';
import type { BeanCollection } from './context/context';
import type { AgEventType } from './eventTypes';
import type { AgEventListener, AgGlobalEventListener, AllEventsWithoutGridCommon } from './events';
import type { IEventEmitter } from './interfaces/iEventEmitter';
import { LocalEventService } from './localEventService';

export class EventService extends BeanStub<AgEventType> implements NamedBean, IEventEmitter<AgEventType> {
    beanName = 'eventSvc' as const;

    private globalEventListener?: AgGlobalEventListener;
    private globalSyncEventListener?: AgGlobalEventListener;

    public wireBeans(beans: BeanCollection): void {
        this.globalEventListener = beans.globalEventListener;
        this.globalSyncEventListener = beans.globalSyncEventListener;
    }

    private readonly globalEventService: LocalEventService<AgEventType> = new LocalEventService();

    public postConstruct(): void {
        if (this.globalEventListener) {
            this.addGlobalListener(this.globalEventListener, true);
        }

        if (this.globalSyncEventListener) {
            this.addGlobalListener(this.globalSyncEventListener, false);
        }
    }

    public override addEventListener<TEventType extends AgEventType>(
        eventType: TEventType,
        listener: AgEventListener<any, any, TEventType>,
        async?: boolean
    ): void {
        this.globalEventService.addEventListener(eventType, listener as any, async);
    }

    public override removeEventListener<TEventType extends AgEventType>(
        eventType: TEventType,
        listener: AgEventListener<any, any, TEventType>,
        async?: boolean
    ): void {
        this.globalEventService.removeEventListener(eventType, listener as any, async);
    }

    public addGlobalListener(listener: AgGlobalEventListener, async = false): void {
        this.globalEventService.addGlobalListener(listener, async);
    }

    public removeGlobalListener(listener: AgGlobalEventListener, async = false): void {
        this.globalEventService.removeGlobalListener(listener, async);
    }

    /** @deprecated DO NOT FIRE LOCAL EVENTS OFF THE EVENT SERVICE */
    public override dispatchLocalEvent(): void {
        // only the destroy event from BeanStub should flow through here
    }

    public dispatchEvent(event: AllEventsWithoutGridCommon): void {
        this.globalEventService.dispatchEvent(this.gos.addGridCommonParams<any>(event));
    }

    public dispatchEventOnce(event: AllEventsWithoutGridCommon): void {
        this.globalEventService.dispatchEventOnce(this.gos.addGridCommonParams<any>(event));
    }
}
