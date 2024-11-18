import { ApiFunctionService } from './api/apiFunctionService';
import { destroy, getGridId, getGridOption, isDestroyed, setGridOption, updateGridOptions } from './api/coreApi';
import type { _CoreGridApi } from './api/gridApi';
import { ColumnMoveModule } from './columnMove/columnMoveModule';
import { ColumnResizeModule } from './columnResize/columnResizeModule';
import { ColumnGroupModule } from './columns/columnGroups/columnGroupModule';
import { ColumnModel } from './columns/columnModel';
import { ColumnFlexModule, DataTypeModule } from './columns/columnModule';
import { ColumnNameService } from './columns/columnNameService';
import { ColumnViewportService } from './columns/columnViewportService';
import { VisibleColsService } from './columns/visibleColsService';
import { CellRendererFunctionModule } from './components/framework/cellRendererFunctionModule';
import { Registry } from './components/framework/registry';
import { UserComponentFactory } from './components/framework/userComponentFactory';
import { CtrlsService } from './ctrlsService';
import { Environment } from './environment';
import { EventService } from './eventService';
import { FocusService } from './focusService';
import { ScrollVisibleService } from './gridBodyComp/scrollVisibleService';
import { GridDestroyService } from './gridDestroyService';
import { GridOptionsService } from './gridOptionsService';
import { ColumnGroupHeaderCompModule, ColumnHeaderCompModule } from './headerRendering/cells/headerModule';
import type { _ModuleWithApi } from './interfaces/iModule';
import { baseCommunityModule } from './interfaces/iModule';
import { AnimationFrameModule } from './misc/animationFrameModule';
import { TouchModule } from './misc/touchModule';
import { KeyboardNavigationModule } from './navigation/navigationModule';
import { PageBoundsListener } from './pagination/pageBoundsListener';
import { PageBoundsService } from './pagination/pageBoundsService';
import { PinnedColumnModule } from './pinnedColumns/pinnedColumnModule';
import { AriaModule } from './rendering/ariaModule';
import { OverlayModule } from './rendering/overlays/overlayModule';
import { RowContainerHeightService } from './rendering/rowContainerHeightService';
import { RowRenderer } from './rendering/rowRenderer';
import { SortModule } from './sort/sortModule';
import { SyncService } from './syncService';
import { ChangeDetectionModule, ExpressionModule } from './valueService/valueModule';
import { ValueService } from './valueService/valueService';

/**
 * @internal
 */
export const CommunityCoreModule: _ModuleWithApi<_CoreGridApi> = {
    ...baseCommunityModule('CommunityCoreModule'),
    beans: [
        GridDestroyService,
        ApiFunctionService,
        Registry,
        UserComponentFactory,
        RowContainerHeightService,
        VisibleColsService,
        EventService,
        GridOptionsService,
        ColumnModel,
        PageBoundsService,
        PageBoundsListener,
        RowRenderer,
        ValueService,
        FocusService,
        Environment,
        ScrollVisibleService,
        CtrlsService,
        SyncService,
        ColumnNameService,
        ColumnViewportService,
    ],
    icons: {
        // icon on select dropdowns (select cell editor, charts tool panels)
        selectOpen: 'small-down',

        /** @deprecated v33 */
        smallDown: 'small-down',
        /** @deprecated v33 */
        colorPicker: 'color-picker',
        /** @deprecated v33 */
        smallUp: 'small-up',
        /** @deprecated v33 */
        checkboxChecked: 'small-up',
        /** @deprecated v33 */
        checkboxIndeterminate: 'checkbox-indeterminate',
        /** @deprecated v33 */
        checkboxUnchecked: 'checkbox-unchecked',
        /** @deprecated v33 */
        radioButtonOn: 'radio-button-on',
        /** @deprecated v33 */
        radioButtonOff: 'radio-button-off',
        /** @deprecated v33 */
        smallLeft: 'small-left',
        /** @deprecated v33 */
        smallRight: 'small-right',
    },
    apiFunctions: {
        getGridId,
        destroy,
        isDestroyed,
        getGridOption,
        setGridOption,
        updateGridOptions,
    },
    dependsOn: [
        DataTypeModule,
        ColumnMoveModule,
        ColumnResizeModule,
        SortModule,
        ColumnHeaderCompModule,
        ColumnGroupModule,
        ColumnGroupHeaderCompModule,
        OverlayModule,
        ChangeDetectionModule,
        AnimationFrameModule,
        KeyboardNavigationModule,
        PinnedColumnModule,
        AriaModule,
        TouchModule,
        CellRendererFunctionModule,
        ColumnFlexModule,
        ExpressionModule,
    ],
};
