import type { _ModuleWithoutApi } from 'ag-grid-community';
import { EditCoreModule } from 'ag-grid-community';

import { EnterpriseCoreModule } from '../agGridEnterpriseModule';
import { baseEnterpriseModule } from '../moduleUtils';
import { RichSelectCellEditor } from './richSelectCellEditor';

/**
 * @feature Editing -> Rich Select Editor
 */
export const RichSelectModule: _ModuleWithoutApi = {
    ...baseEnterpriseModule('RichSelectModule'),
    beans: [],
    userComponents: { agRichSelect: RichSelectCellEditor, agRichSelectCellEditor: RichSelectCellEditor },
    icons: {
        // open icon for rich select editor
        richSelectOpen: 'small-down',
        // remove for rich select editor pills
        richSelectRemove: 'cancel',
    },
    dependsOn: [EnterpriseCoreModule, EditCoreModule],
};
