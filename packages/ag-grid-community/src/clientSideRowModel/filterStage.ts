import type { NamedBean } from '../context/bean';
import { BeanStub } from '../context/beanStub';
import type { BeanCollection } from '../context/context';
import type { GridOptions } from '../entities/gridOptions';
import type { RowNode } from '../entities/rowNode';
import type { FilterManager } from '../filter/filterManager';
import type { ClientSideRowModelStage } from '../interfaces/iClientSideRowModel';
import type { IRowNodeStage } from '../interfaces/iRowNodeStage';
import type { ChangedPath } from '../utils/changedPath';
import type { RefreshModelState } from './refreshModelState';

export function updateRowNodeAfterFilter(rowNode: RowNode): void {
    if (rowNode.sibling) {
        rowNode.sibling.childrenAfterFilter = rowNode.childrenAfterFilter;
    }
}

export class FilterStage extends BeanStub implements IRowNodeStage, NamedBean {
    beanName = 'filterStage' as const;

    public refreshProps: Set<keyof GridOptions<any>> = new Set(['excludeChildrenWhenTreeDataFiltering']);
    public step: ClientSideRowModelStage = 'filter';

    private filterManager?: FilterManager;

    public wireBeans(beans: BeanCollection): void {
        this.filterManager = beans.filterManager;
    }

    public execute(state: RefreshModelState): void {
        const { changedPath } = state;
        this.filter(changedPath!);
    }

    private filter(changedPath: ChangedPath): void {
        const filterActive: boolean = !!this.filterManager?.isChildFilterPresent();
        this.filterNodes(filterActive, changedPath);
    }

    private filterNodes(filterActive: boolean, changedPath: ChangedPath): void {
        const filterCallback = (rowNode: RowNode, includeChildNodes: boolean) => {
            // recursively get all children that are groups to also filter
            if (rowNode.hasChildren()) {
                // result of filter for this node. when filtering tree data, includeChildNodes = true when parent passes
                if (filterActive && !includeChildNodes) {
                    rowNode.childrenAfterFilter = rowNode.childrenAfterGroup!.filter((childNode) => {
                        // a group is included in the result if it has any children of it's own.
                        // by this stage, the child groups are already filtered
                        const passBecauseChildren =
                            childNode.childrenAfterFilter && childNode.childrenAfterFilter.length > 0;

                        // both leaf level nodes and tree data nodes have data. these get added if
                        // the data passes the filter
                        const passBecauseDataPasses =
                            childNode.data && this.filterManager!.doesRowPassFilter({ rowNode: childNode });

                        // note - tree data nodes pass either if a) they pass themselves or b) any children of that node pass

                        return passBecauseChildren || passBecauseDataPasses;
                    });
                } else {
                    // if not filtering, the result is the original list
                    rowNode.childrenAfterFilter = rowNode.childrenAfterGroup;
                }
            } else {
                rowNode.childrenAfterFilter = rowNode.childrenAfterGroup;
            }

            updateRowNodeAfterFilter(rowNode);
        };

        if (this.doingTreeDataFiltering()) {
            const treeDataDepthFirstFilter = (rowNode: RowNode, alreadyFoundInParent: boolean) => {
                // tree data filter traverses the hierarchy depth first and includes child nodes if parent passes
                // filter, and parent nodes will be include if any children exist.

                if (rowNode.childrenAfterGroup) {
                    for (let i = 0; i < rowNode.childrenAfterGroup.length; i++) {
                        const childNode = rowNode.childrenAfterGroup[i];

                        // first check if current node passes filter before invoking child nodes
                        const foundInParent =
                            alreadyFoundInParent || this.filterManager!.doesRowPassFilter({ rowNode: childNode });
                        if (childNode.childrenAfterGroup) {
                            treeDataDepthFirstFilter(rowNode.childrenAfterGroup[i], foundInParent);
                        } else {
                            filterCallback(childNode, foundInParent);
                        }
                    }
                }
                filterCallback(rowNode, alreadyFoundInParent);
            };

            const treeDataFilterCallback = (rowNode: RowNode) => treeDataDepthFirstFilter(rowNode, false);
            changedPath.executeFromRootNode(treeDataFilterCallback);
        } else {
            const defaultFilterCallback = (rowNode: RowNode) => filterCallback(rowNode, false);
            changedPath.forEachChangedNodeDepthFirst(defaultFilterCallback, true);
        }
    }

    private doingTreeDataFiltering() {
        return this.gos.get('treeData') && !this.gos.get('excludeChildrenWhenTreeDataFiltering');
    }
}
