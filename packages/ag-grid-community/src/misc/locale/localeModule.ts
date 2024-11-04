import type { _ModuleWithoutApi } from '../../interfaces/iModule';
import { baseCommunityModule } from '../../interfaces/iModule';
import { LocaleService } from './localeService';

/**
 * @feature Interactivity -> Localisation
 * @gridOption localeText, getLocaleText
 */
export const LocaleModule: _ModuleWithoutApi = {
    ...baseCommunityModule('LocaleModule'),
    beans: [LocaleService],
};
