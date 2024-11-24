import type { IClientSideRowModel, IStatusPanelComp } from 'ag-grid-community';
import { _formatNumberCommas, _isClientSideRowModel, _warn } from 'ag-grid-community';

import { AgNameValue } from './agNameValue';

export class TotalAndFilteredRowsComp extends AgNameValue implements IStatusPanelComp {
    public postConstruct(): void {
        if (!_isClientSideRowModel(this.gos)) {
            _warn(224);
            return;
        }

        this.setLabel('totalAndFilteredRows', 'Rows');

        this.addCssClass('ag-status-panel');
        this.addCssClass('ag-status-panel-total-and-filtered-row-count');

        this.setDisplayed(true);

        this.addManagedEventListeners({ modelUpdated: this.onDataChanged.bind(this) });
        this.onDataChanged();
    }

    private onDataChanged() {
        const getLocaleTextFunc = this.getLocaleTextFunc.bind(this);
        const rowCount = _formatNumberCommas(this.getFilteredRowCountValue(), getLocaleTextFunc);
        const totalRowCount = _formatNumberCommas(this.getTotalRowCount(), getLocaleTextFunc);

        if (rowCount === totalRowCount) {
            this.setValue(rowCount);
        } else {
            const localeTextFunc = this.getLocaleTextFunc();
            this.setValue(`${rowCount} ${localeTextFunc('of', 'of')} ${totalRowCount}`);
        }
    }

    private getFilteredRowCountValue(): number {
        let filteredRowCount = 0;
        (this.beans.rowModel as IClientSideRowModel).forEachNodeAfterFilter((node) => {
            if (!node.group) {
                filteredRowCount++;
            }
        });
        return filteredRowCount;
    }

    private getTotalRowCount(): number {
        let totalRowCount = 0;
        this.beans.rowModel.forEachNode((node) => {
            if (!node.group) {
                totalRowCount++;
            }
        });
        return totalRowCount;
    }

    public init() {}

    public refresh(): boolean {
        return true;
    }
}
