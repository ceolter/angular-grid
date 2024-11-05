import type { ILoadingCellRendererComp, ILoadingCellRendererParams } from 'ag-grid-community';
import { Component, RefPlaceholder, _createIconNoSpan } from 'ag-grid-community';

export class LoadingCellRenderer extends Component implements ILoadingCellRendererComp {
    private readonly eLoadingIcon: HTMLElement = RefPlaceholder;
    private readonly eLoadingText: HTMLElement = RefPlaceholder;

    constructor() {
        super(/* html */ `<div class="ag-loading">
            <span class="ag-loading-icon" data-ref="eLoadingIcon"></span>
            <span class="ag-loading-text" data-ref="eLoadingText"></span>
        </div>`);
    }

    public init(params: ILoadingCellRendererParams): void {
        params.node.failedLoad ? this.setupFailed() : this.setupLoading();
    }

    private setupFailed(): void {
        const localeTextFunc = this.getLocaleTextFunc();
        this.eLoadingText.innerText = localeTextFunc('loadingError', 'ERR');
    }

    private setupLoading(): void {
        const eLoadingIcon = _createIconNoSpan('groupLoading', this.beans, null);
        if (eLoadingIcon) {
            this.eLoadingIcon.appendChild(eLoadingIcon);
        }

        const localeTextFunc = this.getLocaleTextFunc();
        this.eLoadingText.innerText = localeTextFunc('loadingOoo', 'Loading');
    }

    public refresh(_params: ILoadingCellRendererParams): boolean {
        return false;
    }

    // this is a user component, and IComponent has "public destroy()" as part of the interface.
    // so we need to override destroy() just to make the method public.
    public override destroy(): void {
        super.destroy();
    }
}
