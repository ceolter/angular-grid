import type { RowNode } from '../entities/rowNode';
import type { ChangedRowNodesFlags, IChangedRowNodes } from '../interfaces/iClientSideRowModel';
import type { IRowNode } from '../main-umd-noStyles';

export class ChangedRowNodes<TData = any> implements IChangedRowNodes<TData> {
    public readonly removed = new Set<RowNode<TData>>();
    public readonly updated = new Map<RowNode<TData>, ChangedRowNodesFlags>();

    /** Marks a row as removed. Order of operations is: remove, update, add */
    public remove(node: IRowNode<TData>): void {
        this.removed.add(node as RowNode<TData>);
        this.updated.delete(node as RowNode<TData>);
    }

    /** Marks a row as updated. Order of operations is: remove, update, add */
    public update(node: IRowNode<TData>): void {
        const updated = this.updated;
        const flags = updated.get(node as RowNode<TData>);
        if (flags === undefined) {
            updated.set(node as RowNode<TData>, this.removed.delete(node as RowNode<TData>) ? 1 : 2);
        } else if (flags !== 1) {
            updated.set(node as RowNode<TData>, 3);
        }
    }

    /** Marks a row as added. Order of operation is: remove, update, add */
    public add(node: IRowNode<TData>): void {
        const updated = this.updated;
        if (!updated.has(node as RowNode<TData>)) {
            this.removed.delete(node as RowNode<TData>);
            updated.set(node as RowNode<TData>, 1);
        }
    }
}
