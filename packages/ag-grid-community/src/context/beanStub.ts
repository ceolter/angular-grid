import type { GridOptions } from '../entities/gridOptions';
import type { EventService } from '../eventService';
import type { AgEventType } from '../eventTypes';
import type { AgEvent, AgEventListener, AgEventTypeParams } from '../events';
import type {
    GridOptionsService,
    PropertyChangedEvent,
    PropertyChangedListener,
    PropertyValueChangedEvent,
    PropertyValueChangedListener,
} from '../gridOptionsService';
import type { IEventEmitter } from '../interfaces/iEventEmitter';
import { LocalEventService } from '../localEventService';
import type { LocaleTextFunc } from '../misc/locale/localeUtils';
import { _getLocaleTextFunc } from '../misc/locale/localeUtils';
import { _addSafePassiveEventListener } from '../utils/event';
import type { Bean } from './bean';
import type { BeanCollection, Context } from './context';
import type { BaseBean } from './genericContext';

export type BeanStubEvent = 'destroyed';
export type EventOrDestroyed<TEventType extends string> = TEventType | BeanStubEvent;

type EventHandlers<TEventKey extends string, TEvent = any> = { [K in TEventKey]?: (event?: TEvent) => void };

type AgEventHandlers = { [K in AgEventType]?: (event: AgEventTypeParams[K]) => void };

export abstract class BeanStub<TEventType extends string = BeanStubEvent>
    implements BaseBean<BeanCollection>, Bean, IEventEmitter<EventOrDestroyed<TEventType>>
{
    protected localEventService?: LocalEventService<EventOrDestroyed<TEventType>>;

    private stubContext: Context; // not named context to allow children to use 'context' as a variable name
    private destroyFunctions: (() => void)[] = [];
    private destroyed = false;

    // for vue 3 - prevents Vue from trying to make this (and obviously any sub classes) from being reactive
    // prevents vue from creating proxies for created objects and prevents identity related issues
    public __v_skip = true;

    protected beans: BeanCollection;
    protected eventSvc: EventService;
    protected gos: GridOptionsService;

    public preWireBeans(beans: BeanCollection): void {
        this.beans = beans;
        this.stubContext = beans.context;
        this.eventSvc = beans.eventSvc;
        this.gos = beans.gos;
    }

    // this was a test constructor niall built, when active, it prints after 5 seconds all beans/components that are
    // not destroyed. to use, create a new grid, then api.destroy() before 5 seconds. then anything that gets printed
    // points to a bean or component that was not properly disposed of.
    // constructor() {
    //     setTimeout(()=> {
    //         if (this.isAlive()) {
    //             let prototype: any = Object.getPrototypeOf(this);
    //             const constructor: any = prototype.constructor;
    //             const constructorString = constructor.toString();
    //             const beanName = constructorString.substring(9, constructorString.indexOf("("));
    //             console.log('is alive ' + beanName);
    //         }
    //     }, 5000);
    // }

    public destroy(): void {
        for (let i = 0; i < this.destroyFunctions.length; i++) {
            this.destroyFunctions[i]();
        }
        this.destroyFunctions.length = 0;
        this.destroyed = true;

        // cast destroy type as we do not want to expose destroy event type to the dispatchLocalEvent method
        // as no one else should be firing destroyed at the bean stub.
        this.dispatchLocalEvent({ type: 'destroyed' } as { type: BeanStubEvent } as any);
    }

    // The typing of AgEventListener<any, any, any> is not ideal, but it's the best we can do at the moment to enable
    // eventSvc to have the best typing at the expense of BeanStub local events
    /** Add a local event listener against this BeanStub */
    public addEventListener<T extends TEventType>(
        eventType: T,
        listener: AgEventListener<any, any, any>,
        async?: boolean
    ): void {
        if (!this.localEventService) {
            this.localEventService = new LocalEventService();
        }
        this.localEventService!.addEventListener(eventType, listener, async);
    }

    /** Remove a local event listener from this BeanStub */
    public removeEventListener<T extends TEventType>(
        eventType: T,
        listener: AgEventListener<any, any, any>,
        async?: boolean
    ): void {
        if (this.localEventService) {
            this.localEventService.removeEventListener(eventType, listener, async);
        }
    }

    public dispatchLocalEvent<TEvent extends AgEvent<TEventType>>(event: TEvent): void {
        if (this.localEventService) {
            this.localEventService.dispatchEvent(event);
        }
    }

    public addManagedElementListeners<TEvent extends keyof HTMLElementEventMap>(
        object: Element | Document,
        handlers: EventHandlers<TEvent, HTMLElementEventMap[TEvent]>
    ) {
        return this._setupListeners<keyof HTMLElementEventMap>(object, handlers);
    }
    public addManagedEventListeners(handlers: AgEventHandlers) {
        return this._setupListeners<AgEventType>(this.eventSvc, handlers);
    }
    public addManagedListeners<TEvent extends string>(object: IEventEmitter<TEvent>, handlers: EventHandlers<TEvent>) {
        return this._setupListeners<TEvent>(object, handlers);
    }

    private _setupListeners<TEvent extends string>(
        object: HTMLElement | IEventEmitter<TEvent>,
        handlers: EventHandlers<TEvent>
    ) {
        const destroyFuncs: (() => null)[] = [];
        for (const k of Object.keys(handlers)) {
            const handler = handlers[k as TEvent];
            if (handler) {
                destroyFuncs.push(this._setupListener(object, k, handler));
            }
        }
        return destroyFuncs;
    }

    private _setupListener<const T extends string>(
        object: Window | HTMLElement | IEventEmitter<T>,
        event: T,
        listener: (event?: any) => void
    ): () => null {
        if (this.destroyed) {
            return () => null;
        }

        if (object instanceof HTMLElement) {
            _addSafePassiveEventListener(this.beans.frameworkOverrides, object, event, listener);
        } else {
            object.addEventListener(event, listener);
        }

        const destroyFunc: () => null = () => {
            (object as any).removeEventListener(event, listener);
            return null;
        };

        this.destroyFunctions.push(destroyFunc);

        return () => {
            destroyFunc();
            // Only remove if manually called before bean is destroyed
            this.destroyFunctions = this.destroyFunctions.filter((fn) => fn !== destroyFunc);
            return null;
        };
    }

    /**
     * Setup a managed property listener for the given GridOption property.
     * However, stores the destroy function in the beanStub so that if this bean
     * is a component the destroy function will be called when the component is destroyed
     * as opposed to being cleaned up only when the GridOptionsService is destroyed.
     */
    private setupGridOptionListener<K extends keyof GridOptions>(
        event: K,
        listener: PropertyValueChangedListener<K>
    ): () => null {
        this.gos.addPropertyEventListener(event, listener);
        const destroyFunc: () => null = () => {
            this.gos.removePropertyEventListener(event, listener);
            return null;
        };
        this.destroyFunctions.push(destroyFunc);

        return () => {
            destroyFunc();
            // Only remove if manually called before bean is destroyed
            this.destroyFunctions = this.destroyFunctions.filter((fn) => fn !== destroyFunc);
            return null;
        };
    }

    /**
     * Setup a managed property listener for the given GridOption property.
     * @param event GridOption property to listen to changes for.
     * @param listener Listener to run when property value changes
     */
    public addManagedPropertyListener<K extends keyof GridOptions>(
        event: K,
        listener: PropertyValueChangedListener<K>
    ): () => null {
        if (this.destroyed) {
            return () => null;
        }

        return this.setupGridOptionListener(event, listener);
    }

    private propertyListenerId = 0;
    // Enable multiple grid properties to be updated together by the user but only trigger shared logic once.
    // Closely related to logic in GridOptionsUtils.ts _processOnChange
    private lastChangeSetIdLookup: Record<string, number> = {};
    /**
     * Setup managed property listeners for the given set of GridOption properties.
     * The listener will be run if any of the property changes but will only run once if
     * multiple of the properties change within the same framework lifecycle event.
     * Works on the basis that GridOptionsService updates all properties *before* any property change events are fired.
     * @param events Array of GridOption properties to listen for changes too.
     * @param listener Shared listener to run if any of the properties change
     */
    public addManagedPropertyListeners(events: (keyof GridOptions)[], listener: PropertyChangedListener): void {
        if (this.destroyed) {
            return;
        }

        // Ensure each set of events can run for the same changeSetId
        const eventsKey = events.join('-') + this.propertyListenerId++;

        const wrappedListener = (event: PropertyValueChangedEvent<any>) => {
            if (event.changeSet) {
                // ChangeSet is only set when the property change is part of a group of changes from ComponentUtils
                // Direct api calls should always be run as
                if (event.changeSet && event.changeSet.id === this.lastChangeSetIdLookup[eventsKey]) {
                    // Already run the listener for this set of prop changes so don't run again
                    return;
                }
                this.lastChangeSetIdLookup[eventsKey] = event.changeSet.id;
            }
            // Don't expose the underlying event value changes to the group listener.
            const propertiesChangeEvent: PropertyChangedEvent = {
                type: 'gridPropertyChanged',
                changeSet: event.changeSet,
                source: event.source,
            };
            listener(propertiesChangeEvent);
        };

        events.forEach((event) => this.setupGridOptionListener(event, wrappedListener));
    }

    public isAlive = (): boolean => !this.destroyed;

    public getLocaleTextFunc(): LocaleTextFunc {
        return _getLocaleTextFunc(this.beans.localeSvc);
    }

    public addDestroyFunc(func: () => void): void {
        // if we are already destroyed, we execute the func now
        if (this.isAlive()) {
            this.destroyFunctions.push(func);
        } else {
            func();
        }
    }

    /** doesn't throw an error if `bean` is undefined */
    public createOptionalManagedBean<T extends Bean | null | undefined>(bean: T, context?: Context): T | undefined {
        return bean ? this.createManagedBean(bean, context) : undefined;
    }

    public createManagedBean<T extends Bean | null | undefined>(bean: T, context?: Context): T {
        const res = this.createBean(bean, context);
        this.addDestroyFunc(this.destroyBean.bind(this, bean, context));
        return res;
    }

    public createBean<T extends Bean | null | undefined>(
        bean: T,
        context?: Context | null,
        afterPreCreateCallback?: (bean: Bean) => void
    ): T {
        return (context || this.stubContext).createBean(bean, afterPreCreateCallback);
    }

    /**
     * Destroys a bean and returns undefined to support destruction and clean up in a single line.
     * this.dateComp = this.context.destroyBean(this.dateComp);
     */
    public destroyBean<T extends Bean | null | undefined>(bean: T, context?: Context): undefined {
        return (context || this.stubContext).destroyBean(bean);
    }

    /**
     * Destroys an array of beans and returns an empty array to support destruction and clean up in a single line.
     * this.dateComps = this.context.destroyBeans(this.dateComps);
     */
    protected destroyBeans<T extends Bean | null | undefined>(beans: T[], context?: Context): T[] {
        return (context || this.stubContext).destroyBeans(beans);
    }
}
