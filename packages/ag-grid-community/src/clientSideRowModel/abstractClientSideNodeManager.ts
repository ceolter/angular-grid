import { BeanStub } from '../context/beanStub';
import type { GetRowIdFunc } from '../entities/gridOptions';
import { RowNode } from '../entities/rowNode';
import { _getRowIdCallback } from '../gridOptionsUtils';
import type { RowDataTransaction } from '../interfaces/rowDataTransaction';
import type { RowNodeTransaction } from '../interfaces/rowNodeTransaction';
import { _error, _warn } from '../validation/logging';
import type { RefreshModelState } from './refreshModelState';

/**
 * This is the type of any row in allLeafChildren and childrenAfterGroup of the ClientSideNodeManager rootNode.
 * ClientSideNodeManager is allowed to update the sourceRowIndex property of the nodes.
 */
interface ClientSideNodeManagerRowNode<TData> extends RowNode<TData> {
    sourceRowIndex: number;
    allLeafChildren: ClientSideNodeManagerRowNode<TData>[] | null;
    childrenAfterGroup: ClientSideNodeManagerRowNode<TData>[] | null;
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

export abstract class AbstractClientSideNodeManager<TData = any> extends BeanStub {
    private nextId = 0;
    protected allNodesMap: { [id: string]: RowNode<TData> } = {};

    public treeData: boolean = false;

    public rootNode: AbstractClientSideNodeManager.RootNode<TData> | null = null;

    public getRowNode(id: string): RowNode | undefined {
        return this.allNodesMap[id];
    }

    public extractRowData(): TData[] | null | undefined {
        return this.rootNode?.allLeafChildren?.map((node) => node.data!);
    }

    public beginRefreshModel?(state: RefreshModelState<TData>): void;

    public activate(state: RefreshModelState<TData>): void {
        const rootNode = state.rootNode;
        this.rootNode = rootNode;

        rootNode.group = true;
        rootNode.level = -1;
        rootNode.id = 'ROOT_NODE_ID';
        rootNode.allLeafChildren = [];
        rootNode.childrenAfterGroup = [];
        rootNode.childrenAfterSort = [];
        rootNode.childrenAfterAggFilter = [];
        rootNode.childrenAfterFilter = [];

        this.updateRootSiblingArrays(rootNode);
    }

    public refreshModel(state: RefreshModelState<TData>): void {
        state.rootNode.updateHasChildren();
        if (state.rowDataUpdated || state.removals.size > 0 || state.updates.size > 0) {
            this.deselectNodesAfterUpdate(state);
        }
    }

    public deactivate(_state: RefreshModelState<TData>): void {
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

    public setNewRowData(state: RefreshModelState, rowData: TData[]): void {
        const rootNode = state.rootNode;

        // - clears selection, done before we set row data to ensure it isn't readded via `selectionSvc.syncInOldRowNode`
        this.beans.selectionSvc?.reset('rowDataChanged');

        this.dispatchRowDataUpdateStartedEvent(rowData);

        rootNode.childrenAfterFilter = null;
        rootNode.childrenAfterGroup = null;
        rootNode.childrenAfterFilter = null;
        rootNode.childrenAfterAggFilter = null;
        rootNode.childrenAfterSort = null;
        rootNode.childrenMapped = null;

        // Clear internal maps

        this.allNodesMap = {};
        this.nextId = 0;

        this.loadNewRowData(state, rowData);

        this.updateRootSiblingArrays(rootNode);
    }

    private updateRootSiblingArrays(rootNode: AbstractClientSideNodeManager.RootNode<TData>): void {
        const sibling = rootNode.sibling;
        if (sibling) {
            sibling.childrenAfterGroup = rootNode.childrenAfterGroup;
            sibling.childrenAfterFilter = rootNode.childrenAfterFilter;
            sibling.childrenAfterAggFilter = rootNode.childrenAfterAggFilter;
            sibling.childrenAfterSort = rootNode.childrenAfterSort;
            sibling.childrenMapped = rootNode.childrenMapped;
            sibling.allLeafChildren = rootNode.allLeafChildren;
        }
    }

    protected loadNewRowData(state: RefreshModelState, rowData: TData[]): void {
        const allLeafChildren = new Array<RowNode<TData>>(rowData.length);
        for (let i = 0, len = rowData.length; i < len; ++i) {
            const node = this.createRowNode(rowData[i], i);
            allLeafChildren[i] = node;
            state.addNode(node);
        }
        state.rootNode.allLeafChildren = allLeafChildren;
    }

    public setImmutableRowData(state: RefreshModelState<TData>, rowData: TData[]): boolean {
        this.dispatchRowDataUpdateStartedEvent(rowData);

        const getRowIdFunc = _getRowIdCallback(this.gos)!;
        const reorder = !this.gos.get('suppressMaintainUnsortedOrder');
        const appendedNodes: ClientSideNodeManagerRowNode<TData>[] | null = reorder ? null : [];
        const processedNodes = new Set<ClientSideNodeManagerRowNode<TData>>();

        if (rowData) {
            for (let i = 0, len = rowData.length; i < len; i++) {
                const data = rowData[i];
                const id = getRowIdFunc({ data, level: 0 });
                let node = this.getRowNode(id);

                if (!node) {
                    node = this.createRowNode(data, -1);
                    state.addNode(node);
                    appendedNodes?.push(node);
                } else if (node.data !== data) {
                    node.updateData(data);
                    state.updateNode(node);
                }

                processedNodes.add(node);
            }
        }

        const rootNode = state.rootNode;
        const oldAllLeafChildren = rootNode.allLeafChildren;

        let newAllLeafChildren: RowNode<TData>[];

        if (appendedNodes !== null) {
            newAllLeafChildren = [];
            for (let i = 0, len = oldAllLeafChildren?.length ?? 0; i < len; i++) {
                const node = oldAllLeafChildren![i];
                if (!processedNodes.has(node)) {
                    this.rowNodeDeleted(state, node);
                } else {
                    node.sourceRowIndex = newAllLeafChildren.push(node) - 1;
                }
            }
            for (let i = 0; i < appendedNodes.length; ++i) {
                const node = appendedNodes[i];
                node.sourceRowIndex = newAllLeafChildren.push(node) - 1;
            }
        } else {
            for (let i = 0, len = oldAllLeafChildren?.length ?? 0; i < len; i++) {
                const node = oldAllLeafChildren![i];
                if (!processedNodes.has(node)) {
                    this.rowNodeDeleted(state, node);
                }
            }
            let index = 0;
            let orderChanged = false;
            newAllLeafChildren = new Array<RowNode<TData>>(processedNodes.size);
            for (const node of processedNodes) {
                const oldSourceRowIndex = node.sourceRowIndex;
                if (oldSourceRowIndex !== index) {
                    node.sourceRowIndex = index;
                    orderChanged ||= oldSourceRowIndex >= 0;
                }
                newAllLeafChildren[index++] = node;
            }
            state.rowsOrderChanged ||= orderChanged;
        }

        if (!state.hasNodeChanges() && oldAllLeafChildren) {
            return false; // Nothing changed, we keep the old array.
        }

        rootNode.allLeafChildren = newAllLeafChildren;
        const sibling = rootNode.sibling;
        if (sibling) {
            sibling.allLeafChildren = newAllLeafChildren;
        }

        return true;
    }

    public applyTransaction(
        state: RefreshModelState<TData>,
        rowDataTran: RowDataTransaction<TData>,
        getRowIdFunc: GetRowIdFunc<TData> | undefined
    ): RowNodeTransaction<TData> {
        this.dispatchRowDataUpdateStartedEvent(rowDataTran.add);

        const remove = this.executeRemove(state, rowDataTran.remove, getRowIdFunc);
        const update = this.executeUpdate(state, rowDataTran.update, getRowIdFunc);
        const add = this.executeAdd(state, rowDataTran.addIndex, rowDataTran.add);

        state.setDeltaUpdate();
        if (remove.length || update.length || add.length) {
            state.setRowDataUpdated();
        }

        return { remove, update, add };
    }

    /** Called when a node needs to be deleted */
    protected rowNodeDeleted(state: RefreshModelState<TData> | null, node: RowNode<TData>): void {
        state?.removeNode(node);
        node.clearRowTopAndRowIndex(); // so row renderer knows to fade row out (and not reposition it)
        const id = node.id!;
        const allNodesMap = this.allNodesMap;
        if (allNodesMap[id] === node) {
            delete allNodesMap[id];
        }
    }

    protected executeRemove(
        state: RefreshModelState<TData>,
        remove: TData[] | null | undefined,
        getRowIdFunc: GetRowIdFunc<TData> | undefined
    ): RowNode<TData>[] {
        const result: RowNode<TData>[] = [];

        const removeLen = remove?.length;
        if (!removeLen) {
            return result;
        }

        for (let i = 0; i < removeLen; i++) {
            const rowNode = this.lookupRowNode(getRowIdFunc, remove[i]);
            if (rowNode) {
                state.removeNode(rowNode);
            }
        }

        const rootNode = state.rootNode;
        const oldAllLeafChildren = rootNode.allLeafChildren ?? [];
        const newAllLeafChildren: RowNode<TData>[] = [];

        const removals = state.removals;
        for (let i = 0, len = oldAllLeafChildren.length; i < len; i++) {
            const node = oldAllLeafChildren[i];
            if (removals.has(node)) {
                this.rowNodeDeleted(state, node);
                result.push(node);
            } else {
                // Append the node and update its index
                node.sourceRowIndex = newAllLeafChildren.push(node) - 1;
            }
        }

        rootNode.allLeafChildren = newAllLeafChildren;
        const sibling = rootNode.sibling;
        if (sibling) {
            sibling.allLeafChildren = newAllLeafChildren;
        }

        return result;
    }

    protected executeUpdate(
        state: RefreshModelState<TData>,
        update: TData[] | null | undefined,
        getRowIdFunc: GetRowIdFunc<TData> | undefined
    ): RowNode<TData>[] {
        const result: RowNode<TData>[] = [];
        for (let i = 0, updateLen = update?.length ?? 0; i < updateLen; i++) {
            const item = update![i];
            const rowNode = this.lookupRowNode(getRowIdFunc, item);
            if (rowNode) {
                result.push(rowNode);
                rowNode.updateData(item);
                state.updateNode(rowNode);
            }
        }
        return result;
    }

    protected executeAdd(
        state: RefreshModelState<TData>,
        addIndex: number | null | undefined,
        add: TData[] | null | undefined
    ): RowNode<TData>[] {
        const addLength = add?.length;
        if (!addLength) {
            return [];
        }

        const rootNode = state.rootNode;
        let allLeafChildren = (rootNode.allLeafChildren ??= []);
        const allLeafChildrenLen = allLeafChildren.length;

        if (typeof addIndex !== 'number') {
            addIndex = allLeafChildrenLen;
        } else {
            addIndex = sanitizeAddIndex(addIndex, allLeafChildrenLen);
            if (addIndex > 0) {
                // TODO: this code should not be here, see AG-12602
                // This was a fix for AG-6231, but is not the correct fix
                // We enable it only for trees that use getDataPath and not the new children field
                const getDataPath = this.gos.get('treeData') && this.gos.get('getDataPath');
                if (getDataPath) {
                    for (let i = 0; i < allLeafChildrenLen; ++i) {
                        const node = allLeafChildren[i];
                        if (node?.rowIndex == addIndex - 1) {
                            addIndex = i + 1;
                            break;
                        }
                    }
                }
            }
        }

        // create new row nodes for each data item
        const newNodes = new Array<RowNode<TData>>(addLength);
        for (let i = 0; i < addLength; ++i) {
            const newNode = this.createRowNode(add[i], addIndex + i);
            newNodes[i] = newNode;
            state.addNode(newNode);
        }

        if (addIndex < allLeafChildrenLen) {
            // Insert at the specified index

            state.rowsInserted = true;

            const nodesBefore = allLeafChildren.slice(0, addIndex);
            const nodesAfter = allLeafChildren.slice(addIndex, allLeafChildren.length);

            // update latter row indexes
            const nodesAfterIndexFirstIndex = nodesBefore.length + newNodes.length;
            for (let i = 0, len = nodesAfter.length; i < len; ++i) {
                nodesAfter[i].sourceRowIndex = nodesAfterIndexFirstIndex + i;
            }

            allLeafChildren = nodesBefore.concat(newNodes, nodesAfter);
        } else {
            // Just append at the end

            allLeafChildren = allLeafChildren.concat(newNodes);
        }

        rootNode.allLeafChildren = allLeafChildren;
        const sibling = rootNode.sibling;
        if (sibling) {
            sibling.allLeafChildren = allLeafChildren;
        }

        return newNodes;
    }

    protected dispatchRowDataUpdateStartedEvent(rowData?: TData[] | null): void {
        this.eventSvc.dispatchEvent({
            type: 'rowDataUpdateStarted',
            firstRowData: rowData?.length ? rowData[0] : null,
        });
    }

    protected createRowNode(data: TData, sourceRowIndex: number): RowNode<TData> {
        const node: ClientSideNodeManagerRowNode<TData> = new RowNode<TData>(this.beans);
        node.parent = this.rootNode;
        node.level = 0;
        node.group = false;
        node.expanded = false;
        node.sourceRowIndex = sourceRowIndex;

        node.setDataAndId(data, String(this.nextId));

        const nodeId = node.id!;
        const allNodesMap = this.allNodesMap;
        if (allNodesMap[nodeId]) {
            _warn(2, { nodeId });
        }
        allNodesMap[nodeId] = node;

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
                _error(5, { data }); // Could not find data item
                return null;
            }
        }

        return rowNode || null;
    }

    private deselectNodesAfterUpdate(state: RefreshModelState<TData>) {
        const nodesToUnselect: RowNode[] = [];
        for (const removedNode of state.removals) {
            // do delete - setting 'suppressFinishActions = true' to ensure EVENT_SELECTION_CHANGED is not raised for
            // each row node updated, instead it is raised once by the calling code if any selected nodes exist.
            if (removedNode.isSelected()) {
                nodesToUnselect.push(removedNode);
            }
        }

        for (const updatedNode of state.updates.keys()) {
            if (!updatedNode.selectable && updatedNode.isSelected()) {
                nodesToUnselect.push(updatedNode);
            }
        }

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
        if (selectionChanged || (state.updates.size && !state.newData)) {
            selectionSvc?.updateGroupsFromChildrenSelections?.(source);
        }

        if (selectionChanged) {
            this.eventSvc.dispatchEvent({ type: 'selectionChanged', source: source });
        }
    }
}

const sanitizeAddIndex = (addIndex: number, allLeafChildrenLen: number): number => {
    if (addIndex < 0 || addIndex >= allLeafChildrenLen || Number.isNaN(addIndex)) {
        return allLeafChildrenLen; // Append. Also for negative values, as it was historically the behavior.
    }

    // Ensure index is a whole number and not a floating point.
    // Use case: the user want to add a row in the middle, doing addIndex = array.length / 2.
    // If the array has an odd number of elements, the addIndex need to be rounded up.
    // Consider that array.slice does round up internally, but we are setting this value to node.sourceRowIndex.
    return Math.ceil(addIndex);
};
