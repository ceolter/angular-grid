import { AlignedGridsModule } from './alignedGrids/alignedGridsModule';
import { RowApiModule, ScrollApiModule } from './api/apiModule';
import { ClientSideRowModelModule } from './clientSideRowModel/clientSideRowModelModule';
import { ClientSideRowModelApiModule } from './clientSideRowModel/clientSideRowModelModule';
import { ColumnAutoSizeModule } from './columnAutosize/columnAutosizeModule';
import { ColumnHoverModule } from './columns/columnHover/columnHoverModule';
import { ColumnApiModule } from './columns/columnModule';
import { CsvExportModule } from './csvExport/csvExportModule';
import { DragAndDropModule, RowDragModule } from './dragAndDrop/dragModule';
import {
    CheckboxEditorModule,
    CustomEditorModule,
    DateEditorModule,
    LargeTextEditorModule,
    NumberEditorModule,
    SelectEditorModule,
    TextEditorModule,
    UndoRedoEditModule,
} from './edit/editModule';
import {
    CustomFilterModule,
    DateFilterModule,
    ExternalFilterModule,
    NumberFilterModule,
    QuickFilterModule,
    TextFilterModule,
} from './filter/filterModule';
import { InfiniteRowModelModule } from './infiniteRowModel/infiniteRowModelModule';
import type { _ModuleWithoutApi } from './interfaces/iModule';
import { baseCommunityModule } from './interfaces/iModule';
import { EventApiModule } from './misc/apiEvents/apiEventModule';
import { LocaleModule } from './misc/locale/localeModule';
import { GridStateModule } from './misc/state/stateModule';
import { PaginationModule } from './pagination/paginationModule';
import { PinnedRowModule } from './pinnedRowModel/pinnedRowModule';
import { HighlightChangesModule } from './rendering/cell/highlightChangesModule';
import { RenderApiModule } from './rendering/renderModule';
import { RowAutoHeightModule } from './rendering/row/rowAutoHeightModule';
import { RowSelectionModule } from './selection/rowSelectionModule';
import { CellStyleModule, RowStyleModule } from './styling/stylingModule';
import { TooltipModule } from './tooltip/tooltipModule';
import { ValidationModule } from './validation/validationModule';
import { CellApiModule, ValueCacheModule } from './valueService/valueModule';

/**
 * @feature All Community Features
 */
export const AllCommunityModule: _ModuleWithoutApi = {
    ...baseCommunityModule('AllCommunityModule'),
    dependsOn: [
        ClientSideRowModelModule,
        CsvExportModule,
        InfiniteRowModelModule,
        ValidationModule,
        TextEditorModule,
        NumberEditorModule,
        DateEditorModule,
        CheckboxEditorModule,
        SelectEditorModule,
        LargeTextEditorModule,
        CustomEditorModule,
        UndoRedoEditModule,
        TextFilterModule,
        NumberFilterModule,
        DateFilterModule,
        CustomFilterModule,
        QuickFilterModule,
        ExternalFilterModule,
        GridStateModule,
        AlignedGridsModule,
        PaginationModule,
        ColumnApiModule,
        RowApiModule,
        ScrollApiModule,
        RenderApiModule,
        ColumnAutoSizeModule,
        RowDragModule,
        PinnedRowModule,
        RowSelectionModule,
        ValueCacheModule,
        CellStyleModule,
        ColumnHoverModule,
        RowStyleModule,
        EventApiModule,
        CellApiModule,
        HighlightChangesModule,
        TooltipModule,
        LocaleModule,
        RowAutoHeightModule,
        DragAndDropModule,
        ClientSideRowModelApiModule,
    ],
};
