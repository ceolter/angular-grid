import { BeanStub } from '../../context/beanStub';
import type { BeanCollection } from '../../context/context';
import type { DragListenerParams, DragService } from '../../dragAndDrop/dragService';
import {
    _getAbsoluteHeight,
    _getAbsoluteWidth,
    _isVisible,
    _observeResize,
    _setFixedHeight,
    _setFixedWidth,
} from '../../utils/dom';
import type { PopupService } from '../../widgets/popupService';

const RESIZE_CONTAINER_STYLE = 'ag-resizer-wrapper';
const makeDiv = (dataRefPrefix: string, classSuffix: string) =>
    `<div data-ref="${dataRefPrefix}Resizer" class="ag-resizer ag-resizer-${classSuffix}"></div>`;
const RESIZE_TEMPLATE =
    /* html */
    `<div class="${RESIZE_CONTAINER_STYLE}">
        ${makeDiv('eTopLeft', 'topLeft')}
        ${makeDiv('eTop', 'top')}
        ${makeDiv('eTopRight', 'topRight')}
        ${makeDiv('eRight', 'right')}
        ${makeDiv('eBottomRight', 'bottomRight')}
        ${makeDiv('eBottom', 'bottom')}
        ${makeDiv('eBottomLeft', 'bottomLeft')}
        ${makeDiv('eLeft', 'left')}
    </div>`;

export interface PositionableOptions {
    popup?: boolean;
    minWidth?: number | null;
    width?: number | string | null;
    minHeight?: number | null;
    height?: number | string | null;
    centered?: boolean | null;
    calculateTopBuffer?: () => number;
    /**
     * Used for when a popup needs to be resized by an element within itself
     * In that case, the feature will configured as `popup=false` but the offsetParent
     * needs to be the popupParent.
     */
    forcePopupParentAsOffsetParent?: boolean;
    x?: number | null;
    y?: number | null;
}

export type ResizableSides =
    | 'topLeft'
    | 'top'
    | 'topRight'
    | 'right'
    | 'bottomRight'
    | 'bottom'
    | 'bottomLeft'
    | 'left';

export type ResizableStructure = {
    [key in ResizableSides]?: boolean;
};

interface MappedResizer {
    element: HTMLElement;
    dragSource?: DragListenerParams;
}

export type PositionableFeatureEvent = 'resize';
export class PositionableFeature extends BeanStub<PositionableFeatureEvent> {
    protected popupSvc?: PopupService;
    private dragSvc?: DragService;

    public wireBeans(beans: BeanCollection): void {
        this.popupSvc = beans.popupSvc;
        this.dragSvc = beans.dragSvc;
    }

    private dragStartPosition = {
        x: 0,
        y: 0,
    };

    private position = {
        x: 0,
        y: 0,
    };

    private lastSize = {
        width: -1,
        height: -1,
    };

    private resizerMap:
        | {
              [key in ResizableSides]: MappedResizer;
          }
        | undefined;

    private minWidth: number;
    private minHeight?: number;
    private positioned = false;
    private resizersAdded = false;
    private config: PositionableOptions;

    private resizeListeners: DragListenerParams[] = [];
    private moveElementDragListener: DragListenerParams | undefined;

    private offsetParent: HTMLElement;
    private boundaryEl: HTMLElement | null = null;

    private isResizing: boolean = false;
    private isMoving = false;
    private resizable: ResizableStructure = {};
    private movable = false;
    private currentResizer: { isTop: boolean; isRight: boolean; isBottom: boolean; isLeft: boolean } | null = null;
    private resizeObserverSubscriber: (() => void) | undefined;

    constructor(
        private readonly element: HTMLElement,
        config?: PositionableOptions
    ) {
        super();
        this.config = Object.assign({}, { popup: false }, config);
    }

    public center() {
        const { clientHeight, clientWidth } = this.offsetParent;

        const x = clientWidth / 2 - this.getWidth()! / 2;
        const y = clientHeight / 2 - this.getHeight()! / 2;

        this.offsetElement(x, y);
    }

    public initialisePosition(): void {
        if (this.positioned) {
            return;
        }

        const { centered, forcePopupParentAsOffsetParent, minWidth, width, minHeight, height, x, y } = this.config;

        if (!this.offsetParent) {
            this.setOffsetParent();
        }

        let computedMinHeight = 0;
        let computedMinWidth = 0;

        // here we don't use the main offset parent but the element's offsetParent
        // in order to calculated the minWidth and minHeight correctly
        const isElementVisible = _isVisible(this.element);
        if (isElementVisible) {
            const boundaryEl = this.findBoundaryElement();
            const offsetParentComputedStyles = window.getComputedStyle(boundaryEl);
            if (offsetParentComputedStyles.minWidth != null) {
                const paddingWidth = boundaryEl.offsetWidth - this.element.offsetWidth;
                computedMinWidth = parseInt(offsetParentComputedStyles.minWidth, 10) - paddingWidth;
            }

            if (offsetParentComputedStyles.minHeight != null) {
                const paddingHeight = boundaryEl.offsetHeight - this.element.offsetHeight;
                computedMinHeight = parseInt(offsetParentComputedStyles.minHeight, 10) - paddingHeight;
            }
        }

        this.minHeight = minHeight || computedMinHeight;
        this.minWidth = minWidth || computedMinWidth;

        if (width) {
            this.setWidth(width);
        }

        if (height) {
            this.setHeight(height);
        }

        if (!width || !height) {
            this.refreshSize();
        }

        if (centered) {
            this.center();
        } else if (x || y) {
            this.offsetElement(x!, y!);
        } else if (isElementVisible && forcePopupParentAsOffsetParent) {
            let boundaryEl: HTMLElement | null = this.boundaryEl;
            let initialisedDuringPositioning = true;

            if (!boundaryEl) {
                boundaryEl = this.findBoundaryElement();
                initialisedDuringPositioning = false;
            }

            if (boundaryEl) {
                const top = parseFloat(boundaryEl.style.top);
                const left = parseFloat(boundaryEl.style.left);

                if (initialisedDuringPositioning) {
                    this.offsetElement(isNaN(left) ? 0 : left, isNaN(top) ? 0 : top);
                } else {
                    this.setPosition(left, top);
                }
            }
        }

        this.positioned = !!this.offsetParent;
    }

    public isPositioned(): boolean {
        return this.positioned;
    }

    public getPosition(): { x: number; y: number } {
        return this.position;
    }

    public setMovable(movable: boolean, moveElement: HTMLElement) {
        if (!this.config.popup || movable === this.movable) {
            return;
        }

        this.movable = movable;

        const params: DragListenerParams = this.moveElementDragListener || {
            eElement: moveElement,
            onDragStart: this.onMoveStart.bind(this),
            onDragging: this.onMove.bind(this),
            onDragStop: this.onMoveEnd.bind(this),
        };

        if (movable) {
            this.dragSvc?.addDragSource(params);
            this.moveElementDragListener = params;
        } else {
            this.dragSvc?.removeDragSource(params);
            this.moveElementDragListener = undefined;
        }
    }

    public setResizable(resizable: boolean | ResizableStructure) {
        this.clearResizeListeners();

        if (resizable) {
            this.addResizers();
        } else {
            this.removeResizers();
        }

        if (typeof resizable === 'boolean') {
            if (resizable === false) {
                return;
            }

            resizable = {
                topLeft: resizable,
                top: resizable,
                topRight: resizable,
                right: resizable,
                bottomRight: resizable,
                bottom: resizable,
                bottomLeft: resizable,
                left: resizable,
            } as ResizableStructure;
        }

        Object.keys(resizable).forEach((side: ResizableSides) => {
            const resizableStructure = resizable as ResizableStructure;
            const isSideResizable = !!resizableStructure[side];
            const resizerEl = this.getResizerElement(side);

            const params: DragListenerParams = {
                dragStartPixels: 0,
                eElement: resizerEl!,
                onDragStart: (e: MouseEvent) => this.onResizeStart(e, side),
                onDragging: this.onResize.bind(this),
                onDragStop: (e: MouseEvent) => this.onResizeEnd(e, side),
            };

            if (isSideResizable || (!this.isAlive() && !isSideResizable)) {
                if (isSideResizable) {
                    this.dragSvc?.addDragSource(params);
                    this.resizeListeners.push(params);
                    resizerEl!.style.pointerEvents = 'all';
                } else {
                    resizerEl!.style.pointerEvents = 'none';
                }
                this.resizable[side] = isSideResizable;
            }
        });
    }

    public removeSizeFromEl(): void {
        this.element.style.removeProperty('height');
        this.element.style.removeProperty('width');
        this.element.style.removeProperty('flex');
    }

    public restoreLastSize(): void {
        this.element.style.flex = '0 0 auto';

        const { height, width } = this.lastSize;

        if (width !== -1) {
            this.element.style.width = `${width}px`;
        }

        if (height !== -1) {
            this.element.style.height = `${height}px`;
        }
    }

    public getHeight(): number | undefined {
        return this.element.offsetHeight;
    }

    public setHeight(height: number | string) {
        const { popup } = this.config;
        const eGui = this.element;

        let isPercent = false;

        if (typeof height === 'string' && height.indexOf('%') !== -1) {
            _setFixedHeight(eGui, height);
            height = _getAbsoluteHeight(eGui);
            isPercent = true;
        } else {
            height = Math.max(this.minHeight!, height as number);
            if (this.positioned) {
                const availableHeight = this.getAvailableHeight();

                if (availableHeight && height > availableHeight) {
                    height = availableHeight;
                }
            }
        }

        if (this.getHeight() === height) {
            return;
        }

        if (!isPercent) {
            if (popup) {
                _setFixedHeight(eGui, height);
            } else {
                eGui.style.height = `${height}px`;
                eGui.style.flex = '0 0 auto';
                this.lastSize.height = typeof height === 'number' ? height : parseFloat(height);
            }
        } else {
            eGui.style.maxHeight = 'unset';
            eGui.style.minHeight = 'unset';
        }
    }

    private getAvailableHeight(): number | null {
        const { popup, forcePopupParentAsOffsetParent } = this.config;

        if (!this.positioned) {
            this.initialisePosition();
        }

        const { clientHeight } = this.offsetParent;

        if (!clientHeight) {
            return null;
        }

        const elRect = this.element.getBoundingClientRect();
        const offsetParentRect = this.offsetParent.getBoundingClientRect();

        const yPosition = popup ? this.position.y : elRect.top;
        const parentTop = popup ? 0 : offsetParentRect.top;

        // When `forcePopupParentAsOffsetParent`, there may be elements that appear after the resizable element, but aren't included in the height.
        // Take these into account here
        let additionalHeight = 0;
        if (forcePopupParentAsOffsetParent) {
            const parentEl = this.element.parentElement;
            if (parentEl) {
                const { bottom } = parentEl.getBoundingClientRect();
                additionalHeight = bottom - elRect.bottom;
            }
        }

        const availableHeight = clientHeight + parentTop - yPosition - additionalHeight;

        return availableHeight;
    }

    public getWidth(): number | undefined {
        return this.element.offsetWidth;
    }

    public setWidth(width: number | string) {
        const eGui = this.element;
        const { popup } = this.config;

        let isPercent = false;

        if (typeof width === 'string' && width.indexOf('%') !== -1) {
            _setFixedWidth(eGui, width);
            width = _getAbsoluteWidth(eGui);
            isPercent = true;
        } else if (this.positioned) {
            width = Math.max(this.minWidth, width as number);
            const { clientWidth } = this.offsetParent;
            const xPosition = popup ? this.position.x : this.element.getBoundingClientRect().left;

            if (clientWidth && width + xPosition > clientWidth) {
                width = clientWidth - xPosition;
            }
        }

        if (this.getWidth() === width) {
            return;
        }

        if (!isPercent) {
            if (this.config.popup) {
                _setFixedWidth(eGui, width);
            } else {
                eGui.style.width = `${width}px`;
                eGui.style.flex = ' unset';
                this.lastSize.width = typeof width === 'number' ? width : parseFloat(width);
            }
        } else {
            eGui.style.maxWidth = 'unset';
            eGui.style.minWidth = 'unset';
        }
    }

    public offsetElement(x = 0, y = 0) {
        const { forcePopupParentAsOffsetParent } = this.config;
        const ePopup = forcePopupParentAsOffsetParent ? this.boundaryEl : this.element;

        if (!ePopup) {
            return;
        }

        this.popupSvc?.positionPopup({
            ePopup,
            keepWithinBounds: true,
            skipObserver: this.movable || this.isResizable(),
            updatePosition: () => ({ x, y }),
        });

        this.setPosition(parseFloat(ePopup.style.left), parseFloat(ePopup.style.top));
    }

    public constrainSizeToAvailableHeight(constrain: boolean): void {
        if (!this.config.forcePopupParentAsOffsetParent) {
            return;
        }

        const applyMaxHeightToElement = () => {
            const availableHeight = this.getAvailableHeight();
            this.element.style.setProperty('max-height', `${availableHeight}px`);
        };

        if (constrain && this.popupSvc) {
            this.resizeObserverSubscriber = _observeResize(
                this.gos,
                this.popupSvc?.getPopupParent(),
                applyMaxHeightToElement
            );
        } else {
            this.element.style.removeProperty('max-height');
            if (this.resizeObserverSubscriber) {
                this.resizeObserverSubscriber();
                this.resizeObserverSubscriber = undefined;
            }
        }
    }

    private setPosition(x: number, y: number): void {
        this.position.x = x;
        this.position.y = y;
    }

    private updateDragStartPosition(x: number, y: number) {
        this.dragStartPosition = { x, y };
    }

    private calculateMouseMovement(params: {
        e: MouseEvent;
        topBuffer?: number;
        anywhereWithin?: boolean;
        isLeft?: boolean;
        isTop?: boolean;
    }): { movementX: number; movementY: number } {
        const { e, isLeft, isTop, anywhereWithin, topBuffer } = params;

        const xDiff = e.clientX - this.dragStartPosition.x;
        const yDiff = e.clientY - this.dragStartPosition.y;

        const movementX = this.shouldSkipX(e, !!isLeft, !!anywhereWithin, xDiff) ? 0 : xDiff;
        const movementY = this.shouldSkipY(e, !!isTop, topBuffer, yDiff) ? 0 : yDiff;

        return { movementX, movementY };
    }

    private shouldSkipX(e: MouseEvent, isLeft: boolean, anywhereWithin: boolean, diff: number): boolean {
        const elRect = this.element.getBoundingClientRect();
        const parentRect = this.offsetParent.getBoundingClientRect();
        const boundaryElRect = this.boundaryEl!.getBoundingClientRect();
        const xPosition = this.config.popup ? this.position.x : elRect.left;
        // skip if cursor is outside of popupParent horizontally
        let skipX =
            (xPosition <= 0 && parentRect.left >= e.clientX) ||
            (parentRect.right <= e.clientX && parentRect.right <= boundaryElRect.right);

        if (skipX) {
            return true;
        }

        if (isLeft) {
            skipX =
                // skip if we are moving to the left and the cursor
                // is positioned to the right of the left side anchor
                (diff < 0 && e.clientX > xPosition + parentRect.left) ||
                // skip if we are moving to the right and the cursor
                // is positioned to the left of the dialog
                (diff > 0 && e.clientX < xPosition + parentRect.left);
        } else {
            if (anywhereWithin) {
                // if anywhereWithin is true, we allow to move
                // as long as the cursor is within the dialog
                skipX =
                    (diff < 0 && e.clientX > boundaryElRect.right) ||
                    (diff > 0 && e.clientX < xPosition + parentRect.left);
            } else {
                skipX =
                    // if the movement is bound to the right side of the dialog
                    // we skip if we are moving to the left and the cursor
                    // is to the right of the dialog
                    (diff < 0 && e.clientX > boundaryElRect.right) ||
                    // or skip if we are moving to the right and the cursor
                    // is to the left of the right side anchor
                    (diff > 0 && e.clientX < boundaryElRect.right);
            }
        }

        return skipX;
    }

    private shouldSkipY(e: MouseEvent, isTop: boolean, topBuffer: number = 0, diff: number): boolean {
        const elRect = this.element.getBoundingClientRect();
        const parentRect = this.offsetParent.getBoundingClientRect();
        const boundaryElRect = this.boundaryEl!.getBoundingClientRect();
        const yPosition = this.config.popup ? this.position.y : elRect.top;

        // skip if cursor is outside of popupParent vertically
        let skipY =
            (yPosition <= 0 && parentRect.top >= e.clientY) ||
            (parentRect.bottom <= e.clientY && parentRect.bottom <= boundaryElRect.bottom);

        if (skipY) {
            return true;
        }

        if (isTop) {
            skipY =
                // skip if we are moving to towards top and the cursor is
                // below the top anchor + topBuffer
                // note: topBuffer is used when moving the dialog using the title bar
                (diff < 0 && e.clientY > yPosition + parentRect.top + topBuffer) ||
                // skip if we are moving to the bottom and the cursor is
                // above the top anchor
                (diff > 0 && e.clientY < yPosition + parentRect.top);
        } else {
            skipY =
                // skip if we are moving towards the top and the cursor
                // is below the bottom anchor
                (diff < 0 && e.clientY > boundaryElRect.bottom) ||
                // skip if we are moving towards the bottom and the cursor
                // is above the bottom anchor
                (diff > 0 && e.clientY < boundaryElRect.bottom);
        }

        return skipY;
    }

    private createResizeMap() {
        const eGui = this.element;

        this.resizerMap = {
            topLeft: { element: eGui.querySelector('[data-ref=eTopLeftResizer]') as HTMLElement },
            top: { element: eGui.querySelector('[data-ref=eTopResizer]') as HTMLElement },
            topRight: { element: eGui.querySelector('[data-ref=eTopRightResizer]') as HTMLElement },
            right: { element: eGui.querySelector('[data-ref=eRightResizer]') as HTMLElement },
            bottomRight: { element: eGui.querySelector('[data-ref=eBottomRightResizer]') as HTMLElement },
            bottom: { element: eGui.querySelector('[data-ref=eBottomResizer]') as HTMLElement },
            bottomLeft: { element: eGui.querySelector('[data-ref=eBottomLeftResizer]') as HTMLElement },
            left: { element: eGui.querySelector('[data-ref=eLeftResizer]') as HTMLElement },
        };
    }

    private addResizers() {
        if (this.resizersAdded) {
            return;
        }

        const eGui = this.element;

        if (!eGui) {
            return;
        }

        const parser = new DOMParser();
        const resizers = parser.parseFromString(RESIZE_TEMPLATE, 'text/html').body;

        eGui.appendChild(resizers.firstChild!);
        this.createResizeMap();
        this.resizersAdded = true;
    }

    private removeResizers() {
        this.resizerMap = undefined;
        const resizerEl = this.element.querySelector(`.${RESIZE_CONTAINER_STYLE}`);

        if (resizerEl) {
            this.element.removeChild(resizerEl);
        }
        this.resizersAdded = false;
    }

    private getResizerElement(side: ResizableSides): HTMLElement | null {
        return this.resizerMap![side].element;
    }

    private onResizeStart(e: MouseEvent, side: ResizableSides) {
        this.boundaryEl = this.findBoundaryElement();

        if (!this.positioned) {
            this.initialisePosition();
        }

        this.currentResizer = {
            isTop: !!side.match(/top/i),
            isRight: !!side.match(/right/i),
            isBottom: !!side.match(/bottom/i),
            isLeft: !!side.match(/left/i),
        };

        this.element.classList.add('ag-resizing');
        this.resizerMap![side].element.classList.add('ag-active');

        const { popup, forcePopupParentAsOffsetParent } = this.config;

        if (!popup && !forcePopupParentAsOffsetParent) {
            this.applySizeToSiblings(this.currentResizer.isBottom || this.currentResizer.isTop);
        }

        this.isResizing = true;
        this.updateDragStartPosition(e.clientX, e.clientY);
    }

    private getSiblings(): HTMLElement[] | null {
        const element = this.element;
        const parent = element.parentElement;
        if (!parent) {
            return null;
        }

        return Array.prototype.slice
            .call(parent.children)
            .filter((el: HTMLElement) => !el.classList.contains('ag-hidden'));
    }

    private getMinSizeOfSiblings(): { height: number; width: number } {
        const siblings = this.getSiblings() || [];

        let height = 0;
        let width = 0;

        for (let i = 0; i < siblings.length; i++) {
            const currentEl = siblings[i];
            const isFlex = !!currentEl.style.flex && currentEl.style.flex !== '0 0 auto';

            if (currentEl === this.element) {
                continue;
            }

            let nextHeight = this.minHeight || 0;
            let nextWidth = this.minWidth || 0;

            if (isFlex) {
                const computedStyle = window.getComputedStyle(currentEl);
                if (computedStyle.minHeight) {
                    nextHeight = parseInt(computedStyle.minHeight, 10);
                }
                if (computedStyle.minWidth) {
                    nextWidth = parseInt(computedStyle.minWidth, 10);
                }
            } else {
                nextHeight = currentEl.offsetHeight;
                nextWidth = currentEl.offsetWidth;
            }

            height += nextHeight;
            width += nextWidth;
        }

        return { height, width };
    }

    private applySizeToSiblings(vertical: boolean) {
        let containerToFlex: HTMLElement | null = null;
        const siblings = this.getSiblings();

        if (!siblings) {
            return;
        }

        for (let i = 0; i < siblings.length; i++) {
            const el = siblings[i];

            if (el === containerToFlex) {
                continue;
            }

            if (vertical) {
                el.style.height = `${el.offsetHeight}px`;
            } else {
                el.style.width = `${el.offsetWidth}px`;
            }
            el.style.flex = '0 0 auto';

            if (el === this.element) {
                containerToFlex = siblings[i + 1];
            }
        }

        if (containerToFlex) {
            containerToFlex.style.removeProperty('height');
            containerToFlex.style.removeProperty('min-height');
            containerToFlex.style.removeProperty('max-height');
            containerToFlex.style.flex = '1 1 auto';
        }
    }

    public isResizable(): boolean {
        return Object.values(this.resizable).some((value) => value);
    }

    private onResize(e: MouseEvent) {
        if (!this.isResizing || !this.currentResizer) {
            return;
        }

        const { popup, forcePopupParentAsOffsetParent } = this.config;
        const { isTop, isRight, isBottom, isLeft } = this.currentResizer;
        const isHorizontal = isRight || isLeft;
        const isVertical = isBottom || isTop;
        const { movementX, movementY } = this.calculateMouseMovement({ e, isLeft, isTop });

        const xPosition = this.position.x;
        const yPosition = this.position.y;

        let offsetLeft = 0;
        let offsetTop = 0;

        if (isHorizontal && movementX) {
            const direction = isLeft ? -1 : 1;
            const oldWidth = this.getWidth();
            const newWidth = oldWidth! + movementX * direction;
            let skipWidth = false;

            if (isLeft) {
                offsetLeft = oldWidth! - newWidth;
                if (xPosition + offsetLeft <= 0 || newWidth <= this.minWidth) {
                    skipWidth = true;
                    offsetLeft = 0;
                }
            }

            if (!skipWidth) {
                this.setWidth(newWidth);
            }
        }

        if (isVertical && movementY) {
            const direction = isTop ? -1 : 1;
            const oldHeight = this.getHeight();
            const newHeight = oldHeight! + movementY * direction;
            let skipHeight = false;

            if (isTop) {
                offsetTop = oldHeight! - newHeight;
                if (yPosition + offsetTop <= 0 || newHeight <= this.minHeight!) {
                    skipHeight = true;
                    offsetTop = 0;
                }
            } else {
                // do not let the size of all siblings be higher than the parent container
                if (
                    !this.config.popup &&
                    !this.config.forcePopupParentAsOffsetParent &&
                    oldHeight! < newHeight &&
                    this.getMinSizeOfSiblings().height + newHeight > this.element.parentElement!.offsetHeight
                ) {
                    skipHeight = true;
                }
            }

            if (!skipHeight) {
                this.setHeight(newHeight);
            }
        }

        this.updateDragStartPosition(e.clientX, e.clientY);

        if (((popup || forcePopupParentAsOffsetParent) && offsetLeft) || offsetTop) {
            this.offsetElement(xPosition + offsetLeft, yPosition + offsetTop);
        }
    }

    private onResizeEnd(e: MouseEvent, side: ResizableSides) {
        this.isResizing = false;
        this.currentResizer = null;
        this.boundaryEl = null;

        this.element.classList.remove('ag-resizing');
        this.resizerMap![side].element.classList.remove('ag-active');

        this.dispatchLocalEvent({ type: 'resize' });
    }

    private refreshSize() {
        const eGui = this.element;

        if (this.config.popup) {
            if (!this.config.width) {
                this.setWidth(eGui.offsetWidth);
            }

            if (!this.config.height) {
                this.setHeight(eGui.offsetHeight);
            }
        }
    }

    private onMoveStart(e: MouseEvent) {
        this.boundaryEl = this.findBoundaryElement();

        if (!this.positioned) {
            this.initialisePosition();
        }

        this.isMoving = true;

        this.element.classList.add('ag-moving');
        this.updateDragStartPosition(e.clientX, e.clientY);
    }

    private onMove(e: MouseEvent) {
        if (!this.isMoving) {
            return;
        }

        const { x, y } = this.position;
        let topBuffer;

        if (this.config.calculateTopBuffer) {
            topBuffer = this.config.calculateTopBuffer();
        }

        const { movementX, movementY } = this.calculateMouseMovement({
            e,
            isTop: true,
            anywhereWithin: true,
            topBuffer,
        });

        this.offsetElement(x + movementX, y + movementY);
        this.updateDragStartPosition(e.clientX, e.clientY);
    }

    private onMoveEnd() {
        this.isMoving = false;
        this.boundaryEl = null;
        this.element.classList.remove('ag-moving');
    }

    private setOffsetParent() {
        if (this.config.forcePopupParentAsOffsetParent && this.popupSvc) {
            this.offsetParent = this.popupSvc.getPopupParent();
        } else {
            this.offsetParent = this.element.offsetParent as HTMLElement;
        }
    }

    private findBoundaryElement(): HTMLElement {
        let el = this.element;
        while (el) {
            if (window.getComputedStyle(el).position !== 'static') {
                return el;
            }
            el = el.parentElement as HTMLElement;
        }

        return this.element;
    }

    private clearResizeListeners(): void {
        while (this.resizeListeners.length) {
            const params = this.resizeListeners.pop()!;
            this.dragSvc?.removeDragSource(params);
        }
    }

    public override destroy() {
        super.destroy();

        if (this.moveElementDragListener) {
            this.dragSvc?.removeDragSource(this.moveElementDragListener);
        }

        this.constrainSizeToAvailableHeight(false);
        this.clearResizeListeners();
        this.removeResizers();
    }
}
