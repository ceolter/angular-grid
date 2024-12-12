import type { Framework, Library } from '@ag-grid-types';

const getGridDependencies = ({
    framework,
    isIntegratedCharts,
}: {
    framework: Framework;
    isIntegratedCharts: boolean;
}) => {
    const dependencies: string[] = [];

    if (framework === 'react') {
        dependencies.push('ag-grid-react');
    } else if (framework === 'angular') {
        dependencies.push('ag-grid-angular');
    } else if (framework === 'vue') {
        dependencies.push('ag-grid-vue3');
    }

    dependencies.push('ag-grid-enterprise');

    if (isIntegratedCharts) {
        dependencies.push('ag-charts-enterprise');
    }

    return dependencies;
};

const getChartsDependencies = ({ framework }: { framework: Framework }) => {
    const dependencies: string[] = [];

    dependencies.push('ag-charts-enterprise');
    if (framework === 'react') {
        dependencies.push('ag-charts-react');
    } else if (framework === 'angular') {
        dependencies.push('ag-charts-angular');
    } else if (framework === 'vue') {
        dependencies.push('ag-charts-vue3');
    }

    return dependencies;
};

export const getDependencies = ({
    library,
    framework,
    isIntegratedCharts,
}: {
    library: Library;
    framework: Framework;
    isIntegratedCharts?: boolean;
}) => {
    return library === 'grid'
        ? getGridDependencies({
              framework,
              isIntegratedCharts: Boolean(isIntegratedCharts),
          })
        : getChartsDependencies({
              framework,
          });
};
