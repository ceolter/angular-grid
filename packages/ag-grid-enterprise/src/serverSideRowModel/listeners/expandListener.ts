import type { BeanCollection, NamedBean, RowGroupOpenedEvent } from 'ag-grid-community';
import { BeanStub, RowNode, _exists, _getRowHeightForNode, _isServerSideRowModel, _missing } from 'ag-grid-community';

import type { ServerSideRowModel } from '../serverSideRowModel';
import type { StoreFactory } from '../stores/storeFactory';

export class ExpandListener extends BeanStub implements NamedBean {
    beanName = 'ssrmExpandListener' as const;

    private serverSideRowModel: ServerSideRowModel;
    private storeFactory: StoreFactory;

    public wireBeans(beans: BeanCollection) {
        this.serverSideRowModel = beans.rowModel as ServerSideRowModel;
        this.storeFactory = beans.ssrmStoreFactory as StoreFactory;
    }

    public postConstruct(): void {
        // only want to be active if SSRM active, otherwise would be interfering with other row models
        if (!_isServerSideRowModel(this.gos)) {
            return;
        }

        this.addManagedEventListeners({ rowGroupOpened: this.onRowGroupOpened.bind(this) });
    }

    private onRowGroupOpened(event: RowGroupOpenedEvent): void {
        const rowNode = event.node as RowNode;

        if (rowNode.expanded) {
            if (rowNode.master) {
                this.createDetailNode(rowNode);
            } else if (_missing(rowNode.childStore)) {
                const storeParams = this.serverSideRowModel.getParams();
                rowNode.childStore = this.createBean(this.storeFactory.createStore(storeParams, rowNode));
            }
        } else if (this.gos.get('purgeClosedRowNodes') && _exists(rowNode.childStore)) {
            rowNode.childStore = this.destroyBean(rowNode.childStore)!;
        }

        this.eventSvc.dispatchEvent({ type: 'storeUpdated' });
    }

    private createDetailNode(masterNode: RowNode): RowNode {
        if (_exists(masterNode.detailNode)) {
            return masterNode.detailNode;
        }

        const detailNode = new RowNode(this.beans);

        detailNode.detail = true;
        detailNode.selectable = false;
        detailNode.parent = masterNode;

        if (_exists(masterNode.id)) {
            detailNode.id = 'detail_' + masterNode.id;
        }

        detailNode.data = masterNode.data;
        detailNode.level = masterNode.level + 1;

        const defaultDetailRowHeight = 200;
        const rowHeight = _getRowHeightForNode(this.gos, detailNode).height;

        detailNode.rowHeight = rowHeight ? rowHeight : defaultDetailRowHeight;
        masterNode.detailNode = detailNode;

        return detailNode;
    }
}
