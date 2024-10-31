import type { RowNode } from '../entities/rowNode';
import type { IRowModel } from '../interfaces/iRowModel';

interface RangePartition {
    keep: readonly RowNode[];
    discard: readonly RowNode[];
}

export interface ISelectionContext<TNode> {
    reset(): void;
    setRoot(node: TNode): void;
    setEndRange(node: TNode): void;
    getRange(): readonly RowNode[];
    getRoot(): TNode | null;
    isInRange(node: TNode): boolean;
    /**
     * Truncates the range to the given node (assumed to be within the current range).
     * Returns nodes that remain in the current range and those that should be removed
     *
     * @param node - Node at which to truncate the range
     * @returns Object of nodes to either keep or discard (i.e. deselect) from the range
     */
    truncate(node: TNode): RangePartition;
    /**
     * Extends the range to the given node. Returns nodes that remain in the current range
     * and those that should be removed.
     *
     * @param node - Node marking the new end of the range
     * @returns Object of nodes to either keep or discard (i.e. deselect) from the range
     */
    extend(node: TNode, groupSelectsChildren?: boolean): RangePartition;
}

/**
 * The context of a row range selection operation.
 *
 * Used to model the stateful range selection behaviour found in Excel, where
 * a given cell/row represents the "root" of a selection range, and subsequent
 * selections are based off that root.
 *
 * See AG-9620 for more
 */
export class RowRangeSelectionContext implements ISelectionContext<RowNode> {
    private root: RowNode | null = null;
    /**
     * Note that the "end" `RowNode` may come before or after the "root" `RowNode` in the
     * actual grid.
     */
    private end: RowNode | null = null;
    private rowModel: IRowModel;
    private cachedRange: RowNode[] = [];

    constructor(rowModel: IRowModel) {
        this.rowModel = rowModel;
    }

    public reset(): void {
        this.root = null;
        this.end = null;
        this.cachedRange.length = 0;
    }

    public setRoot(node: RowNode): void {
        this.root = node;
        this.end = null;
        this.cachedRange.length = 0;
    }

    public setEndRange(end: RowNode): void {
        this.end = end;
        this.cachedRange.length = 0;
    }

    public getRange(): readonly RowNode[] {
        if (this.cachedRange.length === 0) {
            const root = this.getRoot();
            const end = this.getEnd();

            if (root == null || end == null) {
                return this.cachedRange;
            }

            this.cachedRange = this.rowModel.getNodesInRangeForSelection(root, end);
        }

        return this.cachedRange;
    }

    public isInRange(node: RowNode): boolean {
        if (this.root === null) {
            return false;
        }

        return this.getRange().some((nodeInRange) => nodeInRange.id === node.id);
    }

    public getRoot(): RowNode | null {
        if (this.root && this.root?.key === null) {
            this.root = this.rowModel.getRowNode(this.root.id!) ?? null;
        }

        return this.root;
    }

    private getEnd(): RowNode | null {
        if (this.end && this.end?.key === null) {
            this.end = this.rowModel.getRowNode(this.end.id!) ?? null;
        }

        return this.end;
    }

    public truncate(node: RowNode): RangePartition {
        const range = this.getRange();

        if (range.length === 0) {
            return { keep: [], discard: [] };
        }

        // if root is first, then selection range goes "down" the table
        // so we should be unselecting the range _after_ the given `node`
        const discardAfter = range[0].id === this.root!.id;

        const idx = range.findIndex((rowNode) => rowNode.id === node.id);
        if (idx > -1) {
            const above = range.slice(0, idx);
            const below = range.slice(idx + 1);
            this.setEndRange(node);
            return discardAfter ? { keep: above, discard: below } : { keep: below, discard: above };
        } else {
            return { keep: range, discard: [] };
        }
    }

    public extend(node: RowNode, groupSelectsChildren = false): RangePartition {
        const root = this.getRoot();

        // If the root node is null, we cannot iterate from the root to the given `node`.
        // So we keep the existing selection, plus the given `node`, plus any leaf children.
        if (root == null) {
            const keep = this.getRange().slice();
            if (groupSelectsChildren) {
                node.depthFirstSearch((node) => !node.group && keep.push(node));
            }
            keep.push(node);

            // We now have a node we can use as the root of the selection
            this.setRoot(node);

            return { keep, discard: [] };
        }

        const newRange = this.rowModel.getNodesInRangeForSelection(root, node);

        if (newRange.find((newRangeNode) => newRangeNode.id === this.end?.id)) {
            // Range between root and given node contains the current "end"
            // so this is an extension of the current range direction
            this.setEndRange(node);
            return { keep: this.getRange(), discard: [] };
        } else {
            // otherwise, this is an inversion
            const discard = this.getRange().slice();
            this.setEndRange(node);
            return { keep: this.getRange(), discard };
        }
    }
}
