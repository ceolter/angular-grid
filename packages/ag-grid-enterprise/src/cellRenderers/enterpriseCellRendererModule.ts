import type { _ModuleWithoutApi } from 'ag-grid-community';

import { EnterpriseCoreModule } from '../agGridEnterpriseModule';
import { baseEnterpriseModule } from '../moduleUtils';
import { LoadingCellRenderer } from './loadingCellRenderer';
import { SkeletonCellRenderer } from './skeletonCellRenderer';

/**
 * @internal
 */
export const LoadingCellRendererModule: _ModuleWithoutApi = {
    ...baseEnterpriseModule('LoadingCellRenderer'),
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
    ...baseEnterpriseModule('SkeletonCellRenderer'),
    userComponents: {
        agSkeletonCellRenderer: SkeletonCellRenderer,
    },
    dependsOn: [EnterpriseCoreModule],
};
