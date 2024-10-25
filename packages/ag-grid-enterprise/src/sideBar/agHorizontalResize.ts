import type { BeanCollection, HorizontalResizeService } from 'ag-grid-community';
import { Component } from 'ag-grid-community';

export class AgHorizontalResize extends Component {
    private horizontalResizeSvc: HorizontalResizeService;

    public wireBeans(beans: BeanCollection) {
        this.horizontalResizeSvc = beans.horizontalResizeSvc!;
    }

    private startingWidth: number;
    private elementToResize: HTMLElement;
    private inverted: boolean;
    private minWidth: number = 100;
    private maxWidth: number | null = null;

    constructor() {
        super(/* html */ `<div class="ag-tool-panel-horizontal-resize"></div>`);
    }

    public setElementToResize(elementToResize: HTMLElement): void {
        this.elementToResize = elementToResize;
    }

    public postConstruct(): void {
        const finishedWithResizeFunc = this.horizontalResizeSvc.addResizeBar({
            eResizeBar: this.getGui(),
            dragStartPixels: 1,
            onResizeStart: this.onResizeStart.bind(this),
            onResizing: this.onResizing.bind(this),
            onResizeEnd: this.onResizeEnd.bind(this),
        });

        this.addDestroyFunc(finishedWithResizeFunc);
        this.setInverted(this.gos.get('enableRtl'));
    }

    private dispatchResizeEvent(start: boolean, end: boolean, width: number) {
        this.eventSvc.dispatchEvent({
            type: 'toolPanelSizeChanged',
            width: width,
            started: start,
            ended: end,
        });
    }

    private onResizeStart(): void {
        this.startingWidth = this.elementToResize.offsetWidth;
        this.dispatchResizeEvent(true, false, this.startingWidth);
    }

    private onResizeEnd(delta: number): void {
        return this.onResizing(delta, true);
    }

    private onResizing(delta: number, isEnd: boolean = false): void {
        const direction = this.inverted ? -1 : 1;
        let newWidth = Math.max(this.minWidth, Math.floor(this.startingWidth - delta * direction));

        if (this.maxWidth != null) {
            newWidth = Math.min(this.maxWidth, newWidth);
        }
        this.elementToResize.style.width = `${newWidth}px`;
        this.dispatchResizeEvent(false, isEnd, newWidth);
    }

    public setInverted(inverted: boolean) {
        this.inverted = inverted;
    }

    public setMaxWidth(value: number | null) {
        this.maxWidth = value;
    }

    public setMinWidth(value: number | null) {
        if (value != null) {
            this.minWidth = value;
        } else {
            this.minWidth = 100;
        }
    }
}
