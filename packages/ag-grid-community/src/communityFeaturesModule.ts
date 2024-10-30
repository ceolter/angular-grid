import { AlignedGridsModule } from './alignedGrids/alignedGridsModule';
import { RowApiModule, ScrollApiModule } from './api/apiModule';
import { ColumnAutosizeModule } from './columnAutosize/columnAutosizeModule';
import { ColumnMoveModule } from './columnMove/columnMoveModule';
import { ColumnResizeModule } from './columnResize/columnResizeModule';
import { ColumnGroupModule } from './columns/columnGroups/columnGroupModule';
import { ColumnHoverModule } from './columns/columnHover/columnHoverModule';
import {
    ColumnApiModule,
    ColumnFlexModule,
    DataTypeModule,
    GetColumnDefsApiModule,
    SelectionColumnModule,
} from './columns/columnModule';
import { CellRendererFunctionModule } from './components/framework/cellRendererFunctionModule';
import { DragAndDropModule, NativeDragModule, RowDragModule } from './dragAndDrop/dragModule';
import { EditModule } from './edit/editModule';
import { FilterModule } from './filter/filterModule';
import { ColumnGroupHeaderCompModule, ColumnHeaderCompModule } from './headerRendering/cells/headerModule';
import type { _ModuleWithoutApi } from './interfaces/iModule';
import { baseCommunityModule } from './interfaces/iModule';
import { AnimationFrameModule } from './misc/animationFrameModule';
import { EventApiModule } from './misc/apiEvents/apiEventModule';
import { LocaleModule } from './misc/locale/localeModule';
import { CommunityMenuApiModule } from './misc/menu/sharedMenuModule';
import { StateModule } from './misc/state/stateModule';
import { TouchModule } from './misc/touchModule';
import { KeyboardNavigationModule } from './navigation/navigationModule';
import { PaginationModule } from './pagination/paginationModule';
import { PinnedColumnModule } from './pinnedColumns/pinnedColumnModule';
import { PinnedRowModule } from './pinnedRowModel/pinnedRowModule';
import { AriaModule } from './rendering/ariaModule';
import { CellFlashModule } from './rendering/cell/cellFlashModule';
import {
    AnimateShowChangeCellRendererModule,
    AnimateSlideCellRendererModule,
    CheckboxCellRendererModule,
} from './rendering/cellRenderers/cellRendererModule';
import { ColumnAnimationModule } from './rendering/columnAnimationModule';
import { StickyRowModule } from './rendering/features/stickyRowModule';
import { OverlayModule } from './rendering/overlays/overlayModule';
import { RenderApiModule } from './rendering/renderModule';
import { RowAutoHeightModule } from './rendering/row/rowAutoHeightModule';
import { RowSelectionModule } from './selection/rowSelectionModule';
import { SortModule } from './sort/sortModule';
import { CellStyleModule, RowStyleModule } from './styling/stylingModule';
import { TooltipModule } from './tooltip/tooltipModule';
import { ValidationModule } from './validation/validationModule';
import { CellApiModule, ChangeDetectionModule, ExpressionModule, ValueCacheModule } from './valueService/valueModule';
import { PopupModule } from './widgets/popupModule';

export const CommunityFeaturesModule: _ModuleWithoutApi = {
    ...baseCommunityModule('CommunityFeaturesModule'),
    dependsOn: [
        ValidationModule,
        EditModule,
        FilterModule,
        StateModule,
        DataTypeModule,
        AlignedGridsModule,
        PaginationModule,
        ColumnApiModule,
        RowApiModule,
        ScrollApiModule,
        RenderApiModule,
        ColumnMoveModule,
        ColumnAutosizeModule,
        SelectionColumnModule,
        ColumnResizeModule,
        DragAndDropModule,
        RowDragModule,
        PinnedRowModule,
        StickyRowModule,
        RowSelectionModule,
        SortModule,
        ValueCacheModule,
        ExpressionModule,
        AnimateShowChangeCellRendererModule,
        AnimateSlideCellRendererModule,
        CheckboxCellRendererModule,
        ColumnHeaderCompModule,
        ColumnGroupHeaderCompModule,
        ColumnGroupModule,
        OverlayModule,
        CellRendererFunctionModule,
        PopupModule,
        CellStyleModule,
        ColumnHoverModule,
        ColumnAnimationModule,
        ChangeDetectionModule,
        AnimationFrameModule,
        GetColumnDefsApiModule,
        RowStyleModule,
        EventApiModule,
        ColumnFlexModule,
        KeyboardNavigationModule,
        CellApiModule,
        CommunityMenuApiModule,
        CellFlashModule,
        TooltipModule,
        PinnedColumnModule,
        LocaleModule,
        RowAutoHeightModule,
        NativeDragModule,
        AriaModule,
        TouchModule,
    ],
};
