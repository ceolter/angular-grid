import type { IClientSideNodeManager, NamedBean, RefreshModelParams, RowNode } from 'ag-grid-community';
import { ChangedRowNodes } from 'ag-grid-community';
import { _error, _getRowIdCallback } from 'ag-grid-community';

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
        const childrenField = this.gos.get('treeDataChildrenField');
        if (!oldChildrenGetter || oldChildrenGetter.path !== childrenField) {
            this.childrenGetter = makeFieldPathGetter(childrenField);
        }

        super.activate(rootNode);
    }

    protected override loadNewRowData(changedRowNodes: ChangedRowNodes<TData>, rowData: TData[]): void {
        const treeRoot = this.treeRoot!;
        const rootNode = changedRowNodes.rootNode;
        const childrenGetter = this.childrenGetter;

        const processedDataSet = new Set<TData>();
        const allLeafChildren: TreeRow<TData>[] = [];

        rootNode.allLeafChildren = allLeafChildren;

        this.treeClear(treeRoot);
        treeRoot.setRow(rootNode);

        const processChild = (node: TreeNode, data: TData) => {
            if (processedDataSet.has(data)) {
                _error(5, { data }); // Duplicate node
                return;
            }

            processedDataSet.add(data);

            const row = this.createRowNode(data, allLeafChildren.length);
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

        this.treeCommit(changedRowNodes);
    }

    public override setImmutableRowData(changedRowNodes: ChangedRowNodes<TData>, rowData: TData[]): boolean {
        const gos = this.gos;
        const treeRoot = this.treeRoot!;
        const rootNode = this.rootNode!;
        const childrenGetter = this.childrenGetter;
        const getRowIdFunc = _getRowIdCallback(gos)!;
        const canReorder = !gos.get('suppressMaintainUnsortedOrder');

        const processedDataSet = new Set<TData>();

        const oldAllLeafChildren = rootNode.allLeafChildren;
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
            if (processedDataSet.has(data)) {
                _error(5, { data }); // Duplicate node
                return -1;
            }

            processedDataSet.add(data);

            const id = getRowIdFunc({ data, level: parent.level + 1 });

            let created = false;
            let row = this.getRowNode(id) as TreeRow<TData> | undefined;
            if (row) {
                if (row.data !== data) {
                    changedRowNodes.update(row);
                    row.updateData(data);
                }
            } else {
                row = this.createRowNode(data, -1);
                changedRowNodes.add(row);
                created = true;
            }

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
                if (node && !processedDataSet.has(row.data!)) {
                    changedRowNodes.remove(row);
                    this.treeRemove(node, row);
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

        this.treeCommit(changedRowNodes);

        if (orderChanged) {
            changedRowNodes.rowsOrderChanged = true;
        }

        return treeChanged || changedRowNodes.hasChanges();
    }

    public override refreshModel(params: RefreshModelParams<TData>): void {
        const { rootNode, treeRoot } = this;

        if (treeRoot && !params.changedRowNodes?.newData && params.changedProps?.has('treeData')) {
            const changedRowNodes = params.changedRowNodes ?? new ChangedRowNodes(rootNode!, false);

            treeRoot.setRow(rootNode);
            const allLeafChildren = rootNode?.allLeafChildren;
            if (allLeafChildren) {
                for (let i = 0, len = allLeafChildren.length; i < len; ++i) {
                    const row = allLeafChildren[i];
                    row.groupData = null;
                    row.treeNode?.invalidate();
                }
            }
            this.treeCommit(changedRowNodes);

            if (!params.changedRowNodes && changedRowNodes.hasChanges()) {
                params.changedRowNodes = changedRowNodes;
            }
        }

        super.refreshModel(params);
    }
}
