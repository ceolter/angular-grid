import type { IStatusPanelComp } from 'ag-grid-community';
import { _formatNumberCommas, _isClientSideRowModel, _isServerSideRowModel, _warn } from 'ag-grid-community';

import { AgNameValue } from './agNameValue';

export class SelectedRowsComp extends AgNameValue implements IStatusPanelComp {
    public postConstruct(): void {
        const gos = this.gos;
        if (!_isClientSideRowModel(gos) && !_isServerSideRowModel(gos)) {
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
        const selectedRowCount = this.beans.selectionSvc?.getSelectionCount() ?? 0;
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
}
