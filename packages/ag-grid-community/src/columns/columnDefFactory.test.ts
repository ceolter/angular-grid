import { _deepCloneDefinition } from './columnDefFactory';

describe('ColumnDefFactory', () => {
    test('_deepCloneDefinition does not allow prototype pollution', () => {
        const BAD_JSON = JSON.parse('{"__proto__":{"polluted":true}}');
        let victim = {};
        try {
            victim = _deepCloneDefinition(BAD_JSON);
        } catch (e) {
            // eslint-disable-next-line no-console
            console.error(e);
        }
        // @ts-expect-error polluted could be there
        expect(victim.polluted).toBeUndefined();
    });
});
