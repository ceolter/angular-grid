import type { NamedBean } from '../context/bean';
import { BeanStub } from '../context/beanStub';
import type { BeanCollection } from '../context/context';
import type { CtrlsService } from '../ctrlsService';
import type { DragListenerParams, DragService } from './dragService';

export interface HorizontalResizeParams {
    eResizeBar: HTMLElement;
    dragStartPixels?: number;
    onResizeStart: (shiftKey: boolean) => void;
    onResizing: (delta: number) => void;
    onResizeEnd: (delta: number) => void;
}

export class HorizontalResizeService extends BeanStub implements NamedBean {
    beanName = 'horizontalResizeSvc' as const;

    private dragSvc: DragService;
    private ctrlsSvc: CtrlsService;

    public wireBeans(beans: BeanCollection): void {
        this.dragSvc = beans.dragSvc!;
        this.ctrlsSvc = beans.ctrlsSvc;
    }

    private dragStartX: number;
    private resizeAmount: number;

    public addResizeBar(params: HorizontalResizeParams): () => void {
        const dragSource: DragListenerParams = {
            dragStartPixels: params.dragStartPixels || 0,
            eElement: params.eResizeBar,
            onDragStart: this.onDragStart.bind(this, params),
            onDragStop: this.onDragStop.bind(this, params),
            onDragging: this.onDragging.bind(this, params),
            onDragCancel: this.onDragStop.bind(this, params),
            includeTouch: true,
            stopPropagationForTouch: true,
        };

        this.dragSvc.addDragSource(dragSource);

        // we pass remove func back to the caller, so call can tell us when they
        // are finished, and then we remove the listener from the drag source
        const finishedWithResizeFunc = () => this.dragSvc.removeDragSource(dragSource);

        return finishedWithResizeFunc;
    }

    private onDragStart(params: HorizontalResizeParams, mouseEvent: MouseEvent | Touch): void {
        this.dragStartX = mouseEvent.clientX;

        this.setResizeIcons();

        const shiftKey = mouseEvent instanceof MouseEvent && mouseEvent.shiftKey === true;
        params.onResizeStart(shiftKey);
    }

    private setResizeIcons(): void {
        const ctrl = this.ctrlsSvc.get('gridCtrl');
        // change the body cursor, so when drag moves out of the drag bar, the cursor is still 'resize' (or 'move'
        ctrl.setResizeCursor(true);
        // we don't want text selection outside the grid (otherwise it looks weird as text highlights when we move)
        ctrl.disableUserSelect(true);
    }

    private onDragStop(params: HorizontalResizeParams): void {
        params.onResizeEnd(this.resizeAmount);
        this.resetIcons();
    }

    private resetIcons(): void {
        const ctrl = this.ctrlsSvc.get('gridCtrl');
        ctrl.setResizeCursor(false);
        ctrl.disableUserSelect(false);
    }

    private onDragging(params: HorizontalResizeParams, mouseEvent: MouseEvent | Touch): void {
        this.resizeAmount = mouseEvent.clientX - this.dragStartX;
        params.onResizing(this.resizeAmount);
    }
}
