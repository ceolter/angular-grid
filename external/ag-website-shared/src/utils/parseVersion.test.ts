import { parseVersion } from './parseVersion';

describe.each([
    { version: '0.0.0', output: { major: 0, minor: 0, patch: '0', patchNum: 0, patchBeta: undefined, isMajor: true } },
    { version: '0.0.1', output: { major: 0, minor: 0, patch: '1', patchNum: 1, patchBeta: undefined, isMajor: false } },
    {
        version: '32.2.0',
        output: { major: 32, minor: 2, patch: '0', patchNum: 0, patchBeta: undefined, isMajor: false },
    },
    {
        version: '32.0.0',
        output: { major: 32, minor: 0, patch: '0', patchNum: 0, patchBeta: undefined, isMajor: true },
    },
    {
        version: '32.2.0-beta.20241122.1041',
        output: {
            major: 32,
            minor: 2,
            patch: '0-beta.20241122.1041',
            patchNum: 0,
            patchBeta: 'beta.20241122.1041',
            isMajor: false,
        },
    },
    {
        version: '32.0.0-beta.20241122.1041',
        output: {
            major: 32,
            minor: 0,
            patch: '0-beta.20241122.1041',
            patchNum: 0,
            patchBeta: 'beta.20241122.1041',
            isMajor: false,
        },
    },
])('parseVersion', ({ version, output }) => {
    it(`version: ${version}, outputs ${JSON.stringify(output)}`, () => {
        expect(parseVersion(version)).toEqual(output);
    });
});
