import type { ColumnModel } from '../columns/columnModel';
import type { VisibleColsService } from '../columns/visibleColsService';
import { KeyCode } from '../constants/keyCode';
import { BeanStub } from '../context/beanStub';
import type { BeanCollection } from '../context/context';
import type { CtrlsService } from '../ctrlsService';
import type { FilterManager } from '../filter/filterManager';
import type { FocusService } from '../focusService';
import { _getActiveDomElement } from '../gridOptionsUtils';
import { _requestAnimationFrame } from '../misc/animationFrameService';
import type { MenuService } from '../misc/menu/menuService';
import type { HeaderNavigationService } from '../navigation/headerNavigationService';
import type { HeaderNavigationDirection } from '../navigation/headerNavigationService';
import { _isIOSUserAgent } from '../utils/browser';
import { _exists } from '../utils/generic';
import { ManagedFocusFeature } from '../widgets/managedFocusFeature';
import type { LongTapEvent } from '../widgets/touchListener';
import { TouchListener } from '../widgets/touchListener';
import { getColumnHeaderRowHeight, getFloatingFiltersHeight, getGroupRowsHeight } from './headerUtils';

export interface IGridHeaderComp {
    addOrRemoveCssClass(cssClassName: string, on: boolean): void;
    setHeightAndMinHeight(height: string): void;
}

export class GridHeaderCtrl extends BeanStub {
    private headerNavigation?: HeaderNavigationService;
    private focusSvc: FocusService;
    private colModel: ColumnModel;
    private visibleCols: VisibleColsService;
    private ctrlsSvc: CtrlsService;
    private filterManager?: FilterManager;
    private menuSvc?: MenuService;

    public wireBeans(beans: BeanCollection) {
        this.headerNavigation = beans.headerNavigation;
        this.focusSvc = beans.focusSvc;
        this.colModel = beans.colModel;
        this.visibleCols = beans.visibleCols;
        this.ctrlsSvc = beans.ctrlsSvc;
        this.filterManager = beans.filterManager;
        this.menuSvc = beans.menuSvc;
    }

    private comp: IGridHeaderComp;
    private eGui: HTMLElement;
    private headerHeight: number;

    public setComp(comp: IGridHeaderComp, eGui: HTMLElement, eFocusableElement: HTMLElement): void {
        this.comp = comp;
        this.eGui = eGui;

        if (this.headerNavigation) {
            this.createManagedBean(
                new ManagedFocusFeature(eFocusableElement, {
                    onTabKeyDown: this.onTabKeyDown.bind(this),
                    handleKeyDown: this.handleKeyDown.bind(this),
                    onFocusOut: this.onFocusOut.bind(this),
                })
            );
        }

        // for setting ag-pivot-on / ag-pivot-off CSS classes
        this.addManagedEventListeners({
            columnPivotModeChanged: this.onPivotModeChanged.bind(this),
            displayedColumnsChanged: this.onDisplayedColumnsChanged.bind(this),
        });

        this.onPivotModeChanged();
        this.setupHeaderHeight();

        const listener = this.onHeaderContextMenu.bind(this);
        this.addManagedElementListeners(this.eGui, { contextmenu: listener });
        this.mockContextMenuForIPad(listener);

        this.ctrlsSvc.register('gridHeaderCtrl', this);
    }

    private setupHeaderHeight(): void {
        const listener = this.setHeaderHeight.bind(this);
        listener();

        this.addManagedPropertyListeners(
            [
                'headerHeight',
                'pivotHeaderHeight',
                'groupHeaderHeight',
                'pivotGroupHeaderHeight',
                'floatingFiltersHeight',
            ],
            listener
        );

        this.addManagedEventListeners({
            displayedColumnsChanged: listener,
            columnHeaderHeightChanged: listener,
            // add this to the animation frame to avoid a feedback loop
            columnGroupHeaderHeightChanged: () => _requestAnimationFrame(this.gos, () => listener()),
            gridStylesChanged: listener,
            advancedFilterEnabledChanged: listener,
        });
    }

    public getHeaderHeight(): number {
        return this.headerHeight;
    }

    private setHeaderHeight(): void {
        const { beans } = this;

        let totalHeaderHeight: number = 0;

        const groupHeight = getGroupRowsHeight(beans).reduce((prev, curr) => prev + curr, 0);
        const headerHeight = getColumnHeaderRowHeight(this.beans);

        if (this.filterManager?.hasFloatingFilters()) {
            totalHeaderHeight += getFloatingFiltersHeight(beans)!;
        }

        totalHeaderHeight += groupHeight;
        totalHeaderHeight += headerHeight!;

        if (this.headerHeight === totalHeaderHeight) {
            return;
        }

        this.headerHeight = totalHeaderHeight;

        // one extra pixel is needed here to account for the
        // height of the border
        const px = `${totalHeaderHeight + 1}px`;
        this.comp.setHeightAndMinHeight(px);

        this.eventSvc.dispatchEvent({
            type: 'headerHeightChanged',
        });
    }

    private onPivotModeChanged(): void {
        const pivotMode = this.colModel.isPivotMode();

        this.comp.addOrRemoveCssClass('ag-pivot-on', pivotMode);
        this.comp.addOrRemoveCssClass('ag-pivot-off', !pivotMode);
    }

    private onDisplayedColumnsChanged(): void {
        const columns = this.visibleCols.allCols;
        const shouldAllowOverflow = columns.some((col) => col.isSpanHeaderHeight());

        this.comp.addOrRemoveCssClass('ag-header-allow-overflow', shouldAllowOverflow);
    }

    protected onTabKeyDown(e: KeyboardEvent): void {
        const isRtl = this.gos.get('enableRtl');
        const backwards = e.shiftKey;
        const direction = backwards !== isRtl ? 'LEFT' : 'RIGHT';

        if (
            this.headerNavigation!.navigateHorizontally(direction, true, e) ||
            (!backwards && this.focusSvc.focusOverlay(false)) ||
            this.focusSvc.focusNextGridCoreContainer(backwards, true)
        ) {
            // preventDefault so that the tab key doesn't cause focus to get lost
            e.preventDefault();
        }
    }

    protected handleKeyDown(e: KeyboardEvent): void {
        let direction: HeaderNavigationDirection | null = null;

        switch (e.key) {
            case KeyCode.LEFT:
                direction = 'LEFT';
            // eslint-disable-next-line no-fallthrough
            case KeyCode.RIGHT: {
                if (!_exists(direction)) {
                    direction = 'RIGHT';
                }
                if (this.headerNavigation!.navigateHorizontally(direction, false, e)) {
                    // preventDefault so that the arrow keys don't cause an extra scroll
                    e.preventDefault();
                }
                break;
            }
            case KeyCode.UP:
                direction = 'UP';
            // eslint-disable-next-line no-fallthrough
            case KeyCode.DOWN: {
                if (!_exists(direction)) {
                    direction = 'DOWN';
                }
                if (this.headerNavigation!.navigateVertically(direction, null, e)) {
                    // preventDefault so that the arrow keys don't cause an extra scroll
                    e.preventDefault();
                }
                break;
            }
            default:
                return;
        }
    }

    protected onFocusOut(e: FocusEvent): void {
        const { relatedTarget } = e;

        if (!relatedTarget && this.eGui.contains(_getActiveDomElement(this.gos))) {
            return;
        }

        if (!this.eGui.contains(relatedTarget as HTMLElement)) {
            this.focusSvc.clearFocusedHeader();
        }
    }

    private onHeaderContextMenu(mouseEvent?: MouseEvent, touch?: Touch, touchEvent?: TouchEvent): void {
        if ((!mouseEvent && !touchEvent) || !this.menuSvc?.isHeaderContextMenuEnabled()) {
            return;
        }

        const { target } = (mouseEvent ?? touch)!;

        if (target === this.eGui || target === this.ctrlsSvc.getHeaderRowContainerCtrl()?.getViewportElement()) {
            this.menuSvc.showHeaderContextMenu(undefined, mouseEvent, touchEvent);
        }
    }

    private mockContextMenuForIPad(
        listener: (mouseListener?: MouseEvent, touch?: Touch, touchEvent?: TouchEvent) => void
    ): void {
        // we do NOT want this when not in iPad
        if (!_isIOSUserAgent()) {
            return;
        }

        const touchListener = new TouchListener(this.eGui);
        const longTapListener = (event: LongTapEvent) => {
            listener(undefined, event.touchStart, event.touchEvent);
        };

        this.addManagedListeners(touchListener, { longTap: longTapListener });
        this.addDestroyFunc(() => touchListener.destroy());
    }
}
