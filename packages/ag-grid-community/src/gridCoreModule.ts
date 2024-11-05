import { ApiFunctionService } from './api/apiFunctionService';
import { CoreApiModule } from './api/apiModule';
import { ColumnFactory } from './columns/columnFactory';
import { ColumnModel } from './columns/columnModel';
import { ColumnNameService } from './columns/columnNameService';
import { ColumnStateService } from './columns/columnStateService';
import { ColumnViewportService } from './columns/columnViewportService';
import { VisibleColsService } from './columns/visibleColsService';
import { Registry } from './components/framework/registry';
import { UserComponentFactory } from './components/framework/userComponentFactory';
import { CtrlsService } from './ctrlsService';
import { Environment } from './environment';
import { EventService } from './eventService';
import { FocusService } from './focusService';
import { MouseEventService } from './gridBodyComp/mouseEventService';
import { ScrollVisibleService } from './gridBodyComp/scrollVisibleService';
import { GridDestroyService } from './gridDestroyService';
import { GridOptionsService } from './gridOptionsService';
import type { _ModuleWithoutApi } from './interfaces/iModule';
import { baseCommunityModule } from './interfaces/iModule';
import { PageBoundsListener } from './pagination/pageBoundsListener';
import { PageBoundsService } from './pagination/pageBoundsService';
import { AriaAnnouncementService } from './rendering/ariaAnnouncementService';
import { RowContainerHeightService } from './rendering/rowContainerHeightService';
import { RowRenderer } from './rendering/rowRenderer';
import { SyncService } from './syncService';
import { ValueService } from './valueService/valueService';

export const CommunityCoreModule: _ModuleWithoutApi = {
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
        ColumnFactory,
        ValueService,
        FocusService,
        MouseEventService,
        Environment,
        ScrollVisibleService,
        CtrlsService,
        SyncService,
        AriaAnnouncementService,
        ColumnStateService,
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
    dependsOn: [CoreApiModule],
};
