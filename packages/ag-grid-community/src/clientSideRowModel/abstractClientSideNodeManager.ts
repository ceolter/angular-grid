import { BeanStub } from '../context/beanStub';
import type { GetRowIdFunc } from '../entities/gridOptions';
import { RowNode } from '../entities/rowNode';
import { _getRowIdCallback } from '../gridOptionsUtils';
import type {
    ClientSideNodeManagerUpdateRowDataResult,
    IClientSideNodeManager,
} from '../interfaces/iClientSideNodeManager';
import type { IChangedRowNodes, RefreshModelParams } from '../interfaces/iClientSideRowModel';
import type { RowDataTransaction } from '../interfaces/rowDataTransaction';
import { _error, _warn } from '../validation/logging';

const ROOT_NODE_ID = 'ROOT_NODE_ID';

/**
 * This is the type of any row in allLeafChildren and childrenAfterGroup of the ClientSideNodeManager rootNode.
 * ClientSideNodeManager is allowed to update the sourceRowIndex property of the nodes.
 */
interface ClientSideNodeManagerRowNode<TData> extends RowNode<TData> {
    sourceRowIndex: number;
}

/**
 * This is the type of the root RowNode of the ClientSideNodeManager
 * ClientSideNodeManager is allowed to update the allLeafChildren and childrenAfterGroup properties of the root node.
 */
interface ClientSideNodeManagerRootNode<TData> extends RowNode<TData> {
    sibling: ClientSideNodeManagerRootNode<TData>;
    allLeafChildren: ClientSideNodeManagerRowNode<TData>[] | null;
    childrenAfterGroup: ClientSideNodeManagerRowNode<TData>[] | null;
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace AbstractClientSideNodeManager {
    export type RowNode<TData> = ClientSideNodeManagerRowNode<TData>;
    export type RootNode<TData> = ClientSideNodeManagerRootNode<TData>;
}

export abstract class AbstractClientSideNodeManager<TData = any>
    extends BeanStub
    implements IClientSideNodeManager<TData>
{
    private nextId = 0;
    protected allNodesMap: { [id: string]: RowNode<TData> } = {};

    public rootNode: AbstractClientSideNodeManager.RootNode<TData> | null = null;

    public get treeData(): boolean {
        return false; // not supported by this node manager
    }

    public getRowNode(id: string): RowNode | undefined {
        return this.allNodesMap[id];
    }

    public extractRowData(): TData[] | null | undefined {
        return this.rootNode?.allLeafChildren?.map((node) => node.data!);
    }

    public activate(rootNode: ClientSideNodeManagerRootNode<TData>): void {
        this.rootNode = rootNode;

        rootNode.group = true;
        rootNode.level = -1;
        rootNode.id = ROOT_NODE_ID;
        rootNode.allLeafChildren = [];
        rootNode.childrenAfterGroup = [];
        rootNode.childrenAfterSort = [];
        rootNode.childrenAfterAggFilter = [];
        rootNode.childrenAfterFilter = [];

        this.updateRootSiblingArrays(rootNode);
    }

    public deactivate(): void {
        if (this.rootNode) {
            this.allNodesMap = {};
            this.rootNode = null!;
        }
    }

    public override destroy(): void {
        super.destroy();

        // Forcefully deallocate memory
        this.allNodesMap = {};
        this.rootNode = null;
    }

    public setNewRowData(rowData: TData[]): void {
        const rootNode = this.rootNode;
        if (!rootNode) {
            return;
        }

        this.dispatchRowDataUpdateStartedEvent(rowData);

        rootNode.childrenAfterFilter = null;
        rootNode.childrenAfterGroup = null;
        rootNode.childrenAfterAggFilter = null;
        rootNode.childrenAfterSort = null;
        rootNode.childrenMapped = null;
        rootNode.updateHasChildren();

        // Clear internal maps

        this.allNodesMap = {};
        this.nextId = 0;

        this.loadNewRowData(rowData);

        this.updateRootSiblingArrays(rootNode);
    }

    private updateRootSiblingArrays(rootNode: AbstractClientSideNodeManager.RootNode<TData>): void {
        const sibling = rootNode.sibling;
        if (sibling) {
            sibling.childrenAfterFilter = rootNode.childrenAfterFilter;
            sibling.childrenAfterGroup = rootNode.childrenAfterGroup;
            sibling.childrenAfterAggFilter = rootNode.childrenAfterAggFilter;
            sibling.childrenAfterSort = rootNode.childrenAfterSort;
            sibling.childrenMapped = rootNode.childrenMapped;
            sibling.allLeafChildren = rootNode.allLeafChildren;
        }
    }

    protected loadNewRowData(rowData: TData[]): void {
        this.rootNode!.allLeafChildren = rowData?.map((dataItem, index) => this.createRowNode(dataItem, index)) ?? [];
    }

    public setImmutableRowData(params: RefreshModelParams<TData>, rowData: TData[]): void {
        const getRowIdFunc = _getRowIdCallback(this.gos)!;
        const reorder = !this.gos.get('suppressMaintainUnsortedOrder');
        const changedRowNodes = params.changedRowNodes!;
        const appendedNodes: ClientSideNodeManagerRowNode<TData>[] | null = reorder ? null : [];
        const processedNodes = new Set<ClientSideNodeManagerRowNode<TData>>();
        const rootNode = this.rootNode!;
        const oldAllLeafChildren = rootNode.allLeafChildren!;
        const oldAllLeafChildrenLen = oldAllLeafChildren.length;

        let nodesAdded = false;
        let nodesRemoved = false;
        let nodesUpdated = false;
        let orderChanged = false;
        for (let i = 0, prevSourceRowIndex = -1, len = rowData.length; i < len; i++) {
            const data = rowData[i];
            let node: ClientSideNodeManagerRowNode<TData> | undefined = this.getRowNode(
                getRowIdFunc({ data, level: 0 })
            );
            if (!node) {
                node = this.createRowNode(data, -1);
                changedRowNodes.add(node);
                appendedNodes?.push(node);
                nodesAdded = true;
            } else {
                if (reorder) {
                    const sourceRowIndex = node.sourceRowIndex;
                    orderChanged ||=
                        sourceRowIndex <= prevSourceRowIndex || // A node was moved up, so order changed
                        nodesAdded; // A node was inserted not at the end
                    prevSourceRowIndex = sourceRowIndex;
                }
                if (node.data !== data) {
                    nodesUpdated = true;
                    node.updateData(data);
                    changedRowNodes.update(node);
                }
            }
            processedNodes.add(node);
        }

        // Destroy the remaining unprocessed node and collect the removed that were selected.
        const nodesToUnselect: RowNode<TData>[] = [];
        for (let i = 0; i < oldAllLeafChildrenLen; i++) {
            const node = oldAllLeafChildren[i];
            if (!processedNodes.has(node)) {
                nodesRemoved = true;
                if (node.isSelected()) {
                    nodesToUnselect.push(node);
                }
                this.rowNodeDeleted(node);
                changedRowNodes.remove(node);
            }
        }

        if (nodesAdded || nodesRemoved || orderChanged) {
            const newAllLeafChildren = new Array<RowNode<TData>>(processedNodes.size); // Preallocate
            let writeIdx = 0;
            if (!reorder) {
                // All the old nodes will be in the new array in the order they were in the old array
                // At the end of this loop, processedNodes will contain only the new appended nodes
                for (let i = 0; i < oldAllLeafChildrenLen; ++i) {
                    const node = oldAllLeafChildren[i];
                    if (processedNodes.delete(node)) {
                        node.sourceRowIndex = writeIdx;
                        newAllLeafChildren[writeIdx++] = node;
                    }
                }
            }

            for (const node of processedNodes) {
                node.sourceRowIndex = writeIdx;
                newAllLeafChildren[writeIdx++] = node;
            }

            rootNode.allLeafChildren = newAllLeafChildren;
            const sibling = rootNode.sibling;
            if (sibling) {
                sibling.allLeafChildren = newAllLeafChildren;
            }
            params.rowNodesOrderChanged ||= orderChanged;
        }

        if (nodesAdded || nodesRemoved || orderChanged || nodesUpdated) {
            this.deselectNodes(nodesToUnselect);
            params.rowDataUpdated = true;
        }
    }

    /** Called when a node needs to be deleted */
    protected rowNodeDeleted(node: RowNode<TData>): void {
        node.clearRowTopAndRowIndex(); // so row renderer knows to fade row out (and not reposition it)
        const id = node.id!;
        const allNodesMap = this.allNodesMap;
        if (allNodesMap[id] === node) {
            delete allNodesMap[id];
        }
    }

    public updateRowData(
        rowDataTran: RowDataTransaction<TData>,
        changedRowNodes: IChangedRowNodes<TData>
    ): ClientSideNodeManagerUpdateRowDataResult<TData> {
        this.dispatchRowDataUpdateStartedEvent(rowDataTran.add);

        const updateRowDataResult: ClientSideNodeManagerUpdateRowDataResult<TData> = {
            changedRowNodes,
            rowNodeTransaction: { remove: [], update: [], add: [] },
            rowsInserted: false,
        };

        const nodesToUnselect: RowNode[] = [];

        const getRowIdFunc = _getRowIdCallback(this.gos);
        this.executeRemove(getRowIdFunc, rowDataTran, updateRowDataResult, nodesToUnselect);
        this.executeUpdate(getRowIdFunc, rowDataTran, updateRowDataResult, nodesToUnselect);
        this.executeAdd(rowDataTran, updateRowDataResult);

        this.deselectNodes(nodesToUnselect);

        return updateRowDataResult;
    }

    protected executeAdd(
        rowDataTran: RowDataTransaction,
        result: ClientSideNodeManagerUpdateRowDataResult<TData>
    ): void {
        const add = rowDataTran.add;
        if (!add?.length) {
            return;
        }

        let allLeafChildren = this.rootNode!.allLeafChildren!;
        let addIndex = allLeafChildren.length;

        if (typeof rowDataTran.addIndex === 'number') {
            addIndex = this.sanitizeAddIndex(rowDataTran.addIndex);

            if (addIndex > 0) {
                // TODO: this code should not be here, see AG-12602
                // This was a fix for AG-6231, but is not the correct fix
                // We enable it only for trees that use getDataPath and not the new children field
                const getDataPath = this.gos.get('treeData') && this.gos.get('getDataPath');
                if (getDataPath) {
                    for (let i = 0; i < allLeafChildren.length; i++) {
                        const node = allLeafChildren[i];
                        if (node?.rowIndex == addIndex - 1) {
                            addIndex = i + 1;
                            break;
                        }
                    }
                }
            }
        }

        const addLength = add.length;

        const changedRowNodes = result.changedRowNodes;
        // create new row nodes for each data item
        const newNodes = new Array(addLength);
        for (let i = 0; i < addLength; i++) {
            const newNode = this.createRowNode(add[i], addIndex + i);
            changedRowNodes.add(newNode);
            newNodes[i] = newNode;
        }

        const rootNode = this.rootNode!;

        if (addIndex < allLeafChildren.length) {
            // Insert at the specified index

            const nodesBeforeIndex = allLeafChildren.slice(0, addIndex);
            const nodesAfterIndex = allLeafChildren.slice(addIndex, allLeafChildren.length);

            // update latter row indexes
            const nodesAfterIndexFirstIndex = nodesBeforeIndex.length + newNodes.length;
            for (let index = 0, length = nodesAfterIndex.length; index < length; ++index) {
                nodesAfterIndex[index].sourceRowIndex = nodesAfterIndexFirstIndex + index;
            }

            allLeafChildren = [...nodesBeforeIndex, ...newNodes, ...nodesAfterIndex];

            // Mark the result as rows inserted
            result.rowsInserted = true;
        } else {
            // Just append at the end
            allLeafChildren = allLeafChildren.concat(newNodes);
        }

        rootNode.allLeafChildren = allLeafChildren;
        const sibling = rootNode.sibling;
        if (sibling) {
            sibling.allLeafChildren = allLeafChildren;
        }

        // add new row nodes to the transaction add items
        result.rowNodeTransaction.add = newNodes;
    }

    protected executeRemove(
        getRowIdFunc: GetRowIdFunc<TData> | undefined,
        rowDataTran: RowDataTransaction,
        { changedRowNodes, rowNodeTransaction }: ClientSideNodeManagerUpdateRowDataResult<TData>,
        nodesToUnselect: RowNode<TData>[]
    ): void {
        const { remove } = rowDataTran;

        if (!remove?.length) {
            return;
        }

        const rowIdsRemoved: { [key: string]: boolean } = {};

        remove.forEach((item) => {
            const rowNode = this.lookupRowNode(getRowIdFunc, item);

            if (!rowNode) {
                return;
            }

            if (rowNode.isSelected()) {
                nodesToUnselect.push(rowNode);
            }

            // so row renderer knows to fade row out (and not reposition it)
            rowNode.clearRowTopAndRowIndex();

            // NOTE: were we could remove from allLeaveChildren, however removeFromArray() is expensive, especially
            // if called multiple times (eg deleting lots of rows) and if allLeafChildren is a large list
            rowIdsRemoved[rowNode.id!] = true;
            // removeFromArray(this.rootNode.allLeafChildren, rowNode);
            delete this.allNodesMap[rowNode.id!];

            rowNodeTransaction.remove.push(rowNode);
            changedRowNodes.remove(rowNode);
        });

        const rootNode = this.rootNode!;

        rootNode.allLeafChildren = rootNode.allLeafChildren?.filter((rowNode) => !rowIdsRemoved[rowNode.id!]) ?? null;

        // after rows have been removed, all following rows need the position index updated
        rootNode.allLeafChildren?.forEach((node, idx) => {
            node.sourceRowIndex = idx;
        });

        const sibling = rootNode.sibling;
        if (sibling) {
            sibling.allLeafChildren = rootNode.allLeafChildren;
        }
    }

    protected executeUpdate(
        getRowIdFunc: GetRowIdFunc<TData> | undefined,
        rowDataTran: RowDataTransaction,
        { changedRowNodes, rowNodeTransaction }: ClientSideNodeManagerUpdateRowDataResult<TData>,
        nodesToUnselect: RowNode<TData>[]
    ): void {
        const { update } = rowDataTran;
        if (!update?.length) {
            return;
        }

        update.forEach((item) => {
            const rowNode = this.lookupRowNode(getRowIdFunc, item);

            if (!rowNode) {
                return;
            }

            rowNode.updateData(item);
            if (!rowNode.selectable && rowNode.isSelected()) {
                nodesToUnselect.push(rowNode);
            }

            rowNodeTransaction.update.push(rowNode);
            changedRowNodes.update(rowNode);
        });
    }

    protected dispatchRowDataUpdateStartedEvent(rowData?: TData[] | null): void {
        this.eventSvc.dispatchEvent({
            type: 'rowDataUpdateStarted',
            firstRowData: rowData?.length ? rowData[0] : null,
        });
    }

    protected deselectNodes(nodesToUnselect: RowNode<TData>[]): void {
        const source = 'rowDataChanged';
        const selectionSvc = this.beans.selectionSvc;
        const selectionChanged = nodesToUnselect.length > 0;
        if (selectionChanged) {
            selectionSvc?.setNodesSelected({
                newValue: false,
                nodes: nodesToUnselect,
                suppressFinishActions: true,
                source,
            });
        }

        // we do this regardless of nodes to unselect or not, as it's possible
        // a new node was inserted, so a parent that was previously selected (as all
        // children were selected) should not be tri-state (as new one unselected against
        // all other selected children).
        selectionSvc?.updateGroupsFromChildrenSelections?.(source);

        if (selectionChanged) {
            this.eventSvc.dispatchEvent({
                type: 'selectionChanged',
                source: source,
            });
        }
    }

    private sanitizeAddIndex(addIndex: number): number {
        const allChildrenCount = this.rootNode!.allLeafChildren?.length ?? 0;
        if (addIndex < 0 || addIndex >= allChildrenCount || Number.isNaN(addIndex)) {
            return allChildrenCount; // Append. Also for negative values, as it was historically the behavior.
        }

        // Ensure index is a whole number and not a floating point.
        // Use case: the user want to add a row in the middle, doing addIndex = array.length / 2.
        // If the array has an odd number of elements, the addIndex need to be rounded up.
        // Consider that array.slice does round up internally, but we are setting this value to node.sourceRowIndex.
        return Math.ceil(addIndex);
    }

    protected createRowNode(data: TData, sourceRowIndex: number): RowNode<TData> {
        const node: ClientSideNodeManagerRowNode<TData> = new RowNode<TData>(this.beans);
        node.parent = this.rootNode;
        node.level = 0;
        node.group = false;
        node.expanded = false;
        node.sourceRowIndex = sourceRowIndex;

        node.setDataAndId(data, String(this.nextId));

        if (this.allNodesMap[node.id!]) {
            _warn(2, { nodeId: node.id });
        }
        this.allNodesMap[node.id!] = node;

        this.nextId++;

        return node;
    }

    protected lookupRowNode(getRowIdFunc: ((data: any) => string) | undefined, data: TData): RowNode<TData> | null {
        let rowNode: RowNode | undefined;
        if (getRowIdFunc) {
            // find rowNode using id
            const id = getRowIdFunc({ data, level: 0 });
            rowNode = this.allNodesMap[id];
            if (!rowNode) {
                _error(4, { id });
                return null;
            }
        } else {
            // find rowNode using object references
            rowNode = this.rootNode?.allLeafChildren?.find((node) => node.data === data);
            if (!rowNode) {
                _error(5, { data });
                return null;
            }
        }

        return rowNode || null;
    }
}
