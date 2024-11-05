import type { _ColumnMoveApi } from '../api/gridApi';
import { DragAndDropModule } from '../dragAndDrop/dragModule';
import { baseCommunityModule } from '../interfaces/iModule';
import type { _ModuleWithApi, _ModuleWithoutApi } from '../interfaces/iModule';
import { columnMovingCSS } from './column-moving.css-GENERATED';
import { moveColumnByIndex, moveColumns } from './columnMoveApi';
import { ColumnMoveService } from './columnMoveService';

/**
 * @feature Columns -> Column Moving
 */
export const ColumnMoveCoreModule: _ModuleWithoutApi = {
    ...baseCommunityModule('ColumnMoveCoreModule'),
    beans: [ColumnMoveService],
    dependsOn: [DragAndDropModule],
    css: [columnMovingCSS],
};

/**
 * @feature Columns -> Column Moving
 */
export const ColumnMoveApiModule: _ModuleWithApi<_ColumnMoveApi> = {
    ...baseCommunityModule('ColumnMoveApiModule'),
    apiFunctions: {
        moveColumnByIndex,
        moveColumns,
    },
    dependsOn: [ColumnMoveCoreModule],
};

/**
 * @feature Columns -> Column Moving
 */
export const ColumnMoveModule: _ModuleWithoutApi = {
    ...baseCommunityModule('ColumnMoveModule'),
    dependsOn: [ColumnMoveApiModule],
};
