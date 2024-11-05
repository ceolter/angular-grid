import { KeyCode } from '../constants/keyCode';
import { BeanStub } from '../context/beanStub';
import type { BeanCollection } from '../context/context';
import { _getActiveDomElement } from '../gridOptionsUtils';
import { _requestAnimationFrame } from '../misc/animationFrameService';
import type { HeaderNavigationDirection } from '../navigation/headerNavigationService';
import { _focusNextGridCoreContainer } from '../utils/focus';
import { _exists } from '../utils/generic';
import { ManagedFocusFeature } from '../widgets/managedFocusFeature';
import { getColumnHeaderRowHeight, getFloatingFiltersHeight, getGroupRowsHeight } from './headerUtils';

export interface IGridHeaderComp {
    addOrRemoveCssClass(cssClassName: string, on: boolean): void;
    setHeightAndMinHeight(height: string): void;
}

export class GridHeaderCtrl extends BeanStub {
    private comp: IGridHeaderComp;
    public eGui: HTMLElement;
    public headerHeight: number;

    public setComp(comp: IGridHeaderComp, eGui: HTMLElement, eFocusableElement: HTMLElement): void {
        this.comp = comp;
        this.eGui = eGui;

        const { beans } = this;
        const { headerNavigation, touchSvc, ctrlsSvc } = beans;

        if (headerNavigation) {
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
            columnPivotModeChanged: this.onPivotModeChanged.bind(this, beans),
            displayedColumnsChanged: this.onDisplayedColumnsChanged.bind(this, beans),
        });

        this.onPivotModeChanged(beans);
        this.setupHeaderHeight();

        const listener = this.onHeaderContextMenu.bind(this);
        this.addManagedElementListeners(this.eGui, { contextmenu: listener });
        touchSvc?.mockHeaderContextMenuForIPad(this, listener);

        ctrlsSvc.register('gridHeaderCtrl', this);
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
            columnGroupHeaderHeightChanged: () => _requestAnimationFrame(this.beans, () => listener()),
            gridStylesChanged: listener,
            advancedFilterEnabledChanged: listener,
        });
    }

    private setHeaderHeight(): void {
        const { beans } = this;

        let totalHeaderHeight: number = 0;

        const groupHeight = getGroupRowsHeight(beans).reduce((prev, curr) => prev + curr, 0);
        const headerHeight = getColumnHeaderRowHeight(beans);

        if (beans.filterManager?.hasFloatingFilters()) {
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

    private onPivotModeChanged(beans: BeanCollection): void {
        const pivotMode = beans.colModel.isPivotMode();

        this.comp.addOrRemoveCssClass('ag-pivot-on', pivotMode);
        this.comp.addOrRemoveCssClass('ag-pivot-off', !pivotMode);
    }

    private onDisplayedColumnsChanged(beans: BeanCollection): void {
        const columns = beans.visibleCols.allCols;
        const shouldAllowOverflow = columns.some((col) => col.isSpanHeaderHeight());

        this.comp.addOrRemoveCssClass('ag-header-allow-overflow', shouldAllowOverflow);
    }

    protected onTabKeyDown(e: KeyboardEvent): void {
        const isRtl = this.gos.get('enableRtl');
        const backwards = e.shiftKey;
        const direction = backwards !== isRtl ? 'LEFT' : 'RIGHT';
        const { beans } = this;
        const { headerNavigation, focusSvc } = beans;

        if (
            headerNavigation!.navigateHorizontally(direction, true, e) ||
            (!backwards && focusSvc.focusOverlay(false)) ||
            _focusNextGridCoreContainer(beans, backwards, true)
        ) {
            // preventDefault so that the tab key doesn't cause focus to get lost
            e.preventDefault();
        }
    }

    protected handleKeyDown(e: KeyboardEvent): void {
        let direction: HeaderNavigationDirection | null = null;
        const { headerNavigation } = this.beans;

        switch (e.key) {
            case KeyCode.LEFT:
                direction = 'LEFT';
            // eslint-disable-next-line no-fallthrough
            case KeyCode.RIGHT: {
                if (!_exists(direction)) {
                    direction = 'RIGHT';
                }
                if (headerNavigation!.navigateHorizontally(direction, false, e)) {
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
                if (headerNavigation!.navigateVertically(direction, null, e)) {
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

        if (!relatedTarget && this.eGui.contains(_getActiveDomElement(this.beans))) {
            return;
        }

        if (!this.eGui.contains(relatedTarget as HTMLElement)) {
            this.beans.focusSvc.clearFocusedHeader();
        }
    }

    private onHeaderContextMenu(mouseEvent?: MouseEvent, touch?: Touch, touchEvent?: TouchEvent): void {
        const { menuSvc, ctrlsSvc } = this.beans;
        if ((!mouseEvent && !touchEvent) || !menuSvc?.isHeaderContextMenuEnabled()) {
            return;
        }

        const { target } = (mouseEvent ?? touch)!;

        if (target === this.eGui || target === ctrlsSvc.getHeaderRowContainerCtrl()?.eViewport) {
            menuSvc.showHeaderContextMenu(undefined, mouseEvent, touchEvent);
        }
    }
}
