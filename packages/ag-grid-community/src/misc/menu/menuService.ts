import type { NamedBean } from '../../context/bean';
import { BeanStub } from '../../context/beanStub';
import type { BeanCollection } from '../../context/context';
import type { CtrlsService } from '../../ctrlsService';
import type { AgColumn } from '../../entities/agColumn';
import { isColumn } from '../../entities/agColumn';
import type { AgProvidedColumnGroup } from '../../entities/agProvidedColumnGroup';
import type { FilterManager } from '../../filter/filterManager';
import { _isLegacyMenuEnabled } from '../../gridOptionsUtils';
import type { HeaderCellCtrl } from '../../headerRendering/cells/column/headerCellCtrl';
import type { ContainerType } from '../../interfaces/iAfterGuiAttachedParams';
import type { Column } from '../../interfaces/iColumn';
import type { IContextMenuService } from '../../interfaces/iContextMenu';
import type { IMenuFactory } from '../../interfaces/iMenuFactory';
import { _isIOSUserAgent } from '../../utils/browser';
import { _requestAnimationFrame } from '../animationFrameService';

interface BaseShowColumnMenuParams {
    column?: Column;
}

interface BaseShowFilterMenuParams {
    column: Column;
    containerType: ContainerType;
}

interface MouseShowMenuParams {
    mouseEvent: MouseEvent | Touch;
    positionBy: 'mouse';
}

interface ButtonShowMenuParams {
    buttonElement: HTMLElement;
    positionBy: 'button';
}

interface AutoShowMenuParams {
    positionBy: 'auto';
}

export type ShowColumnMenuParams = (MouseShowMenuParams | ButtonShowMenuParams | AutoShowMenuParams) &
    BaseShowColumnMenuParams;

export type ShowFilterMenuParams = (MouseShowMenuParams | ButtonShowMenuParams | AutoShowMenuParams) &
    BaseShowFilterMenuParams;

export class MenuService extends BeanStub implements NamedBean {
    beanName = 'menuSvc' as const;

    private filterMenuFactory: IMenuFactory;
    private ctrlsSvc: CtrlsService;
    private filterManager?: FilterManager;
    private contextMenuSvc?: IContextMenuService;
    private enterpriseMenuFactory?: IMenuFactory;

    public wireBeans(beans: BeanCollection): void {
        this.filterMenuFactory = beans.filterMenuFactory!;
        this.ctrlsSvc = beans.ctrlsSvc;
        this.filterManager = beans.filterManager;
        this.contextMenuSvc = beans.contextMenuSvc;
        this.enterpriseMenuFactory = beans.enterpriseMenuFactory;
    }

    private activeMenuFactory: IMenuFactory;

    public postConstruct(): void {
        this.activeMenuFactory = this.enterpriseMenuFactory ?? this.filterMenuFactory;
    }

    public showColumnMenu(params: ShowColumnMenuParams): void {
        this.showColumnMenuCommon(this.activeMenuFactory, params, 'columnMenu');
    }

    public showFilterMenu(params: ShowFilterMenuParams): void {
        const menuFactory: IMenuFactory =
            this.enterpriseMenuFactory && _isLegacyMenuEnabled(this.gos)
                ? this.enterpriseMenuFactory
                : this.filterMenuFactory;
        this.showColumnMenuCommon(menuFactory, params, params.containerType, true);
    }

    public showHeaderContextMenu(
        column: AgColumn | AgProvidedColumnGroup | undefined,
        mouseEvent?: MouseEvent,
        touchEvent?: TouchEvent
    ): void {
        this.activeMenuFactory.showMenuAfterContextMenuEvent(column, mouseEvent, touchEvent);
    }

    public hidePopupMenu(): void {
        // hide the context menu if in enterprise
        this.contextMenuSvc?.hideActiveMenu();
        // and hide the column menu always
        this.activeMenuFactory.hideActiveMenu();
    }

    public isColumnMenuInHeaderEnabled(column: AgColumn): boolean {
        const { suppressHeaderMenuButton } = column.getColDef();
        return (
            !suppressHeaderMenuButton &&
            this.activeMenuFactory.isMenuEnabled(column) &&
            (_isLegacyMenuEnabled(this.gos) || !!this.enterpriseMenuFactory)
        );
    }

    public isFilterMenuInHeaderEnabled(column: AgColumn): boolean {
        return !column.getColDef().suppressHeaderFilterButton && !!this.filterManager?.isFilterAllowed(column);
    }

    public isHeaderContextMenuEnabled(column?: AgColumn | AgProvidedColumnGroup): boolean {
        const colDef = column && isColumn(column) ? column.getColDef() : column?.getColGroupDef();
        return !colDef?.suppressHeaderContextMenu && this.gos.get('columnMenu') === 'new';
    }

    public isHeaderMenuButtonAlwaysShowEnabled(): boolean {
        return this.isSuppressMenuHide();
    }

    public isHeaderMenuButtonEnabled(): boolean {
        // we don't show the menu if on an iPad/iPhone, as the user cannot have a pointer device/
        // However if suppressMenuHide is set to true the menu will be displayed alwasys, so it's ok
        // to show it on iPad in this case (as hover isn't needed). If suppressMenuHide
        // is false (default) user will need to use longpress to display the menu.
        const menuHides = !this.isSuppressMenuHide();

        const onIpadAndMenuHides = _isIOSUserAgent() && menuHides;

        return !onIpadAndMenuHides;
    }

    public isHeaderFilterButtonEnabled(column: AgColumn): boolean {
        return (
            this.isFilterMenuInHeaderEnabled(column) &&
            !_isLegacyMenuEnabled(this.gos) &&
            !this.isFloatingFilterButtonDisplayed(column)
        );
    }

    public isFilterMenuItemEnabled(column: AgColumn): boolean {
        return (
            !!this.filterManager?.isFilterAllowed(column) &&
            !_isLegacyMenuEnabled(this.gos) &&
            !this.isFilterMenuInHeaderEnabled(column) &&
            !this.isFloatingFilterButtonDisplayed(column)
        );
    }

    public isFloatingFilterButtonEnabled(column: AgColumn): boolean {
        return !!column.getColDef().suppressFloatingFilterButton;
    }

    private isFloatingFilterButtonDisplayed(column: AgColumn): boolean {
        return !!column.getColDef().floatingFilter && this.isFloatingFilterButtonEnabled(column);
    }

    private isSuppressMenuHide(): boolean {
        const suppressMenuHide = this.gos.get('suppressMenuHide');
        if (_isLegacyMenuEnabled(this.gos)) {
            // default to false for legacy
            return this.gos.exists('suppressMenuHide') ? suppressMenuHide : false;
        }
        return suppressMenuHide;
    }

    private showColumnMenuCommon(
        menuFactory: IMenuFactory,
        params: ShowColumnMenuParams,
        containerType: ContainerType,
        filtersOnly?: boolean
    ): void {
        const { positionBy } = params;
        const column = params.column as AgColumn | undefined;
        if (positionBy === 'button') {
            const { buttonElement } = params;
            menuFactory.showMenuAfterButtonClick(column, buttonElement, containerType, filtersOnly);
        } else if (positionBy === 'mouse') {
            const { mouseEvent } = params;
            menuFactory.showMenuAfterMouseEvent(column, mouseEvent, containerType, filtersOnly);
        } else if (column) {
            // auto
            this.ctrlsSvc.getGridBodyCtrl().getScrollFeature().ensureColumnVisible(column, 'auto');
            // make sure we've finished scrolling into view before displaying the menu
            _requestAnimationFrame(this.gos, () => {
                const headerCellCtrl = this.ctrlsSvc
                    .getHeaderRowContainerCtrl(column.getPinned())
                    ?.getHeaderCtrlForColumn(column) as HeaderCellCtrl | undefined;

                if (headerCellCtrl) {
                    menuFactory.showMenuAfterButtonClick(
                        column,
                        headerCellCtrl.getAnchorElementForMenu(filtersOnly),
                        containerType,
                        true
                    );
                }
            });
        }
    }
}
