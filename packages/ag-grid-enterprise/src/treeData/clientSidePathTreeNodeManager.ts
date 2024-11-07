import { _warn } from 'ag-grid-community';
import type {
    ChangedPath,
    GetDataPath,
    IChangedRowNodes,
    NamedBean,
    RefreshModelParams,
    RowNode,
} from 'ag-grid-community';

import { AbstractClientSideTreeNodeManager } from './abstractClientSideTreeNodeManager';
import type { TreeNode } from './treeNode';

export class ClientSidePathTreeNodeManager<TData>
    extends AbstractClientSideTreeNodeManager<TData>
    implements NamedBean
{
    beanName = 'csrmPathTreeNodeSvc' as const;

    protected override loadNewRowData(rowData: TData[]): void {
        const rootNode = this.rootNode!;
        const treeRoot = this.treeRoot!;

        this.treeClear(treeRoot);
        treeRoot.setRow(rootNode);

        super.loadNewRowData(rowData);

        const allLeafChildren = rootNode.allLeafChildren!;
        const getDataPath = this.gos.get('getDataPath');
        for (let i = 0, len = allLeafChildren.length; i < len; ++i) {
            this.addOrUpdateRow(getDataPath, allLeafChildren[i], true);
        }

        this.treeCommit();
    }

    public override get treeData(): boolean {
        const gos = this.gos;
        return gos.get('treeData') && !!gos.get('getDataPath');
    }

    public override refreshModel(params: RefreshModelParams<TData>): void {
        const changedRowNodes = params.changedRowNodes;
        if (changedRowNodes) {
            this.executeTransactions(changedRowNodes, params.changedPath, params.rowNodesOrderChanged);
        }

        super.refreshModel(params);
    }

    private executeTransactions(
        changedRowNodes: IChangedRowNodes,
        changedPath: ChangedPath | undefined,
        rowNodesOrderMaybeChanged: boolean | undefined
    ): void {
        const treeRoot = this.treeRoot;
        if (!treeRoot) {
            return; // Destroyed or not active
        }

        treeRoot.setRow(this.rootNode);

        for (const row of changedRowNodes.removals) {
            const node = row.treeNode as TreeNode | null;
            if (node) {
                this.treeRemove(node, row);
            }
        }

        const updates = changedRowNodes.updates;
        const getDataPath = this.gos.get('getDataPath');
        for (const row of updates.keys()) {
            this.addOrUpdateRow(getDataPath, row, updates.get(row)!);
        }

        const rows = treeRoot.row?.allLeafChildren;
        if (rowNodesOrderMaybeChanged && rows) {
            for (let rowIdx = 0, rowsLen = rows.length; rowIdx < rowsLen; ++rowIdx) {
                const node = rows[rowIdx].treeNode as TreeNode | null;
                if (node && node.sourceIdx !== rowIdx) {
                    node.invalidateOrder(); // Order might have changed
                }
            }
        }

        this.treeCommit(changedPath); // One single commit for all the transactions
    }

    private addOrUpdateRow(getDataPath: GetDataPath | undefined, row: RowNode, created: boolean): void {
        const treeRoot = this.treeRoot!;
        if (!this.treeData) {
            // We assume that the data is flat and we use id as the key for the tree nodes.
            // This happens when treeData is false and getDataPath is undefined/null.
            this.treeSetRow(treeRoot.upsertKey(row.id!), row, created);
            return;
        }

        const path = getDataPath?.(row.data);
        const pathLength = path?.length;
        if (!pathLength) {
            _warn(185, { data: row.data });
        } else {
            // Gets the last node of a path. Inserts filler nodes where needed.
            let level = 0;
            let node = treeRoot;
            do {
                node = node.upsertKey(path[level++]);
            } while (level < pathLength);
            this.treeSetRow(node, row, created);
        }
    }
}
