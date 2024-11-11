import { moduleCombinations } from './moduleDefinitions';

const fs = require('fs');
const { exec } = require('child_process');
const path = require('path');

const results: { modules: string[]; expectedSize: number; selfSize: number; fileSize: number; gzipSize: number }[] = [];
const updateModulesScript = path.join(__dirname, 'moduleUpdater.ts');
let baseSize = 0;

function runCombination(index) {
    if (index >= moduleCombinations.length) {
        // Save results to a JSON file
        fs.writeFileSync('module-size-results.json', JSON.stringify(results, null, 2));
        console.log(`Results (${results.length}) saved to module-size-results.json`);

        // Run the command with no modules to clear the app.tsx file
        const clearCommand = `ts-node ${updateModulesScript} ${[].join(' ')}`;
        exec(clearCommand, (err, stdout, stderr) => {
            if (err) {
                console.error(`Error clearing App.tsx}:`, err);
                return;
            }
            console.log(stdout);
            console.error(stderr);
        });

        return;
    }

    const { modules, expectedSize } = moduleCombinations[index];
    const command = `ts-node ${updateModulesScript} ${modules.join(' ')}`;

    exec(command, (err, stdout, stderr) => {
        if (err) {
            console.error(`Error running combination ${modules.join(', ')}:`, err);
            return;
        }

        console.log(stdout);
        console.error(stderr);

        // Extract file size and gzip size from the output
        const fileSizeMatch = stdout.match(/File size: (\d+\.\d+) kB/);
        const gzipSizeMatch = stdout.match(/gzip size: (\d+\.\d+) kB/);

        if (fileSizeMatch && gzipSizeMatch) {
            const fileSize = parseFloat(fileSizeMatch[1]);
            const gzipSize = parseFloat(gzipSizeMatch[1]);

            let selfSize = 0;
            if (modules.length === 0) {
                baseSize = fileSize;
                selfSize = fileSize;
            } else {
                selfSize = parseFloat((fileSize - baseSize).toFixed(2));
            }

            results.push({
                modules,
                selfSize,
                fileSize,
                gzipSize,
                expectedSize,
            });
        }

        // Run the next combination
        runCombination(index + 1);
    });
}

// Start running combinations
runCombination(0);
