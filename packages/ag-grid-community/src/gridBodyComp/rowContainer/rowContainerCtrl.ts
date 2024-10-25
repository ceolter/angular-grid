import type { ColumnViewportService } from '../../columns/columnViewportService';
import { BeanStub } from '../../context/beanStub';
import type { BeanCollection } from '../../context/context';
import type { CtrlsService } from '../../ctrlsService';
import type { DragService } from '../../dragAndDrop/dragService';
import type { StickyTopOffsetChangedEvent } from '../../events';
import { _isDomLayout } from '../../gridOptionsUtils';
import type { IRangeService } from '../../interfaces/IRangeService';
import type { ColumnPinnedType } from '../../interfaces/iColumn';
import type { PinnedColumnService } from '../../pinnedColumns/pinnedColumnService';
import type { RowCtrl } from '../../rendering/row/rowCtrl';
import type { RowRenderer } from '../../rendering/rowRenderer';
import {
    _getInnerWidth,
    _getScrollLeft,
    _isHorizontalScrollShowing,
    _isInDOM,
    _observeResize,
    _setScrollLeft,
} from '../../utils/dom';
import { CenterWidthFeature } from '../centerWidthFeature';
import type { ScrollPartner } from '../gridBodyScrollFeature';
import { ViewportSizeFeature } from '../viewportSizeFeature';
import { RowContainerEventsFeature } from './rowContainerEventsFeature';
import { SetHeightFeature } from './setHeightFeature';
import type { SetPinnedWidthFeature } from './setPinnedWidthFeature';

export type RowContainerName =
    | 'left'
    | 'right'
    | 'center'
    | 'fullWidth'
    | 'topLeft'
    | 'topRight'
    | 'topCenter'
    | 'topFullWidth'
    | 'stickyTopLeft'
    | 'stickyTopRight'
    | 'stickyTopCenter'
    | 'stickyTopFullWidth'
    | 'stickyBottomLeft'
    | 'stickyBottomRight'
    | 'stickyBottomCenter'
    | 'stickyBottomFullWidth'
    | 'bottomLeft'
    | 'bottomRight'
    | 'bottomCenter'
    | 'bottomFullWidth';

export type RowContainerType = 'left' | 'right' | 'center' | 'fullWidth';

type GetRowCtrls = (renderer: RowRenderer) => RowCtrl[];
export type RowContainerOptions = {
    type: RowContainerType;
    container: string;
    viewport?: string;
    pinnedType?: ColumnPinnedType;
    fullWidth?: boolean;
    getRowCtrls: GetRowCtrls;
};
const getTopRowCtrls: GetRowCtrls = (r) => r.getTopRowCtrls();
const getStickyTopRowCtrls: GetRowCtrls = (r) => r.getStickyTopRowCtrls();
const getStickyBottomRowCtrls: GetRowCtrls = (r) => r.getStickyBottomRowCtrls();
const getBottomRowCtrls: GetRowCtrls = (r) => r.getBottomRowCtrls();
const getCentreRowCtrls: GetRowCtrls = (r) => r.getCentreRowCtrls();

const ContainerCssClasses: Record<RowContainerName, RowContainerOptions> = {
    center: {
        type: 'center',
        container: 'ag-center-cols-container',
        viewport: 'ag-center-cols-viewport',
        getRowCtrls: getCentreRowCtrls,
    },
    left: {
        type: 'left',
        container: 'ag-pinned-left-cols-container',
        pinnedType: 'left',
        getRowCtrls: getCentreRowCtrls,
    },
    right: {
        type: 'right',
        container: 'ag-pinned-right-cols-container',
        pinnedType: 'right',
        getRowCtrls: getCentreRowCtrls,
    },
    fullWidth: {
        type: 'fullWidth',
        container: 'ag-full-width-container',
        fullWidth: true,
        getRowCtrls: getCentreRowCtrls,
    },

    topCenter: {
        type: 'center',
        container: 'ag-floating-top-container',
        viewport: 'ag-floating-top-viewport',
        getRowCtrls: getTopRowCtrls,
    },
    topLeft: {
        type: 'left',
        container: 'ag-pinned-left-floating-top',
        pinnedType: 'left',
        getRowCtrls: getTopRowCtrls,
    },
    topRight: {
        type: 'right',
        container: 'ag-pinned-right-floating-top',
        pinnedType: 'right',
        getRowCtrls: getTopRowCtrls,
    },
    topFullWidth: {
        type: 'fullWidth',
        container: 'ag-floating-top-full-width-container',
        fullWidth: true,
        getRowCtrls: getTopRowCtrls,
    },

    stickyTopCenter: {
        type: 'center',
        container: 'ag-sticky-top-container',
        viewport: 'ag-sticky-top-viewport',
        getRowCtrls: getStickyTopRowCtrls,
    },
    stickyTopLeft: {
        type: 'left',
        container: 'ag-pinned-left-sticky-top',
        pinnedType: 'left',
        getRowCtrls: getStickyTopRowCtrls,
    },
    stickyTopRight: {
        type: 'right',
        container: 'ag-pinned-right-sticky-top',
        pinnedType: 'right',
        getRowCtrls: getStickyTopRowCtrls,
    },
    stickyTopFullWidth: {
        type: 'fullWidth',
        container: 'ag-sticky-top-full-width-container',
        fullWidth: true,
        getRowCtrls: getStickyTopRowCtrls,
    },

    stickyBottomCenter: {
        type: 'center',
        container: 'ag-sticky-bottom-container',
        viewport: 'ag-sticky-bottom-viewport',
        getRowCtrls: getStickyBottomRowCtrls,
    },
    stickyBottomLeft: {
        type: 'left',
        container: 'ag-pinned-left-sticky-bottom',
        pinnedType: 'left',
        getRowCtrls: getStickyBottomRowCtrls,
    },
    stickyBottomRight: {
        type: 'right',
        container: 'ag-pinned-right-sticky-bottom',
        pinnedType: 'right',
        getRowCtrls: getStickyBottomRowCtrls,
    },
    stickyBottomFullWidth: {
        type: 'fullWidth',
        container: 'ag-sticky-bottom-full-width-container',
        fullWidth: true,
        getRowCtrls: getStickyBottomRowCtrls,
    },

    bottomCenter: {
        type: 'center',
        container: 'ag-floating-bottom-container',
        viewport: 'ag-floating-bottom-viewport',
        getRowCtrls: getBottomRowCtrls,
    },
    bottomLeft: {
        type: 'left',
        container: 'ag-pinned-left-floating-bottom',
        pinnedType: 'left',
        getRowCtrls: getBottomRowCtrls,
    },
    bottomRight: {
        type: 'right',
        container: 'ag-pinned-right-floating-bottom',
        pinnedType: 'right',
        getRowCtrls: getBottomRowCtrls,
    },
    bottomFullWidth: {
        type: 'fullWidth',
        container: 'ag-floating-bottom-full-width-container',
        fullWidth: true,
        getRowCtrls: getBottomRowCtrls,
    },
};
export function _getRowContainerOptions(name: RowContainerName): RowContainerOptions {
    return ContainerCssClasses[name];
}

const allTopNoFW: RowContainerName[] = ['topCenter', 'topLeft', 'topRight'];
const allBottomNoFW: RowContainerName[] = ['bottomCenter', 'bottomLeft', 'bottomRight'];
const allMiddleNoFW: RowContainerName[] = ['center', 'left', 'right'];

const allMiddle: RowContainerName[] = ['center', 'left', 'right', 'fullWidth'];
const allCenter: RowContainerName[] = ['stickyTopCenter', 'stickyBottomCenter', 'center', 'topCenter', 'bottomCenter'];
const allLeft: RowContainerName[] = ['left', 'bottomLeft', 'topLeft', 'stickyTopLeft', 'stickyBottomLeft'];
const allRight: RowContainerName[] = ['right', 'bottomRight', 'topRight', 'stickyTopRight', 'stickyBottomRight'];

// sticky section must show rows in set order
const allStickyTopNoFW: RowContainerName[] = ['stickyTopCenter', 'stickyTopLeft', 'stickyTopRight'];
const allStickyBottomNoFW: RowContainerName[] = ['stickyBottomCenter', 'stickyBottomLeft', 'stickyBottomRight'];
const allStickyContainers: RowContainerName[] = [
    ...allStickyTopNoFW,
    'stickyTopFullWidth',
    ...allStickyBottomNoFW,
    'stickyBottomFullWidth',
];
const allNoFW: RowContainerName[] = [
    ...allTopNoFW,
    ...allBottomNoFW,
    ...allMiddleNoFW,
    ...allStickyTopNoFW,
    ...allStickyBottomNoFW,
];

export interface IRowContainerComp {
    setViewportHeight(height: string): void;
    setHorizontalScroll(offset: number): void;
    setRowCtrls(params: { rowCtrls: RowCtrl[]; useFlushSync?: boolean }): void;
    setDomOrder(domOrder: boolean): void;
    setContainerWidth(width: string): void;
    setOffsetTop(offset: string): void;
}

export class RowContainerCtrl extends BeanStub implements ScrollPartner {
    private dragSvc?: DragService;
    private ctrlsSvc: CtrlsService;
    private colViewport: ColumnViewportService;
    private rowRenderer: RowRenderer;
    private rangeSvc?: IRangeService;
    private pinnedCols?: PinnedColumnService;

    public wireBeans(beans: BeanCollection) {
        this.dragSvc = beans.dragSvc;
        this.ctrlsSvc = beans.ctrlsSvc;
        this.colViewport = beans.colViewport;
        this.rowRenderer = beans.rowRenderer;
        this.rangeSvc = beans.rangeSvc;
        this.pinnedCols = beans.pinnedCols;
    }

    private readonly options: RowContainerOptions;
    private readonly name: RowContainerName;

    private comp: IRowContainerComp;
    private eContainer: HTMLElement;
    private eViewport: HTMLElement;
    private enableRtl: boolean;

    private viewportSizeFeature: ViewportSizeFeature | undefined; // only center has this
    private pinnedWidthFeature: SetPinnedWidthFeature | undefined;
    private visible: boolean = true;
    // Maintaining a constant reference enables optimization in React.
    private EMPTY_CTRLS = [];

    constructor(name: RowContainerName) {
        super();
        this.name = name;
        this.options = _getRowContainerOptions(name);
    }

    public postConstruct(): void {
        this.enableRtl = this.gos.get('enableRtl');

        this.forContainers(['center'], () => {
            this.viewportSizeFeature = this.createManagedBean(new ViewportSizeFeature(this));
            this.addManagedEventListeners({
                stickyTopOffsetChanged: this.onStickyTopOffsetChanged.bind(this),
            });
        });
    }

    private onStickyTopOffsetChanged(event: StickyTopOffsetChangedEvent): void {
        this.comp.setOffsetTop(`${event.offset}px`);
    }

    private registerWithCtrlsService(): void {
        // we don't register full width containers
        if (this.options.fullWidth) return;
        this.ctrlsSvc.register(this.name as any, this);
    }

    private forContainers(names: RowContainerName[], callback: () => void): void {
        if (names.indexOf(this.name) >= 0) {
            callback();
        }
    }

    public getContainerElement(): HTMLElement {
        return this.eContainer;
    }

    public getViewportSizeFeature(): ViewportSizeFeature | undefined {
        return this.viewportSizeFeature;
    }

    public setComp(view: IRowContainerComp, eContainer: HTMLElement, eViewport: HTMLElement): void {
        this.comp = view;
        this.eContainer = eContainer;
        this.eViewport = eViewport;

        this.createManagedBean(new RowContainerEventsFeature(this.eContainer));
        this.addPreventScrollWhileDragging();
        this.listenOnDomOrder();

        const pinnedWidthChanged = () => this.onPinnedWidthChanged();
        this.forContainers(allLeft, () => {
            this.pinnedWidthFeature = this.createOptionalManagedBean(
                this.pinnedCols?.createPinnedWidthFeature(this.eContainer, true)
            );
            this.addManagedEventListeners({ leftPinnedWidthChanged: pinnedWidthChanged });
        });
        this.forContainers(allRight, () => {
            this.pinnedWidthFeature = this.createOptionalManagedBean(
                this.pinnedCols?.createPinnedWidthFeature(this.eContainer, false)
            );
            this.addManagedEventListeners({ rightPinnedWidthChanged: pinnedWidthChanged });
        });
        this.forContainers(allMiddle, () =>
            this.createManagedBean(
                new SetHeightFeature(this.eContainer, this.name === 'center' ? eViewport : undefined)
            )
        );
        if (this.rangeSvc) {
            this.forContainers(allNoFW, () =>
                this.createManagedBean(this.rangeSvc!.createDragListenerFeature(this.eContainer))
            );
        }

        this.forContainers(allCenter, () =>
            this.createManagedBean(new CenterWidthFeature((width) => this.comp.setContainerWidth(`${width}px`)))
        );

        // Set the initial visibility of the container to avoid extra rendering
        this.visible = this.isContainerVisible();
        this.addListeners();
        this.registerWithCtrlsService();
    }

    public onScrollCallback(fn: () => void): void {
        this.addManagedElementListeners(this.getViewportElement(), { scroll: fn });
    }

    private addListeners(): void {
        this.addManagedEventListeners({
            displayedColumnsChanged: this.onDisplayedColumnsChanged.bind(this),
            displayedColumnsWidthChanged: this.onDisplayedColumnsWidthChanged.bind(this),
            displayedRowsChanged: (params) => this.onDisplayedRowsChanged(params.afterScroll),
        });

        this.onDisplayedColumnsChanged();
        this.onDisplayedColumnsWidthChanged();
        this.onDisplayedRowsChanged();
    }

    private listenOnDomOrder(): void {
        const isStickContainer = allStickyContainers.indexOf(this.name) >= 0;
        if (isStickContainer) {
            this.comp.setDomOrder(true);
            return;
        }

        const listener = () => {
            const isEnsureDomOrder = this.gos.get('ensureDomOrder');
            const isPrintLayout = _isDomLayout(this.gos, 'print');
            this.comp.setDomOrder(isEnsureDomOrder || isPrintLayout);
        };

        this.addManagedPropertyListener('domLayout', listener);
        listener();
    }

    public onDisplayedColumnsChanged(): void {
        this.forContainers(['center'], () => this.onHorizontalViewportChanged());
    }

    private onDisplayedColumnsWidthChanged(): void {
        this.forContainers(['center'], () => this.onHorizontalViewportChanged());
    }
    // this methods prevents the grid views from being scrolled while the dragSvc is being used
    // eg. the view should not scroll up and down while dragging rows using the rowDragComp.
    private addPreventScrollWhileDragging(): void {
        if (!this.dragSvc) {
            return;
        }
        const preventScroll = (e: TouchEvent) => {
            if (this.dragSvc!.isDragging()) {
                if (e.cancelable) {
                    e.preventDefault();
                }
            }
        };

        this.eContainer.addEventListener('touchmove', preventScroll, { passive: false });
        this.addDestroyFunc(() => this.eContainer.removeEventListener('touchmove', preventScroll));
    }

    // this gets called whenever a change in the viewport, so we can inform column controller it has to work
    // out the virtual columns again. gets called from following locations:
    // + ensureColVisible, scroll, init, layoutChanged, displayedColumnsChanged
    public onHorizontalViewportChanged(afterScroll: boolean = false): void {
        const scrollWidth = this.getCenterWidth();
        const scrollPosition = this.getCenterViewportScrollLeft();

        this.colViewport.setScrollPosition(scrollWidth, scrollPosition, afterScroll);
    }

    public hasHorizontalScrollGap(): boolean {
        return this.eContainer.clientWidth - this.eViewport.clientWidth < 0;
    }

    public hasVerticalScrollGap(): boolean {
        return this.eContainer.clientHeight - this.eViewport.clientHeight < 0;
    }

    public getCenterWidth(): number {
        return _getInnerWidth(this.eViewport);
    }

    public getCenterViewportScrollLeft(): number {
        // we defer to a util, as how you calculated scrollLeft when doing RTL depends on the browser
        return _getScrollLeft(this.eViewport, this.enableRtl);
    }

    public registerViewportResizeListener(listener: () => void) {
        const unsubscribeFromResize = _observeResize(this.gos, this.eViewport, listener);
        this.addDestroyFunc(() => unsubscribeFromResize());
    }

    public isViewportInTheDOMTree(): boolean {
        return _isInDOM(this.eViewport);
    }

    public getViewportScrollLeft(): number {
        return _getScrollLeft(this.eViewport, this.enableRtl);
    }

    public isHorizontalScrollShowing(): boolean {
        const isAlwaysShowHorizontalScroll = this.gos.get('alwaysShowHorizontalScroll');
        return isAlwaysShowHorizontalScroll || _isHorizontalScrollShowing(this.eViewport);
    }

    public getViewportElement(): HTMLElement {
        return this.eViewport;
    }

    public setHorizontalScroll(offset: number): void {
        this.comp.setHorizontalScroll(offset);
    }

    public getHScrollPosition(): { left: number; right: number } {
        const res = {
            left: this.eViewport.scrollLeft,
            right: this.eViewport.scrollLeft + this.eViewport.offsetWidth,
        };
        return res;
    }

    public setCenterViewportScrollLeft(value: number): void {
        // we defer to a util, as how you calculated scrollLeft when doing RTL depends on the browser
        _setScrollLeft(this.eViewport, value, this.enableRtl);
    }

    private isContainerVisible(): boolean {
        const pinned = this.options.pinnedType != null;
        return !pinned || (!!this.pinnedWidthFeature && this.pinnedWidthFeature.getWidth() > 0);
    }

    private onPinnedWidthChanged(): void {
        const visible = this.isContainerVisible();
        if (this.visible != visible) {
            this.visible = visible;
            this.onDisplayedRowsChanged();
        }
    }

    private onDisplayedRowsChanged(afterScroll: boolean = false): void {
        const rows = this.options.getRowCtrls(this.rowRenderer);
        if (!this.visible || rows.length === 0) {
            this.comp.setRowCtrls({ rowCtrls: this.EMPTY_CTRLS });
            return;
        }

        const printLayout = _isDomLayout(this.gos, 'print');
        const embedFullWidthRows = this.gos.get('embedFullWidthRows');
        const embedFW = embedFullWidthRows || printLayout;

        // this list contains either all pinned top, center or pinned bottom rows
        // this filters out rows not for this container, eg if it's a full with row, but we are not full with container
        const rowsThisContainer = rows.filter((rowCtrl) => {
            // this just justifies if the ctrl is in the correct place, this will be fed with zombie rows by the
            // row renderer, so should not block them as they still need to animate -  the row renderer
            // will clean these up when they finish animating
            const fullWidthRow = rowCtrl.isFullWidth();

            const match = this.options.fullWidth ? !embedFW && fullWidthRow : embedFW || !fullWidthRow;

            return match;
        });

        this.comp.setRowCtrls({ rowCtrls: rowsThisContainer, useFlushSync: afterScroll });
    }
}
