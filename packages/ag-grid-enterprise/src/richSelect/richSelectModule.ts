import type { _ModuleWithoutApi } from 'ag-grid-community';
import { _EditCoreModule } from 'ag-grid-community';

import { EnterpriseCoreModule } from '../agGridEnterpriseModule';
import { VERSION } from '../version';
import { RichSelectCellEditor } from './richSelectCellEditor';

/**
 * @feature Editing -> Rich Select Editor
 */
export const RichSelectModule: _ModuleWithoutApi = {
    moduleName: 'RichSelect',
    version: VERSION,
    beans: [],
    userComponents: { agRichSelect: RichSelectCellEditor, agRichSelectCellEditor: RichSelectCellEditor },
    icons: {
        // open icon for rich select editor
        richSelectOpen: 'small-down',
        // remove for rich select editor pills
        richSelectRemove: 'cancel',
    },
    dependsOn: [EnterpriseCoreModule, _EditCoreModule],
};
