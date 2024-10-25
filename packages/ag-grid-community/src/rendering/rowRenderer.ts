import type { ColumnModel } from '../columns/columnModel';
import type { VisibleColsService } from '../columns/visibleColsService';
import type { NamedBean } from '../context/bean';
import { BeanStub } from '../context/beanStub';
import type { BeanCollection } from '../context/context';
import type { CtrlsService } from '../ctrlsService';
import type { AgColumn } from '../entities/agColumn';
import type { RowNode } from '../entities/rowNode';
import type { Environment } from '../environment';
import type { BodyScrollEvent, CellFocusedEvent, PaginationChangedEvent } from '../events';
import type { FocusService } from '../focusService';
import type { GridBodyCtrl } from '../gridBodyComp/gridBodyCtrl';
import {
    _getActiveDomElement,
    _getDomData,
    _getRowHeightAsNumber,
    _isAnimateRows,
    _isCellSelectionEnabled,
    _isDomLayout,
} from '../gridOptionsUtils';
import type { RenderedRowEvent } from '../interfaces/iCallbackParams';
import type { CellPosition } from '../interfaces/iCellPosition';
import type { RefreshCellsParams } from '../interfaces/iCellsParams';
import type { IEventListener } from '../interfaces/iEventEmitter';
import type { IRowModel } from '../interfaces/iRowModel';
import type { IRowNode, RowPinnedType } from '../interfaces/iRowNode';
import type { RowPosition } from '../interfaces/iRowPosition';
import type { AnimationFrameService } from '../misc/animationFrameService';
import type { PageBoundsService } from '../pagination/pageBoundsService';
import type { PaginationService } from '../pagination/paginationService';
import type { PinnedRowModel } from '../pinnedRowModel/pinnedRowModel';
import { _removeFromArray } from '../utils/array';
import { _exists } from '../utils/generic';
import type { CellCtrl } from './cell/cellCtrl';
import { DOM_DATA_KEY_CELL_CTRL } from './cell/cellCtrl';
import type { StickyRowFeature } from './features/stickyRowFeature';
import type { StickyRowService } from './features/stickyRowService';
import type { RowCtrlInstanceId } from './row/rowCtrl';
import { DOM_DATA_KEY_ROW_CTRL, RowCtrl } from './row/rowCtrl';
import type { RowContainerHeightService } from './rowContainerHeightService';

type RowCtrlIdMap = Record<RowCtrlInstanceId, RowCtrl>;
type RowCtrlByRowIndex = Record<number, RowCtrl>;
export type RowCtrlByRowNodeIdMap = Record<string, RowCtrl>;

interface RowNodeMap {
    [id: string]: IRowNode;
}

const ROW_ANIMATION_TIMEOUT = 400 as const;

export class RowRenderer extends BeanStub implements NamedBean {
    beanName = 'rowRenderer' as const;

    private animationFrameSvc?: AnimationFrameService;
    private pagination?: PaginationService;
    private pageBounds: PageBoundsService;
    private colModel: ColumnModel;
    private visibleCols: VisibleColsService;
    private pinnedRowModel?: PinnedRowModel;
    private rowModel: IRowModel;
    private focusSvc: FocusService;
    private rowContainerHeight: RowContainerHeightService;
    private ctrlsSvc: CtrlsService;
    private environment: Environment;
    private stickyRowSvc?: StickyRowService;

    public wireBeans(beans: BeanCollection): void {
        this.animationFrameSvc = beans.animationFrameSvc;
        this.pagination = beans.pagination;
        this.pageBounds = beans.pageBounds;
        this.colModel = beans.colModel;
        this.visibleCols = beans.visibleCols;
        this.pinnedRowModel = beans.pinnedRowModel;
        this.rowModel = beans.rowModel;
        this.focusSvc = beans.focusSvc;
        this.rowContainerHeight = beans.rowContainerHeight;
        this.ctrlsSvc = beans.ctrlsSvc;
        this.environment = beans.environment;
        this.stickyRowSvc = beans.stickyRowSvc;
    }

    private gridBodyCtrl: GridBodyCtrl;

    private destroyFuncsForColumnListeners: (() => void)[] = [];

    private firstRenderedRow: number;
    private lastRenderedRow: number;

    // map of row ids to row objects. keeps track of which elements
    // are rendered for which rows in the dom.
    private rowCtrlsByRowIndex: RowCtrlByRowIndex = {};
    private zombieRowCtrls: RowCtrlIdMap = {};
    private cachedRowCtrls: RowCtrlCache;
    private allRowCtrls: RowCtrl[] = [];

    private topRowCtrls: RowCtrl[] = [];
    private bottomRowCtrls: RowCtrl[] = [];

    private pinningLeft: boolean;
    private pinningRight: boolean;

    private firstVisibleVPixel: number;
    private lastVisibleVPixel: number;

    // we only allow one refresh at a time, otherwise the internal memory structure here
    // will get messed up. this can happen if the user has a cellRenderer, and inside the
    // renderer they call an API method that results in another pass of the refresh,
    // then it will be trying to draw rows in the middle of a refresh.
    private refreshInProgress = false;

    private printLayout: boolean;
    private embedFullWidthRows: boolean;
    private stickyRowFeature?: StickyRowFeature;

    private dataFirstRenderedFired = false;

    public postConstruct(): void {
        this.ctrlsSvc.whenReady(this, (p) => {
            this.gridBodyCtrl = p.gridBodyCtrl;
            this.initialise();
        });
    }

    private initialise(): void {
        this.addManagedEventListeners({
            paginationChanged: this.onPageLoaded.bind(this),
            pinnedRowDataChanged: this.onPinnedRowDataChanged.bind(this),
            displayedColumnsChanged: this.onDisplayedColumnsChanged.bind(this),
            bodyScroll: this.onBodyScroll.bind(this),
            bodyHeightChanged: this.redraw.bind(this, {}),
        });

        this.addManagedPropertyListeners(['domLayout', 'embedFullWidthRows'], () => this.onDomLayoutChanged());
        this.addManagedPropertyListeners(['suppressMaxRenderedRowRestriction', 'rowBuffer'], () => this.redraw());
        this.addManagedPropertyListener('suppressCellFocus', (e) => this.onSuppressCellFocusChanged(e.currentValue));
        this.addManagedPropertyListeners(
            [
                'groupSuppressBlankHeader',
                'getBusinessKeyForNode',

                'fullWidthCellRenderer',
                'fullWidthCellRendererParams',

                'suppressStickyTotalRow',

                'groupRowRenderer',
                'groupRowRendererParams', // maybe only needs to refresh FW rows...

                'loadingCellRenderer',
                'loadingCellRendererParams',

                'detailCellRenderer',
                'detailCellRendererParams',

                'enableRangeSelection',
                'enableCellTextSelection',
                'cellSelection',
            ],
            () => this.redrawRows()
        );

        this.stickyRowFeature = this.stickyRowSvc?.createStickyRowFeature(
            this,
            this.createRowCon.bind(this),
            this.destroyRowCtrls.bind(this)
        );

        this.registerCellEventListeners();

        this.initialiseCache();
        this.printLayout = _isDomLayout(this.gos, 'print');
        this.embedFullWidthRows = this.printLayout || this.gos.get('embedFullWidthRows');

        this.redrawAfterModelUpdate();
    }

    private initialiseCache(): void {
        if (this.gos.get('keepDetailRows')) {
            const countProp = this.getKeepDetailRowsCount();
            const count = countProp != null ? countProp : 3;
            this.cachedRowCtrls = new RowCtrlCache(count);
        }
    }

    private getKeepDetailRowsCount(): number {
        return this.gos.get('keepDetailRowsCount');
    }

    public getStickyTopRowCtrls(): RowCtrl[] {
        if (!this.stickyRowFeature) {
            return [];
        }

        return this.stickyRowFeature.getStickyTopRowCtrls();
    }

    public getStickyBottomRowCtrls(): RowCtrl[] {
        if (!this.stickyRowFeature) {
            return [];
        }

        return this.stickyRowFeature.getStickyBottomRowCtrls();
    }

    private updateAllRowCtrls(): void {
        const liveList = Object.values(this.rowCtrlsByRowIndex);
        const zombieList = Object.values(this.zombieRowCtrls);
        const cachedList = this.cachedRowCtrls ? this.cachedRowCtrls.getEntries() : [];

        if (zombieList.length > 0 || cachedList.length > 0) {
            // Only spread if we need to.
            this.allRowCtrls = [...liveList, ...zombieList, ...cachedList];
        } else {
            this.allRowCtrls = liveList;
        }
    }

    private onCellFocusChanged(event?: CellFocusedEvent) {
        this.getAllCellCtrls().forEach((cellCtrl) => cellCtrl.onCellFocused(event));
        this.getFullWidthRowCtrls().forEach((rowCtrl) => rowCtrl.onFullWidthRowFocused(event));
    }

    private onSuppressCellFocusChanged(suppressCellFocus: boolean): void {
        this.getAllCellCtrls().forEach((cellCtrl) => cellCtrl.onSuppressCellFocusChanged(suppressCellFocus));
        this.getFullWidthRowCtrls().forEach((rowCtrl) => rowCtrl.onSuppressCellFocusChanged(suppressCellFocus));
    }

    // in a clean design, each cell would register for each of these events. however when scrolling, all the cells
    // registering and de-registering for events is a performance bottleneck. so we register here once and inform
    // all active cells.
    private registerCellEventListeners(): void {
        this.addManagedEventListeners({
            cellFocused: (event) => {
                this.onCellFocusChanged(event);
            },
            cellFocusCleared: () => this.onCellFocusChanged(),
            flashCells: (event) => {
                const { cellFlashSvc } = this.beans;
                if (cellFlashSvc) {
                    this.getAllCellCtrls().forEach((cellCtrl) => cellFlashSvc.onFlashCells(cellCtrl, event));
                }
            },
            columnHoverChanged: () => {
                this.getAllCellCtrls().forEach((cellCtrl) => cellCtrl.onColumnHover());
            },
            displayedColumnsChanged: () => {
                this.getAllCellCtrls().forEach((cellCtrl) => cellCtrl.onDisplayedColumnsChanged());
            },
            displayedColumnsWidthChanged: () => {
                // only for printLayout - because we are rendering all the cells in the same row, regardless of pinned state,
                // then changing the width of the containers will impact left position. eg the center cols all have their
                // left position adjusted by the width of the left pinned column, so if the pinned left column width changes,
                // all the center cols need to be shifted to accommodate this. when in normal layout, the pinned cols are
                // in different containers so doesn't impact.
                if (this.printLayout) {
                    this.getAllCellCtrls().forEach((cellCtrl) => cellCtrl.onLeftChanged());
                }
            },
        });

        this.setupRangeSelectionListeners();

        // add listeners to the grid columns
        this.refreshListenersToColumnsForCellComps();
        // if the grid columns change, then refresh the listeners again
        this.addManagedEventListeners({
            gridColumnsChanged: this.refreshListenersToColumnsForCellComps.bind(this),
        });

        this.addDestroyFunc(this.removeGridColumnListeners.bind(this));
    }

    private setupRangeSelectionListeners = () => {
        const onCellSelectionChanged = () => {
            this.getAllCellCtrls().forEach((cellCtrl) => cellCtrl.onCellSelectionChanged());
        };

        const onColumnMovedPinnedVisible = () => {
            this.getAllCellCtrls().forEach((cellCtrl) => cellCtrl.updateRangeBordersIfRangeCount());
        };

        const addCellSelectionListeners = () => {
            this.eventSvc.addEventListener('cellSelectionChanged', onCellSelectionChanged);
            this.eventSvc.addEventListener('columnMoved', onColumnMovedPinnedVisible);
            this.eventSvc.addEventListener('columnPinned', onColumnMovedPinnedVisible);
            this.eventSvc.addEventListener('columnVisible', onColumnMovedPinnedVisible);
        };

        const removeCellSelectionListeners = () => {
            this.eventSvc.removeEventListener('cellSelectionChanged', onCellSelectionChanged);
            this.eventSvc.removeEventListener('columnMoved', onColumnMovedPinnedVisible);
            this.eventSvc.removeEventListener('columnPinned', onColumnMovedPinnedVisible);
            this.eventSvc.removeEventListener('columnVisible', onColumnMovedPinnedVisible);
        };
        this.addDestroyFunc(() => removeCellSelectionListeners());
        this.addManagedPropertyListeners(['enableRangeSelection', 'cellSelection'], () => {
            const isEnabled = _isCellSelectionEnabled(this.gos);
            if (isEnabled) {
                addCellSelectionListeners();
            } else {
                removeCellSelectionListeners();
            }
        });
        const cellSelectionEnabled = _isCellSelectionEnabled(this.gos);
        if (cellSelectionEnabled) {
            addCellSelectionListeners();
        }
    };

    // executes all functions in destroyFuncsForColumnListeners and then clears the list
    private removeGridColumnListeners(): void {
        this.destroyFuncsForColumnListeners.forEach((func) => func());
        this.destroyFuncsForColumnListeners.length = 0;
    }

    // this function adds listeners onto all the grid columns, which are the column that we could have cellComps for.
    // when the grid columns change, we add listeners again. in an ideal design, each CellComp would just register to
    // the column it belongs to on creation, however this was a bottleneck with the number of cells, so do it here
    // once instead.
    private refreshListenersToColumnsForCellComps(): void {
        this.removeGridColumnListeners();

        const cols = this.colModel.getCols();

        cols.forEach((col) => {
            const forEachCellWithThisCol = (callback: (cellCtrl: CellCtrl) => void) => {
                this.getAllCellCtrls().forEach((cellCtrl) => {
                    if (cellCtrl.getColumn() === col) {
                        callback(cellCtrl);
                    }
                });
            };

            const leftChangedListener = () => {
                forEachCellWithThisCol((cellCtrl) => cellCtrl.onLeftChanged());
            };
            const widthChangedListener = () => {
                forEachCellWithThisCol((cellCtrl) => cellCtrl.onWidthChanged());
            };
            const firstRightPinnedChangedListener = () => {
                forEachCellWithThisCol((cellCtrl) => cellCtrl.onFirstRightPinnedChanged());
            };
            const lastLeftPinnedChangedListener = () => {
                forEachCellWithThisCol((cellCtrl) => cellCtrl.onLastLeftPinnedChanged());
            };
            const colDefChangedListener = () => {
                forEachCellWithThisCol((cellCtrl) => cellCtrl.onColDefChanged());
            };

            col.addEventListener('leftChanged', leftChangedListener);
            col.addEventListener('widthChanged', widthChangedListener);
            col.addEventListener('firstRightPinnedChanged', firstRightPinnedChangedListener);
            col.addEventListener('lastLeftPinnedChanged', lastLeftPinnedChangedListener);
            col.addEventListener('colDefChanged', colDefChangedListener);

            this.destroyFuncsForColumnListeners.push(() => {
                col.removeEventListener('leftChanged', leftChangedListener);
                col.removeEventListener('widthChanged', widthChangedListener);
                col.removeEventListener('firstRightPinnedChanged', firstRightPinnedChangedListener);
                col.removeEventListener('lastLeftPinnedChanged', lastLeftPinnedChangedListener);
                col.removeEventListener('colDefChanged', colDefChangedListener);
            });
        });
    }

    private onDomLayoutChanged(): void {
        const printLayout = _isDomLayout(this.gos, 'print');
        const embedFullWidthRows = printLayout || this.gos.get('embedFullWidthRows');

        // if moving towards or away from print layout, means we need to destroy all rows, as rows are not laid
        // out using absolute positioning when doing print layout
        const destroyRows = embedFullWidthRows !== this.embedFullWidthRows || this.printLayout !== printLayout;

        this.printLayout = printLayout;
        this.embedFullWidthRows = embedFullWidthRows;

        if (destroyRows) {
            this.redrawAfterModelUpdate({ domLayoutChanged: true });
        }
    }

    // for row models that have datasources, when we update the datasource, we need to force the rowRenderer
    // to redraw all rows. otherwise the old rows from the old datasource will stay displayed.
    public datasourceChanged(): void {
        this.firstRenderedRow = 0;
        this.lastRenderedRow = -1;
        const rowIndexesToRemove = Object.keys(this.rowCtrlsByRowIndex);
        this.removeRowCtrls(rowIndexesToRemove);
    }

    private onPageLoaded(event: PaginationChangedEvent): void {
        const params: RefreshViewParams = {
            recycleRows: event.keepRenderedRows,
            animate: event.animate,
            newData: event.newData,
            newPage: event.newPage,
            // because this is a model updated event (not pinned rows), we
            // can skip updating the pinned rows. this is needed so that if user
            // is doing transaction updates, the pinned rows are not getting constantly
            // trashed - or editing cells in pinned rows are not refreshed and put into read mode
            onlyBody: true,
        };
        this.redrawAfterModelUpdate(params);
    }

    public getAllCellsForColumn(column: AgColumn): HTMLElement[] {
        const res: HTMLElement[] = [];

        this.getAllRowCtrls().forEach((rowCtrl) => {
            const eCell = rowCtrl.getCellElement(column);
            if (eCell) {
                res.push(eCell);
            }
        });

        return res;
    }

    public refreshFloatingRowComps(): void {
        this.refreshFloatingRows(this.topRowCtrls, 'top');

        this.refreshFloatingRows(this.bottomRowCtrls, 'bottom');
    }

    public getTopRowCtrls(): RowCtrl[] {
        return this.topRowCtrls;
    }

    public getCentreRowCtrls(): RowCtrl[] {
        return this.allRowCtrls;
    }

    public getBottomRowCtrls(): RowCtrl[] {
        return this.bottomRowCtrls;
    }

    /**
     * Determines which row controllers need to be destroyed and re-created vs which ones can
     * be re-used.
     *
     * This is operation is to pinned/floating rows as `this.recycleRows` is to normal/body rows.
     *
     * All `RowCtrl` instances in `rowCtrls` that don't correspond to `RowNode` instances in `rowNodes` are destroyed.
     * All `RowNode` instances in `rowNodes` that don't correspond to `RowCtrl` instances in `rowCtrls` are created.
     * All instances in `rowCtrls` must be in the same order as their corresponding nodes in `rowNodes`.
     *
     * @param rowCtrls The list of existing row controllers
     * @param rowNodes The canonical list of row nodes that should have associated controllers
     */
    private refreshFloatingRows(rowCtrls: RowCtrl[], floating: NonNullable<RowPinnedType>): void {
        const { pinnedRowModel, beans, printLayout } = this;
        const rowCtrlMap = Object.fromEntries(rowCtrls.map((ctrl) => [ctrl.getRowNode().id!, ctrl]));

        pinnedRowModel?.forEachPinnedRow(floating, (node, i) => {
            const rowCtrl = rowCtrls[i];
            const rowCtrlDoesNotExist =
                rowCtrl && pinnedRowModel.getPinnedRowById(rowCtrl.getRowNode().id!, floating) === undefined;

            if (rowCtrlDoesNotExist) {
                // ctrl not in new nodes list, destroy
                rowCtrl.destroyFirstPass();
                rowCtrl.destroySecondPass();
            }

            if (node.id! in rowCtrlMap) {
                // ctrl exists already, re-use it
                rowCtrls[i] = rowCtrlMap[node.id!];
                delete rowCtrlMap[node.id!];
            } else {
                // ctrl doesn't exist, create it
                rowCtrls[i] = new RowCtrl(node, beans, false, false, printLayout);
            }
        });

        const rowNodeCount =
            (floating === 'top' ? pinnedRowModel?.getPinnedTopRowCount() : pinnedRowModel?.getPinnedBottomRowCount()) ??
            0;

        // Truncate array if rowCtrls is longer than rowNodes
        rowCtrls.length = rowNodeCount;
    }

    private onPinnedRowDataChanged(): void {
        // recycling rows in order to ensure cell editing is not cancelled
        const params: RefreshViewParams = {
            recycleRows: true,
        };

        this.redrawAfterModelUpdate(params);
    }

    public redrawRow(rowNode: RowNode, suppressEvent = false) {
        if (rowNode.sticky) {
            this.stickyRowFeature?.refreshStickyNode(rowNode);
        } else if (this.cachedRowCtrls?.has(rowNode)) {
            // delete row from cache if it needs redrawn
            // if it's in the cache no updates need fired, as nothing
            // has been rendered
            this.cachedRowCtrls.removeRow(rowNode);
            return;
        } else {
            const destroyAndRecreateCtrl = (dataStruct: RowCtrl[] | RowCtrlByRowIndex) => {
                const ctrl = dataStruct[rowNode.rowIndex!];
                if (!ctrl) {
                    return;
                }
                if (ctrl.getRowNode() !== rowNode) {
                    // if the node is in the wrong place, then the row model is responsible for triggering a full refresh.
                    return;
                }
                ctrl.destroyFirstPass();
                ctrl.destroySecondPass();
                dataStruct[rowNode.rowIndex!] = this.createRowCon(rowNode, false, false);
            };

            switch (rowNode.rowPinned) {
                case 'top':
                    destroyAndRecreateCtrl(this.topRowCtrls);
                    break;
                case 'bottom':
                    destroyAndRecreateCtrl(this.bottomRowCtrls);
                    break;
                default:
                    destroyAndRecreateCtrl(this.rowCtrlsByRowIndex);
                    this.updateAllRowCtrls();
            }
        }

        if (!suppressEvent) {
            this.dispatchDisplayedRowsChanged(false);
        }
    }

    public redrawRows(rowNodes?: IRowNode[]): void {
        // if no row nodes provided, then refresh everything
        const partialRefresh = rowNodes != null;

        if (partialRefresh) {
            rowNodes?.forEach((node) => this.redrawRow(node as RowNode, true));
            this.dispatchDisplayedRowsChanged(false);
            return;
        }

        this.redrawAfterModelUpdate();
    }

    private getCellToRestoreFocusToAfterRefresh(params?: RefreshViewParams): CellPosition | null {
        const focusedCell = params?.suppressKeepFocus ? null : this.focusSvc.getFocusCellToUseAfterRefresh();

        if (focusedCell == null) {
            return null;
        }

        // if the dom is not actually focused on a cell, then we don't try to refocus. the problem this
        // solves is with editing - if the user is editing, eg focus is on a text field, and not on the
        // cell itself, then the cell can be registered as having focus, however it's the text field that
        // has the focus and not the cell div. therefore, when the refresh is finished, the grid will focus
        // the cell, and not the textfield. that means if the user is in a text field, and the grid refreshes,
        // the focus is lost from the text field. we do not want this.
        const activeElement = _getActiveDomElement(this.gos);
        const cellDomData = _getDomData(this.gos, activeElement, DOM_DATA_KEY_CELL_CTRL);
        const rowDomData = _getDomData(this.gos, activeElement, DOM_DATA_KEY_ROW_CTRL);

        const gridElementFocused = cellDomData || rowDomData;

        return gridElementFocused ? focusedCell : null;
    }

    // gets called from:
    // +) initialisation (in registerGridComp) params = null
    // +) onDomLayoutChanged, params = null
    // +) onPageLoaded, recycleRows, animate, newData, newPage from event, onlyBody=true
    // +) onPinnedRowDataChanged, recycleRows = true
    // +) redrawRows (from Grid API), recycleRows = true/false
    private redrawAfterModelUpdate(params: RefreshViewParams = {}): void {
        this.getLockOnRefresh();

        const focusedCell = this.getCellToRestoreFocusToAfterRefresh(params);

        this.updateContainerHeights();
        this.scrollToTopIfNewData(params);

        // never recycle rows on layout change as rows could change from normal DOM layout
        // back to the grid's row positioning.
        const recycleRows = !params.domLayoutChanged && !!params.recycleRows;
        const animate = params.animate && _isAnimateRows(this.gos);

        // after modelUpdate, row indexes can change, so we clear out the rowsByIndex map,
        // however we can reuse the rows, so we keep them but index by rowNode.id
        const rowsToRecycle = recycleRows ? this.getRowsToRecycle() : null;
        if (!recycleRows) {
            this.removeAllRowComps();
        }

        this.workOutFirstAndLastRowsToRender();

        if (this.stickyRowFeature) {
            this.stickyRowFeature.checkStickyRows();

            // this is a hack, if sticky rows brings in rows from other pages
            // need to update the model height to include them.
            const extraHeight =
                this.stickyRowFeature.getExtraTopHeight() + this.stickyRowFeature.getExtraBottomHeight();
            if (extraHeight) {
                this.updateContainerHeights(extraHeight);
            }
        }

        this.recycleRows(rowsToRecycle, animate);

        this.gridBodyCtrl.updateRowCount();

        if (!params.onlyBody) {
            this.refreshFloatingRowComps();
        }

        this.dispatchDisplayedRowsChanged();

        // if a cell was focused before, ensure focus now.
        if (focusedCell != null) {
            this.restoreFocusedCell(focusedCell);
        }

        this.releaseLockOnRefresh();
    }

    private scrollToTopIfNewData(params: RefreshViewParams): void {
        const scrollToTop = params.newData || params.newPage;
        const suppressScrollToTop = this.gos.get('suppressScrollOnNewData');

        if (scrollToTop && !suppressScrollToTop) {
            this.gridBodyCtrl.getScrollFeature().scrollToTop();
            this.stickyRowFeature?.resetOffsets();
        }
    }

    private updateContainerHeights(additionalHeight = 0): void {
        // when doing print layout, we don't explicitly set height on the containers
        if (this.printLayout) {
            this.rowContainerHeight.setModelHeight(null);
            return;
        }

        let containerHeight = this.pageBounds.getCurrentPageHeight();
        // we need at least 1 pixel for the horizontal scroll to work. so if there are now rows,
        // we still want the scroll to be present, otherwise there would be no way to scroll the header
        // which might be needed us user wants to access columns
        // on the RHS - and if that was where the filter was that cause no rows to be presented, there
        // is no way to remove the filter.
        if (containerHeight === 0) {
            containerHeight = 1;
        }

        this.rowContainerHeight.setModelHeight(containerHeight + additionalHeight);
    }

    private getLockOnRefresh(): void {
        if (this.refreshInProgress) {
            throw new Error(
                'AG Grid: cannot get grid to draw rows when it is in the middle of drawing rows. ' +
                    'Your code probably called a grid API method while the grid was in the render stage. To overcome ' +
                    'this, put the API call into a timeout, e.g. instead of api.redrawRows(), ' +
                    'call setTimeout(function() { api.redrawRows(); }, 0). To see what part of your code ' +
                    'that caused the refresh check this stacktrace.'
            );
        }

        this.refreshInProgress = true;
        this.beans.frameworkOverrides.getLockOnRefresh?.();
    }

    private releaseLockOnRefresh(): void {
        this.refreshInProgress = false;
        this.beans.frameworkOverrides.releaseLockOnRefresh?.();
    }

    public isRefreshInProgress(): boolean {
        return this.refreshInProgress;
    }

    // sets the focus to the provided cell, if the cell is provided. this way, the user can call refresh without
    // worry about the focus been lost. this is important when the user is using keyboard navigation to do edits
    // and the cellEditor is calling 'refresh' to get other cells to update (as other cells might depend on the
    // edited cell).
    private restoreFocusedCell(cellPosition: CellPosition | null): void {
        if (!cellPosition) {
            return;
        }

        this.focusSvc.restoreFocusedCell(cellPosition, () => {
            // we don't wish to dispatch an event as the rowRenderer is not capable of changing the selected cell,
            // so we mock a change event for the full width rows and cells to ensure they update to the newly selected state

            this.onCellFocusChanged(
                this.gos.addGridCommonParams<CellFocusedEvent>({
                    rowIndex: cellPosition.rowIndex,
                    column: cellPosition.column,
                    rowPinned: cellPosition.rowPinned,
                    forceBrowserFocus: true,
                    preventScrollOnBrowserFocus: true,
                    type: 'cellFocused',
                })
            );
        });
    }

    public getAllCellCtrls(): CellCtrl[] {
        const res: CellCtrl[] = [];
        const rowCtrls = this.getAllRowCtrls();
        const rowCtrlsLength = rowCtrls.length;

        for (let i = 0; i < rowCtrlsLength; i++) {
            const cellCtrls = rowCtrls[i].getAllCellCtrls();
            const cellCtrlsLength = cellCtrls.length;

            for (let j = 0; j < cellCtrlsLength; j++) {
                res.push(cellCtrls[j]);
            }
        }

        return res;
    }

    public getAllRowCtrls(): RowCtrl[] {
        const stickyTopRowCtrls = this.getStickyTopRowCtrls();
        const stickyBottomRowCtrls = this.getStickyBottomRowCtrls();
        const res = [
            ...this.topRowCtrls,
            ...this.bottomRowCtrls,
            ...stickyTopRowCtrls,
            ...stickyBottomRowCtrls,
            ...Object.values(this.rowCtrlsByRowIndex),
        ];

        return res;
    }

    public addRenderedRowListener(
        eventName: RenderedRowEvent,
        rowIndex: number,
        callback: IEventListener<RenderedRowEvent>
    ): void {
        const rowComp = this.rowCtrlsByRowIndex[rowIndex];
        if (rowComp) {
            rowComp.addEventListener(eventName, callback);
        }
    }

    public refreshCells(params: RefreshCellsParams = {}): void {
        const refreshCellParams = {
            forceRefresh: params.force,
            newData: false,
            suppressFlash: params.suppressFlash,
        };
        for (const cellCtrl of this.getCellCtrls(params.rowNodes, params.columns as AgColumn[])) {
            cellCtrl.refreshOrDestroyCell(refreshCellParams);
        }

        // refresh the full width rows too
        this.refreshFullWidth(params.rowNodes);
    }

    private refreshFullWidth(rowNodes?: IRowNode[]): void {
        if (!rowNodes) {
            return;
        }

        let cellFocused: CellPosition | null = null;

        if (this.stickyRowFeature) {
            cellFocused = this.getCellToRestoreFocusToAfterRefresh() || null;
        }

        for (const rowCtrl of this.getRowCtrls(rowNodes)) {
            if (!rowCtrl.isFullWidth()) {
                continue;
            }

            const refreshed = rowCtrl.refreshFullWidth();
            if (!refreshed) {
                this.redrawRow(rowCtrl.getRowNode(), true);
            }
        }

        this.dispatchDisplayedRowsChanged(false);

        if (cellFocused) {
            this.restoreFocusedCell(cellFocused);
        }
    }

    /**
     * @param rowNodes if provided, returns the RowCtrls for the provided rowNodes. otherwise returns all RowCtrls.
     */
    public getRowCtrls(rowNodes?: IRowNode[] | null): RowCtrl[] {
        const rowIdsMap = mapRowNodes(rowNodes);
        const allRowCtrls = this.getAllRowCtrls();
        if (!rowNodes || !rowIdsMap) {
            return allRowCtrls;
        }

        return allRowCtrls.filter((rowCtrl) => {
            const rowNode = rowCtrl.getRowNode();
            return isRowInMap(rowNode, rowIdsMap);
        });
    }

    // returns CellCtrl's that match the provided rowNodes and columns. eg if one row node
    // and two columns provided, that identifies 4 cells, so 4 CellCtrl's returned.
    public getCellCtrls(rowNodes?: IRowNode[] | null, columns?: (string | AgColumn)[]): CellCtrl[] {
        let colIdsMap: any;
        if (_exists(columns)) {
            colIdsMap = {};
            columns.forEach((colKey: string | AgColumn) => {
                const column: AgColumn | null = this.colModel.getCol(colKey);
                if (_exists(column)) {
                    colIdsMap[column.getId()] = true;
                }
            });
        }

        const res: CellCtrl[] = [];
        this.getRowCtrls(rowNodes).forEach((rowCtrl) => {
            rowCtrl.getAllCellCtrls().forEach((cellCtrl) => {
                const colId: string = cellCtrl.getColumn().getId();
                const excludeColFromRefresh = colIdsMap && !colIdsMap[colId];

                if (excludeColFromRefresh) {
                    return;
                }

                res.push(cellCtrl);
            });
        });
        return res;
    }

    public override destroy(): void {
        this.removeAllRowComps(true);
        super.destroy();
    }

    private removeAllRowComps(suppressAnimation: boolean = false): void {
        const rowIndexesToRemove = Object.keys(this.rowCtrlsByRowIndex);
        this.removeRowCtrls(rowIndexesToRemove, suppressAnimation);

        if (this.stickyRowFeature) {
            this.stickyRowFeature.destroyStickyCtrls();
        }
    }

    private getRowsToRecycle(): RowCtrlByRowNodeIdMap {
        // remove all stub nodes, they can't be reused, as no rowNode id
        const stubNodeIndexes: string[] = [];
        for (const [index, rowCtrl] of Object.entries(this.rowCtrlsByRowIndex)) {
            const stubNode = rowCtrl.getRowNode().id == null;
            if (stubNode) {
                stubNodeIndexes.push(index);
            }
        }
        this.removeRowCtrls(stubNodeIndexes);

        // then clear out rowCompsByIndex, but before that take a copy, but index by id, not rowIndex
        const ctrlsByIdMap: RowCtrlByRowNodeIdMap = {};
        for (const rowCtrl of Object.values(this.rowCtrlsByRowIndex)) {
            const rowNode = rowCtrl.getRowNode();
            ctrlsByIdMap[rowNode.id!] = rowCtrl;
        }
        this.rowCtrlsByRowIndex = {};

        return ctrlsByIdMap;
    }

    // takes array of row indexes
    private removeRowCtrls(rowsToRemove: any[], suppressAnimation: boolean = false) {
        // if no fromIndex then set to -1, which will refresh everything
        // let realFromIndex = -1;

        rowsToRemove.forEach((indexToRemove) => {
            const rowCtrl = this.rowCtrlsByRowIndex[indexToRemove];
            if (rowCtrl) {
                rowCtrl.destroyFirstPass(suppressAnimation);
                rowCtrl.destroySecondPass();
            }
            delete this.rowCtrlsByRowIndex[indexToRemove];
        });
    }

    private onBodyScroll(e: BodyScrollEvent) {
        if (e.direction !== 'vertical') {
            return;
        }
        this.redraw({ afterScroll: true });
    }

    // gets called when rows don't change, but viewport does, so after:
    // 1) height of grid body changes, ie number of displayed rows has changed
    // 2) grid scrolled to new position
    // 3) ensure index visible (which is a scroll)
    public redraw(params: { afterScroll?: boolean } = {}) {
        const { afterScroll } = params;
        let cellFocused: CellPosition | undefined;

        // only try to refocus cells shifting in and out of sticky container
        // if the browser supports focus ({ preventScroll })
        if (this.stickyRowFeature) {
            cellFocused = this.getCellToRestoreFocusToAfterRefresh() || undefined;
        }

        const oldFirstRow = this.firstRenderedRow;
        const oldLastRow = this.lastRenderedRow;
        this.workOutFirstAndLastRowsToRender();

        let hasStickyRowChanges = false;

        if (this.stickyRowFeature) {
            hasStickyRowChanges = this.stickyRowFeature.checkStickyRows();

            // this is a hack, if sticky rows brings in rows from other pages
            // need to update the model height to include them.
            const extraHeight =
                this.stickyRowFeature.getExtraTopHeight() + this.stickyRowFeature.getExtraBottomHeight();
            if (extraHeight) {
                this.updateContainerHeights(extraHeight);
            }
        }

        const rangeChanged = this.firstRenderedRow !== oldFirstRow || this.lastRenderedRow !== oldLastRow;

        if (afterScroll && !hasStickyRowChanges && !rangeChanged) {
            return;
        }

        this.getLockOnRefresh();
        this.recycleRows(null, false, afterScroll);
        this.releaseLockOnRefresh();
        // AfterScroll results in flushSync in React but we need to disable flushSync for sticky row group changes to avoid flashing
        this.dispatchDisplayedRowsChanged(afterScroll && !hasStickyRowChanges);

        if (cellFocused != null) {
            const newFocusedCell = this.getCellToRestoreFocusToAfterRefresh();

            if (cellFocused != null && newFocusedCell == null) {
                this.animationFrameSvc?.flushAllFrames();
                this.restoreFocusedCell(cellFocused);
            }
        }
    }

    private removeRowCompsNotToDraw(indexesToDraw: number[], suppressAnimation: boolean): void {
        // for speedy lookup, dump into map
        const indexesToDrawMap: { [index: string]: boolean } = {};
        indexesToDraw.forEach((index) => (indexesToDrawMap[index] = true));

        const existingIndexes = Object.keys(this.rowCtrlsByRowIndex);
        const indexesNotToDraw = existingIndexes.filter((index) => !indexesToDrawMap[index]);

        this.removeRowCtrls(indexesNotToDraw, suppressAnimation);
    }

    private calculateIndexesToDraw(rowsToRecycle?: { [key: string]: RowCtrl } | null): number[] {
        // all in all indexes in the viewport
        const indexesToDraw: number[] = [];
        for (let i = this.firstRenderedRow; i <= this.lastRenderedRow; i++) {
            indexesToDraw.push(i);
        }

        const checkRowToDraw = (rowComp: RowCtrl) => {
            const index = rowComp.getRowNode().rowIndex;
            if (index == null) {
                return;
            }
            if (index < this.firstRenderedRow || index > this.lastRenderedRow) {
                if (this.doNotUnVirtualiseRow(rowComp)) {
                    indexesToDraw.push(index);
                }
            }
        };

        // if we are redrawing due to scrolling change, then old rows are in this.rowCompsByIndex
        for (const rowCtrl of Object.values(this.rowCtrlsByRowIndex)) {
            checkRowToDraw(rowCtrl);
        }

        // if we are redrawing due to model update, then old rows are in rowsToRecycle
        if (rowsToRecycle) {
            for (const rowCtrl of Object.values(rowsToRecycle)) {
                checkRowToDraw(rowCtrl);
            }
        }

        indexesToDraw.sort((a, b) => a - b);

        const ret: number[] = [];

        for (let i = 0; i < indexesToDraw.length; i++) {
            const currRow = indexesToDraw[i];
            const rowNode = this.rowModel.getRow(currRow);
            if (rowNode && !rowNode.sticky) {
                ret.push(currRow);
            }
        }

        return ret;
    }

    private recycleRows(rowsToRecycle?: { [key: string]: RowCtrl } | null, animate = false, afterScroll = false) {
        // the row can already exist and be in the following:
        // rowsToRecycle -> if model change, then the index may be different, however row may
        //                         exist here from previous time (mapped by id).
        // this.rowCompsByIndex -> if just a scroll, then this will contain what is currently in the viewport

        // this is all the indexes we want, including those that already exist, so this method
        // will end up going through each index and drawing only if the row doesn't already exist
        const indexesToDraw = this.calculateIndexesToDraw(rowsToRecycle);

        // never animate when doing print layout - as we want to get things ready to print as quickly as possible,
        // otherwise we risk the printer printing a row that's half faded (half way through fading in)
        // Don't animate rows that have been added or removed as part of scrolling
        if (this.printLayout || afterScroll) {
            animate = false;
        }

        this.removeRowCompsNotToDraw(indexesToDraw, !animate);

        // add in new rows
        const rowCtrls: RowCtrl[] = [];

        indexesToDraw.forEach((rowIndex) => {
            const rowCtrl = this.createOrUpdateRowCtrl(rowIndex, rowsToRecycle, animate, afterScroll);
            if (_exists(rowCtrl)) {
                rowCtrls.push(rowCtrl);
            }
        });

        if (rowsToRecycle) {
            const useAnimationFrame =
                afterScroll &&
                !this.gos.get('suppressAnimationFrame') &&
                !this.printLayout &&
                this.beans.animationFrameSvc;
            if (useAnimationFrame) {
                this.beans.animationFrameSvc!.addDestroyTask(() => {
                    this.destroyRowCtrls(rowsToRecycle, animate);
                    this.updateAllRowCtrls();
                    this.dispatchDisplayedRowsChanged();
                });
            } else {
                this.destroyRowCtrls(rowsToRecycle, animate);
            }
        }

        this.updateAllRowCtrls();
    }

    private dispatchDisplayedRowsChanged(afterScroll: boolean = false): void {
        this.eventSvc.dispatchEvent({
            type: 'displayedRowsChanged',
            afterScroll,
        });
    }

    private onDisplayedColumnsChanged(): void {
        const pinningLeft = this.visibleCols.isPinningLeft();
        const pinningRight = this.visibleCols.isPinningRight();
        const atLeastOneChanged = this.pinningLeft !== pinningLeft || pinningRight !== this.pinningRight;

        if (atLeastOneChanged) {
            this.pinningLeft = pinningLeft;
            this.pinningRight = pinningRight;

            if (this.embedFullWidthRows) {
                this.redrawFullWidthEmbeddedRows();
            }
        }
    }

    // when embedding, what gets showed in each section depends on what is pinned. eg if embedding group expand / collapse,
    // then it should go into the pinned left area if pinning left, or the center area if not pinning.
    private redrawFullWidthEmbeddedRows(): void {
        // if either of the pinned panels has shown / hidden, then need to redraw the fullWidth bits when
        // embedded, as what appears in each section depends on whether we are pinned or not
        const rowsToRemove: string[] = [];

        this.getFullWidthRowCtrls().forEach((fullWidthCtrl) => {
            const rowIndex = fullWidthCtrl.getRowNode().rowIndex;
            rowsToRemove.push(rowIndex!.toString());
        });

        this.refreshFloatingRowComps();
        this.removeRowCtrls(rowsToRemove);
        this.redraw({ afterScroll: true });
    }

    public getFullWidthRowCtrls(rowNodes?: IRowNode[]): RowCtrl[] {
        const rowNodesMap = mapRowNodes(rowNodes);

        return this.getAllRowCtrls().filter((rowCtrl: RowCtrl) => {
            // include just full width
            if (!rowCtrl.isFullWidth()) {
                return false;
            }

            // if Row Nodes provided, we exclude where Row Node is missing
            const rowNode = rowCtrl.getRowNode();
            if (rowNodesMap != null && !isRowInMap(rowNode, rowNodesMap)) {
                return false;
            }

            return true;
        });
    }

    private createOrUpdateRowCtrl(
        rowIndex: number,
        rowsToRecycle: { [key: string]: RowCtrl | null } | null | undefined,
        animate: boolean,
        afterScroll: boolean
    ): RowCtrl | null | undefined {
        let rowNode: RowNode | undefined;
        let rowCtrl: RowCtrl | null = this.rowCtrlsByRowIndex[rowIndex];

        // if no row comp, see if we can get it from the previous rowComps
        if (!rowCtrl) {
            rowNode = this.rowModel.getRow(rowIndex);
            if (_exists(rowNode) && _exists(rowsToRecycle) && rowsToRecycle[rowNode.id!] && rowNode.alreadyRendered) {
                rowCtrl = rowsToRecycle[rowNode.id!];
                rowsToRecycle[rowNode.id!] = null;
            }
        }

        const creatingNewRowCtrl = !rowCtrl;

        if (creatingNewRowCtrl) {
            // create a new one
            if (!rowNode) {
                rowNode = this.rowModel.getRow(rowIndex);
            }

            if (_exists(rowNode)) {
                rowCtrl = this.createRowCon(rowNode, animate, afterScroll);
            } else {
                // this should never happen - if somehow we are trying to create
                // a row for a rowNode that does not exist.
                return;
            }
        }

        if (rowNode) {
            // set node as 'alreadyRendered' to ensure we only recycle rowComps that have been rendered, this ensures
            // we don't reuse rowComps that have been removed and then re-added in the same batch transaction.
            rowNode.alreadyRendered = true;
        }

        this.rowCtrlsByRowIndex[rowIndex] = rowCtrl!;

        return rowCtrl;
    }

    private destroyRowCtrls(rowCtrlsMap: RowCtrlIdMap | null | undefined, animate: boolean): void {
        const executeInAWhileFuncs: (() => void)[] = [];
        if (rowCtrlsMap) {
            for (const rowCtrl of Object.values(rowCtrlsMap)) {
                // if row was used, then it's null
                if (!rowCtrl) {
                    continue;
                }

                if (this.cachedRowCtrls && rowCtrl.isCacheable()) {
                    this.cachedRowCtrls.addRow(rowCtrl);
                    continue;
                }

                rowCtrl.destroyFirstPass(!animate);
                if (animate) {
                    const instanceId = rowCtrl.instanceId;
                    this.zombieRowCtrls[instanceId] = rowCtrl;
                    executeInAWhileFuncs.push(() => {
                        rowCtrl.destroySecondPass();
                        delete this.zombieRowCtrls[instanceId];
                    });
                } else {
                    rowCtrl.destroySecondPass();
                }
            }
        }
        if (animate) {
            // this ensures we fire displayedRowsChanged AFTER all the 'executeInAWhileFuncs' get
            // executed, as we added it to the end of the list.
            executeInAWhileFuncs.push(() => {
                this.updateAllRowCtrls();
                this.dispatchDisplayedRowsChanged();
            });
            window.setTimeout(() => executeInAWhileFuncs.forEach((func) => func()), ROW_ANIMATION_TIMEOUT);
        }
    }

    private getRowBuffer(): number {
        return this.gos.get('rowBuffer');
    }

    private getRowBufferInPixels() {
        const rowsToBuffer = this.getRowBuffer();
        const defaultRowHeight = _getRowHeightAsNumber(this.gos);

        return rowsToBuffer * defaultRowHeight;
    }

    private workOutFirstAndLastRowsToRender(): void {
        this.rowContainerHeight.updateOffset();
        let newFirst: number;
        let newLast: number;

        if (!this.rowModel.isRowsToRender()) {
            newFirst = 0;
            newLast = -1; // setting to -1 means nothing in range
        } else if (this.printLayout) {
            this.environment.refreshRowHeightVariable();
            newFirst = this.pageBounds.getFirstRow();
            newLast = this.pageBounds.getLastRow();
        } else {
            const bufferPixels = this.getRowBufferInPixels();
            const gridBodyCtrl = this.ctrlsSvc.getGridBodyCtrl();
            const suppressRowVirtualisation = this.gos.get('suppressRowVirtualisation');

            let rowHeightsChanged = false;
            let firstPixel: number;
            let lastPixel: number;
            do {
                const paginationOffset = this.pageBounds.getPixelOffset();
                const { pageFirstPixel, pageLastPixel } = this.pageBounds.getCurrentPagePixelRange();
                const divStretchOffset = this.rowContainerHeight.getDivStretchOffset();

                const bodyVRange = gridBodyCtrl.getScrollFeature().getVScrollPosition();
                const bodyTopPixel = bodyVRange.top;
                const bodyBottomPixel = bodyVRange.bottom;

                if (suppressRowVirtualisation) {
                    firstPixel = pageFirstPixel + divStretchOffset;
                    lastPixel = pageLastPixel + divStretchOffset;
                } else {
                    firstPixel =
                        Math.max(bodyTopPixel + paginationOffset - bufferPixels, pageFirstPixel) + divStretchOffset;
                    lastPixel =
                        Math.min(bodyBottomPixel + paginationOffset + bufferPixels, pageLastPixel) + divStretchOffset;
                }

                this.firstVisibleVPixel = Math.max(bodyTopPixel + paginationOffset, pageFirstPixel) + divStretchOffset;
                this.lastVisibleVPixel = Math.min(bodyBottomPixel + paginationOffset, pageLastPixel) + divStretchOffset;

                // if the rows we are about to display get their heights changed, then that upsets the calcs from above.
                rowHeightsChanged = this.ensureAllRowsInRangeHaveHeightsCalculated(firstPixel, lastPixel);
            } while (rowHeightsChanged);

            let firstRowIndex = this.rowModel.getRowIndexAtPixel(firstPixel);
            let lastRowIndex = this.rowModel.getRowIndexAtPixel(lastPixel);

            const pageFirstRow = this.pageBounds.getFirstRow();
            const pageLastRow = this.pageBounds.getLastRow();

            // adjust, in case buffer extended actual size
            if (firstRowIndex < pageFirstRow) {
                firstRowIndex = pageFirstRow;
            }

            if (lastRowIndex > pageLastRow) {
                lastRowIndex = pageLastRow;
            }

            newFirst = firstRowIndex;
            newLast = lastRowIndex;
        }

        // sometimes user doesn't set CSS right and ends up with grid with no height and grid ends up
        // trying to render all the rows, eg 10,000+ rows. this will kill the browser. so instead of
        // killing the browser, we limit the number of rows. just in case some use case we didn't think
        // of, we also have a property to not do this operation.
        const rowLayoutNormal = _isDomLayout(this.gos, 'normal');
        const suppressRowCountRestriction = this.gos.get('suppressMaxRenderedRowRestriction');
        const rowBufferMaxSize = Math.max(this.getRowBuffer(), 500);

        if (rowLayoutNormal && !suppressRowCountRestriction) {
            if (newLast - newFirst > rowBufferMaxSize) {
                newLast = newFirst + rowBufferMaxSize;
            }
        }

        const firstDiffers = newFirst !== this.firstRenderedRow;
        const lastDiffers = newLast !== this.lastRenderedRow;

        if (firstDiffers || lastDiffers) {
            this.firstRenderedRow = newFirst;
            this.lastRenderedRow = newLast;

            this.eventSvc.dispatchEvent({
                type: 'viewportChanged',
                firstRow: newFirst,
                lastRow: newLast,
            });
        }
    }

    /**
     * This event will only be fired once, and is queued until after the browser next renders.
     * This allows us to fire an event during the start of the render cycle, when we first see data being rendered
     * but not execute the event until all of the data has finished being rendered to the dom.
     */
    public dispatchFirstDataRenderedEvent() {
        if (this.dataFirstRenderedFired) {
            return;
        }
        this.dataFirstRenderedFired = true;

        // See AG-7018
        window.requestAnimationFrame(() => {
            this.beans.eventSvc.dispatchEvent({
                type: 'firstDataRendered',
                firstRow: this.firstRenderedRow,
                lastRow: this.lastRenderedRow,
            });
        });
    }

    private ensureAllRowsInRangeHaveHeightsCalculated(topPixel: number, bottomPixel: number): boolean {
        const pinnedRowHeightsChanged = this.pinnedRowModel?.ensureRowHeightsValid();

        // ensure sticky rows heights are all updated
        const stickyHeightsChanged = this.stickyRowFeature?.ensureRowHeightsValid();
        // ensureRowHeightsVisible only works with CSRM, as it's the only row model that allows lazy row height calcs.
        // all the other row models just hard code so the method just returns back false
        const rowModelHeightsChanged = this.rowModel.ensureRowHeightsValid(
            topPixel,
            bottomPixel,
            this.pageBounds.getFirstRow(),
            this.pageBounds.getLastRow()
        );
        if (rowModelHeightsChanged || stickyHeightsChanged) {
            this.eventSvc.dispatchEvent({
                type: 'recalculateRowBounds',
            });
        }

        if (stickyHeightsChanged || rowModelHeightsChanged || pinnedRowHeightsChanged) {
            this.updateContainerHeights();
            return true;
        }
        return false;
    }

    public getFirstVisibleVerticalPixel(): number {
        return this.firstVisibleVPixel;
    }

    public getLastVisibleVerticalPixel(): number {
        return this.lastVisibleVPixel;
    }

    public getFirstVirtualRenderedRow() {
        return this.firstRenderedRow;
    }

    public getLastVirtualRenderedRow() {
        return this.lastRenderedRow;
    }

    // check that none of the rows to remove are editing or focused as:
    // a) if editing, we want to keep them, otherwise the user will loose the context of the edit,
    //    eg user starts editing, enters some text, then scrolls down and then up, next time row rendered
    //    the edit is reset - so we want to keep it rendered.
    // b) if focused, we want ot keep keyboard focus, so if user ctrl+c, it goes to clipboard,
    //    otherwise the user can range select and drag (with focus cell going out of the viewport)
    //    and then ctrl+c, nothing will happen if cell is removed from dom.
    // c) if detail record of master detail, as users complained that the context of detail rows
    //    was getting lost when detail row out of view. eg user expands to show detail row,
    //    then manipulates the detail panel (eg sorts the detail grid), then context is lost
    //    after detail panel is scrolled out of / into view.
    private doNotUnVirtualiseRow(rowComp: RowCtrl): boolean {
        const REMOVE_ROW: boolean = false;
        const KEEP_ROW: boolean = true;
        const rowNode = rowComp.getRowNode();

        const rowHasFocus = this.focusSvc.isRowNodeFocused(rowNode);
        const rowIsEditing = rowComp.isEditing();
        const rowIsDetail = rowNode.detail;

        const mightWantToKeepRow = rowHasFocus || rowIsEditing || rowIsDetail;

        // if we deffo don't want to keep it,
        if (!mightWantToKeepRow) {
            return REMOVE_ROW;
        }

        // editing row, only remove if it is no longer rendered, eg filtered out or new data set.
        // the reason we want to keep is if user is scrolling up and down, we don't want to loose
        // the context of the editing in process.
        const rowNodePresent = this.isRowPresent(rowNode);
        return rowNodePresent ? KEEP_ROW : REMOVE_ROW;
    }

    private isRowPresent(rowNode: RowNode): boolean {
        if (!this.rowModel.isRowPresent(rowNode)) {
            return false;
        }
        return this.pagination ? this.pagination.isRowPresent(rowNode) : true;
    }

    private createRowCon(rowNode: RowNode, animate: boolean, afterScroll: boolean): RowCtrl {
        const rowCtrlFromCache = this.cachedRowCtrls ? this.cachedRowCtrls.getRow(rowNode) : null;
        if (rowCtrlFromCache) {
            return rowCtrlFromCache;
        }

        // we don't use animations frames for printing, so the user can put the grid into print mode
        // and immediately print - otherwise the user would have to wait for the rows to draw in the background
        // (via the animation frames) which is awkward to do from code.

        // we only do the animation frames after scrolling, as this is where we want the smooth user experience.
        // having animation frames for other times makes the grid look 'jumpy'.

        const suppressAnimationFrame = this.gos.get('suppressAnimationFrame');
        const useAnimationFrameForCreate =
            afterScroll && !suppressAnimationFrame && !this.printLayout && !!this.beans.animationFrameSvc;

        const res = new RowCtrl(rowNode, this.beans, animate, useAnimationFrameForCreate, this.printLayout);

        return res;
    }

    public getRenderedNodes() {
        const renderedRows = this.rowCtrlsByRowIndex;
        return Object.values(renderedRows).map((rowCtrl) => rowCtrl.getRowNode());
    }

    public getRowByPosition(rowPosition: RowPosition): RowCtrl | null {
        let rowCtrl: RowCtrl | null;
        const { rowIndex } = rowPosition;
        switch (rowPosition.rowPinned) {
            case 'top':
                rowCtrl = this.topRowCtrls[rowIndex];
                break;
            case 'bottom':
                rowCtrl = this.bottomRowCtrls[rowIndex];
                break;
            default:
                rowCtrl = this.rowCtrlsByRowIndex[rowIndex];
                if (!rowCtrl) {
                    rowCtrl =
                        this.getStickyTopRowCtrls().find((ctrl) => ctrl.getRowNode().rowIndex === rowIndex) || null;

                    if (!rowCtrl) {
                        rowCtrl =
                            this.getStickyBottomRowCtrls().find((ctrl) => ctrl.getRowNode().rowIndex === rowIndex) ||
                            null;
                    }
                }
                break;
        }

        return rowCtrl;
    }

    // returns true if any row between startIndex and endIndex is rendered. used by
    // SSRM or IRM, as they don't want to purge visible blocks from cache.
    public isRangeInRenderedViewport(startIndex: number, endIndex: number): boolean {
        // parent closed means the parent node is not expanded, thus these blocks are not visible
        const parentClosed = startIndex == null || endIndex == null;
        if (parentClosed) {
            return false;
        }

        const blockAfterViewport = startIndex > this.lastRenderedRow;
        const blockBeforeViewport = endIndex < this.firstRenderedRow;
        const blockInsideViewport = !blockBeforeViewport && !blockAfterViewport;

        return blockInsideViewport;
    }
}

class RowCtrlCache {
    // map for fast access
    private entriesMap: RowCtrlByRowNodeIdMap = {};

    // list for keeping order
    private entriesList: RowCtrl[] = [];

    private readonly maxCount: number;

    constructor(maxCount: number) {
        this.maxCount = maxCount;
    }

    public addRow(rowCtrl: RowCtrl): void {
        this.entriesMap[rowCtrl.getRowNode().id!] = rowCtrl;
        this.entriesList.push(rowCtrl);
        rowCtrl.setCached(true);

        if (this.entriesList.length > this.maxCount) {
            const rowCtrlToDestroy = this.entriesList[0];
            rowCtrlToDestroy.destroyFirstPass();
            rowCtrlToDestroy.destroySecondPass();
            this.removeFromCache(rowCtrlToDestroy);
        }
    }

    public getRow(rowNode: RowNode): RowCtrl | null {
        if (rowNode == null || rowNode.id == null) {
            return null;
        }

        const res = this.entriesMap[rowNode.id];

        if (!res) {
            return null;
        }

        this.removeFromCache(res);
        res.setCached(false);

        // this can happen if user reloads data, and a new RowNode is reusing
        // the same ID as the old one
        const rowNodeMismatch = res.getRowNode() != rowNode;

        return rowNodeMismatch ? null : res;
    }

    public has(rowNode: RowNode): boolean {
        return this.entriesMap[rowNode.id!] != null;
    }

    public removeRow(rowNode: RowNode): void {
        const rowNodeId = rowNode.id!;
        const ctrl = this.entriesMap[rowNodeId];
        delete this.entriesMap[rowNodeId];
        _removeFromArray(this.entriesList, ctrl);
    }

    public removeFromCache(rowCtrl: RowCtrl): void {
        const rowNodeId = rowCtrl.getRowNode().id!;
        delete this.entriesMap[rowNodeId];
        _removeFromArray(this.entriesList, rowCtrl);
    }

    public getEntries(): RowCtrl[] {
        return this.entriesList;
    }
}

export interface RefreshViewParams {
    recycleRows?: boolean;
    animate?: boolean;
    suppressKeepFocus?: boolean;
    onlyBody?: boolean;
    // when new data, grid scrolls back to top
    newData?: boolean;
    newPage?: boolean;
    domLayoutChanged?: boolean;
}

export function mapRowNodes(
    rowNodes?: IRowNode[] | null
): { top: RowNodeMap; bottom: RowNodeMap; normal: RowNodeMap } | undefined {
    if (!rowNodes) {
        return;
    }

    const res: { top: RowNodeMap; bottom: RowNodeMap; normal: RowNodeMap } = {
        top: {},
        bottom: {},
        normal: {},
    };

    rowNodes.forEach((rowNode) => {
        const id = rowNode.id!;
        switch (rowNode.rowPinned) {
            case 'top':
                res.top[id] = rowNode;
                break;
            case 'bottom':
                res.bottom[id] = rowNode;
                break;
            default:
                res.normal[id] = rowNode;
                break;
        }
    });

    return res;
}

export function isRowInMap(
    rowNode: RowNode,
    rowIdsMap: { top: RowNodeMap; bottom: RowNodeMap; normal: RowNodeMap }
): boolean {
    // skip this row if it is missing from the provided list
    const id = rowNode.id!;
    const floating = rowNode.rowPinned;

    switch (floating) {
        case 'top':
            return rowIdsMap.top[id] != null;
        case 'bottom':
            return rowIdsMap.bottom[id] != null;
        default:
            return rowIdsMap.normal[id] != null;
    }
}
