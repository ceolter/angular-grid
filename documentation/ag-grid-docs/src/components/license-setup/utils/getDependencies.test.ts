import { getDependencies } from './getDependencies';

describe('grid getDependencies', () => {
    test.each`
        framework       | expected
        ${'react'}      | ${['ag-grid-react', 'ag-grid-enterprise']}
        ${'angular'}    | ${['ag-grid-angular', 'ag-grid-enterprise']}
        ${'vue'}        | ${['ag-grid-vue3', 'ag-grid-enterprise']}
        ${'javascript'} | ${['ag-grid-enterprise']}
    `('$framework { isIntegratedCharts: $isIntegratedCharts } is $expected', ({ framework, expected }) => {
        expect(
            getDependencies({
                library: 'grid',
                framework,
            }).sort()
        ).toEqual(expected.sort());
    });
});

describe('charts getDependencies', () => {
    test.each`
        framework       | expected
        ${'react'}      | ${['ag-charts-react', 'ag-charts-enterprise']}
        ${'angular'}    | ${['ag-charts-angular', 'ag-charts-enterprise']}
        ${'vue'}        | ${['ag-charts-vue3', 'ag-charts-enterprise']}
        ${'javascript'} | ${['ag-charts-enterprise']}
    `('$framework { isIntegratedCharts: $isIntegratedCharts } is $expected', ({ framework, expected }) => {
        expect(
            getDependencies({
                library: 'charts',
                framework,
            }).sort()
        ).toEqual(expected.sort());
    });
});
