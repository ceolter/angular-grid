import type { IClientSideNodeManager, NamedBean, RefreshModelParams, RowNode } from 'ag-grid-community';
import { ChangedPath, _error, _getRowIdCallback } from 'ag-grid-community';

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

    protected override loadNewRowData(rowData: TData[]): void {
        const treeRoot = this.treeRoot!;
        const rootNode = this.rootNode!;
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
            this.treeSetRow(node, row, false);

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
        const gos = this.gos;
        const treeRoot = this.treeRoot!;
        const rootNode = this.rootNode!;
        const childrenGetter = this.childrenGetter;
        const getRowIdFunc = _getRowIdCallback(gos)!;
        const canReorder = !gos.get('suppressMaintainUnsortedOrder');

        const processedDataSet = new Set<TData>();

        const changedPath = new ChangedPath(false, rootNode);
        params.changedPath = changedPath;

        const oldAllLeafChildren = rootNode.allLeafChildren;
        const allLeafChildren: TreeRow[] = [];

        let orderChanged = false;
        let rowsChanged = false;

        const processChildrenNoReorder = (node: TreeNode, children: TData[]): void => {
            for (let i = 0, len = children.length; i < len; ++i) {
                processChild(node, children[i]);
            }
        };

        const processChildrenReOrder = (node: TreeNode, children: TData[]): void => {
            const childrenLen = children?.length;
            let minIndex = -1;
            let inOrder = true;
            for (let i = 0; i < childrenLen; ++i) {
                const sourceRowIndex = processChild(node, children[i])?.row?.sourceRowIndex ?? -1;
                if (sourceRowIndex >= 0) {
                    if (sourceRowIndex < minIndex) {
                        inOrder = false;
                    }
                    minIndex = sourceRowIndex;
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

        const processChild = (node: TreeNode, data: TData): TreeNode | null => {
            if (processedDataSet.has(data)) {
                _error(5, { data }); // Duplicate node
                return null;
            }

            processedDataSet.add(data);

            const id = getRowIdFunc({ data, level: node.level + 1 });

            let update = false;
            let row = this.getRowNode(id) as TreeRow<TData> | undefined;
            if (row) {
                if (row.data !== data) {
                    row.setData(data);
                    update = true;
                }
            } else {
                row = this.createRowNode(data, -1);
            }

            if (canReorder) {
                node = node.appendKey(row.id!);
                row.sourceRowIndex = allLeafChildren.push(row) - 1;
            } else {
                node = node.upsertKey(row.id!);
            }

            if (this.treeSetRow(node, row, update)) {
                rowsChanged = true;
            }

            const children = childrenGetter?.(data);
            if (children) {
                processChildren(node, children);
            }

            return node;
        };

        processChildren(treeRoot, rowData);

        if (oldAllLeafChildren) {
            for (let i = 0, len = oldAllLeafChildren.length; i < len; ++i) {
                const row = oldAllLeafChildren[i];
                const node = row.treeNode as TreeNode | null;
                if (node && !processedDataSet.has(row.data!)) {
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

        this.treeCommit(changedPath);

        if (rowsChanged || orderChanged) {
            params.step = 'group';
            params.rowDataUpdated = true;
            params.rowNodesOrderChanged = orderChanged;
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
            if (allLeafChildren) {
                for (let i = 0, len = allLeafChildren.length; i < len; ++i) {
                    allLeafChildren[i].treeNode?.invalidate();
                }
            }
            this.treeCommit();
        }

        super.refreshModel(params);
    }
}
