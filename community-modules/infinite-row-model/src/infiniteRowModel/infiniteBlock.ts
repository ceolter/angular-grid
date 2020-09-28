import {
    _,
    Autowired,
    GridOptionsWrapper,
    IGetRowsParams,
    NumberSequence,
    PostConstruct,
    PreDestroy,
    RowNode,
    RowNodeBlock,
    RowRenderer
} from "@ag-grid-community/core";
import {InfiniteCacheParams} from "./infiniteCache";

export class InfiniteBlock extends RowNodeBlock {

    @Autowired('rowRenderer') private rowRenderer: RowRenderer;
    @Autowired('gridOptionsWrapper') private gridOptionsWrapper: GridOptionsWrapper;

    private readonly blockNumber: number;
    private readonly startRow: number;
    private readonly endRow: number;

    private params: InfiniteCacheParams;

    private lastAccessed: number;

    public rowNodes: RowNode[];

    constructor(blockNumber: number, params: InfiniteCacheParams) {
        super();

        this.params = params;
        this.blockNumber = blockNumber;

        // we don't need to calculate these now, as the inputs don't change,
        // however it makes the code easier to read if we work them out up front
        this.startRow = blockNumber * params.blockSize;
        this.endRow = this.startRow + params.blockSize;
    }

    @PostConstruct
    protected postConstruct(): void {
        this.createRowNodes();
    }

    public getBlockStateJson(): {id: string, state: any} {
        return {
            id: '' + this.getBlockNumber(),
            state: {
                blockNumber: this.getBlockNumber(),
                startRow: this.getStartRow(),
                endRow: this.getEndRow(),
                pageStatus: this.getState()
            }
        };
    }

    protected setDataAndId(rowNode: RowNode, data: any, index: number): void {
        if (_.exists(data)) {
            // this means if the user is not providing id's we just use the
            // index for the row. this will allow selection to work (that is based
            // on index) as long user is not inserting or deleting rows,
            // or wanting to keep selection between server side sorting or filtering
            rowNode.setDataAndId(data, index.toString());
        } else {
            rowNode.setDataAndId(undefined, undefined);
        }
    }

    protected loadFromDatasource(): void {
        const params = this.createLoadParams();
        if (_.missing(this.params.datasource.getRows)) {
            console.warn(`ag-Grid: datasource is missing getRows method`);
            return;
        }

        // put in timeout, to force result to be async
        window.setTimeout(() => {
            this.params.datasource.getRows(params);
        }, 0);
    }

    protected createLoadParams(): any {
        // PROBLEM . . . . when the user sets sort via colDef.sort, then this code
        // is executing before the sort is set up, so server is not getting the sort
        // model. need to change with regards order - so the server side request is
        // AFTER thus it gets the right sort model.
        const params: IGetRowsParams = {
            startRow: this.getStartRow(),
            endRow: this.getEndRow(),
            successCallback: this.pageLoaded.bind(this, this.getVersion()),
            failCallback: this.pageLoadFailed.bind(this),
            sortModel: this.params.sortModel,
            filterModel: this.params.filterModel,
            context: this.gridOptionsWrapper.getContext()
        };
        return params;
    }

    public forEachNode(callback: (rowNode: RowNode, index: number) => void,
                       sequence: NumberSequence,
                       rowCount: number): void {
        for (let rowIndex = this.startRow; rowIndex < this.endRow; rowIndex++) {
            // we check against rowCount as this page may be the last one, and if it is, then
            // the last rows are not part of the set
            if (rowIndex < rowCount) {
                const rowNode = this.getRow(rowIndex);
                callback(rowNode, sequence.next());
            }
        }
    }

    public getLastAccessed(): number {
        return this.lastAccessed;
    }

    public getRow(rowIndex: number, dontTouchLastAccessed = false): RowNode {
        if (!dontTouchLastAccessed) {
            this.lastAccessed = this.params.lastAccessedSequence.next();
        }
        const localIndex = rowIndex - this.startRow;
        return this.rowNodes[localIndex];
    }

    public getStartRow(): number {
        return this.startRow;
    }

    public getEndRow(): number {
        return this.endRow;
    }

    public getBlockNumber(): number {
        return this.blockNumber;
    }

    protected createBlankRowNode(rowIndex: number): RowNode {
        const rowNode = this.getContext().createBean(new RowNode());

        rowNode.setRowHeight(this.params.rowHeight);
        rowNode.uiLevel = 0;
        rowNode.setRowIndex(rowIndex);
        rowNode.rowTop = this.params.rowHeight * rowIndex;

        return rowNode;
    }

    // creates empty row nodes, data is missing as not loaded yet
    protected createRowNodes(): void {
        this.rowNodes = [];
        for (let i = 0; i < this.params.blockSize; i++) {
            let rowIndex = this.startRow + i;
            const rowNode = this.createBlankRowNode(rowIndex);
            this.rowNodes.push(rowNode);
        }
    }

    protected processServerResult(rows: any[]): void {
        const rowNodesToRefresh: RowNode[] = [];

        this.rowNodes.forEach((rowNode: RowNode, index: number) => {
            const data = rows[index];
            if (rowNode.stub) {
                rowNodesToRefresh.push(rowNode);
            }
            this.setDataAndId(rowNode, data, this.startRow + index);
        });

        if (rowNodesToRefresh.length > 0) {
            this.rowRenderer.redrawRows(rowNodesToRefresh);
        }
    }

    @PreDestroy
    private destroyRowNodes(): void {
        this.rowNodes.forEach(rowNode => {
            // this is needed, so row render knows to fade out the row, otherwise it
            // sees row top is present, and thinks the row should be shown. maybe
            // rowNode should have a flag on whether it is visible???
            rowNode.clearRowTop();
        });
    }
}
