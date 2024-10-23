const shouldBuildFrameworks = process.env.BUILD_FWS === '1';

const BASE_IGNORED_PROJECTS = ['all', 'ag-grid-docs'];
const FRAMEWORK_PROJECTS = ['ag-grid-angular', 'ag-grid-react', 'ag-grid-vue3'];
const PACKAGE_PROJECTS = ['ag-grid-community', 'ag-grid-enterprise', 'ag-grid-charts-enterprise'];

function getIgnoredProjects() {
    const ignoredProjects = [...BASE_IGNORED_PROJECTS];

    if (!shouldBuildFrameworks) {
        ignoredProjects.push(...FRAMEWORK_PROJECTS);
    }

    return ignoredProjects;
}

function getProjectBuildTargets(project) {
    const buildTargets = [];

    if (project.startsWith('ag-grid-docs-')) {
        buildTargets.push([project, ['generate'], 'watch']);
    } else {
        if (PACKAGE_PROJECTS.includes(project)) {
            buildTargets.push(['ag-grid-docs', ['generate-doc-references']]);

            if (project === 'ag-grid-community') {
                buildTargets.push(['ag-grid-community', ['build:css']]);
            }
            if (project === 'ag-grid-enterprise') {
                buildTargets.push(['ag-grid-enterprise', ['build:css']]);
            }

            buildTargets.push(
                ['ag-grid-community', ['build'], 'watch'],
                ['ag-grid-enterprise', ['build'], 'watch'],
                ['ag-grid-charts-enterprise', ['build'], 'watch']
            );
        } else if (project.startsWith('@ag-grid')) {
            // For locale and styles
            buildTargets.push(
                [project, ['build'], 'watch'],
                ['ag-grid-community', ['build'], 'watch'],
                ['ag-grid-enterprise', ['build'], 'watch'],
                ['ag-grid-charts-enterprise', ['build'], 'watch']
            );
        }

        if (FRAMEWORK_PROJECTS.includes(project)) {
            buildTargets.push([project, ['build'], 'watch']);
        }
    }

    return buildTargets;
}

module.exports = {
    ignoredProjects: getIgnoredProjects(),
    getProjectBuildTargets,
};
