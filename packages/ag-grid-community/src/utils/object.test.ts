import { _isDeepEqual, _mergeDeep } from './object';

describe('object', () => {
    test('_mergeDeep does not allow prototype pollution', () => {
        const BAD_JSON = JSON.parse('{"__proto__":{"polluted":true}}');
        const victim = {};
        try {
            _mergeDeep(victim, BAD_JSON);
        } catch (e) {
            // eslint-disable-next-line no-console
            console.error(e);
        }
        // @ts-expect-error polluted could be there
        expect(victim.polluted).toBeUndefined();
    });

    describe('_isDeepEqual', () => {
        test('two arrays', () => {
            expect(_isDeepEqual([], [])).toBe(true);
            expect(_isDeepEqual([1, 2, 3], [1, 2, 3])).toBe(true);
            expect(_isDeepEqual([], [1, 2, 3])).toBe(false);
            expect(_isDeepEqual([1, 2, 3], [1, 3, 2])).toBe(false);
        });
        test('two arrays of different objects', () => {
            expect(_isDeepEqual([{ a: 1 }], [])).toBe(false);
            expect(_isDeepEqual([], [{ a: 1 }])).toBe(false);
            expect(_isDeepEqual([{ a: 1 }], [{ b: 2 }, { c: 3 }])).toBe(false);
            expect(_isDeepEqual([{ a: 1 }], [{ b: 2 }])).toBe(false);
        });
        test('two arrays of similar objects', () => {
            expect(_isDeepEqual([{ a: 1 }], [{ a: 2 }])).toBe(false);
            expect(_isDeepEqual([{ a: { b: 2 } }], [{ a: { b: 3 } }])).toBe(false);
        });
        test('two arrays of identical objects', () => {
            expect(_isDeepEqual([{ a: 1 }], [{ a: 1 }])).toBe(true);
            expect(_isDeepEqual([{ a: { b: 1 } }], [{ a: { b: 1 } }])).toBe(true);
            expect(_isDeepEqual({ a: [{ b: 1 }] }, { a: [{ b: 1 }] })).toBe(true);
        });
        test('two primitives', () => {
            expect(_isDeepEqual(1, 1)).toBe(true);
            expect(_isDeepEqual(0, 1)).toBe(false);
            expect(_isDeepEqual(null, 0)).toBe(false);
            expect(_isDeepEqual(0, '')).toBe(false);
            expect(_isDeepEqual(null, undefined)).toBe(false);
            expect(_isDeepEqual('foo', 'foo')).toBe(true);
        });
        test('one primitive, one object value', () => {
            expect(_isDeepEqual(0, [])).toBe(false);
            expect(_isDeepEqual(0, {})).toBe(false);
        });
        test('one array, one object', () => {
            expect(_isDeepEqual([0], { 0: 0 })).toBe(true);
            expect(_isDeepEqual([1], { a: 1 })).toBe(false);
        });
        test('two different objects', () => {
            expect(_isDeepEqual({}, { a: 1 })).toBe(false);
            expect(_isDeepEqual({ a: 1 }, { b: 1 })).toBe(false);
            expect(_isDeepEqual({ a: -1 }, { a: 1 })).toBe(false);
        });
        test('two similar objects', () => {
            expect(_isDeepEqual({ a: 1 }, { a: 2 })).toBe(false);
            expect(_isDeepEqual({ a: -1 }, { a: { b: [] } })).toBe(false);
            expect(_isDeepEqual({ a: { b: [] } }, { a: { b: [{ c: 2 }] } })).toBe(false);
        });
        test('two identical objects', () => {
            expect(_isDeepEqual({}, {})).toBe(true);
            expect(_isDeepEqual({ a: 1 }, { a: 1 })).toBe(true);
            expect(_isDeepEqual({ a: { b: 1 } }, { a: { b: 1 } })).toBe(true);
            expect(_isDeepEqual({ a: [{ b: 1 }] }, { a: [{ b: 1 }] })).toBe(true);
        });
    });
});
