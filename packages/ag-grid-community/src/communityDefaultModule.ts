import { ColumnMoveModule } from './columnMove/columnMoveModule';
import { ColumnResizeModule } from './columnResize/columnResizeModule';
import { ColumnGroupModule } from './columns/columnGroups/columnGroupModule';
import { DataTypeModule } from './columns/columnModule';
import { ColumnGroupHeaderCompModule, ColumnHeaderCompModule } from './headerRendering/cells/headerModule';
import type { _ModuleWithoutApi } from './interfaces/iModule';
import { baseCommunityModule } from './interfaces/iModule';
import { AnimationFrameModule } from './misc/animationFrameModule';
import { TouchModule } from './misc/touchModule';
import { KeyboardNavigationModule } from './navigation/navigationModule';
import { PinnedColumnModule } from './pinnedColumns/pinnedColumnModule';
import { AriaModule } from './rendering/ariaModule';
import { OverlayModule } from './rendering/overlays/overlayModule';
import { SortModule } from './sort/sortModule';
import { ChangeDetectionModule } from './valueService/valueModule';

export const CommunityDefaultModule: _ModuleWithoutApi = {
    ...baseCommunityModule('CommunityDefaultModule'),
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
    ],
};
