import type { _ModuleWithoutApi } from '../interfaces/iModule';
import { VERSION } from '../version';
import { ValidationService } from './validationService';

/**
 * @feature Validation
 */
export const ValidationModule: _ModuleWithoutApi = {
    moduleName: 'Validation',
    version: VERSION,
    beans: [ValidationService],
};
