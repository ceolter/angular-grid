import type { _ModuleWithoutApi } from 'ag-grid-community';

import { baseEnterpriseModule } from '../moduleUtils';
import { PivotModule } from '../pivot/pivotModule';
import { TreeDataModule } from '../treeData/treeDataModule';
import { RowGroupingOnlyModule } from './rowGroupingModule';

// this is the original module that also includes pivoting and tree data
/**
 * @feature Row Grouping, Tree Data, Pivoting
 */
export const RowGroupingModule: _ModuleWithoutApi = {
    ...baseEnterpriseModule('RowGroupingModule'),
    dependsOn: [PivotModule, RowGroupingOnlyModule, TreeDataModule],
};
