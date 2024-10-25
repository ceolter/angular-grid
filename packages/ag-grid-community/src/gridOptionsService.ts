import type { GridApi } from './api/gridApi';
import type { NamedBean } from './context/bean';
import { BeanStub } from './context/beanStub';
import type { BeanCollection } from './context/context';
import type { GridOptions } from './entities/gridOptions';
import type { Environment } from './environment';
import type { AgEventType } from './eventTypes';
import type { AgEvent } from './events';
import { ALWAYS_SYNC_GLOBAL_EVENTS } from './events';
import type { GridOptionOrDefault } from './gridOptionsDefault';
import { GRID_OPTION_DEFAULTS } from './gridOptionsDefault';
import { _getCallbackForEvent } from './gridOptionsUtils';
import type { AgGridCommon, WithoutGridCommon } from './interfaces/iCommon';
import type { ModuleName } from './interfaces/iModule';
import { LocalEventService } from './localEventService';
import { _isModuleRegistered } from './modules/moduleRegistry';
import type { AnyGridOptions } from './propertyKeys';
import { _logIfDebug } from './utils/function';
import { _exists } from './utils/generic';
import type { MissingModuleErrors } from './validation/errorMessages/errorText';
import type { ValidationService } from './validation/validationService';

type GetKeys<T, U> = {
    [K in keyof T]: T[K] extends U | undefined ? K : never;
}[keyof T];

/**
 * Get all the GridOption properties that strictly contain the provided type.
 * Does not include `any` properties.
 */
export type KeysOfType<U> = Exclude<GetKeys<GridOptions, U>, AnyGridOptions>;

type BooleanProps = Exclude<KeysOfType<boolean>, AnyGridOptions>;
type NoArgFuncs = KeysOfType<() => any>;
type AnyArgFuncs = KeysOfType<(arg: 'NO_MATCH') => any>;
type CallbackProps = Exclude<KeysOfType<(params: AgGridCommon<any, any>) => any>, NoArgFuncs | AnyArgFuncs>;

export type ExtractParamsFromCallback<TCallback> = TCallback extends (params: infer PA) => any ? PA : never;
export type ExtractReturnTypeFromCallback<TCallback> = TCallback extends (params: AgGridCommon<any, any>) => infer RT
    ? RT
    : never;
type WrappedCallback<K extends CallbackProps, OriginalCallback extends GridOptions[K]> =
    | undefined
    | ((
          params: WithoutGridCommon<ExtractParamsFromCallback<OriginalCallback>>
      ) => ExtractReturnTypeFromCallback<OriginalCallback>);
export interface PropertyChangeSet {
    /** Unique id which can be used to link changes of multiple properties that were updated together.
     * i.e a user updated multiple properties at the same time.
     */
    id: number;
    /** All the properties that have been updated in this change set */
    properties: (keyof GridOptions)[];
}
export type PropertyChangedSource = 'api' | 'gridOptionsUpdated';
export interface PropertyChangedEvent extends AgEvent {
    type: 'gridPropertyChanged';
    changeSet: PropertyChangeSet | undefined;
    source: PropertyChangedSource;
}

/**
 * For boolean properties the changed value will have been coerced to a boolean, so we do not want the type to include the undefined value.
 */
type GridOptionsOrBooleanCoercedValue<K extends keyof GridOptions> = K extends BooleanProps ? boolean : GridOptions[K];

export interface PropertyValueChangedEvent<K extends keyof GridOptions> extends AgEvent {
    type: K;
    changeSet: PropertyChangeSet | undefined;
    currentValue: GridOptionsOrBooleanCoercedValue<K>;
    previousValue: GridOptionsOrBooleanCoercedValue<K>;
    source: PropertyChangedSource;
}

export type PropertyChangedListener = (event: PropertyChangedEvent) => void;
export type PropertyValueChangedListener<K extends keyof GridOptions> = (event: PropertyValueChangedEvent<K>) => void;

let changeSetId = 0;

export class GridOptionsService extends BeanStub implements NamedBean {
    beanName = 'gos' as const;

    private gridOptions: GridOptions;
    public eGridDiv: HTMLElement;
    private validation?: ValidationService;
    public environment: Environment;
    private api: GridApi;
    private gridId: string;

    public wireBeans(beans: BeanCollection): void {
        this.gridOptions = beans.gridOptions;
        this.eGridDiv = beans.eGridDiv;
        this.validation = beans.validation;
        this.environment = beans.environment;
        this.api = beans.gridApi;
        this.gridId = beans.context.getGridId();
    }
    private domDataKey = '__AG_' + Math.random().toString();

    // This is quicker then having code call gridOptionsService.get('context')
    private get gridOptionsContext() {
        return this.gridOptions['context'];
    }

    private propertyEventService: LocalEventService<keyof GridOptions> = new LocalEventService();

    public postConstruct(): void {
        this.eventSvc.addGlobalListener(this.globalEventHandlerFactory().bind(this), true);
        this.eventSvc.addGlobalListener(this.globalEventHandlerFactory(true).bind(this), false);

        // Ensure the propertyEventService has framework overrides set so that it can fire events outside of angular
        this.propertyEventService.setFrameworkOverrides(this.beans.frameworkOverrides);

        this.addManagedEventListeners({
            gridOptionsChanged: ({ options }) => {
                this.updateGridOptions({ options, force: true, source: 'gridOptionsUpdated' });
            },
        });
    }

    /**
     * Get the raw value of the GridOptions property provided.
     * @param property
     */
    public get<K extends keyof GridOptions>(property: K): GridOptionOrDefault<K> {
        return (
            this.gridOptions[property] ??
            (GRID_OPTION_DEFAULTS[property as keyof typeof GRID_OPTION_DEFAULTS] as GridOptionOrDefault<K>)
        );
    }

    /**
     * Get the GridOption callback but wrapped so that the common params of api and context are automatically applied to the params.
     * @param property GridOption callback properties based on the fact that this property has a callback with params extending AgGridCommon
     */
    public getCallback<K extends CallbackProps>(property: K): WrappedCallback<K, GridOptions[K]> {
        return this.mergeGridCommonParams(this.gridOptions[property]);
    }

    /**
     * Returns `true` if a value has been specified for this GridOption.
     * @param property GridOption property
     */
    public exists(property: keyof GridOptions): boolean {
        return _exists(this.gridOptions[property]);
    }

    /**
     * Wrap the user callback and attach the api and context to the params object on the way through.
     * @param callback User provided callback
     * @returns Wrapped callback where the params object not require api and context
     */
    private mergeGridCommonParams<P extends AgGridCommon<any, any>, T>(
        callback: ((params: P) => T) | undefined
    ): ((params: WithoutGridCommon<P>) => T) | undefined {
        if (callback) {
            const wrapped = (callbackParams: WithoutGridCommon<P>): T => {
                const mergedParams = callbackParams as P;
                mergedParams.api = this.api;
                mergedParams.context = this.gridOptionsContext;

                return callback(mergedParams);
            };
            return wrapped;
        }
        return callback;
    }

    public updateGridOptions({
        options,
        force,
        source = 'api',
    }: {
        options: Partial<GridOptions>;
        force?: boolean;
        source?: PropertyChangedSource;
    }): void {
        const changeSet: PropertyChangeSet = { id: changeSetId++, properties: [] };
        // all events are fired after grid options has finished updating.
        const events: PropertyValueChangedEvent<keyof GridOptions>[] = [];
        Object.entries(options).forEach(([key, value]) => {
            this.validation?.warnOnInitialPropertyUpdate(source, key);

            const shouldForce = force || (typeof value === 'object' && source === 'api'); // force objects as they could have been mutated.

            const previousValue = this.gridOptions[key as keyof GridOptions];
            if (shouldForce || previousValue !== value) {
                this.gridOptions[key as keyof GridOptions] = value;
                const event: PropertyValueChangedEvent<keyof GridOptions> = {
                    type: key as keyof GridOptions,
                    currentValue: value,
                    previousValue,
                    changeSet,
                    source,
                };
                events.push(event);
            }
        });

        this.validation?.processGridOptions(this.gridOptions);

        // changeSet should just include the properties that have changed.
        changeSet.properties = events.map((event) => event.type);

        events.forEach((event) => {
            _logIfDebug(this, `Updated property ${event.type} from`, event.previousValue, ` to `, event.currentValue);
            this.propertyEventService.dispatchEvent(event);
        });
    }

    addPropertyEventListener<K extends keyof GridOptions>(key: K, listener: PropertyValueChangedListener<K>): void {
        this.propertyEventService.addEventListener(key, listener as any);
    }
    removePropertyEventListener<K extends keyof GridOptions>(key: K, listener: PropertyValueChangedListener<K>): void {
        this.propertyEventService.removeEventListener(key, listener as any);
    }

    // responsible for calling the onXXX functions on gridOptions
    // It forces events defined in GridOptionsService.alwaysSyncGlobalEvents to be fired synchronously.
    // This is required for events such as GridPreDestroyed.
    // Other events can be fired asynchronously or synchronously depending on config.
    globalEventHandlerFactory = (restrictToSyncOnly?: boolean) => {
        return (eventName: AgEventType, event?: any) => {
            // prevent events from being fired _after_ the grid has been destroyed
            if (!this.isAlive()) {
                return;
            }

            const alwaysSync = ALWAYS_SYNC_GLOBAL_EVENTS.has(eventName);
            if ((alwaysSync && !restrictToSyncOnly) || (!alwaysSync && restrictToSyncOnly)) {
                return;
            }

            const eventHandlerName = _getCallbackForEvent(eventName);
            const eventHandler = (this.gridOptions as any)[eventHandlerName];
            if (typeof eventHandler === 'function') {
                this.beans.frameworkOverrides.wrapOutgoing(() => {
                    eventHandler(event);
                });
            }
        };
    };

    public getDomDataKey(): string {
        return this.domDataKey;
    }

    public getGridCommonParams<TData = any, TContext = any>(): AgGridCommon<TData, TContext> {
        return {
            api: this.api,
            context: this.gridOptionsContext,
        };
    }

    public addGridCommonParams<T extends AgGridCommon<TData, TContext>, TData = any, TContext = any>(
        params: WithoutGridCommon<T>
    ): T {
        const updatedParams = params as T;
        updatedParams.api = this.api;
        updatedParams.context = this.gridOptionsContext;
        return updatedParams;
    }

    public assertModuleRegistered<
        TId extends keyof MissingModuleErrors,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        TShowMessageAtCallLocation = MissingModuleErrors[TId],
    >(moduleName: ModuleName, reasonOrId: string | TId): boolean {
        const registered = this.isModuleRegistered(moduleName);
        if (!registered) {
            this.validation?.missingModule(moduleName, reasonOrId, this.gridId);
        }
        return registered;
    }

    public isModuleRegistered(moduleName: ModuleName): boolean {
        return _isModuleRegistered(moduleName, this.gridId, this.get('rowModelType'));
    }
}
