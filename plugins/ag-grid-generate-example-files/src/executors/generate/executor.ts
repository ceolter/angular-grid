import fs from 'fs/promises';
import path from 'path';
import prettier from 'prettier';

import { readFile, readJSONFile, writeFile } from '../../executors-utils';
import { SOURCE_ENTRY_FILE_NAME } from './generator/constants';
import gridVanillaSrcParser from './generator/transformation-scripts/grid-vanilla-src-parser';
import {
    DARK_INTEGRATED_START,
    getIntegratedDarkModeCode,
    getInterfaceFileContents,
    removeModuleRegistration,
} from './generator/transformation-scripts/parser-utils';
import type { ExampleConfig, GeneratedContents, InternalFramework } from './generator/types';
import { FRAMEWORKS, TYPESCRIPT_INTERNAL_FRAMEWORKS } from './generator/types';
import {
    getBoilerPlateFiles,
    getEntryFileName,
    getIsEnterprise,
    getIsLocale,
    getMainFileName,
    getProvidedExampleFiles,
    getProvidedExampleFolder,
    getTransformTsFileExt,
} from './generator/utils/fileUtils';
import { frameworkFilesGenerator } from './generator/utils/frameworkFilesGenerator';
import { getOtherScriptFiles } from './generator/utils/getOtherScriptFiles';
import { getPackageJson } from './generator/utils/getPackageJson';
import { getStyleFiles } from './generator/utils/getStyleFiles';

export type ExecutorOptions = {
    mode: 'dev' | 'prod';
    outputPath: string;
    examplePath: string;
    inputs: string[];
    output: string;
    writeFiles: boolean;
};

export default async function (options: ExecutorOptions) {
    try {
        await generateFiles(options);

        return { success: true, terminalOutput: `Generating example [${options.examplePath}]` };
    } catch (e) {
        console.error(e);
        return { success: false };
    }
}

async function getGridOptionsType() {
    return await readJSONFile('plugins/ag-grid-generate-example-files/gridOptionsTypes/_gridOptions_Types.json');
}

async function getSourceFileList(folderPath: string): Promise<string[]> {
    const sourceFileList = await fs.readdir(folderPath);
    if (!sourceFileList.includes(SOURCE_ENTRY_FILE_NAME)) {
        throw new Error('Unable to find example entry-point at: ' + folderPath);
    }
    return sourceFileList;
}

async function getProvidedFiles(folderPath: string) {
    const frameworkProvidedExamples = {};

    for await (const internalFramework of FRAMEWORKS) {
        const files = getProvidedExampleFiles({ folderPath, internalFramework });

        if (files.length > 0) {
            const providedExampleBasePath = getProvidedExampleFolder({
                folderPath,
                internalFramework,
            });
            const providedExampleEntries = await Promise.all(
                files.map(async (fileName) => {
                    const contents = (await fs.readFile(path.join(providedExampleBasePath, fileName))).toString(
                        'utf-8'
                    );
                    return [fileName, contents];
                })
            );
            const asObj = Object.fromEntries(providedExampleEntries);
            frameworkProvidedExamples[internalFramework] = asObj;
        }
    }
    return frameworkProvidedExamples;
}

export async function generateFiles(options: ExecutorOptions) {
    const isDev = options.mode === 'dev';
    const folderPath = options.examplePath;
    const gridOptionsTypes = await getGridOptionsType();

    const sourceFileList = await getSourceFileList(folderPath);
    if (sourceFileList === undefined) {
        return { files: {} } as any;
    }

    let exampleConfig: ExampleConfig = {};
    if (sourceFileList.includes('exampleConfig.json')) {
        exampleConfig = await readJSONFile(path.join(folderPath, 'exampleConfig.json'));
    }
    const entryFilePath = path.join(folderPath, SOURCE_ENTRY_FILE_NAME);

    const [entryFile, indexHtml, styleFiles] = await Promise.all([
        readFile(entryFilePath),
        readFile(path.join(folderPath, 'index.html')),
        getStyleFiles({ folderPath, sourceFileList }),
    ]);

    const isEnterprise = getIsEnterprise({ entryFile });
    const isLocale = getIsLocale({ entryFile });
    const frameworkProvidedExamples = sourceFileList.includes('provided') ? await getProvidedFiles(folderPath) : {};

    const { bindings, typedBindings } = gridVanillaSrcParser(
        folderPath,
        entryFile,
        indexHtml,
        frameworkProvidedExamples,
        gridOptionsTypes
    );

    const isIntegratedCharts = typedBindings.imports.some((m) => m.module.includes('ag-charts'));

    let interfaceFile = undefined;
    if (sourceFileList.includes('interfaces.ts')) {
        interfaceFile = await readFile(path.join(folderPath, 'interfaces.ts'));
    }
    const interfaces = getInterfaceFileContents(typedBindings, interfaceFile);
    let interfaceContents = undefined;
    if (interfaces) {
        interfaceContents = {
            'interfaces.ts': interfaces,
        };
    }

    for (const internalFramework of FRAMEWORKS) {
        if (exampleConfig.supportedFrameworks && !exampleConfig.supportedFrameworks.includes(internalFramework)) {
            const result = { excluded: true, ...exampleConfig } as any;
            writeContents(options, internalFramework, result);
            continue;
        }

        const getFrameworkFiles = frameworkFilesGenerator[internalFramework];
        if (!getFrameworkFiles) {
            throw new Error(`No entry file config generator for '${internalFramework}'`);
        }

        const boilerPlateFiles = await getBoilerPlateFiles(isDev, internalFramework);
        const entryFileName = getEntryFileName(internalFramework)!;
        const mainFileName = getMainFileName(internalFramework)!;
        const provideFrameworkFiles = frameworkProvidedExamples[internalFramework];

        const packageJson = getPackageJson({
            isLocale,
            internalFramework,
            isIntegratedCharts,
        });
        const frameworkExampleConfig = {
            ...exampleConfig,
            ...(provideFrameworkFiles ? provideFrameworkFiles['exampleConfig.json'] : {}),
        };
        const [otherScriptFiles, componentScriptFiles] = await getOtherScriptFiles({
            folderPath,
            sourceFileList,
            transformTsFileExt: getTransformTsFileExt(internalFramework),
            internalFramework,
        });

        let files = {};
        let scriptFiles = [];
        const mergedStyleFiles = { ...styleFiles };
        if (provideFrameworkFiles === undefined) {
            const result = await getFrameworkFiles({
                entryFile,
                indexHtml,
                isEnterprise,
                bindings,
                typedBindings,
                componentScriptFiles,
                otherScriptFiles,
                styleFiles,
                ignoreDarkMode: false,
                isDev,
                exampleConfig: frameworkExampleConfig,
            });
            files = result.files;
            scriptFiles = result.scriptFiles;
        } else {
            if (internalFramework === 'vanilla') {
                // NOTE: Vanilla provided examples, we need to include the entryfile
                scriptFiles = [entryFileName];
            }

            for (const fileName of Object.keys(provideFrameworkFiles)) {
                if (fileName.endsWith('.css')) {
                    mergedStyleFiles[fileName] = provideFrameworkFiles[fileName];
                } else {
                    const fileContent = provideFrameworkFiles[fileName];
                    if (fileContent) {
                        provideFrameworkFiles[fileName] = await convertModulesToPackages(
                            fileContent,
                            isDev,
                            internalFramework
                        );
                    }
                }

                if (internalFramework === 'reactFunctional' || internalFramework === 'reactFunctionalTs') {
                    // add use client to the provided files if they contain AgGridReact
                    const useClientCode = "'use client';\n";
                    const fileContent = provideFrameworkFiles[fileName];
                    if (fileContent.includes('AgGridReact') && !fileContent.includes('use client')) {
                        provideFrameworkFiles[fileName] = useClientCode + fileContent;
                    }
                }

                // Add Dark Mode code to the provided files if they are an integrated example
                if (isIntegratedCharts && fileName === mainFileName) {
                    const code = getIntegratedDarkModeCode(
                        folderPath,
                        TYPESCRIPT_INTERNAL_FRAMEWORKS.includes(internalFramework)
                    );
                    const fileContent = provideFrameworkFiles[fileName];
                    const providedPlaceholder = '/** PROVIDED EXAMPLE DARK INTEGRATED **/';
                    if (
                        !fileContent.includes(providedPlaceholder) &&
                        !fileContent.includes(DARK_INTEGRATED_START) // might have already been replaced
                    ) {
                        throw new Error(
                            `Provided example ${folderPath}/provided/modules/${internalFramework}/${fileName} does not contain the expected comment: ${providedPlaceholder} in gridReady code for an example that includes integrated charts`
                        );
                    }
                    provideFrameworkFiles[fileName] = provideFrameworkFiles[fileName].replace(
                        providedPlaceholder,
                        code
                    );
                }
            }
        }

        let styleFilesKeys = [];
        const mergedFiles = { ...mergedStyleFiles, ...files, ...provideFrameworkFiles, ...interfaceContents };
        if ((['typescript', 'vanilla'] as InternalFramework[]).includes(internalFramework)) {
            styleFilesKeys = Object.keys(mergedStyleFiles);
        }
        // Replace files with provided examples
        const result: GeneratedContents = {
            isEnterprise,
            isLocale,
            isIntegratedCharts,
            entryFileName,
            mainFileName,
            scriptFiles: scriptFiles!,
            styleFiles: styleFilesKeys,
            files: mergedFiles,
            boilerPlateFiles,
            packageJson,
            ...frameworkExampleConfig,
        };

        await writeContents(options, internalFramework, result);
    }
}

async function convertModulesToPackages(fileContent: any, isDev: boolean, internalFramework: InternalFramework) {
    const isEnterprise = fileContent.includes('-enterprise');

    if (internalFramework === 'vanilla') {
        fileContent = removeModuleRegistration(fileContent);
    }

    if (isEnterprise) {
        const communityImportRegex = /import ['"]ag-grid-community/;
        if (communityImportRegex.test(fileContent)) {
            fileContent = fileContent.replace(communityImportRegex, `import 'ag-grid-enterprise';\n$&`);
        } else {
            fileContent = `import 'ag-grid-enterprise';\n${fileContent}`;
        }
    }

    if (!isDev) {
        const parser = TYPESCRIPT_INTERNAL_FRAMEWORKS.includes(internalFramework) ? 'typescript' : 'babel';
        fileContent = await prettier.format(fileContent, { parser });
    }
    return fileContent;
}

async function writeContents(
    options: ExecutorOptions,
    internalFramework: InternalFramework,
    result: GeneratedContents
) {
    if (options.writeFiles) {
        for (const file in result.files) {
            await writeFile(path.join(options.outputPath, internalFramework, file), result.files[file]);
        }
    }
    const outputPath = path.join(options.outputPath, internalFramework, 'contents.json');
    await writeFile(outputPath, JSON.stringify(result));

    for (const name in result.files) {
        if (typeof result.files[name] !== 'string') {
            throw new Error(`${outputPath}: non-string file content`);
        }
    }
}
// node --inspect-brk ./plugins/ag-grid-generate-example-files/dist/src/executors/generate/executor.js
// console.log('should generate')
// generateFiles({
//     examplePath: 'documentation/ag-grid-docs/src/content/docs/cell-editing-full-row/_examples/full-row-editing',
//     mode: 'dev',
//     inputs: [],
//     output: '',
//     outputPath: 'dist/generated-examples/ag-grid-docs/docs/cell-editing-full-row/_examples/full-row-editing',
//     writeFiles: true,
// }).then(() => console.log('done'));
