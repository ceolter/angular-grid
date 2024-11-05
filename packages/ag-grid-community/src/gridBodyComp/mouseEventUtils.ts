import type { BeanCollection } from '../context/context';
import type { DraggingEvent } from '../dragAndDrop/dragAndDropService';
import type { GridOptionsService } from '../gridOptionsService';
import { _isDomLayout } from '../gridOptionsUtils';
import type { CellPosition } from '../interfaces/iCellPosition';
import { _getCellCtrlForEventTarget } from '../rendering/cell/cellCtrl';
import { _exists } from '../utils/generic';

const GRID_DOM_KEY = '__ag_grid_instance';

// we put the instance id onto the main DOM element. this is used for events, when grids are inside grids,
// so the grid can work out if the even came from this grid or a grid inside this one. see the ctrl+v logic
// for where this is used.
export function _stampTopLevelGridCompWithGridInstance(gos: GridOptionsService, eGridDiv: HTMLElement): void {
    (eGridDiv as any)[GRID_DOM_KEY] = gos.gridInstanceId;
}

// walks the path of the event, and returns true if this grid is the first one that it finds. if doing
// master / detail grids, and a child grid is found, then it returns false. this stops things like copy/paste
// getting executed on many grids at the same time.
export function _isEventFromThisGrid(gos: GridOptionsService, event: UIEvent): boolean {
    const res = _isElementInThisGrid(gos, event.target as HTMLElement);
    return res;
}

export function _isElementInThisGrid(gos: GridOptionsService, element: HTMLElement): boolean {
    let pointer: HTMLElement | null = element;
    while (pointer) {
        const instanceId = (pointer as any)[GRID_DOM_KEY];
        if (_exists(instanceId)) {
            const eventFromThisGrid = instanceId === gos.gridInstanceId;
            return eventFromThisGrid;
        }
        pointer = pointer.parentElement;
    }
    return false;
}

export function _getCellPositionForEvent(
    gos: GridOptionsService,
    event: MouseEvent | KeyboardEvent
): CellPosition | null {
    return _getCellCtrlForEventTarget(gos, event.target)?.cellPosition ?? null;
}

export function _getNormalisedMousePosition(
    beans: BeanCollection,
    event: MouseEvent | DraggingEvent
): { x: number; y: number } {
    const gridPanelHasScrolls = _isDomLayout(beans.gos, 'normal');
    const e = event as MouseEvent;
    let x: number;
    let y: number;

    if (e.clientX != null || e.clientY != null) {
        x = e.clientX;
        y = e.clientY;
    } else {
        x = e.x;
        y = e.y;
    }

    if (gridPanelHasScrolls) {
        const scrollFeature = beans.ctrlsSvc.getScrollFeature();
        const vRange = scrollFeature.getVScrollPosition();
        const hRange = scrollFeature.getHScrollPosition();
        x += hRange.left;
        y += vRange.top;
    }

    return { x, y };
}
