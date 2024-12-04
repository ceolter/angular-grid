import type { _DragGridApi } from '../api/gridApi';
import type { _ModuleWithApi, _ModuleWithoutApi } from '../interfaces/iModule';
import { DndSourceComp } from '../rendering/dndSourceComp';
import { VERSION } from '../version';
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
    moduleName: 'Drag',
    version: VERSION,
    beans: [DragService],
};

/**
 * @feature Import & Export -> Drag & Drop
 * @colDef dndSource, dndSourceOnRowDrag
 */
export const DragAndDropModule: _ModuleWithoutApi = {
    moduleName: 'DragAndDrop',
    version: VERSION,
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
export const SharedDragAndDropModule: _ModuleWithoutApi = {
    moduleName: 'SharedDragAndDrop',
    version: VERSION,
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
    moduleName: 'RowDrag',
    version: VERSION,
    beans: [RowDragService],
    apiFunctions: {
        addRowDropZone,
        removeRowDropZone,
        getRowDropZoneParams,
    },
    dependsOn: [SharedDragAndDropModule],
};

/**
 * @internal
 */
export const HorizontalResizeModule: _ModuleWithoutApi = {
    moduleName: 'HorizontalResize',
    version: VERSION,
    beans: [HorizontalResizeService],
    dependsOn: [DragModule],
};
