/**
 * If value is undefined, null or blank, returns null, otherwise returns the value
 * @param {T} value
 * @returns {T | null}
 */
export function _makeNull<T>(value?: T): T | null {
    if (value == null || value === '') {
        return null;
    }
    return value;
}

export function __stringify(value: any){
    return JSON.stringify(value, (_,v)=> typeof v == "bigint" ? v.toString()+"n" : v);
}

export function _exists(value: string | null | undefined): value is string;
export function _exists<T>(value: T): value is NonNullable<T>;
export function _exists(value: any): boolean {
    return value != null && value !== '';
}

export function _missing<T>(value: T | null | undefined): value is Exclude<undefined | null, T>;
export function _missing(value: any): boolean {
    return !_exists(value);
}

export function _toStringOrNull(value: any): string | null {
    return value != null && typeof value.toString === 'function' ? value.toString() : null;
}

export function _jsonEquals<T1, T2>(val1: T1, val2: T2): boolean {
    const val1Json = val1 ? __stringify(val1) : null;
    const val2Json = val2 ? __stringify(val2) : null;

    return val1Json === val2Json;
}

export function _defaultComparator(valueA: any, valueB: any, accentedCompare: boolean = false): number {
    const valueAMissing = valueA == null;
    const valueBMissing = valueB == null;

    // this is for aggregations sum and avg, where the result can be a number that is wrapped.
    // if we didn't do this, then the toString() value would be used, which would result in
    // the strings getting used instead of the numbers.
    if (valueA && valueA.toNumber) {
        valueA = valueA.toNumber();
    }

    if (valueB && valueB.toNumber) {
        valueB = valueB.toNumber();
    }

    if (valueAMissing && valueBMissing) {
        return 0;
    }

    if (valueAMissing) {
        return -1;
    }

    if (valueBMissing) {
        return 1;
    }

    function doQuickCompare<T>(a: T, b: T): number {
        return a > b ? 1 : a < b ? -1 : 0;
    }

    if (typeof valueA !== 'string') {
        return doQuickCompare(valueA, valueB);
    }

    if (!accentedCompare) {
        return doQuickCompare(valueA, valueB);
    }

    try {
        // using local compare also allows chinese comparisons
        return valueA.localeCompare(valueB);
    } catch (e) {
        // if something wrong with localeCompare, eg not supported
        // by browser, then just continue with the quick one
        return doQuickCompare(valueA, valueB);
    }
}
