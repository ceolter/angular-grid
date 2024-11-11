const fs = require('fs');
const { exec } = require('child_process');
const path = require('path');
const resultsFilePath = path.resolve(__dirname, 'module-size-results.json');

function validateSizes() {
    console.log('Running module size tests...');

    // Read and parse the module-size-results.json file
    const results = JSON.parse(fs.readFileSync(resultsFilePath, 'utf8'));

    // validate that all results their selfSize is less than the expectedSize + 2%
    const failuresTooBig = results.filter((result) => result.selfSize > result.expectedSize * 1.02);

    // We should reduce the expected size if the module is smaller than expected
    const failuresTooSmall = results.filter((result) => result.selfSize < result.expectedSize * 0.9);

    if (failuresTooBig.length > 0) {
        console.error('Validation failed for the following modules which are over 2% expected size:');
        failuresTooBig.forEach((failure) => {
            console.error(
                `Module: [${failure.modules.join()}], selfSize: ${failure.selfSize}, expectedSize: ${failure.expectedSize}`
            );
        });
        process.exit(1); // Return a non-zero exit code
    } else if (failuresTooSmall.length > 0) {
        console.error('Validation failed for the following modules which are under 90% expected size:');
        console.error('Is the expected size too high in moduleDefinitions? Or has the module dependencies changed?');
        failuresTooSmall.forEach((failure) => {
            console.error(
                `Module: [${failure.modules.join()}], selfSize: ${failure.selfSize}, expectedSize: ${failure.expectedSize}`
            );
        });
        process.exit(1); // Return a non-zero exit code
    } else {
        console.log('All modules passed size validation.');
    }
}

validateSizes();
