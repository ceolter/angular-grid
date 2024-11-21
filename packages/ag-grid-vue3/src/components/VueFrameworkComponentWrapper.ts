import type { WrappableInterface } from 'ag-grid-community';
import { BaseComponentWrapper, _warn } from 'ag-grid-community';

import { VueComponentFactory } from './VueComponentFactory';

interface VueWrappableInterface extends WrappableInterface {
    processMethod(methodName: string, args: IArguments): any;
}

export class VueFrameworkComponentWrapper extends BaseComponentWrapper<WrappableInterface> {
    private parent: any | null;
    private provides: any | null;

    constructor(parent: any, provides?: any) {
        super();

        this.parent = parent;
        this.provides = provides;
    }

    protected createWrapper(component: any): WrappableInterface {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const that = this;

        class DynamicComponent extends VueComponent<any> implements WrappableInterface {
            public override init(params: any): void {
                super.init(params);
            }

            public hasMethod(name: string): boolean {
                const componentInstance = wrapper.getFrameworkComponentInstance();
                if (!componentInstance[name]) {
                    return (
                        componentInstance.$.exposed?.[name] != null ||
                        componentInstance.exposed?.[name] != null ||
                        componentInstance.$.setupState[name] != null
                    );
                } else {
                    return true;
                }
            }

            public callMethod(name: string, args: IArguments): any {
                const componentInstance = this.getFrameworkComponentInstance();
                const frameworkComponentInstance = wrapper.getFrameworkComponentInstance();
                if (frameworkComponentInstance[name]) {
                    return frameworkComponentInstance[name].apply(componentInstance, args);
                } else {
                    const fn =
                        componentInstance.$.exposed?.[name] ||
                        componentInstance.exposed?.[name] ||
                        componentInstance.$.setupState[name];
                    return fn?.apply(componentInstance, args);
                }
            }

            public addMethod(name: string, callback: () => any): void {
                (wrapper as any)[name] = callback;
            }

            public processMethod(methodName: string, args: IArguments): any {
                if (methodName === 'refresh') {
                    this.getFrameworkComponentInstance().params = args[0];
                }

                if (this.hasMethod(methodName)) {
                    return this.callMethod(methodName, args);
                }

                return methodName === 'refresh';
            }

            protected createComponent(params: any): any {
                return that.createComponent(component, params);
            }
        }

        const wrapper = new DynamicComponent();
        return wrapper;
    }

    public createComponent(component: any, params: any): any {
        return VueComponentFactory.createAndMountComponent(component, params, this.parent!, this.provides!);
    }

    protected override createMethodProxy(
        wrapper: VueWrappableInterface,
        methodName: string,
        mandatory: boolean
    ): () => any {
        return function () {
            if (wrapper.hasMethod(methodName)) {
                // eslint-disable-next-line prefer-rest-params
                return wrapper.callMethod(methodName, arguments);
            }

            if (mandatory) {
                _warn(233, { methodName });
            }
            return null;
        };
    }

    protected destroy() {
        this.parent = null;
    }
}

abstract class VueComponent<P> {
    private componentInstance: any;
    private element!: HTMLElement;
    private unmount: any;

    public getGui(): HTMLElement {
        return this.element;
    }

    public destroy(): void {
        if (
            this.getFrameworkComponentInstance() &&
            typeof this.getFrameworkComponentInstance().destroy === 'function'
        ) {
            this.getFrameworkComponentInstance().destroy();
        }
        this.unmount();
    }

    public getFrameworkComponentInstance(): any {
        return this.componentInstance;
    }

    protected init(params: P): void {
        const { componentInstance, element, destroy: unmount } = this.createComponent(params);

        this.componentInstance = componentInstance;
        this.unmount = unmount;

        // the element is the parent div we're forced to created when dynamically creating vnodes
        // the first child is the user supplied component
        this.element = element.firstElementChild ?? element;
    }

    protected abstract createComponent(params: P): any;
}
