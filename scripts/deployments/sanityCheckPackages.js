// Note: Assumes working directory is the root of the mono-repo

const getPackageInformation = require('./utils/utils').getPackageInformation;

if (process.argv.length < 4) {
    console.log('Usage: node scripts/sanityCheckPackages.js [Grid Version] [Chart Version]');
    console.log('For example: node scripts/deployments/sanityCheckPackages.js 23.0.0 23.0.0 1.0.0 1.0.0');
    console.log('Note: This script should be run from the root of the monorepo');
    process.exit(1);
}
const [exec, scriptPath, gridNewVersion, chartNewVersion] = process.argv;

if (!gridNewVersion || !chartNewVersion) {
    console.error('ERROR: Invalid grid or charts version supplied');
    process.exit(1);
}

console.log(
    '******************************************************************************************************************************'
);
console.log(
    `Verify Grid Version ${gridNewVersion} and Charts Version ${chartNewVersion} are the dependencies used in package.json         `
);
console.log(
    '******************************************************************************************************************************'
);

let errorFound = false;

const allPackages = getPackageInformation();
const packageNames = Object.keys(allPackages);
packageNames
    .filter((packageName) => packageName != 'update-algolia-indices' && packageName !== 'ag-behavioural-testing')
    .forEach((packageName) => {
        const agPackage = allPackages[packageName];
        const {
            projectRoot,
            isGridPackage,
            version,
            agGridDeps,
            agChartDeps,
            agChartOptionalDeps,
            agSubAngularVersion,
            agSubAngularGridDeps,
            agSubAngularChartDeps,
        } = agPackage;

        function checkDependency(dependencyName, currentVersion, expectedVersion) {
            if (currentVersion !== expectedVersion) {
                console.error(
                    `${dependencyName} in ${projectRoot}/package.json has ${currentVersion} but we expect it to be ${expectedVersion}`
                );

                errorFound = true;
            }
        }

        checkDependency(packageName, version, isGridPackage ? gridNewVersion : chartNewVersion);
        Object.keys(agPackage.agGridDeps).forEach((dependencyName) =>
            checkDependency(dependencyName, agGridDeps[dependencyName], gridNewVersion)
        );
        Object.keys(agPackage.agGridPeerDeps).forEach((dependencyName) =>
            checkDependency(dependencyName, agPackage.agGridPeerDeps[dependencyName], gridNewVersion)
        );
        Object.keys(agPackage.agGridOptionalDeps).forEach((dependencyName) =>
            checkDependency(dependencyName, agPackage.agGridOptionalDeps[dependencyName], gridNewVersion)
        );
        Object.keys(agPackage.agChartDeps).forEach((dependencyName) =>
            checkDependency(dependencyName, agChartDeps[dependencyName], chartNewVersion)
        );
        Object.keys(agPackage.agChartOptionalDeps).forEach((dependencyName) =>
            checkDependency(dependencyName, agChartOptionalDeps[dependencyName], chartNewVersion)
        );

        if (agSubAngularVersion) {
            checkDependency(packageName, agSubAngularVersion, isGridPackage ? gridNewVersion : chartNewVersion);
        }

        if (agSubAngularGridDeps) {
            Object.keys(agSubAngularGridDeps).forEach((dependencyName) =>
                checkDependency(dependencyName, agSubAngularGridDeps[dependencyName], gridNewVersion)
            );
        }
        if (agSubAngularChartDeps) {
            Object.keys(agSubAngularChartDeps).forEach((dependencyName) =>
                checkDependency(dependencyName, agSubAngularChartDeps[dependencyName], chartNewVersion)
            );
        }
    });

if (errorFound) {
    console.error('ERROR: One more errors found - please see messages above');
    process.exit(1);
}
