import type { LocaleService } from './localeService';

export type LocaleTextFunc = (key: string, defaultValue: string, variableValues?: string[]) => string;

function defaultLocaleTextFunc(_key: string, defaultValue: string): string {
    return defaultValue;
}

export function _getLocaleTextFunc(localeSvc?: LocaleService): LocaleTextFunc {
    return localeSvc?.getLocaleTextFunc() ?? defaultLocaleTextFunc;
}
