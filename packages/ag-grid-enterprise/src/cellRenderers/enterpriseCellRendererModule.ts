import type { _ModuleWithoutApi } from 'ag-grid-community';

import { EnterpriseCoreModule } from '../agGridEnterpriseModule';
import { VERSION } from '../version';
import { LoadingCellRenderer } from './loadingCellRenderer';
import { SkeletonCellRenderer } from './skeletonCellRenderer';

/**
 * @internal
 */
export const LoadingCellRendererModule: _ModuleWithoutApi = {
    moduleName: 'LoadingCellRenderer',
    version: VERSION,
    userComponents: {
        agLoadingCellRenderer: LoadingCellRenderer,
    },
    icons: {
        // rotating spinner shown by the loading cell renderer
        groupLoading: 'loading',
    },
    dependsOn: [EnterpriseCoreModule],
};

/**
 * @internal
 */
export const SkeletonCellRendererModule: _ModuleWithoutApi = {
    moduleName: 'SkeletonCellRenderer',
    version: VERSION,
    userComponents: {
        agSkeletonCellRenderer: SkeletonCellRenderer,
    },
    dependsOn: [EnterpriseCoreModule],
};
