const fs = require('fs');
const { exec } = require('child_process');
const path = require('path');
const resultsFilePath = path.resolve(__dirname, 'module-size-results.json');

function validateSizes() {
    console.log('Running module size tests...');

    // Read and parse the module-size-results.json file
    const results = JSON.parse(fs.readFileSync(resultsFilePath, 'utf8'));

    if (results.length === 0) {
        console.error('No results found in module-size-results.json');
        process.exit(1);
    }

    // validate that all results their selfSize is less than the expectedSize + 2%

    // Some modules are very small and the expected size is very close to the actual size
    const bufferSize = (expected) => Math.max(expected * 0.03, 1);

    const failuresTooBig = results.filter(
        (result) => result.selfSize > result.expectedSize + bufferSize(result.expectedSize)
    );

    // We should reduce the expected size if the module is smaller than expected
    const failuresTooSmall = results.filter(
        (result) => result.selfSize < result.expectedSize - bufferSize(result.expectedSize)
    );

    if (failuresTooBig.length > 0) {
        console.error(
            'Validation failed for the following modules which are too large compared to their expected size:'
        );
        failuresTooBig.forEach((failure) => {
            console.error(
                `Module: [${failure.modules.join()}], selfSize: ${failure.selfSize}, expectedSize: ${failure.expectedSize} + (${bufferSize(failure.expectedSize)})`
            );
        });
        process.exit(1); // Return a non-zero exit code
    } else if (failuresTooSmall.length > 0) {
        console.error(
            'Validation failed for the following modules which are too much smaller than their expected size:'
        );
        console.error('Is the expected size too high in moduleDefinitions? Or has the module dependencies changed?');
        failuresTooSmall.forEach((failure) => {
            console.error(
                `Module: [${failure.modules.join()}], selfSize: ${failure.selfSize}, expectedSize: ${failure.expectedSize} + (${bufferSize(failure.expectedSize)})`
            );
        });
        process.exit(1); // Return a non-zero exit code
    } else {
        console.log(`All modules (${results.length}) passed size validation.`);
    }
}

validateSizes();
