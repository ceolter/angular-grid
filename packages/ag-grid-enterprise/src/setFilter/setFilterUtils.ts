import { _defaultComparator, _last, _makeNull, _toStringOrNull, _warn } from 'ag-grid-community';
import type { BeanStub, SetFilterParams } from 'ag-grid-community';

import type { ISetFilterLocaleText } from './localeText';
import { DEFAULT_LOCALE_TEXT } from './localeText';

export function processDataPath(
    dataPath: string[] | null,
    treeData: boolean,
    groupAllowUnbalanced: boolean
): (string | null)[] | null {
    let processedDataPath: (string | null)[] | null = dataPath;
    if (!processedDataPath) {
        return null;
    }

    processedDataPath = processedDataPath.map((treeKey) => _toStringOrNull(_makeNull(treeKey)));

    // leave `null`s in the path unless unbalanced groups
    if (!treeData && groupAllowUnbalanced && processedDataPath.some((treeKey) => treeKey == null)) {
        if (_last(processedDataPath) == null) {
            return null;
        }
        return processedDataPath.filter((treeKey) => treeKey != null);
    }
    return processedDataPath;
}

export function translateForSetFilter(bean: BeanStub<any>, key: keyof ISetFilterLocaleText): string {
    return bean.getLocaleTextFunc()(key, DEFAULT_LOCALE_TEXT[key]);
}

export function applyExcelModeOptions<V>(params: SetFilterParams<any, V>): void {
    // apply default options to match Excel behaviour, unless they have already been specified
    if (params.excelMode === 'windows') {
        if (!params.buttons) {
            params.buttons = ['apply', 'cancel'];
        }

        if (params.closeOnApply == null) {
            params.closeOnApply = true;
        }
    } else if (params.excelMode === 'mac') {
        if (!params.buttons) {
            params.buttons = ['reset'];
        }

        if (params.applyMiniFilterWhileTyping == null) {
            params.applyMiniFilterWhileTyping = true;
        }

        if (params.debounceMs == null) {
            params.debounceMs = 500;
        }
    }
    if (params.excelMode && params.defaultToNothingSelected) {
        params.defaultToNothingSelected = false;
        _warn(207);
    }
}

export function createTreeDataOrGroupingComparator(): (
    a: [string | null, string[] | null],
    b: [string | null, string[] | null]
) => number {
    return ([_aKey, aValue]: [string | null, string[] | null], [_bKey, bValue]: [string | null, string[] | null]) => {
        if (aValue == null) {
            return bValue == null ? 0 : -1;
        } else if (bValue == null) {
            return 1;
        }
        for (let i = 0; i < aValue.length; i++) {
            if (i >= bValue.length) {
                return 1;
            }
            const diff = _defaultComparator(aValue[i], bValue[i]);
            if (diff !== 0) {
                return diff;
            }
        }
        return 0;
    };
}
