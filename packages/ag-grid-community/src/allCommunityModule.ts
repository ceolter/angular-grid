import { ClientSideRowModelModule } from './clientSideRowModel/clientSideRowModelModule';
import { CommunityFeaturesModule } from './communityFeaturesModule';
import { CsvExportModule } from './csvExport/csvExportModule';
import { InfiniteRowModelModule } from './infiniteRowModel/infiniteRowModelModule';
import type { _ModuleWithoutApi } from './interfaces/iModule';
import { baseCommunityModule } from './interfaces/iModule';

export const AllCommunityModule: _ModuleWithoutApi = {
    ...baseCommunityModule('AllCommunityModule'),
    dependsOn: [ClientSideRowModelModule, CsvExportModule, InfiniteRowModelModule, CommunityFeaturesModule],
};
