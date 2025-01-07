import type {
    AbstractClientSideNodeManager,
    IClientSideNodeManager,
    NamedBean,
    RefreshModelParams,
    RowNode,
} from 'ag-grid-community';
import { ChangedPath, _error, _getRowIdCallback, _warn } from 'ag-grid-community';

import { AbstractClientSideTreeNodeManager } from './abstractClientSideTreeNodeManager';
import { makeFieldPathGetter } from './fieldAccess';
import type { DataFieldGetter } from './fieldAccess';
import type { TreeNode } from './treeNode';
import type { TreeRow } from './treeRow';

export class ClientSideChildrenTreeNodeManager<TData>
    extends AbstractClientSideTreeNodeManager<TData>
    implements IClientSideNodeManager<TData>, NamedBean
{
    beanName = 'csrmChildrenTreeNodeSvc' as const;

    private childrenGetter: DataFieldGetter<TData, TData[] | null | undefined> | null = null;

    public override get treeData(): boolean {
        return this.gos.get('treeData');
    }

    public override extractRowData(): TData[] | null | undefined {
        const treeRoot = this.treeRoot;
        return treeRoot && Array.from(treeRoot.enumChildren(), (node) => node.row!.data);
    }

    public override destroy(): void {
        super.destroy();

        // Forcefully deallocate memory
        this.childrenGetter = null;
    }

    public override activate(rootNode: RowNode<TData>): void {
        const oldChildrenGetter = this.childrenGetter;
        const childrenField = this.gos.get('treeDataChildrenField' as any);
        if (!oldChildrenGetter || oldChildrenGetter.path !== childrenField) {
            this.childrenGetter = makeFieldPathGetter(childrenField);
        }

        super.activate(rootNode);
    }

    protected override loadNewRowData(rowData: TData[]): void {
        const treeRoot = this.treeRoot!;
        const rootNode = this.rootNode!;
        const childrenGetter = this.childrenGetter;

        const processedData = new Map<TData, RowNode<TData>>();
        const allLeafChildren: TreeRow<TData>[] = [];

        rootNode.allLeafChildren = allLeafChildren;

        this.treeClear(treeRoot);
        treeRoot.setRow(rootNode);

        const processChild = (node: TreeNode, data: TData) => {
            let row = processedData.get(data);
            if (row !== undefined) {
                _error(2, { nodeId: row.id }); // Duplicate node
                return;
            }

            row = this.createRowNode(data, allLeafChildren.length);
            processedData.set(data, row);
            allLeafChildren.push(row);

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

        this.treeCommit();
    }

    public override setImmutableRowData(params: RefreshModelParams<TData>, rowData: TData[]): void {
        this.dispatchRowDataUpdateStartedEvent(rowData);

        const gos = this.gos;
        const treeRoot = this.treeRoot!;
        const rootNode = this.rootNode!;
        const childrenGetter = this.childrenGetter;
        const getRowIdFunc = _getRowIdCallback(gos)!;
        const canReorder = !gos.get('suppressMaintainUnsortedOrder');

        const processedData = new Map<TData, AbstractClientSideNodeManager.RowNode<TData>>();

        const changedPath = new ChangedPath(false, rootNode);
        params.changedPath = changedPath;

        const changedRowNodes = params.changedRowNodes!;

        const oldAllLeafChildren = rootNode.allLeafChildren;
        const allLeafChildren: TreeRow[] = [];
        const nodesToUnselect: TreeRow<TData>[] = [];

        let orderChanged = false;
        let rowsChanged = false;

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
                _warn(2, { nodeId: row.id }); // Duplicate node
                return -1;
            }

            const id = getRowIdFunc({ data, level: parent.level + 1 });

            let created = false;
            row = this.getRowNode(id) as TreeRow<TData> | undefined;
            if (row) {
                if (row.data !== data) {
                    changedRowNodes.update(row);
                    row.updateData(data);
                    if (!row.selectable && row.isSelected()) {
                        nodesToUnselect.push(row);
                    }
                }
            } else {
                row = this.createRowNode(data, -1);
                changedRowNodes.add(row);
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
                rowsChanged = true;
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
                        changedRowNodes.remove(row);
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

        rootNode.allLeafChildren = allLeafChildren;
        treeRoot.allLeafChildren = allLeafChildren;

        if (nodesToUnselect.length) {
            this.deselectNodes(nodesToUnselect);
        }

        this.treeCommit(changedPath);

        const sibling = rootNode.sibling;
        if (sibling) {
            sibling.allLeafChildren = allLeafChildren;
        }

        if (rowsChanged || orderChanged) {
            params.rowDataUpdated = true;
            params.rowNodesOrderChanged ||= orderChanged;
        }
    }

    public override refreshModel(params: RefreshModelParams<TData>): void {
        const { rootNode, treeRoot } = this;
        if (!treeRoot) {
            return; // Not active, destroyed
        }

        if (params.changedProps?.has('treeData') && !params.newData) {
            treeRoot.setRow(rootNode);
            const allLeafChildren = rootNode?.allLeafChildren;
            treeRoot.childrenChanged = true;
            if (allLeafChildren) {
                for (let i = 0, len = allLeafChildren.length; i < len; ++i) {
                    const row = allLeafChildren[i];
                    row.groupData = null;
                    row.treeNode?.invalidate();
                }
            }
            this.treeCommit();
        }

        super.refreshModel(params);
    }
}
