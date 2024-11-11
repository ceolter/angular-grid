import { AllEnterpriseModules } from './moduleDefinitions';

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { globSync } = require('glob');
const zlib = require('zlib');

const distFilePattern = path.join(__dirname, 'dist/assets/agGridCommunityEnterprise*.js');
const filePath = path.join(__dirname, 'src/App.tsx');
const placeholderStartRgx = '/\\*\\* __PLACEHOLDER__START__ \\*/';
const placeholderEndRgx = '/\\*\\* __PLACEHOLDER__END__ \\*/';
const placeholderStart = '/** __PLACEHOLDER__START__ */';
const placeholderEnd = '/** __PLACEHOLDER__END__ */';

const entPlaceholderStartRgx = '/\\*\\* __ENTERPRISE_PLACEHOLDER__START__ \\*/';
const entPlaceholderEndRgx = '/\\*\\* __ENTERPRISE_PLACEHOLDER__END__ \\*/';
const entPlaceholderStart = '/** __ENTERPRISE_PLACEHOLDER__START__ */';
const entPlaceholderEnd = '/** __ENTERPRISE_PLACEHOLDER__END__ */';

// Get modules from command line arguments
const modules = process.argv.slice(2);

fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
        console.error('Error reading file:', err);
        return;
    }
    const communityModules = modules.filter((module) => !AllEnterpriseModules[module]);
    const enterpriseModules = modules.filter((module) => AllEnterpriseModules[module] > 0);

    const replacement = communityModules.join(', ');
    const regex = new RegExp(`${placeholderStartRgx}[\\s\\S]*?${placeholderEndRgx}`, 'g');
    let result = data.replace(regex, `${placeholderStart} ${replacement} ${placeholderEnd}`);

    const entReplacement = enterpriseModules.join(', ');
    const entRegex = new RegExp(`${entPlaceholderStartRgx}[\\s\\S]*?${entPlaceholderEndRgx}`, 'g');
    result = result.replace(entRegex, `${entPlaceholderStart} ${entReplacement} ${entPlaceholderEnd}`);

    fs.writeFile(filePath, result, 'utf8', (err) => {
        if (err) {
            console.error('Error writing file:', err);
            return;
        }

        // Run npm run build
        exec('npm run build', (err, stdout, stderr) => {
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
