import { readFileSync } from 'fs';

import type { InternalFramework } from '../types';

interface Params {
    isLocale: boolean;
    internalFramework: InternalFramework;
}

function getPackageJsonVersion(packageName: string, isModule: boolean = false) {
    const path = isModule
        ? `${process.cwd()}/community-modules/${packageName}/package.json`
        : `${process.cwd()}/packages/${packageName}/package.json`;
    const packageJsonStr = readFileSync(path, 'utf-8');
    const packageJson = JSON.parse(packageJsonStr);
    return '^' + packageJson.version;
}

export function getPackageJson({ isLocale, internalFramework }: Params) {
    return addPackageJson(isLocale, internalFramework);
}

/** Used for type checking in plunker, and type checking & dep installation with codesandbox */
function addPackageJson(isLocale, framework) {
    const supportedFrameworks = new Set(['angular', 'typescript', 'reactFunctional', 'reactFunctionalTs', 'vanilla']);
    if (!supportedFrameworks.has(framework)) {
        return;
    }

    const packageJson = {
        name: `ag-grid-example`,
        dependencies: {},
    };

    const addDependency = (name, version) => {
        packageJson.dependencies[name] = version;
    };

    if (framework === 'angular') {
        addDependency('@angular/core', '^17');
        addDependency('@angular/common', '^17');
        addDependency('@angular/forms', '^17');
        addDependency('@angular/platform-browser', '^17');
    }

    function isFrameworkReact() {
        return new Set(['reactFunctional', 'reactFunctionalTs']).has(framework);
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
    const agGridLocaleVersion = getPackageJsonVersion('locale', true);

    if (isLocale) {
        addDependency('@ag-grid-community/locale', agGridLocaleVersion);
    }

    if (framework === 'angular') {
        addDependency('ag-grid-angular', agGridAngularVersion);
    }
    if (isFrameworkReact()) {
        addDependency('ag-grid-react', agGridReactVersion);
    }
    addDependency('ag-grid-community', agGridVersion);
    addDependency('ag-grid-enterprise', agGridEnterpriseVersion);

    return packageJson;
}
