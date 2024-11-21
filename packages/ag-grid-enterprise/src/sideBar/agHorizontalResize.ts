import { Component } from 'ag-grid-community';

export class AgHorizontalResize extends Component {
    private startingWidth: number;
    public elementToResize: HTMLElement;
    public inverted: boolean;
    public minWidth: number = 100;
    public maxWidth: number | null = null;

    constructor() {
        super(/* html */ `<div class="ag-tool-panel-horizontal-resize"></div>`);
    }

    public postConstruct(): void {
        const finishedWithResizeFunc = this.beans.horizontalResizeSvc!.addResizeBar({
            eResizeBar: this.getGui(),
            dragStartPixels: 1,
            onResizeStart: this.onResizeStart.bind(this),
            onResizing: this.onResizing.bind(this),
            onResizeEnd: this.onResizeEnd.bind(this),
        });

        this.addDestroyFunc(finishedWithResizeFunc);
        this.inverted = this.gos.get('enableRtl');
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
}
