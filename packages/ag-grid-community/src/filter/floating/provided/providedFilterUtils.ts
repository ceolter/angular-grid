import { _warn } from '../../../validation/logging';
import type { ProvidedFilterParams } from '../../provided/iProvidedFilter';

export function getDebounceMs(params: ProvidedFilterParams, debounceDefault: number): number {
    const { debounceMs } = params;
    if (isUseApplyButton(params)) {
        if (debounceMs != null) {
            _warn(71);
        }

        return 0;
    }

    return debounceMs ?? debounceDefault;
}

export function isUseApplyButton(params: ProvidedFilterParams): boolean {
    return (params.buttons?.indexOf('apply') ?? -1) >= 0;
}
