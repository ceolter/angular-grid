import type {
    BeanCollection,
    ClientSideRowModelStage,
    ColumnModel,
    FilterManager,
    GridOptions,
    IRowNodeStage,
    NamedBean,
    RowNode,
    StageExecuteParams,
} from 'ag-grid-community';
import { BeanStub, _getGroupAggFiltering } from 'ag-grid-community';

export class FilterAggregatesStage extends BeanStub implements NamedBean, IRowNodeStage {
    beanName = 'filterAggregatesStage' as const;

    public refreshProps: Set<keyof GridOptions<any>> = new Set([]);
    public step: ClientSideRowModelStage = 'filter_aggregates';

    private filterManager?: FilterManager;
    private colModel: ColumnModel;

    public wireBeans(beans: BeanCollection): void {
        this.filterManager = beans.filterManager;
        this.colModel = beans.colModel;
    }

    public execute(params: StageExecuteParams): void {
        const isPivotMode = this.colModel.isPivotMode();
        const isAggFilterActive =
            this.filterManager?.isAggregateFilterPresent() || this.filterManager?.isAggregateQuickFilterPresent();

        // This is the default filter for applying only to leaf nodes, realistically this should not apply as primary agg columns,
        // should not be applied by the filterManager if getGroupAggFiltering is missing. Predicate will apply filters to leaf level.
        const defaultPrimaryColumnPredicate = (params: { node: RowNode }) => !params.node.group;

        // Default secondary column predicate, selecting only leaf level groups.
        const defaultSecondaryColumnPredicate = (params: { node: RowNode }) => params.node.leafGroup;

        // The predicate to determine whether filters should apply to this row. Either defined by the user in groupAggFiltering or a default depending
        // on current pivot mode status.
        const applyFilterToNode =
            _getGroupAggFiltering(this.gos) ||
            (isPivotMode ? defaultSecondaryColumnPredicate : defaultPrimaryColumnPredicate);

        const { changedPath } = params;

        const preserveChildren = (node: RowNode, recursive = false) => {
            if (node.childrenAfterFilter) {
                node.childrenAfterAggFilter = node.childrenAfterFilter;
                if (recursive) {
                    node.childrenAfterAggFilter.forEach((child) => preserveChildren(child, recursive));
                }
                this.setAllChildrenCount(node);
            }

            if (node.sibling) {
                node.sibling.childrenAfterAggFilter = node.childrenAfterAggFilter;
            }
        };

        const filterChildren = (node: RowNode) => {
            node.childrenAfterAggFilter =
                node.childrenAfterFilter?.filter((child: RowNode) => {
                    const shouldFilterRow = applyFilterToNode({ node: child });
                    if (shouldFilterRow) {
                        const doesNodePassFilter = this.filterManager!.doesRowPassAggregateFilters({ rowNode: child });
                        if (doesNodePassFilter) {
                            // Node has passed, so preserve children
                            preserveChildren(child, true);
                            return true;
                        }
                    }
                    const hasChildPassed = child.childrenAfterAggFilter?.length;
                    return hasChildPassed;
                }) || null;

            this.setAllChildrenCount(node);
            if (node.sibling) {
                node.sibling.childrenAfterAggFilter = node.childrenAfterAggFilter;
            }
        };

        changedPath!.forEachChangedNodeDepthFirst(isAggFilterActive ? filterChildren : preserveChildren, true);
    }

    /** for tree data, we include all children, groups and leafs */
    private setAllChildrenCountTreeData(rowNode: RowNode): void {
        const childrenAfterAggFilter = rowNode.childrenAfterAggFilter;
        let allChildrenCount = 0;
        if (childrenAfterAggFilter) {
            const length = childrenAfterAggFilter.length;
            allChildrenCount = length; // include direct children too
            for (let i = 0; i < length; ++i) {
                allChildrenCount += childrenAfterAggFilter[i].allChildrenCount ?? 0; // include children of children
            }
        }
        rowNode.setAllChildrenCount(
            // Maintain the historical behaviour:
            // - allChildrenCount is 0 in the root if there are no children
            // - allChildrenCount is null in any non-root row if there are no children
            allChildrenCount === 0 && rowNode.level >= 0 ? null : allChildrenCount
        );
    }

    /* for grid data, we only count the leafs */
    private setAllChildrenCountGridGrouping(rowNode: RowNode) {
        let allChildrenCount = 0;
        rowNode.childrenAfterAggFilter!.forEach((child: RowNode) => {
            if (child.group) {
                allChildrenCount += child.allChildrenCount as any;
            } else {
                allChildrenCount++;
            }
        });
        rowNode.setAllChildrenCount(allChildrenCount);
    }

    private setAllChildrenCount(rowNode: RowNode) {
        if (!rowNode.hasChildren()) {
            rowNode.setAllChildrenCount(null);
            return;
        }

        if (this.gos.get('treeData')) {
            this.setAllChildrenCountTreeData(rowNode);
        } else {
            this.setAllChildrenCountGridGrouping(rowNode);
        }
    }
}
