import type { _ModuleWithoutApi } from 'ag-grid-community';

import { GridLicenseManager as LicenseManager } from './license/gridLicenseManager';
import { VERSION } from './version';

export { AgWatermark } from './license/watermark';

/**
 * @internal
 */
export const EnterpriseCoreModule: _ModuleWithoutApi = {
    moduleName: 'EnterpriseCore',
    version: VERSION,
    beans: [LicenseManager],
    icons: {
        // accordion open (filter tool panel group, charts group)
        accordionOpen: 'tree-open',
        // accordion closed (filter tool panel group, charts group)
        accordionClosed: 'tree-closed',
        // accordion indeterminate - shown when some children are expanded and
        //     others are collapsed (filter tool panel group, charts group)
        accordionIndeterminate: 'tree-indeterminate',
        // dialog title bar
        close: 'cross',
        // X (remove) on column 'pill' after adding it to a drop zone list
        cancel: 'cancel',
        // button in chart regular size window title bar (click to maximise)
        maximize: 'maximize',
        // button in chart maximised window title bar (click to make regular size)
        minimize: 'minimize',
        // drag handle used to pick up draggable columns
        columnDrag: 'grip',
    },
    dependsOn: [],
};
