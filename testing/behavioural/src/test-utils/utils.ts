import { setTimeout as __asyncSetTimeout } from 'timers/promises';
import util from 'util';
import { vitest } from 'vitest';

const log = console.log;
const info = console.info;

export { log, info };

export const asyncSetTimeout = __asyncSetTimeout;

export async function flushFakeTimers() {
    vitest.advanceTimersByTime(10000);
    vitest.useRealTimers();
    await asyncSetTimeout(2);
}

const cachedJSONObjectsMap = new Map<string, any>();

export const cachedJSONObjects = {
    /** Clears the cache of JSON objects. */
    clear() {
        cachedJSONObjectsMap.clear();
    },

    /**
     * This is useful for writing test code without having to store in variables the objects that are created.
     * This JSON stringify the object to use as a key in a global map, and if the object is already in the map, it returns the cached object.
     * You can call cachedJSONObjects.clear() to clear the cache on beforeEach() call.
     */
    object<T>(obj: T): T {
        if (typeof obj !== 'object' || obj === null) {
            return obj;
        }
        const key = JSON.stringify(obj);
        const found = cachedJSONObjectsMap.get(key);
        if (found !== undefined) {
            return found;
        }

        if (obj instanceof Date) {
            return obj;
        }

        let newObj: any;

        if (Array.isArray(obj)) {
            newObj = obj.map(cachedJSONObjects.object);
            cachedJSONObjectsMap.set(key, newObj);
            return newObj;
        }

        newObj = {};
        for (const key of Object.keys(obj)) {
            newObj[key] = cachedJSONObjects.object(obj[key]);
        }
        return newObj;
    },

    /** return array.map(cachedJSONObjects.object) */
    array<T>(array: T[]): T[] {
        return array.map(cachedJSONObjects.object);
    },
};

export const printDataSnapshot = (data: any, pretty = false) => {
    if (typeof data === 'string') {
        console.log('\nsnapshot:\n' + JSON.stringify(data) + '\n');
    }
    console.log(
        '\nsnapshot:\n' +
            util.inspect(data, {
                colors: false,
                depth: 0xfffff,
                breakLength: pretty ? 120 : 0xfffff,
                maxArrayLength: 0xfffff,
                compact: true,
                getters: false,
                maxStringLength: 0xfffff,
                showHidden: false,
                showProxy: false,
                sorted: false,
                customInspect: false,
                numericSeparator: false,
            }) +
            '\n'
    );
};

export function unindentText(text: string | string[]) {
    let lines = Array.isArray(text) ? text : text.split('\n');
    lines = lines.filter((line) => line.trim().length > 0).map((line) => line.trimEnd());
    const minIndent = Math.min(...lines.map((line) => line.match(/^\s*/)?.[0].length ?? 0));
    if (minIndent > 0) lines = lines.map((line) => line.slice(minIndent));
    return lines.join('\n');
}
