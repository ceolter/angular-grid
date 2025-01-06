import { AllEnterpriseModules, AllGridCommunityModules } from './moduleDefinitions';

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { globSync } = require('glob');
const zlib = require('zlib');

const distFilePattern = path.join(__dirname, 'dist/assets/agGridCommunityEnterprise*.js');
const srcFilePath = path.join(__dirname, 'src/App_Src.tsx');
const outFilePath = path.join(__dirname, 'src/App_AUTO.tsx');
const placeholderStartRgx = '/\\*\\* __PLACEHOLDER__START__ \\*/';
const placeholderEndRgx = '/\\*\\* __PLACEHOLDER__END__ \\*/';
const placeholderStart = '/** __PLACEHOLDER__START__ */';
const placeholderEnd = '/** __PLACEHOLDER__END__ */';

const entPlaceholderStartRgx = '/\\*\\* __ENTERPRISE_PLACEHOLDER__START__ \\*/';
const entPlaceholderEndRgx = '/\\*\\* __ENTERPRISE_PLACEHOLDER__END__ \\*/';
const entPlaceholderStart = '/** __ENTERPRISE_PLACEHOLDER__START__ */';
const entPlaceholderEnd = '/** __ENTERPRISE_PLACEHOLDER__END__ */';

const chartsPlaceholderStartRgx = '/\\*\\* __CHARTS_PLACEHOLDER__START__ \\*/';
const chartsPlaceholderEndRgx = '/\\*\\* __CHARTS_PLACEHOLDER__END__ \\*/';
const chartsPlaceholderStart = '/** __CHARTS_PLACEHOLDER__START__ */';
const chartsPlaceholderEnd = '/** __CHARTS_PLACEHOLDER__END__ */';

// Get modules from command line arguments
const modules = process.argv.slice(2);

function reverseWords(str) {
    return str.split(' ').reverse().join(' ');
}

fs.readFile(srcFilePath, 'utf8', (err, data) => {
    if (err) {
        console.error('Error reading file:', err);
        return;
    }
    const communityModules = modules.filter((module) => AllGridCommunityModules[module] >= 0);
    const enterpriseModules = modules.filter((module) => AllEnterpriseModules[module] >= 0);

    const replacement = communityModules.join(', ');
    const regex = new RegExp(`${placeholderStartRgx}[\\s\\S]*?${placeholderEndRgx}`, 'g');
    let result: string = data.replace(regex, `${placeholderStart} ${replacement} ${placeholderEnd}`);

    const entReplacement = enterpriseModules.join(', ');
    const entRegex = new RegExp(`${entPlaceholderStartRgx}[\\s\\S]*?${entPlaceholderEndRgx}`, 'g');
    result = result.replace(entRegex, `${entPlaceholderStart} ${entReplacement} ${entPlaceholderEnd}`);

    if (modules[0] === 'AgChartsCommunityModule' || modules[0] === 'AgChartsEnterpriseModule') {
        const chartsModule = modules[0];
        const chartsReplacement = `import {${chartsModule}} from 'ag-charts-${chartsModule.includes('Enterprise') ? 'enterprise' : 'community'}';`;
        const chartsRegex = new RegExp(`${chartsPlaceholderStartRgx}[\\s\\S]*?${chartsPlaceholderEndRgx}`, 'g');
        result = result.replace(chartsRegex, `${chartsPlaceholderStart} ${chartsReplacement} ${chartsPlaceholderEnd}`);
        result = reverseWords(
            reverseWords(result).replace('IntegratedChartsModule', `IntegratedChartsModule.with(${chartsModule})`)
        );
        result = reverseWords(
            reverseWords(result).replace('SparklinesModule', `SparklinesModule.with(${chartsModule})`)
        );
    } else {
        const chartsRegex = new RegExp(`${chartsPlaceholderStartRgx}[\\s\\S]*?${chartsPlaceholderEndRgx}`, 'g');
        result = result.replace(chartsRegex, `${chartsPlaceholderStart}  ${chartsPlaceholderEnd}`);
    }

    fs.writeFile(outFilePath, result, 'utf8', (err) => {
        if (err) {
            console.error('Error writing file:', err);
            return;
        }

        // Run npm run build
        exec('npm run build-app', (err, stdout, stderr) => {
            if (err) {
                console.error('Error running build:', err);
                console.log(stdout);
                console.error(stderr);
                return;
            }

            // console.log(stdout);
            // console.error(stderr);

            // Get the size of the dist file using globSync
            const files = globSync(distFilePattern);

            if (files.length === 0) {
                console.error('No files matched the pattern.');
                return;
            }

            const distFilePath = files[0];
            fs.stat(distFilePath, (err, stats) => {
                if (err) {
                    console.error('Error getting file size:', err);
                    return;
                }

                const fileSizeInBytes = stats.size;

                // Get the gzip size
                fs.readFile(distFilePath, (err, data) => {
                    if (err) {
                        console.error('Error reading file:', err);
                        return;
                    }

                    zlib.gzip(data, (err, compressedData) => {
                        if (err) {
                            console.error('Error compressing file:', err);
                            return;
                        }

                        const gzipSizeInBytes = compressedData.length;
                        console.log(`Modules: ${modules.join(', ')}`);
                        const toKb = (bytes) => (bytes / 1024).toFixed(2);
                        console.log(`File size: ${toKb(fileSizeInBytes)} kB | gzip size: ${toKb(gzipSizeInBytes)} kB`);
                    });
                });
            });
        });
    });
});
