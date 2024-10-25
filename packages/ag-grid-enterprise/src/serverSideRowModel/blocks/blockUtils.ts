import type {
    AgColumn,
    BeanCollection,
    IShowRowGroupColsService,
    NamedBean,
    RowBounds,
    ValueService,
} from 'ag-grid-community';
import {
    BeanStub,
    RowNode,
    _createRowNodeFooter,
    _destroyRowNodeFooter,
    _doOnce,
    _exists,
    _getGroupTotalRowCallback,
    _getRowHeightAsNumber,
    _getRowHeightForNode,
    _warn,
} from 'ag-grid-community';

import type { NodeManager } from '../nodeManager';
import type { ServerSideRowModel } from '../serverSideRowModel';
import type { ServerSideExpansionService } from '../services/serverSideExpansionService';
import type { LazyStore } from '../stores/lazy/lazyStore';
import type { StoreFactory } from '../stores/storeFactory';

export const GROUP_MISSING_KEY_ID = 'ag-Grid-MissingKey' as const;

export class BlockUtils extends BeanStub implements NamedBean {
    beanName = 'ssrmBlockUtils' as const;

    private valueSvc: ValueService;
    private showRowGroupCols?: IShowRowGroupColsService;
    private nodeManager: NodeManager;
    private expansionSvc?: ServerSideExpansionService;
    private serverSideRowModel: ServerSideRowModel;
    private storeFactory: StoreFactory;

    public wireBeans(beans: BeanCollection) {
        this.valueSvc = beans.valueSvc;
        this.showRowGroupCols = beans.showRowGroupCols;
        this.nodeManager = beans.ssrmNodeManager as NodeManager;
        this.expansionSvc = beans.expansionSvc as ServerSideExpansionService;
        this.serverSideRowModel = beans.rowModel as ServerSideRowModel;
        this.storeFactory = beans.ssrmStoreFactory as StoreFactory;
    }

    public createRowNode(params: {
        group: boolean;
        leafGroup: boolean;
        level: number;
        parent: RowNode;
        field: string;
        rowGroupColumn: AgColumn;
        rowHeight?: number;
    }): RowNode {
        const rowNode = new RowNode(this.beans);

        const rowHeight = params.rowHeight != null ? params.rowHeight : _getRowHeightAsNumber(this.gos);
        rowNode.setRowHeight(rowHeight);

        rowNode.group = params.group;
        rowNode.leafGroup = params.leafGroup;
        rowNode.level = params.level;
        rowNode.uiLevel = params.level;
        rowNode.parent = params.parent;

        // stub gets set to true here, and then false when this rowNode gets it's data
        rowNode.stub = true;
        rowNode.__needsRefreshWhenVisible = false;

        if (rowNode.group) {
            rowNode.expanded = false;
            rowNode.field = params.field;
            rowNode.rowGroupColumn = params.rowGroupColumn;
        }

        return rowNode;
    }

    public destroyRowNode(rowNode: RowNode, preserveStore: boolean = false): void {
        if (rowNode.childStore && !preserveStore) {
            this.destroyBean(rowNode.childStore);
            rowNode.childStore = null;
        }

        // if this has a footer, destroy that too
        if (rowNode.sibling && !rowNode.footer) {
            this.destroyRowNode(rowNode.sibling, false);
        }

        // this is needed, so row render knows to fade out the row, otherwise it
        // sees row top is present, and thinks the row should be shown. maybe
        // rowNode should have a flag on whether it is visible???
        rowNode.clearRowTopAndRowIndex();
        if (rowNode.id != null) {
            this.nodeManager.removeNode(rowNode);
        }
    }

    private setTreeGroupInfo(rowNode: RowNode): void {
        rowNode.updateHasChildren();

        const getKeyFunc = this.gos.get('getServerSideGroupKey');
        const hasChildren = rowNode.hasChildren();
        if (hasChildren && getKeyFunc != null) {
            rowNode.key = getKeyFunc(rowNode.data);
        }

        if (!hasChildren && rowNode.childStore != null) {
            this.destroyBean(rowNode.childStore);
            rowNode.childStore = null;
            rowNode.expanded = false;
        }
    }

    private setRowGroupInfo(rowNode: RowNode): void {
        rowNode.key = this.valueSvc.getValue(rowNode.rowGroupColumn!, rowNode);

        if (rowNode.key === null || rowNode.key === undefined) {
            _doOnce(() => {
                _warn(190, { rowGroupId: rowNode.rowGroupColumn?.getId(), data: rowNode.data });
            }, 'SSBlock-BadKey');
        }

        const isUnbalancedGroup = this.gos.get('groupAllowUnbalanced') && rowNode.key === '';
        if (isUnbalancedGroup) {
            const storeParams = this.serverSideRowModel.getParams();
            rowNode.childStore = this.createBean(this.storeFactory.createStore(storeParams, rowNode));
        }

        const getGroupIncludeFooter = _getGroupTotalRowCallback(this.beans.gos);
        const doesRowShowFooter = getGroupIncludeFooter({ node: rowNode });
        if (doesRowShowFooter) {
            _createRowNodeFooter(rowNode, this.beans);
            if (rowNode.sibling) {
                rowNode.sibling.uiLevel = rowNode.uiLevel + 1;
            }
        }
    }

    private setMasterDetailInfo(rowNode: RowNode): void {
        const isMasterFunc = this.gos.get('isRowMaster');
        if (isMasterFunc != null) {
            rowNode.master = isMasterFunc(rowNode.data);
        } else {
            rowNode.master = true;
        }
    }

    public updateDataIntoRowNode(rowNode: RowNode, data: any): void {
        rowNode.updateData(data);

        if (this.gos.get('treeData')) {
            this.setTreeGroupInfo(rowNode);
            this.setChildCountIntoRowNode(rowNode);
        } else if (rowNode.group) {
            this.setChildCountIntoRowNode(rowNode);

            if (!rowNode.footer) {
                const getGroupIncludeFooter = _getGroupTotalRowCallback(this.beans.gos);
                const doesRowShowFooter = getGroupIncludeFooter({ node: rowNode });
                if (doesRowShowFooter) {
                    if (rowNode.sibling) {
                        rowNode.sibling.updateData(data);
                    } else {
                        _createRowNodeFooter(rowNode, this.beans);
                    }
                } else if (rowNode.sibling) {
                    _destroyRowNodeFooter(rowNode);
                }
            }

            // it's not possible for a node to change whether it's a group or not
            // when doing row grouping (as only rows at certain levels are groups),
            // so nothing to do here
        } else if (this.gos.get('masterDetail')) {
            // this should be implemented, however it's not the use case i'm currently
            // programming, so leaving for another day. to test this, create an example
            // where whether a master row is expandable or not is dynamic
        }
    }

    public setDataIntoRowNode(
        rowNode: RowNode,
        data: any,
        defaultId: string,
        cachedRowHeight: number | undefined
    ): void {
        rowNode.stub = false;
        const treeData = this.gos.get('treeData');

        rowNode.setDataAndId(data, defaultId);

        if (treeData) {
            this.setTreeGroupInfo(rowNode);
        } else if (rowNode.group) {
            this.setRowGroupInfo(rowNode);
        } else if (this.gos.get('masterDetail')) {
            this.setMasterDetailInfo(rowNode);
        }

        if (treeData || rowNode.group) {
            this.setGroupDataIntoRowNode(rowNode);
            this.setChildCountIntoRowNode(rowNode);
        }

        // this needs to be done AFTER setGroupDataIntoRowNode(), as the height can depend on the group data
        // getting set, if it's a group node and colDef.autoHeight=true
        if (_exists(data)) {
            rowNode.setRowHeight(_getRowHeightForNode(this.gos, rowNode, false, cachedRowHeight).height);
            rowNode.sibling?.setRowHeight(
                _getRowHeightForNode(this.gos, rowNode.sibling, false, cachedRowHeight).height
            );
        }
    }

    private setChildCountIntoRowNode(rowNode: RowNode): void {
        const getChildCount = this.gos.get('getChildCount');
        if (getChildCount) {
            rowNode.setAllChildrenCount(getChildCount(rowNode.data));
        }
    }

    private setGroupDataIntoRowNode(rowNode: RowNode): void {
        const groupDisplayCols = this.showRowGroupCols?.getShowRowGroupCols() ?? [];

        const usingTreeData = this.gos.get('treeData');

        groupDisplayCols.forEach((col) => {
            if (rowNode.groupData == null) {
                rowNode.groupData = {};
            }
            if (usingTreeData) {
                rowNode.groupData[col.getColId()] = rowNode.key;
            } else if (col.isRowGroupDisplayed(rowNode.rowGroupColumn!.getId())) {
                const groupValue = this.valueSvc.getValue(rowNode.rowGroupColumn!, rowNode);
                rowNode.groupData[col.getColId()] = groupValue;
            }
        });
    }

    public clearDisplayIndex(rowNode: RowNode): void {
        rowNode.clearRowTopAndRowIndex();

        const hasChildStore = rowNode.hasChildren() && !!rowNode.childStore;
        if (hasChildStore) {
            (rowNode.childStore as LazyStore | undefined)?.clearDisplayIndexes();
        }

        const hasDetailNode = rowNode.master && rowNode.detailNode;
        if (hasDetailNode) {
            rowNode.detailNode.clearRowTopAndRowIndex();
        }
    }

    public setDisplayIndex(
        rowNode: RowNode,
        displayIndexSeq: { value: number },
        nextRowTop: { value: number },
        uiLevel: number
    ): void {
        const isUnbalancedGroup = this.gos.get('groupAllowUnbalanced') && rowNode.group && rowNode.key === '';
        const isHiddenOpenGroup = this.gos.get('groupHideOpenParents') && rowNode.group && rowNode.expanded;
        if (isHiddenOpenGroup || isUnbalancedGroup) {
            rowNode.setRowIndex(null);
            rowNode.setRowTop(null);
        } else {
            // set this row
            rowNode.setRowIndex(displayIndexSeq.value++);
            rowNode.setRowTop(nextRowTop.value);
            nextRowTop.value += rowNode.rowHeight!;
        }
        rowNode.setUiLevel(uiLevel);

        if (rowNode.footer) {
            return;
        }

        // set child for master / detail
        const hasDetailRow = rowNode.master;
        if (hasDetailRow) {
            if (rowNode.expanded && rowNode.detailNode) {
                rowNode.detailNode.setRowIndex(displayIndexSeq.value++);
                rowNode.detailNode.setRowTop(nextRowTop.value);
                nextRowTop.value += rowNode.detailNode.rowHeight!;
            } else if (rowNode.detailNode) {
                rowNode.detailNode.clearRowTopAndRowIndex();
            }
        }

        // set children for SSRM child rows
        const hasChildStore = rowNode.hasChildren() && !!rowNode.childStore;
        if (hasChildStore) {
            const childStore = rowNode.childStore as LazyStore;
            // unbalanced group always behaves as if it was expanded
            if (rowNode.expanded || isUnbalancedGroup) {
                childStore!.setDisplayIndexes(displayIndexSeq, nextRowTop, isUnbalancedGroup ? uiLevel : uiLevel + 1);
            } else {
                // we need to clear the row tops, as the row renderer depends on
                // this to know if the row should be faded out
                childStore!.clearDisplayIndexes();
            }
        }
    }

    public extractRowBounds(rowNode: RowNode, index: number): RowBounds | undefined {
        const extractRowBounds = (currentRowNode: RowNode): RowBounds => ({
            rowHeight: currentRowNode.rowHeight!,
            rowTop: currentRowNode.rowTop!,
        });

        if (rowNode.rowIndex === index) {
            return extractRowBounds(rowNode);
        }

        if (rowNode.hasChildren() && rowNode.expanded && !!rowNode.childStore) {
            const childStore = rowNode.childStore as LazyStore;
            if (childStore.isDisplayIndexInStore(index)) {
                return childStore.getRowBounds(index)!;
            }
        } else if (rowNode.master && rowNode.expanded && rowNode.detailNode) {
            if (rowNode.detailNode.rowIndex === index) {
                return extractRowBounds(rowNode.detailNode);
            }
        }
    }

    private isPixelInNodeRange(node: RowNode, pixel: number): boolean {
        if (!_exists(node.rowTop) || !_exists(node.rowHeight)) {
            return false;
        }
        return pixel >= node.rowTop && pixel < node.rowTop + node.rowHeight;
    }

    public getIndexAtPixel(rowNode: RowNode, pixel: number): number | null {
        // first check if pixel is in range of current row
        if (this.isPixelInNodeRange(rowNode, pixel)) {
            return rowNode.rowIndex;
        }

        // then check if current row contains a detail row with pixel in range
        const expandedMasterRow = rowNode.master && rowNode.expanded;
        const detailNode = rowNode.detailNode;

        if (expandedMasterRow && detailNode && this.isPixelInNodeRange(detailNode, pixel)) {
            return rowNode.detailNode.rowIndex;
        }

        // then check if it's a group row with a child cache with pixel in range
        if (rowNode.hasChildren() && rowNode.expanded && !!rowNode.childStore) {
            const childStore = rowNode.childStore as LazyStore;
            if (childStore.isPixelInRange(pixel)) {
                return childStore.getRowIndexAtPixel(pixel);
            }
        }

        return null;
        // pixel is not within this row node or it's children / detail, so return undefined
    }

    public createNodeIdPrefix(parentRowNode: RowNode): string | undefined {
        const parts: string[] = [];
        let rowNode: RowNode | null = parentRowNode;
        // pull keys from all parent nodes, but do not include the root node
        while (rowNode && rowNode.level >= 0) {
            if (rowNode.key === '') {
                parts.push(GROUP_MISSING_KEY_ID);
            } else {
                parts.push(rowNode.key!);
            }
            rowNode = rowNode.parent;
        }

        if (parts.length > 0) {
            return parts.reverse().join('-');
        }
        // no prefix, so node id's are left as they are
        return undefined;
    }

    public checkOpenByDefault(rowNode: RowNode): void {
        return this.expansionSvc?.checkOpenByDefault(rowNode);
    }
}
