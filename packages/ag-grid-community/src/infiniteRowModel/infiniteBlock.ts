import { BeanStub } from '../context/beanStub';
import { RowNode } from '../entities/rowNode';
import type { IGetRowsParams } from '../interfaces/iDatasource';
import type { LoadSuccessParams } from '../interfaces/iServerSideRowModel';
import { _exists, _missing } from '../utils/generic';
import { _warn } from '../validation/logging';
import type { InfiniteCache, InfiniteCacheParams } from './infiniteCache';

type RowNodeBlockState = 'needsLoading' | 'loading' | 'loaded' | 'failed';

export type RowNodeBlockEvent = 'loadComplete';

export class InfiniteBlock extends BeanStub<RowNodeBlockEvent> {
    public state: RowNodeBlockState = 'needsLoading';
    public version = 0;

    public readonly startRow: number;
    public readonly endRow: number;

    public lastAccessed: number;

    public rowNodes: RowNode[];

    constructor(
        public readonly id: number,
        private readonly parentCache: InfiniteCache,
        private readonly params: InfiniteCacheParams
    ) {
        super();

        // we don't need to calculate these now, as the inputs don't change,
        // however it makes the code easier to read if we work them out up front
        this.startRow = id * params.blockSize!;
        this.endRow = this.startRow + params.blockSize!;
    }

    public load(): void {
        this.state = 'loading';
        this.loadFromDatasource();
    }

    public setStateWaitingToLoad(): void {
        // in case any current loads in progress, this will have their results ignored
        this.version++;
        this.state = 'needsLoading';
    }

    private pageLoadFailed(version: number) {
        const requestMostRecentAndLive = this.isRequestMostRecentAndLive(version);
        if (requestMostRecentAndLive) {
            this.state = 'failed';
        }

        this.dispatchLocalEvent({ type: 'loadComplete' });
    }

    private pageLoaded(version: number, rows: any[], lastRow: number) {
        this.successCommon(version, { rowData: rows, rowCount: lastRow });
    }

    private isRequestMostRecentAndLive(version: number): boolean {
        // thisIsMostRecentRequest - if block was refreshed, then another request
        // could of been sent after this one.
        const thisIsMostRecentRequest = version === this.version;

        // weAreNotDestroyed - if InfiniteStore is purged, then blocks are destroyed
        // and new blocks created. so data loads of old blocks are discarded.
        const weAreNotDestroyed = this.isAlive();

        return thisIsMostRecentRequest && weAreNotDestroyed;
    }

    private successCommon(version: number, params: LoadSuccessParams) {
        // need to dispatch load complete before processing the data, as PaginationComp checks
        // RowNodeBlockLoader to see if it is still loading, so the RowNodeBlockLoader needs to
        // be updated first (via LoadComplete event) before PaginationComp updates (via processServerResult method)
        this.dispatchLocalEvent({ type: 'loadComplete' });

        const requestMostRecentAndLive = this.isRequestMostRecentAndLive(version);

        if (requestMostRecentAndLive) {
            this.state = 'loaded';
            this.processServerResult(params);
        }
    }

    public postConstruct(): void {
        // creates empty row nodes, data is missing as not loaded yet
        this.rowNodes = [];
        const {
            params: { blockSize, rowHeight },
            startRow,
            beans,
            rowNodes,
        } = this;
        for (let i = 0; i < blockSize!; i++) {
            const rowIndex = startRow + i;

            const rowNode = new RowNode(beans);

            rowNode.setRowHeight(rowHeight);
            rowNode.uiLevel = 0;
            rowNode.setRowIndex(rowIndex);
            rowNode.setRowTop(rowHeight * rowIndex);

            rowNodes.push(rowNode);
        }
    }

    public getBlockStateJson(): { id: string; state: any } {
        const { id, startRow, endRow, state: pageStatus } = this;
        return {
            id: '' + id,
            state: {
                blockNumber: id,
                startRow,
                endRow,
                pageStatus,
            },
        };
    }

    private setDataAndId(rowNode: RowNode, data: any, index: number): void {
        if (_exists(data)) {
            // this means if the user is not providing id's we just use the
            // index for the row. this will allow selection to work (that is based
            // on index) as long user is not inserting or deleting rows,
            // or wanting to keep selection between server side sorting or filtering
            rowNode.setDataAndId(data, index.toString());
        } else {
            rowNode.setDataAndId(undefined, undefined);
        }
    }

    private loadFromDatasource(): void {
        const params = this.createLoadParams();
        if (_missing(this.params.datasource.getRows)) {
            _warn(90);
            return;
        }

        // put in timeout, to force result to be async
        window.setTimeout(() => {
            this.params.datasource.getRows(params);
        }, 0);
    }

    private createLoadParams(): any {
        const {
            startRow,
            endRow,
            version,
            params: { sortModel, filterModel },
            gos,
        } = this;
        // PROBLEM . . . . when the user sets sort via colDef.sort, then this code
        // is executing before the sort is set up, so server is not getting the sort
        // model. need to change with regards order - so the server side request is
        // AFTER thus it gets the right sort model.
        const params: IGetRowsParams = {
            startRow,
            endRow,
            successCallback: this.pageLoaded.bind(this, version),
            failCallback: this.pageLoadFailed.bind(this, version),
            sortModel,
            filterModel,
            context: gos.getGridCommonParams().context,
        };
        return params;
    }

    public forEachNode(
        callback: (rowNode: RowNode, index: number) => void,
        sequence: { value: number },
        rowCount: number
    ): void {
        this.rowNodes.forEach((rowNode: RowNode, index: number) => {
            const rowIndex = this.startRow + index;
            if (rowIndex < rowCount) {
                callback(rowNode, sequence.value++);
            }
        });
    }

    public getRow(rowIndex: number, dontTouchLastAccessed = false): RowNode {
        if (!dontTouchLastAccessed) {
            this.lastAccessed = this.params.lastAccessedSequence.value++;
        }
        const localIndex = rowIndex - this.startRow;
        return this.rowNodes[localIndex];
    }

    private processServerResult(params: LoadSuccessParams): void {
        const { rowNodes, beans } = this;
        rowNodes.forEach((rowNode: RowNode, index: number) => {
            const data = params.rowData ? params.rowData[index] : undefined;

            if (!rowNode.id && rowNode.alreadyRendered && data) {
                // if the node had no id and was rendered, but we have data for it now, then
                // destroy the old row and copy its position into new row. This prevents an additional
                // set of events being fired as the row renderer tries to understand the changing id
                rowNodes[index] = new RowNode(beans);
                rowNodes[index].setRowIndex(rowNode.rowIndex!);
                rowNodes[index].setRowTop(rowNode.rowTop!);
                rowNodes[index].setRowHeight(rowNode.rowHeight!);

                // clean up the old row
                rowNode.clearRowTopAndRowIndex();
            }
            this.setDataAndId(rowNodes[index], data, this.startRow + index);
        });
        const finalRowCount = params.rowCount != null && params.rowCount >= 0 ? params.rowCount : undefined;
        this.parentCache.pageLoaded(this, finalRowCount);
    }

    public override destroy(): void {
        this.rowNodes.forEach((rowNode) => {
            // this is needed, so row render knows to fade out the row, otherwise it
            // sees row top is present, and thinks the row should be shown.
            rowNode.clearRowTopAndRowIndex();
        });
        super.destroy();
    }
}
