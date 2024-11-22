import type { NamedBean } from '../context/bean';
import { BeanStub } from '../context/beanStub';
import { _getMaxConcurrentDatasourceRequests } from '../gridOptionsUtils';
import { _removeFromArray } from '../utils/array';
import { _debounce, _logIfDebug } from '../utils/function';
import type { InfiniteBlock } from './infiniteBlock';

export type RowNodeBlockLoaderEvent = 'blockLoaded';
export class RowNodeBlockLoader extends BeanStub<RowNodeBlockLoaderEvent> implements NamedBean {
    beanName = 'rowNodeBlockLoader' as const;

    private maxConcurrentRequests: number | undefined;
    private checkBlockToLoadDebounce: () => void;

    private activeBlockLoadsCount = 0;
    private blocks: InfiniteBlock[] = [];
    private active = true;

    public postConstruct(): void {
        this.maxConcurrentRequests = _getMaxConcurrentDatasourceRequests(this.gos);
        const blockLoadDebounceMillis = this.gos.get('blockLoadDebounceMillis');

        if (blockLoadDebounceMillis && blockLoadDebounceMillis > 0) {
            this.checkBlockToLoadDebounce = _debounce(
                this,
                this.performCheckBlocksToLoad.bind(this),
                blockLoadDebounceMillis
            );
        }
    }

    public addBlock(block: InfiniteBlock): void {
        this.blocks.push(block);

        // note that we do not remove this listener when removing the block. this is because the
        // cache can get destroyed (and containing blocks) when a block is loading. however the loading block
        // is still counted as an active loading block and we must decrement activeBlockLoadsCount when it finishes.
        block.addEventListener('loadComplete', this.loadComplete.bind(this));

        this.checkBlockToLoad();
    }

    public removeBlock(block: InfiniteBlock): void {
        _removeFromArray(this.blocks, block);
    }

    public override destroy(): void {
        super.destroy();
        this.active = false;
    }

    private loadComplete(): void {
        this.activeBlockLoadsCount--;
        this.checkBlockToLoad();
    }

    public checkBlockToLoad(): void {
        if (this.checkBlockToLoadDebounce) {
            this.checkBlockToLoadDebounce();
        } else {
            this.performCheckBlocksToLoad();
        }
    }

    private performCheckBlocksToLoad(): void {
        if (!this.active) {
            return;
        }

        this.printCacheStatus();

        if (this.maxConcurrentRequests != null && this.activeBlockLoadsCount >= this.maxConcurrentRequests) {
            _logIfDebug(this.gos, `RowNodeBlockLoader - checkBlockToLoad: max loads exceeded`);
            return;
        }

        const loadAvailability =
            this.maxConcurrentRequests != null ? this.maxConcurrentRequests - this.activeBlockLoadsCount : 1;
        const blocksToLoad: InfiniteBlock[] = this.blocks
            .filter((block) => block.state === 'needsLoading')
            .slice(0, loadAvailability);
        this.activeBlockLoadsCount += blocksToLoad.length;
        blocksToLoad.forEach((block) => block.load());
        this.printCacheStatus();
    }

    public getBlockState() {
        const result: { [key: string]: any } = {};
        this.blocks.forEach((block: InfiniteBlock) => {
            const { id, state } = block.getBlockStateJson();
            result[id] = state;
        });
        return result;
    }

    private printCacheStatus(): void {
        _logIfDebug(
            this.gos,
            `RowNodeBlockLoader - printCacheStatus: activePageLoadsCount = ${this.activeBlockLoadsCount},` +
                ` blocks = ${JSON.stringify(this.getBlockState())}`
        );
    }
}
