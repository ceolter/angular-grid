import { _exists } from './generic';

// Prevents the risk of prototype pollution
export const SKIP_JS_BUILTINS = new Set<string>(['__proto__', 'constructor', 'prototype']);

function _iterateObject<T>(
    object: { [p: string]: T } | T[] | null | undefined,
    callback: (key: string, value: T) => void
) {
    if (object == null) {
        return;
    }

    if (Array.isArray(object)) {
        for (let i = 0; i < object.length; i++) {
            callback(i.toString(), object[i]);
        }
        return;
    }

    for (const [key, value] of Object.entries<T>(object)) {
        callback(key, value);
    }
}

export function _mergeDeep(dest: any, source: any, copyUndefined = true, makeCopyOfSimpleObjects = false): void {
    if (!_exists(source)) {
        return;
    }

    _iterateObject(source, (key: string, sourceValue: any) => {
        if (SKIP_JS_BUILTINS.has(key)) {
            return;
        }

        let destValue: any = dest[key];

        if (destValue === sourceValue) {
            return;
        }

        // when creating params, we don't want to just copy objects over. otherwise merging ColDefs (eg DefaultColDef
        // and Column Types) would result in params getting shared between objects.
        // by putting an empty value into destValue first, it means we end up copying over values from
        // the source object, rather than just copying in the source object in it's entirety.
        if (makeCopyOfSimpleObjects) {
            const objectIsDueToBeCopied = destValue == null && sourceValue != null;

            if (objectIsDueToBeCopied) {
                // 'simple object' means a bunch of key/value pairs, eg {filter: 'myFilter'}, as opposed
                // to a Class instance (such as api instance).
                const doNotCopyAsSourceIsSimpleObject =
                    typeof sourceValue === 'object' && sourceValue.constructor === Object;

                if (doNotCopyAsSourceIsSimpleObject) {
                    destValue = {};
                    dest[key] = destValue;
                }
            }
        }

        if (_isNonNullObject(sourceValue) && _isNonNullObject(destValue) && !Array.isArray(destValue)) {
            _mergeDeep(destValue, sourceValue, copyUndefined, makeCopyOfSimpleObjects);
        } else if (copyUndefined || sourceValue !== undefined) {
            dest[key] = sourceValue;
        }
    });
}

export function _getValueUsingField(data: any, field: string, fieldContainsDots: boolean): any {
    if (!field || !data) {
        return;
    }

    // if no '.', then it's not a deep value
    if (!fieldContainsDots) {
        return data[field];
    }

    // otherwise it is a deep value, so need to dig for it
    const fields = field.split('.');
    let currentObject = data;

    for (let i = 0; i < fields.length; i++) {
        if (currentObject == null) {
            return undefined;
        }
        currentObject = currentObject[fields[i]];
    }

    return currentObject;
}

function _isNonNullObject(value: any): value is object {
    return typeof value === 'object' && value !== null;
}

export function _isDeepEqual(left: unknown, right: unknown): boolean {
    if (!_isNonNullObject(left) || !_isNonNullObject(right)) {
        return left === right;
    }

    const leftKeys = Object.keys(left);
    const rightKeys = Object.keys(right);

    if (leftKeys.length !== rightKeys.length) {
        return false;
    }

    const diff = new Set();
    leftKeys.forEach((k) => {
        if (!(k in right)) {
            diff.add(k);
        }
    });

    if (diff.size > 0) {
        return false;
    }

    return leftKeys.reduce((acc, k) => acc && _isDeepEqual((left as any)[k], (right as any)[k]), true);
}
