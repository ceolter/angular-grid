import type { _ColumnMoveApi } from '../api/gridApi';
import { SharedDragAndDropModule } from '../dragAndDrop/dragModule';
import { baseCommunityModule } from '../interfaces/iModule';
import type { _ModuleWithApi } from '../interfaces/iModule';
import { columnMovingCSS } from './column-moving.css-GENERATED';
import { ColumnAnimationService } from './columnAnimationService';
import { moveColumnByIndex, moveColumns } from './columnMoveApi';
import { ColumnMoveService } from './columnMoveService';

/**
 * @feature Columns -> Column Moving
 */
export const ColumnMoveModule: _ModuleWithApi<_ColumnMoveApi> = {
    ...baseCommunityModule('ColumnMoveModule'),
    beans: [ColumnMoveService, ColumnAnimationService],
    apiFunctions: {
        moveColumnByIndex,
        moveColumns,
    },
    dependsOn: [SharedDragAndDropModule],
    css: [columnMovingCSS],
};
