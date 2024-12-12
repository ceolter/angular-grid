// Note: Assumes working directory is the root of the mono-repo

const fs = require('fs');

const readFile = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));

const isAgDependency = (dependency) => dependency.startsWith('ag-') || dependency.startsWith('@ag-');
const gridDependency = (dependency) => dependency.startsWith('ag-grid') || dependency.startsWith('@ag-grid');
const chartDependency = (dependency) => dependency.startsWith('ag-charts');

const getAgDependencies = (packageJson) =>
    packageJson.dependencies ? Object.keys(packageJson.dependencies).filter(isAgDependency) : [];
const getAgDevDependencies = (packageJson) =>
    packageJson.devDependencies ? Object.keys(packageJson.devDependencies).filter(isAgDependency) : [];
const getAgPeerDependencies = (packageJson) =>
    packageJson.peerDependencies ? Object.keys(packageJson.peerDependencies).filter(isAgDependency) : [];
const getAgOptionalDependencies = (packageJson) =>
    packageJson.optionalDependencies ? Object.keys(packageJson.optionalDependencies).filter(isAgDependency) : [];

const extractDependencies = (projectPackageJson, dependencies, devDependencies, depFilter) =>
    dependencies
        .filter(depFilter)
        .map((dependency) => ({
            [dependency]: projectPackageJson.dependencies[dependency],
        }))
        .concat(
            devDependencies.filter(depFilter).map((dependency) => ({
                [dependency]: projectPackageJson.devDependencies[dependency],
            }))
        )
        .reduce((accumulator, current) => {
            const dependency = Object.keys(current)[0];
            accumulator[dependency] = current[dependency];
            return accumulator;
        }, {});

const extractPeerDependencies = (projectPackageJson, dependencies, depFilter) =>
    dependencies
        .filter(depFilter)
        .map((dependency) => ({
            [dependency]: projectPackageJson.peerDependencies[dependency],
        }))
        .reduce((accumulator, current) => {
            const dependency = Object.keys(current)[0];
            accumulator[dependency] = current[dependency];
            return accumulator;
        }, {});

const extractOptionalDependencies = (projectPackageJson, dependencies, depFilter) =>
    dependencies
        .filter(depFilter)
        .map((dependency) => ({
            [dependency]: projectPackageJson.optionalDependencies[dependency],
        }))
        .reduce((accumulator, current) => {
            const dependency = Object.keys(current)[0];
            accumulator[dependency] = current[dependency];
            return accumulator;
        }, {});

// only angular projects have "sub" projects
const extractSubAngularProjectDependencies = (packageDirectory) => {
    const CWD = process.cwd();

    let agSubAngularVersion = null;
    let agSubAngularGridDeps = null;
    let agSubAngularChartDeps = null;
    if (packageDirectory.includes('angular') && !packageDirectory.includes('module-size-angular')) {
        const angularJson = require(`${CWD}/${packageDirectory}/angular.json`);
        const currentSubProjectPackageJsonFile = require(
            `${CWD}/${packageDirectory}/${Object.values(angularJson.projects)[0].root}/package.json`
        );

        agSubAngularVersion = currentSubProjectPackageJsonFile.version;

        agSubAngularGridDeps = getAgPeerDependencies(currentSubProjectPackageJsonFile)
            .filter(gridDependency)
            .map((dependency) => ({
                [dependency]: currentSubProjectPackageJsonFile.peerDependencies[dependency],
            }))
            .reduce((accumulator, current) => {
                const dependency = Object.keys(current)[0];
                accumulator[dependency] = current[dependency];
                return accumulator;
            }, {});

        agSubAngularChartDeps = getAgPeerDependencies(currentSubProjectPackageJsonFile)
            .filter(chartDependency)
            .map((dependency) => ({
                [dependency]: currentSubProjectPackageJsonFile.peerDependencies[dependency],
            }))
            .reduce((accumulator, current) => {
                const dependency = Object.keys(current)[0];
                accumulator[dependency] = current[dependency];
                return accumulator;
            }, {});
    }

    return { agSubAngularVersion, agSubAngularGridDeps, agSubAngularChartDeps };
};

const ROOT_PACKAGE_JSON = '../../../package.json';
const packageDirectories = require(ROOT_PACKAGE_JSON).workspaces.packages;

const getPackageInformation = () => {
    const packageInformation = {};

    packageDirectories.forEach((packageDirectory) => {
        const projectPackageJson = readFile(`${packageDirectory}/package.json`);

        const dependencies = getAgDependencies(projectPackageJson);
        const peerDependencies = getAgPeerDependencies(projectPackageJson);
        const optionalDependencies = getAgOptionalDependencies(projectPackageJson);
        const devDependencies = getAgDevDependencies(projectPackageJson);

        const agGridDeps = extractDependencies(projectPackageJson, dependencies, devDependencies, gridDependency);
        const agGridPeerDeps = projectPackageJson.peerDependencies
            ? extractPeerDependencies(projectPackageJson, peerDependencies, gridDependency)
            : {};
        const agGridOptionalDeps = projectPackageJson.optionalDependencies
            ? extractOptionalDependencies(projectPackageJson, optionalDependencies, gridDependency)
            : {};
        const agChartDeps = extractDependencies(projectPackageJson, dependencies, devDependencies, chartDependency);
        const agChartOptionalDeps = projectPackageJson.optionalDependencies
            ? extractOptionalDependencies(projectPackageJson, optionalDependencies, chartDependency)
            : {};
        const { agSubAngularVersion, agSubAngularGridDeps, agSubAngularChartDeps } =
            extractSubAngularProjectDependencies(packageDirectory);

        packageInformation[projectPackageJson.name] = {
            projectRoot: packageDirectory,
            version: projectPackageJson.version,
            publicPackage: !projectPackageJson.private,
            isGridPackage: gridDependency(projectPackageJson.name),
            agGridDeps,
            agGridPeerDeps,
            agGridOptionalDeps,
            agChartDeps,
            agChartOptionalDeps,
            agSubAngularVersion,
            agSubAngularGridDeps,
            agSubAngularChartDeps,
        };
    });

    return packageInformation;
};

exports.readFile = readFile;
exports.isAgDependency = isAgDependency;
exports.gridDependency = gridDependency;
exports.chartDependency = chartDependency;
exports.getPackageInformation = getPackageInformation;
