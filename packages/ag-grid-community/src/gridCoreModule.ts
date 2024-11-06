import { ApiFunctionService } from './api/apiFunctionService';
import { destroy, getGridId, getGridOption, isDestroyed, setGridOption, updateGridOptions } from './api/coreApi';
import type { _CoreGridApi } from './api/gridApi';
import { ColumnModel } from './columns/columnModel';
import { ColumnNameService } from './columns/columnNameService';
import { ColumnViewportService } from './columns/columnViewportService';
import { VisibleColsService } from './columns/visibleColsService';
import { Registry } from './components/framework/registry';
import { UserComponentFactory } from './components/framework/userComponentFactory';
import { CtrlsService } from './ctrlsService';
import { Environment } from './environment';
import { EventService } from './eventService';
import { FocusService } from './focusService';
import { ScrollVisibleService } from './gridBodyComp/scrollVisibleService';
import { GridDestroyService } from './gridDestroyService';
import { GridOptionsService } from './gridOptionsService';
import type { _ModuleWithApi } from './interfaces/iModule';
import { baseCommunityModule } from './interfaces/iModule';
import { PageBoundsListener } from './pagination/pageBoundsListener';
import { PageBoundsService } from './pagination/pageBoundsService';
import { RowContainerHeightService } from './rendering/rowContainerHeightService';
import { RowRenderer } from './rendering/rowRenderer';
import { SyncService } from './syncService';
import { ValueService } from './valueService/valueService';

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
};
