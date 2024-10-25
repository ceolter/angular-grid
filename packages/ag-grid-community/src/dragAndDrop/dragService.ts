import { KeyCode } from '../constants/keyCode';
import type { NamedBean } from '../context/bean';
import { BeanStub } from '../context/beanStub';
import type { BeanCollection } from '../context/context';
import type { MouseEventService } from '../gridBodyComp/mouseEventService';
import { _getDocument, _getRootNode } from '../gridOptionsUtils';
import { _removeFromArray } from '../utils/array';
import { _isBrowserSafari } from '../utils/browser';
import { _isFocusableFormField } from '../utils/dom';
import { _exists } from '../utils/generic';
import { _areEventsNear } from '../utils/mouse';

/** Adds drag listening onto an element. In AG Grid this is used twice, first is resizing columns,
 * second is moving the columns and column groups around (ie the 'drag' part of Drag and Drop. */
export class DragService extends BeanStub implements NamedBean {
    beanName = 'dragSvc' as const;

    private mouseEventSvc: MouseEventService;

    public wireBeans(beans: BeanCollection): void {
        this.mouseEventSvc = beans.mouseEventSvc;
    }

    private currentDragParams: DragListenerParams | null;
    private dragging: boolean;
    private startTarget: EventTarget | null;
    private mouseStartEvent: MouseEvent | null;
    private touchLastTime: Touch | null;
    private touchStart: Touch | null;

    private dragEndFunctions: ((...args: any[]) => any)[] = [];

    private dragSources: DragSourceAndListener[] = [];

    public override destroy(): void {
        this.dragSources.forEach(this.removeListener.bind(this));
        this.dragSources.length = 0;
        super.destroy();
    }

    private removeListener(dragSourceAndListener: DragSourceAndListener): void {
        const element = dragSourceAndListener.dragSource.eElement;
        const mouseDownListener = dragSourceAndListener.mouseDownListener;
        element.removeEventListener('mousedown', mouseDownListener);

        // remove touch listener only if it exists
        if (dragSourceAndListener.touchEnabled) {
            const touchStartListener = dragSourceAndListener.touchStartListener;
            element.removeEventListener('touchstart', touchStartListener!, { passive: true } as any);
        }
    }

    public removeDragSource(params: DragListenerParams): void {
        const dragSourceAndListener = this.dragSources.find((item) => item.dragSource === params);

        if (!dragSourceAndListener) {
            return;
        }

        this.removeListener(dragSourceAndListener);
        _removeFromArray(this.dragSources, dragSourceAndListener);
    }

    public isDragging(): boolean {
        return this.dragging;
    }

    public addDragSource(params: DragListenerParams): void {
        const mouseListener = this.onMouseDown.bind(this, params);
        const { eElement, includeTouch, stopPropagationForTouch } = params;

        eElement.addEventListener('mousedown', mouseListener);

        let touchListener: ((touchEvent: TouchEvent) => void) | null = null;

        const suppressTouch = this.gos.get('suppressTouch');

        if (includeTouch && !suppressTouch) {
            touchListener = (touchEvent: TouchEvent) => {
                if (_isFocusableFormField(touchEvent.target as HTMLElement)) {
                    return;
                }
                if (stopPropagationForTouch) {
                    touchEvent.stopPropagation();
                }
                this.onTouchStart(params, touchEvent);
            };
            // we set passive=false, as we want to prevent default on this event
            eElement.addEventListener('touchstart', touchListener, { passive: false });
        }

        this.dragSources.push({
            dragSource: params,
            mouseDownListener: mouseListener,
            touchStartListener: touchListener,
            touchEnabled: !!includeTouch,
        });
    }

    public getStartTarget(): EventTarget | null {
        return this.startTarget;
    }

    // gets called whenever mouse down on any drag source
    private onTouchStart(params: DragListenerParams, touchEvent: TouchEvent): void {
        this.currentDragParams = params;
        this.dragging = false;

        const touch = touchEvent.touches[0];

        this.touchLastTime = touch;
        this.touchStart = touch;

        const touchMoveEvent = (e: TouchEvent) => this.onTouchMove(e, params.eElement);
        const touchEndEvent = (e: TouchEvent) => this.onTouchUp(e, params.eElement);
        const documentTouchMove = (e: TouchEvent) => {
            if (e.cancelable) {
                e.preventDefault();
            }
        };

        const target = touchEvent.target as Document | ShadowRoot | EventTarget;
        const events = [
            // Prevents the page document from moving while we are dragging items around.
            // preventDefault needs to be called in the touchmove listener and never inside the
            // touchstart, because using touchstart causes the click event to be cancelled on touch devices.
            {
                target: _getRootNode(this.gos),
                type: 'touchmove',
                listener: documentTouchMove,
                options: { passive: false },
            },
            { target, type: 'touchmove', listener: touchMoveEvent, options: { passive: true } },
            { target, type: 'touchend', listener: touchEndEvent, options: { passive: true } },
            { target, type: 'touchcancel', listener: touchEndEvent, options: { passive: true } },
        ];
        // temporally add these listeners, for the duration of the drag
        this.addTemporaryEvents(events);

        // see if we want to start dragging straight away
        if (params.dragStartPixels === 0) {
            this.onCommonMove(touch, this.touchStart, params.eElement);
        }
    }

    // gets called whenever mouse down on any drag source
    private onMouseDown(params: DragListenerParams, mouseEvent: MouseEvent): void {
        const e = mouseEvent as any;

        if (params.skipMouseEvent && params.skipMouseEvent(mouseEvent)) {
            return;
        }

        // if there are two elements with parent / child relationship, and both are draggable,
        // when we drag the child, we should NOT drag the parent. an example of this is row moving
        // and range selection - row moving should get preference when use drags the rowDrag component.
        if (e._alreadyProcessedByDragService) {
            return;
        }

        e._alreadyProcessedByDragService = true;

        // only interested in left button clicks
        if (mouseEvent.button !== 0) {
            return;
        }

        if (this.shouldPreventMouseEvent(mouseEvent)) {
            mouseEvent.preventDefault();
        }

        this.currentDragParams = params;
        this.dragging = false;

        this.mouseStartEvent = mouseEvent;
        this.startTarget = mouseEvent.target;

        const mouseMoveEvent = (event: MouseEvent) => this.onMouseMove(event, params.eElement);
        const mouseUpEvent = (event: MouseEvent) => this.onMouseUp(event, params.eElement);
        const contextEvent = (event: MouseEvent) => event.preventDefault();
        const keydownEvent = (event: KeyboardEvent) => {
            if (event.key === KeyCode.ESCAPE) {
                this.cancelDrag(params.eElement);
            }
        };

        const target = _getRootNode(this.gos);
        const events = [
            { target, type: 'mousemove', listener: mouseMoveEvent },
            { target, type: 'mouseup', listener: mouseUpEvent },
            { target, type: 'contextmenu', listener: contextEvent },
            { target, type: 'keydown', listener: keydownEvent },
        ];
        // temporally add these listeners, for the duration of the drag
        this.addTemporaryEvents(events);

        //see if we want to start dragging straight away
        if (params.dragStartPixels === 0) {
            this.onMouseMove(mouseEvent, params.eElement);
        }
    }

    private addTemporaryEvents(
        events: {
            target: Document | ShadowRoot | EventTarget;
            type: string;
            listener: (e: MouseEvent | TouchEvent | KeyboardEvent, el: HTMLElement) => void;
            options?: any;
        }[]
    ): void {
        events.forEach((currentEvent) => {
            const { target, type, listener, options } = currentEvent;
            target.addEventListener(type, listener as any, options);
        });

        this.dragEndFunctions.push(() => {
            events.forEach((currentEvent) => {
                const { target, type, listener, options } = currentEvent;
                target.removeEventListener(type, listener as any, options);
            });
        });
    }

    // returns true if the event is close to the original event by X pixels either vertically or horizontally.
    // we only start dragging after X pixels so this allows us to know if we should start dragging yet.
    private isEventNearStartEvent(currentEvent: MouseEvent | Touch, startEvent: MouseEvent | Touch): boolean {
        // by default, we wait 4 pixels before starting the drag
        const { dragStartPixels } = this.currentDragParams!;
        const requiredPixelDiff = _exists(dragStartPixels) ? dragStartPixels : 4;
        return _areEventsNear(currentEvent, startEvent, requiredPixelDiff);
    }

    private getFirstActiveTouch(touchList: TouchList): Touch | null {
        for (let i = 0; i < touchList.length; i++) {
            if (touchList[i].identifier === this.touchStart!.identifier) {
                return touchList[i];
            }
        }
        return null;
    }

    private onCommonMove(currentEvent: MouseEvent | Touch, startEvent: MouseEvent | Touch, el: Element): void {
        if (!this.dragging) {
            // if mouse hasn't travelled from the start position enough, do nothing
            if (this.isEventNearStartEvent(currentEvent, startEvent)) {
                return;
            }

            this.dragging = true;
            this.eventSvc.dispatchEvent({
                type: 'dragStarted',
                target: el,
            });

            this.currentDragParams!.onDragStart(startEvent);
            // we need ONE drag action at the startEvent, so that we are guaranteed the drop target
            // at the start gets notified. this is because the drag can start outside of the element
            // that started it, as the mouse is allowed drag away from the mouse down before it's
            // considered a drag (the isEventNearStartEvent() above). if we didn't do this, then
            // it would be possible to click a column by the edge, then drag outside of the drop zone
            // in less than 4 pixels and the drag officially starts outside of the header but the header
            // wouldn't be notified of the dragging.

            // if currentDragParams is null here, it means that drag has been cancelled.
            if (!this.currentDragParams) {
                this.dragging = false;
                return;
            }

            this.currentDragParams.onDragging(startEvent);
        }

        this.currentDragParams?.onDragging(currentEvent);
    }

    private onTouchMove(touchEvent: TouchEvent, el: Element): void {
        const touch = this.getFirstActiveTouch(touchEvent.touches);
        if (!touch) {
            return;
        }

        // this.___statusPanel.setInfoText(Math.random() + ' onTouchMove preventDefault stopPropagation');
        this.onCommonMove(touch, this.touchStart!, el);
    }

    // only gets called after a mouse down - as this is only added after mouseDown
    // and is removed when mouseUp happens
    private onMouseMove(mouseEvent: MouseEvent, el: Element): void {
        if (_isBrowserSafari()) {
            const eDocument = _getDocument(this.gos);
            eDocument.getSelection()?.removeAllRanges();
        }

        if (this.shouldPreventMouseEvent(mouseEvent)) {
            mouseEvent.preventDefault();
        }

        this.onCommonMove(mouseEvent, this.mouseStartEvent!, el);
    }

    private shouldPreventMouseEvent(mouseEvent: MouseEvent): boolean {
        const isEnableCellTextSelect = this.gos.get('enableCellTextSelection');
        const isMouseMove = mouseEvent.type === 'mousemove';

        return (
            // when `isEnableCellTextSelect` is `true`, we need to preventDefault on mouseMove
            // to avoid the grid text being selected while dragging components.
            isEnableCellTextSelect &&
            isMouseMove &&
            mouseEvent.cancelable &&
            this.mouseEventSvc.isEventFromThisGrid(mouseEvent) &&
            !this.isOverFormFieldElement(mouseEvent)
        );
    }

    private isOverFormFieldElement(mouseEvent: MouseEvent): boolean {
        const el = mouseEvent.target as HTMLElement | null;
        const tagName = el?.tagName.toLocaleLowerCase();

        return !!tagName?.match('^a$|textarea|input|select|button');
    }

    public onTouchUp(touchEvent: TouchEvent, el: Element): void {
        let touch = this.getFirstActiveTouch(touchEvent.changedTouches);

        // i haven't worked this out yet, but there is no matching touch
        // when we get the touch up event. to get around this, we swap in
        // the last touch. this is a hack to 'get it working' while we
        // figure out what's going on, why we are not getting a touch in
        // current event.
        if (!touch) {
            touch = this.touchLastTime;
        }

        // if mouse was left up before we started to move, then this is a tap.
        // we check this before onUpCommon as onUpCommon resets the dragging
        // let tap = !this.dragging;
        // let tapTarget = this.currentDragParams.eElement;

        this.onUpCommon(touch!, el);

        // if tap, tell user
        // console.log(`${Math.random()} tap = ${tap}`);
        // if (tap) {
        //     tapTarget.click();
        // }
    }

    public onMouseUp(mouseEvent: MouseEvent, el: Element): void {
        this.onUpCommon(mouseEvent, el);
    }

    public onUpCommon(eventOrTouch: MouseEvent | Touch, el: Element): void {
        if (this.dragging) {
            this.dragging = false;
            this.currentDragParams!.onDragStop(eventOrTouch);
            this.eventSvc.dispatchEvent({
                type: 'dragStopped',
                target: el,
            });
        }
        this.resetDragProperties();
    }

    public cancelDrag(el: Element): void {
        this.eventSvc.dispatchEvent({
            type: 'dragCancelled',
            target: el,
        });

        this.currentDragParams?.onDragCancel?.();
        this.resetDragProperties();
    }

    private resetDragProperties(): void {
        this.mouseStartEvent = null;
        this.startTarget = null;
        this.touchStart = null;
        this.touchLastTime = null;
        this.currentDragParams = null;

        this.dragEndFunctions.forEach((func) => func());
        this.dragEndFunctions.length = 0;
    }
}

interface DragSourceAndListener {
    dragSource: DragListenerParams;
    mouseDownListener: (mouseEvent: MouseEvent) => void;
    touchEnabled: boolean;
    touchStartListener: ((touchEvent: TouchEvent) => void) | null;
}

export interface DragListenerParams {
    /** After how many pixels of dragging should the drag operation start. Default is 4px. */
    dragStartPixels?: number;
    /** Dom element to add the drag handling to */
    eElement: Element;
    /** Some places may wish to ignore certain events, eg range selection ignores shift clicks */
    skipMouseEvent?: (mouseEvent: MouseEvent) => boolean;
    /** Callback for drag starting */
    onDragStart: (mouseEvent: MouseEvent | Touch) => void;
    /** Callback for drag stopping */
    onDragStop: (mouseEvent: MouseEvent | Touch) => void;
    /** Callback for drag cancel */
    onDragCancel?: () => void;
    /** Callback for mouse move while dragging */
    onDragging: (mouseEvent: MouseEvent | Touch) => void;
    /** Include touch events for this Drag Listener */
    includeTouch?: boolean;
    /** If `true`, it will stop the propagation of Touch Events */
    stopPropagationForTouch?: boolean;
}
