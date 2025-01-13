const { execSync } = require('child_process');

const information = JSON.parse(
    execSync(`npm view ag-charts-community --registry http://52.50.158.57:4873 --json`, {
        stdio: 'pipe',
        encoding: 'utf-8',
    })
);

const sortable = [];
for (const timestampedVersion in information.time) {
    if (['created', 'modified'].some((exclude) => timestampedVersion === exclude)) continue;

    sortable.push([timestampedVersion, information.time[timestampedVersion]]);
}

const sortAlphaNumeric = (a, b) => a[1].localeCompare(b[1], 'en', { numeric: true });

sortable.sort(sortAlphaNumeric);

console.log(sortable[sortable.length - 1][0]);
