import { getErrorRedirectBaseUrl } from './getErrorRedirectBaseUrl';

describe.each([
    { errorVersion: '32.2.0', pageVersion: '32.2.0', output: undefined },
    { errorVersion: undefined, pageVersion: '32.2.0', output: undefined },
    { errorVersion: '32.2.0', pageVersion: '33.0.0', output: 'https://www.ag-grid.com/archive/32.2.0' },
])('getErrorRedirectBaseUrl', ({ errorVersion, pageVersion, output }) => {
    it(`errorVersion: ${errorVersion} and pageVersion: ${pageVersion}, outputs ${output}`, () => {
        expect(getErrorRedirectBaseUrl({ errorVersion, pageVersion })).toEqual(output);
    });
});
