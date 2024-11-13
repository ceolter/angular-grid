import type { _DragGridApi } from '../api/gridApi';
import { baseCommunityModule } from '../interfaces/iModule';
import type { _ModuleWithApi, _ModuleWithoutApi } from '../interfaces/iModule';
import { DndSourceComp } from '../rendering/dndSourceComp';
import { DragAndDropImageComponent } from './dragAndDropImageComponent';
import { DragAndDropService } from './dragAndDropService';
import { addRowDropZone, getRowDropZoneParams, removeRowDropZone } from './dragApi';
import { DragService } from './dragService';
import { HorizontalResizeService } from './horizontalResizeService';
import { RowDragService } from './rowDragService';

/**
 * @internal
 */
export const DragModule: _ModuleWithoutApi = {
    ...baseCommunityModule('DragModule'),
    beans: [DragService],
};

/**
 * @feature Import & Export -> Drag & Drop
 * @colDef dndSource, dndSourceOnRowDrag
 */
export const NativeDragModule: _ModuleWithoutApi = {
    ...baseCommunityModule('NativeDragModule'),
    dynamicBeans: {
        dndSourceComp: DndSourceComp as any,
    },
    icons: {
        // drag handle used to pick up draggable rows
        rowDrag: 'grip',
    },
};

/**
 * @internal
 */
export const DragAndDropModule: _ModuleWithoutApi = {
    ...baseCommunityModule('DragAndDropModule'),
    beans: [DragAndDropService],
    dependsOn: [DragModule],
    userComponents: {
        agDragAndDropImage: DragAndDropImageComponent,
    },
    icons: {
        // shown on drag and drop image component icon while dragging column to the side of the grid to pin
        columnMovePin: 'pin',
        // shown on drag and drop image component icon while dragging over part of the page that is not a drop zone
        columnMoveHide: 'eye-slash',
        // shown on drag and drop image component icon while dragging columns to reorder
        columnMoveMove: 'arrows',
        // animating icon shown when dragging a column to the right of the grid causes horizontal scrolling
        columnMoveLeft: 'left',
        // animating icon shown when dragging a column to the left of the grid causes horizontal scrolling
        columnMoveRight: 'right',
        // shown on drag and drop image component icon while dragging over Row Groups drop zone
        columnMoveGroup: 'group',
        // shown on drag and drop image component icon while dragging over Values drop zone
        columnMoveValue: 'aggregation',
        // shown on drag and drop image component icon while dragging over pivot drop zone
        columnMovePivot: 'pivot',
        // shown on drag and drop image component icon while dragging over drop zone that doesn't support it, e.g.
        //     string column over aggregation drop zone
        dropNotAllowed: 'not-allowed',
        // drag handle used to pick up draggable rows
        rowDrag: 'grip',
    },
};

/**
 * @feature Rows -> Row Dragging
 * @colDef rowDrag
 */
export const RowDragModule: _ModuleWithApi<_DragGridApi> = {
    ...baseCommunityModule('RowDragModule'),
    beans: [RowDragService],
    apiFunctions: {
        addRowDropZone,
        removeRowDropZone,
        getRowDropZoneParams,
    },
    dependsOn: [DragAndDropModule],
};

/**
 * @internal
 */
export const HorizontalResizeModule: _ModuleWithoutApi = {
    ...baseCommunityModule('HorizontalResizeModule'),
    beans: [HorizontalResizeService],
    dependsOn: [DragModule],
};
