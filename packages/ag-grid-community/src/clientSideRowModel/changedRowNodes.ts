import type { RowNode } from '../entities/rowNode';
import type { IChangedRowNodes } from '../interfaces/iClientSideRowModel';
import type { IRowNode } from '../interfaces/iRowNode';
import type { RowNodeTransaction } from '../interfaces/rowNodeTransaction';
import { ChangedPath } from '../utils/changedPath';

export class ChangedRowNodes<TData = any> implements IChangedRowNodes<TData> {
    public readonly changedPath: ChangedPath;
    public readonly removals = new Set<RowNode<TData>>();
    public readonly updates = new Map<RowNode<TData>, boolean>();

    public rowNodeTransactions: RowNodeTransaction<TData>[] | null = null;

    public rowsInserted = false;
    public rowsOrderChanged = false;

    public constructor(public readonly rootNode: RowNode<TData>) {
        this.changedPath = new ChangedPath(false, rootNode);
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
        return this.rowsOrderChanged || this.removals.size > 0 || this.updates.size > 0;
    }
}
