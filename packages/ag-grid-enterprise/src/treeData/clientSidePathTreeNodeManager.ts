import { _warn } from 'ag-grid-community';
import type { ChangedPath, NamedBean, RowNode, RowNodeTransaction } from 'ag-grid-community';

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

        this.addOrUpdateRows(rootNode.allLeafChildren, false);

        this.treeCommit();
    }

    public commitTransactions(
        transactions: RowNodeTransaction<TData>[],
        changedPath: ChangedPath | undefined,
        rowNodesOrderChanged: boolean
    ): void {
        this.treeRoot?.setRow(this.rootNode);

        for (const { remove, update, add } of transactions) {
            // the order of [add, remove, update] is the same as in ClientSideNodeManager.
            // Order is important when a record with the same id is added and removed in the same transaction.
            this.removeRows(remove as RowNode[] | null);
            this.addOrUpdateRows(update as RowNode[] | null, true);
            this.addOrUpdateRows(add as RowNode[] | null, false);
        }

        if (rowNodesOrderChanged) {
            const rows = this.treeRoot?.row?.allLeafChildren;
            if (rows) {
                for (let rowIdx = 0, rowsLen = rows.length; rowIdx < rowsLen; ++rowIdx) {
                    const node = rows[rowIdx].treeNode as TreeNode | null;
                    if (node && node.oldSourceRowIndex !== rowIdx) {
                        node.invalidateOrder(); // Order might have changed
                    }
                }
            }
        }

        this.treeCommit(changedPath); // One single commit for all the transactions
    }

    /** Transactional removal */
    private removeRows(rows: RowNode[] | null | undefined): void {
        for (let i = 0, len = rows?.length ?? 0; i < len; ++i) {
            const row = rows![i];
            const node = row.treeNode as TreeNode | null;
            if (node) {
                this.treeRemove(node, row);
            }
        }
    }

    /** Transactional add/update */
    private addOrUpdateRows(rows: RowNode[] | null, update: boolean): void {
        const treeRoot = this.treeRoot;
        if (!treeRoot) {
            return;
        }
        const getDataPath = this.gos.get('getDataPath');
        for (let i = 0, len = rows?.length ?? 0; i < len; ++i) {
            const row = rows![i];
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
                this.treeSetRow(node, row, update);
            }
        }
    }
}
