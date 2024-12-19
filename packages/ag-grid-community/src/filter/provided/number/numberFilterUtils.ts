import type { NumberFilterParams } from './iNumberFilter';

export function getAllowedCharPattern(filterParams?: NumberFilterParams): string | null {
    const { allowedCharPattern } = filterParams ?? {};

    return allowedCharPattern ?? null;
}

export function processNumberFilterValue(value?: number | null): number | null {
    if (value == null) {
        return null;
    }
    return isNaN(value) ? null : value;
}
