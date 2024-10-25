import type {
    AgColumn,
    BeanCollection,
    ChangedPath,
    Column,
    ColumnModel,
    IGroupHideOpenParentsService,
    IRowNode,
    IShowRowGroupColsService,
    RowNode,
} from 'ag-grid-community';
import { BeanStub, _error, _missing } from 'ag-grid-community';

import { setRowNodeGroupValue } from './rowGroupingUtils';

export class GroupHideOpenParentsService extends BeanStub implements IGroupHideOpenParentsService {
    beanName = 'groupHideOpenParentsSvc' as const;

    private colModel: ColumnModel;
    private showRowGroupCols?: IShowRowGroupColsService;

    public wireBeans(beans: BeanCollection): void {
        this.colModel = beans.colModel;
        this.showRowGroupCols = beans.showRowGroupCols;
    }

    public updateGroupDataForHideOpenParents(changedPath?: ChangedPath): void {
        if (!this.gos.get('groupHideOpenParents') || this.gos.get('treeData')) {
            return;
        }

        // recurse breadth first over group nodes after sort to 'pull down' group data to child groups
        const callback = (rowNode: RowNode) => {
            this.pullDownGroupDataForHideOpenParents(rowNode.childrenAfterSort, false);
            rowNode.childrenAfterSort!.forEach((child) => {
                if (child.hasChildren()) {
                    callback(child);
                }
            });
        };

        if (changedPath) {
            changedPath.executeFromRootNode((rowNode) => callback(rowNode));
        }
    }

    public pullDownGroupDataForHideOpenParents(rowNodes: RowNode[] | null, clearOperation: boolean): void {
        if (!this.gos.get('groupHideOpenParents') || _missing(rowNodes)) {
            return;
        }

        rowNodes.forEach((childRowNode) => {
            const groupDisplayCols = this.showRowGroupCols?.getShowRowGroupCols() ?? [];
            groupDisplayCols.forEach((groupDisplayCol) => {
                const showRowGroup = groupDisplayCol.getColDef().showRowGroup;
                if (typeof showRowGroup !== 'string') {
                    _error(110);
                    return;
                }

                const displayingGroupKey = showRowGroup;
                const rowGroupColumn = this.colModel.getColDefCol(displayingGroupKey);
                const thisRowNodeMatches = rowGroupColumn === childRowNode.rowGroupColumn;

                if (thisRowNodeMatches) {
                    return;
                }

                if (clearOperation) {
                    // if doing a clear operation, we clear down the value for every possible group column
                    setRowNodeGroupValue(childRowNode, this.colModel, groupDisplayCol.getId(), undefined);
                } else {
                    // if doing a set operation, we set only where the pull down is to occur
                    const parentToStealFrom = this.getFirstChildOfFirstChild(childRowNode, rowGroupColumn);
                    if (parentToStealFrom) {
                        setRowNodeGroupValue(
                            childRowNode,
                            this.colModel,
                            groupDisplayCol.getId(),
                            parentToStealFrom.key
                        );
                    }
                }
            });
        });
    }

    public isShowingValueForOpenedParent(rowNode: IRowNode, column: Column): boolean {
        // note - this code depends on updateGroupDataForHideOpenParents, where group data
        // is updated to reflect the dragged down parents

        if (!this.gos.get('groupHideOpenParents')) {
            return false;
        }

        // hideOpenParents means rowNode.groupData can have data for the group this column is displaying, even though
        // this rowNode isn't grouping by the column we are displaying

        // if no groupData at all, we are not showing a parent value
        if (!rowNode.groupData) {
            return false;
        }

        // this is the normal case, in that we are showing a group for which this column is configured. note that
        // this means the Row Group is closed (if it was open, we would not be displaying it)
        const showingGroupNode = rowNode.rowGroupColumn != null;
        if (showingGroupNode) {
            const keyOfGroupingColumn = rowNode.rowGroupColumn!.getId();
            const configuredToShowThisGroupLevel = column.isRowGroupDisplayed(keyOfGroupingColumn);
            // if showing group as normal, we didn't take group info from parent
            if (configuredToShowThisGroupLevel) {
                return false;
            }
        }

        // see if we are showing a Group Value for the Displayed Group. if we are showing a group value, and this Row Node
        // is not grouping by this Displayed Group, we must of gotten the value from a parent node
        return rowNode.groupData[column.getId()] != null;
    }

    private getFirstChildOfFirstChild(node: RowNode, rowGroupColumn: AgColumn | null): RowNode | null {
        let currentRowNode: RowNode | null = node;

        // if we are hiding groups, then if we are the first child, of the first child,
        // all the way up to the column we are interested in, then we show the group cell.
        while (currentRowNode) {
            const parentRowNode: RowNode | null = currentRowNode.parent;

            if (parentRowNode?.childrenAfterSort && currentRowNode === parentRowNode.childrenAfterSort[0]) {
                if (parentRowNode.rowGroupColumn === rowGroupColumn) {
                    return parentRowNode;
                }
            } else {
                return null;
            }

            currentRowNode = parentRowNode;
        }

        return null;
    }
}
