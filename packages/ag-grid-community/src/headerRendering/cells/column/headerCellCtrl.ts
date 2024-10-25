import type { ResizeFeature } from '../../../columnResize/resizeFeature';
import { setupCompBean } from '../../../components/emptyBean';
import { _getHeaderCompDetails } from '../../../components/framework/userCompUtils';
import { KeyCode } from '../../../constants/keyCode';
import type { BeanStub } from '../../../context/beanStub';
import type { AgColumn } from '../../../entities/agColumn';
import type { SortDirection } from '../../../entities/colDef';
import { _getActiveDomElement, _isLegacyMenuEnabled } from '../../../gridOptionsUtils';
import { ColumnHighlightPosition } from '../../../interfaces/iColumn';
import type { UserCompDetails } from '../../../interfaces/iUserCompDetails';
import { SetLeftFeature } from '../../../rendering/features/setLeftFeature';
import type { SelectAllFeature } from '../../../selection/selectAllFeature';
import type { TooltipFeature } from '../../../tooltip/tooltipFeature';
import type { ColumnSortState } from '../../../utils/aria';
import { _getAriaSortState } from '../../../utils/aria';
import { _setDisplayed } from '../../../utils/dom';
import { ManagedFocusFeature } from '../../../widgets/managedFocusFeature';
import { getColumnHeaderRowHeight, getGroupRowsHeight } from '../../headerUtils';
import type { HeaderRowCtrl } from '../../row/headerRowCtrl';
import type { IAbstractHeaderCellComp } from '../abstractCell/abstractHeaderCellCtrl';
import { AbstractHeaderCellCtrl } from '../abstractCell/abstractHeaderCellCtrl';
import { _getHeaderClassesFromColDef } from '../cssClassApplier';
import type { IHeader, IHeaderParams } from './headerComp';
import { HeaderComp } from './headerComp';

export interface IHeaderCellComp extends IAbstractHeaderCellComp {
    setWidth(width: string): void;
    setAriaSort(sort?: ColumnSortState): void;
    setUserCompDetails(compDetails: UserCompDetails): void;
    getUserCompInstance(): IHeader | undefined;
}

type HeaderAriaDescriptionKey = 'filter' | 'menu' | 'sort' | 'selectAll' | 'filterButton';
type RefreshFunction = 'updateSortable' | 'tooltip' | 'headerClasses' | 'wrapText' | 'measuring' | 'resize';

export class HeaderCellCtrl extends AbstractHeaderCellCtrl<IHeaderCellComp, AgColumn, ResizeFeature> {
    private refreshFunctions: { [key in RefreshFunction]?: () => void } = {};
    private selectAllFeature?: SelectAllFeature;

    private sortable: boolean | null | undefined;
    private displayName: string | null;
    private draggable: boolean;
    private menuEnabled: boolean;
    private openFilterEnabled: boolean;
    private dragSourceElement: HTMLElement | undefined;

    private userCompDetails: UserCompDetails;

    private userHeaderClasses: Set<string> = new Set();
    private ariaDescriptionProperties = new Map<HeaderAriaDescriptionKey, string>();
    private tooltipFeature: TooltipFeature | undefined;

    constructor(column: AgColumn, parentRowCtrl: HeaderRowCtrl) {
        super(column, parentRowCtrl);
        this.column = column;
    }

    public setComp(
        comp: IHeaderCellComp,
        eGui: HTMLElement,
        eResize: HTMLElement,
        eHeaderCompWrapper: HTMLElement,
        compBeanInput: BeanStub | undefined
    ): void {
        this.comp = comp;
        const compBean = setupCompBean(this, this.beans.context, compBeanInput);

        this.setGui(eGui, compBean);
        this.updateState();
        this.setupWidth(compBean);
        this.setupMovingCss(compBean);
        this.setupMenuClass(compBean);
        this.setupSortableClass(compBean);
        this.setupWrapTextClass();
        this.refreshSpanHeaderHeight();

        this.setupAutoHeight({
            wrapperElement: eHeaderCompWrapper,
            checkMeasuringCallback: (checkMeasuring) => this.setRefreshFunction('measuring', checkMeasuring),
            compBean,
        });

        this.addColumnHoverListener(compBean);
        this.setupFilterClass(compBean);
        this.setupClassesFromColDef();
        this.setupTooltip();
        this.addActiveHeaderMouseListeners(compBean);
        this.setupSelectAll(compBean);
        this.setupUserComp();
        this.refreshAria();

        if (this.beans.colResize) {
            this.resizeFeature = compBean.createManagedBean(
                this.beans.colResize.createResizeFeature(this.getPinned(), this.column, eResize, comp, this)
            );
        } else {
            _setDisplayed(eResize, false);
        }
        this.beans.colHover?.createHoverFeature(compBean, [this.column], eGui);
        compBean.createManagedBean(new SetLeftFeature(this.column, eGui, this.beans));
        compBean.createManagedBean(
            new ManagedFocusFeature(eGui, {
                shouldStopEventPropagation: (e) => this.shouldStopEventPropagation(e),
                onTabKeyDown: () => null,
                handleKeyDown: this.handleKeyDown.bind(this),
                onFocusIn: this.onFocusIn.bind(this),
                onFocusOut: this.onFocusOut.bind(this),
            })
        );

        this.addResizeAndMoveKeyboardListeners(compBean);

        compBean.addManagedPropertyListeners(
            ['suppressMovableColumns', 'suppressMenuHide', 'suppressAggFuncInHeader'],
            () => this.refresh()
        );
        compBean.addManagedListeners(this.column, { colDefChanged: () => this.refresh() });
        compBean.addManagedListeners(this.column, { headerHighlightChanged: this.onHeaderHighlightChanged.bind(this) });

        const listener = () => this.checkDisplayName();
        compBean.addManagedEventListeners({
            columnValueChanged: listener,
            columnRowGroupChanged: listener,
            columnPivotChanged: listener,
            headerHeightChanged: this.onHeaderHeightChanged.bind(this),
        });

        compBean.addDestroyFunc(() => {
            this.refreshFunctions = {};
            (this.selectAllFeature as any) = null;
            this.dragSourceElement = undefined;
            (this.userCompDetails as any) = null;
            this.userHeaderClasses.clear();
            this.ariaDescriptionProperties.clear();
            // Make sure this is the last destroy func as it clears the gui and comp
            this.clearComponent();
        });
    }

    protected resizeHeader(delta: number, shiftKey: boolean): void {
        this.beans.colResize?.resizeHeader(this.column, delta, shiftKey);
    }

    private setupUserComp(): void {
        const compDetails = this.lookupUserCompDetails();
        this.setCompDetails(compDetails);
    }

    private setCompDetails(compDetails: UserCompDetails): void {
        this.userCompDetails = compDetails;
        this.comp.setUserCompDetails(compDetails);
    }

    private lookupUserCompDetails(): UserCompDetails {
        const params = this.createParams();
        const colDef = this.column.getColDef();
        return _getHeaderCompDetails(this.userCompFactory, colDef, params)!;
    }

    private createParams(): IHeaderParams {
        const params: IHeaderParams = this.gos.addGridCommonParams({
            column: this.column,
            displayName: this.displayName!,
            enableSorting: this.column.isSortable(),
            enableMenu: this.menuEnabled,
            enableFilterButton: this.openFilterEnabled && !!this.menuSvc?.isHeaderFilterButtonEnabled(this.column),
            enableFilterIcon: !this.openFilterEnabled || _isLegacyMenuEnabled(this.gos),
            showColumnMenu: (buttonElement: HTMLElement) => {
                this.menuSvc?.showColumnMenu({
                    column: this.column,
                    buttonElement,
                    positionBy: 'button',
                });
            },
            showColumnMenuAfterMouseClick: (mouseEvent: MouseEvent | Touch) => {
                this.menuSvc?.showColumnMenu({
                    column: this.column,
                    mouseEvent,
                    positionBy: 'mouse',
                });
            },
            showFilter: (buttonElement: HTMLElement) => {
                this.menuSvc?.showFilterMenu({
                    column: this.column,
                    buttonElement: buttonElement,
                    containerType: 'columnFilter',
                    positionBy: 'button',
                });
            },
            progressSort: (multiSort?: boolean) => {
                this.beans.sortSvc?.progressSort(this.column, !!multiSort, 'uiColumnSorted');
            },
            setSort: (sort: SortDirection, multiSort?: boolean) => {
                this.beans.sortSvc?.setSortForColumn(this.column, sort, !!multiSort, 'uiColumnSorted');
            },
            eGridHeader: this.getGui(),
            setTooltip: (value: string, shouldDisplayTooltip: () => boolean) => {
                this.setupTooltip(value, shouldDisplayTooltip);
            },
        });

        return params;
    }

    private setupSelectAll(compBean: BeanStub): void {
        if (!this.beans.selectionSvc) {
            return;
        }
        this.selectAllFeature = compBean.createManagedBean(this.beans.selectionSvc.createSelectAllFeature(this.column));
        this.selectAllFeature.setComp(this);
    }

    public getSelectAllGui(): HTMLElement | undefined {
        return this.selectAllFeature?.getCheckboxGui();
    }

    protected override handleKeyDown(e: KeyboardEvent): void {
        super.handleKeyDown(e);

        if (e.key === KeyCode.SPACE) {
            this.selectAllFeature?.onSpaceKeyDown(e);
        }
        if (e.key === KeyCode.ENTER) {
            this.onEnterKeyDown(e);
        }
        if (e.key === KeyCode.DOWN && e.altKey) {
            this.showMenuOnKeyPress(e, false);
        }
    }

    private onEnterKeyDown(e: KeyboardEvent): void {
        if (e.ctrlKey || e.metaKey) {
            this.showMenuOnKeyPress(e, true);
        } else if (this.sortable) {
            this.beans.sortSvc?.progressSort(this.column, e.shiftKey, 'uiColumnSorted');
        }
    }

    private showMenuOnKeyPress(e: KeyboardEvent, isFilterShortcut: boolean): void {
        const headerComp = this.comp.getUserCompInstance();
        if (!headerComp || !(headerComp instanceof HeaderComp)) {
            return;
        }

        // the header comp knows what features are enabled, so let it handle the shortcut
        if (headerComp.onMenuKeyboardShortcut(isFilterShortcut)) {
            e.preventDefault();
        }
    }

    private onFocusIn(e: FocusEvent) {
        if (!this.getGui().contains(e.relatedTarget as HTMLElement)) {
            const rowIndex = this.getRowIndex();
            this.focusSvc.setFocusedHeader(rowIndex, this.column);
            this.announceAriaDescription();
        }

        if (this.focusSvc.isKeyboardMode()) {
            this.setActiveHeader(true);
        }
    }

    private onFocusOut(e: FocusEvent) {
        if (this.getGui().contains(e.relatedTarget as HTMLElement)) {
            return;
        }

        this.setActiveHeader(false);
    }

    private setupTooltip(value?: string, shouldDisplayTooltip?: () => boolean): void {
        this.tooltipFeature = this.beans.tooltipSvc?.setupHeaderTooltip(
            this.tooltipFeature,
            this,
            value,
            shouldDisplayTooltip
        );
    }

    private setupClassesFromColDef(): void {
        const refreshHeaderClasses = () => {
            const colDef = this.column.getColDef();
            const classes = _getHeaderClassesFromColDef(colDef, this.gos, this.column, null);

            const oldClasses = this.userHeaderClasses;
            this.userHeaderClasses = new Set(classes);

            classes.forEach((c) => {
                if (oldClasses.has(c)) {
                    // class already added, no need to apply it, but remove from old set
                    oldClasses.delete(c);
                } else {
                    // class new since last time, so apply it
                    this.comp.addOrRemoveCssClass(c, true);
                }
            });

            // now old set only has classes that were applied last time, but not this time, so remove them
            oldClasses.forEach((c) => this.comp.addOrRemoveCssClass(c, false));
        };

        this.setRefreshFunction('headerClasses', refreshHeaderClasses);
        refreshHeaderClasses();
    }

    public setDragSource(eSource: HTMLElement | undefined): void {
        this.dragSourceElement = eSource;
        this.removeDragSource();

        if (!eSource || !this.draggable) {
            return;
        }

        this.dragSource = this.beans.colMoves?.setDragSourceForHeader(eSource, this.column, this.displayName) ?? null;
    }

    private updateState(): void {
        this.menuEnabled = !!this.menuSvc?.isColumnMenuInHeaderEnabled(this.column);
        this.openFilterEnabled = !!this.menuSvc?.isFilterMenuInHeaderEnabled(this.column);
        this.sortable = this.column.isSortable();
        this.displayName = this.calculateDisplayName();
        this.draggable = this.workOutDraggable();
    }

    public setRefreshFunction(name: RefreshFunction, func: () => void): void {
        this.refreshFunctions[name] = func;
    }

    private refresh(): void {
        this.updateState();
        this.refreshHeaderComp();
        this.refreshAria();
        Object.values(this.refreshFunctions).forEach((f) => f());
    }

    private refreshHeaderComp(): void {
        const newCompDetails = this.lookupUserCompDetails();

        const compInstance = this.comp.getUserCompInstance();

        // only try refresh if old comp exists adn it is the correct type
        const attemptRefresh =
            compInstance != null && this.userCompDetails.componentClass == newCompDetails.componentClass;

        const headerCompRefreshed = attemptRefresh ? this.attemptHeaderCompRefresh(newCompDetails.params) : false;

        if (headerCompRefreshed) {
            // we do this as a refresh happens after colDefs change, and it's possible the column has had it's
            // draggable property toggled. no need to call this if not refreshing, as setDragSource is done
            // as part of appendHeaderComp
            this.setDragSource(this.dragSourceElement);
        } else {
            this.setCompDetails(newCompDetails);
        }
    }

    public attemptHeaderCompRefresh(params: IHeaderParams): boolean {
        const headerComp = this.comp.getUserCompInstance();
        if (!headerComp) {
            return false;
        }

        // if no refresh method, then we want to replace the headerComp
        if (!headerComp.refresh) {
            return false;
        }

        const res = headerComp.refresh(params);

        return res;
    }

    private calculateDisplayName(): string | null {
        return this.beans.colNames.getDisplayNameForColumn(this.column, 'header', true);
    }

    private checkDisplayName(): void {
        // display name can change if aggFunc different, eg sum(Gold) is now max(Gold)
        if (this.displayName !== this.calculateDisplayName()) {
            this.refresh();
        }
    }

    private workOutDraggable(): boolean {
        const colDef = this.column.getColDef();
        const isSuppressMovableColumns = this.gos.get('suppressMovableColumns');

        const colCanMove = !isSuppressMovableColumns && !colDef.suppressMovable && !colDef.lockPosition;

        // we should still be allowed drag the column, even if it can't be moved, if the column
        // can be dragged to a rowGroup or pivot drop zone
        return !!colCanMove || !!colDef.enableRowGroup || !!colDef.enablePivot;
    }

    private setupWidth(compBean: BeanStub): void {
        const listener = () => {
            const columnWidth = this.column.getActualWidth();
            this.comp.setWidth(`${columnWidth}px`);
        };

        compBean.addManagedListeners(this.column, { widthChanged: listener });
        listener();
    }

    private setupMovingCss(compBean: BeanStub): void {
        const listener = () => {
            // this is what makes the header go dark when it is been moved (gives impression to
            // user that the column was picked up).
            this.comp.addOrRemoveCssClass('ag-header-cell-moving', this.column.isMoving());
        };

        compBean.addManagedListeners(this.column, { movingChanged: listener });
        listener();
    }

    private setupMenuClass(compBean: BeanStub): void {
        const listener = () => {
            this.comp.addOrRemoveCssClass('ag-column-menu-visible', this.column.isMenuVisible());
        };

        compBean.addManagedListeners(this.column, { menuVisibleChanged: listener });
        listener();
    }

    private setupSortableClass(compBean: BeanStub): void {
        const updateSortableCssClass = () => {
            this.comp.addOrRemoveCssClass('ag-header-cell-sortable', !!this.sortable);
        };

        updateSortableCssClass();

        this.setRefreshFunction('updateSortable', updateSortableCssClass);
        compBean.addManagedEventListeners({ sortChanged: this.refreshAriaSort.bind(this) });
    }

    private setupFilterClass(compBean: BeanStub): void {
        const listener = () => {
            const isFilterActive = this.column.isFilterActive();
            this.comp.addOrRemoveCssClass('ag-header-cell-filtered', isFilterActive);
            this.refreshAria();
        };

        compBean.addManagedListeners(this.column, { filterActiveChanged: listener });
        listener();
    }

    private setupWrapTextClass() {
        const listener = () => {
            const wrapText = !!this.column.getColDef().wrapHeaderText;
            this.comp.addOrRemoveCssClass('ag-header-cell-wrap-text', wrapText);
        };
        listener();
        this.setRefreshFunction('wrapText', listener);
    }

    private onHeaderHighlightChanged(): void {
        const highlighted = this.column.getHighlighted();
        const beforeOn = highlighted === ColumnHighlightPosition.Before;
        const afterOn = highlighted === ColumnHighlightPosition.After;

        this.comp.addOrRemoveCssClass('ag-header-highlight-before', beforeOn);
        this.comp.addOrRemoveCssClass('ag-header-highlight-after', afterOn);
    }

    protected override onDisplayedColumnsChanged(): void {
        super.onDisplayedColumnsChanged();
        if (!this.isAlive()) {
            return;
        }
        this.onHeaderHeightChanged();
    }

    private onHeaderHeightChanged() {
        this.refreshSpanHeaderHeight();
    }

    private refreshSpanHeaderHeight() {
        const { eGui, column, comp, beans } = this;
        const groupHeaderHeight = getGroupRowsHeight(this.beans);
        const isZeroGroupHeight = groupHeaderHeight.reduce((total, next) => (total += next), 0) === 0;

        comp.addOrRemoveCssClass('ag-header-parent-hidden', isZeroGroupHeight);

        if (!column.isSpanHeaderHeight()) {
            eGui.style.removeProperty('top');
            eGui.style.removeProperty('height');
            comp.addOrRemoveCssClass('ag-header-span-height', false);
            comp.addOrRemoveCssClass('ag-header-span-total', false);
            return;
        }

        const { numberOfParents, isSpanningTotal } = this.column.getColumnGroupPaddingInfo();

        comp.addOrRemoveCssClass('ag-header-span-height', numberOfParents > 0);

        const headerHeight = getColumnHeaderRowHeight(beans);

        if (numberOfParents === 0) {
            // if spanning has stopped then need to reset these values.
            comp.addOrRemoveCssClass('ag-header-span-total', false);
            eGui.style.setProperty('top', `0px`);
            eGui.style.setProperty('height', `${headerHeight}px`);
            return;
        }

        comp.addOrRemoveCssClass('ag-header-span-total', isSpanningTotal);

        let extraHeight = 0;
        for (let i = 0; i < numberOfParents; i++) {
            extraHeight += groupHeaderHeight[groupHeaderHeight.length - 1 - i];
        }

        eGui.style.setProperty('top', `${-extraHeight}px`);
        eGui.style.setProperty('height', `${headerHeight + extraHeight}px`);
    }

    private refreshAriaSort(): void {
        if (this.sortable) {
            const translate = this.getLocaleTextFunc();
            const sort = this.beans.sortSvc?.getDisplaySortForColumn(this.column) || null;
            this.comp.setAriaSort(_getAriaSortState(sort));
            this.setAriaDescriptionProperty('sort', translate('ariaSortableColumn', 'Press ENTER to sort'));
        } else {
            this.comp.setAriaSort();
            this.setAriaDescriptionProperty('sort', null);
        }
    }

    private refreshAriaMenu(): void {
        if (this.menuEnabled) {
            const translate = this.getLocaleTextFunc();
            this.setAriaDescriptionProperty('menu', translate('ariaMenuColumn', 'Press ALT DOWN to open column menu'));
        } else {
            this.setAriaDescriptionProperty('menu', null);
        }
    }

    private refreshAriaFilterButton(): void {
        if (this.openFilterEnabled && !_isLegacyMenuEnabled(this.gos)) {
            const translate = this.getLocaleTextFunc();
            this.setAriaDescriptionProperty(
                'filterButton',
                translate('ariaFilterColumn', 'Press CTRL ENTER to open filter')
            );
        } else {
            this.setAriaDescriptionProperty('filterButton', null);
        }
    }

    private refreshAriaFiltered(): void {
        const translate = this.getLocaleTextFunc();
        const isFilterActive = this.column.isFilterActive();
        if (isFilterActive) {
            this.setAriaDescriptionProperty('filter', translate('ariaColumnFiltered', 'Column Filtered'));
        } else {
            this.setAriaDescriptionProperty('filter', null);
        }
    }

    public setAriaDescriptionProperty(property: HeaderAriaDescriptionKey, value: string | null): void {
        if (value != null) {
            this.ariaDescriptionProperties.set(property, value);
        } else {
            this.ariaDescriptionProperties.delete(property);
        }
    }

    public announceAriaDescription(): void {
        if (!this.eGui.contains(_getActiveDomElement(this.beans.gos))) {
            return;
        }
        const ariaDescription = Array.from(this.ariaDescriptionProperties.keys())
            // always announce the filter description first
            .sort((a: string, b: string) => (a === 'filter' ? -1 : b.charCodeAt(0) - a.charCodeAt(0)))
            .map((key: HeaderAriaDescriptionKey) => this.ariaDescriptionProperties.get(key))
            .join('. ');

        this.beans.ariaAnnounce.announceValue(ariaDescription, 'columnHeader');
    }

    private refreshAria(): void {
        this.refreshAriaSort();
        this.refreshAriaMenu();
        this.refreshAriaFilterButton();
        this.refreshAriaFiltered();
    }

    private addColumnHoverListener(compBean: BeanStub): void {
        this.beans.colHover?.addHeaderColumnHoverListener(compBean, this.comp, this.column);
    }

    public getColId(): string {
        return this.column.getColId();
    }

    private addActiveHeaderMouseListeners(compBean: BeanStub): void {
        const listener = (e: MouseEvent) => this.handleMouseOverChange(e.type === 'mouseenter');
        const clickListener = () => this.dispatchColumnMouseEvent('columnHeaderClicked', this.column);
        const contextMenuListener = (event: MouseEvent) =>
            this.handleContextMenuMouseEvent(event, undefined, this.column);

        compBean.addManagedListeners(this.getGui(), {
            mouseenter: listener,
            mouseleave: listener,
            click: clickListener,
            contextmenu: contextMenuListener,
        });
    }

    private handleMouseOverChange(isMouseOver: boolean): void {
        this.setActiveHeader(isMouseOver);

        this.eventSvc.dispatchEvent({
            type: isMouseOver ? 'columnHeaderMouseOver' : 'columnHeaderMouseLeave',
            column: this.column,
        });
    }

    private setActiveHeader(active: boolean): void {
        this.comp.addOrRemoveCssClass('ag-header-active', active);
    }

    public getAnchorElementForMenu(isFilter?: boolean): HTMLElement {
        const headerComp = this.comp.getUserCompInstance();
        if (headerComp instanceof HeaderComp) {
            return headerComp.getAnchorElementForMenu(isFilter);
        }
        return this.getGui();
    }

    public override destroy(): void {
        this.tooltipFeature = this.destroyBean(this.tooltipFeature);
        super.destroy();
    }
}
