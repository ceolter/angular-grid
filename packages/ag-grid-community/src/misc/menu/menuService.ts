import type { NamedBean } from '../../context/bean';
import { BeanStub } from '../../context/beanStub';
import type { AgColumn } from '../../entities/agColumn';
import { isColumn } from '../../entities/agColumn';
import type { AgProvidedColumnGroup } from '../../entities/agProvidedColumnGroup';
import type { ColumnEventType } from '../../events';
import { _isLegacyMenuEnabled } from '../../gridOptionsUtils';
import type { HeaderCellCtrl } from '../../headerRendering/cells/column/headerCellCtrl';
import type { ContainerType } from '../../interfaces/iAfterGuiAttachedParams';
import type { Column } from '../../interfaces/iColumn';
import type { IMenuFactory } from '../../interfaces/iMenuFactory';
import { _isIOSUserAgent } from '../../utils/browser';
import { _requestAnimationFrame } from '../animationFrameService';

interface BaseShowColumnMenuParams {
    column?: Column;
    onClosedCallback?: () => void;
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

    private activeMenuFactory?: IMenuFactory;

    public postConstruct(): void {
        const { enterpriseMenuFactory, filterMenuFactory } = this.beans;
        this.activeMenuFactory = enterpriseMenuFactory ?? filterMenuFactory;
    }

    public showColumnMenu(params: ShowColumnMenuParams): void {
        this.showColumnMenuCommon(this.activeMenuFactory, params, 'columnMenu');
    }

    public showFilterMenu(params: ShowFilterMenuParams): void {
        const { enterpriseMenuFactory, filterMenuFactory } = this.beans;
        const menuFactory =
            enterpriseMenuFactory && _isLegacyMenuEnabled(this.gos) ? enterpriseMenuFactory : filterMenuFactory;
        this.showColumnMenuCommon(menuFactory, params, params.containerType, true);
    }

    public showHeaderContextMenu(
        column: AgColumn | AgProvidedColumnGroup | undefined,
        mouseEvent?: MouseEvent,
        touchEvent?: TouchEvent
    ): void {
        this.activeMenuFactory?.showMenuAfterContextMenuEvent(column, mouseEvent, touchEvent);
    }

    public hidePopupMenu(): void {
        // hide the context menu if in enterprise
        this.beans.contextMenuSvc?.hideActiveMenu();
        // and hide the column menu always
        this.activeMenuFactory?.hideActiveMenu();
    }

    public isColumnMenuInHeaderEnabled(column: AgColumn): boolean {
        const { suppressHeaderMenuButton } = column.getColDef();
        return (
            !suppressHeaderMenuButton &&
            !!this.activeMenuFactory?.isMenuEnabled(column) &&
            (_isLegacyMenuEnabled(this.gos) || !!this.beans.enterpriseMenuFactory)
        );
    }

    public isFilterMenuInHeaderEnabled(column: AgColumn): boolean {
        return !column.getColDef().suppressHeaderFilterButton && !!this.beans.filterManager?.isFilterAllowed(column);
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
            !!this.beans.filterManager?.isFilterAllowed(column) &&
            !_isLegacyMenuEnabled(this.gos) &&
            !this.isFilterMenuInHeaderEnabled(column) &&
            !this.isFloatingFilterButtonDisplayed(column)
        );
    }

    public isFloatingFilterButtonEnabled(column: AgColumn): boolean {
        return !column.getColDef().suppressFloatingFilterButton;
    }

    private isFloatingFilterButtonDisplayed(column: AgColumn): boolean {
        return !!column.getColDef().floatingFilter && this.isFloatingFilterButtonEnabled(column);
    }

    private isSuppressMenuHide(): boolean {
        const gos = this.gos;
        const suppressMenuHide = gos.get('suppressMenuHide');
        if (_isLegacyMenuEnabled(gos)) {
            // default to false for legacy
            return gos.exists('suppressMenuHide') ? suppressMenuHide : false;
        }
        return suppressMenuHide;
    }

    private showColumnMenuCommon(
        menuFactory: IMenuFactory | undefined,
        params: ShowColumnMenuParams,
        containerType: ContainerType,
        filtersOnly?: boolean
    ): void {
        const { positionBy, onClosedCallback } = params;
        const column = params.column as AgColumn | undefined;
        if (positionBy === 'button') {
            const { buttonElement } = params;
            menuFactory?.showMenuAfterButtonClick(column, buttonElement, containerType, onClosedCallback, filtersOnly);
        } else if (positionBy === 'mouse') {
            const { mouseEvent } = params;
            menuFactory?.showMenuAfterMouseEvent(column, mouseEvent, containerType, onClosedCallback, filtersOnly);
        } else if (column) {
            const beans = this.beans;
            const ctrlsSvc = beans.ctrlsSvc;
            // auto
            ctrlsSvc.getScrollFeature().ensureColumnVisible(column, 'auto');
            // make sure we've finished scrolling into view before displaying the menu
            _requestAnimationFrame(beans, () => {
                const headerCellCtrl = ctrlsSvc
                    .getHeaderRowContainerCtrl(column.getPinned())
                    ?.getHeaderCtrlForColumn(column) as HeaderCellCtrl | undefined;

                if (headerCellCtrl) {
                    menuFactory?.showMenuAfterButtonClick(
                        column,
                        headerCellCtrl.getAnchorElementForMenu(filtersOnly),
                        containerType,
                        onClosedCallback,
                        true
                    );
                }
            });
        }
    }
}

export function _setColMenuVisible(column: AgColumn, visible: boolean, source: ColumnEventType): void {
    if (column.menuVisible !== visible) {
        column.menuVisible = visible;
        column.dispatchColEvent('menuVisibleChanged', source);
    }
}
