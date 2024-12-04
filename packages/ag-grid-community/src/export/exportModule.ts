import type { _ModuleWithoutApi } from '../interfaces/iModule';
import { VERSION } from '../version';
import { GridSerializer } from './gridSerializer';

// Shared CSV and Excel logic
/**
 * @internal
 */
export const SharedExportModule: _ModuleWithoutApi = {
    moduleName: 'SharedExport',
    version: VERSION,
    beans: [GridSerializer],
};
