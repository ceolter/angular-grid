import type { IAfterGuiAttachedParams, IDoesFilterPassParams, IFilter, IFilterParams } from 'ag-grid-community';
import { AgPromise } from 'ag-grid-community';

import { CustomComponentWrapper } from './customComponentWrapper';
import type { CustomFilterCallbacks, CustomFilterProps } from './interfaces';

export class FilterComponentWrapper
    extends CustomComponentWrapper<IFilterParams, CustomFilterProps, CustomFilterCallbacks>
    implements IFilter
{
    private model: any = null;
    private readonly onModelChange = (model: any) => this.updateModel(model);
    private readonly onUiChange = () => this.sourceParams.filterChangedCallback();
    private expectingNewMethods = true;
    private hasBeenActive = false;
    private resolveSetMethodsCallback!: () => void;
    private awaitSetMethodsCallback = new AgPromise<void>((resolve) => {
        this.resolveSetMethodsCallback = resolve;
    });

    public isFilterActive(): boolean {
        return this.model != null;
    }

    public doesFilterPass(params: IDoesFilterPassParams<any>): boolean {
        return this.providedMethods.doesFilterPass(params);
    }

    public getModel(): any {
        return this.model;
    }

    public setModel(model: any): AgPromise<void> {
        this.expectingNewMethods = true;
        this.model = model;
        this.hasBeenActive ||= this.isFilterActive();
        return this.refreshProps();
    }

    public refresh(newParams: IFilterParams): boolean {
        this.sourceParams = newParams;
        this.refreshProps();
        return true;
    }

    public afterGuiAttached(params?: IAfterGuiAttachedParams): void {
        const providedMethods = this.providedMethods;
        if (!providedMethods) {
            // setMethods hasn't been called yet
            this.awaitSetMethodsCallback.then(() => this.providedMethods?.afterGuiAttached?.(params));
        } else {
            providedMethods.afterGuiAttached?.(params);
        }
    }

    protected override getOptionalMethods(): string[] {
        return ['afterGuiAttached', 'afterGuiDetached', 'onNewRowsLoaded', 'getModelAsString', 'onAnyFilterChanged'];
    }

    protected override setMethods(methods: CustomFilterCallbacks): void {
        // filtering is run after the component's `doesFilterPass` receives the new `model`.
        // However, if `doesFilterPass` is using a state variable derived from `model` (via effect),
        // it won't have updated in time when filtering runs.
        // We catch this use case here, and re-run filtering.
        // If the filter has never been active, we don't need to do this
        if (
            this.expectingNewMethods === false &&
            this.hasBeenActive &&
            this.providedMethods?.doesFilterPass !== methods?.doesFilterPass
        ) {
            setTimeout(() => {
                this.sourceParams.filterChangedCallback();
            });
        }
        this.expectingNewMethods = false;
        super.setMethods(methods);
        this.resolveSetMethodsCallback();
    }

    private updateModel(model: any): void {
        this.setModel(model).then(() => this.sourceParams.filterChangedCallback());
    }

    protected override getProps(): CustomFilterProps {
        const props = super.getProps();
        props.model = this.model;
        props.onModelChange = this.onModelChange;
        props.onUiChange = this.onUiChange;
        // remove props in IFilterParams but not CustomFilterProps
        delete (props as any).filterChangedCallback;
        delete (props as any).filterModifiedCallback;
        return props;
    }
}
