import type { IClientSideNodeManager, NamedBean, RowNode } from 'ag-grid-community';
import { _logError } from 'ag-grid-community';

import { AbstractClientSideTreeNodeManager } from './abstractClientSideTreeNodeManager';
import { makeFieldPathGetter } from './fieldAccess';
import type { DataFieldGetter } from './fieldAccess';
import type { TreeNode } from './treeNodeManager/treeNode';
import type { TreeRow } from './treeNodeManager/treeRow';

export class ClientSideChildrenTreeNodeManager<TData>
    extends AbstractClientSideTreeNodeManager<TData>
    implements IClientSideNodeManager<TData>, NamedBean
{
    beanName = 'clientSideChildrenTreeNodeManager' as const;

    private childrenGetter: DataFieldGetter<TData, TData[] | null | undefined>;

    public override extractRowData(): TData[] | null | undefined {
        return Array.from(this.treeNodeManager.root.enumChildren(), (node) => node.row!.data);
    }

    public override activate(rootRow: RowNode<TData>): void {
        const oldChildrenGetter = this.childrenGetter;
        const childrenField = this.gos.get('treeDataChildrenField');
        if (!oldChildrenGetter || oldChildrenGetter.path !== childrenField) {
            this.childrenGetter = makeFieldPathGetter(childrenField);
        }

        super.activate(rootRow);
    }

    protected override loadNewRowData(rowData: TData[]): void {
        const { rootRow, treeNodeManager, childrenGetter } = this;

        const processedDataSet = new Set<TData>();
        const allLeafChildren: TreeRow<TData>[] = [];

        rootRow.allLeafChildren = allLeafChildren;

        treeNodeManager.activate(rootRow);
        treeNodeManager.clearTree(this.treeNodeManager.root);

        const addChild = (parent: TreeNode, data: TData) => {
            if (processedDataSet.has(data)) {
                _logError(5, { data }); // Duplicate node
                return;
            }

            processedDataSet.add(data);

            const row = this.createRowNode(data, allLeafChildren.length);
            allLeafChildren.push(row);

            parent = parent.upsertKey(row.id!);
            treeNodeManager.addOrUpdateRow(parent, row, false);

            const children = childrenGetter(data);
            if (children) {
                for (let i = 0, len = children.length; i < len; ++i) {
                    addChild(parent, children[i]);
                }
            }
        };

        const rootTreeNode = this.treeNodeManager.root;
        for (let i = 0, len = rowData.length; i < len; ++i) {
            addChild(rootTreeNode, rowData[i]);
        }

        treeNodeManager.commitTree();
    }

    public onTreeDataChanged() {
        const { rootRow } = this;
        this.treeNodeManager.activate(rootRow);
        const allLeafChildren = this.rootRow.allLeafChildren!;
        for (let i = 0, len = allLeafChildren.length; i < len; ++i) {
            (allLeafChildren[i] as TreeRow<TData>).treeNode?.invalidate();
        }
        this.treeNodeManager.commitTree();
    }
}
