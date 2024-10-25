import { setupCompBean } from '../../components/emptyBean';
import {
    _getFullWidthCellRendererDetails,
    _getFullWidthDetailCellRendererDetails,
    _getFullWidthGroupCellRendererDetails,
    _getFullWidthLoadingCellRendererDetails,
} from '../../components/framework/userCompUtils';
import { BeanStub } from '../../context/beanStub';
import type { BeanCollection } from '../../context/context';
import type { AgColumn } from '../../entities/agColumn';
import type { RowStyle } from '../../entities/gridOptions';
import type { RowNode } from '../../entities/rowNode';
import type { AgEventType } from '../../eventTypes';
import type { CellFocusedEvent, RowEvent, VirtualRowRemovedEvent } from '../../events';
import type { RowContainerType } from '../../gridBodyComp/rowContainer/rowContainerCtrl';
import {
    _getActiveDomElement,
    _getRowHeightForNode,
    _isAnimateRows,
    _isDomLayout,
    _isGetRowHeightFunction,
    _isGroupUseEntireRow,
    _isRowSelection,
    _setDomData,
} from '../../gridOptionsUtils';
import type { BrandedType } from '../../interfaces/brandedType';
import type { ProcessRowParams, RenderedRowEvent } from '../../interfaces/iCallbackParams';
import type { CellPosition } from '../../interfaces/iCellPosition';
import type { ColumnInstanceId, ColumnPinnedType } from '../../interfaces/iColumn';
import type { WithoutGridCommon } from '../../interfaces/iCommon';
import type { IEventListener } from '../../interfaces/iEventEmitter';
import type { DataChangedEvent, IRowNode } from '../../interfaces/iRowNode';
import type { RowPosition } from '../../interfaces/iRowPosition';
import type { UserCompDetails } from '../../interfaces/iUserCompDetails';
import { calculateRowLevel } from '../../styling/rowStyleService';
import type { TooltipFeature } from '../../tooltip/tooltipFeature';
import { _setAriaExpanded, _setAriaRowIndex } from '../../utils/aria';
import { _addOrRemoveAttribute, _isElementChildOfClass, _isFocusableFormField, _isVisible } from '../../utils/dom';
import { _isStopPropagationForAgGrid } from '../../utils/event';
import { _executeNextVMTurn } from '../../utils/function';
import { _exists, _makeNull } from '../../utils/generic';
import { _escapeString } from '../../utils/string';
import type { Component } from '../../widgets/component';
import { CellCtrl } from '../cell/cellCtrl';
import type { ICellRenderer, ICellRendererParams } from '../cellRenderers/iCellRenderer';

type RowType = 'Normal' | 'FullWidth' | 'FullWidthLoading' | 'FullWidthGroup' | 'FullWidthDetail';

let instanceIdSequence = 0;
export type RowCtrlInstanceId = BrandedType<string, 'RowCtrlInstanceId'>;

export interface IRowComp {
    setDomOrder(domOrder: boolean): void;
    addOrRemoveCssClass(cssClassName: string, on: boolean): void;
    setCellCtrls(cellCtrls: CellCtrl[], useFlushSync: boolean): void;
    showFullWidth(compDetails: UserCompDetails): void;
    getFullWidthCellRenderer(): ICellRenderer | null | undefined;
    setTop(top: string): void;
    setTransform(transform: string): void;
    setRowIndex(rowIndex: string): void;
    setRowId(rowId: string): void;
    setRowBusinessKey(businessKey: string): void;
    setUserStyles(styles: RowStyle | undefined): void;
    refreshFullWidth(getUpdatedParams: () => ICellRendererParams): boolean;
}

export interface RowGui {
    rowComp: IRowComp;
    element: HTMLElement;
    containerType: RowContainerType;
    compBean: BeanStub;
}

interface CellCtrlListAndMap {
    list: CellCtrl[];
    map: { [key: ColumnInstanceId]: CellCtrl };
}

export const DOM_DATA_KEY_ROW_CTRL = 'renderedRow';

export type RowCtrlEvent = RenderedRowEvent;
export class RowCtrl extends BeanStub<RowCtrlEvent> {
    public readonly instanceId: RowCtrlInstanceId;

    private tooltipFeature: TooltipFeature | undefined;

    private rowType: RowType;

    private leftGui: RowGui | undefined;
    private centerGui: RowGui | undefined;
    private rightGui: RowGui | undefined;
    private fullWidthGui: RowGui | undefined;

    private allRowGuis: RowGui[] = [];

    private firstRowOnPage: boolean;
    private lastRowOnPage: boolean;

    private active = true;

    private stoppingRowEdit: boolean;
    private editingRow: boolean;
    private rowFocused: boolean;

    private centerCellCtrls: CellCtrlListAndMap = { list: [], map: {} };
    private leftCellCtrls: CellCtrlListAndMap = { list: [], map: {} };
    private rightCellCtrls: CellCtrlListAndMap = { list: [], map: {} };

    private slideInAnimation: { [key in RowContainerType]: boolean } = {
        left: false,
        center: false,
        right: false,
        fullWidth: false,
    };

    private fadeInAnimation: { [key in RowContainerType]: boolean } = {
        left: false,
        center: false,
        right: false,
        fullWidth: false,
    };

    private rowDragComps: Component[] = [];

    private paginationPage: number;

    private lastMouseDownOnDragger = false;

    private rowLevel: number;
    private rowStyles: RowStyle;
    private readonly emptyStyle: RowStyle = {};
    private readonly suppressRowTransform: boolean;

    private updateColumnListsPending = false;

    private rowId: string | null = null;
    private businessKeySanitised: string | null = null;
    private businessKeyForNodeFunc: ((node: IRowNode<any>) => string) | undefined;

    constructor(
        private readonly rowNode: RowNode,
        beans: BeanCollection,
        animateIn: boolean,
        private readonly useAnimationFrameForCreate: boolean,
        private readonly printLayout: boolean
    ) {
        super();
        this.beans = beans;
        this.gos = beans.gos;
        this.paginationPage = beans.pagination?.getCurrentPage() ?? 0;
        this.suppressRowTransform = this.gos.get('suppressRowTransform');

        this.instanceId = (rowNode.id + '-' + instanceIdSequence++) as RowCtrlInstanceId;
        this.rowId = _escapeString(rowNode.id);

        this.initRowBusinessKey();

        this.rowFocused = beans.focusSvc.isRowFocused(this.rowNode.rowIndex!, this.rowNode.rowPinned);
        this.rowLevel = calculateRowLevel(this.rowNode);

        this.setRowType();
        this.setAnimateFlags(animateIn);
        this.rowStyles = this.processStylesFromGridOptions();

        this.addListeners();
    }

    private initRowBusinessKey(): void {
        this.businessKeyForNodeFunc = this.gos.get('getBusinessKeyForNode');
        this.updateRowBusinessKey();
    }

    private updateRowBusinessKey(): void {
        if (typeof this.businessKeyForNodeFunc !== 'function') {
            return;
        }
        const businessKey = this.businessKeyForNodeFunc(this.rowNode);
        this.businessKeySanitised = _escapeString(businessKey!);
    }

    public getRowId() {
        return this.rowId;
    }
    public getRowStyles() {
        return this.rowStyles;
    }

    private isSticky(): boolean {
        return this.rowNode.sticky;
    }

    private updateGui(containerType: RowContainerType, gui: RowGui | undefined) {
        if (containerType === 'left') {
            this.leftGui = gui;
        } else if (containerType === 'right') {
            this.rightGui = gui;
        } else if (containerType === 'fullWidth') {
            this.fullWidthGui = gui;
        } else {
            this.centerGui = gui;
        }
    }

    public setComp(
        rowComp: IRowComp,
        element: HTMLElement,
        containerType: RowContainerType,
        compBean: BeanStub<any> | undefined
    ): void {
        compBean = setupCompBean(this, this.beans.context, compBean);

        const gui: RowGui = { rowComp, element, containerType, compBean };
        this.allRowGuis.push(gui);
        this.updateGui(containerType, gui);

        this.initialiseRowComp(gui);

        // pinned rows render before the main grid body in the SSRM, only fire the event after the main body has rendered.
        if (this.rowType !== 'FullWidthLoading' && !this.rowNode.rowPinned) {
            // this is fired within setComp as we know that the component renderer is now trying to render.
            // linked with the fact the function implementation queues behind requestAnimationFrame should allow
            // us to be certain that all rendering is done by the time the event fires.
            this.beans.rowRenderer.dispatchFirstDataRenderedEvent();
        }
    }

    public unsetComp(containerType: RowContainerType): void {
        this.allRowGuis = this.allRowGuis.filter((rowGui) => rowGui.containerType !== containerType);
        this.updateGui(containerType, undefined);
    }

    public isCacheable(): boolean {
        return this.rowType === 'FullWidthDetail' && this.gos.get('keepDetailRows');
    }

    public setCached(cached: boolean): void {
        const displayValue = cached ? 'none' : '';
        this.allRowGuis.forEach((rg) => (rg.element.style.display = displayValue));
    }

    private initialiseRowComp(gui: RowGui): void {
        const gos = this.gos;

        this.onSuppressCellFocusChanged(this.beans.gos.get('suppressCellFocus'));

        this.listenOnDomOrder(gui);
        this.beans.rowAutoHeight?.checkAutoHeights(this.rowNode);
        this.onRowHeightChanged(gui);
        this.updateRowIndexes(gui);
        this.setFocusedClasses(gui);
        this.setStylesFromGridOptions(false, gui); // no need to calculate styles already set in constructor

        if (_isRowSelection(gos) && this.rowNode.selectable) {
            this.onRowSelected(gui);
        }

        this.updateColumnLists(!this.useAnimationFrameForCreate);

        const comp = gui.rowComp;

        const initialRowClasses = this.getInitialRowClasses(gui.containerType);
        initialRowClasses.forEach((name) => comp.addOrRemoveCssClass(name, true));

        this.executeSlideAndFadeAnimations(gui);

        if (this.rowNode.group) {
            _setAriaExpanded(gui.element, this.rowNode.expanded == true);
        }

        this.setRowCompRowId(comp);
        this.setRowCompRowBusinessKey(comp);

        // DOM DATA
        _setDomData(gos, gui.element, DOM_DATA_KEY_ROW_CTRL, this);
        gui.compBean.addDestroyFunc(() => _setDomData(gos, gui.element, DOM_DATA_KEY_ROW_CTRL, null));

        // adding hover functionality adds listener to this row, so we
        // do it lazily in an animation frame
        if (this.useAnimationFrameForCreate) {
            this.beans.animationFrameSvc!.createTask(
                this.addHoverFunctionality.bind(this, gui),
                this.rowNode.rowIndex!,
                'createTasksP2'
            );
        } else {
            this.addHoverFunctionality(gui);
        }

        if (this.isFullWidth()) {
            this.setupFullWidth(gui);
        }

        if (gos.get('rowDragEntireRow')) {
            this.addRowDraggerToRow(gui);
        }

        if (this.useAnimationFrameForCreate) {
            // the height animation we only want active after the row is alive for 1 second.
            // this stops the row animation working when rows are initially created. otherwise
            // auto-height rows get inserted into the dom and resized immediately, which gives
            // very bad UX (eg 10 rows get inserted, then all 10 expand, look particularly bad
            // when scrolling). so this makes sure when rows are shown for the first time, they
            // are resized immediately without animation.
            this.beans.animationFrameSvc!.addDestroyTask(() => {
                if (!this.isAlive()) {
                    return;
                }
                gui.rowComp.addOrRemoveCssClass('ag-after-created', true);
            });
        }

        this.executeProcessRowPostCreateFunc();
    }

    private setRowCompRowBusinessKey(comp: IRowComp): void {
        if (this.businessKeySanitised == null) {
            return;
        }
        comp.setRowBusinessKey(this.businessKeySanitised);
    }
    public getBusinessKey(): string | null {
        return this.businessKeySanitised;
    }

    private setRowCompRowId(comp: IRowComp) {
        this.rowId = _escapeString(this.rowNode.id);
        if (this.rowId == null) {
            return;
        }

        comp.setRowId(this.rowId);
    }

    private executeSlideAndFadeAnimations(gui: RowGui): void {
        const { containerType } = gui;

        const shouldSlide = this.slideInAnimation[containerType];
        if (shouldSlide) {
            _executeNextVMTurn(() => {
                this.onTopChanged();
            });
            this.slideInAnimation[containerType] = false;
        }

        const shouldFade = this.fadeInAnimation[containerType];
        if (shouldFade) {
            _executeNextVMTurn(() => {
                gui.rowComp.addOrRemoveCssClass('ag-opacity-zero', false);
            });
            this.fadeInAnimation[containerType] = false;
        }
    }

    private addRowDraggerToRow(gui: RowGui) {
        const rowDragComp = this.beans.rowDragSvc?.createRowDragCompForRow(this.rowNode, gui.element);
        if (!rowDragComp) {
            return;
        }
        const rowDragBean = this.createBean(rowDragComp, this.beans.context);
        this.rowDragComps.push(rowDragBean);
        gui.compBean.addDestroyFunc(() => {
            this.rowDragComps = this.rowDragComps.filter((r) => r !== rowDragBean);
            this.destroyBean(rowDragBean, this.beans.context);
        });
    }

    private setupFullWidth(gui: RowGui): void {
        const pinned = this.getPinnedForContainer(gui.containerType);
        const compDetails = this.createFullWidthCompDetails(gui.element, pinned);
        gui.rowComp.showFullWidth(compDetails);
    }

    public isPrintLayout(): boolean {
        return this.printLayout;
    }

    public getFullWidthCellRenderers(): (ICellRenderer<any> | null | undefined)[] {
        if (this.gos.get('embedFullWidthRows')) {
            return this.allRowGuis.map((gui) => gui?.rowComp?.getFullWidthCellRenderer());
        }
        return [this.fullWidthGui?.rowComp?.getFullWidthCellRenderer()];
    }

    // use by autoWidthCalculator, as it clones the elements
    public getCellElement(column: AgColumn): HTMLElement | null {
        const cellCtrl = this.getCellCtrl(column);
        return cellCtrl ? cellCtrl.getGui() : null;
    }

    private executeProcessRowPostCreateFunc(): void {
        const func = this.gos.getCallback('processRowPostCreate');
        if (!func || !this.areAllContainersReady()) {
            return;
        }

        const params: WithoutGridCommon<ProcessRowParams> = {
            // areAllContainersReady asserts that centerGui is not null
            eRow: this.centerGui!.element,
            ePinnedLeftRow: this.leftGui ? this.leftGui.element : undefined,
            ePinnedRightRow: this.rightGui ? this.rightGui.element : undefined,
            node: this.rowNode,
            rowIndex: this.rowNode.rowIndex!,
            addRenderedRowListener: this.addEventListener.bind(this),
        };
        func(params);
    }

    private areAllContainersReady(): boolean {
        const isLeftReady = !!this.leftGui || !this.beans.visibleCols.isPinningLeft();
        const isCenterReady = !!this.centerGui;
        const isRightReady = !!this.rightGui || !this.beans.visibleCols.isPinningRight();

        return isLeftReady && isCenterReady && isRightReady;
    }

    private isNodeFullWidthCell(): boolean {
        if (this.rowNode.detail) {
            return true;
        }

        const isFullWidthCellFunc = this.beans.gos.getCallback('isFullWidthRow');
        return isFullWidthCellFunc ? isFullWidthCellFunc({ rowNode: this.rowNode }) : false;
    }

    private setRowType(): void {
        // groupHideOpenParents implicitly disables full width loading
        const isStub =
            this.rowNode.stub &&
            !this.gos.get('suppressServerSideFullWidthLoadingRow') &&
            !this.gos.get('groupHideOpenParents');
        const isFullWidthCell = this.isNodeFullWidthCell();
        const isDetailCell = this.gos.get('masterDetail') && this.rowNode.detail;
        const pivotMode = this.beans.colModel.isPivotMode();
        // we only use full width for groups, not footers. it wouldn't make sense to include footers if not looking
        // for totals. if users complain about this, then we should introduce a new property 'footerUseEntireRow'
        // so each can be set independently (as a customer complained about footers getting full width, hence
        // introducing this logic)
        const isGroupRow = !!this.rowNode.group && !this.rowNode.footer;
        const isFullWidthGroup = isGroupRow && _isGroupUseEntireRow(this.gos, pivotMode);

        if (isStub) {
            this.rowType = 'FullWidthLoading';
        } else if (isDetailCell) {
            this.rowType = 'FullWidthDetail';
        } else if (isFullWidthCell) {
            this.rowType = 'FullWidth';
        } else if (isFullWidthGroup) {
            this.rowType = 'FullWidthGroup';
        } else {
            this.rowType = 'Normal';
        }
    }

    private updateColumnLists(suppressAnimationFrame = false, useFlushSync = false): void {
        if (this.isFullWidth()) {
            return;
        }

        const noAnimation = suppressAnimationFrame || this.gos.get('suppressAnimationFrame') || this.printLayout;

        if (noAnimation) {
            this.updateColumnListsImpl(useFlushSync);
            return;
        }

        if (this.updateColumnListsPending) {
            return;
        }
        this.beans.animationFrameSvc!.createTask(
            () => {
                if (!this.active) {
                    return;
                }
                this.updateColumnListsImpl(true);
            },
            this.rowNode.rowIndex!,
            'createTasksP1'
        );
        this.updateColumnListsPending = true;
    }

    private createCellCtrls(
        prev: CellCtrlListAndMap,
        cols: AgColumn[],
        pinned: ColumnPinnedType = null
    ): CellCtrlListAndMap {
        const res: CellCtrlListAndMap = {
            list: [],
            map: {},
        };

        const addCell = (colInstanceId: ColumnInstanceId, cellCtrl: CellCtrl) => {
            res.list.push(cellCtrl);
            res.map[colInstanceId] = cellCtrl;
        };

        cols.forEach((col) => {
            // we use instanceId's rather than colId as it's possible there is a Column with same Id,
            // but it's referring to a different column instance. Happens a lot with pivot, as pivot col id's are
            // reused eg pivot_0, pivot_1 etc
            const colInstanceId = col.getInstanceId();
            let cellCtrl = prev.map[colInstanceId];
            if (!cellCtrl) {
                cellCtrl = new CellCtrl(col, this.rowNode, this.beans, this);
            }
            addCell(colInstanceId, cellCtrl);
        });

        prev.list.forEach((prevCellCtrl) => {
            const colInstanceId = prevCellCtrl.getColumn().getInstanceId();
            const cellInResult = res.map[colInstanceId] != null;
            if (cellInResult) {
                return;
            }

            const keepCell = !this.isCellEligibleToBeRemoved(prevCellCtrl, pinned);
            if (keepCell) {
                addCell(colInstanceId, prevCellCtrl);
                return;
            }

            prevCellCtrl.destroy();
        });

        return res;
    }

    private updateColumnListsImpl(useFlushSync: boolean): void {
        this.updateColumnListsPending = false;
        this.createAllCellCtrls();

        this.setCellCtrls(useFlushSync);
    }

    private setCellCtrls(useFlushSync: boolean) {
        this.allRowGuis.forEach((item) => {
            const cellControls = this.getCellCtrlsForContainer(item.containerType);
            item.rowComp.setCellCtrls(cellControls, useFlushSync);
        });
    }

    private getCellCtrlsForContainer(containerType: RowContainerType) {
        switch (containerType) {
            case 'left':
                return this.leftCellCtrls.list;
            case 'right':
                return this.rightCellCtrls.list;
            case 'fullWidth':
                return [];
            case 'center':
                return this.centerCellCtrls.list;
        }
    }

    private createAllCellCtrls() {
        const colViewport = this.beans.colViewport;
        const presentedColsService = this.beans.visibleCols;
        if (this.printLayout) {
            this.centerCellCtrls = this.createCellCtrls(this.centerCellCtrls, presentedColsService.allCols);
            this.leftCellCtrls = { list: [], map: {} };
            this.rightCellCtrls = { list: [], map: {} };
        } else {
            const centerCols = colViewport.getColsWithinViewport(this.rowNode);
            this.centerCellCtrls = this.createCellCtrls(this.centerCellCtrls, centerCols);

            const leftCols = presentedColsService.getLeftColsForRow(this.rowNode);
            this.leftCellCtrls = this.createCellCtrls(this.leftCellCtrls, leftCols, 'left');

            const rightCols = presentedColsService.getRightColsForRow(this.rowNode);
            this.rightCellCtrls = this.createCellCtrls(this.rightCellCtrls, rightCols, 'right');
        }
    }

    private isCellEligibleToBeRemoved(cellCtrl: CellCtrl, nextContainerPinned: ColumnPinnedType): boolean {
        const REMOVE_CELL = true;
        const KEEP_CELL = false;

        // always remove the cell if it's not rendered or if it's in the wrong pinned location
        const column = cellCtrl.getColumn();
        if (column.getPinned() != nextContainerPinned) {
            return REMOVE_CELL;
        }

        // we want to try and keep editing and focused cells
        const editing = cellCtrl.isEditing();
        const focused = this.beans.focusSvc.isCellFocused(cellCtrl.getCellPosition());

        const mightWantToKeepCell = editing || focused;

        if (mightWantToKeepCell) {
            const column = cellCtrl.getColumn();
            const displayedColumns = this.beans.visibleCols.allCols;
            const cellStillDisplayed = displayedColumns.indexOf(column as AgColumn) >= 0;
            return cellStillDisplayed ? KEEP_CELL : REMOVE_CELL;
        }

        return REMOVE_CELL;
    }

    public getDomOrder(): boolean {
        const isEnsureDomOrder = this.gos.get('ensureDomOrder');
        return isEnsureDomOrder || _isDomLayout(this.gos, 'print');
    }

    private listenOnDomOrder(gui: RowGui): void {
        const listener = () => {
            gui.rowComp.setDomOrder(this.getDomOrder());
        };

        gui.compBean.addManagedPropertyListeners(['domLayout', 'ensureDomOrder'], listener);
    }

    private setAnimateFlags(animateIn: boolean): void {
        if (this.isSticky() || !animateIn) {
            return;
        }

        const oldRowTopExists = _exists(this.rowNode.oldRowTop);
        const pinningLeft = this.beans.visibleCols.isPinningLeft();
        const pinningRight = this.beans.visibleCols.isPinningRight();

        if (oldRowTopExists) {
            if (this.isFullWidth() && !this.gos.get('embedFullWidthRows')) {
                this.slideInAnimation.fullWidth = true;
                return;
            }

            // if the row had a previous position, we slide it in
            this.slideInAnimation.center = true;
            this.slideInAnimation.left = pinningLeft;
            this.slideInAnimation.right = pinningRight;
        } else {
            if (this.isFullWidth() && !this.gos.get('embedFullWidthRows')) {
                this.fadeInAnimation.fullWidth = true;
                return;
            }

            // if the row had no previous position, we fade it in
            this.fadeInAnimation.center = true;
            this.fadeInAnimation.left = pinningLeft;
            this.fadeInAnimation.right = pinningRight;
        }
    }

    public isEditing(): boolean {
        return this.editingRow;
    }

    public isFullWidth(): boolean {
        return this.rowType !== 'Normal';
    }

    public refreshFullWidth(): boolean {
        // returns 'true' if refresh succeeded
        const tryRefresh = (gui: RowGui | undefined, pinned: ColumnPinnedType): boolean => {
            if (!gui) {
                return true;
            } // no refresh needed

            return gui.rowComp.refreshFullWidth(() => {
                const compDetails = this.createFullWidthCompDetails(gui.element, pinned);
                return compDetails.params;
            });
        };

        const fullWidthSuccess = tryRefresh(this.fullWidthGui, null);
        const centerSuccess = tryRefresh(this.centerGui, null);
        const leftSuccess = tryRefresh(this.leftGui, 'left');
        const rightSuccess = tryRefresh(this.rightGui, 'right');

        const allFullWidthRowsRefreshed = fullWidthSuccess && centerSuccess && leftSuccess && rightSuccess;

        return allFullWidthRowsRefreshed;
    }

    private addListeners(): void {
        this.addManagedListeners(this.rowNode, {
            heightChanged: () => this.onRowHeightChanged(),
            rowSelected: () => this.onRowSelected(),
            rowIndexChanged: this.onRowIndexChanged.bind(this),
            topChanged: this.onTopChanged.bind(this),
            ...(this.beans.expansionSvc?.getRowExpandedListeners(this) ?? {}),
        });

        if (this.rowNode.detail) {
            // if the master row node has updated data, we also want to try to refresh the detail row
            this.addManagedListeners(this.rowNode.parent!, { dataChanged: this.onRowNodeDataChanged.bind(this) });
        }

        this.addManagedListeners(this.rowNode, {
            dataChanged: this.onRowNodeDataChanged.bind(this),
            cellChanged: this.postProcessCss.bind(this),
            rowHighlightChanged: this.onRowNodeHighlightChanged.bind(this),
            draggingChanged: this.postProcessRowDragging.bind(this),
            uiLevelChanged: this.onUiLevelChanged.bind(this),
        });

        this.addManagedListeners(this.beans.eventSvc, {
            paginationPixelOffsetChanged: this.onPaginationPixelOffsetChanged.bind(this),
            heightScaleChanged: this.onTopChanged.bind(this),
            displayedColumnsChanged: this.onDisplayedColumnsChanged.bind(this),
            virtualColumnsChanged: this.onVirtualColumnsChanged.bind(this),
            cellFocused: this.onCellFocusChanged.bind(this),
            cellFocusCleared: this.onCellFocusChanged.bind(this),
            paginationChanged: this.onPaginationChanged.bind(this),
            modelUpdated: this.refreshFirstAndLastRowStyles.bind(this),
            columnMoved: () => this.updateColumnLists(),
        });

        this.addDestroyFunc(() => {
            this.rowDragComps = this.destroyBeans(this.rowDragComps, this.beans.context);
            this.tooltipFeature = this.destroyBean(this.tooltipFeature, this.beans.context);
        });

        this.addManagedPropertyListeners(
            ['rowStyle', 'getRowStyle', 'rowClass', 'getRowClass', 'rowClassRules'],
            this.postProcessCss.bind(this)
        );

        this.addManagedPropertyListener('rowDragEntireRow', () => {
            const useRowDragEntireRow = this.gos.get('rowDragEntireRow');
            if (useRowDragEntireRow) {
                this.allRowGuis.forEach((gui) => {
                    this.addRowDraggerToRow(gui);
                });
                return;
            }
            this.rowDragComps = this.destroyBeans(this.rowDragComps, this.beans.context);
        });

        this.addListenersForCellComps();
    }

    private addListenersForCellComps(): void {
        this.addManagedListeners(this.rowNode, {
            rowIndexChanged: () => {
                this.getAllCellCtrls().forEach((cellCtrl) => cellCtrl.onRowIndexChanged());
            },
            cellChanged: (event) => {
                this.getAllCellCtrls().forEach((cellCtrl) => cellCtrl.onCellChanged(event));
            },
        });
    }

    private onRowNodeDataChanged(event: DataChangedEvent): void {
        // if the row is rendered incorrectly, as the requirements for whether this is a FW row have changed, we force re-render this row.
        const fullWidthChanged = this.isFullWidth() !== !!this.isNodeFullWidthCell();
        if (fullWidthChanged) {
            this.beans.rowRenderer.redrawRow(this.rowNode);
            return;
        }

        // this bit of logic handles trying to refresh the FW row ctrl, or delegating to removing/recreating it if unsupported.
        if (this.isFullWidth()) {
            const refresh = this.refreshFullWidth();
            if (!refresh) {
                this.beans.rowRenderer.redrawRow(this.rowNode);
            }
            return;
        }

        // if this is an update, we want to refresh, as this will allow the user to put in a transition
        // into the cellRenderer refresh method. otherwise this might be completely new data, in which case
        // we will want to completely replace the cells
        this.getAllCellCtrls().forEach((cellCtrl) =>
            cellCtrl.refreshCell({
                suppressFlash: !event.update,
                newData: !event.update,
            })
        );

        // as data has changed update the dom row id attributes
        this.allRowGuis.forEach((gui) => {
            this.setRowCompRowId(gui.rowComp);
            this.updateRowBusinessKey();
            this.setRowCompRowBusinessKey(gui.rowComp);
        });

        // check for selected also, as this could be after lazy loading of the row data, in which case
        // the id might of just gotten set inside the row and the row selected state may of changed
        // as a result. this is what happens when selected rows are loaded in virtual pagination.
        // - niall note - since moving to the stub component, this may no longer be true, as replacing
        // the stub component now replaces the entire row
        this.onRowSelected();

        // as data has changed, then the style and class needs to be recomputed
        this.postProcessCss();
    }

    private postProcessCss(): void {
        this.setStylesFromGridOptions(true);
        this.postProcessClassesFromGridOptions();
        this.postProcessRowClassRules();
        this.postProcessRowDragging();
    }

    private onRowNodeHighlightChanged(): void {
        const highlighted = this.rowNode.highlighted;

        this.allRowGuis.forEach((gui) => {
            const aboveOn = highlighted === 'Above';
            const belowOn = highlighted === 'Below';
            gui.rowComp.addOrRemoveCssClass('ag-row-highlight-above', aboveOn);
            gui.rowComp.addOrRemoveCssClass('ag-row-highlight-below', belowOn);
        });
    }

    private postProcessRowDragging(): void {
        const dragging = this.rowNode.dragging;
        this.allRowGuis.forEach((gui) => gui.rowComp.addOrRemoveCssClass('ag-row-dragging', dragging));
    }

    private onDisplayedColumnsChanged(): void {
        // we skip animations for onDisplayedColumnChanged, as otherwise the client could remove columns and
        // then set data, and any old valueGetter's (ie from cols that were removed) would still get called.
        this.updateColumnLists(true);

        this.beans.rowAutoHeight?.checkAutoHeights(this.rowNode);
    }

    private onVirtualColumnsChanged(): void {
        this.updateColumnLists(false, true);
    }

    public getRowPosition(): RowPosition {
        return {
            rowPinned: _makeNull(this.rowNode.rowPinned),
            rowIndex: this.rowNode.rowIndex as number,
        };
    }

    private findFullWidthRowGui(target: HTMLElement): RowGui | undefined {
        return this.allRowGuis.find((c) => c.element.contains(target));
    }

    public onKeyboardNavigate(keyboardEvent: KeyboardEvent) {
        const currentFullWidthComp = this.findFullWidthRowGui(keyboardEvent.target as HTMLElement);
        const currentFullWidthContainer = currentFullWidthComp ? currentFullWidthComp.element : null;
        const isFullWidthContainerFocused = currentFullWidthContainer === keyboardEvent.target;

        if (!isFullWidthContainerFocused) {
            return;
        }

        const node = this.rowNode;
        const lastFocusedCell = this.beans.focusSvc.getFocusedCell();
        const cellPosition: CellPosition = {
            rowIndex: node.rowIndex!,
            rowPinned: node.rowPinned,
            column: (lastFocusedCell?.column as AgColumn) ?? this.getColumnForFullWidth(currentFullWidthComp),
        };

        this.beans.navigation?.navigateToNextCell(keyboardEvent, keyboardEvent.key, cellPosition, true);
        keyboardEvent.preventDefault();
    }

    public onTabKeyDown(keyboardEvent: KeyboardEvent) {
        if (keyboardEvent.defaultPrevented || _isStopPropagationForAgGrid(keyboardEvent)) {
            return;
        }
        const currentFullWidthComp = this.allRowGuis.find((c) =>
            c.element.contains(keyboardEvent.target as HTMLElement)
        );
        const currentFullWidthContainer = currentFullWidthComp ? currentFullWidthComp.element : null;
        const isFullWidthContainerFocused = currentFullWidthContainer === keyboardEvent.target;
        const activeEl = _getActiveDomElement(this.gos);
        let isDetailGridCellFocused = false;

        if (currentFullWidthContainer && activeEl) {
            isDetailGridCellFocused =
                currentFullWidthContainer.contains(activeEl) && activeEl.classList.contains('ag-cell');
        }

        let nextEl: HTMLElement | null = null;

        if (!isFullWidthContainerFocused && !isDetailGridCellFocused) {
            nextEl = this.beans.focusSvc.findNextFocusableElement(
                currentFullWidthContainer!,
                false,
                keyboardEvent.shiftKey
            );
        }

        if ((this.isFullWidth() && isFullWidthContainerFocused) || !nextEl) {
            this.beans.navigation?.onTabKeyDown(this, keyboardEvent);
        }
    }

    public getFullWidthElement(): HTMLElement | null {
        if (this.fullWidthGui) {
            return this.fullWidthGui.element;
        }
        return null;
    }

    public getRowYPosition(): number {
        const displayedEl = this.allRowGuis.find((el) => _isVisible(el.element))?.element;

        if (displayedEl) {
            return displayedEl.getBoundingClientRect().top;
        }

        return 0;
    }

    public onSuppressCellFocusChanged(suppressCellFocus: boolean): void {
        const tabIndex = this.isFullWidth() && suppressCellFocus ? undefined : -1;
        this.allRowGuis.forEach((gui) => {
            _addOrRemoveAttribute(gui.element, 'tabindex', tabIndex);
        });
    }

    public onFullWidthRowFocused(event?: CellFocusedEvent) {
        const node = this.rowNode;
        const isFocused = !event
            ? false
            : this.isFullWidth() && event.rowIndex === node.rowIndex && event.rowPinned == node.rowPinned;

        const element = this.fullWidthGui ? this.fullWidthGui.element : this.centerGui?.element;
        if (!element) {
            return;
        } // can happen with react ui, comp not yet ready

        element.classList.toggle('ag-full-width-focus', isFocused);

        if (isFocused && event?.forceBrowserFocus) {
            // we don't scroll normal rows into view when we focus them, so we don't want
            // to scroll Full Width rows either.
            element.focus({ preventScroll: true });
        }
    }

    public recreateCell(cellCtrl: CellCtrl) {
        this.centerCellCtrls = this.removeCellCtrl(this.centerCellCtrls, cellCtrl);
        this.leftCellCtrls = this.removeCellCtrl(this.leftCellCtrls, cellCtrl);
        this.rightCellCtrls = this.removeCellCtrl(this.rightCellCtrls, cellCtrl);
        cellCtrl.destroy();
        this.updateColumnLists();
    }

    private removeCellCtrl(prev: CellCtrlListAndMap, cellCtrlToRemove: CellCtrl): CellCtrlListAndMap {
        const res: CellCtrlListAndMap = {
            list: [],
            map: {},
        };
        prev.list.forEach((cellCtrl) => {
            if (cellCtrl === cellCtrlToRemove) {
                return;
            }
            res.list.push(cellCtrl);
            res.map[cellCtrl.getColumn().getInstanceId()] = cellCtrl;
        });
        return res;
    }

    public onMouseEvent(eventName: string, mouseEvent: MouseEvent): void {
        switch (eventName) {
            case 'dblclick':
                this.onRowDblClick(mouseEvent);
                break;
            case 'click':
                this.onRowClick(mouseEvent);
                break;
            case 'touchstart':
            case 'mousedown':
                this.onRowMouseDown(mouseEvent);
                break;
        }
    }

    public createRowEvent<T extends AgEventType>(type: T, domEvent?: Event): RowEvent<T> {
        return this.gos.addGridCommonParams({
            type: type,
            node: this.rowNode,
            data: this.rowNode.data,
            rowIndex: this.rowNode.rowIndex!,
            rowPinned: this.rowNode.rowPinned,
            event: domEvent,
        });
    }

    private createRowEventWithSource<T extends AgEventType>(type: T, domEvent: Event): RowEvent<T> {
        const event = this.createRowEvent(type, domEvent);
        // when first developing this, we included the rowComp in the event.
        // this seems very weird. so when introducing the event types, i left the 'source'
        // out of the type, and just include the source in the two places where this event
        // was fired (rowClicked and rowDoubleClicked). it doesn't make sense for any
        // users to be using this, as the rowComp isn't an object we expose, so would be
        // very surprising if a user was using it.
        (event as any).source = this;
        return event;
    }

    private onRowDblClick(mouseEvent: MouseEvent): void {
        if (_isStopPropagationForAgGrid(mouseEvent)) {
            return;
        }

        this.beans.eventSvc.dispatchEvent(this.createRowEventWithSource('rowDoubleClicked', mouseEvent));
    }

    private getColumnForFullWidth(fullWidthRowGui?: RowGui): AgColumn {
        const { visibleCols } = this.beans;
        switch (fullWidthRowGui?.containerType) {
            case 'center':
                return visibleCols.centerCols[0];
            case 'left':
                return visibleCols.leftCols[0];
            case 'right':
                return visibleCols.rightCols[0];
            default:
                return visibleCols.allCols[0];
        }
    }

    private onRowMouseDown(mouseEvent: MouseEvent) {
        this.lastMouseDownOnDragger = _isElementChildOfClass(mouseEvent.target as HTMLElement, 'ag-row-drag', 3);

        if (!this.isFullWidth()) {
            return;
        }

        const node = this.rowNode;

        if (this.beans.rangeSvc) {
            this.beans.rangeSvc.removeAllCellRanges();
        }

        const fullWidthRowGui = this.findFullWidthRowGui(mouseEvent.target as HTMLElement);
        const element = fullWidthRowGui?.element;
        const target = mouseEvent.target as HTMLElement;

        let forceBrowserFocus = true;

        if (element && element.contains(target as HTMLElement) && _isFocusableFormField(target)) {
            forceBrowserFocus = false;
        }

        this.beans.focusSvc.setFocusedCell({
            rowIndex: node.rowIndex!,
            column: this.getColumnForFullWidth(fullWidthRowGui),
            rowPinned: node.rowPinned,
            forceBrowserFocus,
        });
    }

    public onRowClick(mouseEvent: MouseEvent) {
        const stop = _isStopPropagationForAgGrid(mouseEvent) || this.lastMouseDownOnDragger;

        if (stop) {
            return;
        }

        this.beans.eventSvc.dispatchEvent(this.createRowEventWithSource('rowClicked', mouseEvent));

        this.beans.selectionSvc?.handleRowClick(this.rowNode, mouseEvent);
    }

    public setupDetailRowAutoHeight(eDetailGui: HTMLElement): void {
        if (this.rowType !== 'FullWidthDetail') {
            return;
        }

        this.beans.masterDetailSvc?.setupDetailRowAutoHeight(this, eDetailGui);
    }

    private createFullWidthCompDetails(eRow: HTMLElement, pinned: ColumnPinnedType): UserCompDetails {
        const { gos, rowNode } = this;
        const params = gos.addGridCommonParams({
            fullWidth: true,
            data: rowNode.data,
            node: rowNode,
            value: rowNode.key,
            valueFormatted: rowNode.key,
            // these need to be taken out, as part of 'afterAttached' now
            eGridCell: eRow,
            eParentOfValue: eRow,
            pinned: pinned,
            addRenderedRowListener: this.addEventListener.bind(this),
            registerRowDragger: (rowDraggerElement, dragStartPixels, value, suppressVisibilityChange) =>
                this.addFullWidthRowDragging(rowDraggerElement, dragStartPixels, value, suppressVisibilityChange),
            setTooltip: (value, shouldDisplayTooltip) => this.refreshRowTooltip(value, shouldDisplayTooltip),
        } as WithoutGridCommon<ICellRendererParams>);

        const compFactory = this.beans.userCompFactory;
        switch (this.rowType) {
            case 'FullWidthDetail':
                return _getFullWidthDetailCellRendererDetails(compFactory, params);
            case 'FullWidthGroup':
                return _getFullWidthGroupCellRendererDetails(compFactory, params);
            case 'FullWidthLoading':
                return _getFullWidthLoadingCellRendererDetails(compFactory, params);
            default:
                return _getFullWidthCellRendererDetails(compFactory, params);
        }
    }

    private refreshRowTooltip(value: string, shouldDisplayTooltip?: () => boolean) {
        if (!this.fullWidthGui) {
            return;
        }

        this.tooltipFeature = this.beans.tooltipSvc?.refreshRowTooltip(
            this.tooltipFeature,
            this,
            value,
            shouldDisplayTooltip
        );
    }

    private addFullWidthRowDragging(
        rowDraggerElement?: HTMLElement,
        dragStartPixels?: number,
        value: string = '',
        suppressVisibilityChange?: boolean
    ): void {
        if (!this.beans.rowDragSvc || !this.isFullWidth()) {
            return;
        }

        const rowDragComp = this.beans.rowDragSvc.createRowDragComp(
            () => value,
            this.rowNode,
            undefined,
            rowDraggerElement,
            dragStartPixels,
            suppressVisibilityChange
        );
        this.createBean(rowDragComp, this.beans.context);

        this.addDestroyFunc(() => {
            this.destroyBean(rowDragComp, this.beans.context);
        });
    }

    private onUiLevelChanged(): void {
        const newLevel = calculateRowLevel(this.rowNode);
        if (this.rowLevel != newLevel) {
            const classToAdd = 'ag-row-level-' + newLevel;
            const classToRemove = 'ag-row-level-' + this.rowLevel;
            this.allRowGuis.forEach((gui) => {
                gui.rowComp.addOrRemoveCssClass(classToAdd, true);
                gui.rowComp.addOrRemoveCssClass(classToRemove, false);
            });
        }
        this.rowLevel = newLevel;
    }

    private isFirstRowOnPage(): boolean {
        return this.rowNode.rowIndex === this.beans.pageBounds.getFirstRow();
    }

    private isLastRowOnPage(): boolean {
        return this.rowNode.rowIndex === this.beans.pageBounds.getLastRow();
    }

    private refreshFirstAndLastRowStyles(): void {
        const newFirst = this.isFirstRowOnPage();
        const newLast = this.isLastRowOnPage();

        if (this.firstRowOnPage !== newFirst) {
            this.firstRowOnPage = newFirst;
            this.allRowGuis.forEach((gui) => gui.rowComp.addOrRemoveCssClass('ag-row-first', newFirst));
        }
        if (this.lastRowOnPage !== newLast) {
            this.lastRowOnPage = newLast;
            this.allRowGuis.forEach((gui) => gui.rowComp.addOrRemoveCssClass('ag-row-last', newLast));
        }
    }

    public stopEditing(cancel = false): void {
        // if we are already stopping row edit, there is
        // no need to start this process again.
        if (this.stoppingRowEdit) {
            return;
        }

        this.beans.rowEditSvc?.stopEditing(this, cancel);
    }

    public setEditingRow(value: boolean): void {
        this.editingRow = value;
    }

    public startRowEditing(
        key: string | null = null,
        sourceRenderedCell: CellCtrl | null = null,
        event: KeyboardEvent | null = null
    ): boolean {
        // don't do it if already editing
        if (this.editingRow) {
            return true;
        }

        return this.beans.rowEditSvc?.startEditing(this, key, sourceRenderedCell, event) ?? true;
    }

    public getAllCellCtrls(): CellCtrl[] {
        if (this.leftCellCtrls.list.length === 0 && this.rightCellCtrls.list.length === 0) {
            return this.centerCellCtrls.list;
        }
        const res = [...this.centerCellCtrls.list, ...this.leftCellCtrls.list, ...this.rightCellCtrls.list];
        return res;
    }

    private postProcessClassesFromGridOptions(): void {
        const cssClasses: string[] = [];
        this.beans.rowStyleSvc?.processClassesFromGridOptions(cssClasses, this.rowNode);
        if (!cssClasses.length) {
            return;
        }

        cssClasses.forEach((classStr) => {
            this.allRowGuis.forEach((c) => c.rowComp.addOrRemoveCssClass(classStr, true));
        });
    }

    private postProcessRowClassRules(): void {
        this.beans.rowStyleSvc?.processRowClassRules(
            this.rowNode,
            (className: string) => {
                this.allRowGuis.forEach((gui) => gui.rowComp.addOrRemoveCssClass(className, true));
            },
            (className: string) => {
                this.allRowGuis.forEach((gui) => gui.rowComp.addOrRemoveCssClass(className, false));
            }
        );
    }

    private setStylesFromGridOptions(updateStyles: boolean, gui?: RowGui): void {
        if (updateStyles) {
            this.rowStyles = this.processStylesFromGridOptions();
        }
        this.forEachGui(gui, (gui) => gui.rowComp.setUserStyles(this.rowStyles));
    }

    private getPinnedForContainer(rowContainerType: RowContainerType): ColumnPinnedType {
        if (rowContainerType === 'left' || rowContainerType === 'right') {
            return rowContainerType;
        }
        return null;
    }

    private getInitialRowClasses(rowContainerType: RowContainerType): string[] {
        const pinned = this.getPinnedForContainer(rowContainerType);
        const fullWidthRow = this.isFullWidth();
        const { rowNode, beans } = this;

        const classes: string[] = [];

        classes.push('ag-row');
        classes.push(this.rowFocused ? 'ag-row-focus' : 'ag-row-no-focus');

        if (this.fadeInAnimation[rowContainerType]) {
            classes.push('ag-opacity-zero');
        }

        classes.push(rowNode.rowIndex! % 2 === 0 ? 'ag-row-even' : 'ag-row-odd');

        if (rowNode.isRowPinned()) {
            classes.push('ag-row-pinned');
        }

        if (rowNode.isSelected()) {
            classes.push('ag-row-selected');
        }

        if (rowNode.footer) {
            classes.push('ag-row-footer');
        }

        classes.push('ag-row-level-' + this.rowLevel);

        if (rowNode.stub) {
            classes.push('ag-row-loading');
        }

        if (fullWidthRow) {
            classes.push('ag-full-width-row');
        }

        beans.expansionSvc?.addExpandedCss(classes, rowNode);

        if (rowNode.dragging) {
            classes.push('ag-row-dragging');
        }

        const { rowStyleSvc } = beans;
        if (rowStyleSvc) {
            rowStyleSvc.processClassesFromGridOptions(classes, rowNode);
            rowStyleSvc.preProcessRowClassRules(classes, rowNode);
        }

        // we use absolute position unless we are doing print layout
        classes.push(this.printLayout ? 'ag-row-position-relative' : 'ag-row-position-absolute');

        if (this.isFirstRowOnPage()) {
            classes.push('ag-row-first');
        }

        if (this.isLastRowOnPage()) {
            classes.push('ag-row-last');
        }

        if (fullWidthRow) {
            if (pinned === 'left') {
                classes.push('ag-cell-last-left-pinned');
            }
            if (pinned === 'right') {
                classes.push('ag-cell-first-right-pinned');
            }
        }

        return classes;
    }

    private processStylesFromGridOptions(): RowStyle {
        // Return constant reference for React
        return this.beans.rowStyleSvc?.processStylesFromGridOptions(this.rowNode) ?? this.emptyStyle;
    }

    private onRowSelected(gui?: RowGui): void {
        this.beans.selectionSvc?.onRowCtrlSelected(
            this,
            (gui) => {
                if (gui === this.centerGui || gui === this.fullWidthGui) {
                    this.announceDescription();
                }
            },
            gui
        );
    }

    public announceDescription(): void {
        this.beans.selectionSvc?.announceAriaRowSelection(this.rowNode);
    }

    public addHoverFunctionality(eGui: RowGui): void {
        // because we use animation frames to do this, it's possible the row no longer exists
        // by the time we get to add it
        if (!this.active) {
            return;
        }

        // because mouseenter and mouseleave do not propagate, we cannot listen on the gridPanel
        // like we do for all the other mouse events.

        // because of the pinning, we cannot simply add / remove the class based on the eRow. we
        // have to check all eRow's (body & pinned). so the trick is if any of the rows gets a
        // mouse hover, it sets such in the rowNode, and then all three reflect the change as
        // all are listening for event on the row node.

        const { element, compBean } = eGui;
        const { rowNode, beans, gos } = this;
        // step 1 - add listener, to set flag on row node
        compBean.addManagedListeners(element, {
            mouseenter: () => rowNode.dispatchRowEvent('mouseEnter'),
            mouseleave: () => rowNode.dispatchRowEvent('mouseLeave'),
        });

        // step 2 - listen for changes on row node (which any element can trigger)
        compBean.addManagedListeners(rowNode, {
            mouseEnter: () => {
                // if hover turned off, we don't add the class. we do this here so that if the application
                // toggles this property mid way, we remove the hover form the last row, but we stop
                // adding hovers from that point onwards. Also, do not highlight while dragging elements around.
                if (!beans.dragSvc?.isDragging() && !gos.get('suppressRowHoverHighlight')) {
                    element.classList.add('ag-row-hover');
                    rowNode.setHovered(true);
                }
            },
            mouseLeave: () => {
                element.classList.remove('ag-row-hover');
                rowNode.setHovered(false);
            },
        });
    }

    // for animation, we don't want to animate entry or exit to a very far away pixel,
    // otherwise the row would move so fast, it would appear to disappear. so this method
    // moves the row closer to the viewport if it is far away, so the row slide in / out
    // at a speed the user can see.
    private roundRowTopToBounds(rowTop: number): number {
        const range = this.beans.ctrlsSvc.getGridBodyCtrl().getScrollFeature().getApproximateVScollPosition();
        const minPixel = this.applyPaginationOffset(range.top, true) - 100;
        const maxPixel = this.applyPaginationOffset(range.bottom, true) + 100;

        return Math.min(Math.max(minPixel, rowTop), maxPixel);
    }

    public forEachGui(gui: RowGui | undefined, callback: (gui: RowGui) => void): void {
        if (gui) {
            callback(gui);
        } else {
            this.allRowGuis.forEach(callback);
        }
    }

    private onRowHeightChanged(gui?: RowGui): void {
        // check for exists first - if the user is resetting the row height, then
        // it will be null (or undefined) momentarily until the next time the flatten
        // stage is called where the row will then update again with a new height
        if (this.rowNode.rowHeight == null) {
            return;
        }

        const rowHeight = this.rowNode.rowHeight;

        const defaultRowHeight = this.beans.environment.getDefaultRowHeight();
        const isHeightFromFunc = _isGetRowHeightFunction(this.gos);
        const heightFromFunc = isHeightFromFunc ? _getRowHeightForNode(this.gos, this.rowNode).height : undefined;
        const lineHeight = heightFromFunc ? `${Math.min(defaultRowHeight, heightFromFunc) - 2}px` : undefined;

        this.forEachGui(gui, (gui) => {
            gui.element.style.height = `${rowHeight}px`;

            // If the row height is coming from a function, this means some rows can
            // be smaller than the theme had intended. so we set --ag-line-height on
            // the row, which is picked up by the theme CSS and is used in a calc
            // for the CSS line-height property, which makes sure the line-height is
            // not bigger than the row height, otherwise the row text would not fit.
            // We do not use rowNode.rowHeight here, as this could be the result of autoHeight,
            // and we found using the autoHeight result causes a loop, where changing the
            // line-height them impacts the cell height, resulting in a new autoHeight,
            // resulting in a new line-height and so on loop.
            // const heightFromFunc = getRowHeightForNode(this.gos, this.rowNode).height;
            if (lineHeight) {
                gui.element.style.setProperty('--ag-line-height', lineHeight);
            }
        });
    }

    public override addEventListener<T extends RowCtrlEvent>(eventType: T, listener: IEventListener<T>): void {
        super.addEventListener(eventType, listener);
    }

    public override removeEventListener<T extends RowCtrlEvent>(eventType: T, listener: IEventListener<T>): void {
        super.removeEventListener(eventType, listener);
    }

    // note - this is NOT called by context, as we don't wire / unwire the CellComp for performance reasons.
    public destroyFirstPass(suppressAnimation: boolean = false): void {
        this.active = false;

        // why do we have this method? shouldn't everything below be added as a destroy func beside
        // the corresponding create logic?

        if (!suppressAnimation && _isAnimateRows(this.gos) && !this.isSticky()) {
            const rowStillVisibleJustNotInViewport = this.rowNode.rowTop != null;
            if (rowStillVisibleJustNotInViewport) {
                // if the row is not rendered, but in viewport, it means it has moved,
                // so we animate the row out. if the new location is very far away,
                // the animation will be so fast the row will look like it's just disappeared,
                // so instead we animate to a position just outside the viewport.
                const rowTop = this.roundRowTopToBounds(this.rowNode.rowTop!);
                this.setRowTop(rowTop);
            } else {
                this.allRowGuis.forEach((gui) => gui.rowComp.addOrRemoveCssClass('ag-opacity-zero', true));
            }
        }

        this.rowNode.setHovered(false);

        const event: VirtualRowRemovedEvent = this.createRowEvent('virtualRowRemoved');

        this.dispatchLocalEvent(event);
        this.beans.eventSvc.dispatchEvent(event);
        super.destroy();
    }

    public destroySecondPass(): void {
        this.allRowGuis.length = 0;

        // if we are editing, destroying the row will stop editing
        this.stopEditing();

        const destroyCellCtrls = (ctrls: CellCtrlListAndMap): CellCtrlListAndMap => {
            ctrls.list.forEach((c) => c.destroy());
            return { list: [], map: {} };
        };

        this.centerCellCtrls = destroyCellCtrls(this.centerCellCtrls);
        this.leftCellCtrls = destroyCellCtrls(this.leftCellCtrls);
        this.rightCellCtrls = destroyCellCtrls(this.rightCellCtrls);
    }

    private setFocusedClasses(gui?: RowGui): void {
        this.forEachGui(gui, (gui) => {
            gui.rowComp.addOrRemoveCssClass('ag-row-focus', this.rowFocused);
            gui.rowComp.addOrRemoveCssClass('ag-row-no-focus', !this.rowFocused);
        });
    }

    private onCellFocusChanged(): void {
        const rowFocused = this.beans.focusSvc.isRowFocused(this.rowNode.rowIndex!, this.rowNode.rowPinned);

        if (rowFocused !== this.rowFocused) {
            this.rowFocused = rowFocused;
            this.setFocusedClasses();
        }

        // if we are editing, then moving the focus out of a row will stop editing
        if (!rowFocused && this.editingRow) {
            this.stopEditing(false);
        }
    }

    private onPaginationChanged(): void {
        const currentPage = this.beans.pagination?.getCurrentPage() ?? 0;
        // it is possible this row is in the new page, but the page number has changed, which means
        // it needs to reposition itself relative to the new page
        if (this.paginationPage !== currentPage) {
            this.paginationPage = currentPage;
            this.onTopChanged();
        }

        this.refreshFirstAndLastRowStyles();
    }

    private onTopChanged(): void {
        this.setRowTop(this.rowNode.rowTop!);
    }

    private onPaginationPixelOffsetChanged(): void {
        // the pixel offset is used when calculating rowTop to set on the row DIV
        this.onTopChanged();
    }

    // applies pagination offset, eg if on second page, and page height is 500px, then removes
    // 500px from the top position, so a row with rowTop 600px is displayed at location 100px.
    // reverse will take the offset away rather than add.
    private applyPaginationOffset(topPx: number, reverse = false): number {
        if (this.rowNode.isRowPinned() || this.rowNode.sticky) {
            return topPx;
        }

        const pixelOffset = this.beans.pageBounds.getPixelOffset();
        const multiplier = reverse ? 1 : -1;

        return topPx + pixelOffset * multiplier;
    }

    public setRowTop(pixels: number): void {
        // print layout uses normal flow layout for row positioning
        if (this.printLayout) {
            return;
        }

        // need to make sure rowTop is not null, as this can happen if the node was once
        // visible (ie parent group was expanded) but is now not visible
        if (_exists(pixels)) {
            const afterPaginationPixels = this.applyPaginationOffset(pixels);
            const skipScaling = this.rowNode.isRowPinned() || this.rowNode.sticky;
            const afterScalingPixels = skipScaling
                ? afterPaginationPixels
                : this.beans.rowContainerHeight.getRealPixelPosition(afterPaginationPixels);
            const topPx = `${afterScalingPixels}px`;
            this.setRowTopStyle(topPx);
        }
    }

    // the top needs to be set into the DOM element when the element is created, not updated afterwards.
    // otherwise the transition would not work, as it would be transitioning from zero (the unset value).
    // for example, suppose a row that is outside the viewport, then user does a filter to remove other rows
    // and this row now appears in the viewport, and the row moves up (ie it was under the viewport and not rendered,
    // but now is in the viewport) then a new RowComp is created, however it should have it's position initialised
    // to below the viewport, so the row will appear to animate up. if we didn't set the initial position at creation
    // time, the row would animate down (ie from position zero).
    public getInitialRowTop(rowContainerType: RowContainerType): string | undefined {
        return this.suppressRowTransform ? this.getInitialRowTopShared(rowContainerType) : undefined;
    }
    public getInitialTransform(rowContainerType: RowContainerType): string | undefined {
        return this.suppressRowTransform ? undefined : `translateY(${this.getInitialRowTopShared(rowContainerType)})`;
    }
    private getInitialRowTopShared(rowContainerType: RowContainerType): string {
        // print layout uses normal flow layout for row positioning
        if (this.printLayout) {
            return '';
        }

        const rowNode = this.rowNode;
        let rowTop: number;
        if (this.isSticky()) {
            rowTop = rowNode.stickyRowTop;
        } else {
            // if sliding in, we take the old row top. otherwise we just set the current row top.
            const pixels = this.slideInAnimation[rowContainerType]
                ? this.roundRowTopToBounds(rowNode.oldRowTop!)
                : rowNode.rowTop;
            const afterPaginationPixels = this.applyPaginationOffset(pixels!);
            // we don't apply scaling if row is pinned
            rowTop = rowNode.isRowPinned()
                ? afterPaginationPixels
                : this.beans.rowContainerHeight.getRealPixelPosition(afterPaginationPixels);
        }

        return rowTop + 'px';
    }

    private setRowTopStyle(topPx: string): void {
        this.allRowGuis.forEach((gui) =>
            this.suppressRowTransform ? gui.rowComp.setTop(topPx) : gui.rowComp.setTransform(`translateY(${topPx})`)
        );
    }

    public getRowNode(): RowNode {
        return this.rowNode;
    }

    public getCellCtrl(column: AgColumn): CellCtrl | null {
        // first up, check for cell directly linked to this column
        let res: CellCtrl | null = null;
        this.getAllCellCtrls().forEach((cellCtrl) => {
            if (cellCtrl.getColumn() == column) {
                res = cellCtrl;
            }
        });

        if (res != null) {
            return res;
        }

        // second up, if not found, then check for spanned cols.
        // we do this second (and not at the same time) as this is
        // more expensive, as spanning cols is a
        // infrequently used feature so we don't need to do this most
        // of the time
        this.getAllCellCtrls().forEach((cellCtrl) => {
            if (cellCtrl.getColSpanningList().indexOf(column) >= 0) {
                res = cellCtrl;
            }
        });

        return res;
    }

    private onRowIndexChanged(): void {
        // we only bother updating if the rowIndex is present. if it is not present, it means this row
        // is child of a group node, and the group node was closed, it's the only way to have no row index.
        // when this happens, row is about to be de-rendered, so we don't care, rowComp is about to die!
        if (this.rowNode.rowIndex != null) {
            this.onCellFocusChanged();
            this.updateRowIndexes();
            this.postProcessCss();
        }
    }

    public getRowIndex() {
        return this.rowNode.getRowIndexString();
    }

    private updateRowIndexes(gui?: RowGui): void {
        const rowIndexStr = this.rowNode.getRowIndexString();

        if (rowIndexStr === null) {
            return;
        }

        const headerRowCount =
            (this.beans.ctrlsSvc.getHeaderRowContainerCtrl()?.getRowCount() ?? 0) +
            (this.beans.filterManager?.getHeaderRowCount() ?? 0);
        const rowIsEven = this.rowNode.rowIndex! % 2 === 0;
        const ariaRowIndex = headerRowCount + this.rowNode.rowIndex! + 1;

        this.forEachGui(gui, (c) => {
            c.rowComp.setRowIndex(rowIndexStr);
            c.rowComp.addOrRemoveCssClass('ag-row-even', rowIsEven);
            c.rowComp.addOrRemoveCssClass('ag-row-odd', !rowIsEven);
            _setAriaRowIndex(c.element, ariaRowIndex);
        });
    }

    public setStoppingRowEdit(stoppingRowEdit: boolean): void {
        this.stoppingRowEdit = stoppingRowEdit;
    }
}
