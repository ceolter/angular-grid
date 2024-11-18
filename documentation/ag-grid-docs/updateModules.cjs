const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Function to find index.md files containing the text "modules"
function findIndexMDFilesContainingModules(directory) {
    fs.readdir(directory, (err, files) => {
        if (err) {
            console.error(`Error reading directory: ${err}`);
            return;
        }
        files.forEach((file) => {
            const filePath = path.join(directory, file);
            if (fs.lstatSync(filePath).isFile()) {
                fs.readFile(filePath, 'utf8', (err, data) => {
                    if (err) {
                        console.error(`Error reading file: ${err}`);
                        return;
                    }

                    if (data.includes('gridExampleRunner')) {
                        const subFolderPath = path.join(directory, '_examples');
                        findFilesWithSameNameInSubfolder(filePath, data, subFolderPath);
                    }
                });
            } else {
                if (filePath.includes('_gen')) return;
                findIndexMDFilesContainingModules(filePath);
            }
        });
    });
}

const moduleMapping = [
    {
        title: 'Grid Core',
        module: '@ag-grid-community/core',
        exported: 'Core Grid Components: GridOptions, ColDef etc',
    },
    {
        title: 'Grid Styles',
        module: '@ag-grid-community/theming',
        exported: 'Grid Themes',
    },
    {
        title: 'Grid Styles',
        module: '@ag-grid-community/styles',
        exported: 'Core Grid Styles and Themes',
    },
    {
        title: 'Client Side Row Model',
        shortname: 'clientside',
        module: '@ag-grid-community/client-side-row-model',
        exported: 'ClientSideRowModelModule',
    },
    {
        title: 'Infinite Row Model',
        shortname: 'infinite',
        module: '@ag-grid-community/infinite-row-model',
        exported: 'InfiniteRowModelModule',
    },
    {
        title: 'CSV Export',
        shortname: 'csv',
        module: '@ag-grid-community/csv-export',
        exported: 'CsvExportModule',
    },
    {
        title: 'Angular Support',
        module: '@ag-grid-community/angular',
        framework: true,
        exported: 'Angular Support',
        angular: true,
    },
    {
        title: 'React Support',
        module: '@ag-grid-community/react',
        framework: true,
        exported: 'React Support',
        react: true,
    },
    {
        title: 'Vue Support',
        module: '@ag-grid-community/vue3',
        framework: true,
        exported: 'Vue Support',
        vue: true,
    },
    {
        title: 'Enterprise Core<enterprise-icon></enterprise-icon>',
        module: '@ag-grid-enterprise/core',
        enterprise: true,
        exported: 'LicenseManager',
    },
    {
        title: 'Integrated Community Charts<enterprise-icon></enterprise-icon>',
        shortname: 'charts',
        module: '@ag-grid-enterprise/charts',
        enterprise: true,
        exported: 'IntegratedChartsModule',
    },
    {
        title: 'Integrated Enterprise Charts<enterprise-icon></enterprise-icon>',
        shortname: 'charts-enterprise',
        module: '@ag-grid-enterprise/charts-enterprise',
        enterprise: true,
        exported: 'IntegratedChartsModule',
    },
    {
        title: 'Sparklines<enterprise-icon></enterprise-icon>',
        shortname: 'sparklines',
        module: '@ag-grid-enterprise/sparklines',
        enterprise: true,
        exported: 'SparklinesModule',
    },
    {
        title: 'Clipboard<enterprise-icon></enterprise-icon>',
        shortname: 'clipboard',
        module: '@ag-grid-enterprise/clipboard',
        enterprise: true,
        exported: 'ClipboardModule',
    },
    {
        title: 'Column Tool Panel & Column Menu Panel<enterprise-icon></enterprise-icon>',
        shortname: 'columnpanel',
        module: '@ag-grid-enterprise/column-tool-panel',
        enterprise: true,
        exported: 'ColumnsToolPanelModule',
    },
    {
        title: 'Excel Export<enterprise-icon></enterprise-icon>',
        shortname: 'excel',
        module: '@ag-grid-enterprise/excel-export',
        enterprise: true,
        exported: 'ExcelExportModule',
    },
    {
        title: 'Filter Tool Panel<enterprise-icon></enterprise-icon>',
        shortname: 'filterpanel',
        module: '@ag-grid-enterprise/filter-tool-panel',
        enterprise: true,
        exported: 'FiltersToolPanelModule',
    },
    {
        title: 'Master Detail<enterprise-icon></enterprise-icon>',
        shortname: 'masterdetail',
        module: '@ag-grid-enterprise/master-detail',
        enterprise: true,
        exported: 'MasterDetailModule',
    },
    {
        title: 'Context & Column Menu<enterprise-icon></enterprise-icon>',
        shortname: 'menu',
        module: '@ag-grid-enterprise/menu',
        enterprise: true,
        exported: 'MenuModule',
    },
    {
        title: 'Range Selection<enterprise-icon></enterprise-icon>',
        shortname: 'range',
        module: '@ag-grid-enterprise/range-selection',
        enterprise: true,
        exported: 'RangeSelectionModule',
    },
    {
        title: 'Rich Select<enterprise-icon></enterprise-icon>',
        shortname: 'richselect',
        module: '@ag-grid-enterprise/rich-select',
        enterprise: true,
        exported: 'RichSelectModule',
    },
    {
        title: 'Row Grouping, Pivoting & Tree Data<enterprise-icon></enterprise-icon>',
        shortname: 'rowgrouping',
        module: '@ag-grid-enterprise/row-grouping',
        enterprise: true,
        exported: 'RowGroupingModule',
    },
    {
        title: 'Server Side Row Model<enterprise-icon></enterprise-icon>',
        shortname: 'serverside',
        module: '@ag-grid-enterprise/server-side-row-model',
        enterprise: true,
        exported: 'ServerSideRowModelModule',
    },
    {
        title: 'Set Filter<enterprise-icon></enterprise-icon>',
        shortname: 'setfilter',
        module: '@ag-grid-enterprise/set-filter',
        enterprise: true,
        exported: 'SetFilterModule',
    },
    {
        title: 'Multi Filter<enterprise-icon></enterprise-icon>',
        shortname: 'multifilter',
        module: '@ag-grid-enterprise/multi-filter',
        enterprise: true,
        exported: 'MultiFilterModule',
    },
    {
        title: 'Advanced Filter<enterprise-icon></enterprise-icon>',
        shortname: 'advancedfilter',
        module: '@ag-grid-enterprise/advanced-filter',
        enterprise: true,
        exported: 'AdvancedFilterModule',
    },
    {
        title: 'Side Bar<enterprise-icon></enterprise-icon>',
        shortname: 'sidebar',
        module: '@ag-grid-enterprise/side-bar',
        enterprise: true,
        exported: 'SideBarModule',
    },
    {
        title: 'Status Bar<enterprise-icon></enterprise-icon>',
        shortname: 'statusbar',
        module: '@ag-grid-enterprise/status-bar',
        enterprise: true,
        exported: 'StatusBarModule',
    },
    {
        title: 'Viewport Row Model<enterprise-icon></enterprise-icon>',
        shortname: 'viewport',
        module: '@ag-grid-enterprise/viewport-row-model',
        enterprise: true,
        exported: 'ViewportRowModelModule',
    },
];

function modulesProcessor(modules) {
    const moduleImports = [];
    const suppliedModules = [];

    const requiredModules = [];
    modules.forEach((module) => {
        let found = false;
        moduleMapping.forEach((moduleConfig) => {
            if (moduleConfig.shortname && moduleConfig.shortname == module) {
                requiredModules.push(moduleConfig);
                found = true;
            }
        });
        if (!found) {
            console.error(`Could not find module ${module} in modules.json`);
        }
    });

    requiredModules.forEach((requiredModule) => {
        moduleImports.push(`import { ${requiredModule.exported} } from '${requiredModule.module}';`);
        suppliedModules.push(requiredModule.exported);
    });

    return { moduleImports: moduleImports.sort(), suppliedModules: suppliedModules.sort() };
}

// Function to find the last line containing "import" and append "New Text" after it
function appendTextAfterLastImport(filePath, textToAppend) {
    const readStream = fs.createReadStream(filePath);
    const rl = readline.createInterface({
        input: readStream,
        crlfDelay: Infinity,
    });

    let lastImportLine = -1;
    const lines = [];
    let lineNumber = 0;

    rl.on('line', (line) => {
        lineNumber++;
        if (line.includes('from')) {
            lastImportLine = lineNumber;
        }
        lines.push(line);
    });

    rl.on('close', () => {
        if (lastImportLine !== -1) {
            lines.splice(lastImportLine + 1, 0, textToAppend);
            const modifiedContent = lines.join('\n');
            fs.writeFileSync(filePath, modifiedContent);
        } else {
            console.log('No line containing "import" found.');
        }
    });
}

// Function to find files with the same name within a subfolder
function findFilesWithSameNameInSubfolder(filePath, docFile, subFolderPath) {
    const nameOnlyRegex = /gridExampleRunner.*name=['"](.*?)['"]/g;
    //const regex = /gridExampleRunner.*name=['"](.*?)['"].*"modules".*?\[(.*?)\]/g
    //const moduleMatches = [...docFile.matchAll(regex)];
    const nameOnlyMatches = [...docFile.matchAll(nameOnlyRegex)];

    const matches = nameOnlyMatches; // moduleMatches.length > 0 ? moduleMatches : nameOnlyMatches;
    for (const match of matches) {
        const exampleFolder = match[1];
        const exampleModules = match[2] ?? "'clientside'";
        const examplePath = path.join(subFolderPath, exampleFolder, 'main.ts');
        // write modules into main.ts
        fs.readFile(examplePath, 'utf8', (err, data) => {
            if (err) {
                console.error(`Error reading file: ${err}`);
                return;
            }

            if (data.includes('ModuleRegistry.registerModules') || !data.includes('import')) return;

            const modArray = exampleModules
                .replace(/'/g, '')
                .replace(/"/g, '')
                .split(',')
                .map((m) => m.trim());
            const { moduleImports, suppliedModules } = modulesProcessor(modArray);
            moduleImports.push('import { ModuleRegistry } from "@ag-grid-community/core";');

            const newModules = `\nModuleRegistry.registerModules([${suppliedModules.join(', ')}]);\n`;
            moduleImports.push(newModules);
            appendTextAfterLastImport(examplePath, moduleImports.join('\n'));
        });
    }
}

// Example usage:
const directoryToSearch = './src/content/docs/'; // Adjust this to the directory you want to start the search from
findIndexMDFilesContainingModules(directoryToSearch);
