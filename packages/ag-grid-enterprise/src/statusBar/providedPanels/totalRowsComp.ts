import type { IClientSideRowModel, IStatusPanelComp } from 'ag-grid-community';
import { _formatNumberCommas, _isClientSideRowModel, _warn } from 'ag-grid-community';

import { AgNameValue } from './agNameValue';

export class TotalRowsComp extends AgNameValue implements IStatusPanelComp {
    public postConstruct(): void {
        this.setLabel('totalRows', 'Total Rows');

        if (!_isClientSideRowModel(this.gos)) {
            _warn(225);
            return;
        }

        this.addCssClass('ag-status-panel');
        this.addCssClass('ag-status-panel-total-row-count');

        this.setDisplayed(true);

        this.addManagedEventListeners({ modelUpdated: this.onDataChanged.bind(this) });
        this.onDataChanged();
    }

    private onDataChanged() {
        this.setValue(_formatNumberCommas(this.getRowCountValue(), this.getLocaleTextFunc.bind(this)));
    }

    private getRowCountValue(): number {
        let totalRowCount = 0;
        (this.beans.rowModel as IClientSideRowModel).forEachLeafNode(() => (totalRowCount += 1));
        return totalRowCount;
    }

    public init() {}

    public refresh(): boolean {
        return true;
    }
}
