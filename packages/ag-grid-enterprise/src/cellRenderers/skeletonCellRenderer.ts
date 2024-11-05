import type { ILoadingCellRendererComp, ILoadingCellRendererParams } from 'ag-grid-community';
import { Component, _getDocument, _setAriaLabel, _setAriaLabelledBy } from 'ag-grid-community';

export class SkeletonCellRenderer extends Component implements ILoadingCellRendererComp {
    constructor() {
        super(/* html */ `<div class="ag-skeleton-container"></div>`);
    }

    public init(params: ILoadingCellRendererParams): void {
        const id = `ag-cell-skeleton-renderer-${this.getCompId()}`;
        this.getGui().setAttribute('id', id);
        this.addDestroyFunc(() => _setAriaLabelledBy(params.eParentOfValue));
        _setAriaLabelledBy(params.eParentOfValue, id);

        params.node.failedLoad ? this.setupFailed() : this.setupLoading(params);
    }

    private setupFailed(): void {
        const localeTextFunc = this.getLocaleTextFunc();
        this.getGui().innerText = localeTextFunc('loadingError', 'ERR');

        const ariaFailed = localeTextFunc('ariaSkeletonCellLoadingFailed', 'Row failed to load');
        _setAriaLabel(this.getGui(), ariaFailed);
    }

    private setupLoading(params: ILoadingCellRendererParams): void {
        const eDocument = _getDocument(this.beans);
        const skeletonEffect = eDocument.createElement('div');
        skeletonEffect.classList.add('ag-skeleton-effect');

        // Use the row index to derive a width value for the skeleton cell
        // to avoid them having uniform width when rendering
        const rowIndex = params.node.rowIndex;
        if (rowIndex != null) {
            // Base value of 75% with variation between [-25%, 25%]. We alternate between sin and
            // cos to achieve a semi-random appearance without actually needing a random number.
            // We avoid using random numbers because then skeletons have consistent widths after
            // being scrolled on and off screen.
            const width = 75 + 25 * (rowIndex % 2 === 0 ? Math.sin(rowIndex) : Math.cos(rowIndex));
            skeletonEffect.style.width = `${width}%`;
        }

        this.getGui().appendChild(skeletonEffect);

        const localeTextFunc = this.getLocaleTextFunc();
        const ariaLoading = localeTextFunc('ariaSkeletonCellLoading', 'Row data is loading');
        _setAriaLabel(this.getGui(), ariaLoading);
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
