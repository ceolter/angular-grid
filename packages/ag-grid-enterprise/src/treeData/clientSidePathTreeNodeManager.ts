import { _warn } from 'ag-grid-community';
import type { GetDataPath, NamedBean, RefreshModelState, RowNode } from 'ag-grid-community';

import { AbstractClientSideTreeNodeManager } from './abstractClientSideTreeNodeManager';
import type { TreeNode } from './treeNode';

export class ClientSidePathTreeNodeManager<TData>
    extends AbstractClientSideTreeNodeManager<TData>
    implements NamedBean
{
    beanName = 'csrmPathTreeNodeSvc' as const;

    protected override loadNewRowData(refreshModelState: RefreshModelState<TData>, rowData: TData[]): void {
        const rootNode = refreshModelState.rootNode;
        const treeRoot = this.treeRoot!;

        this.treeClear(treeRoot);
        treeRoot.setRow(rootNode);

        super.loadNewRowData(refreshModelState, rowData);

        const allLeafChildren = rootNode.allLeafChildren!;
        const getDataPath = this.gos.get('getDataPath');
        for (let i = 0, len = allLeafChildren.length; i < len; ++i) {
            this.addOrUpdateRow(getDataPath, allLeafChildren[i], true);
        }

        this.treeCommit(refreshModelState);
    }

    public override get treeData(): boolean {
        const gos = this.gos;
        return gos.get('treeData') && !!gos.get('getDataPath');
    }

    public override refreshModel(state: RefreshModelState<TData>): void {
        if (state.hasChanges()) {
            this.executeUpdates(state);
        }

        super.refreshModel(state);
    }

    private executeUpdates(state: RefreshModelState<TData>): void {
        const treeRoot = this.treeRoot;
        if (!treeRoot) {
            return; // Destroyed or not active
        }

        treeRoot.setRow(this.rootNode);

        for (const row of state.removals) {
            const node = row.treeNode as TreeNode | null;
            if (node) {
                this.treeRemove(node, row);
            }
        }

        const updates = state.updates;
        const getDataPath = this.gos.get('getDataPath');
        for (const row of updates.keys()) {
            if (row.data) {
                this.addOrUpdateRow(getDataPath, row, updates.get(row)!);
            }
        }

        const rows = treeRoot.row?.allLeafChildren;

        if (rows && (state.rowsOrderChanged || state.rowsInserted)) {
            for (let rowIdx = 0, rowsLen = rows.length; rowIdx < rowsLen; ++rowIdx) {
                const node = rows[rowIdx].treeNode as TreeNode | null;
                if (node && node.sourceIdx !== rowIdx) {
                    node.invalidateOrder(); // Order might have changed
                }
            }
        }

        this.treeCommit(state); // One single commit for all the transactions
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
