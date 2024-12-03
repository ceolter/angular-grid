import { type ParamType, getParamDocs, getParamType } from '@components/theme-builder/api';
import { useAtom, useAtomValue } from 'jotai';

import { themeQuartz } from 'ag-grid-community';

import { getThemeDefaultParams } from '../components/component-utils';
import type { PersistentAtom } from './JSONStorage';
import { atomWithJSONStorage } from './JSONStorage';
import type { Store } from './store';
import { type ThemeParam, memoize, titleCase } from './utils';

const paramModels: Record<string, unknown> = {};

// Params that are editable in the UI immediately without adding as an advanced param
const nonAdvancedParams = new Set([
    'fontFamily',
    'fontSize',
    'backgroundColor',
    'foregroundColor',
    'accentColor',
    'borderColor',
    'wrapperBorder',
    'rowBorder',
    'columnBorder',
    'sidePanelBorder',
    'spacing',
    'wrapperBorderRadius',
    'borderRadius',
    'headerBackgroundColor',
    'headerTextColor',
    'headerFontFamily',
    'headerFontSize',
    'headerFontWeight',
    'headerVerticalPaddingScale',
    'cellTextColor',
    'oddRowBackgroundColor',
    'rowVerticalPaddingScale',
    'cellHorizontalPaddingScale',
    'iconSize',
]);

export class ParamModel<T> {
    readonly label: string;
    readonly docs: string;
    readonly type: ParamType;
    readonly valueAtom: PersistentAtom<T | undefined>;

    private constructor(readonly property: ThemeParam) {
        this.label = titleCase(property);
        this.valueAtom = atomWithJSONStorage<T | undefined>(`param.${property}`, undefined);
        this.docs = getParamDocs(property) || '';
        this.type = getParamType(property);
    }

    hasValue = (store: Store) => store.get(this.valueAtom) != null;

    get onlyEditableAsAdvancedParam(): boolean {
        return !nonAdvancedParams.has(this.property);
    }

    static for<T>(property: ThemeParam | ParamModel<T>): ParamModel<T> {
        if (property instanceof ParamModel) {
            return property;
        }
        if (!paramModels[property]) {
            paramModels[property] = new ParamModel<T>(property);
        }
        return paramModels[property] as ParamModel<T>;
    }
}

export const useParamAtom = <T>(model: ParamModel<T>) => useAtom(model.valueAtom);

export const useParam = <T>(model: ParamModel<T>) => useAtomValue(model.valueAtom);

export const allParamModels = memoize(() => {
    const defaultModeParams = getThemeDefaultParams(themeQuartz);
    const allParams = Array.from(Object.keys(defaultModeParams)) as ThemeParam[];
    return (
        allParams
            .sort()
            .map(ParamModel.for)
            // trying to edit a `url(data:svg image)` in a text editor doesn't work well
            .filter((param) => !/Image$/.test(param.property))
            .sort((a, b) => a.label.toLowerCase().localeCompare(b.label.toLowerCase()))
    );
});
