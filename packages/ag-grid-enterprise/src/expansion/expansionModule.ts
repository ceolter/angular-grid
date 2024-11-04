import type { _ModuleWithoutApi } from 'ag-grid-community';

import { EnterpriseCoreModule } from '../agGridEnterpriseModule';
import { baseEnterpriseModule } from '../moduleUtils';
import { ClientSideExpansionService } from './clientSideExpansionService';

/**
 * @feature Row Grouping -> Opening Groups, Tree Data -> Expanding Groups, Master Detail
 */
export const ClientSideRowModelExpansionModule: _ModuleWithoutApi = {
    ...baseEnterpriseModule('ClientSideRowModelExpansionModule'),
    rowModels: ['clientSide'],
    beans: [ClientSideExpansionService],
    dependsOn: [EnterpriseCoreModule],
};
