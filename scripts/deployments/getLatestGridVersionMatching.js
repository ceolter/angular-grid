const { execSync } = require('child_process');

/*

Gets the latest version of ag-grid-community from the internal registry matching the "base" supplied

For example given:
  '32.2.0-beta.20240711',
  '32.2.0-beta.20240711.1518',
  '32.2.0-beta.20240714',

node scripts/deployments/getLatestGridVersionMatching.js 10.0.2

would return 32.2.0-beta.20240714

 */

if (process.argv.length < 3) {
    console.log('Usage: node scripts/deployments/getLatestChartsVersionMatching.js <charts version base>');
    console.log('For example: node scripts/deployments/getLatestGridVersionMatching.js 10.0.0');
    console.log('Note: This script should be run from the root of the monorepo');
    process.exit(1);
}

const [exec, scriptPath, chartsVersion] = process.argv;

const information = JSON.parse(
    execSync(`npm view ag-grid-community --registry http://52.50.158.57:4873 --json`, {
        stdio: 'pipe',
        encoding: 'utf-8',
    })
);

const matchingVersions = information.versions.filter((version) => version.startsWith(`${chartsVersion}`));

const sortAlphaNumeric = (a, b) => a.localeCompare(b, 'en', { numeric: true });

const sortedVersions = matchingVersions.sort(sortAlphaNumeric);

console.log(sortedVersions[sortedVersions.length - 1]);
