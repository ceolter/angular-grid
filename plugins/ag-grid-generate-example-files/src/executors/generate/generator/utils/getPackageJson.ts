import { readFileSync } from 'fs';

import type { InternalFramework } from '../types';

interface Params {
    isLocale: boolean;
    internalFramework: InternalFramework;
    isIntegratedCharts: boolean;
}

export const agChartsVersion = 'latest'; // TODO have this set properly

function getPackageJsonVersion(packageName: string, isModule: boolean = false) {
    const path = isModule
        ? `${process.cwd()}/community-modules/${packageName}/package.json`
        : `${process.cwd()}/packages/${packageName}/package.json`;
    const packageJsonStr = readFileSync(path, 'utf-8');
    const packageJson = JSON.parse(packageJsonStr);
    return packageJson.version;
}

export function getPackageJson({ isLocale, internalFramework, isIntegratedCharts }: Params) {
    const supportedFrameworks = new Set([
        'angular',
        'typescript',
        'reactFunctional',
        'reactFunctionalTs',
        'vanilla',
        'vue3',
    ]);
    if (!supportedFrameworks.has(internalFramework)) {
        return;
    }

    const packageJson = {
        name: `ag-grid-example`,
        dependencies: {},
    };

    const addDependency = (name, version) => {
        packageJson.dependencies[name] = version;
    };

    if (internalFramework === 'angular') {
        addDependency('@angular/core', '^17');
        addDependency('@angular/common', '^17');
        addDependency('@angular/forms', '^17');
        addDependency('@angular/platform-browser', '^17');
    }

    if (internalFramework === 'vue3') {
        addDependency('vue', '^3.5.0');
    }

    function isFrameworkReact() {
        return new Set(['reactFunctional', 'reactFunctionalTs']).has(internalFramework);
    }

    if (isFrameworkReact()) {
        addDependency('react', '18');
        addDependency('react-dom', '18');

        addDependency('@types/react', '18');
        addDependency('@types/react-dom', '18');
    }

    const agGridVersion = getPackageJsonVersion('ag-grid-community');
    const agGridEnterpriseVersion = getPackageJsonVersion('ag-grid-enterprise');
    const agGridReactVersion = getPackageJsonVersion('ag-grid-react');
    const agGridAngularVersion = getPackageJsonVersion('ag-grid-angular');
    const agGridVue3Version = getPackageJsonVersion('ag-grid-vue3');
    const agGridLocaleVersion = getPackageJsonVersion('locale', true);

    if (isLocale) {
        addDependency('@ag-grid-community/locale', agGridLocaleVersion);
    }

    if (internalFramework === 'angular') {
        addDependency('ag-grid-angular', agGridAngularVersion);
    }
    if (internalFramework === 'vue3') {
        addDependency('ag-grid-vue3', agGridVue3Version);
    }
    if (isFrameworkReact()) {
        addDependency('ag-grid-react', agGridReactVersion);
    }
    addDependency('ag-grid-community', agGridVersion);
    addDependency('ag-grid-enterprise', agGridEnterpriseVersion);
    if (isIntegratedCharts) {
        addDependency('ag-charts-community', `${agChartsVersion}`);
        addDependency('ag-charts-enterprise', `${agChartsVersion}`);
    }

    return packageJson;
}
