import type { NamedBean } from '../context/bean';
import { BeanStub } from '../context/beanStub';
import { ROW_ID_PREFIX_BOTTOM_PINNED, ROW_ID_PREFIX_TOP_PINNED, RowNode } from '../entities/rowNode';
import type { CssVariablesChanged } from '../events';
import { _getRowHeightForNode, _getRowIdCallback } from '../gridOptionsUtils';
import type { RowPinnedType } from '../interfaces/iRowNode';
import { _warn } from '../validation/logging';

/**
 * Cache that maintains record of insertion order
 *
 * Allows lookup by key as well as insertion order (which is why we didn't use Map)
 */
interface OrderedCache<T extends { id: string | undefined }> {
    cache: Partial<Record<string, T>>;
    order: string[];
}

export class PinnedRowModel extends BeanStub implements NamedBean {
    beanName = 'pinnedRowModel' as const;

    private nextId = 0;
    private pinnedTopRows: OrderedCache<RowNode> = { cache: {}, order: [] };
    private pinnedBottomRows: OrderedCache<RowNode> = { cache: {}, order: [] };

    public postConstruct(): void {
        const gos = this.gos;
        this.setPinnedRowData(gos.get('pinnedTopRowData'), 'top');
        this.setPinnedRowData(gos.get('pinnedBottomRowData'), 'bottom');
        this.addManagedPropertyListener('pinnedTopRowData', (e) => this.setPinnedRowData(e.currentValue, 'top'));
        this.addManagedPropertyListener('pinnedBottomRowData', (e) => this.setPinnedRowData(e.currentValue, 'bottom'));
        this.addManagedEventListeners({ gridStylesChanged: this.onGridStylesChanges.bind(this) });
    }

    public isEmpty(floating: RowPinnedType): boolean {
        return this.getCache(floating).order.length === 0;
    }

    public isRowsToRender(floating: RowPinnedType): boolean {
        return !this.isEmpty(floating);
    }

    private onGridStylesChanges(e: CssVariablesChanged) {
        if (e.rowHeightChanged) {
            const estimateRowHeight = (rowNode: RowNode) => {
                rowNode.setRowHeight(rowNode.rowHeight, true);
            };
            forEach(this.pinnedBottomRows, estimateRowHeight);
            forEach(this.pinnedTopRows, estimateRowHeight);
        }
    }

    public ensureRowHeightsValid(): boolean {
        let anyChange = false;
        let rowTop = 0;
        const updateRowHeight = (rowNode: RowNode) => {
            if (rowNode.rowHeightEstimated) {
                const rowHeight = _getRowHeightForNode(this.beans, rowNode);
                rowNode.setRowTop(rowTop);
                rowNode.setRowHeight(rowHeight.height);
                rowTop += rowHeight.height;
                anyChange = true;
            }
        };
        forEach(this.pinnedBottomRows, updateRowHeight);
        rowTop = 0;
        forEach(this.pinnedTopRows, updateRowHeight);

        this.eventSvc.dispatchEvent({
            type: 'pinnedHeightChanged',
        });

        return anyChange;
    }

    private setPinnedRowData(rowData: any[] | undefined, floating: NonNullable<RowPinnedType>): void {
        this.updateNodesFromRowData(rowData, floating);
        this.eventSvc.dispatchEvent({
            type: 'pinnedRowDataChanged',
        });
    }

    /**
     * Updates existing RowNode instances and creates new ones if necessary
     *
     * Setting data as `undefined` will clear row nodes
     */
    private updateNodesFromRowData(allData: any[] | undefined, floating: NonNullable<RowPinnedType>): void {
        const nodes = this.getCache(floating);

        if (allData === undefined) {
            nodes.order.length = 0;
            nodes.cache = {};
            return;
        }

        const getRowId = _getRowIdCallback(this.gos);
        const idPrefix = floating === 'top' ? ROW_ID_PREFIX_TOP_PINNED : ROW_ID_PREFIX_BOTTOM_PINNED;

        // We'll want to remove all nodes that aren't matched to data
        const nodesToRemove = new Set(nodes.order);

        // Data that matches based on ID can nonetheless still appear in a different order than before
        const newOrder: string[] = [];

        // Used for catching duplicate IDs/rows within `allData` itself
        const dataIds = new Set<string>();

        let nextRowTop = 0;
        let i = -1;
        for (const data of allData) {
            const id = getRowId?.({ data, level: 0, rowPinned: floating }) ?? idPrefix + this.nextId++;

            if (dataIds.has(id)) {
                _warn(96, { id, data });
                continue;
            }

            i++;
            dataIds.add(id);
            newOrder.push(id);

            const existingNode = getById(nodes, id);
            if (existingNode !== undefined) {
                if (existingNode.data !== data) {
                    existingNode.setData(data);
                }
                nextRowTop += this.setRowTopAndRowIndex(existingNode, nextRowTop, i);

                // existing nodes that are re-used/updated shouldn't be deleted
                nodesToRemove.delete(id);
            } else {
                // new node
                const rowNode = new RowNode(this.beans);
                rowNode.id = id;
                rowNode.data = data;
                rowNode.rowPinned = floating;
                nextRowTop += this.setRowTopAndRowIndex(rowNode, nextRowTop, i);
                nodes.cache[id] = rowNode;
                nodes.order.push(id);
            }
        }

        nodesToRemove.forEach((id) => {
            getById(nodes, id)?.clearRowTopAndRowIndex();
            delete nodes.cache[id];
        });

        nodes.order = newOrder;
    }

    private setRowTopAndRowIndex(rowNode: RowNode, rowTop: number, rowIndex: number): number {
        rowNode.setRowTop(rowTop);
        rowNode.setRowHeight(_getRowHeightForNode(this.beans, rowNode).height);
        rowNode.setRowIndex(rowIndex);
        return rowNode.rowHeight!;
    }

    public getPinnedTopTotalHeight(): number {
        return getTotalHeight(this.pinnedTopRows);
    }

    public getPinnedBottomTotalHeight(): number {
        return getTotalHeight(this.pinnedBottomRows);
    }

    public getPinnedTopRowCount(): number {
        return getSize(this.pinnedTopRows);
    }

    public getPinnedBottomRowCount(): number {
        return getSize(this.pinnedBottomRows);
    }

    public getPinnedTopRow(index: number): RowNode | undefined {
        return getByIndex(this.pinnedTopRows, index);
    }

    public getPinnedBottomRow(index: number): RowNode | undefined {
        return getByIndex(this.pinnedBottomRows, index);
    }

    public getPinnedRowById(id: string, floating: NonNullable<RowPinnedType>): RowNode | undefined {
        return getById(this.getCache(floating), id);
    }

    public forEachPinnedRow(
        floating: NonNullable<RowPinnedType>,
        callback: (node: RowNode, index: number) => void
    ): void {
        return forEach(this.getCache(floating), callback);
    }

    private getCache(floating: RowPinnedType): OrderedCache<RowNode> {
        return floating === 'top' ? this.pinnedTopRows : this.pinnedBottomRows;
    }
}

function getTotalHeight(rowNodes: OrderedCache<RowNode>): number {
    const size = getSize(rowNodes);
    if (size === 0) {
        return 0;
    }

    const node = getByIndex(rowNodes, size - 1);
    if (node === undefined) {
        return 0;
    }

    return node.rowTop! + node.rowHeight!;
}

function getById<T extends { id: string | undefined }>(cache: OrderedCache<T>, id: string): T | undefined {
    return cache.cache[id];
}

function getByIndex<T extends { id: string | undefined }>(cache: OrderedCache<T>, i: number): T | undefined {
    return getById(cache, cache.order[i]);
}

function forEach<T extends { id: string | undefined }>(
    cache: OrderedCache<T>,
    callback: (item: T, index: number) => void
): void {
    cache.order.forEach((id, index) => {
        const node = getById(cache, id);
        node && callback(node, index);
    });
}

function getSize<T extends { id: string | undefined }>(cache: OrderedCache<T>): number {
    return cache.order.length;
}
