import { BeanStub } from '../../context/beanStub';
import type { BeanCollection } from '../../context/context';
import type { CtrlsService } from '../../ctrlsService';
import type { RowNode } from '../../entities/rowNode';
import type { GridBodyCtrl } from '../../gridBodyComp/gridBodyCtrl';
import { _getRowHeightForNode, _isClientSideRowModel, _isGroupRowsSticky } from '../../gridOptionsUtils';
import type { IRowModel } from '../../interfaces/iRowModel';
import type { PageBoundsService } from '../../pagination/pageBoundsService';
import { _last } from '../../utils/array';
import type { RowCtrl } from '../row/rowCtrl';
import type { RowCtrlByRowNodeIdMap, RowRenderer } from '../rowRenderer';

export class StickyRowFeature extends BeanStub {
    private rowModel: IRowModel;
    private rowRenderer: RowRenderer;
    private ctrlsSvc: CtrlsService;
    private pageBounds: PageBoundsService;

    public wireBeans(beans: BeanCollection): void {
        this.rowModel = beans.rowModel;
        this.rowRenderer = beans.rowRenderer;
        this.ctrlsSvc = beans.ctrlsSvc;
        this.pageBounds = beans.pageBounds;
    }

    private stickyTopRowCtrls: RowCtrl[] = [];
    private stickyBottomRowCtrls: RowCtrl[] = [];
    private gridBodyCtrl: GridBodyCtrl;
    private topContainerHeight: number;
    private bottomContainerHeight: number;
    private isClientSide: boolean;

    // sticky rows pulls in extra rows from other pages which impacts row position
    private extraTopHeight = 0;
    private extraBottomHeight = 0;

    constructor(
        private readonly createRowCon: (rowNode: RowNode, animate: boolean, afterScroll: boolean) => RowCtrl,
        private readonly destroyRowCtrls: (
            rowCtrlsMap: RowCtrlByRowNodeIdMap | null | undefined,
            animate: boolean
        ) => void
    ) {
        super();
    }

    public postConstruct(): void {
        this.isClientSide = _isClientSideRowModel(this.gos);

        this.ctrlsSvc.whenReady(this, (params) => {
            this.gridBodyCtrl = params.gridBodyCtrl;
        });

        this.resetStickyContainers();
    }

    public getStickyTopRowCtrls(): RowCtrl[] {
        return this.stickyTopRowCtrls;
    }

    public getStickyBottomRowCtrls(): RowCtrl[] {
        return this.stickyBottomRowCtrls;
    }

    private setOffsetTop(offset: number): void {
        if (this.extraTopHeight === offset) {
            return;
        }
        this.extraTopHeight = offset;
        this.eventSvc.dispatchEvent({
            type: 'stickyTopOffsetChanged',
            offset,
        });
    }

    private setOffsetBottom(offset: number): void {
        if (this.extraBottomHeight === offset) {
            return;
        }
        this.extraBottomHeight = offset;
    }

    public resetOffsets() {
        this.setOffsetBottom(0);
        this.setOffsetTop(0);
    }

    public getExtraTopHeight(): number {
        return this.extraTopHeight;
    }

    public getExtraBottomHeight(): number {
        return this.extraBottomHeight;
    }

    /**
     * Get the last pixel of the group, this pixel is used to push the sticky node up out of the viewport.
     */
    private getLastPixelOfGroup(row: RowNode): number {
        return this.isClientSide ? this.getClientSideLastPixelOfGroup(row) : this.getServerSideLastPixelOfGroup(row);
    }

    /**
     * Get the first pixel of the group, this pixel is used to push the sticky node down out of the viewport
     */
    private getFirstPixelOfGroup(row: RowNode): number {
        if (row.footer) {
            return row.sibling!.rowTop! + row.sibling!.rowHeight! - 1;
        }

        if (row.hasChildren()) {
            return row.rowTop! - 1;
        }

        // only footer nodes stick bottom, so shouldn't reach this.
        return 0;
    }

    private getServerSideLastPixelOfGroup(row: RowNode): number {
        if (this.isClientSide) {
            throw new Error('This func should only be called in server side row model.');
        }

        if (row.isExpandable() || row.footer) {
            if (row.master) {
                return row.detailNode.rowTop! + row.detailNode.rowHeight!;
            }

            const noOrContiguousSiblings = !row.sibling || Math.abs(row.sibling.rowIndex! - row.rowIndex!) === 1;
            if (noOrContiguousSiblings) {
                let storeBounds = row.childStore?.getStoreBounds();
                if (row.footer) {
                    storeBounds = row.sibling.childStore?.getStoreBounds();
                }
                return (storeBounds?.heightPx ?? 0) + (storeBounds?.topPx ?? 0);
            }

            if (row.footer) {
                return row.rowTop! + row.rowHeight!;
            }

            return row.sibling!.rowTop! + row.sibling!.rowHeight!;
        }
        // if not a group, then this row shouldn't be sticky currently.
        return Number.MAX_SAFE_INTEGER;
    }

    private getClientSideLastPixelOfGroup(row: RowNode): number {
        if (!this.isClientSide) {
            throw new Error('This func should only be called in client side row model.');
        }

        if (row.isExpandable() || row.footer) {
            // grand total row at top, nothing can push it out of sticky.
            const grandTotalAtTop = row.footer && row.rowIndex === 0;
            if (grandTotalAtTop) {
                return Number.MAX_SAFE_INTEGER;
            }

            // if no siblings, we search the children for the last displayed row, to get last px.
            // equally, if sibling but sibling is contiguous ('top') then sibling cannot be used
            // to find last px
            const noOrContiguousSiblings = !row.sibling || Math.abs(row.sibling.rowIndex! - row.rowIndex!) === 1;
            if (noOrContiguousSiblings) {
                let lastAncestor = row.footer ? row.sibling : row;
                while (lastAncestor.isExpandable() && lastAncestor.expanded) {
                    if (lastAncestor.master) {
                        lastAncestor = lastAncestor.detailNode;
                    } else if (lastAncestor.childrenAfterSort) {
                        // Tree Data will have `childrenAfterSort` without any nodes, but
                        // the current node will still be marked as expansible.
                        if (lastAncestor.childrenAfterSort.length === 0) {
                            break;
                        }
                        lastAncestor = _last(lastAncestor.childrenAfterSort);
                    }
                }
                return lastAncestor.rowTop! + lastAncestor.rowHeight!;
            }

            // if siblings not contiguous, footer is last row and easiest way for last px
            if (row.footer) {
                return row.rowTop! + row.rowHeight!;
            }
            return row.sibling!.rowTop! + row.sibling!.rowHeight!;
        }
        // if not expandable, then this row shouldn't be sticky currently.
        return Number.MAX_SAFE_INTEGER;
    }

    private updateStickyRows(container: 'top' | 'bottom'): boolean {
        const isTop = container === 'top';
        let newStickyContainerHeight = 0;

        if (!this.canRowsBeSticky()) {
            return this.refreshNodesAndContainerHeight(container, new Set(), newStickyContainerHeight);
        }

        const pixelAtContainerBoundary = isTop
            ? this.rowRenderer.getFirstVisibleVerticalPixel() - this.extraTopHeight
            : this.rowRenderer.getLastVisibleVerticalPixel() - this.extraTopHeight;
        const newStickyRows = new Set<RowNode>();

        const addStickyRow = (stickyRow: RowNode) => {
            newStickyRows.add(stickyRow);

            if (isTop) {
                // get the pixel which stops this node being sticky.
                const lastChildBottom = this.getLastPixelOfGroup(stickyRow);
                const stickRowBottom = pixelAtContainerBoundary + newStickyContainerHeight + stickyRow.rowHeight!;
                if (lastChildBottom < stickRowBottom) {
                    stickyRow.stickyRowTop = newStickyContainerHeight + (lastChildBottom - stickRowBottom);
                } else {
                    stickyRow.stickyRowTop = newStickyContainerHeight;
                }
            } else {
                // get the pixel which stops this node being sticky.
                const lastChildBottom = this.getFirstPixelOfGroup(stickyRow);
                const stickRowTop = pixelAtContainerBoundary - (newStickyContainerHeight + stickyRow.rowHeight!);
                if (lastChildBottom > stickRowTop) {
                    stickyRow.stickyRowTop = newStickyContainerHeight - (lastChildBottom - stickRowTop);
                } else {
                    stickyRow.stickyRowTop = newStickyContainerHeight;
                }
            }

            // have to recalculate height after each row has been added, to allow
            // calculating the next sticky row
            newStickyContainerHeight = 0;
            newStickyRows.forEach((rowNode) => {
                const thisRowLastPx = rowNode.stickyRowTop + rowNode.rowHeight!;
                if (newStickyContainerHeight < thisRowLastPx) {
                    newStickyContainerHeight = thisRowLastPx;
                }
            });
        };

        const suppressFootersSticky = this.areFooterRowsStickySuppressed();
        const suppressGroupsSticky = this.gos.get('suppressGroupRowsSticky');
        const isRowSticky = (row: RowNode) => {
            if (!row.displayed) {
                return false;
            }

            if (row.footer) {
                if (suppressFootersSticky === true) {
                    return false;
                }
                if (suppressFootersSticky === 'grand' && row.level === -1) {
                    return false;
                }
                if (suppressFootersSticky === 'group' && row.level > -1) {
                    return false;
                }
                const isFooterFirstRowInGroup = row.sibling.rowIndex
                    ? row.sibling.rowIndex + 1 === row.rowIndex
                    : false;
                if (container === 'bottom' && isFooterFirstRowInGroup) {
                    return false;
                }

                const alreadySticking = newStickyRows.has(row);
                return !alreadySticking;
            }

            if (row.isExpandable()) {
                if (suppressGroupsSticky === true) {
                    return false;
                }
                if (container === 'bottom') {
                    // Group rows should never stick to the bottom of the viewport
                    return false;
                }
                const alreadySticking = newStickyRows.has(row);
                return !alreadySticking && row.expanded;
            }

            return false;
        };

        // arbitrary counter to prevent infinite loop break out of the loop when the row calculation
        // changes while rows are becoming sticky (happens with auto height)
        for (let i = 0; i < 100; i++) {
            let firstPixelAfterStickyRows = pixelAtContainerBoundary + newStickyContainerHeight;
            if (!isTop) {
                firstPixelAfterStickyRows = pixelAtContainerBoundary - newStickyContainerHeight;
            }
            const firstIndex = this.rowModel.getRowIndexAtPixel(firstPixelAfterStickyRows);
            const firstRow = this.rowModel.getRow(firstIndex);

            if (firstRow == null) {
                break;
            }

            const ancestors: RowNode[] = this.getStickyAncestors(firstRow);
            const firstMissingParent = ancestors.find(
                (parent) =>
                    (isTop ? parent.rowIndex! < firstIndex : parent.rowIndex! > firstIndex) && isRowSticky(parent)
            );
            if (firstMissingParent) {
                addStickyRow(firstMissingParent);
                continue;
            }

            const isFirstRowOutsideViewport = isTop
                ? firstRow.rowTop! < firstPixelAfterStickyRows
                : firstRow.rowTop! + firstRow.rowHeight! > firstPixelAfterStickyRows;
            // if first row is an open group, and partially shown, it needs
            // to be stuck
            if (isFirstRowOutsideViewport && isRowSticky(firstRow)) {
                addStickyRow(firstRow);
                continue;
            }

            break;
        }

        if (!isTop) {
            // Because sticky bottom rows are calculated inverted, we need to invert the top position
            newStickyRows.forEach((rowNode) => {
                rowNode.stickyRowTop = newStickyContainerHeight - (rowNode.stickyRowTop + rowNode.rowHeight!);
            });
        }

        return this.refreshNodesAndContainerHeight(container, newStickyRows, newStickyContainerHeight);
    }

    private areFooterRowsStickySuppressed(): boolean | 'grand' | 'group' {
        const suppressFootersSticky = this.gos.get('suppressStickyTotalRow');
        if (suppressFootersSticky === true) {
            return true;
        }

        const suppressGroupRows = suppressFootersSticky === 'group';
        const suppressGrandRows = suppressFootersSticky === 'grand';
        if (suppressGroupRows && suppressGrandRows) {
            return true;
        }

        if (suppressGrandRows) {
            return 'grand';
        }

        if (suppressGroupRows) {
            return 'group';
        }

        return false;
    }

    private canRowsBeSticky(): boolean {
        const isStickyEnabled = _isGroupRowsSticky(this.gos);
        const suppressFootersSticky = this.areFooterRowsStickySuppressed();
        const suppressGroupsSticky = this.gos.get('suppressGroupRowsSticky');
        return isStickyEnabled && (!suppressFootersSticky || !suppressGroupsSticky);
    }

    private getStickyAncestors(rowNode: RowNode): RowNode[] {
        const ancestors: RowNode[] = [];
        let p = rowNode.footer ? rowNode.sibling : rowNode.parent;
        while (p) {
            if (p.sibling) {
                ancestors.push(p.sibling);
            }
            ancestors.push(p);
            p = p.parent!;
        }
        return ancestors.reverse();
    }

    public checkStickyRows(): boolean {
        const hasTopUpdated = this.updateStickyRows('top');
        const hasBottomUpdated = this.updateStickyRows('bottom');
        return hasTopUpdated || hasBottomUpdated;
    }

    public destroyStickyCtrls(): void {
        this.resetStickyContainers();
    }

    private resetStickyContainers(): void {
        this.refreshNodesAndContainerHeight('top', new Set(), 0);
        this.refreshNodesAndContainerHeight('bottom', new Set(), 0);
    }

    public refreshStickyNode(stickRowNode: RowNode): void {
        const allStickyNodes = new Set<RowNode>();
        if (this.stickyTopRowCtrls.some((ctrl) => ctrl.getRowNode() === stickRowNode)) {
            for (let i = 0; i < this.stickyTopRowCtrls.length; i++) {
                const currentNode = this.stickyTopRowCtrls[i].getRowNode();
                if (currentNode !== stickRowNode) {
                    allStickyNodes.add(currentNode);
                }
            }

            if (this.refreshNodesAndContainerHeight('top', allStickyNodes, this.topContainerHeight)) {
                this.checkStickyRows();
            }
            return;
        }

        for (let i = 0; i < this.stickyBottomRowCtrls.length; i++) {
            const currentNode = this.stickyBottomRowCtrls[i].getRowNode();
            if (currentNode !== stickRowNode) {
                allStickyNodes.add(currentNode);
            }
        }

        if (this.refreshNodesAndContainerHeight('bottom', allStickyNodes, this.bottomContainerHeight)) {
            this.checkStickyRows();
        }
    }

    /**
     * Destroy old ctrls and create new ctrls where necessary.
     */
    private refreshNodesAndContainerHeight(
        container: 'top' | 'bottom',
        newStickyNodes: Set<RowNode>,
        height: number
    ): boolean {
        const isTop = container === 'top';
        const previousCtrls = isTop ? this.stickyTopRowCtrls : this.stickyBottomRowCtrls;

        // find removed ctrls and remaining ctrls
        const removedCtrlsMap: RowCtrlByRowNodeIdMap = {};
        const remainingCtrls: RowCtrl[] = [];
        for (let i = 0; i < previousCtrls.length; i++) {
            const node = previousCtrls[i].getRowNode();
            const hasBeenRemoved = !newStickyNodes.has(node);
            if (hasBeenRemoved) {
                removedCtrlsMap[node.id!] = previousCtrls[i];

                // if no longer sticky, remove sticky flag.
                node.sticky = false;
                continue;
            }

            remainingCtrls.push(previousCtrls[i]);
        }

        // get set of existing nodes for quick lookup
        const existingNodes = new Set<RowNode>();
        for (let i = 0; i < remainingCtrls.length; i++) {
            existingNodes.add(remainingCtrls[i].getRowNode());
        }

        // find the new ctrls to add
        const newCtrls: RowCtrl[] = [];
        newStickyNodes.forEach((node) => {
            if (existingNodes.has(node)) {
                return;
            }
            // ensure new node is set to sticky and create the new ctrl
            node.sticky = true;
            newCtrls.push(this.createRowCon(node, false, false));
        });

        // check if anything has changed
        let hasSomethingChanged = !!newCtrls.length || remainingCtrls.length !== previousCtrls.length;
        if (isTop) {
            if (this.topContainerHeight !== height) {
                this.topContainerHeight = height;
                this.gridBodyCtrl.setStickyTopHeight(height);
                hasSomethingChanged = true;
            }
        } else {
            if (this.bottomContainerHeight !== height) {
                this.bottomContainerHeight = height;
                this.gridBodyCtrl.setStickyBottomHeight(height);
                hasSomethingChanged = true;
            }
        }

        // clean up removed ctrls
        this.destroyRowCtrls(removedCtrlsMap, false);

        // set up new ctrls list
        const newCtrlsList = [...remainingCtrls, ...newCtrls];
        newCtrlsList.sort((a, b) => b.getRowNode().rowIndex! - a.getRowNode().rowIndex!);
        if (!isTop) {
            newCtrlsList.reverse();
        }
        newCtrlsList.forEach((ctrl) => ctrl.setRowTop(ctrl.getRowNode().stickyRowTop));

        let extraHeight = 0;
        if (isTop) {
            newStickyNodes.forEach((node) => {
                if (node.rowIndex! < this.pageBounds.getFirstRow()) {
                    extraHeight += node.rowHeight!;
                }
            });
            if (extraHeight > this.topContainerHeight) {
                extraHeight = this.topContainerHeight;
            }
            this.setOffsetTop(extraHeight);
        } else {
            newStickyNodes.forEach((node) => {
                if (node.rowIndex! > this.pageBounds.getLastRow()) {
                    extraHeight += node.rowHeight!;
                }
            });
            if (extraHeight > this.bottomContainerHeight) {
                extraHeight = this.bottomContainerHeight;
            }
            this.setOffsetBottom(extraHeight);
        }

        if (!hasSomethingChanged) {
            return false;
        }

        if (isTop) {
            this.stickyTopRowCtrls = newCtrlsList;
        } else {
            this.stickyBottomRowCtrls = newCtrlsList;
        }

        return true;
    }

    public ensureRowHeightsValid(): boolean {
        let anyChange = false;
        const updateRowHeight = (ctrl: RowCtrl) => {
            const rowNode = ctrl.getRowNode();
            if (rowNode.rowHeightEstimated) {
                const rowHeight = _getRowHeightForNode(this.gos, rowNode);
                rowNode.setRowHeight(rowHeight.height);
                anyChange = true;
            }
        };
        this.stickyTopRowCtrls.forEach(updateRowHeight);
        this.stickyBottomRowCtrls.forEach(updateRowHeight);
        return anyChange;
    }
}
