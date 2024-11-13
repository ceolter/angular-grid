const fetch = require('node-fetch');

const sonarCloudToken = process.argv[2];
if (!sonarCloudToken) {
    console.error('SonarCloud Auth Token not supplied');
    process.exit(1);
}

const getQualityGateStatuses = (projectIds) => {
    return Promise.all(
        projectIds.map(async (projectId) => {
            const response = await fetch(
                `https://sonarcloud.io/api/qualitygates/project_status?projectKey=${projectId}`,
                {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${sonarCloudToken}`,
                        Accept: 'application/json',
                    },
                }
            );

            const result = await response.json();
            return {
                projectId: projectId,
                status: result.projectStatus.status,
            };
        })
    );
};

(async function () {
    const projectStatuses = await getQualityGateStatuses([
        'ag-grid-community',
        'ag-grid-enterprise',
        'ag-charts-community',
    ]);

    if (!projectStatuses.every((projectStatus) => projectStatus.status === 'OK')) {
        console.error('One or more projects are in an error state on SonarCloud');
        console.error(projectStatuses);
        process.exit(1);
    } else {
        console.log('All SonarCloud projects passing quality gates.');
    }
})();
