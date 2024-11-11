import type { NamedBean } from '../../context/bean';
import { BeanStub } from '../../context/beanStub';
import type { DynamicBeanName, UserComponentName } from '../../context/context';
import type { Module } from '../../interfaces/iModule';
import type { IconName, IconValue } from '../../utils/icon';
import { _errMsg } from '../../validation/logging';
import type { AgComponentSelector, ComponentSelector } from '../../widgets/component';

export class Registry extends BeanStub implements NamedBean {
    beanName = 'registry' as const;

    private agGridDefaults: { [key in UserComponentName]?: any } = {};

    private agGridDefaultParams: { [key in UserComponentName]?: any } = {};

    private jsComps: { [key: string]: any } = {};

    private dynamicBeans: { [K in DynamicBeanName]?: new (args?: any[]) => object } = {};

    private selectors: { [name in AgComponentSelector]?: ComponentSelector } = {};

    private icons: { [K in IconName]?: IconValue } = {};

    public postConstruct(): void {
        const comps = this.gos.get('components');
        if (comps != null) {
            Object.entries(comps).forEach(([key, component]) => {
                this.jsComps[key] = component;
            });
        }
    }

    public registerModule(module: Module): void {
        const { icons, userComponents, dynamicBeans, selectors } = module;

        if (userComponents) {
            const registerUserComponent = (name: UserComponentName, component: any, params?: any) => {
                this.agGridDefaults[name] = component;
                if (params) {
                    this.agGridDefaultParams[name] = params;
                }
            };
            for (const name of Object.keys(userComponents) as UserComponentName[]) {
                const comp = userComponents[name];
                if (typeof comp === 'object') {
                    registerUserComponent(name, comp.classImp, comp.params);
                } else {
                    registerUserComponent(name, comp);
                }
            }
        }

        if (dynamicBeans) {
            for (const name of Object.keys(dynamicBeans) as DynamicBeanName[]) {
                this.dynamicBeans[name] = dynamicBeans[name];
            }
        }

        selectors?.forEach((selector) => {
            this.selectors[selector.selector] = selector;
        });

        if (icons) {
            for (const name of Object.keys(icons) as IconName[]) {
                this.icons[name] = icons[name];
            }
        }
    }

    public getUserComponent(
        propertyName: string,
        name: string
    ): { componentFromFramework: boolean; component: any; params?: any } | null {
        const createResult = (component: any, componentFromFramework: boolean, params?: any) => ({
            componentFromFramework,
            component,
            params,
        });

        const { frameworkOverrides } = this.beans;

        // FrameworkOverrides.frameworkComponent() is used in two locations:
        // 1) for Vue, user provided components get registered via a framework specific way.
        // 2) for React, it's how the React UI provides alternative default components (eg GroupCellRenderer and DetailCellRenderer)
        const registeredViaFrameworkComp = frameworkOverrides.frameworkComponent(name, this.gos.get('components'));
        if (registeredViaFrameworkComp != null) {
            return createResult(registeredViaFrameworkComp, true);
        }

        const jsComponent = this.jsComps[name];
        if (jsComponent) {
            const isFwkComp = frameworkOverrides.isFrameworkComponent(jsComponent);
            return createResult(jsComponent, isFwkComp);
        }

        const defaultComponent = this.agGridDefaults[name as UserComponentName];
        if (defaultComponent) {
            return createResult(defaultComponent, false, this.agGridDefaultParams[name as UserComponentName]);
        }

        this.beans.validation?.missingUserComponent(propertyName, name, this.agGridDefaults, this.jsComps);

        return null;
    }

    public createDynamicBean<T>(name: DynamicBeanName, mandatory: boolean, ...args: any[]): T | undefined {
        const BeanClass = this.dynamicBeans[name];

        if (BeanClass == null) {
            if (mandatory) {
                throw new Error(_errMsg(256));
            }
            return undefined;
        }

        return new BeanClass(...args) as any;
    }

    public getSelector(name: AgComponentSelector): ComponentSelector | undefined {
        return this.selectors[name];
    }

    public getIcon(name: IconName): IconValue | undefined {
        return this.icons[name];
    }
}
