import React, {
    forwardRef,
    useCallback,
    useContext,
    useEffect,
    useImperativeHandle,
    useMemo,
    useRef,
    useState,
} from 'react';

import type {
    ComponentType,
    Context,
    FrameworkComponentWrapper,
    FrameworkOverridesIncomingSource,
    GridApi,
    GridOptions,
    GridParams,
    IDetailCellRenderer,
    IDetailCellRendererCtrl,
    IDetailCellRendererParams,
    WrappableInterface,
} from 'ag-grid-community';
import {
    BaseComponentWrapper,
    GridCoreCreator,
    VanillaFrameworkOverrides,
    _combineAttributesAndGridOptions,
    _getGlobalGridOption,
    _getGridRegisteredModules,
    _isClientSideRowModel,
    _isServerSideRowModel,
    _observeResize,
    _processOnChange,
    _warn,
} from 'ag-grid-community';

import GroupCellRenderer from '../reactUi/cellRenderer/groupCellRenderer';
import { CellRendererComponentWrapper } from '../shared/customComp/cellRendererComponentWrapper';
import { DateComponentWrapper } from '../shared/customComp/dateComponentWrapper';
import { DragAndDropImageComponentWrapper } from '../shared/customComp/dragAndDropImageComponentWrapper';
import { FilterComponentWrapper } from '../shared/customComp/filterComponentWrapper';
import { FloatingFilterComponentWrapper } from '../shared/customComp/floatingFilterComponentWrapper';
import { LoadingOverlayComponentWrapper } from '../shared/customComp/loadingOverlayComponentWrapper';
import { MenuItemComponentWrapper } from '../shared/customComp/menuItemComponentWrapper';
import { NoRowsOverlayComponentWrapper } from '../shared/customComp/noRowsOverlayComponentWrapper';
import { StatusPanelComponentWrapper } from '../shared/customComp/statusPanelComponentWrapper';
import { ToolPanelComponentWrapper } from '../shared/customComp/toolPanelComponentWrapper';
import { warnReactiveCustomComponents } from '../shared/customComp/util';
import type { AgGridReactProps } from '../shared/interfaces';
import { PortalManager } from '../shared/portalManager';
import { ReactComponent } from '../shared/reactComponent';
import { BeansContext } from './beansContext';
import GridComp from './gridComp';
import { RenderStatusService } from './renderStatusService';
import { CssClasses, isReact19, runWithoutFlushSync } from './utils';

type ReactCompProps = Omit<AgGridReactProps, keyof GridOptions>;

// Used to only pass gridOptions to the GridCoreCreator from the props
const reactPropsNotGridOptions: ReactCompProps = {
    gridOptions: undefined,
    modules: undefined,
    containerStyle: undefined,
    className: undefined,
    setGridApi: undefined,
    componentWrappingElement: undefined,
    maxComponentCreationTimeMs: undefined,
    children: undefined,
};
const excludeReactCompProps = new Set(Object.keys(reactPropsNotGridOptions));

export const AgGridReactUi = <TData,>(props: AgGridReactProps<TData>) => {
    const apiRef = useRef<GridApi<TData>>();
    const eGui = useRef<HTMLDivElement | null>(null);
    const portalManager = useRef<PortalManager | null>(null);
    const destroyFuncs = useRef<(() => void)[]>([]);
    const whenReadyFuncs = useRef<(() => void)[]>([]);
    const prevProps = useRef<AgGridReactProps<any>>(props);
    const frameworkOverridesRef = useRef<ReactFrameworkOverrides>();
    const gridIdRef = useRef<string | undefined>();

    const ready = useRef<boolean>(false);

    const [context, setContext] = useState<Context | undefined>(undefined);

    // Hook to enable Portals to be displayed via the PortalManager
    const [, setPortalRefresher] = useState(0);

    const setRef = useCallback((eRef: HTMLDivElement | null) => {
        eGui.current = eRef;
        if (!eRef) {
            destroyFuncs.current.forEach((f) => f());
            destroyFuncs.current.length = 0;
            return;
        }

        const modules = props.modules || [];

        if (!portalManager.current) {
            portalManager.current = new PortalManager(
                () => setPortalRefresher((prev) => prev + 1),
                props.componentWrappingElement,
                props.maxComponentCreationTimeMs
            );
            destroyFuncs.current.push(() => {
                portalManager.current?.destroy();
                portalManager.current = null;
            });
        }

        const mergedGridOps = _combineAttributesAndGridOptions(
            props.gridOptions,
            props,
            Object.keys(props).filter((key) => !excludeReactCompProps.has(key))
        );

        const processQueuedUpdates = () => {
            if (ready.current) {
                const getFn = () =>
                    frameworkOverridesRef.current?.shouldQueueUpdates() ? undefined : whenReadyFuncs.current.shift();
                let fn = getFn();
                while (fn) {
                    fn();
                    fn = getFn();
                }
            }
        };

        const frameworkOverrides = new ReactFrameworkOverrides(processQueuedUpdates);
        frameworkOverridesRef.current = frameworkOverrides;
        const renderStatus = new RenderStatusService();
        const gridParams: GridParams = {
            providedBeanInstances: {
                frameworkComponentWrapper: new ReactFrameworkComponentWrapper(
                    portalManager.current,
                    mergedGridOps.reactiveCustomComponents ?? _getGlobalGridOption('reactiveCustomComponents') ?? true
                ),
                renderStatus,
            },
            modules,
            frameworkOverrides,
            setThemeOnGridDiv: true,
        };

        const createUiCallback = (context: Context) => {
            setContext(context);
            context.createBean(renderStatus);

            destroyFuncs.current.push(() => {
                context.destroy();
            });

            // because React is Async, we need to wait for the UI to be initialised before exposing the API's
            context.getBean('ctrlsSvc').whenReady(
                {
                    addDestroyFunc: (func) => {
                        destroyFuncs.current.push(func);
                    },
                },
                () => {
                    if (context.isDestroyed()) {
                        return;
                    }

                    const api = apiRef.current;
                    if (api) {
                        props.setGridApi?.(api);
                    }
                }
            );
        };

        // this callback adds to ctrlsSvc.whenReady(), just like above, however because whenReady() executes
        // funcs in the order they were received, we know adding items here will be AFTER the grid has set columns
        // and data. this is because GridCoreCreator sets these between calling createUiCallback and acceptChangesCallback
        const acceptChangesCallback = (context: Context) => {
            context.getBean('ctrlsSvc').whenReady(
                {
                    addDestroyFunc: (func) => {
                        destroyFuncs.current.push(func);
                    },
                },
                () => {
                    whenReadyFuncs.current.forEach((f) => f());
                    whenReadyFuncs.current.length = 0;
                    ready.current = true;
                }
            );
        };

        const gridCoreCreator = new GridCoreCreator();
        // We ensure that the gridId is stable even in StrictMode
        mergedGridOps.gridId ??= gridIdRef.current;
        apiRef.current = gridCoreCreator.create(
            eRef,
            mergedGridOps,
            createUiCallback,
            acceptChangesCallback,
            gridParams
        );
        destroyFuncs.current.push(() => {
            apiRef.current = undefined;
        });
        if (apiRef.current) {
            gridIdRef.current = apiRef.current.getGridId();
        }
    }, []);

    const style = useMemo(() => {
        return {
            height: '100%',
            ...(props.containerStyle || {}),
        };
    }, [props.containerStyle]);

    const processWhenReady = useCallback((func: () => void) => {
        if (ready.current && !frameworkOverridesRef.current?.shouldQueueUpdates()) {
            func();
        } else {
            whenReadyFuncs.current.push(func);
        }
    }, []);

    useEffect(() => {
        const changes = extractGridPropertyChanges(prevProps.current, props);
        prevProps.current = props;
        processWhenReady(() => {
            if (apiRef.current) {
                _processOnChange(changes, apiRef.current);
            }
        });
    }, [props]);

    return (
        <div style={style} className={props.className} ref={setRef}>
            {context && !context.isDestroyed() ? <GridComp context={context} /> : null}
            {portalManager.current?.getPortals() ?? null}
        </div>
    );
};

function extractGridPropertyChanges(prevProps: any, nextProps: any): { [p: string]: any } {
    const changes: { [p: string]: any } = {};
    Object.keys(nextProps).forEach((propKey) => {
        if (excludeReactCompProps.has(propKey)) {
            return;
        }
        const propValue = nextProps[propKey];
        if (prevProps[propKey] !== propValue) {
            changes[propKey] = propValue;
        }
    });

    return changes;
}

class ReactFrameworkComponentWrapper
    extends BaseComponentWrapper<WrappableInterface>
    implements FrameworkComponentWrapper
{
    constructor(
        private readonly parent: PortalManager,
        private readonly reactiveCustomComponents?: boolean
    ) {
        super();
    }

    protected createWrapper(UserReactComponent: { new (): any }, componentType: ComponentType): WrappableInterface {
        if (this.reactiveCustomComponents) {
            const getComponentClass = (propertyName: string) => {
                switch (propertyName) {
                    case 'filter':
                        return FilterComponentWrapper;
                    case 'floatingFilterComponent':
                        return FloatingFilterComponentWrapper;
                    case 'dateComponent':
                        return DateComponentWrapper;
                    case 'dragAndDropImageComponent':
                        return DragAndDropImageComponentWrapper;
                    case 'loadingOverlayComponent':
                        return LoadingOverlayComponentWrapper;
                    case 'noRowsOverlayComponent':
                        return NoRowsOverlayComponentWrapper;
                    case 'statusPanel':
                        return StatusPanelComponentWrapper;
                    case 'toolPanel':
                        return ToolPanelComponentWrapper;
                    case 'menuItem':
                        return MenuItemComponentWrapper;
                    case 'cellRenderer':
                        return CellRendererComponentWrapper;
                }
            };
            const ComponentClass = getComponentClass(componentType.name);
            if (ComponentClass) {
                return new ComponentClass(UserReactComponent, this.parent, componentType);
            }
        } else {
            switch (componentType.name) {
                case 'filter':
                case 'floatingFilterComponent':
                case 'dateComponent':
                case 'dragAndDropImageComponent':
                case 'loadingOverlayComponent':
                case 'noRowsOverlayComponent':
                case 'statusPanel':
                case 'toolPanel':
                case 'menuItem':
                case 'cellRenderer':
                    warnReactiveCustomComponents();
                    break;
            }
        }
        // only cell renderers and tool panel should use fallback methods
        const suppressFallbackMethods = !componentType.cellRenderer && componentType.name !== 'toolPanel';
        return new ReactComponent(UserReactComponent, this.parent, componentType, suppressFallbackMethods);
    }
}

// Define DetailCellRenderer and ReactFrameworkOverrides here to avoid circular dependency
const DetailCellRenderer = forwardRef((props: IDetailCellRendererParams, ref: any) => {
    const { registry, context, gos, rowModel } = useContext(BeansContext);

    const [cssClasses, setCssClasses] = useState<CssClasses>(() => new CssClasses());
    const [gridCssClasses, setGridCssClasses] = useState<CssClasses>(() => new CssClasses());
    const [detailGridOptions, setDetailGridOptions] = useState<GridOptions>();
    const [detailRowData, setDetailRowData] = useState<any[]>();

    const ctrlRef = useRef<IDetailCellRendererCtrl>();
    const eGuiRef = useRef<HTMLDivElement | null>(null);

    const resizeObserverDestroyFunc = useRef<() => void>();

    const parentModules = useMemo(
        () => _getGridRegisteredModules(props.api.getGridId(), detailGridOptions?.rowModelType ?? 'clientSide'),
        [props]
    );
    const topClassName = useMemo(() => cssClasses.toString() + ' ag-details-row', [cssClasses]);
    const gridClassName = useMemo(() => gridCssClasses.toString() + ' ag-details-grid', [gridCssClasses]);

    if (ref) {
        useImperativeHandle(ref, () => ({
            refresh() {
                return ctrlRef.current?.refresh() ?? false;
            },
        }));
    }

    if (props.template) {
        _warn(230);
    }

    const setRef = useCallback((eRef: HTMLDivElement | null) => {
        eGuiRef.current = eRef;

        if (!eRef) {
            ctrlRef.current = context.destroyBean(ctrlRef.current);
            resizeObserverDestroyFunc.current?.();
            return;
        }

        const compProxy: IDetailCellRenderer = {
            addOrRemoveCssClass: (name: string, on: boolean) => setCssClasses((prev) => prev.setClass(name, on)),
            addOrRemoveDetailGridCssClass: (name: string, on: boolean) =>
                setGridCssClasses((prev) => prev.setClass(name, on)),
            setDetailGrid: (gridOptions) => setDetailGridOptions(gridOptions),
            setRowData: (rowData) => setDetailRowData(rowData),
            getGui: () => eGuiRef.current!,
        };

        const ctrl = registry.createDynamicBean<IDetailCellRendererCtrl>('detailCellRendererCtrl');
        if (!ctrl) {
            return;
        } // should never happen, means master/detail module not loaded
        context.createBean(ctrl);

        ctrl.init(compProxy, props);

        ctrlRef.current = ctrl;

        if (gos.get('detailRowAutoHeight')) {
            const checkRowSizeFunc = () => {
                // when disposed, current is null, so nothing to do, and the resize observer will
                // be disposed of soon
                if (eGuiRef.current == null) {
                    return;
                }

                const clientHeight = eGuiRef.current.clientHeight;

                // if the UI is not ready, the height can be 0, which we ignore, as otherwise a flicker will occur
                // as UI goes from the default height, to 0, then to the real height as UI becomes ready. this means
                // it's not possible for have 0 as auto-height, however this is an improbable use case, as even an
                // empty detail grid would still have some styling around it giving at least a few pixels.
                if (clientHeight != null && clientHeight > 0) {
                    // we do the update in a timeout, to make sure we are not calling from inside the grid
                    // doing another update
                    const updateRowHeightFunc = () => {
                        props.node.setRowHeight(clientHeight);
                        if (_isClientSideRowModel(gos, rowModel) || _isServerSideRowModel(gos, rowModel)) {
                            rowModel.onRowHeightChanged();
                        }
                    };
                    setTimeout(updateRowHeightFunc, 0);
                }
            };

            resizeObserverDestroyFunc.current = _observeResize(gos, eRef, checkRowSizeFunc);
            checkRowSizeFunc();
        }
    }, []);

    const setGridApi = useCallback((api: GridApi) => {
        ctrlRef.current?.registerDetailWithMaster(api);
    }, []);

    return (
        <div className={topClassName} ref={setRef}>
            {detailGridOptions && (
                <AgGridReactUi
                    className={gridClassName}
                    {...detailGridOptions}
                    modules={parentModules}
                    rowData={detailRowData}
                    setGridApi={setGridApi}
                />
            )}
        </div>
    );
});

class ReactFrameworkOverrides extends VanillaFrameworkOverrides {
    private queueUpdates = false;

    constructor(private readonly processQueuedUpdates: () => void) {
        super('react');
        this.renderingEngine = 'react';
    }

    private frameworkComponents: any = {
        agGroupCellRenderer: GroupCellRenderer,
        agGroupRowRenderer: GroupCellRenderer,
        agDetailCellRenderer: DetailCellRenderer,
    };

    public override frameworkComponent(name: string): any {
        return this.frameworkComponents[name];
    }

    override isFrameworkComponent(comp: any): boolean {
        if (!comp) {
            return false;
        }
        const prototype = comp.prototype;
        const isJsComp = prototype && 'getGui' in prototype;
        return !isJsComp;
    }

    override wrapIncoming: <T>(callback: () => T, source?: FrameworkOverridesIncomingSource) => T = (
        callback,
        source
    ) => {
        if (source === 'ensureVisible') {
            // As ensureVisible could easily be called from an effect which is already running inside a React render
            // we need to run it without flushSync to avoid the DEV error from React when calling flushSync inside a render.
            // This does mean there will be a flicker as the grid redraws the cells in the new location but this is deemed
            // less of an issue then the error in the console for devs.
            return runWithoutFlushSync(callback);
        }
        return callback();
    };

    getLockOnRefresh(): void {
        this.queueUpdates = true;
    }

    releaseLockOnRefresh(): void {
        this.queueUpdates = false;
        this.processQueuedUpdates();
    }

    shouldQueueUpdates(): boolean {
        return this.queueUpdates;
    }

    runWhenReadyAsync(): boolean {
        // We make this async only for React 19 as StrictMode in React 19 double fires ref callbacks whereas previous versions of React do not.
        return isReact19();
    }
}
