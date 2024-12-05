import type { _ModuleWithoutApi } from '../../interfaces/iModule';
import { VERSION } from '../../version';
import { LocaleService } from './localeService';

/**
 * @feature Interactivity -> Localisation
 * @gridOption localeText, getLocaleText
 */
export const LocaleModule: _ModuleWithoutApi = {
    moduleName: 'Locale',
    version: VERSION,
    beans: [LocaleService],
};
