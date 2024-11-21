import type { IClientSideRowModel, IStatusPanelComp } from 'ag-grid-community';
import { _formatNumberCommas, _isClientSideRowModel, _warn } from 'ag-grid-community';

import { AgNameValue } from './agNameValue';

export class FilteredRowsComp extends AgNameValue implements IStatusPanelComp {
    public postConstruct(): void {
        this.setLabel('filteredRows', 'Filtered');

        if (!_isClientSideRowModel(this.gos)) {
            _warn(222);
            return;
        }

        this.addCssClass('ag-status-panel');
        this.addCssClass('ag-status-panel-filtered-row-count');

        this.setDisplayed(true);

        const listener = this.onDataChanged.bind(this);
        this.addManagedEventListeners({ modelUpdated: listener });
        listener();
    }

    private onDataChanged() {
        const totalRowCountValue = this.getTotalRowCountValue();
        const filteredRowCountValue = this.getFilteredRowCountValue();

        this.setValue(_formatNumberCommas(filteredRowCountValue, this.getLocaleTextFunc.bind(this)));
        this.setDisplayed(totalRowCountValue !== filteredRowCountValue);
    }

    private getTotalRowCountValue(): number {
        let totalRowCount = 0;
        this.beans.rowModel.forEachNode(() => (totalRowCount += 1));
        return totalRowCount;
    }

    private getFilteredRowCountValue(): number {
        let filteredRowCount = 0;

        (this.beans.rowModel as IClientSideRowModel).forEachNodeAfterFilter((node) => {
            if (!node.group) {
                filteredRowCount += 1;
            }
        });
        return filteredRowCount;
    }

    public init() {}

    public refresh(): boolean {
        return true;
    }
}
