import type { NamedBean } from '../context/bean';
import { BeanStub } from '../context/beanStub';
import type { BeanCollection } from '../context/context';
import type { AgColumn } from '../entities/agColumn';
import type { RowNode } from '../entities/rowNode';
import type { CellValueChangedEvent } from '../events';
import { _isClientSideRowModel } from '../gridOptionsUtils';
import type { IClientSideRowModel } from '../interfaces/iClientSideRowModel';
import type { IRowModel } from '../interfaces/iRowModel';
import type { RowRenderer } from '../rendering/rowRenderer';
import { ChangedPath } from '../utils/changedPath';

// Matches value in clipboard module
const SOURCE_PASTE = 'paste';
export class ChangeDetectionService extends BeanStub implements NamedBean {
    beanName = 'changeDetectionSvc' as const;

    private rowModel: IRowModel;
    private rowRenderer: RowRenderer;

    public wireBeans(beans: BeanCollection): void {
        this.rowModel = beans.rowModel;
        this.rowRenderer = beans.rowRenderer;
    }

    private clientSideRowModel: IClientSideRowModel;

    public postConstruct(): void {
        if (_isClientSideRowModel(this.gos, this.rowModel)) {
            this.clientSideRowModel = this.rowModel;
        }

        this.addManagedEventListeners({ cellValueChanged: this.onCellValueChanged.bind(this) });
    }

    private onCellValueChanged(event: CellValueChangedEvent): void {
        // Clipboard service manages its own change detection, so no need to do it here.
        // The clipboard manages its own as otherwise this would happen once for every cell
        // that got updated as part of a paste operation, so e.g. if 100 cells in a paste operation,
        // this doChangeDetection would get called 100 times (once for each cell), instead clipboard
        // service executes the logic we have here once (in essence batching up all cell changes
        // into one change detection).
        if (event.source === SOURCE_PASTE) {
            return;
        }

        this.doChangeDetection(event.node as RowNode, event.column as AgColumn);
    }

    private doChangeDetection(rowNode: RowNode, column: AgColumn): void {
        if (this.gos.get('suppressChangeDetection')) {
            return;
        }

        const nodesToRefresh: RowNode[] = [rowNode];

        const clientSideRowModel = this.clientSideRowModel;
        const rootNode = clientSideRowModel.rootNode;

        // step 1 of change detection is to update the aggregated values
        if (rootNode && !rowNode.isRowPinned()) {
            const onlyChangedColumns = this.gos.get('aggregateOnlyChangedColumns');
            const changedPath = new ChangedPath(onlyChangedColumns, rootNode);
            changedPath.addParentNode(rowNode.parent, [column]);
            clientSideRowModel.doAggregate(changedPath);

            // add all nodes impacted by aggregation, as they need refreshed also.
            changedPath.forEachChangedNodeDepthFirst((rowNode) => {
                nodesToRefresh.push(rowNode);
            });
        }

        // step 2 of change detection is to refresh the cells
        this.rowRenderer.refreshCells({ rowNodes: nodesToRefresh });
    }
}
