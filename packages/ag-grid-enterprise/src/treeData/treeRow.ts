import type { ITreeNode, RowNode } from 'ag-grid-community';

/**
 * This is the type of any row processed by the TreeStrategy.
 *
 * TreeStrategy can modify:
 * - allLeafChildren
 * - childrenAfterGroup
 * - treeNode
 * - treeNodeFlags
 */
export interface TreeRow<TData = any> extends RowNode<TData> {
    allLeafChildren: TreeRow<TData>[] | null;
    childrenAfterGroup: TreeRow<TData>[] | null;
    treeNode: ITreeNode | null;
    treeNodeFlags: number;
    sibling: TreeRow<TData>;
    sourceRowIndex: number;
}

const enum Flags {
    None = 0,
    Committed = 0x01,
    ExpandedInitialized = 0x02,
    RowUpdated = 0x04,
    KeyChanged = 0x08,
    PathChanged = 0x10,
}

/** We set this on the first time the node is committed. We unset this if the row gets deleted. */
export const isTreeRowCommitted = (row: RowNode): boolean => (row.treeNodeFlags & Flags.Committed) !== 0;

/** Check if the expanded state needs to be initialized, first time for a node, or again if the node was removed */
export const isTreeRowExpandedInitialized = (row: RowNode): boolean =>
    (row.treeNodeFlags & Flags.ExpandedInitialized) !== 0;

/** We use this to mark a row as updated by an updated transaction */
export const isTreeRowUpdated = (row: RowNode): boolean => (row.treeNodeFlags & Flags.RowUpdated) !== 0;

/** We use this to see if a row changed key during commit */
export const isTreeRowKeyChanged = (row: RowNode): boolean => (row.treeNodeFlags & Flags.KeyChanged) !== 0;

/** Returns true if markTreeRowPathChanged was called. Reset during commit.  */
export const isTreeRowPathChanged = (row: TreeRow): boolean => (row.treeNodeFlags & Flags.PathChanged) !== 0;

/** Changes the expanded initialized state, so it can be recomputed again. */
export const setTreeRowExpandedInitialized = (row: TreeRow, value: boolean): void => {
    if (value) {
        row.treeNodeFlags |= Flags.ExpandedInitialized;
    } else {
        row.treeNodeFlags &= ~Flags.ExpandedInitialized;
    }
};

/**
 * We use this to mark a row as updated by an updated transaction.
 * This will be set only if the row was committed at least once before.
 */
export const setTreeRowUpdated = (row: TreeRow): void => {
    const flags = row.treeNodeFlags;
    if ((flags & Flags.Committed) !== 0) {
        row.treeNodeFlags = flags | Flags.RowUpdated;
    }
};

/**
 * We use this to mark that a row changed key during commit.
 * This will be set only if the row was committed at least once before.
 */
export const setTreeRowKeyChanged = (row: TreeRow): void => {
    const flags = row.treeNodeFlags;
    if ((flags & Flags.Committed) !== 0) {
        row.treeNodeFlags = flags | (Flags.KeyChanged | Flags.RowUpdated);
    }
};

/** If this is true, commit stage must invoke changedPath.addParentNode */
export const markTreeRowPathChanged = (row: TreeRow): void => {
    row.treeNodeFlags |= Flags.PathChanged;
};

/** Called when the row is committed. */
export const markTreeRowCommitted = (row: TreeRow): void => {
    const isRoot = row.level < 0;
    const oldFlags = row.treeNodeFlags;
    const wasCommitted = (oldFlags & Flags.Committed) !== 0;
    row.treeNodeFlags = Flags.Committed | (oldFlags & ~(Flags.RowUpdated | Flags.KeyChanged | Flags.PathChanged));
    if (!wasCommitted || isRoot) {
        // We need to ensure that arrays are not null if the row was never committed or is the root
        const childrenAfterGroup = row.childrenAfterGroup;
        row.childrenAfterFilter = childrenAfterGroup;
        row.childrenAfterAggFilter = childrenAfterGroup;
        row.childrenAfterSort = childrenAfterGroup;
    }

    if (isRoot) {
        const sibling = row.sibling;
        if (sibling) {
            sibling.childrenAfterGroup = row.childrenAfterGroup;
            sibling.childrenMapped = row.childrenMapped;
        }
    }
};

/** Clears all the flags, called when the row is deleted from the tree */
export const clearTreeRowFlags = (row: TreeRow): void => {
    row.treeNodeFlags = 0;
};
