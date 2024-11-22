import type {
    DetailGridInfo,
    FullWidthRowFocusedEvent,
    GridApi,
    IDetailCellRenderer,
    IDetailCellRendererCtrl,
    IDetailCellRendererParams,
    RowNode,
} from 'ag-grid-community';
import { BeanStub, _focusInto, _isSameRow, _missing, _warn } from 'ag-grid-community';

export class DetailCellRendererCtrl extends BeanStub implements IDetailCellRendererCtrl {
    private params: IDetailCellRendererParams;

    private comp: IDetailCellRenderer;

    private loadRowDataVersion = 0;

    private refreshStrategy: 'rows' | 'everything' | 'nothing';

    public init(comp: IDetailCellRenderer, params: IDetailCellRendererParams): void {
        this.params = params;
        this.comp = comp;

        const doNothingBecauseInsidePinnedSection = params.pinned != null;
        if (doNothingBecauseInsidePinnedSection) {
            return;
        }

        this.setAutoHeightClasses();
        this.setupRefreshStrategy();
        this.createDetailGrid();
        this.loadRowData();

        this.addManagedEventListeners({ fullWidthRowFocused: this.onFullWidthRowFocused.bind(this) });
    }

    private onFullWidthRowFocused(e: FullWidthRowFocusedEvent): void {
        const params = this.params;
        const row = { rowIndex: params.node.rowIndex!, rowPinned: params.node.rowPinned! };
        const eventRow = { rowIndex: e.rowIndex!, rowPinned: e.rowPinned! };
        const isSameRow = _isSameRow(row, eventRow);

        if (!isSameRow) {
            return;
        }

        _focusInto(this.comp.getGui(), e.fromBelow);
    }

    private setAutoHeightClasses(): void {
        const autoHeight = this.gos.get('detailRowAutoHeight');

        const parentClass = autoHeight ? 'ag-details-row-auto-height' : 'ag-details-row-fixed-height';
        const detailClass = autoHeight ? 'ag-details-grid-auto-height' : 'ag-details-grid-fixed-height';

        const comp = this.comp;
        comp.addOrRemoveCssClass(parentClass, true);
        comp.addOrRemoveDetailGridCssClass(detailClass, true);
    }

    private setupRefreshStrategy(): void {
        const providedStrategy = this.params.refreshStrategy;

        const validSelection =
            providedStrategy == 'everything' || providedStrategy == 'nothing' || providedStrategy == 'rows';
        if (validSelection) {
            this.refreshStrategy = providedStrategy;
            return;
        }

        if (providedStrategy != null) {
            _warn(170, { providedStrategy });
        }

        this.refreshStrategy = 'rows';
    }

    private createDetailGrid(): void {
        const { params, gos } = this;
        if (_missing(params.detailGridOptions)) {
            _warn(171);
            return;
        }

        // we clone the detail grid options, as otherwise it would be shared
        // across many instances, and that would be a problem because we set
        // api into gridOptions
        const gridOptions = { ...params.detailGridOptions };

        const autoHeight = gos.get('detailRowAutoHeight');
        if (autoHeight) {
            gridOptions.domLayout = 'autoHeight';
        }

        gridOptions.theme ||= gos.get('theme');

        this.comp.setDetailGrid(gridOptions);
    }

    public registerDetailWithMaster(api: GridApi): void {
        const params = this.params;
        const rowId = params.node.id!;
        const masterGridApi = params.api;

        const gridInfo: DetailGridInfo = {
            id: rowId,
            api: api,
        };

        const rowNode = params.node as RowNode;

        // register with api if the master api is still alive
        if (masterGridApi.isDestroyed()) {
            return;
        }
        masterGridApi.addDetailGridInfo(rowId, gridInfo);

        // register with node
        rowNode.detailGridInfo = gridInfo;

        this.addDestroyFunc(() => {
            // the gridInfo can be stale if a refresh happens and
            // a new row is created before the old one is destroyed.
            if (rowNode.detailGridInfo !== gridInfo) {
                return;
            }
            if (!masterGridApi.isDestroyed()) {
                masterGridApi.removeDetailGridInfo(rowId); // unregister from api
            }
            rowNode.detailGridInfo = null; // unregister from node
        });
    }

    private loadRowData(): void {
        // in case a refresh happens before the last refresh completes (as we depend on async
        // application logic) we keep track on what the latest call was.
        this.loadRowDataVersion++;
        const versionThisCall = this.loadRowDataVersion;

        const params = this.params;
        if (params.detailGridOptions?.rowModelType === 'serverSide') {
            const node = params.node as RowNode;
            node.detailGridInfo?.api?.refreshServerSide({ purge: true });
            return;
        }

        const userFunc = params.getDetailRowData;
        if (!userFunc) {
            _warn(172);
            return;
        }

        const successCallback = (rowData: any[]) => {
            const mostRecentCall = this.loadRowDataVersion === versionThisCall;
            if (mostRecentCall) {
                this.comp.setRowData(rowData);
            }
        };

        const funcParams: any = {
            node: params.node,
            // we take data from node, rather than params.data
            // as the data could have been updated with new instance
            data: params.node.data,
            successCallback: successCallback,
            context: this.gos.getGridCommonParams().context,
        };
        userFunc(funcParams);
    }

    public refresh(): boolean {
        const GET_GRID_TO_REFRESH = false;
        const GET_GRID_TO_DO_NOTHING = true;

        switch (this.refreshStrategy) {
            // ignore this refresh, make grid think we've refreshed but do nothing
            case 'nothing':
                return GET_GRID_TO_DO_NOTHING;
            // grid will destroy and recreate the cell
            case 'everything':
                return GET_GRID_TO_REFRESH;
        }

        // do the refresh here, and tell the grid to do nothing
        this.loadRowData();
        return GET_GRID_TO_DO_NOTHING;
    }
}
