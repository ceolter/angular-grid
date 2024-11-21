import type { AbstractClientSideNodeManager, NamedBean, RefreshModelState, RowNode } from 'ag-grid-community';
import { _error, _getRowIdCallback } from 'ag-grid-community';

import { AbstractClientSideTreeNodeManager } from './abstractClientSideTreeNodeManager';
import { makeFieldPathGetter } from './fieldAccess';
import type { DataFieldGetter } from './fieldAccess';
import type { TreeNode } from './treeNode';
import type { TreeRow } from './treeRow';

export class ClientSideChildrenTreeNodeManager<TData>
    extends AbstractClientSideTreeNodeManager<TData>
    implements NamedBean
{
    beanName = 'csrmChildrenTreeNodeSvc' as const;

    private childrenGetter: DataFieldGetter<TData, TData[] | null | undefined> | null = null;

    public override extractRowData(): TData[] | null | undefined {
        const treeRoot = this.treeRoot;
        return treeRoot && Array.from(treeRoot.enumChildren(), (node) => node.row!.data);
    }

    public override destroy(): void {
        super.destroy();

        // Forcefully deallocate memory
        this.childrenGetter = null;
    }

    public override beginRefreshModel(state: RefreshModelState<TData>): void {
        const gos = this.gos;
        const oldChildrenGetter = this.childrenGetter;
        const childrenField = gos.get('treeDataChildrenField');
        if (!oldChildrenGetter || oldChildrenGetter.path !== childrenField) {
            this.childrenGetter = makeFieldPathGetter(childrenField);
            state.fullReload = true;
        }

        const treeData = gos.get('treeData') && !!this.childrenGetter?.path;
        if (this.treeData !== treeData) {
            this.treeData = treeData;

            const treeRoot = this.treeRoot;
            if (treeRoot) {
                state.setStep('group');
                treeRoot.childrenChanged = true;
                treeRoot.invalidate();
                const allLeafChildren = state.rootNode.allLeafChildren;
                if (allLeafChildren) {
                    for (let i = 0, len = allLeafChildren.length; i < len; ++i) {
                        const row = allLeafChildren[i];
                        const treeNode = row.treeNode as TreeNode | null;
                        treeNode?.invalidate();
                        row.groupData = null;
                    }
                }
            }
        }
    }

    protected override loadNewRowData(state: RefreshModelState<TData>, rowData: TData[]): void {
        const treeRoot = this.treeRoot!;
        const rootNode = state.rootNode;
        const childrenGetter = this.childrenGetter;

        const processedData = new Map<TData, RowNode<TData>>();
        const allLeafChildren: TreeRow<TData>[] = [];

        rootNode.allLeafChildren = allLeafChildren;

        this.treeReset();

        const processChild = (node: TreeNode, data: TData) => {
            let row = processedData.get(data);
            if (row !== undefined) {
                _error(2, { nodeId: row.id }); // Duplicate node
                return;
            }

            row = this.createRowNode(data, allLeafChildren.length);
            processedData.set(data, row);
            allLeafChildren.push(row);
            state.add(row);

            node = node.upsertKey(row.id!);
            this.treeSetRow(node, row, true);

            const children = childrenGetter?.(data);
            if (children) {
                for (let i = 0, len = children.length; i < len; ++i) {
                    processChild(node, children[i]);
                }
            }
        };

        for (let i = 0, len = rowData.length; i < len; ++i) {
            processChild(treeRoot, rowData[i]);
        }
    }

    public override setImmutableRowData(refreshModelState: RefreshModelState<TData>, rowData: TData[]): boolean {
        this.dispatchRowDataUpdateStartedEvent(rowData);

        const gos = this.gos;
        const treeRoot = this.treeRoot!;
        const childrenGetter = this.childrenGetter;
        const getRowIdFunc = _getRowIdCallback(gos)!;
        const canReorder = !gos.get('suppressMaintainUnsortedOrder');

        const processedData = new Map<TData, AbstractClientSideNodeManager.RowNode<TData>>();

        const oldAllLeafChildren = refreshModelState.rootNode.allLeafChildren;
        const allLeafChildren: TreeRow[] = [];

        let orderChanged = false;
        let treeChanged = false;

        const processChildrenNoReorder = (node: TreeNode, children: TData[]): void => {
            for (let i = 0, len = children.length; i < len; ++i) {
                processChild(node, children[i]);
            }
        };

        const processChildrenReOrder = (node: TreeNode, children: TData[]): void => {
            const childrenLen = children?.length;
            let inOrder = true;
            let prevIndex = -1;
            for (let i = 0; i < childrenLen; ++i) {
                const oldSourceRowIndex = processChild(node, children[i]);
                if (oldSourceRowIndex >= 0) {
                    if (oldSourceRowIndex < prevIndex) {
                        inOrder = false;
                    }
                    prevIndex = oldSourceRowIndex;
                }
            }
            if (!inOrder) {
                orderChanged = true;
                if (!node.childrenChanged) {
                    node.childrenChanged = true;
                    node.invalidate();
                }
            }
        };

        const processChildren = canReorder ? processChildrenReOrder : processChildrenNoReorder;

        const processChild = (parent: TreeNode, data: TData): number => {
            let row = processedData.get(data);
            if (row !== undefined) {
                _error(2, { nodeId: row.id }); // Duplicate node
                return -1;
            }

            const id = getRowIdFunc({ data, level: parent.level + 1 });

            let created = false;
            row = this.getRowNode(id) as TreeRow<TData> | undefined;
            if (row) {
                if (row.data !== data) {
                    refreshModelState.update(row);
                    row.updateData(data);
                }
            } else {
                row = this.createRowNode(data, -1);
                refreshModelState.add(row);
                created = true;
            }

            processedData.set(data, row);

            let oldSourceRowIndex: number;
            let node: TreeNode;
            if (canReorder) {
                node = parent.appendKey(row.id!);
                oldSourceRowIndex = row.sourceRowIndex;
                row.sourceRowIndex = allLeafChildren.push(row) - 1;
            } else {
                node = parent.upsertKey(row.id!);
                oldSourceRowIndex = -1;
            }

            if (this.treeSetRow(node, row, created)) {
                treeChanged = true;
            }

            const children = childrenGetter?.(data);
            if (children) {
                processChildren(node, children);
            }

            return oldSourceRowIndex;
        };

        processChildren(treeRoot, rowData);

        if (oldAllLeafChildren) {
            for (let i = 0, len = oldAllLeafChildren.length; i < len; ++i) {
                const row = oldAllLeafChildren[i];
                const node = row.treeNode as TreeNode | null;
                if (node) {
                    const data = row.data;
                    if (data && !processedData.has(data)) {
                        refreshModelState.remove(row);
                        this.treeRemove(node, row);
                    }
                }
            }
        }

        if (!canReorder) {
            // To maintain the old order, we need to process all children as they appear in the node, recursively
            const appendChildren = (node: TreeNode): void => {
                for (const child of node.enumChildren()) {
                    const row = child.row;
                    if (row) {
                        row.sourceRowIndex = allLeafChildren.push(row) - 1;
                        appendChildren(child);
                    }
                }
            };
            appendChildren(treeRoot);
        }

        treeRoot.allLeafChildren = allLeafChildren;
        refreshModelState.rootNode.allLeafChildren = allLeafChildren;

        if (orderChanged) {
            refreshModelState.rowsOrderChanged = true;
        }

        return treeChanged || refreshModelState.hasChanges();
    }
}
