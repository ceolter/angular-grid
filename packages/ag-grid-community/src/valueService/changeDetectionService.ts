import type { NamedBean } from '../context/bean';
import { BeanStub } from '../context/beanStub';
import type { AgColumn } from '../entities/agColumn';
import type { RowNode } from '../entities/rowNode';
import type { CellValueChangedEvent } from '../events';
import { _isClientSideRowModel } from '../gridOptionsUtils';
import type { IClientSideRowModel } from '../interfaces/iClientSideRowModel';
import { ChangedPath } from '../utils/changedPath';

// Matches value in clipboard module
const SOURCE_PASTE = 'paste';
export class ChangeDetectionService extends BeanStub implements NamedBean {
    beanName = 'changeDetectionSvc' as const;

    private clientSideRowModel: IClientSideRowModel | null = null;

    public postConstruct(): void {
        const { gos, rowModel } = this.beans;
        if (_isClientSideRowModel(gos, rowModel)) {
            this.clientSideRowModel = rowModel;
        }

        this.addManagedEventListeners({ cellValueChanged: this.onCellValueChanged.bind(this) });
    }

    private onCellValueChanged(event: CellValueChangedEvent): void {
        const { gos, rowRenderer } = this.beans;
        // Clipboard service manages its own change detection, so no need to do it here.
        // The clipboard manages its own as otherwise this would happen once for every cell
        // that got updated as part of a paste operation, so e.g. if 100 cells in a paste operation,
        // this doChangeDetection would get called 100 times (once for each cell), instead clipboard
        // service executes the logic we have here once (in essence batching up all cell changes
        // into one change detection).
        if (event.source === SOURCE_PASTE || gos.get('suppressChangeDetection')) {
            return;
        }

        const rowNode = event.node as RowNode;

        const nodesToRefresh: RowNode[] = [rowNode];

        const clientSideRowModel = this.clientSideRowModel;
        const rootNode = clientSideRowModel?.rootNode;

        // step 1 of change detection is to update the aggregated values
        if (rootNode && !rowNode.isRowPinned()) {
            const onlyChangedColumns = gos.get('aggregateOnlyChangedColumns');
            const changedPath = new ChangedPath(onlyChangedColumns, rootNode);
            changedPath.addParentNode(rowNode.parent, [event.column as AgColumn]);
            clientSideRowModel.doAggregate(changedPath);

            // add all nodes impacted by aggregation, as they need refreshed also.
            changedPath.forEachChangedNodeDepthFirst((rowNode) => {
                nodesToRefresh.push(rowNode);
            });
        }

        // step 2 of change detection is to refresh the cells
        rowRenderer.refreshCells({ rowNodes: nodesToRefresh });
    }
}
