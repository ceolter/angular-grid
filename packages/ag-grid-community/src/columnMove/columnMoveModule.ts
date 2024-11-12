import type { _ColumnMoveApi } from '../api/gridApi';
import { DragAndDropModule } from '../dragAndDrop/dragModule';
import { baseCommunityModule } from '../interfaces/iModule';
import type { _ModuleWithApi, _ModuleWithoutApi } from '../interfaces/iModule';
import { columnMovingCSS } from './column-moving.css-GENERATED';
import { ColumnAnimationService } from './columnAnimationService';
import { moveColumnByIndex, moveColumns } from './columnMoveApi';
import { ColumnMoveService } from './columnMoveService';

/**
 * @feature Columns -> Column Moving
 */
export const ColumnMoveCoreModule: _ModuleWithApi<_ColumnMoveApi> = {
    ...baseCommunityModule('ColumnMoveCoreModule'),
    beans: [ColumnMoveService],
    apiFunctions: {
        moveColumnByIndex,
        moveColumns,
    },
    dependsOn: [DragAndDropModule],
    css: [columnMovingCSS],
};

/**
 * @feature Columns -> Column Moving
 * @gridOption suppressColumnMoveAnimation
 */
export const ColumnAnimationModule: _ModuleWithoutApi = {
    ...baseCommunityModule('ColumnAnimationModule'),
    beans: [ColumnAnimationService],
};

/**
 * @feature Columns -> Column Moving
 */
export const ColumnMoveModule: _ModuleWithApi<_ColumnMoveApi> = {
    ...baseCommunityModule('ColumnMoveModule'),
    dependsOn: [ColumnMoveCoreModule, ColumnAnimationModule],
};
