import { describe, expect, it } from '@jest/globals';

import { gridChartVersion, validGridChartsVersion, validGridChartsVersionErrorMessage } from './validGridChartsVersion';

describe.each([
    // First valid version
    { gridVersion: '28.0.0', chartsVersion: '6.0.0', isValid: true },
    // Valid versions
    { gridVersion: '29.2.0', chartsVersion: '7.2.0', isValid: true },
    { gridVersion: '29.2.1', chartsVersion: '7.2.1', isValid: true },
    { gridVersion: '30.4.1', chartsVersion: '8.4.1', isValid: true },
    { gridVersion: '122.8.8', chartsVersion: '100.8.8', isValid: true },
    // Patch versions are valid
    { gridVersion: '29.8.1', chartsVersion: '7.8.100', isValid: true },

    // Legacy versions are invalid
    {
        gridVersion: '27.0.0',
        chartsVersion: '6.0.0',
        isValid: false,
        message: validGridChartsVersionErrorMessage({
            type: 'incompatible',
            gridVersion: '27.0.0',
            chartsVersion: '6.0.0',
        }),
    },
    {
        gridVersion: '29.0.0',
        chartsVersion: '5.0.0',
        isValid: false,
        message: validGridChartsVersionErrorMessage({
            type: 'incompatible',
            gridVersion: '29.0.0',
            chartsVersion: '5.0.0',
        }),
    },
    {
        gridVersion: '27.0.0',
        chartsVersion: '5.0.0',
        isValid: false,
        message: validGridChartsVersionErrorMessage({
            type: 'incompatible',
            gridVersion: '27.0.0',
            chartsVersion: '5.0.0',
        }),
    },
    // Invalid versions
    {
        gridVersion: '29.0.0',
        chartsVersion: '7.1.0',
        isValid: false,
        message: validGridChartsVersionErrorMessage({
            type: 'incompatible',
            gridVersion: '29.0.0',
            chartsVersion: '7.1.0',
        }),
    },
    {
        gridVersion: '40.0.0',
        chartsVersion: '7.0.0',
        isValid: false,
        message: validGridChartsVersionErrorMessage({
            type: 'incompatible',
            gridVersion: '40.0.0',
            chartsVersion: '7.0.0',
        }),
    },
    // Undefined values
    {
        gridVersion: undefined,
        chartsVersion: '7.0.0',
        isValid: false,
        message: validGridChartsVersionErrorMessage({
            type: 'invalidGrid',
            gridVersion: undefined,
            chartsVersion: '7.0.0',
        }),
    },
    {
        gridVersion: null,
        chartsVersion: '7.0.0',
        isValid: false,
        message: validGridChartsVersionErrorMessage({
            type: 'invalidGrid',
            gridVersion: null as any,
            chartsVersion: '7.0.0',
        }),
    },
    {
        gridVersion: '29.0.0',
        chartsVersion: undefined,
        isValid: false,
        message: validGridChartsVersionErrorMessage({
            type: 'invalidCharts',
            gridVersion: '29.0.0',
            chartsVersion: undefined,
        }),
    },
    {
        gridVersion: '29.0.0',
        chartsVersion: null,
        isValid: false,
        message: validGridChartsVersionErrorMessage({
            type: 'invalidCharts',
            gridVersion: '29.0.0',
            chartsVersion: null as any,
        }),
    },
    // Weird version numbers
    {
        gridVersion: 'something.weird',
        chartsVersion: '7.0.0',
        isValid: false,
        message: validGridChartsVersionErrorMessage({
            type: 'invalid',
        }),
    },
    {
        gridVersion: '29.0.0',
        chartsVersion: 'something.weird',
        isValid: false,
        message: validGridChartsVersionErrorMessage({
            type: 'invalidCharts', // NOTE: Can still have a grid error message since there is a grid version
            gridVersion: '29.0.0',
            chartsVersion: 'something.weird',
        }),
    },
    { gridVersion: '31.3.0', chartsVersion: '9.3.0-beta.20240423', isValid: true },
    { gridVersion: '31.2.0', chartsVersion: '9.3.0-beta.20240423', isValid: true },
])('validGridChartsVersion', ({ gridVersion, chartsVersion, isValid, message }) => {
    it(`gridVersion: ${gridVersion}, chartsVersion: ${chartsVersion} ${isValid ? 'is valid' : `is not valid${message ? ` - ${message}` : ''}`}`, () => {
        expect(validGridChartsVersion({ gridVersion: gridVersion!, chartsVersion: chartsVersion! })).toEqual({
            isValid,
            ...(message ? { message } : {}),
        });
    });
});

describe.each([
    { gridVersion: '28.3.2', output: { gridMajorMinor: '28.3.x', chartsMajorMinor: '6.3.x' } },
    { gridVersion: '30.8.2', output: { gridMajorMinor: '30.8.x', chartsMajorMinor: '8.8.x' } },

    // Invalid grid versions
    { gridVersion: '1.0.0', output: undefined },
    { gridVersion: undefined, output: undefined },
    { gridVersion: null, output: undefined },
    { gridVersion: 'weird.string.8', output: undefined },
    { gridVersion: 'weird.8.string', output: undefined },
    { gridVersion: '8.weird.string', output: undefined },
])('gridChartVersion', ({ gridVersion, output }) => {
    it(`gridVersion: ${gridVersion} returns ${JSON.stringify(output)}`, () => {
        expect(gridChartVersion(gridVersion!)).toEqual(output);
    });
});
