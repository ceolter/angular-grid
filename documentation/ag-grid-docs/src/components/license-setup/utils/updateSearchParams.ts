export const updateSearchParams = ({ integratedCharts }: { integratedCharts: boolean }) => {
    const url = new URL(window.location);
    const integratedChartsParamValue = url.searchParams.get('integratedCharts') === 'true';

    if (integratedChartsParamValue !== integratedCharts) {
        if (integratedCharts) {
            url.searchParams.set('integratedCharts', 'true');
        } else {
            url.searchParams.delete('integratedCharts');
        }
    }

    history.pushState(null, '', url);
};
