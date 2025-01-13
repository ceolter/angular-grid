import { createVNode, defineComponent, render } from 'vue';

import { _error } from 'ag-grid-community';

export class VueComponentFactory {
    private static getComponentDefinition(component: any, parent: any) {
        let componentDefinition: any;

        // when referencing components by name - ie: cellRenderer: 'MyComponent'
        if (typeof component === 'string') {
            // look up the definition in Vue
            componentDefinition = this.searchForComponentInstance(parent, component);
        } else {
            componentDefinition = { extends: defineComponent({ ...component }) };
        }
        if (!componentDefinition) {
            _error(114, { component });
        }

        if (componentDefinition.extends) {
            if (componentDefinition.extends.setup) {
                componentDefinition.setup = componentDefinition.extends.setup;
            }

            componentDefinition.extends.props = this.addParamsToProps(componentDefinition.extends.props);
        } else {
            componentDefinition.props = this.addParamsToProps(componentDefinition.props);
        }

        return componentDefinition;
    }

    private static addParamsToProps(props: any) {
        if (!props || (Array.isArray(props) && props.indexOf('params') === -1)) {
            props = ['params', ...(props ? props : [])];
        } else if (typeof props === 'object' && !props.params) {
            /* tslint:disable:no-string-literal */
            props['params'] = {
                type: Object,
            };
        }

        return props;
    }

    public static createAndMountComponent(component: any, params: any, parent: any, provides: any) {
        const componentDefinition = VueComponentFactory.getComponentDefinition(component, parent);
        if (!componentDefinition) {
            return;
        }

        const { vNode, destroy, el } = this.mount(
            componentDefinition,
            { params: Object.freeze(params) },
            parent,
            provides || {}
        );

        // note that the component creation is synchronous so that componentInstance is set by this point
        return {
            componentInstance: vNode.component.proxy,
            element: el,
            destroy,
        };
    }

    public static mount(component: any, props: any, parent: any, provides: any) {
        let vNode: any = createVNode(component, props);

        vNode.appContext = { ...parent.appContext, provides };

        let el: any = document.createElement('div');
        render(vNode, el);

        const destroy = () => {
            if (el) {
                render(null, el);
            }

            el = null;
            vNode = null;
        };

        return { vNode, destroy, el };
    }

    public static searchForComponentInstance(parent: any, component: any, maxDepth = 10, suppressError = false) {
        let componentInstance: any = null;

        // options first
        let depth = 0;
        let currentParent = parent.parent;
        while (!componentInstance && currentParent && currentParent.components && ++depth < maxDepth) {
            if (currentParent.components && currentParent.components![component as any]) {
                componentInstance = currentParent.components![component as any];
            }
            currentParent = currentParent.parent;
        }

        depth = 0;
        currentParent = parent.parent;
        while (!componentInstance && currentParent && currentParent.$options && ++depth < maxDepth) {
            const currentParentAsThis = currentParent as any;
            if (
                currentParentAsThis.$options &&
                currentParentAsThis.$options.components &&
                currentParentAsThis.$options.components![component as any]
            ) {
                componentInstance = currentParentAsThis.$options.components![component as any];
            } else if (currentParentAsThis[component]) {
                componentInstance = currentParentAsThis[component];
            }
            currentParent = currentParent.parent;
        }

        // composition next
        depth = 0;
        currentParent = parent.parent;
        while (!componentInstance && currentParent && ++depth < maxDepth) {
            if (currentParent.exposed) {
                const currentParentAsThis = currentParent as any;
                if (currentParentAsThis.exposed && currentParentAsThis.exposed[component as any]) {
                    componentInstance = currentParentAsThis.exposed![component as any];
                } else if (currentParentAsThis[component]) {
                    componentInstance = currentParentAsThis[component];
                }
            }
            currentParent = currentParent.parent;
        }

        // then search in globally registered components of app
        if (!componentInstance) {
            const components = parent.appContext.components;
            if (components && components[component]) {
                componentInstance = components[component];
            }
        }

        if (!componentInstance && !suppressError) {
            _error(114, { component });
            return null;
        }
        return componentInstance;
    }
}
