const fs = require('fs');
const { execSync } = require('child_process');

const LICENSE_MANAGER_FILE = 'packages/ag-grid-enterprise/src/license/shared/licenseManager.ts';

if (process.argv.length !== 3) {
    console.log('Usage: node scripts/deployments/prep_and_archive/updateLicenseManager.js NEW_LICENSE');
    console.log('Note: This script should be run from the root of the monorepo');
    process.exit(1);
}

const [exec, scriptPath, genKeyPath] = process.argv;

if (!fs.existsSync(genKeyPath)) {
    console.error(`ERROR: genKeyPath: [${genKeyPath}] does not exist`);
    process.exit(1);
}
if (fs.lstatSync(genKeyPath).isDirectory()) {
    console.error(`ERROR: genKeyPath: [${genKeyPath}] exists but is not a file`);
    process.exit(1);
}

const newLicenseKey = execSync(`node ${genKeyPath} release`).toString().trim();
if (!newLicenseKey || newLicenseKey.length !== 20) {
    console.error(`ERROR: license key generated invalid - incorrect key length: ${newLicenseKey}`);
    process.exit(1);
}

const licenseManagerSrc = fs.readFileSync(LICENSE_MANAGER_FILE, 'utf8');
const releaseInfoIndex = licenseManagerSrc.indexOf('private static RELEASE_INFORMATION');
const startOfValue = licenseManagerSrc.indexOf("'", releaseInfoIndex) + 1;
const endOfValue = licenseManagerSrc.indexOf("'", startOfValue);
const existingLicenseKey = licenseManagerSrc.substring(startOfValue, endOfValue);

const newLicenseManagerSrc = licenseManagerSrc.replace(existingLicenseKey, newLicenseKey);

fs.writeFileSync(LICENSE_MANAGER_FILE, newLicenseManagerSrc, 'utf8');
