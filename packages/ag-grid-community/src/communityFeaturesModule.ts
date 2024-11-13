import { AlignedGridsModule } from './alignedGrids/alignedGridsModule';
import { RowApiModule, ScrollApiModule } from './api/apiModule';
import { ColumnAutoSizeModule } from './columnAutosize/columnAutosizeModule';
import { ColumnHoverModule } from './columns/columnHover/columnHoverModule';
import { ColumnApiModule, ColumnFlexModule, GetColumnDefsApiModule } from './columns/columnModule';
import { CommunityDefaultModule } from './communityDefaultModule';
import { CellRendererFunctionModule } from './components/framework/cellRendererFunctionModule';
import { NativeDragModule, RowDragModule } from './dragAndDrop/dragModule';
import { EditModule } from './edit/editModule';
import { FilterModule } from './filter/filterModule';
import type { _ModuleWithoutApi } from './interfaces/iModule';
import { baseCommunityModule } from './interfaces/iModule';
import { EventApiModule } from './misc/apiEvents/apiEventModule';
import { LocaleModule } from './misc/locale/localeModule';
import { StateModule } from './misc/state/stateModule';
import { PaginationModule } from './pagination/paginationModule';
import { PinnedRowModule } from './pinnedRowModel/pinnedRowModule';
import { CellFlashModule } from './rendering/cell/cellFlashModule';
import {
    AnimateShowChangeCellRendererModule,
    AnimateSlideCellRendererModule,
    CheckboxCellRendererModule,
} from './rendering/cellRenderers/cellRendererModule';
import { StickyRowModule } from './rendering/features/stickyRowModule';
import { RenderApiModule } from './rendering/renderModule';
import { RowAutoHeightModule } from './rendering/row/rowAutoHeightModule';
import { RowSelectionModule } from './selection/rowSelectionModule';
import { CellStyleModule, RowStyleModule } from './styling/stylingModule';
import { TooltipModule } from './tooltip/tooltipModule';
import { ValidationModule } from './validation/validationModule';
import { CellApiModule, ExpressionModule, ValueCacheModule } from './valueService/valueModule';
import { PopupModule } from './widgets/popupModule';

export const CommunityFeaturesModule: _ModuleWithoutApi = {
    ...baseCommunityModule('CommunityFeaturesModule'),
    dependsOn: [
        CommunityDefaultModule,
        ValidationModule,
        EditModule,
        FilterModule,
        StateModule,
        AlignedGridsModule,
        PaginationModule,
        ColumnApiModule,
        RowApiModule,
        ScrollApiModule,
        RenderApiModule,
        ColumnAutoSizeModule,
        RowDragModule,
        PinnedRowModule,
        StickyRowModule,
        RowSelectionModule,
        ValueCacheModule,
        ExpressionModule,
        AnimateShowChangeCellRendererModule,
        AnimateSlideCellRendererModule,
        CheckboxCellRendererModule,
        CellRendererFunctionModule,
        PopupModule,
        CellStyleModule,
        ColumnHoverModule,
        GetColumnDefsApiModule,
        RowStyleModule,
        EventApiModule,
        ColumnFlexModule,
        CellApiModule,
        CellFlashModule,
        TooltipModule,
        LocaleModule,
        RowAutoHeightModule,
        NativeDragModule,
    ],
};
