import { _EmptyArray } from 'ag-grid-community';
import type { ITreeNode, RowNode } from 'ag-grid-community';

import type { TreeRow } from './treeRow';

const treeNodePositionComparer = (a: RowNode, b: RowNode): number =>
    a.treeNode!.oldSourceRowIndex - b.treeNode!.oldSourceRowIndex;

/** An empty iterator, to avoid null checking when we iterate the children map */
const EMPTY_CHILDREN = (_EmptyArray as TreeNode[]).values();

/** Disassociate a node from a row, breaking the association to the node. Only the row is modified, not the TreeNode. */
const orphanRow = (row: TreeRow, root: boolean): void => {
    row.parent = null;
    row.treeNode = null;
    if (root) {
        row.childrenAfterGroup = [];
    } else {
        row.level = 0;
        row.childrenAfterGroup = null;
        row.allLeafChildren = null;
    }
};

/**
 * We keep a secondary tree data structure based on TreeNode together with the RowNodes.
 * We associate a RowNode with a TreeNode, both storing the row in node.row and by storing the TreeNode in row.treeNode field.
 * We break the association when the row is removed or the TreeStrategy destroyed.
 * Consider that a TreeNode can contain more than one RowNode if there are duplicates keys in the same group,
 * in this case it means that the rows will have the same TreeNode.
 *
 * TreeStrategy uses a two stage approach both for first time creation and updates.
 * Multiple updates interact with the tree, and a commit stage commits all updates reducing expensive computations.
 *
 * Operations that do not affect the order will invalidate only the affected paths with node.invalidate(),
 * so that the commit operation will only update the affected paths without traversing the whole tree.
 * Consider that order of invalidated items is not deterministic, so the commit operation should be able to handle any order.
 *
 * During commit, the childrenAfterGroup and allLeafChildren arrays are rebuilt, and the updates are applied.
 * The empty filler nodes nodes are removed.
 * Before commit those arrays are NOT representing the truth, so they should not be used.
 */
export class TreeNode implements ITreeNode {
    /** Contains all the children by their key */
    private children: Map<string, TreeNode> | null = null;

    /**
     * The head of the singly linked list of direct children nodes that are invalidated and need to be committed.
     * We use this so we can invalidate just the path and explore only the invalidated during commit.
     * Also, once a path is invalidated the next invalidation will not add the same node again and stop the recursion quickly.
     */
    private invalidatedHead: TreeNode | null = null;

    /**
     * The next node in the linked list of parent.invalidatedHead.
     * - undefined: the node is not invalidated (not present in the parent linked list)
     * - null: this is the first and last node in the linked list
     * - TreeNode instance: is the next node in the linked list
     */
    private invalidatedNext: TreeNode | null | undefined = undefined;

    /** The RowNode associated to this tree node */
    public row: TreeRow | null = null;

    /** We use this during commit to understand if the row changed. After commit, it will be the same as this.row. */
    public oldRow: TreeRow | null = null;

    /**
     * There may be duplicate rows if they have the same key.
     * This is NOT an edge case, temporarily duplicates may arise during transactions.
     * For example, think about swapping the paths of two nodes, they will have the same key for a short while.
     */
    public duplicateRows: Set<TreeRow> | null = null;

    /** We keep the row.childrenAfterGroup here, we just swap arrays when we assign rows */
    public childrenAfterGroup: TreeRow[] = _EmptyArray;

    /**
     * We keep the row.allLeafChildren here, we just swap arrays when we assign or swap the row to this node.
     * If this is null, we are borrowing the allLeafChildren array from one of the children,
     * in this case the row.allLeafChildren will be the same as one of the childrenAfterGroup[x].allLeafChildren,
     * to get the allLeafChildren if is null, do node.allLeafChildren ?? node.row.allLeafChildren.
     */
    public allLeafChildren: TreeRow[] | null = _EmptyArray;

    /** Indicates whether childrenAfterGroup might need to be recomputed and sorted. Reset during commit. */
    public childrenChanged: boolean = false;

    /** Indicates whether allLeafChildren should be recomputed. Reset to false during commit. */
    public leafChildrenChanged: boolean = false;

    /** This is set if the duplicate key warning was already raised for this node, to reduce the performance hit */
    public duplicateRowsWarned?: boolean;

    /** The ordering this node had in the previous commit. */
    public oldSourceRowIndex: number = -1;

    public constructor(
        /** The parent node of this node. Is null if destroyed or if is the root. */
        public parent: TreeNode | null,

        /** The key of this node. */
        public readonly key: string,

        /** The level of this node. Root has level -1 */
        public readonly level: number
    ) {}

    /** Returns the number of children in this node */
    public get size(): number {
        return this.children?.size ?? 0;
    }

    public isEmptyFillerNode(): boolean {
        return !this.row?.data && !this.children?.size;
    }

    /** Returns an iterator able to iterate all children in this node, in order of insertion */
    public enumChildren(): IterableIterator<TreeNode> {
        return this.children?.values() ?? EMPTY_CHILDREN;
    }

    /**
     * Gets a node a key in the given parent. If the node does not exists, creates a filler node, with null row.
     * We cast to string just to be sure the user passed a string correctly and not a number or something else.
     * @param key - The key of the node to get.
     * @param append - If true, the node will be moved to the end of the children list.
     * @returns the node at the given key, or a new filler node inserted there if it does not exist.
     */
    public upsertKey(key: string | number): TreeNode {
        if (typeof key !== 'string') {
            key = String(key);
        }
        let node = this.children?.get(key);
        if (!node) {
            node = new TreeNode(this, key, this.level + 1);
            (this.children ??= new Map())?.set(node.key, node); // Add to the map
        }
        return node;
    }

    /** Same as upsertKey, but moves the node to the end no matter what. */
    public appendKey(key: string | number): TreeNode {
        const children = this.children;
        if (typeof key !== 'string') {
            key = String(key);
        }
        let node = children?.get(key);
        if (node) {
            children!.delete(key); // Remove from the map
            children!.set(key, node); // Reinsert to the map
        } else {
            node = new TreeNode(this, key, this.level + 1);
            (this.children ??= new Map())?.set(node.key, node); // Add to the map
        }
        return node;
    }

    /** Removes this node from the parent, and free memory. This node cannot be used after this. */
    public destroy(): void {
        const { row, parent } = this;
        if (parent === null) {
            return;
        }
        parent?.children?.delete(this.key);
        if (row !== null) {
            orphanRow(row, true);
        }
        this.parent = null;
    }

    /**
     * Sets the row for the TreeNode.
     * If the row is already set, it will be replaced with the new row, and the old row will be orphaned.
     * childrenAfterGroup and allLeafChildren will be reassigned.
     * @returns True if the row changed
     */
    public setRow(newRow: TreeRow | null): boolean {
        const { level, row: oldRow, childrenAfterGroup } = this;
        if (level < 0) {
            if (oldRow !== null && oldRow !== newRow) {
                orphanRow(oldRow, true);
            }
        } else {
            if (oldRow === newRow) {
                return false; // Already the same row
            }
            if (oldRow !== null) {
                if (newRow !== null) {
                    newRow.allLeafChildren = oldRow.allLeafChildren ?? this.allLeafChildren ?? _EmptyArray;
                }
                orphanRow(oldRow, false); // Unlink the old row, is being replaced
            } else if (newRow !== null) {
                newRow.allLeafChildren = this.allLeafChildren ?? _EmptyArray;
            }
        }
        if (newRow !== null) {
            newRow.level = level;
            newRow.childrenAfterGroup = childrenAfterGroup;
            newRow.treeNode = this;
        }
        this.row = newRow;
        return true;
    }

    /**
     * Removes a row from the tree node.
     * If the row is the main row, it will be replaced with the first row in the duplicate rows, if any.
     * If the row is a duplicate row, it will be removed from the duplicate rows.
     * @param rowToRemove - The row to be removed.
     * @returns `true` if the row was successfully removed, `false` if the row was not found.
     */
    public removeRow(rowToRemove: TreeRow): boolean {
        const { level, row, duplicateRows, childrenAfterGroup } = this;
        if (row === rowToRemove) {
            const duplicate = this.popDuplicateRow();
            if (duplicate) {
                this.row = duplicate;
                duplicate.childrenAfterGroup = childrenAfterGroup;
                if (level >= 0) {
                    duplicate.allLeafChildren = row.allLeafChildren ?? this.allLeafChildren ?? _EmptyArray;
                }
            } else {
                this.row = null;
            }
        } else {
            // Delete from the duplicate rows
            if (!duplicateRows?.delete(rowToRemove)) {
                return false; // Not found
            }
            if (duplicateRows.size === 0) {
                this.duplicateRows = null; // Free memory
            }
        }
        orphanRow(rowToRemove, level < 0);
        return true;
    }

    /**
     * Adds a duplicate row to the tree node.
     * @param newRow - The new row to be added.
     * @returns A boolean indicating whether the row was successfully added.
     */
    public addDuplicateRow(newRow: TreeRow): boolean {
        const { level } = this;
        let duplicateRows = this.duplicateRows;
        if (duplicateRows === null) {
            duplicateRows = new Set();
            this.duplicateRows = duplicateRows;
        } else if (duplicateRows.has(newRow)) {
            return false; // Already present
        }
        duplicateRows.add(newRow);
        newRow.treeNode = this;
        newRow.level = level;
        if (level >= 0) {
            newRow.allLeafChildren = _EmptyArray;
        }
        newRow.childrenAfterGroup = _EmptyArray;
        return true;
    }

    /**
     * This is needed to be sure that the row is the duplicate row with the smallest sourceRowIndex, in O(n).
     * @returns this.row
     */
    public sortFirstDuplicateRow(): TreeRow | null {
        const duplicateRows = this.duplicateRows;
        const oldRow = this.row;
        if (!oldRow || !duplicateRows) {
            return oldRow;
        }
        let newRow = oldRow;
        for (const row of duplicateRows) {
            if (row.sourceRowIndex < newRow.sourceRowIndex) {
                newRow = row; // found a smaller one
            }
        }
        if (newRow !== oldRow) {
            // Swap the rows
            newRow.childrenAfterGroup = this.childrenAfterGroup;
            newRow.allLeafChildren = oldRow.allLeafChildren ?? this.allLeafChildren ?? _EmptyArray;
            oldRow.childrenAfterGroup = _EmptyArray;
            oldRow.allLeafChildren = _EmptyArray;
            duplicateRows.delete(newRow);
            duplicateRows.add(oldRow);
            this.row = newRow;
        }
        return newRow;
    }

    /** Pops the first duplicate row from the list of duplicates */
    private popDuplicateRow(): TreeRow | null {
        let result: TreeRow | null = null;
        const duplicateRows = this.duplicateRows;
        if (duplicateRows !== null) {
            result = duplicateRows.values().next().value;
            if (result !== null && duplicateRows.delete(result) && duplicateRows.size === 0) {
                this.duplicateRows = null; // Free memory
            }
        }
        return result;
    }

    /**
     * Dequeues the next child invalidated node to be committed. Order is not deterministic.
     * @returns the next child node to be committed, or null if all children were already dequeued.
     */
    public dequeueInvalidated(): TreeNode | null {
        const node = this.invalidatedHead;
        if (node !== null) {
            this.invalidatedHead = node.invalidatedNext ?? null;
            node.invalidatedNext = undefined; // Mark as not invalidated
        }
        return node;
    }

    /**
     * Invalidates this node and all its parents until the root is reached.
     * Order of invalidated nodes is not deterministic.
     * The root itself cannot be invalidated, as it has no parents.
     * If a node is already invalidated, it will stop the recursion.
     */
    public invalidate(): void {
        let node: TreeNode | null = this;
        let parent = this.parent;
        while (parent !== null && node.invalidatedNext === undefined) {
            node.invalidatedNext = parent.invalidatedHead;
            parent.invalidatedHead = node;
            node = parent;
            parent = node.parent;
        }
    }

    /** Marks childrenChanged in the parent, so the childrenAfterGroup will be recomputed and invalidates the parent. */
    public invalidateOrder(): void {
        const parent = this.parent;
        if (parent !== null && !parent.childrenChanged && ((this.children?.size ?? 0) > 1 || !parent.row?.data)) {
            parent.childrenChanged = true;
            parent.invalidate();
        }
    }

    /**
     * When we receive rowNodeOrder not undefined, we need to update the rowPosition of the node,
     * to ensure it will be sorted in the right order in childrenAfterGroup.
     * This function makes sense to be called only in the post-order commit DFS
     * as it assumes children's childrenAfterGroup is already updated.
     * @returns the rowPosition the node should have.
     */
    public getRowPosition(): number {
        const row = this.row;
        if (row?.data) {
            return row.sourceRowIndex;
        }
        // This is a filler node, return the rowPosition of the first child
        return this.childrenAfterGroup[0]?.treeNode?.oldSourceRowIndex ?? this.oldSourceRowIndex;
    }

    /**
     * This is called in post order during commit to update the childrenAfterGroup array.
     * It uses the rowNodeOrder map to sort the children in the right order, if is passed.
     * It assumes all children childrenAfterGroup are up to date and rows all created.
     *
     * It replaces the array with _EmptyArray if there are no children, to reduce memory usage and GC pressure.
     * It does sort the children only if strictly needed, to avoid unnecessary work.
     *
     * If the order changes, also the order in the children map will be updated,
     * so the next call to enumChildren() will return the children in the right order.
     */
    public updateChildrenAfterGroup(treeData: boolean): boolean {
        this.childrenChanged = false; // Reset the flag for this node
        const childrenCount = (treeData && this.children?.size) || 0;
        if (childrenCount === 0) {
            this.row!.childrenAfterGroup = _EmptyArray;

            if (this.childrenAfterGroup.length === 0) {
                return false; // No children
            }

            this.leafChildrenChanged = true;
            this.childrenAfterGroup = _EmptyArray;
            return true; // Children cleared
        }

        let nodesChanged = false;

        let childrenAfterGroup = this.childrenAfterGroup;
        if (childrenAfterGroup === _EmptyArray) {
            childrenAfterGroup = new Array(childrenCount);
            this.childrenAfterGroup = childrenAfterGroup;
            this.row!.childrenAfterGroup = childrenAfterGroup;
            nodesChanged = true;
        } else if (childrenAfterGroup.length !== childrenCount) {
            childrenAfterGroup.length = childrenCount;
            nodesChanged = true;
        }

        let index = 0;
        let prevPosition = -1;
        let needSort = false;
        for (const child of this.enumChildren()) {
            const nextPosition = child.getRowPosition();
            if (nextPosition < prevPosition) {
                needSort = true;
            }
            prevPosition = nextPosition;
            child.oldSourceRowIndex = nextPosition;
            const row = child.row;
            if (childrenAfterGroup[index] !== row) {
                childrenAfterGroup[index] = row!;
                nodesChanged = true;
            }
            ++index;
        }

        if (nodesChanged) {
            this.leafChildrenChanged = true; // Note: we are not invalidating this if order only changes
        }

        if (needSort) {
            this.reorderChildrenList(childrenAfterGroup);
        }

        return nodesChanged || needSort;
    }

    /** This reorders the given array and rebuild the children map. */
    private reorderChildrenList(childrenAfterGroup: TreeRow[]) {
        const childrenCount = childrenAfterGroup.length;
        const children = this.children!;
        childrenAfterGroup.sort(treeNodePositionComparer);
        // We need to rebuild the children map in the right order
        children.clear();
        for (let i = 0; i < childrenCount; ++i) {
            const node = childrenAfterGroup[i].treeNode! as TreeNode;
            children.set(node.key, node);
        }
    }

    /**
     * Rebuild the allLeafChildren rows array of a node. It uses childrenAfterGroup, we assume to be already updated.
     * This is called in post order during commit, after the childrenAfterGroup are updated with updateChildrenAfterGroup().
     * It uses the childrenAfterGroup and allLeafChildren of all the children, we assume they are updated.
     */
    public updateAllLeafChildren(): void {
        const { parent, row, childrenAfterGroup } = this;

        this.leafChildrenChanged = false; // Reset the flag for this node

        let nodesChanged = false;
        const childrenAfterGroupLen = childrenAfterGroup.length;
        if (childrenAfterGroupLen === 0) {
            // No children, no leaf nodes.
            nodesChanged = row!.allLeafChildren?.length !== 0;
            row!.allLeafChildren = _EmptyArray;
            this.allLeafChildren = _EmptyArray;
        } else if (childrenAfterGroupLen === 1 && childrenAfterGroup[0].allLeafChildren?.length) {
            // We can avoid building the leaf children array if we are a node with just one child that has leafs
            // In this case we use the allLeafChildren of the child by assigning it to this.row.allLeafChildren in O(1)
            // and without occupying any extra memory.

            row!.allLeafChildren = childrenAfterGroup[0].allLeafChildren; // Use the same array

            // Set allLeafChildren to null as indicator that we are borrowing the array from one of the children
            // This is used to prevent `updateAllLeafChildren` modifying this array in a future pass, if this nodes
            // direct children have been updated.
            // In this case we will have to use this.row.allLeafChildren to access the allLeafChildren array.
            this.allLeafChildren = null;

            nodesChanged = true; // This must be true as this may come from a child that changed
        } else {
            // We need to rebuild the allLeafChildren array, we use children allLeafChildren arrays

            let allLeafChildren = this.allLeafChildren;
            if (allLeafChildren === _EmptyArray || allLeafChildren === null) {
                allLeafChildren = [];
                this.allLeafChildren = allLeafChildren;
            }
            const oldAllLeafChildrenLength = allLeafChildren.length;

            let writeIdx = 0;
            for (let i = 0; i < childrenAfterGroupLen; ++i) {
                const childRow = childrenAfterGroup[i];
                const childAllLeafChildren = childRow.allLeafChildren!;
                const childAllLeafChildrenLen = childAllLeafChildren.length;
                if (childAllLeafChildrenLen) {
                    for (let j = 0; j < childAllLeafChildrenLen; ++j) {
                        const leaf = childAllLeafChildren[j];
                        if (writeIdx >= oldAllLeafChildrenLength || allLeafChildren[writeIdx] !== leaf) {
                            allLeafChildren[writeIdx] = leaf;
                            nodesChanged = true;
                        }
                        ++writeIdx;
                    }
                } else {
                    if ((writeIdx >= oldAllLeafChildrenLength || allLeafChildren[writeIdx] !== childRow) && childRow) {
                        allLeafChildren[writeIdx] = childRow;
                        nodesChanged = true;
                    }
                    ++writeIdx;
                }
            }
            if (oldAllLeafChildrenLength !== writeIdx) {
                allLeafChildren.length = writeIdx;
                nodesChanged = true;
            }
            if (row!.allLeafChildren !== allLeafChildren) {
                row!.allLeafChildren = allLeafChildren;
                nodesChanged = true;
            }
        }

        if (nodesChanged && parent) {
            parent.leafChildrenChanged = true; // Propagate to the parent, as it may need to rebuild its allLeafChildren too
        }
    }
}
