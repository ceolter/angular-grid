import type { NamedBean } from '../../context/bean';
import { BeanStub } from '../../context/beanStub';
import type { BeanCollection } from '../../context/context';
import type { CellEditorSelectorFunc, CellEditorSelectorResult, CellRendererSelectorFunc } from '../../entities/colDef';
import type { GridOptions } from '../../entities/gridOptions';
import type { AgGridCommon } from '../../interfaces/iCommon';
import type { IFrameworkOverrides } from '../../interfaces/iFrameworkOverrides';
import type { ComponentType, UserCompDetails } from '../../interfaces/iUserCompDetails';
import { _mergeDeep } from '../../utils/object';
import { AgPromise } from '../../utils/promise';
import { _error } from '../../validation/logging';
import type { AgComponentUtils } from './agComponentUtils';
import type { FrameworkComponentWrapper } from './frameworkComponentWrapper';
import type { Registry } from './registry';

function doesImplementIComponent(candidate: any): boolean {
    if (!candidate) {
        return false;
    }
    return (candidate as any).prototype && 'getGui' in (candidate as any).prototype;
}

export function _getUserCompKeys<TDefinition>(
    frameworkOverrides: IFrameworkOverrides,
    defObject: TDefinition,
    type: ComponentType,
    params?: any
): {
    compName?: string;
    jsComp: any;
    fwComp: any;
    paramsFromSelector: any;
    popupFromSelector?: boolean;
    popupPositionFromSelector?: 'over' | 'under';
} {
    const { name } = type;

    let compName: string | undefined;
    let jsComp: any;
    let fwComp: any;

    let paramsFromSelector: any;
    let popupFromSelector: boolean | undefined;
    let popupPositionFromSelector: 'over' | 'under' | undefined;

    // there are two types of js comps, class based and func based. we can only check for
    // class based, by checking if getGui() exists. no way to differentiate js func based vs eg react func based
    // const isJsClassComp = (comp: any) => doesImplementIComponent(comp);
    // const fwActive = this.frameworkComponentWrapper != null;

    // pull from defObject if available
    if (defObject) {
        const defObjectAny = defObject as any;

        // if selector, use this
        const selectorFunc: CellEditorSelectorFunc | CellRendererSelectorFunc = defObjectAny[name + 'Selector'];
        const selectorRes = selectorFunc ? selectorFunc(params) : null;

        const assignComp = (providedJsComp: any) => {
            if (typeof providedJsComp === 'string') {
                compName = providedJsComp as string;
            } else if (providedJsComp != null && providedJsComp !== true) {
                const isFwkComp = frameworkOverrides.isFrameworkComponent(providedJsComp);
                if (isFwkComp) {
                    fwComp = providedJsComp;
                } else {
                    jsComp = providedJsComp;
                }
            }
        };

        if (selectorRes) {
            assignComp(selectorRes.component);
            paramsFromSelector = selectorRes.params;
            popupFromSelector = (selectorRes as CellEditorSelectorResult).popup;
            popupPositionFromSelector = (selectorRes as CellEditorSelectorResult).popupPosition;
        } else {
            // if no selector, or result of selector is empty, take from defObject
            assignComp(defObjectAny[name]);
        }
    }

    return { compName, jsComp, fwComp, paramsFromSelector, popupFromSelector, popupPositionFromSelector };
}

export class UserComponentFactory extends BeanStub implements NamedBean {
    beanName = 'userCompFactory' as const;

    private gridOptions: GridOptions;
    private agComponentUtils?: AgComponentUtils;
    private registry: Registry;
    private frameworkComponentWrapper?: FrameworkComponentWrapper;

    public wireBeans(beans: BeanCollection): void {
        this.agComponentUtils = beans.agComponentUtils;
        this.registry = beans.registry;
        this.frameworkComponentWrapper = beans.frameworkComponentWrapper;
        this.gridOptions = beans.gridOptions;
    }

    public getCompDetailsFromGridOptions(
        type: ComponentType,
        defaultName: string | null | undefined,
        params: any,
        mandatory = false
    ): UserCompDetails | undefined {
        return this.getCompDetails(this.gridOptions, type, defaultName, params, mandatory);
    }

    public getCompDetails<TDefinition>(
        defObject: TDefinition,
        type: ComponentType,
        defaultName: string | null | undefined,
        params: any,
        mandatory = false
    ): UserCompDetails | undefined {
        const { name, cellRenderer } = type;

        // eslint-disable-next-line prefer-const
        let { compName, jsComp, fwComp, paramsFromSelector, popupFromSelector, popupPositionFromSelector } =
            _getUserCompKeys(this.beans.frameworkOverrides, defObject, type, params);

        // for grid-provided comps only
        let defaultCompParams: any;

        const lookupFromRegistry = (key: string) => {
            const item = this.registry.getUserComponent(name, key);
            if (item) {
                jsComp = !item.componentFromFramework ? item.component : undefined;
                fwComp = item.componentFromFramework ? item.component : undefined;
                defaultCompParams = item.params;
            }
        };

        // if compOption is a string, means we need to look the item up
        if (compName != null) {
            lookupFromRegistry(compName);
        }

        // if lookup brought nothing back, and we have a default, lookup the default
        if (jsComp == null && fwComp == null && defaultName != null) {
            lookupFromRegistry(defaultName);
        }

        // if we have a comp option, and it's a function, replace it with an object equivalent adaptor
        if (jsComp && cellRenderer && !doesImplementIComponent(jsComp)) {
            jsComp = this.agComponentUtils?.adaptFunction(type, jsComp);
        }

        if (!jsComp && !fwComp) {
            if (mandatory) {
                _error(50, { compName });
            }
            return;
        }

        const paramsMerged = this.mergeParamsWithApplicationProvidedParams(
            defObject,
            type,
            params,
            paramsFromSelector,
            defaultCompParams
        );

        const componentFromFramework = jsComp == null;
        const componentClass = jsComp ? jsComp : fwComp;

        return {
            componentFromFramework,
            componentClass,
            params: paramsMerged,
            type: type,
            popupFromSelector,
            popupPositionFromSelector,
            newAgStackInstance: () =>
                this.newAgStackInstance(componentClass, componentFromFramework, paramsMerged, type),
        };
    }

    private newAgStackInstance(
        ComponentClass: any,
        componentFromFramework: boolean,
        params: any,
        type: ComponentType
    ): AgPromise<any> {
        const jsComponent = !componentFromFramework;
        // using javascript component
        let instance: any;

        if (jsComponent) {
            instance = new ComponentClass();
        } else {
            // Using framework component
            instance = this.frameworkComponentWrapper!.wrap(
                ComponentClass,
                type.mandatoryMethods,
                type.optionalMethods,
                type
            );
        }

        const deferredInit = this.initComponent(instance, params);

        if (deferredInit == null) {
            return AgPromise.resolve(instance);
        }
        return deferredInit.then(() => instance);
    }

    // used by Floating Filter
    public mergeParamsWithApplicationProvidedParams<TDefinition>(
        defObject: TDefinition,
        type: ComponentType,
        paramsFromGrid: any,
        paramsFromSelector: any = null,
        defaultCompParams?: any
    ): any {
        const params: AgGridCommon<any, any> = this.gos.getGridCommonParams();

        _mergeDeep(params, paramsFromGrid);

        if (defaultCompParams) {
            _mergeDeep(params, defaultCompParams);
        }

        // pull user params from either the old prop name and new prop name
        // eg either cellRendererParams and cellCompParams
        const defObjectAny = defObject as any;
        const userParams = defObjectAny && defObjectAny[type.name + 'Params'];

        if (typeof userParams === 'function') {
            const userParamsFromFunc = userParams(paramsFromGrid);
            _mergeDeep(params, userParamsFromFunc);
        } else if (typeof userParams === 'object') {
            _mergeDeep(params, userParams);
        }

        _mergeDeep(params, paramsFromSelector);

        return params;
    }

    private initComponent(component: any, params: any): AgPromise<void> | void {
        this.createBean(component);
        if (component.init == null) {
            return;
        }
        return component.init(params);
    }
}
