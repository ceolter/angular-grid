import type { ComponentRef, ViewContainerRef } from '@angular/core';
import { Injectable } from '@angular/core';

import type { FrameworkComponentWrapper, WrappableInterface } from 'ag-grid-community';
import { BaseComponentWrapper, _removeFromParent } from 'ag-grid-community';

import type { AngularFrameworkOverrides } from './angularFrameworkOverrides';
import type { AgFrameworkComponent } from './interfaces';

@Injectable()
export class AngularFrameworkComponentWrapper
    extends BaseComponentWrapper<WrappableInterface>
    implements FrameworkComponentWrapper
{
    private viewContainerRef: ViewContainerRef;
    private angularFrameworkOverrides: AngularFrameworkOverrides;

    public setViewContainerRef(
        viewContainerRef: ViewContainerRef,
        angularFrameworkOverrides: AngularFrameworkOverrides
    ) {
        this.viewContainerRef = viewContainerRef;
        this.angularFrameworkOverrides = angularFrameworkOverrides;
    }

    protected createWrapper(OriginalConstructor: { new (): any }): WrappableInterface {
        const angularFrameworkOverrides = this.angularFrameworkOverrides;
        const that = this;
        class DynamicAgNg2Component
            extends BaseGuiComponent<any, AgFrameworkComponent<any>>
            implements WrappableInterface
        {
            override init(params: any): void {
                angularFrameworkOverrides.runInsideAngular(() => {
                    super.init(params);
                    this._componentRef.changeDetectorRef.detectChanges();
                });
            }

            protected createComponent(): ComponentRef<AgFrameworkComponent<any>> {
                return angularFrameworkOverrides.runInsideAngular(() => that.createComponent(OriginalConstructor));
            }

            hasMethod(name: string): boolean {
                return wrapper.getFrameworkComponentInstance()[name] != null;
            }

            callMethod(name: string, args: IArguments): void {
                const componentRef = this.getFrameworkComponentInstance();
                const methodCall = componentRef[name];
                // Special case for `doesFilterPass` as it's called very often and current implementation has
                // this filter logic as part of the component when really it is just part of the filter model.
                if (name === 'doesFilterPass') {
                    return methodCall.apply(componentRef, args);
                }
                return angularFrameworkOverrides.runInsideAngular(() => methodCall.apply(componentRef, args));
            }

            addMethod(name: string, callback: (...args: any[]) => any): void {
                (wrapper as any)[name] = callback;
            }
        }
        const wrapper = new DynamicAgNg2Component();
        return wrapper;
    }

    public createComponent<T>(componentType: { new (...args: any[]): T }): ComponentRef<T> {
        return this.viewContainerRef.createComponent(componentType);
    }
}

abstract class BaseGuiComponent<P, T extends AgFrameworkComponent<P>> {
    protected _params: P;
    protected _eGui: HTMLElement;
    protected _componentRef: ComponentRef<T>;
    protected _agAwareComponent: T;
    protected _frameworkComponentInstance: any; // the users component - for accessing methods they create

    protected init(params: P): void {
        this._params = params;

        this._componentRef = this.createComponent();
        this._agAwareComponent = this._componentRef.instance;
        this._frameworkComponentInstance = this._componentRef.instance;
        this._eGui = this._componentRef.location.nativeElement;
        // Angular appends the component to the DOM, so remove it
        _removeFromParent(this._eGui);

        this._agAwareComponent.agInit(this._params);
    }

    public getGui(): HTMLElement {
        return this._eGui;
    }

    /** `getGui()` returns the `ng-component` element. This returns the actual root element. */
    public getRootElement(): HTMLElement {
        const firstChild = this._eGui.firstChild;
        return firstChild as HTMLElement;
    }

    public destroy(): void {
        if (this._frameworkComponentInstance && typeof this._frameworkComponentInstance.destroy === 'function') {
            this._frameworkComponentInstance.destroy();
        }
        if (this._componentRef) {
            this._componentRef.destroy();
        }
    }

    public getFrameworkComponentInstance(): any {
        return this._frameworkComponentInstance;
    }

    protected abstract createComponent(): ComponentRef<T>;
}
