import type {
    BeanCollection,
    IExpansionService,
    IsServerSideGroupOpenByDefaultParams,
    NamedBean,
    RowGroupOpenedEvent,
    RowNode,
    WithoutGridCommon,
} from 'ag-grid-community';

import { BaseExpansionService } from '../../expansion/baseExpansionService';
import type { ServerSideRowModel } from '../serverSideRowModel';

export class ServerSideExpansionService extends BaseExpansionService implements NamedBean, IExpansionService {
    beanName = 'expansionSvc' as const;

    private serverSideRowModel: ServerSideRowModel;

    public override wireBeans(beans: BeanCollection) {
        super.wireBeans(beans);
        this.serverSideRowModel = beans.rowModel as ServerSideRowModel;
    }

    private queuedRowIds: Set<string> = new Set();

    public postConstruct(): void {
        this.addManagedEventListeners({
            columnRowGroupChanged: () => {
                this.queuedRowIds.clear();
            },
        });
    }

    public checkOpenByDefault(rowNode: RowNode): void {
        if (!rowNode.isExpandable()) {
            return;
        }

        if (this.queuedRowIds.has(rowNode.id!)) {
            this.queuedRowIds.delete(rowNode.id!);
            rowNode.setExpanded(true);
            return;
        }

        const userFunc = this.gos.getCallback('isServerSideGroupOpenByDefault');
        if (!userFunc) {
            return;
        }

        const params: WithoutGridCommon<IsServerSideGroupOpenByDefaultParams> = {
            data: rowNode.data,
            rowNode,
        };

        const userFuncRes = userFunc(params);

        if (userFuncRes) {
            rowNode.setExpanded(true);
        }
    }

    public expandRows(rowIds: string[]): void {
        rowIds.forEach((rowId) => {
            const rowNode = this.serverSideRowModel.getRowNode(rowId);
            if (rowNode) {
                rowNode.setExpanded(true);
            } else {
                this.queuedRowIds.add(rowId);
            }
        });
    }

    public expandAll(value: boolean): void {
        this.serverSideRowModel.expandAll(value);
    }

    public onGroupExpandedOrCollapsed(): void {
        // do nothing
    }

    protected override dispatchExpandedEvent(event: RowGroupOpenedEvent): void {
        this.eventSvc.dispatchEvent(event);
    }
}
