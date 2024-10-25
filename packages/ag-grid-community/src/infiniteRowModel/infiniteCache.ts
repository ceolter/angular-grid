import { BeanStub } from '../context/beanStub';
import type { BeanCollection } from '../context/context';
import type { RowNode } from '../entities/rowNode';
import type { FocusService } from '../focusService';
import type { IDatasource } from '../interfaces/iDatasource';
import type { SortModelItem } from '../interfaces/iSortModelItem';
import type { RowRenderer } from '../rendering/rowRenderer';
import { _logIfDebug } from '../utils/function';
import { _exists } from '../utils/generic';
import { InfiniteBlock } from './infiniteBlock';
import type { RowNodeBlockLoader } from './rowNodeBlockLoader';

export interface InfiniteCacheParams {
    datasource: IDatasource;
    initialRowCount: number;
    blockSize?: number;
    overflowSize: number;
    sortModel: SortModelItem[];
    filterModel: any;
    maxBlocksInCache?: number;
    rowHeight: number;
    lastAccessedSequence: { value: number };
    rowNodeBlockLoader?: RowNodeBlockLoader;
    dynamicRowHeight: boolean;
}

// this property says how many empty blocks should be in a cache, eg if scrolls down fast and creates 10
// blocks all for loading, the grid will only load the last 2 - it will assume the blocks the user quickly
// scrolled over are not needed to be loaded.
const MAX_EMPTY_BLOCKS_TO_KEEP = 2;

export class InfiniteCache extends BeanStub {
    protected rowRenderer: RowRenderer;
    private focusSvc: FocusService;

    public wireBeans(beans: BeanCollection): void {
        this.rowRenderer = beans.rowRenderer;
        this.focusSvc = beans.focusSvc;
    }

    private readonly params: InfiniteCacheParams;

    private rowCount: number;
    private lastRowIndexKnown = false;

    private blocks: { [blockNumber: string]: InfiniteBlock } = {};
    private blockCount = 0;

    constructor(params: InfiniteCacheParams) {
        super();
        this.rowCount = params.initialRowCount;
        this.params = params;
    }

    // the rowRenderer will not pass dontCreatePage, meaning when rendering the grid,
    // it will want new pages in the cache as it asks for rows. only when we are inserting /
    // removing rows via the api is dontCreatePage set, where we move rows between the pages.
    public getRow(rowIndex: number, dontCreatePage = false): RowNode | undefined {
        const blockId = Math.floor(rowIndex / this.params.blockSize!);
        let block = this.blocks[blockId];

        if (!block) {
            if (dontCreatePage) {
                return undefined;
            }
            block = this.createBlock(blockId);
        }

        return block.getRow(rowIndex);
    }

    private createBlock(blockNumber: number): InfiniteBlock {
        const newBlock = this.createBean(new InfiniteBlock(blockNumber, this, this.params));

        this.blocks[newBlock.getId()] = newBlock;
        this.blockCount++;

        this.purgeBlocksIfNeeded(newBlock);

        this.params.rowNodeBlockLoader!.addBlock(newBlock);

        return newBlock;
    }

    // we have this on infinite row model only, not server side row model,
    // because for server side, it would leave the children in inconsistent
    // state - eg if a node had children, but after the refresh it had data
    // for a different row, then the children would be with the wrong row node.
    public refreshCache(): void {
        const nothingToRefresh = this.blockCount == 0;
        if (nothingToRefresh) {
            this.purgeCache();
            return;
        }

        this.getBlocksInOrder().forEach((block) => block.setStateWaitingToLoad());
        this.params.rowNodeBlockLoader!.checkBlockToLoad();
    }

    public override destroy(): void {
        this.getBlocksInOrder().forEach((block) => this.destroyBlock(block));
        super.destroy();
    }

    public getRowCount(): number {
        return this.rowCount;
    }

    public isLastRowIndexKnown(): boolean {
        return this.lastRowIndexKnown;
    }

    // block calls this, when page loaded
    public pageLoaded(block: InfiniteBlock, lastRow?: number): void {
        // if we are not active, then we ignore all events, otherwise we could end up getting the
        // grid to refresh even though we are no longer the active cache
        if (!this.isAlive()) {
            return;
        }

        _logIfDebug(this.gos, `InfiniteCache - onPageLoaded: page = ${block.getId()}, lastRow = ${lastRow}`);

        this.checkRowCount(block, lastRow);
        // we fire cacheUpdated even if the row count has not changed, as some items need updating even
        // if no new rows to render. for example the pagination panel has '?' as the total rows when loading
        // is underway, which would need to get updated when loading finishes.
        this.onCacheUpdated();
    }

    private purgeBlocksIfNeeded(blockToExclude: InfiniteBlock): void {
        // we exclude checking for the page just created, as this has yet to be accessed and hence
        // the lastAccessed stamp will not be updated for the first time yet
        const blocksForPurging = this.getBlocksInOrder().filter((b) => b != blockToExclude);
        const lastAccessedComparator = (a: InfiniteBlock, b: InfiniteBlock) =>
            b.getLastAccessed() - a.getLastAccessed();
        blocksForPurging.sort(lastAccessedComparator);

        // we remove (maxBlocksInCache - 1) as we already excluded the 'just created' page.
        // in other words, after the splice operation below, we have taken out the blocks
        // we want to keep, which means we are left with blocks that we can potentially purge
        const maxBlocksProvided = this.params.maxBlocksInCache! > 0;
        const blocksToKeep = maxBlocksProvided ? this.params.maxBlocksInCache! - 1 : null;
        const emptyBlocksToKeep = MAX_EMPTY_BLOCKS_TO_KEEP - 1;

        blocksForPurging.forEach((block: InfiniteBlock, index: number) => {
            const purgeBecauseBlockEmpty = block.getState() === 'needsLoading' && index >= emptyBlocksToKeep;

            const purgeBecauseCacheFull = maxBlocksProvided ? index >= blocksToKeep! : false;

            if (purgeBecauseBlockEmpty || purgeBecauseCacheFull) {
                // if the block currently has rows been displayed, then don't remove it either.
                // this can happen if user has maxBlocks=2, and blockSize=5 (thus 10 max rows in cache)
                // but the screen is showing 20 rows, so at least 4 blocks are needed.
                if (this.isBlockCurrentlyDisplayed(block)) {
                    return;
                }

                // don't want to loose keyboard focus, so keyboard navigation can continue. so keep focused blocks.
                if (this.isBlockFocused(block)) {
                    return;
                }

                // at this point, block is not needed, so burn baby burn
                this.removeBlockFromCache(block);
            }
        });
    }

    private isBlockFocused(block: InfiniteBlock): boolean {
        const focusedCell = this.focusSvc.getFocusCellToUseAfterRefresh();
        if (!focusedCell) {
            return false;
        }
        if (focusedCell.rowPinned != null) {
            return false;
        }

        const blockIndexStart = block.getStartRow();
        const blockIndexEnd = block.getEndRow();

        const hasFocus = focusedCell.rowIndex >= blockIndexStart && focusedCell.rowIndex < blockIndexEnd;
        return hasFocus;
    }

    private isBlockCurrentlyDisplayed(block: InfiniteBlock): boolean {
        const startIndex = block.getStartRow();
        const endIndex = block.getEndRow() - 1;
        return this.rowRenderer.isRangeInRenderedViewport(startIndex, endIndex);
    }

    private removeBlockFromCache(blockToRemove: InfiniteBlock): void {
        if (!blockToRemove) {
            return;
        }

        this.destroyBlock(blockToRemove);

        // we do not want to remove the 'loaded' event listener, as the
        // concurrent loads count needs to be updated when the load is complete
        // if the purged page is in loading state
    }

    private checkRowCount(block: InfiniteBlock, lastRow?: number): void {
        // if client provided a last row, we always use it, as it could change between server calls
        // if user deleted data and then called refresh on the grid.
        if (typeof lastRow === 'number' && lastRow >= 0) {
            this.rowCount = lastRow;
            this.lastRowIndexKnown = true;
        } else if (!this.lastRowIndexKnown) {
            // otherwise, see if we need to add some virtual rows
            const lastRowIndex = (block.getId() + 1) * this.params.blockSize!;
            const lastRowIndexPlusOverflow = lastRowIndex + this.params.overflowSize;

            if (this.rowCount < lastRowIndexPlusOverflow) {
                this.rowCount = lastRowIndexPlusOverflow;
            }
        }
    }

    public setRowCount(rowCount: number, lastRowIndexKnown?: boolean): void {
        this.rowCount = rowCount;

        // if undefined is passed, we do not set this value, if one of {true,false}
        // is passed, we do set the value.
        if (_exists(lastRowIndexKnown)) {
            this.lastRowIndexKnown = lastRowIndexKnown;
        }

        // if we are still searching, then the row count must not end at the end
        // of a particular page, otherwise the searching will not pop into the
        // next page
        if (!this.lastRowIndexKnown) {
            if (this.rowCount % this.params.blockSize! === 0) {
                this.rowCount++;
            }
        }

        this.onCacheUpdated();
    }

    public forEachNodeDeep(callback: (rowNode: RowNode, index: number) => void): void {
        const sequence = { value: 0 };
        this.getBlocksInOrder().forEach((block) => block.forEachNode(callback, sequence, this.rowCount));
    }

    public getBlocksInOrder(): InfiniteBlock[] {
        // get all page id's as NUMBERS (not strings, as we need to sort as numbers) and in descending order
        const blockComparator = (a: InfiniteBlock, b: InfiniteBlock) => a.getId() - b.getId();
        const blocks = Object.values(this.blocks).sort(blockComparator);
        return blocks;
    }

    private destroyBlock(block: InfiniteBlock): void {
        delete this.blocks[block.getId()];
        this.destroyBean(block);
        this.blockCount--;
        this.params.rowNodeBlockLoader!.removeBlock(block);
    }

    // gets called 1) row count changed 2) cache purged 3) items inserted
    private onCacheUpdated(): void {
        if (this.isAlive()) {
            // if the virtualRowCount is shortened, then it's possible blocks exist that are no longer
            // in the valid range. so we must remove these. this can happen if user explicitly sets
            // the virtual row count, or the datasource returns a result and sets lastRow to something
            // less than virtualRowCount (can happen if user scrolls down, server reduces dataset size).
            this.destroyAllBlocksPastVirtualRowCount();

            // this results in both row models (infinite and server side) firing ModelUpdated,
            // however server side row model also updates the row indexes first
            this.eventSvc.dispatchEvent({
                type: 'storeUpdated',
            });
        }
    }

    private destroyAllBlocksPastVirtualRowCount(): void {
        const blocksToDestroy: InfiniteBlock[] = [];
        this.getBlocksInOrder().forEach((block) => {
            const startRow = block.getId() * this.params.blockSize!;
            if (startRow >= this.rowCount) {
                blocksToDestroy.push(block);
            }
        });
        if (blocksToDestroy.length > 0) {
            blocksToDestroy.forEach((block) => this.destroyBlock(block));
        }
    }

    public purgeCache(): void {
        this.getBlocksInOrder().forEach((block) => this.removeBlockFromCache(block));
        this.lastRowIndexKnown = false;
        // if zero rows in the cache, we need to get the SSRM to start asking for rows again.
        // otherwise if set to zero rows last time, and we don't update the row count, then after
        // the purge there will still be zero rows, meaning the SSRM won't request any rows.
        // to kick things off, at least one row needs to be asked for.
        if (this.rowCount === 0) {
            this.rowCount = this.params.initialRowCount;
        }

        this.onCacheUpdated();
    }

    public getRowNodesInRange(firstInRange: RowNode, lastInRange: RowNode): RowNode[] {
        const result: RowNode[] = [];

        let lastBlockId = -1;
        let inActiveRange = false;
        const numberSequence = { value: 0 };

        let foundGapInSelection = false;

        this.getBlocksInOrder().forEach((block) => {
            if (foundGapInSelection) {
                return;
            }

            if (inActiveRange && lastBlockId + 1 !== block.getId()) {
                foundGapInSelection = true;
                return;
            }

            lastBlockId = block.getId();

            block.forEachNode(
                (rowNode) => {
                    const hitFirstOrLast = rowNode === firstInRange || rowNode === lastInRange;
                    if (inActiveRange || hitFirstOrLast) {
                        result.push(rowNode);
                    }

                    if (hitFirstOrLast) {
                        inActiveRange = !inActiveRange;
                    }
                },
                numberSequence,
                this.rowCount
            );
        });

        // inActiveRange will be still true if we never hit the second rowNode
        const invalidRange = foundGapInSelection || inActiveRange;
        return invalidRange ? [] : result;
    }
}
