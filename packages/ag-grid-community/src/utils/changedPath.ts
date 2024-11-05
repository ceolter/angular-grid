import type { AgColumn } from '../entities/agColumn';
import type { RowNode } from '../entities/rowNode';

// the class below contains a tree of row nodes. each node is
// represented by a PathItem
interface PathItem {
    rowNode: RowNode; // the node this item points to
    children: PathItem[] | null; // children of this node - will be a subset of all the nodes children
}

// when doing transactions, or change detection, and grouping is present
// in the data, there is no need for the ClientSideRowModel to update each
// group after an update, ony parts that were impacted by the change.
// this class keeps track of all groups that were impacted by a transaction.
// the the different CSRM operations (filter, sort etc) use the forEach method
// to visit each group that was changed.
export class ChangedPath {
    // we keep columns when doing changed detection after user edits.
    // when a user edits, we only need to re-aggregate the column
    // that was edited.
    private readonly keepingColumns: boolean;

    // the root path always points to RootNode, and RootNode
    // is always in the changed path. over time, we add items to
    // the path, but this stays as the root. when the changed path
    // is ready, this will be the root of the tree of RowNodes that
    // need to be refreshed (all the row nodes that were impacted by
    // the transaction).
    private readonly pathRoot: PathItem;

    // whether changed path is active of not. it is active when a) doing
    // a transaction update or b) doing change detection. if we are doing
    // a CSRM refresh for other reasons (after sort or filter, or user calling
    // setRowData() without delta mode) then we are not active. we are also
    // marked as not active if secondary columns change in pivot (as this impacts
    // aggregations).
    // can be set inactive by:
    // a) ClientSideRowModel, if no transactions or
    // b) PivotService, if secondary columns changed
    public active = true;

    // for each node in the change path, we also store which columns need
    // to be re-aggregated.
    private nodeIdsToColumns: { [nodeId: string]: { [colId: string]: boolean } } = {};

    // for quick lookup, all items in the change path are mapped by nodeId
    private mapToItems: { [id: string]: PathItem } = {};

    public constructor(keepingColumns: boolean, rootNode: RowNode) {
        this.keepingColumns = keepingColumns;

        this.pathRoot = {
            rowNode: rootNode,
            children: null,
        };
        this.mapToItems[rootNode.id!] = this.pathRoot;
    }

    private depthFirstSearchChangedPath(pathItem: PathItem, callback: (rowNode: RowNode) => void): void {
        if (pathItem.children) {
            for (let i = 0; i < pathItem.children.length; i++) {
                this.depthFirstSearchChangedPath(pathItem.children[i], callback);
            }
        }
        callback(pathItem.rowNode);
    }

    private depthFirstSearchEverything(
        rowNode: RowNode,
        callback: (rowNode: RowNode) => void,
        traverseEverything: boolean
    ): void {
        if (rowNode.childrenAfterGroup) {
            for (let i = 0; i < rowNode.childrenAfterGroup.length; i++) {
                const childNode = rowNode.childrenAfterGroup[i];
                if (childNode.childrenAfterGroup) {
                    this.depthFirstSearchEverything(rowNode.childrenAfterGroup[i], callback, traverseEverything);
                } else if (traverseEverything) {
                    callback(childNode);
                }
            }
        }
        callback(rowNode);
    }

    // traverseLeafNodes -> used when NOT doing changed path, ie traversing everything. the callback
    // will be called for child nodes in addition to parent nodes.
    public forEachChangedNodeDepthFirst(
        callback: (rowNode: RowNode) => void,
        traverseLeafNodes = false,
        includeUnchangedNodes = false
    ): void {
        if (this.active && !includeUnchangedNodes) {
            // if we are active, then use the change path to callback
            // only for updated groups
            this.depthFirstSearchChangedPath(this.pathRoot, callback);
        } else {
            // we are not active, so callback for everything, walk the entire path
            this.depthFirstSearchEverything(this.pathRoot.rowNode, callback, traverseLeafNodes);
        }
    }

    public executeFromRootNode(callback: (rowNode: RowNode) => void) {
        callback(this.pathRoot.rowNode);
    }

    private createPathItems(rowNode: RowNode): number {
        let pointer = rowNode;
        let newEntryCount = 0;
        while (!this.mapToItems[pointer.id!]) {
            const newEntry: PathItem = {
                rowNode: pointer,
                children: null,
            };
            this.mapToItems[pointer.id!] = newEntry;
            newEntryCount++;
            pointer = pointer.parent!;
        }
        return newEntryCount;
    }

    private populateColumnsMap(rowNode: RowNode, columns: AgColumn[]): void {
        if (!this.keepingColumns || !columns) {
            return;
        }

        let pointer = rowNode;
        while (pointer) {
            // if columns, add the columns in all the way to parent, merging
            // in any other columns that might be there already
            if (!this.nodeIdsToColumns[pointer.id!]) {
                this.nodeIdsToColumns[pointer.id!] = {};
            }
            columns.forEach((col) => (this.nodeIdsToColumns[pointer.id!][col.getId()] = true));
            pointer = pointer.parent!;
        }
    }

    private linkPathItems(rowNode: RowNode, newEntryCount: number): void {
        let pointer = rowNode;
        for (let i = 0; i < newEntryCount; i++) {
            const thisItem = this.mapToItems[pointer.id!];
            const parentItem = this.mapToItems[pointer.parent!.id!];
            if (!parentItem.children) {
                parentItem.children = [];
            }
            parentItem.children.push(thisItem);
            pointer = pointer.parent!;
        }
    }

    // called by
    // 1) change detection (provides cols) and
    // 2) groupStage if doing transaction update (doesn't provide cols)
    public addParentNode(rowNode: RowNode | null, columns?: AgColumn[]): void {
        if (!rowNode || rowNode.isRowPinned()) {
            return;
        }

        // we cannot do  both steps below in the same loop as
        // the second loop has a dependency on the first loop.
        // ie the hierarchy cannot be stitched up yet because
        // we don't have it built yet

        // create the new PathItem objects.
        const newEntryCount = this.createPathItems(rowNode);

        // link in the node items
        this.linkPathItems(rowNode, newEntryCount);

        // update columns
        this.populateColumnsMap(rowNode, columns!);
    }

    public canSkip(rowNode: RowNode): boolean {
        return this.active && !this.mapToItems[rowNode.id!];
    }

    public getValueColumnsForNode(rowNode: RowNode, valueColumns: AgColumn[]): AgColumn[] {
        if (!this.keepingColumns) {
            return valueColumns;
        }

        const colsForThisNode = this.nodeIdsToColumns[rowNode.id!];
        const result = valueColumns.filter((col) => colsForThisNode[col.getId()]);
        return result;
    }

    public getNotValueColumnsForNode(rowNode: RowNode, valueColumns: AgColumn[]): AgColumn[] | null {
        if (!this.keepingColumns) {
            return null;
        }

        const colsForThisNode = this.nodeIdsToColumns[rowNode.id!];
        const result = valueColumns.filter((col) => !colsForThisNode[col.getId()]);
        return result;
    }
}
