const fs = require('fs');
const { exec } = require('child_process');
const path = require('path');
const resultsFilePath = path.resolve(__dirname, 'results.json');

function validateSizes() {
    console.log('Running module size tests...');

    // Read and parse the results.json file
    const results = JSON.parse(fs.readFileSync(resultsFilePath, 'utf8'));

    // validate that all results their selfSize is less than the expectedSize + 2%
    const failures = results.filter((result) => result.selfSize > result.expectedSize * 1.02);

    if (failures.length > 0) {
        console.error('Validation failed for the following modules which are over 2% expected size:');
        failures.forEach((failure) => {
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
