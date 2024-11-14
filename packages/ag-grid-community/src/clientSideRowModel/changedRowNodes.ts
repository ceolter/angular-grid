import type { RowNode } from '../entities/rowNode';
import type { IRowNode } from '../interfaces/iRowNode';
import type { RowNodeTransaction } from '../interfaces/rowNodeTransaction';
import { ChangedPath } from '../utils/changedPath';
import type { AbstractClientSideNodeManager } from './abstractClientSideNodeManager';

export class ChangedRowNodes<TData = any> {
    /** The ChangedPath containing the changed parent nodes in DFS order. */
    public readonly changedPath: ChangedPath;

    /**
     * The set of removed nodes.
     * Mutually exclusive, if a node is here, it cannot be in the updates map.
     */
    public readonly removals = new Set<RowNode<TData>>();

    /**
     * Map of row nodes that have been updated.
     * The value is true if the row node is a new node. is false if it was just updated.
     */
    public readonly updates = new Map<RowNode<TData>, boolean>();

    /**
     * The list of transactions that are being executed.
     * Is null if no transactions are being executed, that can happen for newData or for immutable updates.
     */
    public rowNodeTransactions: RowNodeTransaction<TData>[] | null = null;

    /** true if rows were inserted in the middle of something else and not just appended or removed. */
    public rowsInserted = false;

    /** true if the order of root.allLeafChildren has changed. */
    public rowsOrderChanged = false;

    public constructor(
        /** The CSRM rootNode */
        public readonly rootNode: AbstractClientSideNodeManager.RootNode<TData>,

        /**
         * Indicates a completely new rowData array is loaded.
         * If this is true, we consider this a new reload of data from scratch, or a first load of data.
         * In this case, removals will not contain the previous cleared rows.
         * Is true if user called setRowData() (or a new page in pagination). the grid scrolls back to the top when this is true.
         */
        public readonly newData: boolean
    ) {
        const changedPath = new ChangedPath(false, rootNode);
        this.changedPath = changedPath;

        if (newData) {
            // We disable the ChangedPath as all paths are new
            changedPath.active = false;
        }
    }

    public remove(node: IRowNode<TData>): void {
        this.removals.add(node as RowNode<TData>);
        this.updates.delete(node as RowNode<TData>);
    }

    public update(node: IRowNode<TData>): boolean {
        const updates = this.updates;
        if (updates.has(node as RowNode<TData>)) {
            return false;
        }
        updates.set(node as RowNode<TData>, false);
        return true;
    }

    public add(node: IRowNode<TData>): void {
        this.updates.set(node as RowNode<TData>, true);
    }

    public hasChanges(): boolean {
        return this.newData || this.rowsOrderChanged || this.removals.size > 0 || this.updates.size > 0;
    }
}
