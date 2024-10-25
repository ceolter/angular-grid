import type { AbstractColDef, AgColumn, BeanCollection, ColDef, ColumnModel, NamedBean } from 'ag-grid-community';
import { AgProvidedColumnGroup, BeanStub, _warn, isProvidedColumnGroup } from 'ag-grid-community';

import { isColGroupDef, mergeLeafPathTrees } from './sideBarUtils';

export class ToolPanelColDefService extends BeanStub implements NamedBean {
    beanName = 'toolPanelColDefService' as const;

    private colModel: ColumnModel;

    public wireBeans(beans: BeanCollection) {
        this.colModel = beans.colModel;
    }

    public createColumnTree(colDefs: AbstractColDef[]): (AgColumn | AgProvidedColumnGroup)[] {
        const invalidColIds: AbstractColDef[] = [];

        const createDummyColGroup = (
            abstractColDef: AbstractColDef,
            depth: number
        ): AgColumn | AgProvidedColumnGroup => {
            if (isColGroupDef(abstractColDef)) {
                // creating 'dummy' group which is not associated with grid column group
                const groupDef = abstractColDef;
                const groupId = typeof groupDef.groupId !== 'undefined' ? groupDef.groupId : groupDef.headerName;
                const group = new AgProvidedColumnGroup(groupDef, groupId!, false, depth);
                const children: (AgColumn | AgProvidedColumnGroup)[] = [];
                groupDef.children.forEach((def) => {
                    const child = createDummyColGroup(def, depth + 1);
                    // check column exists in case invalid colDef is supplied for primary column
                    if (child) {
                        children.push(child);
                    }
                });
                group.setChildren(children);

                return group;
            } else {
                const colDef = abstractColDef as ColDef;
                const key = colDef.colId ? colDef.colId : colDef.field;
                const column = this.colModel.getColDefCol(key!)!;

                if (!column) {
                    invalidColIds.push(colDef);
                }

                return column;
            }
        };

        const mappedResults: (AgColumn | AgProvidedColumnGroup)[] = [];
        colDefs.forEach((colDef) => {
            const result = createDummyColGroup(colDef, 0);
            if (result) {
                // only return correctly mapped colDef results
                mappedResults.push(result);
            }
        });

        if (invalidColIds.length > 0) {
            _warn(217, { invalidColIds });
        }

        return mappedResults;
    }

    public syncLayoutWithGrid(syncLayoutCallback: (colDefs: AbstractColDef[]) => void): void {
        // extract ordered list of leaf path trees (column group hierarchy for each individual leaf column)
        const leafPathTrees: AbstractColDef[] = this.getLeafPathTrees();

        // merge leaf path tree taking split column groups into account
        const mergedColumnTrees = mergeLeafPathTrees(leafPathTrees);

        // sync layout with merged column trees
        syncLayoutCallback(mergedColumnTrees);
    }

    private getLeafPathTrees(): AbstractColDef[] {
        // leaf tree paths are obtained by walking up the tree starting at a column until we reach the top level group.
        const getLeafPathTree = (node: AgColumn | AgProvidedColumnGroup, childDef: AbstractColDef): AbstractColDef => {
            let leafPathTree: AbstractColDef;

            // build up tree in reverse order
            if (isProvidedColumnGroup(node)) {
                if (node.isPadding()) {
                    // skip over padding groups
                    leafPathTree = childDef;
                } else {
                    const groupDef = Object.assign({}, node.getColGroupDef());
                    // ensure group contains groupId
                    groupDef.groupId = node.getGroupId();
                    groupDef.children = [childDef];
                    leafPathTree = groupDef;
                }
            } else {
                const colDef = Object.assign({}, node.getColDef());
                // ensure col contains colId
                colDef.colId = node.getColId();
                leafPathTree = colDef;
            }

            // walk tree
            const parent = node.getOriginalParent();
            if (parent) {
                // keep walking up the tree until we reach the root
                return getLeafPathTree(parent, leafPathTree);
            } else {
                // we have reached the root - exit with resulting leaf path tree
                return leafPathTree;
            }
        };

        // obtain a sorted list of all grid columns
        const allGridColumns = this.colModel.getCols();

        // only primary columns and non row group columns should appear in the tool panel
        const allPrimaryGridColumns = allGridColumns.filter((column) => {
            const colDef = column.getColDef();
            return column.isPrimary() && !colDef.showRowGroup;
        });

        // construct a leaf path tree for each column
        return allPrimaryGridColumns.map((col) => getLeafPathTree(col, col.getColDef()));
    }
}
