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

function _isNonNullObject(value: any): boolean {
    return typeof value === 'object' && value !== null;
}

export function _getObjectPaths(obj: Record<string, unknown>): string[][] {
    const stack: { path: string[]; cursor: Record<string, unknown> }[] = [{ path: [], cursor: obj }];
    const paths: string[][] = [];

    while (stack.length > 0) {
        const { path, cursor } = stack.pop()!;

        if (cursor && typeof cursor === 'object' && !Array.isArray(cursor)) {
            for (const [key, value] of Object.entries(cursor)) {
                stack.push({ path: path.concat(key), cursor: value as Record<string, unknown> });
            }
        } else {
            paths.push(path);
        }
    }

    return paths;
}
