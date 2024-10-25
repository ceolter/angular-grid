import type { BeanCollection, ISelectionService, IStatusPanelComp } from 'ag-grid-community';
import { _formatNumberCommas, _isClientSideRowModel, _isServerSideRowModel, _warn } from 'ag-grid-community';

import { AgNameValue } from './agNameValue';

export class SelectedRowsComp extends AgNameValue implements IStatusPanelComp {
    private selectionSvc?: ISelectionService;

    public wireBeans(beans: BeanCollection) {
        this.selectionSvc = beans.selectionSvc;
    }

    public postConstruct(): void {
        if (!_isClientSideRowModel(this.gos) && !_isServerSideRowModel(this.gos)) {
            _warn(223);
            return;
        }

        this.setLabel('selectedRows', 'Selected');

        this.addCssClass('ag-status-panel');
        this.addCssClass('ag-status-panel-selected-row-count');

        this.onRowSelectionChanged();

        const eventListener = this.onRowSelectionChanged.bind(this);
        this.addManagedEventListeners({ modelUpdated: eventListener, selectionChanged: eventListener });
    }

    private onRowSelectionChanged() {
        const selectedRowCount = this.selectionSvc?.getSelectionCount() ?? 0;
        if (selectedRowCount < 0) {
            this.setValue('?');
            this.setDisplayed(true);
            return;
        }
        this.setValue(_formatNumberCommas(selectedRowCount, this.getLocaleTextFunc.bind(this)));
        this.setDisplayed(selectedRowCount > 0);
    }

    public init() {}

    public refresh(): boolean {
        return true;
    }

    // this is a user component, and IComponent has "public destroy()" as part of the interface.
    // so we need to override destroy() just to make the method public.
    public override destroy(): void {
        super.destroy();
    }
}
