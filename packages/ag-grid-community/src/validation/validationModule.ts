import { baseCommunityModule } from '../interfaces/iModule';
import type { _ModuleWithoutApi } from '../interfaces/iModule';
import { ValidationService } from './validationService';

/**
 * @feature Validation
 */
export const ValidationModule: _ModuleWithoutApi = {
    ...baseCommunityModule('Validation'),
    beans: [ValidationService],
};
