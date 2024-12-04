import type { _ModuleWithoutApi } from '../interfaces/iModule';
import { VERSION } from '../version';
import { TouchService } from './touchService';

/**
 * @feature Interactivity -> Touch
 */
export const TouchModule: _ModuleWithoutApi = {
    moduleName: 'Touch',
    version: VERSION,
    beans: [TouchService],
};
