import type { RowNode } from '../entities/rowNode';
import type { IRowNode } from '../interfaces/iRowNode';

export class ChangedRowNodes<TData = any> {
    public readonly removals = new Set<RowNode<TData>>();
    public readonly updates = new Map<RowNode<TData>, boolean>();

    /** Marks a row as removed. Order of operations is: remove, update, add */
    public remove(node: IRowNode<TData>): void {
        const { updates, removals } = this;
        removals.add(node as RowNode<TData>);
        updates.delete(node as RowNode<TData>);
    }

    /** Marks a row as updated. Order of operations is: remove, update, add */
    public update(node: IRowNode<TData>): void {
        const { updates, removals } = this;
        if (!updates.has(node as RowNode<TData>)) {
            removals.delete(node as RowNode<TData>);
            updates.set(node as RowNode<TData>, false);
        }
    }

    /** Marks a row as added. Order of operation is: remove, update, add */
    public add(node: IRowNode<TData>): void {
        this.removals.delete(node as RowNode<TData>);
        this.updates.set(node as RowNode<TData>, true);
    }
}
